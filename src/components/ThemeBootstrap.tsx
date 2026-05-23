import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function isMarketingPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname.startsWith("/loop/")) return true;
  if (pathname.startsWith("/blog")) return true;
  if (pathname.startsWith("/legal")) return true;
  if (pathname.startsWith("/pricing")) return true;
  if (pathname.startsWith("/auth")) return true;
  return false;
}

export function ThemeBootstrap({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const marketing = isMarketingPath(location.pathname);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    body.dataset.pkTheme = marketing ? "marketing" : "app";

    if (marketing) {
      const base = "#0a0a0f";
      const bg = [
        "radial-gradient(900px 600px at 14% 18%, rgba(124,58,237,0.28), rgba(124,58,237,0) 60%)",
        "radial-gradient(700px 540px at 80% 22%, rgba(56,189,248,0.20), rgba(56,189,248,0) 55%)",
        "radial-gradient(900px 620px at 60% 86%, rgba(236,72,153,0.18), rgba(236,72,153,0) 60%)",
        "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0) 36%)",
        base,
      ].join(", ");
      html.style.background = base;
      body.style.background = bg;
      body.style.backgroundAttachment = "fixed";
      body.style.color = "#f1f0f5";
    } else {
      html.style.background = "#0a0a0f";
      body.style.background = "#0a0a0f";
      body.style.color = "#f1f0f5";
    }

    return () => {
      body.dataset.pkTheme = "";
      html.style.background = "";
      body.style.background = "";
      body.style.backgroundAttachment = "";
      body.style.color = "";
    };
  }, [marketing]);

  return <>{children}</>;
}

