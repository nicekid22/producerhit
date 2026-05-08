import { cn } from "@/lib/utils";

export type DropdownOption = { value: string; label: string; group?: string };

export function Dropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const groups = Array.from(new Set(options.map((o) => o.group).filter(Boolean))) as string[];
  const ungrouped = options.filter((o) => !o.group);

  return (
    <label className={cn("block", className)}>
      <div className="text-xs text-pk-muted">{label}</div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm text-pk-text outline-none focus:border-pk-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {ungrouped.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {groups.map((g) => (
          <optgroup key={g} label={g}>
            {options
              .filter((o) => o.group === g)
              .map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

