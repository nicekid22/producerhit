import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CommunityPulseItem } from "@/lib/communityPulse";
import { cn } from "@/lib/utils";

type Props = {
  items: CommunityPulseItem[];
  isFr: boolean;
};

export function CommunityPulseStrip({ items, isFr }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const visible = useMemo(() => items.filter(Boolean), [items]);

  useEffect(() => {
    if (visible.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % visible.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [visible.length]);

  if (!visible.length) return null;

  const item = visible[activeIdx % visible.length];
  const text = isFr ? item.textFr : item.textEn;

  const body = (
    <>
      <span className="pk-hub-pulse__emoji" aria-hidden>
        {item.emoji}
      </span>
      <span className="pk-hub-pulse__text">{text}</span>
    </>
  );

  return (
    <section className="pk-hub-pulse" aria-live="polite" aria-label={isFr ? "Actu du flux" : "Feed pulse"}>
      <div className="pk-hub-pulse__track">
        <span className="pk-hub-pulse__live">{isFr ? "LIVE" : "LIVE"}</span>
        {item.href ? (
          <Link
            to={item.href}
            className={cn(
              "pk-hub-pulse__item pk-hub-pulse__item--link",
              item.id === "live-chat" && "pk-hub-pulse__item--chat",
            )}
          >
            {body}
          </Link>
        ) : (
          <div className={cn("pk-hub-pulse__item", item.id === "live-chat" && "pk-hub-pulse__item--chat")}>{body}</div>
        )}
        {visible.length > 1 ? (
          <div className="pk-hub-pulse__dots" aria-hidden>
            {visible.slice(0, 6).map((dot, i) => (
              <span key={dot.id} className={i === activeIdx % visible.length ? "is-active" : ""} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
