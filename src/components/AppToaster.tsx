import type { CSSProperties } from "react";
import { Toaster } from "react-hot-toast";
import { PkIconLoader } from "@/components/ui/PkIconLoader";

const toastBaseStyle: CSSProperties = {
  background: "rgba(8, 8, 14, 0.94)",
  color: "rgba(255, 255, 255, 0.92)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "14px",
  boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.04), 0 24px 64px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  fontSize: "0.875rem",
  fontWeight: 600,
  lineHeight: 1.45,
  padding: "12px 14px",
  maxWidth: "min(360px, calc(100vw - 2rem))",
};

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      containerClassName="pk-toast-container"
      toastOptions={{
        className: "pk-toast",
        duration: 4200,
        style: toastBaseStyle,
        success: {
          className: "pk-toast pk-toast--success",
          style: {
            ...toastBaseStyle,
            borderColor: "rgba(103, 195, 255, 0.32)",
            boxShadow:
              "0 0 0 1px rgba(103, 195, 255, 0.12), 0 24px 64px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
          },
          iconTheme: {
            primary: "#67c3ff",
            secondary: "rgba(8, 8, 14, 0.98)",
          },
        },
        error: {
          className: "pk-toast pk-toast--error",
          style: {
            ...toastBaseStyle,
            borderColor: "rgba(255, 79, 216, 0.28)",
            boxShadow:
              "0 0 0 1px rgba(255, 79, 216, 0.1), 0 24px 64px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
          },
          iconTheme: {
            primary: "#ff4fd8",
            secondary: "rgba(8, 8, 14, 0.98)",
          },
        },
        loading: {
          className: "pk-toast pk-toast--loading",
          style: toastBaseStyle,
          icon: <PkIconLoader icon="generator" size="xs" inline />,
        },
      }}
    />
  );
}
