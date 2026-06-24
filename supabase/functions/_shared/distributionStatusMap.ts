export function mapLabelGridStatusToLocal(lgStatus: string | undefined): string {
  const s = (lgStatus ?? "").toLowerCase();
  if (s.includes("live") || s.includes("published") || s.includes("delivered")) return "live";
  if (s.includes("reject") || s.includes("failed")) return "rejected";
  if (s.includes("review") || s.includes("pending") || s.includes("processing")) return "in_review";
  if (s.includes("submit")) return "submitted";
  return "in_review";
}
