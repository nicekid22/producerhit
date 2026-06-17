import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  align?: "center" | "left";
  id?: string;
  className?: string;
};

export function LandingSectionHead({ eyebrow, title, lead, align = "center", id, className }: Props) {
  return (
    <div className={cn("pk-landing-apple-head", align === "left" && "pk-landing-apple-head--left", className)}>
      {eyebrow ? <p className="pk-landing-apple-head__eyebrow">{eyebrow}</p> : null}
      <h2 id={id} className="pk-landing-apple-head__title">
        {title}
      </h2>
      {lead ? <p className="pk-landing-apple-head__lead">{lead}</p> : null}
    </div>
  );
}
