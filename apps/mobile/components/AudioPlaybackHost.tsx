import { useEffect, useRef } from "react";

import { Audio, AVPlaybackStatusSuccess } from "expo-av";

import { devWarn } from "@/lib/devLog";
import { resolveLoopCoverUrl } from "@/lib/loopDisplay";
import { t } from "@/lib/i18n/catalog";
import { assignLoopCoverOnce } from "@/lib/loopCover";
import { useLocaleStore } from "@/stores/localeStore";
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
  const setPlaybackError = usePlayerStore((s) => s.setPlaybackError);

  const registerHandlers = usePlayerStore((s) => s.registerHandlers);



  const soundRef = useRef<Audio.Sound | null>(null);

  const advancingRef = useRef(false);



  useEffect(() => {
    const loop = current;
    if (!loop || resolveLoopCoverUrl(loop)) return;

    let cancelled = false;
    void assignLoopCoverOnce(loop).then((url) => {
      if (cancelled || !url?.startsWith("http")) return;
      usePlayerStore.getState().patchLoopCover(loop.id, url);
    });

    return () => {
      cancelled = true;
    };
  }, [current?.id, current?.coverUrl, current?.stemsUrl]);

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

        setPositionMs(positionMs, true);

      },

    });

    return () => registerHandlers(null);

  }, [registerHandlers, setPositionMs]);



  useEffect(() => {

    let mounted = true;



    async function load() {

      if (!current?.audioUrl) return;

      setLoading(true);
      setPlaybackError(null);
      setPositionMs(0, true);

      setDurationMs(0);

      advancingRef.current = false;



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



            if (status.didJustFinish && !status.isLooping && !advancingRef.current) {

              const { queue, queueIndex } = usePlayerStore.getState();

              if (queue.length > 1) {

                advancingRef.current = true;

                const next = (queueIndex + 1) % queue.length;

                const track = queue[next];

                if (track) {

                  usePlayerStore.setState({

                    current: track,

                    queueIndex: next,

                    positionMs: 0,

                    durationMs: 0,

                    isLoading: true,

                  });

                }

              } else {

                setPlaying(false);

              }

            }

          },

        );



        if (!mounted) {

          await sound.unloadAsync();

          return;

        }



        soundRef.current = sound;

        let status = await sound.getStatusAsync();
        if (isLoadedStatus(status) && !status.isPlaying) {
          await sound.playAsync();
          status = await sound.getStatusAsync();
        }

        setPlaying(isLoadedStatus(status) ? status.isPlaying : true);

        if (isLoadedStatus(status) && status.durationMillis != null) {

          setDurationMs(status.durationMillis);

        }

      } catch (e) {

        devWarn("[AudioPlaybackHost] load failed", e);
        const locale = useLocaleStore.getState().locale;
        setPlaybackError(t(locale, "playbackFailed"));
        setPlaying(false);

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

  }, [current?.id, current?.audioUrl, setDurationMs, setLoading, setPlaying, setPlaybackError, setPositionMs]);



  return null;

}


