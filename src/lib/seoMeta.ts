export function setDocumentMeta(nameOrProp: string, value: string, kind: "name" | "property") {
  if (typeof document === "undefined") return;
  const selector = kind === "name" ? `meta[name="${nameOrProp}"]` : `meta[property="${nameOrProp}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    if (kind === "name") el.setAttribute("name", nameOrProp);
    else el.setAttribute("property", nameOrProp);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

export function setLoopOpenGraph(opts: {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
}) {
  document.title = opts.title;
  setDocumentMeta("description", opts.description, "name");
  setDocumentMeta("og:type", "music.song", "property");
  setDocumentMeta("og:site_name", "ProducerHit", "property");
  setDocumentMeta("og:title", opts.title, "property");
  setDocumentMeta("og:description", opts.description, "property");
  setDocumentMeta("og:url", opts.url, "property");
  setDocumentMeta("og:image", opts.imageUrl, "property");
  setDocumentMeta("twitter:card", "summary_large_image", "name");
  setDocumentMeta("twitter:title", opts.title, "name");
  setDocumentMeta("twitter:description", opts.description, "name");
  setDocumentMeta("twitter:image", opts.imageUrl, "name");
}

export function buildOgLoopImageUrl(opts: { id: string; title: string; genre?: string; bpm?: number | null }) {
  const origin = "https://www.producerhit.com";
  const params = new URLSearchParams();
  params.set("id", opts.id);
  params.set("title", opts.title.slice(0, 80));
  if (opts.genre) params.set("genre", opts.genre.slice(0, 40));
  if (typeof opts.bpm === "number" && opts.bpm > 0) params.set("bpm", String(opts.bpm));
  return `${origin}/api/og-loop?${params.toString()}`;
}
