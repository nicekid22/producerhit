import Constants from "expo-constants";
import { Platform } from "react-native";
import { devWarn } from "@/lib/devLog";
import {
  IAP_PLAN_ORDER,
  IAP_PRODUCTS,
  IAP_SUBSCRIPTION_SKUS,
  iapPlanFromSku,
  type IapPaidPlan,
} from "@/lib/iapCatalog";
import { supabase } from "./supabase";

let IAP: typeof import("react-native-iap") | null = null;

export type IapPackageInfo = {
  id: string;
  plan: IapPaidPlan;
  title: string;
  price: string;
  description: string;
  introOfferLabel: string | null;
};

type SubscriptionState = {
  isPremium: boolean;
  packages: IapPackageInfo[];
  iapReady: boolean;
  _initialized: boolean;
};

type PurchaseWaiter = {
  productId: string;
  resolve: () => void;
  reject: (error: Error) => void;
};

type PackagesListener = () => void;

function fallbackPackages(): IapPackageInfo[] {
  return IAP_PLAN_ORDER.map((plan) => ({
    id: IAP_PRODUCTS[plan].sku,
    plan,
    title: plan.charAt(0).toUpperCase() + plan.slice(1),
    price: "",
    description: "",
    introOfferLabel: null,
  }));
}

function isUserCancelled(error: unknown): boolean {
  const code = (error as { code?: string })?.code ?? "";
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return (
    code === "E_USER_CANCELLED" ||
    code === "user-cancelled" ||
    lower.includes("cancelled") ||
    lower.includes("canceled")
  );
}

function readString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** StoreKit introductory offer text when configured in App Store Connect. */
export function extractIntroOfferLabel(product: unknown): string | null {
  if (!product || typeof product !== "object") return null;
  const p = product as Record<string, unknown>;

  const localizedIntro = readString(p, "localizedIntroductoryPrice");
  if (localizedIntro) return localizedIntro;

  const paymentMode = readString(p, "introductoryPricePaymentModeIOS");
  const introPrice = readString(p, "introductoryPriceAsAmountIOS");
  const periods = p.introductoryPriceNumberOfPeriodsIOS;
  const periodUnit = readString(p, "introductoryPriceSubscriptionPeriodIOS");

  if (paymentMode?.toLowerCase().includes("free") || paymentMode === "FREETRIAL") {
    if (typeof periods === "number" && periodUnit) {
      return `${periods} ${periodUnit} free trial`;
    }
    return "Free trial available";
  }

  if (introPrice) {
    if (typeof periods === "number" && periodUnit) {
      return `${introPrice} for ${periods} ${periodUnit}`;
    }
    return introPrice;
  }

  return null;
}

function mapStoreProduct(product: { id: string; title?: string; description?: string; displayPrice?: string } & Record<string, unknown>): IapPackageInfo {
  const plan = iapPlanFromSku(product.id) ?? "pro";
  return {
    id: product.id,
    plan,
    title: product.title ?? plan,
    price: typeof product.displayPrice === "string" ? product.displayPrice : "",
    description: product.description ?? "",
    introOfferLabel: extractIntroOfferLabel(product),
  };
}

export class IapNotAvailableError extends Error {
  constructor() {
    super("IAP_NOT_AVAILABLE");
    this.name = "IapNotAvailableError";
  }
}

