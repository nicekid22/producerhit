/** @deprecated Pinterest retiré — covers communauté = URL persistée uniquement. */
export function setDisplayCoverQueuePaused(_value: boolean): void {
  // no-op
}

/** @deprecated */
export function enqueueDisplayCover(
  _loop: unknown,
  _onUrl: (loopId: string, url: string) => void,
): void {
  // no-op — plus de fetch Pinterest en arrière-plan
}

/** @deprecated */
export function scheduleDisplayCovers(
  _loops: unknown[],
  _onUrl: (loopId: string, url: string) => void,
): void {
  // no-op
}
