const STORAGE_KEY = "pk-cloud-contrast-debug";

/** Audit contraste Cloud — localStorage ou ?cloudContrast=1 */
export function isCloudContrastDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const q = params.get("cloudContrast");
  if (q === "1") return true;
  if (q === "0") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function setCloudContrastDebug(enabled: boolean): void {
  if (typeof window === "undefined") return;
  if (enabled) localStorage.setItem(STORAGE_KEY, "1");
  else localStorage.removeItem(STORAGE_KEY);
  applyCloudContrastDebugClass();
}

export function applyCloudContrastDebugClass(): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("pk-cloud-contrast-debug", isCloudContrastDebugEnabled());
}
