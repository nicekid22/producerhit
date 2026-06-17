import { useCallback, useEffect, useRef, useState } from "react";
import { VOICE_MAX_RECORD_SEC } from "@/lib/voiceToSong";

type Options = {
  maxSec?: number;
  onComplete: (file: File) => void;
  onTooShort?: () => void;
};

export function useVoiceAudioCapture({ maxSec = VOICE_MAX_RECORD_SEC, onComplete, onTooShort }: Options) {
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const rec = mediaRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    mediaRef.current = null;
    setRecording(false);
  }, []);

  useEffect(() => () => stopRecording(), [stopRecording]);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("microphone_unavailable");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
    const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
      if (blob.size < 800) {
        onTooShort?.();
        return;
      }
      onComplete(new File([blob], "voice-recording.webm", { type: blob.type }));
    };
    mediaRef.current = rec;
    rec.start(250);
    setRecording(true);
    setRecordSec(0);
    timerRef.current = window.setInterval(() => {
      setRecordSec((s) => {
        if (s + 1 >= maxSec) stopRecording();
        return s + 1;
      });
    }, 1000);
  }, [maxSec, onComplete, onTooShort, stopRecording]);

  return { recording, recordSec, startRecording, stopRecording };
}
