import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Check, Dice5, Loader2, PencilLine, RefreshCw, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import {
  buildCoverPromptSuggestionsFromLoop,
  buildStructuredCoverPrompt,
  COVER_PROMPT_MAX_LENGTH,
  extractCoverVisualIdeaFromPrompt,
} from "@producerhit/shared";
import type { Loop } from "@/types/loop";
import type { DistributionStudioCopy } from "@/i18n/distributionStudioCatalog";
import { generatePollinationsCoverForLoop } from "@/lib/pollinationsCoverPersist";
import { randomStructuredCoverSuggestion } from "@/lib/pollinationsCoverPrompt";
import { buildCoverGenerationSeed, withCoverCacheBust } from "@/lib/coverGenerationSeed";
import { coverImageSeed, cn } from "@/lib/utils";

export type CoverCandidate = {
  url: string;
  prompt: string;
  seed: number;
};

type Props = {
  loop: Loop;
  planOk: boolean;
  coverApproved: boolean;
  copy: DistributionStudioCopy;
  onCoverApprovedChange: (approved: boolean) => void;
  onLoopUpdate: (loop: Loop) => void;
  onCandidateChange?: (candidate: CoverCandidate | null) => void;
};

function resolveInitialPrompt(loop: Loop): string {
  const visualIdea = extractCoverVisualIdeaFromPrompt(loop.prompt ?? "");
  const fromTrack = buildCoverPromptSuggestionsFromLoop(loop)[0];
  if (visualIdea.length >= 6 && fromTrack) {
    return buildStructuredCoverPrompt(fromTrack);
  }

  const saved = loop.details?.coverPrompt?.trim();
  if (saved && saved.length >= 6) {
    return saved.slice(0, COVER_PROMPT_MAX_LENGTH);
  }
  if (fromTrack) {
    return buildStructuredCoverPrompt(fromTrack);
  }
  return buildStructuredCoverPrompt(randomStructuredCoverSuggestion(loop, coverImageSeed(loop)));
}

