/** Logs only in development builds — keeps production console clean. */
export function devWarn(message: string, ...args: unknown[]): void {
  if (__DEV__) {
    console.warn(message, ...args);
  }
}

export function devError(message: string, ...args: unknown[]): void {
  if (__DEV__) {
    console.error(message, ...args);
  }
}
