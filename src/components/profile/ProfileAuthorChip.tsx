import { Link } from "react-router-dom";
import type { MouseEvent } from "react";
import type { AppLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { creatorTypeLabel, profilePath, type PublicProfileCard } from "@/lib/creatorProfile";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";

type ProfileAuthorChipProps = {
  author: PublicProfileCard | null | undefined;
  locale?: AppLocale;
  /** @deprecated use locale */
  isFr?: boolean;
  size?: "sm" | "md";
  className?: string;
  hideAvatar?: boolean;
  onClick?: (e: MouseEvent) => void;
};

export function ProfileAuthorChip({
  author,
  locale,
  isFr,
  size = "sm",
  className,
  hideAvatar = false,
  onClick,
}: ProfileAuthorChipProps) {
  if (!author?.username) return null;

  const resolvedLocale = locale ?? (isFr ? "fr" : "en");
  const type = creatorTypeLabel(author.creator_type, resolvedLocale);

  return (
    <Link
      to={profilePath(author.username)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2 py-1 text-left transition hover:border-cyan-400/40 hover:bg-black/50",
        size === "md" && "px-2.5 py-1.5",
        className,
      )}
    >
      {hideAvatar ? null : (
        <ProfileAvatar avatarId={author.avatar_id} username={author.username} size={size === "md" ? "sm" : "xs"} />
      )}
      <span className="min-w-0 truncate text-[11px] font-semibold text-white/90 hover:text-cyan-200">@{author.username}</span>
      {type ? (
        <span className="hidden truncate text-[10px] font-medium text-white/45 sm:inline">{type}</span>
      ) : null}
    </Link>
  );
}
