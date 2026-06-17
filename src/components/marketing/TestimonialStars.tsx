import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function TestimonialStars({ className }: { className?: string }) {
  return (
    <div className={cn("pk-testimonial-stars inline-flex gap-0.5", className)} aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3 w-3 fill-amber-300/90 text-amber-300/90" aria-hidden />
      ))}
    </div>
  );
}