export const SubscriptionService = {
  state: {
    isPremium: false,
    packages: fallbackPackages(),
    iapReady: false,
    _initialized: false,
  } as SubscriptionState,

  _purchaseSub: { remove: () => {} } as { remove: () => void },
  _errorSub: { remove: () => {} } as { remove: () => void },
  _purchaseWaiter: null as PurchaseWaiter | null,
  _packageListeners: new Set<PackagesListener>(),

  subscribePackages(listener: PackagesListener): () => void {
    this._packageListeners.add(listener);
    return () => {
      this._packageListeners.delete(listener);
    };
  },

  _notifyPackages() {
    for (const listener of this._packageListeners) {
      listener();
    }
  },

  async init(): Promise<boolean> {
    if (this.state._initialized) return this.state.isPremium;

    if (Platform.OS !== "ios") {
      this.state._initialized = true;
      return false;
    }

    const isExpoGo = Constants.appOwnership === "expo";
    if (isExpoGo) {
      this.state._initialized = true;
      return this.state.isPremium;
    }

    try {
      const iap = require("react-native-iap") as typeof import("react-native-iap");
      IAP = iap;
      await iap.initConnection();
      this.state.iapReady = true;
      this._attachListeners();
      await this.refreshProducts();
    } catch (e) {
      devWarn("[SubscriptionService] IAP init failed", e);
    }

    this.state._initialized = true;
    return this.state.isPremium;
  },

  _attachListeners() {
    if (!IAP) return;
    const iap = IAP;
    this._purchaseSub.remove();
    this._errorSub.remove();

    this._purchaseSub = iap.purchaseUpdatedListener(async (purchase) => {
      try {
        const originalTx =
          "originalTransactionIdentifierIOS" in purchase
            ? purchase.originalTransactionIdentifierIOS ?? undefined
            : undefined;
        await this.syncPurchaseToBackend({
          productId: purchase.productId,
          transactionId: purchase.transactionId ?? undefined,
          originalTransactionIdentifierIOS: originalTx,
        });
        await iap.finishTransaction({ purchase, isConsumable: false });
        this.state.isPremium = true;
        if (this._purchaseWaiter && this._purchaseWaiter.productId === purchase.productId) {
          this._purchaseWaiter.resolve();
          this._purchaseWaiter = null;
        }
      } catch (e) {
        devWarn("[SubscriptionService] purchase sync failed", e);
        if (this._purchaseWaiter) {
          this._purchaseWaiter.reject(e instanceof Error ? e : new Error(String(e)));
          this._purchaseWaiter = null;
        }
      }
    });

    this._errorSub = iap.purchaseErrorListener((err) => {
      devWarn("[SubscriptionService] purchase error", err);
      if (!this._purchaseWaiter) return;
      if (isUserCancelled(err)) {
        this._purchaseWaiter.reject(new Error("IAP_USER_CANCELLED"));
      } else {
        const message =
          err && typeof err === "object" && "message" in err && typeof err.message === "string"
            ? err.message
            : "Purchase failed";
        this._purchaseWaiter.reject(new Error(message));
      }
      this._purchaseWaiter = null;
    });
  },

  async refreshProducts() {
    if (!IAP) return;
    try {
      const products = await IAP.fetchProducts({ skus: IAP_SUBSCRIPTION_SKUS, type: "subs" });
      if (!products?.length) return;

      const bySku = new Map<string, IapPackageInfo>();
      for (const raw of products) {
        const mapped = mapStoreProduct(raw as unknown as { id: string } & Record<string, unknown>);
        bySku.set(mapped.id, mapped);
      }

      this.state.packages = IAP_PLAN_ORDER.map((plan) => {
        const sku = IAP_PRODUCTS[plan].sku;
        return bySku.get(sku) ?? {
          id: sku,
          plan,
          title: plan,
          price: "",
          description: "",
          introOfferLabel: null,
        };
      });
      this._notifyPackages();
    } catch (e) {
      devWarn("[SubscriptionService] fetchProducts failed", e);
    }
  },

  packageForPlan(plan: IapPaidPlan): IapPackageInfo | undefined {
    return this.state.packages.find((p) => p.plan === plan);
  },

  async purchase(productId: string = IAP_PRODUCTS.studio.sku): Promise<void> {
    if (!IAP || !this.state.iapReady) {
      throw new IapNotAvailableError();
    }

    if (this._purchaseWaiter) {
      throw new Error("IAP_PURCHASE_IN_PROGRESS");
    }

    return new Promise<void>((resolve, reject) => {
      this._purchaseWaiter = { productId, resolve, reject };
      void IAP!.requestPurchase({
        request: {
          apple: {
            sku: productId,
            andDangerouslyFinishTransactionAutomatically: false,
          },
        },
        type: "subs",
      }).catch((e: unknown) => {
        if (this._purchaseWaiter) {
          if (isUserCancelled(e)) {
            this._purchaseWaiter.reject(new Error("IAP_USER_CANCELLED"));
          } else {
            this._purchaseWaiter.reject(e instanceof Error ? e : new Error(String(e)));
          }
          this._purchaseWaiter = null;
        }
      });
    });
  },

  cancelPendingPurchase() {
    if (this._purchaseWaiter) {
      this._purchaseWaiter.reject(new Error("IAP_USER_CANCELLED"));
      this._purchaseWaiter = null;
    }
  },

  async restore() {
    if (!IAP || !this.state.iapReady) {
      throw new IapNotAvailableError();
    }
    await IAP.restorePurchases();
    const { data, error } = await supabase.functions.invoke("apple-iap-sync", { body: { action: "restore" } });
    if (error) throw error;
    const plan = (data as { plan?: string })?.plan;
    if (plan === "pro" || plan === "studio" || plan === "plus") {
      this.state.isPremium = true;
    }
  },

  async syncPurchaseToBackend(purchase: {
    productId?: string;
    transactionId?: string;
    originalTransactionIdentifierIOS?: string;
  }) {
    const plan = iapPlanFromSku(purchase.productId);
    const { error } = await supabase.functions.invoke("apple-iap-sync", {
      body: {
        action: "purchase",
        productId: purchase.productId,
        plan,
        transactionId: purchase.transactionId,
        originalTransactionId: purchase.originalTransactionIdentifierIOS,
      },
    });
    if (error) throw error;
  },

  async endConnection() {
    this.cancelPendingPurchase();
    this._purchaseSub.remove();
    this._errorSub.remove();
    if (IAP) await IAP.endConnection();
  },
};

/** @deprecated Use IAP_PRODUCTS.pro.sku */
export const PRO_PRODUCT_ID = IAP_PRODUCTS.pro.sku;
