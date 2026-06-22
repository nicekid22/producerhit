import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";

const PRO_PRODUCT_ID =
  process.env.EXPO_PUBLIC_IAP_PRO_MONTHLY?.trim() || "com.producerhit.app.pro.monthly";

const SUBSCRIPTION_IDS = [PRO_PRODUCT_ID];

let IAP: typeof import("react-native-iap") | null = null;

type PackageInfo = {
  id: string;
  title: string;
  price: string;
  description: string;
};

type SubscriptionState = {
  isPremium: boolean;
  packages: PackageInfo[];
  iapReady: boolean;
  _initialized: boolean;
};

const FALLBACK_PACKAGES: PackageInfo[] = [
  {
    id: PRO_PRODUCT_ID,
    title: "Pro",
    price: "—",
    description: "75 generations / month · commercial rights",
  },
];

export const SubscriptionService = {
  state: {
    isPremium: false,
    packages: [...FALLBACK_PACKAGES],
    iapReady: false,
    _initialized: false,
  } as SubscriptionState,

  _purchaseSub: { remove: () => {} } as { remove: () => void },
  _errorSub: { remove: () => {} } as { remove: () => void },

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
      console.warn("[SubscriptionService] IAP init failed", e);
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
      } catch (e) {
        console.warn("[SubscriptionService] purchase sync failed", e);
      }
    });

    this._errorSub = iap.purchaseErrorListener((err) => {
      console.warn("[SubscriptionService] purchase error", err);
    });
  },

  async refreshProducts() {
    if (!IAP) return;
    try {
      const products = await IAP.fetchProducts({ skus: SUBSCRIPTION_IDS, type: "subs" });
      if (products?.length) {
        this.state.packages = products.map((p) => ({
          id: p.id,
          title: p.title ?? "Pro",
          price: "displayPrice" in p && p.displayPrice ? p.displayPrice : "—",
          description: p.description ?? "ProducerHit Pro",
        }));
      }
    } catch (e) {
      console.warn("[SubscriptionService] fetchProducts failed", e);
    }
  },

  async purchase(productId: string = PRO_PRODUCT_ID) {
    if (!IAP || !this.state.iapReady) {
      throw new Error("In-app purchases require a development build (not Expo Go)");
    }
    await IAP.requestPurchase({
      request: {
        apple: {
          sku: productId,
          andDangerouslyFinishTransactionAutomatically: false,
        },
      },
      type: "subs",
    });
  },

  async restore() {
    if (!IAP || !this.state.iapReady) {
      throw new Error("Restore requires a development build");
    }
    await IAP.restorePurchases();
    const { data, error } = await supabase.functions.invoke("apple-iap-sync", { body: { action: "restore" } });
    if (error) throw error;
    const plan = (data as { plan?: string })?.plan;
    if (plan === "pro" || plan === "studio" || plan === "plus") {
      this.state.isPremium = true;
    }
  },

  async syncPurchaseToBackend(purchase: { productId?: string; transactionId?: string; originalTransactionIdentifierIOS?: string }) {
    const { error } = await supabase.functions.invoke("apple-iap-sync", {
      body: {
        action: "purchase",
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        originalTransactionId: purchase.originalTransactionIdentifierIOS,
      },
    });
    if (error) throw error;
  },

  async endConnection() {
    this._purchaseSub.remove();
    this._errorSub.remove();
    if (IAP) await IAP.endConnection();
  },
};

export { PRO_PRODUCT_ID };
