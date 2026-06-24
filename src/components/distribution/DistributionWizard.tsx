import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, GraduationCap, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { suggestDistributionGenre } from "@producerhit/shared";
import type { Loop } from "@/types/loop";
import { Button } from "@/components/ui/Button";
import { acceptDistributionTerms, recordDistributionPackExport } from "@/lib/distributionApi";
import { downloadDistributionPackZip } from "@/lib/distributionPack";
import { formatLegalHolderName } from "@/lib/commercialLicenseDocument";
import type { UserProfileRow } from "@/lib/profileBootstrap";
import { canDistribute } from "@/lib/planEntitlements";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { buildDistributionStudioCopy } from "@/i18n/distributionStudioCatalog";
import {
  DistributionCoverStudio,
  isOfficialPollinationsCoverApproved,
} from "@/components/distribution/DistributionCoverStudio";
import { CoverMedia } from "@/components/CoverMedia";
import {
  DistributionStudioShell,
  type DistributionStudioStep,
} from "@/components/distribution/DistributionStudioShell";

export function DistributionWizard({
  open,
  loop,
  profile,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  loop: Loop | null;
  profile: Pick<UserProfileRow, "legal_first_name" | "legal_last_name" | "username" | "plan"> | null;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const copy = useMemo(() => buildDistributionStudioCopy(locale), [locale]);
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<DistributionStudioStep>(1);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [featuring, setFeaturing] = useState("");
  const [genreName, setGenreName] = useState("");
  const [languageCode, setLanguageCode] = useState("en");
  const [explicit, setExplicit] = useState(false);
  const [releaseDate, setReleaseDate] = useState("");
  const [acceptRights, setAcceptRights] = useState(false);
  const [acceptAi, setAcceptAi] = useState(false);
  const [loopSnapshot, setLoopSnapshot] = useState<Loop | null>(null);
  const [coverApproved, setCoverApproved] = useState(false);

  const defaultArtist = useMemo(() => {
    return formatLegalHolderName(profile) ?? profile?.username?.trim() ?? "";
  }, [profile]);

  const planOk = canDistribute(profile?.plan);

  function resetAndClose() {
    setStep(1);
    setTitle("");
    setArtistName("");
    setFeaturing("");
    setGenreName("");
    setBusy(false);
    setCoverApproved(false);
    onClose();
  }

  useEffect(() => {
    if (!open || !loop) return;
    setLoopSnapshot(loop);
    setTitle(loop.name);
    setArtistName(defaultArtist);
    setGenreName(suggestDistributionGenre(loop.genre));
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setReleaseDate(d.toISOString().slice(0, 10));
    setStep(1);
    setAcceptRights(false);
    setAcceptAi(false);
    setCoverApproved(false);
  }, [open, loop?.id, defaultArtist, loop]);

  async function handleExport() {
    const effectiveLoop = loopSnapshot ?? loop;
    if (!effectiveLoop || !planOk) return;
    if (!title.trim()) {
      toast.error(copy.fieldTitle);
      return;
    }
    if (!acceptRights || !acceptAi) {
      toast.error(copy.acceptTermsError);
      return;
    }
    setBusy(true);
    try {
      await acceptDistributionTerms();
      const featuringList = featuring
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await downloadDistributionPackZip({
        loop: effectiveLoop,
        title: title.trim(),
        artistName: artistName.trim(),
        featuring: featuringList,
        genreName: genreName.trim(),
        languageCode,
        explicit,
        releaseDate: releaseDate || undefined,
        locale,
        licenseInput: {
          loopId: effectiveLoop.id,
          trackTitle: title.trim(),
          plan: profile?.plan,
          profile,
          locale,
          userId: user?.id,
          email: user?.email,
          exportKind: "beat",
        },
      });

      const result = await recordDistributionPackExport({
        loopId: effectiveLoop.id,
        title: title.trim(),
        artistName: artistName.trim(),
        featuring: featuringList.length ? featuringList : undefined,
        genreName: genreName.trim(),
        languageCode,
        explicit,
        releaseDate: releaseDate || undefined,
        acceptTerms: true,
      });

      if (!result.ok) {
        toast.error(result.error ?? copy.acceptTermsError);
        return;
      }

      toast.success(copy.downloadPack);
      onSubmitted?.();
      resetAndClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.acceptTermsError);
    } finally {
      setBusy(false);
    }
  }

  if (!loop) return null;
  const effectiveLoop = loopSnapshot ?? loop;
  const officialCover = isOfficialPollinationsCoverApproved(effectiveLoop, coverApproved);
  const trackMeta = [loop.genre, loop.bpm ? `${loop.bpm} BPM` : null].filter(Boolean).join(" · ");

  const nextLabel = step === 3 ? (busy ? copy.exporting : copy.downloadPack) : copy.continue;

  function handleNext() {
    if (!planOk) {
      toast.error(copy.planError);
      return;
    }
    if (step === 3) {
      if (!acceptRights || !acceptAi) {
        toast.error(copy.acceptTermsError);
        return;
      }
      void handleExport();
      return;
    }
    setStep((step + 1) as DistributionStudioStep);
  }

  function handleBack() {
    if (step === 1) resetAndClose();
    else setStep((step - 1) as DistributionStudioStep);
  }

  return (
    <DistributionStudioShell
      open={open}
      onClose={resetAndClose}
      copy={copy}
      step={step}
      onStepChange={setStep}
      trackName={loop.name}
      trackMeta={trackMeta}
      onBack={handleBack}
      onNext={handleNext}
      nextLabel={nextLabel}
      nextBusy={busy}
      canBack={!busy}
      scrollClassName={step === 2 ? "pk-distribution-studio__scroll--cover" : undefined}
      sidebarExtra={
        <Link to="/learn/distribute-ai-music" className="pk-dist-academy-link inline-flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" />
          {copy.academyLink}
        </Link>
      }
    >
      {!planOk ? (
        <p className="pk-dist-warning">{copy.planRequired}</p>
      ) : null}

      {step === 1 ? (
        <div>
          <h3 className="pk-dist-step-title">{copy.stepOverview}</h3>
          <p className="pk-dist-step-lead">{copy.overviewLead}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--pk-dist-faint)]">{copy.packIncludes}</p>
          <div className="pk-dist-card-grid">
            {[
              copy.includeAudio,
              copy.includeCover,
              copy.includeMeta,
              copy.includeReadme,
            ].map((label) => (
              <div key={label} className="pk-dist-include-card">
                <span className="pk-dist-include-card__dot" aria-hidden />
                <span className="text-sm font-medium text-[var(--pk-dist-body)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <DistributionCoverStudio
          loop={effectiveLoop}
          planOk={planOk}
          coverApproved={coverApproved}
          copy={copy}
          onCoverApprovedChange={setCoverApproved}
          onLoopUpdate={setLoopSnapshot}
        />
      ) : null}

      {step === 3 ? (
        <div>
          <h3 className="pk-dist-step-title">{copy.stepExport}</h3>
          <p className="pk-dist-step-lead">{copy.exportLead}</p>

          {!officialCover ? <div className="pk-dist-warning">{copy.coverWarning}</div> : null}

          <div className="mt-4 space-y-3">
            <label className="pk-dist-check">
              <input type="checkbox" checked={acceptRights} onChange={(e) => setAcceptRights(e.target.checked)} />
              {copy.acceptRights}
            </label>
            <label className="pk-dist-check">
              <input type="checkbox" checked={acceptAi} onChange={(e) => setAcceptAi(e.target.checked)} />
              {copy.acceptAi}
            </label>
          </div>

          <div className="pk-dist-recap">
            <div className="text-sm font-semibold text-[var(--pk-dist-title)]">{copy.recap}</div>
            <div className="mt-2 text-sm text-[var(--pk-dist-body)]">
              {title} — {artistName}
            </div>
            <div className="text-sm text-[var(--pk-dist-muted)]">
              {genreName} · {releaseDate || "—"}
            </div>
            {effectiveLoop.details?.coverUrl ? (
              <div className="mt-4 flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-xl border border-[var(--pk-dist-border)]">
                  <CoverMedia
                    loop={effectiveLoop}
                    coverUrl={effectiveLoop.details.coverUrl}
                    coverKey={effectiveLoop.id}
                    imageClassName="h-full w-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium text-[var(--pk-dist-body)]">
                  {officialCover ? copy.coverValidated : copy.coverNotValidated}
                </span>
              </div>
            ) : null}
          </div>

          {busy ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--pk-dist-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              {copy.exporting}
            </div>
          ) : null}
        </div>
      ) : null}
    </DistributionStudioShell>
  );
}

