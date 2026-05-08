import { Toaster } from "react-hot-toast";
import { useLocation } from "react-router-dom";

function isMarketingPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname.startsWith("/home")) return true;
  if (pathname.startsWith("/pricing")) return true;
  if (pathname.startsWith("/auth")) return true;
  return false;
}

export function AppToaster() {
  const location = useLocation();
  const marketing = isMarketingPath(location.pathname);

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: marketing
          ? {
              background: "#ffffff",
              color: "#1a1a2e",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
            }
          : {
              background: "#111118",
              color: "#f1f0f5",
              border: "1px solid #2d2d3d",
              borderRadius: "10px",
            },
      }}
    />
  );
}

