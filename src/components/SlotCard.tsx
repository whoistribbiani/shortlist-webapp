import { useEffect, useMemo, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import urlIcon from "../assets/url.png";
import videoCameraIcon from "../assets/video-camera.png";
import { useAutoFitText } from "../hooks/useAutoFitText";
import { buildPlayerImageProxyUrl } from "../lib/scoutasticMedia";
import { isSlotPopulated } from "../lib/slotState";
import { isValidVideoUrl } from "../lib/videoUrl";
import type { SlotEntry } from "../types";
import { ActionIconGroup } from "./ActionIconGroup";
import { EmptySlotCard } from "./EmptySlotCard";
import { PlayerCard } from "./PlayerCard";

interface SlotCardProps {
  apiBaseUrl: string;
  slotKey: string;
  slot: SlotEntry;
  duplicateBlocked: boolean;
  onPatch: (slotKey: string, patch: Partial<SlotEntry>) => void;
  onClearSlot: (slotKey: string) => void;
  onOpenPicker: (slotKey: string) => void;
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
  const filled = isSlotPopulated(slot);
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: slotKey,
    disabled: !filled
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const cardClassName = [
    "slot-card",
    filled ? "slot-card-filled" : "slot-card-empty",
    isOver ? "slot-over" : "",
    isDragging ? "slot-dragging" : "",
    duplicateBlocked ? "slot-error" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const canLinkProfile = !!slot.playerInternalId;
  const [imgError, setImgError] = useState(false);
  const [isVideoPopoverOpen, setIsVideoPopoverOpen] = useState(false);
  const [videoDraft, setVideoDraft] = useState(slot.videoUrl);
  const [videoError, setVideoError] = useState<string | null>(null);

  const playerNameLinkRef = useRef<HTMLAnchorElement | null>(null);
  const playerNameLabelRef = useRef<HTMLSpanElement | null>(null);
  const playerClubRef = useRef<HTMLSpanElement | null>(null);
  const clubInputRef = useRef<HTMLInputElement | null>(null);
  const ageInputRef = useRef<HTMLInputElement | null>(null);
  const expiringInputRef = useRef<HTMLInputElement | null>(null);

  const proxyImageUrl = useMemo(
    () => buildPlayerImageProxyUrl(apiBaseUrl, slot.playerImageUrl),
    [apiBaseUrl, slot.playerImageUrl]
  );
  const hasValidVideoUrl = isValidVideoUrl(slot.videoUrl);
  const playerNameText = slot.player || (canLinkProfile ? "Apri profilo" : "Player");
  const playerClubText = slot.club || "Club";

  const playerNameLinkFit = useAutoFitText(playerNameLinkRef, playerNameText, { minFontSize: 10, maxFontSize: 20 });
  const playerNameLabelFit = useAutoFitText(playerNameLabelRef, playerNameText, { minFontSize: 10, maxFontSize: 20 });
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
        {filled ? (
          <PlayerCard
            actionGroup={
              <ActionIconGroup
                filled
                onSelect={() => onOpenPicker(slotKey)}
                onRemove={() => {
                  if (!window.confirm("Rimuovere il player da questo slot?")) {
                    return;
                  }
                  onClearSlot(slotKey);
                }}
                dragHandleProps={{
                  ...listeners,
                  ...attributes
                }}
              />
            }
            header={
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
                  <span ref={playerClubRef} className="autofit-text slot-player-team" style={playerClubFit}>
                    {playerClubText}
                  </span>
                </div>
              </div>
            }
            fields={
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
            }
            footer={
              <div className="slot-footer-actions">
                {canLinkProfile && (
                  <a
                    className="video-icon-btn"
                    href={scoutasticPlayerUrl(slot.playerInternalId)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Apri profilo player"
                    title="Apri profilo player"
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path
                        d="M8 8.2a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6ZM3.4 13.4c0-2 2-3.6 4.6-3.6s4.6 1.6 4.6 3.6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </a>
                )}
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
            }
          />
        ) : (
          <EmptySlotCard onSelect={() => onOpenPicker(slotKey)} />
        )}
      </article>
    </div>
  );
}
