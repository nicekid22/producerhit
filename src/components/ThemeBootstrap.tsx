import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function isMarketingPath(pathname: string) {
  if (pathname === "/") return true;
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
      html.style.background = "#ffffff";
      body.style.background = "#ffffff";
      body.style.color = "#1a1a2e";
    } else {
      html.style.background = "#0a0a0f";
      body.style.background = "#0a0a0f";
      body.style.color = "#f1f0f5";
    }

    return () => {
      body.dataset.pkTheme = "";
      html.style.background = "";
      body.style.background = "";
      body.style.color = "";
    };
  }, [marketing]);

  return <>{children}</>;
}

