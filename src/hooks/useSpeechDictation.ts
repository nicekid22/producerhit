import { useCallback, useEffect, useRef, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import toast from "react-hot-toast";
import {
  getSpeechRecognitionCtor,
  isSpeechRecognitionSupported,
  speechRecognitionLang,
  type SpeechRecognitionInstance,
  type SpeechRecognitionResultEvent,
} from "@/lib/speechRecognition";

export type SpeechDictationStatus = "idle" | "listening" | "unsupported";

type Options = {
  locale: AppLocale;
  getValue: () => string;
  onValueChange: (value: string) => void;
  /** Arrêt auto après silence (Safari / mobile). */
  autoStopMs?: number;
};

function errorMessage(code: string, locale: AppLocale): string {
  const fr = locale === "fr";
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return fr
        ? "Accès micro refusé — autorise le micro dans les paramètres du navigateur."
        : "Microphone access denied — allow the mic in your browser settings.";
    case "no-speech":
      return fr ? "Aucune voix détectée — réessaie en parlant plus près." : "No speech detected — try again closer to the mic.";
    case "audio-capture":
      return fr ? "Micro introuvable — branche ou active un micro." : "No microphone found — connect or enable a mic.";
    case "network":
      return fr ? "Erreur réseau — vérifie ta connexion." : "Network error — check your connection.";
    case "aborted":
      return fr ? "Dictée interrompue." : "Dictation stopped.";
    default:
      return fr ? "Dictée impossible — réessaie ou change de navigateur." : "Dictation failed — retry or try another browser.";
  }
}

export function useSpeechDictation({ locale, getValue, onValueChange, autoStopMs = 45_000 }: Options) {
  const supported = isSpeechRecognitionSupported();
  const [status, setStatus] = useState<SpeechDictationStatus>(supported ? "idle" : "unsupported");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseTextRef = useRef("");
  const committedRef = useRef("");
  const listeningRef = useRef(false);
  const autoStopTimerRef = useRef<number | null>(null);

  const clearAutoStop = useCallback(() => {
    if (autoStopTimerRef.current != null) {
      window.clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearAutoStop();
    listeningRef.current = false;
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        try {
          rec.abort();
        } catch {
          void 0;
        }
      }
    }
    setStatus(supported ? "idle" : "unsupported");
  }, [clearAutoStop, supported]);

  const applyTranscript = useCallback(
    (event: SpeechRecognitionResultEvent) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i]?.[0]?.transcript ?? "";
        if (event.results[i]?.isFinal) {
          finalChunk += piece;
        } else {
          interim += piece;
        }
      }
      if (finalChunk) {
        committedRef.current += finalChunk;
      }
      const merged = `${baseTextRef.current}${committedRef.current}${interim}`;
      onValueChange(merged);
    },
    [onValueChange],
  );

  const startListening = useCallback(() => {
    if (!supported) {
      toast.error(
        locale === "fr"
          ? "Dictée vocale non supportée sur ce navigateur — essaie Chrome, Edge ou Safari récent."
          : "Voice dictation isn't supported in this browser — try Chrome, Edge, or recent Safari.",
      );
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    stopListening();

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = speechRecognitionLang(locale);

    baseTextRef.current = getValue();
    if (baseTextRef.current.length > 0 && !/\s$/.test(baseTextRef.current)) {
      baseTextRef.current += " ";
    }
    committedRef.current = "";

    rec.onstart = () => {
      listeningRef.current = true;
      setStatus("listening");
      clearAutoStop();
      autoStopTimerRef.current = window.setTimeout(() => {
        stopListening();
      }, autoStopMs);
    };

    rec.onresult = (event) => {
      applyTranscript(event as SpeechRecognitionResultEvent);
      clearAutoStop();
      autoStopTimerRef.current = window.setTimeout(() => {
        stopListening();
      }, autoStopMs);
    };

    rec.onerror = (event) => {
      const code = (event as { error?: string }).error ?? "unknown";
      if (code !== "aborted" && code !== "no-speech") {
        toast.error(errorMessage(code, locale));
      } else if (code === "no-speech" && !committedRef.current.trim()) {
        toast.error(errorMessage(code, locale));
      }
      stopListening();
    };

    rec.onend = () => {
      listeningRef.current = false;
      setStatus(supported ? "idle" : "unsupported");
      clearAutoStop();
      recognitionRef.current = null;
      if (committedRef.current.trim()) {
        onValueChange(`${baseTextRef.current}${committedRef.current}`.trimEnd());
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      toast.error(
        locale === "fr"
          ? "Impossible de démarrer la dictée — réessaie."
          : "Could not start dictation — try again.",
      );
      stopListening();
    }
  }, [applyTranscript, autoStopMs, clearAutoStop, getValue, locale, onValueChange, stopListening, supported]);

  const toggle = useCallback(() => {
    if (status === "listening") {
      stopListening();
      return;
    }
    startListening();
  }, [startListening, status, stopListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    supported,
    status,
    isListening: status === "listening",
    toggle,
    stop: stopListening,
  };
}
