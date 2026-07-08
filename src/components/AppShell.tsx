import type { CSSProperties } from "react";
import { Sidebar } from "@/components/Sidebar";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { WarmGlassBackdrop } from "@/components/WarmGlassBackdrop";
import { CloudBackdrop } from "@/components/CloudBackdrop";
import { BackdropTextureVeil } from "@/components/BackdropTextureVeil";
import { usePlayerStore } from "@/stores/playerStore";
import { useCloudAccentStore } from "@/stores/cloudAccentStore";
import { cloudAccentToElement } from "@/lib/elementTheme";
import { useVisualThemeStore, isCloudTheme, isWarmGlassTheme } from "@/stores/visualThemeStore";
import { cn } from "@/lib/utils";

export function AppShell({
  left,
  children,
  variant = "split",
  theme = "default",
  mobileTabs,
  mobilePanel,
  mobileLayoutV2 = false,
  consoleHeader,
}: {
  left?: React.ReactNode;
  children: React.ReactNode;
  variant?: "split" | "single";
  theme?: "default" | "prism";
  /** Onglets Créer/Résultats — mobile Dashboard v2 */
  mobileTabs?: React.ReactNode;
  mobilePanel?: "create" | "results" | "master";
  mobileLayoutV2?: boolean;
  /** En-tête console (ex. logo animé dashboard) — remplace BrandLogo */
  consoleHeader?: React.ReactNode;
}) {
  const hasPlayer = usePlayerStore((s) => !!s.current);
  const isPrism = theme === "prism";
  const visualTheme = useVisualThemeStore((s) => s.theme);
  const cloudAccent = useCloudAccentStore((s) => s.accent);
  const warmGlass = isPrism && isWarmGlassTheme(visualTheme);
  const cloud = isPrism && isCloudTheme(visualTheme);
  const prismFloatingNav = isPrism && !warmGlass && !cloud;
  const dockPb = hasPlayer ? "pk-shell-dock-pb--player" : "pk-shell-dock-pb";
  /** Padding scroll zones — pas sur la colonne création desktop (évite trou sous Versions). */
  /** Scroll workspace : padding géré par margin-bottom colonnes + --pk-player-reserve */
  const dockPbScrollOnly = "md:pk-shell-dock-pb";
  const hideLeftOnMobile = mobileLayoutV2 && (mobilePanel === "results" || mobilePanel === "master");
  const hideChildrenOnMobile = mobileLayoutV2 && mobilePanel === "create";

  return (
    <div
      className={cn(
        "pk-app-shell pk-apple-app relative z-[1] text-pk-text md:h-screen md:overflow-hidden",
        mobileLayoutV2 && "pk-mobile-app-shell pt-[env(safe-area-inset-top,0px)]",
        isPrism ? "pk-prism-stage pk-prism-dashboard" : "bg-pk-bg",
        warmGlass && "pk-warm-glass-stage",
        cloud && "pk-cloud-stage pk-cloud-shell",
      )}
      data-pk-cloud-accent={cloud ? cloudAccent : undefined}
      data-pk-element={cloud ? cloudAccentToElement(cloudAccent) : undefined}
      style={
        {
          "--pk-mobile-nav-inner-h": cloud || warmGlass || prismFloatingNav ? "62px" : "56px",
          "--pk-studio-console-width": cloud ? "448px" : "480px",
        } as CSSProperties
      }
    >
        <div className="pk-warm-backdrop pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {isPrism ? (
          warmGlass ? (
            <WarmGlassBackdrop />
          ) : cloud ? (
            <CloudBackdrop />
          ) : (
            <>
              <div
                className="pk-prism-fx-vignette absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.42)_100%)]"
                aria-hidden
              />
              <div
                className="pk-prism-fx-orb absolute -top-40 left-0 h-[480px] w-[520px] rounded-full bg-[rgba(139,92,246,0.12)] blur-3xl"
                aria-hidden
              />
              <div
                className="pk-prism-fx-orb absolute top-[30%] -right-24 h-[480px] w-[480px] rounded-full bg-[rgba(236,72,153,0.07)] blur-3xl"
                aria-hidden
              />
              <div
                className="pk-prism-fx-orb absolute -bottom-48 left-1/2 h-[460px] w-[620px] -translate-x-1/2 rounded-full bg-[rgba(99,102,241,0.06)] blur-3xl"
                aria-hidden
              />
              <div className="pk-prism-grid hidden md:block" aria-hidden />
            </>
          )
        ) : (
          <>
            <div className="pk-prism-fx-orb absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[rgb(192,38,211)]/15 blur-3xl" aria-hidden />
            <div className="pk-prism-fx-orb absolute -bottom-56 left-12 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" aria-hidden />
            <div className="pk-prism-fx-orb absolute -top-56 -right-24 h-[520px] w-[520px] rounded-full bg-[rgb(232,121,249)]/10 blur-3xl" aria-hidden />
          </>
        )}
        {!cloud ? <BackdropTextureVeil variant="dashboard" /> : null}
      </div>

      <div
        className={cn(
          "relative mx-auto max-w-[1600px]",
          mobileLayoutV2
            ? "pk-mobile-shell-viewport flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden md:h-screen md:max-h-none"
            : "min-h-screen min-h-[100svh] md:h-screen",
        )}
      >
        <div
          className={cn(
            "flex flex-col md:h-screen md:min-h-0 md:flex-row md:gap-3 md:overflow-hidden md:px-3 md:py-3",
            hasPlayer && "pb-0",
            mobileLayoutV2
              ? "pk-mobile-shell-inner min-h-0 flex-1 overflow-hidden px-2 py-1.5 sm:px-3 sm:py-2"
              : "min-h-screen min-h-[100svh] px-3 py-3",
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
                cloud && mobileLayoutV2 && "gap-2",
              )}
            >
              {mobileLayoutV2 && mobileTabs ? (
                <div
                  className={cn(
                    "pk-mobile-dashboard-chrome flex-shrink-0 md:hidden rounded-[14px] border px-2 py-1 backdrop-blur",
                    isPrism ? "pk-prism-glass border-white/10 bg-white/[0.04]" : "border-pk-border/70 bg-pk-panel/70",
                  )}
                >
                  {mobileTabs}
                </div>
              ) : null}

              <div
                className={cn(
                  "w-full overflow-visible rounded-2xl backdrop-blur md:w-[var(--pk-studio-console-width,480px)] md:min-w-[var(--pk-studio-console-width,480px)] md:max-w-[var(--pk-studio-console-width,480px)] md:flex-shrink-0 md:min-h-0 md:overflow-hidden",
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
                      {consoleHeader ?? <BrandLogo compact />}
                    </div>
                  </div>
                ) : (
                  <div className="hidden border-b border-white/10 px-4 pb-3 pt-4 md:block">
                    {consoleHeader ?? <BrandLogo compact />}
                  </div>
                )}
                {left}
              </div>

              <div
                className={cn(
                  /* Scroll interne — le voile verre (::before/::after) reste sur le shell pleine hauteur */
                  "pk-studio-workspace-shell min-w-0 flex flex-1 flex-col overflow-hidden rounded-2xl backdrop-blur md:min-h-0",
                  isPrism
                    ? "pk-prism-glass pk-studio-workspace border border-white/10 bg-white/[0.02]"
                    : "border border-pk-border/70 bg-pk-panel/30",
                  mobileLayoutV2 && "min-h-0",
                  hideChildrenOnMobile && "hidden md:flex md:flex-col",
                )}
              >
              <div
                className={cn(
                  "pk-studio-workspace-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain",
                  mobileLayoutV2 ? dockPb : dockPbScrollOnly,
                )}
                id="pk-main-scroll"
              >
                  {children}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "pk-studio-workspace-shell min-w-0 flex flex-1 flex-col overflow-hidden rounded-2xl backdrop-blur md:min-h-0",
                isPrism
                  ? "pk-prism-glass pk-studio-workspace border border-white/10 bg-white/[0.02]"
                  : "border border-pk-border/70 bg-pk-panel/30",
                mobileLayoutV2 && "min-h-0",
              )}
            >
              <div className={cn("pk-studio-workspace-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain", dockPb)} id="pk-main-scroll">
                {children}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "pk-app-shell-mobile-nav fixed bottom-0 left-0 right-0 z-40 max-w-[100vw] overflow-hidden pb-[env(safe-area-inset-bottom)] md:hidden",
          cloud && "pk-app-shell-mobile-nav--cloud",
          warmGlass && "pk-app-shell-mobile-nav--warm-glass",
          prismFloatingNav && "pk-app-shell-mobile-nav--prism",
          isPrism ? "border-t border-white/10 bg-[rgba(4,3,10,0.88)] backdrop-blur-xl" : "border-t border-pk-border bg-pk-panel",
        )}
      >
        <div
          className={cn(
            "mx-auto w-full max-w-[100vw] min-w-0 overflow-hidden",
            cloud || warmGlass || prismFloatingNav ? "h-[var(--pk-mobile-nav-inner-h,62px)]" : "h-14",
          )}
        >
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
