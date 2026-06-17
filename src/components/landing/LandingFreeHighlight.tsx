import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
};

/** Texte promo free — dégradé animé adapté au skin landing (Prism / Warm / Cloud). */
export function LandingFreeHighlight({ children, className, as: Tag = "span" }: Props) {
  return <Tag className={cn("pk-landing-free-shimmer", className)}>{children}</Tag>;
}
