import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function RouteFade({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = window.setTimeout(() => setVisible(true), 16);
    return () => window.clearTimeout(t);
  }, [location.key]);

  return (
    <div
      className={cn(
        "transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {children}
    </div>
  );
}
