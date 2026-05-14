import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  return <>{children}</>;
}
