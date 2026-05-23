import type { ReactNode } from "react";

export function PrismStat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: "cyan" | "violet" | "chrome";
}) {
  return (
    <div className={`pk-prism-stat${accent ? ` pk-prism-stat--${accent}` : ""}`}>
      {icon ? <div className="pk-prism-stat__icon">{icon}</div> : null}
      <div className="pk-prism-stat__value">{value}</div>
      <div className="pk-prism-stat__label">{label}</div>
    </div>
  );
}
