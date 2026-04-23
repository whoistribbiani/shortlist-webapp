import type { ReactNode } from "react";

import type { BoardMeta } from "../types";

type SaveState = "idle" | "saving" | "saved" | "error";

interface BoardShellProps {
  meta: BoardMeta;
  saveState: SaveState;
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

export function BoardShell({ meta, saveState, onMetaChange, children }: BoardShellProps): JSX.Element {
  return (
    <div className="board-shell">
      <header className="board-header">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            G
          </div>
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
          <label>
            Gender
            <select
              value={meta.gender}
              onChange={(event) => onMetaChange({ gender: event.target.value as BoardMeta["gender"] })}
            >
              <option value="male">male</option>
              <option value="female">female</option>
            </select>
          </label>
        </div>
      </header>

      <div className="board-status">
        <span className={`save-pill save-${saveState}`}>{saveStateLabel(saveState)}</span>
        <span className="token-pill">Token: {meta.shareToken}</span>
      </div>

      <main>{children}</main>
    </div>
  );
}
