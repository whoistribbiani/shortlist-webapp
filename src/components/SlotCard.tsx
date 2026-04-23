import { useEffect, useMemo, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { useAutoFitText } from "../hooks/useAutoFitText";
import urlIcon from "../assets/url.png";
import videoCameraIcon from "../assets/video-camera.png";
import { buildPlayerImageProxyUrl } from "../lib/scoutasticMedia";
import { isValidVideoUrl } from "../lib/videoUrl";
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
  const playerNameLinkRef = useRef<HTMLAnchorElement | null>(null);
  const playerNameLabelRef = useRef<HTMLSpanElement | null>(null);
  const playerClubRef = useRef<HTMLSpanElement | null>(null);
  const clubInputRef = useRef<HTMLInputElement | null>(null);
  const ageInputRef = useRef<HTMLInputElement | null>(null);
  const expiringInputRef = useRef<HTMLInputElement | null>(null);
  const [isVideoPopoverOpen, setIsVideoPopoverOpen] = useState(false);
  const [videoDraft, setVideoDraft] = useState(slot.videoUrl);
  const [videoError, setVideoError] = useState<string | null>(null);
  const proxyImageUrl = useMemo(
    () => buildPlayerImageProxyUrl(apiBaseUrl, slot.playerImageUrl),
    [apiBaseUrl, slot.playerImageUrl]
  );
  const hasValidVideoUrl = isValidVideoUrl(slot.videoUrl);
  const playerNameText = slot.player || (canLinkProfile ? "Apri profilo" : "Player");
  const playerClubText = slot.club || "Club";
  const playerNameLinkFit = useAutoFitText(playerNameLinkRef, playerNameText, { minFontSize: 10, maxFontSize: 21 });
  const playerNameLabelFit = useAutoFitText(playerNameLabelRef, playerNameText, { minFontSize: 10, maxFontSize: 21 });
  const playerClubFit = useAutoFitText(playerClubRef, playerClubText, { minFontSize: 10, maxFontSize: 14 });
  const clubInputFit = useAutoFitText(clubInputRef, slot.club, { minFontSize: 10, maxFontSize: 15 });
  const ageInputFit = useAutoFitText(ageInputRef, slot.age, { minFontSize: 10, maxFontSize: 15 });
  const expiringInputFit = useAutoFitText(expiringInputRef, slot.expiring, { minFontSize: 10, maxFontSize: 15 });

  useEffect(() => {
    setImgError(false);
  }, [slot.playerImageUrl]);

  useEffect(() => {
    setVideoDraft(slot.videoUrl);
  }, [slot.videoUrl]);

  useEffect(() => {
    if (!filled) {
      setIsVideoPopoverOpen(false);
      setVideoError(null);
    }
  }, [filled]);

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
                  ref={playerNameLinkRef}
                  className="slot-player-link"
                  href={scoutasticPlayerUrl(slot.playerInternalId)}
                  target="_blank"
                  rel="noreferrer"
                  style={playerNameLinkFit}
                >
                  {playerNameText}
                </a>
              ) : (
                <span ref={playerNameLabelRef} className="slot-player-label" style={playerNameLabelFit}>
                  {playerNameText}
                </span>
              )}
              <span ref={playerClubRef} className="autofit-text" style={playerClubFit}>
                {playerClubText}
              </span>
            </div>
          </div>
        )}

        <div className="slot-fields">
          <label>
            <span>Club</span>
            <input
              ref={clubInputRef}
              className="autofit-input"
              aria-label="Club"
              value={slot.club}
              onChange={(event) => onPatch(slotKey, { club: event.target.value })}
              placeholder="Club"
              style={clubInputFit}
            />
          </label>

          <label>
            <span>Age</span>
            <input
              ref={ageInputRef}
              className="autofit-input"
              aria-label="Age"
              value={slot.age}
              onChange={(event) => onPatch(slotKey, { age: event.target.value })}
              placeholder="Age"
              style={ageInputFit}
            />
          </label>

          <label>
            <span>Expiring</span>
            <input
              ref={expiringInputRef}
              className="autofit-input"
              aria-label="Expiring"
              value={slot.expiring}
              onChange={(event) => onPatch(slotKey, { expiring: event.target.value })}
              placeholder="Expiring"
              style={expiringInputFit}
            />
          </label>
        </div>

        {filled && (
          <div className="video-actions">
            <a
              className={`video-icon-btn ${hasValidVideoUrl ? "" : "video-icon-disabled"}`.trim()}
              data-testid="video-open"
              href={hasValidVideoUrl ? slot.videoUrl : undefined}
              target="_blank"
              rel="noreferrer"
              aria-label="Apri video"
              title="Apri video"
              aria-disabled={!hasValidVideoUrl}
              onClick={(event) => {
                if (!hasValidVideoUrl) {
                  event.preventDefault();
                }
              }}
            >
              <img src={videoCameraIcon} alt="" aria-hidden="true" className="video-link-icon" />
            </a>
            <button
              type="button"
              className="video-icon-btn"
              data-testid="video-edit"
              aria-label="Incolla o modifica video"
              title="Incolla o modifica video"
              onClick={() => {
                setVideoDraft(slot.videoUrl);
                setVideoError(null);
                setIsVideoPopoverOpen((current) => !current);
              }}
            >
              <img src={urlIcon} alt="" aria-hidden="true" className="video-link-icon" />
            </button>
            {isVideoPopoverOpen && (
              <div className="video-popover" role="dialog" aria-label="Modifica URL video">
                <input
                  data-testid="video-popover-input"
                  type="url"
                  value={videoDraft}
                  onChange={(event) => {
                    setVideoDraft(event.target.value);
                    if (videoError) {
                      setVideoError(null);
                    }
                  }}
                  placeholder="https://..."
                />
                {videoError && <p className="video-popover-error">{videoError}</p>}
                <div className="video-popover-actions">
                  <button
                    type="button"
                    data-testid="video-popover-save"
                    className="video-save-btn"
                    onClick={() => {
                      const candidate = videoDraft.trim();
                      if (candidate && !isValidVideoUrl(candidate)) {
                        setVideoError("Inserisci un URL valido (http/https).");
                        return;
                      }
                      onPatch(slotKey, { videoUrl: candidate });
                      setIsVideoPopoverOpen(false);
                      setVideoError(null);
                    }}
                  >
                    Salva
                  </button>
                  <button
                    type="button"
                    data-testid="video-popover-cancel"
                    className="video-cancel-btn"
                    onClick={() => {
                      setVideoDraft(slot.videoUrl);
                      setVideoError(null);
                      setIsVideoPopoverOpen(false);
                    }}
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    data-testid="video-popover-remove"
                    className="video-remove-btn"
                    onClick={() => {
                      setVideoDraft("");
                      setVideoError(null);
                      onPatch(slotKey, { videoUrl: "" });
                      setIsVideoPopoverOpen(false);
                    }}
                  >
                    Rimuovi URL
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </article>
    </div>
  );
}
