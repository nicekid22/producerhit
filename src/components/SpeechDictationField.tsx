import { cn } from "@/lib/utils";
import { useSpeechDictation } from "@/hooks/useSpeechDictation";
import { Mic, Square } from "lucide-react";
import type { InputHTMLAttributes, RefObject, TextareaHTMLAttributes } from "react";

import type { AppLocale } from "@/i18n/config";
type BaseProps = {
  locale: AppLocale;
  value: string;
  onChange: (value: string) => void;
  variant?: "landing" | "dashboard";
  wrapperClassName?: string;
  showStatus?: boolean;
  /** Micro à l’intérieur du champ (style Apple) */
  micPlacement?: "outside" | "inside";
};

type InputProps = BaseProps & {
  multiline?: false;
  inputRef?: RefObject<HTMLInputElement | null>;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

type TextareaProps = BaseProps & {
  multiline: true;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">;

export type SpeechDictationFieldProps = InputProps | TextareaProps;

export function SpeechDictationField(props: SpeechDictationFieldProps) {
  const {
    locale,
    value,
    onChange,
    variant = "dashboard",
    wrapperClassName,
    showStatus = true,
    micPlacement = "outside",
    multiline,
    inputRef,
    className,
    ...rest
  } = props;

  const dictation = useSpeechDictation({
    locale,
    getValue: () => value,
    onValueChange: onChange,
  });

  const isFr = locale === "fr";
  const micLabel = dictation.isListening
    ? isFr
      ? "Arrêter la dictée"
      : "Stop dictation"
    : isFr
      ? "Dicter à la voix"
      : "Start voice dictation";

  const controlClass = cn(
    "pk-speech-field__control w-full min-w-0 outline-none transition-[border-color,box-shadow]",
    variant === "landing"
      ? "resize-none bg-transparent text-base font-medium leading-relaxed text-white placeholder:text-white/35 sm:text-lg"
      : cn(
          "rounded-pk border border-pk-border bg-pk-input text-sm placeholder:text-pk-muted focus:border-pk-accent",
          multiline ? "resize-none px-3 py-2.5" : "px-3 py-2.5",
        ),
    dictation.isListening && variant === "dashboard" && "pk-speech-field__control--listening",
    dictation.isListening && variant === "landing" && "pk-speech-field__control--listening-landing",
    className,
  );

  return (
    <div className={cn("pk-speech-field", variant === "dashboard" && "mt-3", wrapperClassName)}>
      <div
        className={cn(
          "pk-speech-field__shell flex gap-2",
          micPlacement === "inside" && "pk-speech-field__shell--mic-inside",
          multiline ? "items-start" : "items-center",
        )}
      >
        <div className="pk-speech-field__control-wrap min-w-0 flex-1">
          {multiline ? (
            <textarea
              ref={inputRef as RefObject<HTMLTextAreaElement | null> | undefined}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={controlClass}
              {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={inputRef as RefObject<HTMLInputElement | null> | undefined}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={controlClass}
              {...(rest as InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
        </div>

        <button
          type="button"
          onClick={dictation.toggle}
          disabled={!dictation.supported}
          className={cn(
            "pk-speech-field__mic shrink-0",
            variant === "landing" && "pk-speech-field__mic--landing",
            multiline && micPlacement === "outside" && "pk-speech-field__mic--multiline",
            micPlacement === "inside" && "pk-speech-field__mic--inside",
            dictation.isListening && "is-listening",
            !dictation.supported && "is-unsupported",
          )}
          aria-label={micLabel}
          aria-pressed={dictation.isListening}
          title={
            !dictation.supported
              ? isFr
                ? "Dictée non disponible sur ce navigateur"
                : "Dictation unavailable in this browser"
              : micLabel
          }
        >
          <span className="pk-speech-field__mic-ring" aria-hidden />
          {dictation.isListening ? (
            <>
              <span className="pk-speech-field__mic-bars" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              <Square className="pk-speech-field__mic-icon h-3.5 w-3.5" fill="currentColor" aria-hidden />
            </>
          ) : (
            <Mic className="pk-speech-field__mic-icon h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      {showStatus && dictation.isListening ? (
        <p className="pk-speech-field__status" role="status" aria-live="polite">
          <span className="pk-speech-field__status-dot" aria-hidden />
          {isFr ? "Écoute en cours — parle maintenant" : "Listening — speak now"}
        </p>
      ) : null}
    </div>
  );
}
