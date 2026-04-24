import type { ReactNode } from "react";

import genoaLogo from "../assets/genoa-logo.png";
import type { BoardMeta } from "../types";

type SaveState = "idle" | "saving" | "saved" | "error";

interface BoardShellProps {
  meta: BoardMeta;
  saveState: SaveState;
  onLogout: () => void;
  onMetaChange: (patch: Partial<BoardMeta>) => void;
  children: ReactNode;
}

function saveStateLabel(saveState: SaveState): string {
  switch (saveState) {
    case "saving":
      return "Salvataggio in corso...";
    case "saved":
      return "Salvato";
    case "error":
      return "Errore salvataggio";
    default:
      return "Pronto";
  }
}

export function BoardShell({ meta, saveState, onLogout, onMetaChange, children }: BoardShellProps): JSX.Element {
  return (
    <div className="board-shell">
      <header className="board-header">
        <div className="brand-block">
          <img className="brand-logo" src={genoaLogo} alt="Genoa CFC" />
          <div>
            <h1>Scouting ShortList</h1>
            <p className="subtitle">Board condivisa via link privato</p>
          </div>
        </div>

        <div className="meta-fields">
          <label>
            Titolo
            <input
              value={meta.title}
              onChange={(event) => onMetaChange({ title: event.target.value })}
              placeholder="Scouting ShortList"
            />
          </label>
          <label>
            Season ID
            <input
              value={meta.seasonId}
              onChange={(event) => onMetaChange({ seasonId: event.target.value })}
              placeholder="2026"
            />
          </label>
        </div>
      </header>

      <div className="board-status">
        <span className={`save-pill save-${saveState}`}>{saveStateLabel(saveState)}</span>
        <div className="status-actions">
          <span className="token-pill">Accesso protetto</span>
          <button type="button" className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <main>{children}</main>
    </div>
  );
}
