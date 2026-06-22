import { useEffect, useRef } from "react";
import { Audio, AVPlaybackStatusSuccess } from "expo-av";
import { usePlayerStore } from "@/stores/playerStore";

function isLoadedStatus(status: AVPlaybackStatusSuccess | { isLoaded: false }): status is AVPlaybackStatusSuccess {
  return status.isLoaded;
}

export function AudioPlaybackHost() {
  const current = usePlayerStore((s) => s.current);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const setLoading = usePlayerStore((s) => s.setLoading);
  const setPositionMs = usePlayerStore((s) => s.setPositionMs);
  const setDurationMs = usePlayerStore((s) => s.setDurationMs);
  const registerHandlers = usePlayerStore((s) => s.registerHandlers);

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    void Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
  }, []);

  useEffect(() => {
    registerHandlers({
      toggle: async () => {
        const active = soundRef.current;
        if (!active) return;
        const status = await active.getStatusAsync();
        if (!isLoadedStatus(status)) return;
        if (status.isPlaying) await active.pauseAsync();
        else await active.playAsync();
      },
      seek: async (positionMs: number) => {
        const active = soundRef.current;
        if (!active) return;
        await active.setPositionAsync(Math.max(0, positionMs));
        setPositionMs(positionMs);
      },
    });
    return () => registerHandlers(null);
  }, [registerHandlers, setPositionMs]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!current?.audioUrl) return;
      setLoading(true);
      setPositionMs(0);
      setDurationMs(0);

      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: current.audioUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 400 },
          (status) => {
            if (!isLoadedStatus(status)) return;
            setPlaying(status.isPlaying);
            setPositionMs(status.positionMillis ?? 0);
            if (status.durationMillis != null) setDurationMs(status.durationMillis);
          },
        );

        if (!mounted) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        setPlaying(true);
        const status = await sound.getStatusAsync();
        if (isLoadedStatus(status) && status.durationMillis != null) {
          setDurationMs(status.durationMillis);
        }
      } catch (e) {
        console.warn("[AudioPlaybackHost] load failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
      void (async () => {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      })();
    };
  }, [current?.id, current?.audioUrl, setDurationMs, setLoading, setPlaying, setPositionMs]);

  return null;
}
