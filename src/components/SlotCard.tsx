import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import type { SlotEntry } from "../types";

interface SlotCardProps {
  slotKey: string;
  slot: SlotEntry;
  duplicateBlocked: boolean;
  onPatch: (slotKey: string, patch: Partial<SlotEntry>) => void;
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

export function SlotCard({ slotKey, slot, duplicateBlocked, onPatch, onOpenPicker }: SlotCardProps): JSX.Element {
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

  return (
    <div ref={setDropRef} className="slot-drop-zone">
      <article ref={setDragRef} style={style} className={cardClassName} data-state={filled ? "filled" : "empty"}>
        <div className="slot-actions">
          <button
            type="button"
            className="pick-btn"
            onClick={() => onOpenPicker(slotKey)}
            title="Seleziona player"
            aria-label="Seleziona player"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="4.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
          </button>
          <button type="button" className="drag-handle" {...listeners} {...attributes} aria-label="Drag slot">
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
              <circle cx="2" cy="2" r="1.4" />
              <circle cx="8" cy="2" r="1.4" />
              <circle cx="2" cy="7" r="1.4" />
              <circle cx="8" cy="7" r="1.4" />
              <circle cx="2" cy="12" r="1.4" />
              <circle cx="8" cy="12" r="1.4" />
            </svg>
          </button>
        </div>

        {filled && (
          <div className="slot-player-head">
            {slot.playerImageUrl && !imgError ? (
              <img
                key={slot.playerImageUrl}
                className="slot-thumb"
                src={slot.playerImageUrl}
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
