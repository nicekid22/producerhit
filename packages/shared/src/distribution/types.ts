export type DistributionReleaseType = "single" | "ep" | "album";

export type DistributionReleaseStatus =
  | "draft"
  | "preparing"
  | "submitted"
  | "in_review"
  | "live"
  | "rejected"
  | "failed"
  | "exported";

export type DistributionOutletStatus =
  | "pending"
  | "processing"
  | "live"
  | "rejected"
  | "takedown";

export type DistributionReleaseInput = {
  loopId: string;
  title: string;
  artistName: string;
  featuring?: string[];
  genreLabelgridId?: string;
  genreName?: string;
  languageCode?: string;
  explicit?: boolean;
  releaseDate?: string;
  acceptTerms?: boolean;
};

export type DistributionReleaseRow = {
  id: string;
  userId: string;
  loopId: string;
  releaseType: DistributionReleaseType;
  title: string;
  artistName: string;
  featuring: string[];
  genreLabelgridId: string | null;
  genreName: string | null;
  languageCode: string;
  explicit: boolean;
  releaseDate: string | null;
  labelgridReleaseId: string | null;
  labelgridTrackId: string | null;
  isrc: string | null;
  upc: string | null;
  status: DistributionReleaseStatus;
  statusDetail: Record<string, unknown>;
  submittedAt: string | null;
  liveAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DistributionOutletRow = {
  id: string;
  releaseId: string;
  outletSlug: string;
  outletName: string;
  status: DistributionOutletStatus;
  externalUrl: string | null;
  updatedAt: string;
};

export type DistributionUsageSummary = {
  plan: string;
  used: number;
  quota: number;
  monthKey: string;
};

export const DISTRIBUTION_OUTLET_LABELS: Record<string, string> = {
  spotify: "Spotify",
  "apple-music": "Apple Music",
  deezer: "Deezer",
  "youtube-music": "YouTube Music",
  "tiktok-music": "TikTok Music",
};
