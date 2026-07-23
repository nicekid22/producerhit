import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const APP_SHELL_PREFIXES = [
  "/dashboard",
  "/library",
  "/explore",
  "/community",
  "/trending",
  "/settings",
  "/distribution",
  "/academy",
  "/voice-studio",
  "/sample-lab",
  "/loop/",
];

function isAppShellPath(pathname: string): boolean {
  return APP_SHELL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export function RouteFade({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const appShell = isAppShellPath(pathname);
  const initialMount = useRef(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Skip fade on initial mount — splash screen already masks loading
    if (initialMount.current) {
      initialMount.current = false;
      if (appShell) setVisible(true);
      return;
    }
    if (appShell) {
      setVisible(true);
      return;
    }
    setVisible(false);
    const t = window.setTimeout(() => setVisible(true), 16);
    return () => window.clearTimeout(t);
  }, [appShell, pathname]);

  if (appShell) {
    return <div className="opacity-100">{children}</div>;
  }

  return (
    <div
      className={cn(
        "transition-opacity duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {children}
    </div>
  );
}
