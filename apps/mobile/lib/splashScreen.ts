import { AppState, type AppStateStatus } from "react-native";
import * as SplashScreen from "expo-splash-screen";

let preventStarted = false;
let hidden = false;

function isForegroundActive(): boolean {
  return AppState.currentState === "active";
}

/** Call once at startup — only while app is in foreground (avoids iOS VC warning). */
function tryPreventAutoHide(): void {
  if (preventStarted || !isForegroundActive()) return;
  preventStarted = true;
  void SplashScreen.preventAutoHideAsync().catch(() => {
    preventStarted = false;
  });
}

tryPreventAutoHide();

AppState.addEventListener("change", (state: AppStateStatus) => {
  if (state === "active") tryPreventAutoHide();
});

/** Idempotent hide — safe on hot reload and background launches. */
export async function hideSplashOnce(): Promise<void> {
  if (hidden || !isForegroundActive()) return;
  tryPreventAutoHide();
  try {
    await SplashScreen.hideAsync();
  } catch {
    // Native splash already gone (dev refresh, notification cold start, etc.)
  } finally {
    hidden = true;
  }
}
