import { Toaster } from "react-hot-toast";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { TOAST_DURATIONS } from "@/lib/appToast";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      containerClassName="pk-toast-container"
      toastOptions={{
        className: "pk-toast",
        duration: TOAST_DURATIONS.default,
        success: {
          className: "pk-toast pk-toast--success",
        },
        error: {
          className: "pk-toast pk-toast--error",
        },
        loading: {
          className: "pk-toast pk-toast--loading",
          icon: <PkIconLoader icon="generator" size="xs" inline />,
        },
      }}
    />
  );
}
