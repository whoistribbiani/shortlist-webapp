const SCOUTASTIC_ORIGIN = "https://genoacfc.scoutastic.com";

export function resolveScoutasticMediaUrl(value: string | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) {
    return "";
  }

  try {
    return new URL(raw).toString();
  } catch {
    try {
      return new URL(raw, `${SCOUTASTIC_ORIGIN}/`).toString();
    } catch {
      return "";
    }
  }
}

function joinPath(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function toAbsoluteUrl(urlOrPath: string): string {
  try {
    return new URL(urlOrPath).toString();
  } catch {
    const fallbackBase =
      typeof window !== "undefined" && /^https?:/i.test(window.location.href) ? window.location.href : "http://localhost/";
    return new URL(urlOrPath, fallbackBase).toString();
  }
}

export function buildPlayerImageProxyUrl(apiBaseUrl: string, sourceUrl: string): string {
  const source = sourceUrl.trim();
  if (!source) {
    return "";
  }
  const endpoint = new URL(toAbsoluteUrl(joinPath(apiBaseUrl, "/catalog/player-image")));
  endpoint.searchParams.set("src", source);
  return endpoint.toString();
}
