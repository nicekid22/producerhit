import type { AppLocale } from "@/i18n/config";
import { pickLocalized } from "@/i18n/resolve";
import type { BlogAuthorId } from "./types";

export type BlogAuthor = {
  id: BlogAuthorId;
  name: string;
  roleEn: string;
  roleFr: string;
  bioEn: string;
  bioFr: string;
  avatarUrl: string;
  url: string;
};

export const BLOG_AUTHORS: BlogAuthor[] = [
  {
    id: "producerhit-team",
    name: "ProducerHit Team",
    roleEn: "AI Music Studio",
    roleFr: "Studio musique IA",
    bioEn: "Guides and workflows from the ProducerHit studio — built for beat makers and song creators.",
    bioFr: "Guides et workflows depuis le studio ProducerHit — pensés pour beatmakers et auteurs.",
    avatarUrl: "/icon-512.png",
    url: "https://www.producerhit.com",
  },
  {
    id: "producerhit-editorial",
    name: "ProducerHit Editorial",
    roleEn: "SEO & Producer Education",
    roleFr: "SEO & éducation producteur",
    bioEn: "Deep dives on AI music SEO, genre prompts, and release-ready production tactics.",
    bioFr: "Analyses SEO musique IA, prompts genre et tactiques de production release-ready.",
    avatarUrl: "/icon-512.png",
    url: "https://www.producerhit.com/blog",
  },
];

const byId = new Map(BLOG_AUTHORS.map((a) => [a.id, a]));

export function getBlogAuthor(id: BlogAuthorId): BlogAuthor {
  return byId.get(id) ?? BLOG_AUTHORS[0]!;
}

export function blogAuthorRole(author: BlogAuthor, locale: AppLocale): string {
  return pickLocalized(locale, { en: author.roleEn, fr: author.roleFr });
}

export function blogAuthorBio(author: BlogAuthor, locale: AppLocale): string {
  return pickLocalized(locale, { en: author.bioEn, fr: author.bioFr });
}
