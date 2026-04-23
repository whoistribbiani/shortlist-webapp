function randomToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  }
  return Math.random().toString(36).slice(2, 22);
}

export function ensureShareTokenInUrl(): string {
  const url = new URL(window.location.href);
  const existing = (url.searchParams.get("token") ?? "").trim();
  if (existing) {
    return existing;
  }
  const token = randomToken();
  url.searchParams.set("token", token);
  window.history.replaceState({}, "", url.toString());
  return token;
}
