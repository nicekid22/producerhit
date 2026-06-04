import type { AceMeta } from "@/lib/audioApi";

export type AceDualBatchSlotResult = {
  audioUrl: string;
  meta: AceMeta | null;
  seed?: number;
};

export type AceDualBatchResponse = {
  results: AceDualBatchSlotResult[];
  /** false si l’API n’a renvoyé qu’un seul audio malgré batch_size=2 */
  partial: boolean;
};
