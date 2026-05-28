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
      // Gradients bas — évite la bande violette horizontale derrière le header transparent.
      const bg = [
        "radial-gradient(920px 640px at 12% 58%, rgba(124,58,237,0.2), rgba(124,58,237,0) 58%)",
        "radial-gradient(760px 560px at 88% 52%, rgba(56,189,248,0.14), rgba(56,189,248,0) 55%)",
        "radial-gradient(900px 620px at 50% 96%, rgba(236,72,153,0.12), rgba(236,72,153,0) 58%)",
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

