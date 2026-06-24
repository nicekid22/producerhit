/**
 * LabelGrid REST API client (server-side only — Edge Functions).
 * Docs: https://api.labelgrid.com/docs/api
 */

export type LabelGridConfig = {
  baseUrl: string;
  apiToken: string;
};

export type LabelGridArtist = {
  id: number | string;
  name?: string;
};

export type LabelGridTrack = {
  id: number | string;
  title?: string;
  isrc?: string;
};

export type LabelGridRelease = {
  id: number | string;
  title?: string;
  upc?: string;
  status?: string;
};

export type LabelGridGenre = {
  id: number | string;
  name?: string;
};

export type LabelGridDistroOutlet = {
  id?: number | string;
  slug?: string;
  name?: string;
};

export type LabelGridReviewIssue = {
  id?: number | string;
  message?: string;
  field?: string;
  severity?: string;
};

function envLabelGridConfig(): LabelGridConfig {
  const sandbox = Deno.env.get("LABELGRID_USE_SANDBOX") === "1";
  const baseUrl = (
    sandbox
      ? Deno.env.get("LABELGRID_API_BASE_URL_SANDBOX")
      : Deno.env.get("LABELGRID_API_BASE_URL")
  )?.trim() || "https://api.labelgrid.com/api/public";
  const apiToken = (
    sandbox
      ? Deno.env.get("LABELGRID_API_TOKEN_SANDBOX")
      : Deno.env.get("LABELGRID_API_TOKEN")
  )?.trim() || "";
  if (!apiToken) {
    throw new Error("LABELGRID_API_TOKEN is not configured");
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiToken };
}

export function getLabelGridConfig(): LabelGridConfig {
  return envLabelGridConfig();
}

async function lgRequest<T>(
  cfg: LabelGridConfig,
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const url = `${cfg.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiToken}`,
    Accept: "application/json",
    ...extraHeaders,
  };
  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) {
      payload = body as BodyInit;
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }
  const res = await fetch(url, { method, headers, body: payload });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const msg =
      typeof json === "object" && json && "message" in json
        ? String((json as { message: unknown }).message)
        : text.slice(0, 500) || `LabelGrid ${res.status}`;
    throw new Error(`LabelGrid ${method} ${path}: ${msg}`);
  }
  return json as T;
}

export async function listGenres(cfg?: LabelGridConfig): Promise<LabelGridGenre[]> {
  const c = cfg ?? getLabelGridConfig();
  const data = await lgRequest<{ data?: LabelGridGenre[] } | LabelGridGenre[]>(c, "GET", "/genres");
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
}

export async function resolveGenreIdByName(
  genreName: string,
  cfg?: LabelGridConfig,
): Promise<string | null> {
  const genres = await listGenres(cfg);
  const norm = genreName.trim().toLowerCase();
  const hit = genres.find((g) => (g.name ?? "").trim().toLowerCase() === norm);
  if (hit?.id != null) return String(hit.id);
  const partial = genres.find((g) => (g.name ?? "").toLowerCase().includes(norm));
  return partial?.id != null ? String(partial.id) : null;
}

export async function createArtist(
  name: string,
  cfg?: LabelGridConfig,
): Promise<LabelGridArtist> {
  const c = cfg ?? getLabelGridConfig();
  const data = await lgRequest<{ data?: LabelGridArtist } | LabelGridArtist>(c, "POST", "/artists", { name });
  if (data && typeof data === "object" && "data" in data && data.data) return data.data;
  return data as LabelGridArtist;
}

export async function createTrack(
  input: { title: string; artistId: string | number; isrc?: string },
  cfg?: LabelGridConfig,
): Promise<LabelGridTrack> {
  const c = cfg ?? getLabelGridConfig();
  const body = {
    title: input.title,
    artist_id: input.artistId,
    ...(input.isrc ? { isrc: input.isrc } : {}),
  };
  const data = await lgRequest<{ data?: LabelGridTrack } | LabelGridTrack>(c, "POST", "/tracks", body);
  if (data && typeof data === "object" && "data" in data && data.data) return data.data;
  return data as LabelGridTrack;
}

export async function uploadTrackFile(
  trackId: string | number,
  fileType: string,
  bytes: Uint8Array,
  contentType: string,
  cfg?: LabelGridConfig,
): Promise<void> {
  const c = cfg ?? getLabelGridConfig();
  const uploadMeta = await lgRequest<{ upload_url?: string; url?: string }>(
    c,
    "POST",
    `/tracks/${trackId}/files/${fileType}/upload-url`,
    {},
  );
  const uploadUrl = uploadMeta.upload_url ?? uploadMeta.url;
  if (!uploadUrl) {
    await lgRequest(c, "PUT", `/tracks/${trackId}/files/${fileType}`, bytes, {
      "Content-Type": contentType,
    });
    return;
  }
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: bytes,
  });
  if (!putRes.ok) {
    throw new Error(`Track file upload failed: ${putRes.status}`);
  }
}

