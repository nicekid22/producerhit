import { cn } from "@/lib/utils";
import { avatarPreset } from "@/lib/creatorProfile";

type ProfileAvatarProps = {
  avatarId?: number | null;
  username?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const SIZE = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-xl",
} as const;

export function ProfileAvatar({ avatarId, username, size = "md", className }: ProfileAvatarProps) {
  const preset = avatarPreset(typeof avatarId === "number" ? avatarId : 1);
  const fallback = (username?.trim() || "?").slice(0, 1).toUpperCase();

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-black text-white shadow-[0_0_20px_rgba(124,58,237,0.18)]",
        preset.gradient,
        SIZE[size],
        className,
      )}
      aria-hidden
    >
      <span>{preset.glyph || fallback}</span>
    </div>
  );
}
