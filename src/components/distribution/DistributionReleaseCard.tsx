import { DISTRIBUTION_OUTLET_LABELS, type DistributionReleaseStatus } from "@producerhit/shared";
import { ExternalLink, Music2 } from "lucide-react";
import { CoverMedia } from "@/components/CoverMedia";
import { Badge } from "@/components/ui/Badge";
import type { DistributionReleaseWithOutlets } from "@/lib/distributionApi";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<DistributionReleaseStatus, string> = {
  draft: "Brouillon",
  preparing: "Préparation",
  submitted: "Soumis",
  in_review: "En review",
  live: "En ligne",
  rejected: "Rejeté",
  failed: "Échec",
  exported: "Pack exporté",
};

const STATUS_VARIANT: Record<DistributionReleaseStatus, "default" | "muted" | "accent"> = {
  draft: "muted",
  preparing: "muted",
  submitted: "default",
  in_review: "accent",
  live: "accent",
  rejected: "muted",
  failed: "muted",
  exported: "accent",
};

function outletLabel(slug: string, name: string): string {
  return DISTRIBUTION_OUTLET_LABELS[slug] ?? name;
}

export function DistributionReleaseCard({
  release,
}: {
  release: DistributionReleaseWithOutlets;
}) {
  const coverLoop = {
    id: release.loopId,
    coverUrl: release.coverUrl,
    name: release.title,
  };

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
          {release.coverUrl ? (
            <CoverMedia loop={coverLoop as never} coverUrl={release.coverUrl} coverKey={release.loopId} imageClassName="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/30">
              <Music2 className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white">{release.title}</h3>
            <Badge variant={STATUS_VARIANT[release.status]}>{STATUS_LABELS[release.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-white/55">{release.artistName}</p>
          <p className="mt-1 text-xs text-white/40">
            {release.genreName ?? "—"}
            {release.isrc ? ` · ISRC ${release.isrc}` : ""}
            {release.submittedAt ? ` · ${new Date(release.submittedAt).toLocaleDateString()}` : ""}
          </p>
        </div>
      </div>

      {release.status === "exported" ? (
        <p className="mt-3 text-xs text-white/50">
          Pack ZIP téléchargé — upload manuel sur ton distributeur (DistroKid, TuneCore, etc.)
        </p>
      ) : null}

      {release.outlets.length > 0 && release.status !== "exported" ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {release.outlets.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-xs"
            >
              <span className="text-white/80">{outletLabel(o.outletSlug, o.outletName)}</span>
              <span
                className={cn(
                  "font-medium capitalize",
                  o.status === "live" && "text-emerald-300",
                  o.status === "rejected" && "text-red-300",
                  o.status !== "live" && o.status !== "rejected" && "text-white/50",
                )}
              >
                {o.status}
              </span>
              {o.externalUrl ? (
                <a href={o.externalUrl} target="_blank" rel="noreferrer" className="ml-2 text-white/50 hover:text-white">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {release.status === "rejected" && release.statusDetail ? (
        <pre className="mt-3 max-h-28 overflow-auto rounded-xl bg-red-500/10 p-3 text-xs text-red-100/90">
          {JSON.stringify(release.statusDetail, null, 2)}
        </pre>
      ) : null}
    </article>
  );
}