export function DistributionCoverStudio({
  loop,
  planOk,
  coverApproved,
  copy,
  onCoverApprovedChange,
  onLoopUpdate,
  onCandidateChange,
}: Props) {
  const [coverPrompt, setCoverPrompt] = useState(() => resolveInitialPrompt(loop));
  const [coverBusy, setCoverBusy] = useState(false);
  const [regenSeed, setRegenSeed] = useState(() => coverImageSeed(loop));
  const [genAttempt, setGenAttempt] = useState(0);
  const [history, setHistory] = useState<CoverCandidate[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [surpriseTick, setSurpriseTick] = useState(0);

  const prompt = useMemo(
    () => coverPrompt.trim().slice(0, COVER_PROMPT_MAX_LENGTH),
    [coverPrompt],
  );

  const deferredPromptLength = useDeferredValue(coverPrompt).trim().length;
  const promptLength = deferredPromptLength;
  const promptNearLimit = promptLength > COVER_PROMPT_MAX_LENGTH - 24;

  const activeCandidate = history[activeIndex] ?? null;

  const statusLabel = coverApproved
    ? copy.validated
    : activeCandidate
      ? copy.statusReady
      : copy.statusDraft;

  useEffect(() => {
    setCoverPrompt(resolveInitialPrompt(loop));
    setRegenSeed(coverImageSeed(loop));
    setHistory([]);
    setActiveIndex(0);
    setGenAttempt(0);
    setSurpriseTick(0);
    onCoverApprovedChange(false);
  }, [loop.id]);

  function applyDice() {
    const seed = (Date.now() ^ regenSeed ^ surpriseTick) >>> 0;
    const suggestion = randomStructuredCoverSuggestion(loop, seed);
    setSurpriseTick((t) => t + 1);
    setCoverPrompt(buildStructuredCoverPrompt(suggestion));
    onCoverApprovedChange(false);
  }

  async function runGenerate(isRegen: boolean) {
    if (!planOk) return;
    if (prompt.length < 6) {
      toast.error(copy.promptTooShort);
      return;
    }
    const attempt = genAttempt + 1;
    const seed = buildCoverGenerationSeed(prompt, loop, attempt);
    setGenAttempt(attempt);
    setRegenSeed(seed);

    setCoverBusy(true);
    onCoverApprovedChange(false);
    try {
      const result = await generatePollinationsCoverForLoop({
        loop: { id: loop.id, userId: loop.userId, stemsUrl: loop.stemsUrl ?? null },
        prompt,
        seed,
      });
      if (!result.coverUrl) {
        toast.error(copy.generateError);
        return;
      }
      const candidate: CoverCandidate = { url: result.coverUrl, prompt, seed };
      setHistory((prev) => [candidate, ...prev].slice(0, 4));
      setActiveIndex(0);
      onCandidateChange?.(candidate);
      onLoopUpdate({
        ...loop,
        details: {
          ...(loop.details ?? {}),
          coverUrl: result.coverUrl,
          coverPrompt: prompt,
          coverKind: "image",
        },
      });
      toast.success(isRegen ? copy.regenSuccess : copy.generateSuccess);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "cover_failed";
      if (msg.includes("no_credits")) toast.error(copy.noCredits);
      else toast.error(copy.generateError);
    } finally {
      setCoverBusy(false);
    }
  }

  function selectHistory(idx: number) {
    setActiveIndex(idx);
    const c = history[idx];
    if (!c) return;
    setCoverPrompt(c.prompt);
    onCandidateChange?.(c);
    onLoopUpdate({
      ...loop,
      details: { ...(loop.details ?? {}), coverUrl: c.url, coverPrompt: c.prompt, coverKind: "image" },
    });
    onCoverApprovedChange(false);
  }

  function validateCover() {
    if (!activeCandidate) {
      toast.error(copy.validateFirst);
      return;
    }
    onCoverApprovedChange(true);
    toast.success(copy.validateSuccess);
  }

  return (
    <div className="pk-cover-studio">
      <div className="pk-cover-studio__workspace">
        <div className="pk-cover-studio__controls-scroll">
          <div className="pk-cover-studio__header">
            <div>
              <h3 className="pk-dist-step-title">{copy.coverEyebrow}</h3>
            </div>
            <span
              className={cn(
                "pk-cover-studio__status",
                activeCandidate && !coverApproved && "pk-cover-studio__status--ready",
                coverApproved && "pk-cover-studio__status--validated",
              )}
            >
              {coverApproved ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              {statusLabel}
            </span>
          </div>

          <button type="button" className="pk-cover-studio__surprise-card" onClick={applyDice}>
            <span className="pk-cover-studio__surprise-icon" aria-hidden>
              <Dice5 className="h-5 w-5" />
            </span>
            <span className="pk-cover-studio__surprise-copy">
              <span className="pk-cover-studio__surprise-title">{copy.surpriseTitle}</span>
              <span className="pk-cover-studio__surprise-hint">{copy.surpriseHint}</span>
            </span>
            <span className="pk-cover-studio__surprise-cta">{copy.randomize}</span>
          </button>

          <div className="pk-cover-studio__prompt-shell">
            <div className="pk-cover-studio__prompt-head">
              <div className="pk-cover-studio__prompt-title-row">
                <PencilLine className="h-4 w-4 shrink-0 text-[var(--pk-dist-accent)]" aria-hidden />
                <div>
                  <p className="pk-cover-studio__prompt-label">{copy.promptLabel}</p>
                  <p className="pk-cover-studio__prompt-lead">{copy.promptLead}</p>
                </div>
              </div>
              <span
                className={cn(
                  "pk-cover-studio__prompt-counter",
                  promptNearLimit && "pk-cover-studio__prompt-counter--warn",
                )}
                aria-live="polite"
              >
                {promptLength}/{COVER_PROMPT_MAX_LENGTH}
              </span>
            </div>
            <textarea
              className="pk-cover-studio__prompt-editor"
              value={coverPrompt}
              onChange={(e) => {
                setCoverPrompt(e.target.value.slice(0, COVER_PROMPT_MAX_LENGTH));
                onCoverApprovedChange(false);
              }}
              rows={5}
              spellCheck={false}
              aria-label={copy.promptLabel}
            />
          </div>
        </div>

        <div className="pk-cover-studio__preview-pane">
          <p className="pk-cover-studio__section-label">{copy.previewFull}</p>
          <div className="pk-cover-studio__preview-stage">
            {coverBusy ? <div className="pk-cover-studio__shimmer" aria-hidden /> : null}
            {activeCandidate ? (
              <img src={withCoverCacheBust(activeCandidate.url, activeCandidate.seed)} alt="" />
            ) : (
              <div className="pk-cover-studio__preview-empty">{copy.emptyPreview}</div>
            )}
          </div>

          {activeCandidate ? (
            <>
              <p className="pk-cover-studio__section-label">{copy.previewThumb}</p>
              <div className="pk-cover-studio__spotify-mock">
                <img src={withCoverCacheBust(activeCandidate.url, activeCandidate.seed)} alt="" />
                <div className="pk-cover-studio__spotify-lines">
                  <span />
                  <span />
                </div>
              </div>
            </>
          ) : null}

          {history.length > 1 ? (
            <div>
              <p className="pk-cover-studio__section-label">{copy.versions}</p>
              <div className="pk-cover-studio__history">
                {history.map((c, idx) => (
                  <button
                    key={`${c.url}-${idx}`}
                    type="button"
                    data-active={idx === activeIndex}
                    onClick={() => selectHistory(idx)}
                    aria-label={`Version ${idx + 1}`}
                  >
                    <img src={withCoverCacheBust(c.url, c.seed)} alt="" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {coverBusy ? (
            <div className="pk-cover-studio__generating" role="status">
              <Loader2 className="h-4 w-4 animate-spin" />
              {copy.regenerating}
            </div>
          ) : null}
        </div>
      </div>

      <div className="pk-cover-studio__dock pk-cover-studio__dock--actions-only" role="toolbar" aria-label={copy.coverEyebrow}>
        <div className="pk-cover-studio__dock-actions">
          <button
            type="button"
            className="pk-cover-studio__dock-btn pk-cover-studio__dock-btn--secondary"
            disabled={!planOk || coverBusy}
            onClick={() => void runGenerate(false)}
          >
            {coverBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {coverBusy ? copy.regenerating : copy.generate}
          </button>
          <button
            type="button"
            className="pk-cover-studio__dock-btn pk-cover-studio__dock-btn--ghost"
            disabled={!planOk || coverBusy || !activeCandidate}
            onClick={() => void runGenerate(true)}
          >
            <RefreshCw className="h-4 w-4" />
            {copy.regenerate}
          </button>
          <button
            type="button"
            className="pk-cover-studio__dock-btn pk-cover-studio__dock-btn--primary"
            disabled={!activeCandidate || coverApproved}
            onClick={validateCover}
          >
            <Check className="h-4 w-4" />
            {coverApproved ? copy.validated : copy.validate}
          </button>
        </div>
      </div>
    </div>
  );
}

export function isOfficialPollinationsCoverApproved(loop: Loop, coverApproved: boolean): boolean {
  if (!coverApproved) return false;
  const url = loop.details?.coverUrl?.trim() ?? "";
  return url.includes("/loop-covers/") || url.includes("pollinations");
}
