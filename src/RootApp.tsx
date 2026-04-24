import { useEffect, useMemo, useState } from "react";

import App from "./App";
import { LoginPage } from "./components/LoginPage";
import { createApiClient } from "./lib/apiClient";
import { clearAuthToken, getAuthToken, setAuthToken } from "./lib/authSession";

interface RootAppProps {
  apiBaseUrl: string;
}

function navigate(pathname: string): void {
  if (window.location.pathname === pathname) {
    return;
  }
  window.history.pushState({}, "", pathname);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function RootApp({ apiBaseUrl }: RootAppProps): JSX.Element {
  const [pathname, setPathname] = useState(() => window.location.pathname || "/");
  const [authLoading, setAuthLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAuthToken());

  const api = useMemo(() => createApiClient(apiBaseUrl, getAuthToken), [apiBaseUrl]);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || "/");
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
          navigate("/login");
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearAuthToken();
          setIsAuthenticated(false);
          navigate("/login");
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
  }, [api, isAuthenticated]);

  useEffect(() => {
    if (!authReady || authLoading) {
      return;
    }
    if (!isAuthenticated && pathname !== "/login") {
      navigate("/login");
    } else if (isAuthenticated && pathname !== "/") {
      navigate("/");
    }
  }, [authLoading, authReady, isAuthenticated, pathname]);

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
            navigate("/");
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
        navigate("/login");
      }}
    />
  );
}
