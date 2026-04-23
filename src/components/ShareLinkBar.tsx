import { useEffect, useState } from "react";

import { copyTextToClipboard } from "../lib/clipboard";

interface ShareLinkBarProps {
  shareLink: string;
}

export function ShareLinkBar({ shareLink }: ShareLinkBarProps): JSX.Element {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }
    const timer = window.setTimeout(() => setCopyState("idle"), 1500);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  return (
    <div className="share-link-bar">
      <div className="share-link-input">
        <span className="share-link-label">Link privato:</span>
        <input value={shareLink} readOnly aria-label="Link privato" />
      </div>
      <button
        type="button"
        className="copy-link-btn"
        data-testid="copy-link-btn"
        onClick={() => {
          void copyTextToClipboard(shareLink)
            .then(() => {
              setCopyState("copied");
            })
            .catch(() => {
              setCopyState("error");
            });
        }}
      >
        {copyState === "copied" ? "Copiato" : copyState === "error" ? "Errore copia" : "Copia link"}
      </button>
    </div>
  );
}
