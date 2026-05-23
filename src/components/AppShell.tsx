import type { CSSProperties } from "react";
import { Sidebar } from "@/components/Sidebar";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { usePlayerStore } from "@/stores/playerStore";

export function AppShell({
  left,
  children,
  variant = "split",
  theme = "default",
}: {
  left?: React.ReactNode;
  children: React.ReactNode;
  variant?: "split" | "single";
  theme?: "default" | "prism";
}) {
  const hasPlayer = usePlayerStore((s) => !!s.current);
  const isPrism = theme === "prism";

  return (
    <div
      className={[
        "relative text-pk-text md:h-screen md:overflow-hidden",
        isPrism ? "pk-prism-stage pk-prism-dashboard bg-[#050508]" : "bg-pk-bg",
      ].join(" ")}
      style={{ "--pk-bottom-nav": "56px" } as CSSProperties}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {isPrism ? (
          <>
            <div className="pk-prism-grain opacity-[0.035]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.42)_100%)]" />
            <div className="absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[rgba(157,124,255,0.10)] blur-3xl" />
            <div className="absolute -bottom-56 left-12 h-[520px] w-[520px] rounded-full bg-[rgba(103,195,255,0.06)] blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#7c3aed]/15 blur-3xl" />
            <div className="absolute -bottom-56 left-12 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="absolute -top-56 -right-24 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
          </>
        )}
      </div>

      <div className="relative mx-auto min-h-screen min-h-[100svh] max-w-[1600px] md:h-screen">
        <div className="flex min-h-screen min-h-[100svh] flex-col px-3 py-3 md:h-screen md:flex-row md:gap-3 md:overflow-hidden">
          <div className="relative z-10 hidden w-[60px] md:flex md:flex-col md:overflow-hidden">
            <div
              className={[
                "h-full overflow-hidden rounded-2xl backdrop-blur",
                isPrism ? "pk-prism-glass border border-white/10" : "border border-pk-border/70 bg-pk-panel/70",
              ].join(" ")}
            >
              <Sidebar />
            </div>
          </div>

          {variant === "split" ? (
            <div className="flex flex-1 flex-col gap-3 md:min-h-0 md:flex-row md:overflow-hidden">
              <div
                className={[
                  "w-full overflow-hidden rounded-2xl backdrop-blur md:w-[420px] md:min-h-0",
                  isPrism ? "pk-prism-glass border border-white/10" : "border border-pk-border/70 bg-pk-panel/70",
                  hasPlayer ? "pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-24" : "",
                ].join(" ")}
              >
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
                {left}
              </div>

              <div
                className={[
                  "min-w-0 flex-1 overflow-y-auto rounded-2xl backdrop-blur md:min-h-0",
                  isPrism ? "pk-prism-glass border border-white/10 bg-white/[0.02]" : "border border-pk-border/70 bg-pk-panel/30",
                  hasPlayer ? "pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-24" : "",
                ].join(" ")}
              >
                {children}
              </div>
            </div>
          ) : (
            <div
              className={[
                "min-w-0 flex-1 overflow-y-auto rounded-2xl backdrop-blur md:min-h-0",
                isPrism ? "pk-prism-glass border border-white/10 bg-white/[0.02]" : "border border-pk-border/70 bg-pk-panel/30",
                hasPlayer ? "pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-24" : "",
              ].join(" ")}
            >
              {children}
            </div>
          )}
        </div>
      </div>

      <div
        className={[
          "fixed bottom-0 left-0 right-0 z-10 pb-[env(safe-area-inset-bottom)] md:hidden",
          isPrism ? "border-t border-white/10 bg-[rgba(4,3,10,0.88)] backdrop-blur-xl" : "border-t border-pk-border bg-pk-panel",
        ].join(" ")}
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="h-14">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
