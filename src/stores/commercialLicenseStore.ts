import { create } from "zustand";

export type CommercialLicenseContext = {
  loopId: string;
  trackTitle: string;
  createdAt?: string | null;
  exportKind: "beat" | "stems";
  source: string;
};

type CommercialLicenseStore = {
  open: boolean;
  ctx: CommercialLicenseContext | null;
  openLicense: (ctx: CommercialLicenseContext) => void;
  closeLicense: () => void;
};

export const useCommercialLicenseStore = create<CommercialLicenseStore>((set) => ({
  open: false,
  ctx: null,
  openLicense: (ctx) => set({ open: true, ctx }),
  closeLicense: () => set({ open: false, ctx: null }),
}));
