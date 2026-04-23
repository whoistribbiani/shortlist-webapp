import type { ButtonHTMLAttributes } from "react";

interface ActionIconGroupProps {
  filled: boolean;
  onSelect: () => void;
  onRemove: () => void;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

export function ActionIconGroup({ filled, onSelect, onRemove, dragHandleProps }: ActionIconGroupProps): JSX.Element {
  if (!filled) {
    return <div className="slot-actions slot-actions-empty" />;
  }

  return (
    <div className="slot-actions">
      <button
        type="button"
        className="pick-btn"
        data-testid="slot-select"
        aria-label="Seleziona player"
        title="Seleziona player"
        onClick={onSelect}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </button>

      <button
        type="button"
        className="clear-btn"
        data-testid="slot-remove"
        aria-label="Rimuovi player"
        title="Rimuovi player"
        onClick={onRemove}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M3 4.5h10M6.2 4.5V3.4a.8.8 0 0 1 .8-.8h2a.8.8 0 0 1 .8.8v1.1M5.2 6.1v6.1M8 6.1v6.1M10.8 6.1v6.1M4.5 4.5l.5 8.7a.9.9 0 0 0 .9.8h4.2a.9.9 0 0 0 .9-.8l.5-8.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        className="drag-handle"
        data-testid="slot-drag"
        aria-label="Sposta player"
        title="Sposta player"
        {...dragHandleProps}
      >
        <svg viewBox="0 0 10 14" aria-hidden="true">
          <circle cx="2" cy="2" r="1.3" />
          <circle cx="8" cy="2" r="1.3" />
          <circle cx="2" cy="7" r="1.3" />
          <circle cx="8" cy="7" r="1.3" />
          <circle cx="2" cy="12" r="1.3" />
          <circle cx="8" cy="12" r="1.3" />
        </svg>
      </button>
    </div>
  );
}