export async function createRelease(
  input: {
    title: string;
    artistId: string | number;
    trackIds: Array<string | number>;
    releaseDate?: string;
    genreId?: string;
    languageCode?: string;
    explicit?: boolean;
    releaseType?: string;
  },
  cfg?: LabelGridConfig,
): Promise<LabelGridRelease> {
  const c = cfg ?? getLabelGridConfig();
  const body: Record<string, unknown> = {
    title: input.title,
    artist_id: input.artistId,
    track_ids: input.trackIds,
    release_type: input.releaseType ?? "single",
    language: input.languageCode ?? "en",
    explicit: input.explicit ?? false,
  };
  if (input.releaseDate) body.release_date = input.releaseDate;
  if (input.genreId) body.genre_id = input.genreId;
  const data = await lgRequest<{ data?: LabelGridRelease } | LabelGridRelease>(c, "POST", "/releases", body);
  if (data && typeof data === "object" && "data" in data && data.data) return data.data;
  return data as LabelGridRelease;
}

export async function uploadReleaseCover(
  releaseId: string | number,
  bytes: Uint8Array,
  contentType: string,
  cfg?: LabelGridConfig,
): Promise<void> {
  const c = cfg ?? getLabelGridConfig();
  const form = new FormData();
  const ext = contentType.includes("png") ? "png" : "jpg";
  form.append("photo", new Blob([bytes], { type: contentType }), `cover.${ext}`);
  await lgRequest(c, "POST", `/releases/${releaseId}/photo`, form);
}

export async function validateRelease(
  releaseId: string | number,
  cfg?: LabelGridConfig,
): Promise<Record<string, unknown>> {
  const c = cfg ?? getLabelGridConfig();
  return await lgRequest<Record<string, unknown>>(c, "POST", `/releases/${releaseId}/validate`, {});
}

export async function distributeRelease(
  releaseId: string | number,
  outletIds?: Array<string | number>,
  cfg?: LabelGridConfig,
): Promise<Record<string, unknown>> {
  const c = cfg ?? getLabelGridConfig();
  const body = outletIds?.length ? { outlet_ids: outletIds } : {};
  return await lgRequest<Record<string, unknown>>(c, "POST", `/releases/${releaseId}/distribute`, body);
}

export async function getRelease(
  releaseId: string | number,
  cfg?: LabelGridConfig,
): Promise<LabelGridRelease & Record<string, unknown>> {
  const c = cfg ?? getLabelGridConfig();
  const data = await lgRequest<{ data?: LabelGridRelease } | LabelGridRelease>(
    c,
    "GET",
    `/releases/${releaseId}`,
  );
  if (data && typeof data === "object" && "data" in data && data.data) {
    return data.data as LabelGridRelease & Record<string, unknown>;
  }
  return data as LabelGridRelease & Record<string, unknown>;
}

export async function listReviewIssues(
  releaseId: string | number,
  cfg?: LabelGridConfig,
): Promise<LabelGridReviewIssue[]> {
  const c = cfg ?? getLabelGridConfig();
  const data = await lgRequest<{ data?: LabelGridReviewIssue[] } | LabelGridReviewIssue[]>(
    c,
    "GET",
    `/review-issues?release_id=${releaseId}`,
  );
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
}

export async function listDistroOutlets(cfg?: LabelGridConfig): Promise<LabelGridDistroOutlet[]> {
  const c = cfg ?? getLabelGridConfig();
  const data = await lgRequest<{ data?: LabelGridDistroOutlet[] } | LabelGridDistroOutlet[]>(
    c,
    "GET",
    "/distro-outlets",
  );
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
}

export async function listDistroQueue(cfg?: LabelGridConfig): Promise<Record<string, unknown>[]> {
  const c = cfg ?? getLabelGridConfig();
  const data = await lgRequest<{ data?: Record<string, unknown>[] } | Record<string, unknown>[]>(
    c,
    "GET",
    "/queues/distro",
  );
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
}

export async function getAnalyticsStreams(
  params: { releaseId?: string; from?: string; to?: string },
  cfg?: LabelGridConfig,
): Promise<Record<string, unknown>> {
  const c = cfg ?? getLabelGridConfig();
  const qs = new URLSearchParams();
  if (params.releaseId) qs.set("release_id", params.releaseId);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  const q = qs.toString();
  return await lgRequest<Record<string, unknown>>(c, "GET", `/analytics/streams${q ? `?${q}` : ""}`);
}

export async function verifyWebhookSignatureAsync(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const hex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const provided = signatureHeader.replace(/^sha256=/i, "").trim();
    return hex === provided || signatureHeader === provided;
  } catch {
    return false;
  }
}
