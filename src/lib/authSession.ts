const AUTH_TOKEN_KEY = "shortlist_auth_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.sessionStorage.getItem(AUTH_TOKEN_KEY);
  return value && value.trim() ? value : null;
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
}
