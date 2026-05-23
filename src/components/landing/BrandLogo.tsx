import { Link } from "react-router-dom";

type Props = {
  className?: string;
  compact?: boolean;
};

export function BrandLogo({ className = "", compact = false }: Props) {
  return (
    <Link to="/" className={["group inline-flex items-center", className].join(" ")}>
      <span
        className={[
          "font-semibold tracking-tight text-white transition-opacity group-hover:opacity-90",
          compact ? "text-sm" : "text-base",
        ].join(" ")}
      >
        <span className="lowercase">producer</span>
        <span className="lowercase pk-prism-holo-text">hit</span>
      </span>
    </Link>
  );
}
