import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md";
};

/** Compact neo “hit” mark for the generate button loading state. */
export function GenElectricMark({ className, size = "sm" }: Props) {
  return (
    <span className={cn("pk-gen-electric-mark inline-flex items-center", size === "md" && "pk-gen-electric-mark--md", className)} aria-hidden>
      <span className="pk-gen-electric-mark__bolt pk-gen-electric-mark__bolt--a" />
      <span className="pk-gen-electric-mark__bolt pk-gen-electric-mark__bolt--b" />
      <span className="pk-gen-electric-mark__core">
        <span className="pk-gen-electric-mark__word">
          <span className="lowercase text-white/90">hit</span>
        </span>
      </span>
    </span>
  );
}
