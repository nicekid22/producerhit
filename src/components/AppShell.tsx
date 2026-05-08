import { Sidebar } from "@/components/Sidebar";
import { usePlayerStore } from "@/stores/playerStore";

export function AppShell({
  left,
  children,
}: {
  left: React.ReactNode;
  children: React.ReactNode;
}) {
  const hasPlayer = usePlayerStore((s) => !!s.current);

  return (
    <div className="relative bg-pk-bg text-pk-text md:h-screen md:overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#7c3aed]/15 blur-3xl" />
        <div className="absolute -bottom-56 left-12 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute -top-56 -right-24 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto min-h-screen max-w-[1600px] md:h-screen">
        <div className="flex min-h-screen flex-col px-3 py-3 md:h-screen md:flex-row md:gap-3 md:overflow-hidden">
          <div className="hidden w-[60px] md:flex md:flex-col md:overflow-hidden">
            <div className="h-full overflow-hidden rounded-2xl border border-pk-border/70 bg-pk-panel/70 backdrop-blur">
              <Sidebar />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 md:min-h-0 md:flex-row md:overflow-hidden">
            <div
              className={`w-full overflow-hidden rounded-2xl border border-pk-border/70 bg-pk-panel/70 backdrop-blur md:w-[420px] md:min-h-0 ${
                hasPlayer ? "pb-36 md:pb-24" : ""
              }`}
            >
              <div className="md:hidden">
                <div className="border-b border-pk-border/70 bg-pk-panel/40 px-4 py-3 text-sm font-semibold backdrop-blur">
                  ProducerHit
                </div>
              </div>
              {left}
            </div>

            <div
              className={`min-w-0 flex-1 overflow-y-auto rounded-2xl border border-pk-border/70 bg-pk-panel/30 backdrop-blur md:min-h-0 ${
                hasPlayer ? "pb-36 md:pb-24" : ""
              }`}
            >
              {children}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-pk-border bg-pk-panel md:hidden">
        <div className="mx-auto max-w-[1440px]">
          <div className="h-14">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
