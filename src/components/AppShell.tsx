import type { CSSProperties } from "react";
import { Sidebar } from "@/components/Sidebar";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { WarmGlassBackdrop } from "@/components/WarmGlassBackdrop";
import { BackdropTextureVeil } from "@/components/BackdropTextureVeil";
import { usePlayerStore } from "@/stores/playerStore";
import { useVisualThemeStore, isWarmGlassTheme } from "@/stores/visualThemeStore";
import { cn } from "@/lib/utils";

export function AppShell({
  left,
  children,
  variant = "split",
  theme = "default",
  mobileTabs,
  mobilePanel,
  mobileLayoutV2 = false,
}: {
  left?: React.ReactNode;
  children: React.ReactNode;
  variant?: "split" | "single";
  theme?: "default" | "prism";
  /** Onglets Créer/Résultats — mobile Dashboard v2 */
  mobileTabs?: React.ReactNode;
  mobilePanel?: "create" | "results" | "master";
  mobileLayoutV2?: boolean;
}) {
  const hasPlayer = usePlayerStore((s) => !!s.current);
  const isPrism = theme === "prism";
  const visualTheme = useVisualThemeStore((s) => s.theme);
  const warmGlass = isPrism && isWarmGlassTheme(visualTheme);
  const dockPb = hasPlayer ? "pk-shell-dock-pb--player" : "pk-shell-dock-pb";
  /** Padding scroll zones — pas sur la colonne création desktop (évite trou sous Versions). */
  /** Scroll workspace : padding géré par margin-bottom colonnes + --pk-player-reserve */
  const dockPbScrollOnly = "md:pk-shell-dock-pb";
  const hideLeftOnMobile = mobileLayoutV2 && (mobilePanel === "results" || mobilePanel === "master");
  const hideChildrenOnMobile = mobileLayoutV2 && mobilePanel === "create";

  return (
    <div
      className={cn(
        "pk-app-shell relative text-pk-text md:h-screen md:overflow-hidden",
        mobileLayoutV2 && "pk-mobile-app-shell",
        isPrism ? "pk-prism-stage pk-prism-dashboard" : "bg-pk-bg",
        warmGlass && "pk-warm-glass-stage",
      )}
      style={
        {
          "--pk-bottom-nav": "56px",
          "--pk-player-height": "72px",
        } as CSSProperties
      }
    >
        <div className="pk-warm-backdrop pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {isPrism ? (
          warmGlass ? (
            <WarmGlassBackdrop />
          ) : (
            <>
              <div
                className="pk-prism-fx-vignette absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.42)_100%)]"
                aria-hidden
              />
              <div
                className="pk-prism-fx-orb absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[rgba(157,124,255,0.10)] blur-3xl"
                aria-hidden
              />
              <div
                className="pk-prism-fx-orb absolute -bottom-56 left-12 h-[520px] w-[520px] rounded-full bg-[rgba(103,195,255,0.06)] blur-3xl"
                aria-hidden
              />
              <div className="pk-prism-grid hidden md:block" aria-hidden />
            </>
          )
        ) : (
          <>
            <div className="pk-prism-fx-orb absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#7c3aed]/15 blur-3xl" aria-hidden />
            <div className="pk-prism-fx-orb absolute -bottom-56 left-12 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" aria-hidden />
            <div className="pk-prism-fx-orb absolute -top-56 -right-24 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" aria-hidden />
          </>
        )}
        <BackdropTextureVeil variant="dashboard" />
      </div>

      <div
        className={cn(
          "relative mx-auto max-w-[1600px]",
          mobileLayoutV2
            ? "flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden md:h-screen md:max-h-none"
            : "min-h-screen min-h-[100svh] md:h-screen",
        )}
      >
        <div
          className={cn(
            "flex flex-col px-3 py-3 md:h-screen md:min-h-0 md:flex-row md:gap-3 md:overflow-hidden",
            hasPlayer && "pb-0",
            mobileLayoutV2 ? "min-h-0 flex-1 overflow-hidden" : "min-h-screen min-h-[100svh]",
          )}
        >
          <div className="pk-studio-rail-wrap relative z-10 hidden min-h-0 w-[64px] md:flex md:flex-col md:justify-center">
            <div
              className={cn(
                "pk-studio-rail w-full shrink-0 overflow-hidden rounded-[1.25rem] backdrop-blur",
                isPrism ? "pk-prism-glass border border-white/10" : "border border-pk-border/70 bg-pk-panel/70",
              )}
            >
              <Sidebar />
            </div>
          </div>

          {variant === "split" ? (
            <div
              className={cn(
                "flex flex-1 flex-col gap-3 md:min-h-0 md:flex-row md:overflow-hidden",
                mobileLayoutV2 && "min-h-0 overflow-hidden",
              )}
            >
              {mobileLayoutV2 && mobileTabs ? (
                <div
                  className={cn(
                    "pk-mobile-dashboard-chrome flex-shrink-0 md:hidden rounded-2xl border px-3 py-2.5 backdrop-blur",
                    isPrism ? "pk-prism-glass border-white/10 bg-white/[0.04]" : "border-pk-border/70 bg-pk-panel/70",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    {isPrism ? <BrandLogo className="scale-90 origin-left" /> : <div className="text-sm font-semibold">ProducerHit</div>}
                  </div>
                  <div className="mt-2.5">{mobileTabs}</div>
                </div>
              ) : null}

              <div
                className={cn(
                  "w-full overflow-visible rounded-2xl backdrop-blur md:w-[440px] md:min-h-0 md:overflow-hidden",
                  isPrism ? "pk-prism-glass pk-studio-console border border-white/10" : "border border-pk-border/70 bg-pk-panel/70",
                  mobileLayoutV2
                    ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                    : "md:flex md:h-full md:min-h-0 md:flex-col",
                  hideLeftOnMobile && "hidden md:flex md:flex-col",
                )}
              >
                {!mobileLayoutV2 ? (
                  <div className="md:hidden">
                    <div
                      className={[
                        "border-b px-4 py-3 backdrop-blur",
                        isPrism ? "border-white/10 bg-white/[0.03]" : "border-pk-border/70 bg-pk-panel/40 text-sm font-semibold",
                      ].join(" ")}
                    >
                      {isPrism ? <BrandLogo /> : "ProducerHit"}
                    </div>
                  </div>
                ) : (
                  <div className="hidden border-b border-white/10 px-4 pb-3 pt-4 md:block">
                    {isPrism ? <BrandLogo /> : <div className="text-sm font-semibold">ProducerHit</div>}
                  </div>
                )}
                {left}
              </div>

              <div
                className={cn(
                  "min-w-0 flex-1 overflow-visible rounded-2xl backdrop-blur md:min-h-0 md:overflow-y-auto",
                  isPrism
                    ? "pk-prism-glass pk-studio-workspace border border-white/10 bg-white/[0.02]"
                    : "border border-pk-border/70 bg-pk-panel/30",
                  mobileLayoutV2 ? cn("min-h-0 overflow-y-auto overscroll-contain", dockPb) : dockPbScrollOnly,
                  hideChildrenOnMobile && "hidden md:block",
                )}
              >
                {children}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "min-w-0 flex-1 overflow-visible rounded-2xl backdrop-blur md:min-h-0 md:overflow-y-auto",
                isPrism
                  ? "pk-prism-glass pk-studio-workspace border border-white/10 bg-white/[0.02]"
                  : "border border-pk-border/70 bg-pk-panel/30",
                dockPb,
              )}
            >
              {children}
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "pk-app-shell-mobile-nav fixed bottom-0 left-0 right-0 z-40 max-w-[100vw] overflow-hidden pb-[env(safe-area-inset-bottom)] md:hidden",
          isPrism ? "border-t border-white/10 bg-[rgba(4,3,10,0.88)] backdrop-blur-xl" : "border-t border-pk-border bg-pk-panel",
        )}
      >
        <div className="mx-auto h-14 w-full max-w-[100vw] min-w-0 overflow-hidden">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
