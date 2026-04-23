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
          <button type="button" className="pick-btn" onClick={() => onOpenPicker(slotKey)}>
            Seleziona player
          </button>
          {filled && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                if (!window.confirm("Rimuovere il player da questo slot?")) {
                  return;
                }
                onClearSlot(slotKey);
              }}
            >
              Rimuovi player
            </button>
          )}
          <button type="button" className="drag-handle" {...listeners} {...attributes} aria-label="Drag slot">
            :::
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
            <span>Name</span>
            <input
              aria-label="Name"
              value={slot.name}
              onChange={(event) => onPatch(slotKey, { name: event.target.value })}
              placeholder="Name"
            />
          </label>

          <label>
            <span>Player</span>
            <input
              aria-label="Player"
              value={slot.player}
              onChange={(event) => onPatch(slotKey, { player: event.target.value })}
              placeholder="Player"
            />
          </label>

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
