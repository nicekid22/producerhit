export function EmptyState({ title, description, accent }: { title: string; description: string; accent?: boolean }) {
  const wrap = accent
    ? "rounded-pk bg-gradient-to-br from-[#7c3aed]/25 via-transparent to-[#7c3aed]/10 p-[1px] shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_0_24px_rgba(124,58,237,0.10)]"
    : "";
  const inner = "flex flex-col items-center justify-center rounded-pk border border-dashed border-pk-border bg-pk-panel p-10 text-center";
  const content = (
    <div className={inner}>
      <svg width="92" height="48" viewBox="0 0 92 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 36C14 22 22 26 31 18C40 10 48 6 60 10C72 14 76 26 88 18"
          stroke="#2d2d3d"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M8 30C18 18 24 20 34 12C44 4 52 2 64 6C76 10 78 22 86 16"
          stroke="#7c3aed"
          strokeOpacity="0.25"
          strokeWidth="3"
          strokeLinecap="round"
          className={accent ? "animate-pulse" : undefined}
        />
      </svg>
      <div className="mt-5 text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-pk-muted">{description}</div>
    </div>
  );

  return (
    wrap ? <div className={wrap}>{content}</div> : content
  );
}
