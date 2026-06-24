import { AppState, type AppStateStatus } from "react-native";

let boostUntilMs = 0;

/** Force faster job polling after foreground / tab focus during generation. */
export function boostGenerationPolling(durationMs = 45_000): void {
  boostUntilMs = Date.now() + durationMs;
}

export function generationPollIntervalMs(): number {
  return Date.now() < boostUntilMs ? 1_200 : 1_800;
}

let attached = false;

export function attachGenerationPollingAppState(): void {
  if (attached) return;
  attached = true;
  AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active") boostGenerationPolling();
  });
}
