/** Emil-style motion tokens — ease-out, fast press feedback */
export const MOTION_EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const motionTokens = {
  pressScale: 0.97,
  pressDuration: 120,
  modalDuration: 220,
  tabDuration: 0,
  playerDuration: 280,
  spring: { damping: 20, stiffness: 240, mass: 0.75 },
} as const;
