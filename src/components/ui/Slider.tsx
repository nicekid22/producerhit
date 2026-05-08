import { cn } from "@/lib/utils";

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  rightLabel,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  rightLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("", className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-pk-muted">{label}</div>
        {rightLabel ? <div className="text-xs text-pk-muted">{rightLabel}</div> : null}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-pk-accent"
      />
    </div>
  );
}

