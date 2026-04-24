import { useEffect, useMemo, useState } from "react";

import App from "./App";
import { LoginPage } from "./components/LoginPage";
import { createApiClient } from "./lib/apiClient";
import { clearAuthToken, getAuthToken, setAuthToken } from "./lib/authSession";

interface RootAppProps {
  apiBaseUrl: string;
}

function normalizePath(pathname: string): string {
  if (!pathname) {
    return "/";
  }
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function resolveBasePath(): string {
  const raw = import.meta.env.BASE_URL || "/";
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  if (normalized === "/") {
    return "/";
  }
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function appRoute(basePath: string, relativePath: string): string {
  const cleanRelative = relativePath.replace(/^\/+/, "");
  if (basePath === "/") {
    return cleanRelative ? `/${cleanRelative}` : "/";
  }
  return cleanRelative ? `${basePath}/${cleanRelative}` : basePath;
}

function navigate(pathname: string): void {
  const current = normalizePath(window.location.pathname);
  const target = normalizePath(pathname);
  if (current === target) {
    return;
  }
  window.history.pushState({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function RootApp({ apiBaseUrl }: RootAppProps): JSX.Element {
  const basePath = useMemo(() => resolveBasePath(), []);
  const loginPath = useMemo(() => appRoute(basePath, "login"), [basePath]);
  const homePath = useMemo(() => appRoute(basePath, ""), [basePath]);

  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname || "/"));
  const [authLoading, setAuthLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAuthToken());

  const api = useMemo(() => createApiClient(apiBaseUrl, getAuthToken), [apiBaseUrl]);

  useEffect(() => {
    const onPopState = () => setPathname(normalizePath(window.location.pathname || "/"));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthReady(true);
      return;
    }
    let cancelled = false;
    setAuthLoading(true);
    void api
      .validateAuth()
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (!result.valid) {
          clearAuthToken();
          setIsAuthenticated(false);
          navigate(loginPath);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearAuthToken();
          setIsAuthenticated(false);
          navigate(loginPath);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAuthLoading(false);
          setAuthReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, isAuthenticated, loginPath]);

  useEffect(() => {
    if (!authReady || authLoading) {
      return;
    }
    if (!isAuthenticated && pathname !== normalizePath(loginPath)) {
      navigate(loginPath);
    } else if (isAuthenticated && pathname !== normalizePath(homePath)) {
      navigate(homePath);
    }
  }, [authLoading, authReady, homePath, isAuthenticated, loginPath, pathname]);

  if (!authReady || authLoading) {
    return <div className="login-loading">Verifica sessione...</div>;
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        loading={authLoading}
        onSubmit={async (password: string) => {
          setAuthLoading(true);
          try {
            const result = await api.login(password);
            setAuthToken(result.token);
            setIsAuthenticated(true);
            navigate(homePath);
          } finally {
            setAuthLoading(false);
          }
        }}
      />
    );
  }

  return (
    <App
      apiBaseUrl={apiBaseUrl}
      api={api}
      onLogout={() => {
        void api.logout().catch(() => undefined);
        clearAuthToken();
        setIsAuthenticated(false);
        navigate(loginPath);
      }}
    />
  );
}
