import { Link } from "react-router-dom";

export function Navbar({ variant }: { variant: "marketing" | "auth" }) {
  return (
    <header
      className={[
        "sticky top-0 z-10 border-b border-[#e5e7eb]",
        variant === "marketing" ? "bg-white/60 backdrop-blur" : "bg-white",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-base font-semibold tracking-tight text-[#1a1a2e]">
          <span className="lowercase">producer</span>
          <span className="lowercase text-[#6d28d9]">hit</span>
        </Link>
        {variant === "marketing" ? (
          <nav className="hidden items-center gap-7 text-sm text-[#6b7280] md:flex">
            <a href="#how" className="hover:text-[#1a1a2e]">
              How it works
            </a>
            <a href="#features" className="hover:text-[#1a1a2e]">
              Features
            </a>
            <Link to="/pricing" className="hover:text-[#1a1a2e]">
              Pricing
            </Link>
            <Link to="/auth" className="hover:text-[#1a1a2e]">
              Login
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-[12px] bg-[#6d28d9] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5b21b6]"
            >
              Start Free
            </Link>
          </nav>
        ) : null}
        {variant === "marketing" ? (
          <Link
            to="/auth"
            className="md:hidden inline-flex items-center justify-center rounded-[12px] bg-[#6d28d9] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5b21b6]"
          >
            Start Free
          </Link>
        ) : null}
      </div>
    </header>
  );
}