export function DistributionDistributeButton({
  loop,
  profile,
  onSubmitted,
  className,
  prominent = false,
  onOpenWizard,
}: {
  loop: Loop;
  profile: Pick<UserProfileRow, "legal_first_name" | "legal_last_name" | "username" | "plan"> | null;
  onSubmitted?: () => void;
  className?: string;
  prominent?: boolean;
  onOpenWizard?: (loop: Loop) => void;
}) {
  const navigate = useNavigate();
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const [open, setOpen] = useState(false);
  const planOk = canDistribute(profile?.plan);
  const savedOk = loop.isSaved !== false;

  const handleClick = () => {
    if (!planOk) {
      navigate("/pricing?plan=studio");
      return;
    }
    if (!savedOk) {
      toast.error(isFr ? "Sauvegarde ce morceau dans la bibliothèque d'abord." : "Save this track to your library first.");
      return;
    }
    if (onOpenWizard) onOpenWizard(loop);
    else setOpen(true);
  };

  return (
    <>
      <Button
        variant={prominent ? "primary" : "secondary"}
        size={prominent ? "md" : "sm"}
        className={className}
        onClick={handleClick}
      >
        <Download className="mr-1.5 h-4 w-4" />
        {planOk ? "Pack distribution" : isFr ? "Pack distribution (Studio)" : "Distribution pack (Studio)"}
      </Button>
      {!onOpenWizard ? (
        <DistributionWizard
          open={open}
          loop={open ? loop : null}
          profile={profile}
          onClose={() => setOpen(false)}
          onSubmitted={onSubmitted}
        />
      ) : null}
    </>
  );
}
