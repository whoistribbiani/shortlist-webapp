import { useEffect, useMemo, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { buildPlayerImageProxyUrl } from "../lib/scoutasticMedia";
import type { SlotEntry } from "../types";

interface SlotCardProps {
  apiBaseUrl: string;
  slotKey: string;
  slot: SlotEntry;
  duplicateBlocked: boolean;
  onPatch: (slotKey: string, patch: Partial<SlotEntry>) => void;
  onClearSlot: (slotKey: string) => void;
  onOpenPicker: (slotKey: string) => void;
}

function isPopulated(slot: SlotEntry): boolean {
  return !!(
    slot.playerId ||
    slot.player ||
    slot.name ||
    slot.club ||
    slot.age ||
    slot.expiring ||
    slot.playerImageUrl ||
    slot.videoUrl
  );
}

function scoutasticPlayerUrl(internalId: string): string {
  return `https://genoacfc.scoutastic.com/#/player/${encodeURIComponent(internalId)}`;
}

export function SlotCard({
  apiBaseUrl,
  slotKey,
  slot,
  duplicateBlocked,
  onPatch,
  onClearSlot,
  onOpenPicker
}: SlotCardProps): JSX.Element {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: slotKey });
  const filled = isPopulated(slot);
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: slotKey,
    disabled: !filled
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const cardClassName = [
    "slot-card",
    filled ? "slot-filled" : "slot-empty",
    isOver ? "slot-over" : "",
    isDragging ? "slot-dragging" : "",
    duplicateBlocked ? "slot-error" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const canLinkProfile = !!slot.playerInternalId;
  const [imgError, setImgError] = useState(false);
  const proxyImageUrl = useMemo(
    () => buildPlayerImageProxyUrl(apiBaseUrl, slot.playerImageUrl),
    [apiBaseUrl, slot.playerImageUrl]
  );

  useEffect(() => {
    setImgError(false);
  }, [slot.playerImageUrl]);

  return (
    <div ref={setDropRef} className="slot-drop-zone">
      <article ref={setDragRef} style={style} className={cardClassName} data-state={filled ? "filled" : "empty"}>
        <div className="slot-actions">
          <button
            type="button"
            className="pick-btn"
            data-testid="slot-select"
            onClick={() => onOpenPicker(slotKey)}
            aria-label="Seleziona player"
            title="Seleziona player"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
          {filled && (
            <button
              type="button"
              className="clear-btn"
              data-testid="slot-remove"
              aria-label="Rimuovi player"
              title="Rimuovi player"
              onClick={() => {
                if (!window.confirm("Rimuovere il player da questo slot?")) {
                  return;
                }
                onClearSlot(slotKey);
              }}
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
          )}
          <button
            type="button"
            className="drag-handle"
            data-testid="slot-drag"
            aria-label="Sposta player"
            title="Sposta player"
            disabled={!filled}
            {...listeners}
            {...attributes}
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

        {filled && (
          <div className="slot-player-head">
            {proxyImageUrl && !imgError ? (
              <img
                className="slot-thumb"
                src={proxyImageUrl}
                alt={slot.player || "Player"}
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="slot-thumb slot-thumb-placeholder" aria-hidden="true">
                ?
              </div>
            )}
            <div className="slot-player-meta">
              {canLinkProfile ? (
                <a
                  className="slot-player-link"
                  href={scoutasticPlayerUrl(slot.playerInternalId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {slot.player || "Apri profilo"}
                </a>
              ) : (
                <span className="slot-player-label">{slot.player || "Player"}</span>
              )}
              <span>{slot.club || "Club"}</span>
            </div>
          </div>
        )}

        <div className="slot-fields">
          <label>
            <span>Club</span>
            <input
              aria-label="Club"
              value={slot.club}
              onChange={(event) => onPatch(slotKey, { club: event.target.value })}
              placeholder="Club"
            />
          </label>

          <label>
            <span>Age</span>
            <input
              aria-label="Age"
              value={slot.age}
              onChange={(event) => onPatch(slotKey, { age: event.target.value })}
              placeholder="Age"
            />
          </label>

          <label>
            <span>Expiring</span>
            <input
              aria-label="Expiring"
              value={slot.expiring}
              onChange={(event) => onPatch(slotKey, { expiring: event.target.value })}
              placeholder="Expiring"
            />
          </label>

          <label>
            <span>Video</span>
            <input
              aria-label="Video"
              type="url"
              value={slot.videoUrl}
              onChange={(event) => onPatch(slotKey, { videoUrl: event.target.value })}
              placeholder="https://..."
            />
          </label>
        </div>
      </article>
    </div>
  );
}
