export function resolveDefaultSeasonId(now: Date): string {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month === 1) {
    return String(year);
  }
  return String(year - 1);
}

export function resolveSeasonIdFromEnv(envValue: string | undefined, now: Date): string {
  const explicit = (envValue ?? "").trim();
  if (explicit) {
    return explicit;
  }
  return resolveDefaultSeasonId(now);
}
