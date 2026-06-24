export type AIOrbState = "idle" | "active";

export type AIOrbProps = {
  size: number;
  state?: AIOrbState;
  /** Freeze animation (e.g. tab bar when unfocused). */
  paused?: boolean;
};
