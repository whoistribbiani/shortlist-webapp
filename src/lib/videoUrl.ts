export function isValidVideoUrl(value: string): boolean {
  const raw = value.trim();
  if (!raw) {
    return false;
  }
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
