import { useEffect } from "react";
import { cloudAccentToElement } from "@/lib/elementTheme";
import type { CloudAccent } from "@/stores/cloudAccentStore";

/** Active les styles portaled (dropdowns) et scrollbars globaux Cloud. */
export function useCloudHtmlClass(active: boolean, accent: CloudAccent) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (active) {
      root.classList.add("pk-cloud-active");
      body.dataset.pkCloudAccent = accent;
      body.dataset.pkElement = cloudAccentToElement(accent);
    } else {
      root.classList.remove("pk-cloud-active");
      delete body.dataset.pkCloudAccent;
      delete body.dataset.pkElement;
    }

    return () => {
      root.classList.remove("pk-cloud-active");
      delete body.dataset.pkCloudAccent;
      delete body.dataset.pkElement;
    };
  }, [active, accent]);
}
