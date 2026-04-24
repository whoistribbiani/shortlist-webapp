import { useState } from "react";

interface LoginPageProps {
  onSubmit: (password: string) => Promise<void>;
  loading: boolean;
  externalError?: string;
}

export function LoginPage({ onSubmit, loading, externalError = "" }: LoginPageProps): JSX.Element {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const displayError = error || externalError;

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Accesso ShortList</h1>
        <p>Inserisci la password fornita dal proprietario dell&apos;app.</p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = password.trim();
            if (!value) {
              setError("Inserisci una password.");
              return;
            }
            setError("");
            void onSubmit(value).catch((err: unknown) => {
              const message = err instanceof Error ? err.message : "Login non riuscito";
              setError(message || "Login non riuscito");
            });
          }}
        >
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="Inserisci password"
              disabled={loading}
            />
          </label>

          {displayError && <p className="login-error">{displayError}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}
