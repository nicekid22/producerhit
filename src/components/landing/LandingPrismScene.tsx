type Props = {
  spot: { x: number; y: number };
  reduceMotion: boolean;
};

export function LandingPrismScene({ spot, reduceMotion }: Props) {
  return (
    <div aria-hidden className="pk-prism-scene pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="pk-prism-vignette" />
      <div className="pk-prism-grain" />

      <div
        className="pk-prism-scene-spotlight absolute inset-0 transition-opacity duration-700"
        style={
          reduceMotion
            ? undefined
            : {
                background: `radial-gradient(720px circle at ${spot.x}% ${spot.y}%, rgba(157, 124, 255, 0.12), rgba(148, 163, 184, 0.05) 42%, transparent 70%)`,
              }
        }
      />

      <div className="pk-prism-aurora" />
    </div>
  );
}
