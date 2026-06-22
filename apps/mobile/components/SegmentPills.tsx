import { PhPill } from "@/components/PhPill";

type Props<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export function SegmentPills<T extends string>({ value, options, onChange }: Props<T>) {
  return <PhPill value={value} options={options} onChange={(v) => onChange(v as T)} />;
}
