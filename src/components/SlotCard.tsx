import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { FIELD_LABELS, SLOT_FIELDS } from "../constants/layout";
import type { SlotEntry } from "../types";

interface SlotCardProps {
  slotKey: string;
  slot: SlotEntry;
  duplicateBlocked: boolean;
  onPatch: (slotKey: string, patch: Partial<SlotEntry>) => void;
  onOpenPicker: (slotKey: string) => void;
}

function isPopulated(slot: SlotEntry): boolean {
  return !!(slot.playerId || slot.player || slot.name || slot.club || slot.age || slot.expiring);
}

export function SlotCard({ slotKey, slot, duplicateBlocked, onPatch, onOpenPicker }: SlotCardProps): JSX.Element {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: slotKey });
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: slotKey,
    disabled: !isPopulated(slot)
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const cardClassName = [
    "slot-card",
    isOver ? "slot-over" : "",
    isDragging ? "slot-dragging" : "",
    duplicateBlocked ? "slot-error" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={setDropRef} className="slot-drop-zone">
      <article ref={setDragRef} style={style} className={cardClassName}>
        <div className="slot-actions">
          <button type="button" className="pick-btn" onClick={() => onOpenPicker(slotKey)}>
            Seleziona player
          </button>
          <button type="button" className="drag-handle" {...listeners} {...attributes} aria-label="Drag slot">
            :::
          </button>
        </div>

        <div className="slot-fields">
          {SLOT_FIELDS.map((field) => (
            <label key={field}>
              <span>{FIELD_LABELS[field]}</span>
              <input
                value={slot[field]}
                onChange={(event) => onPatch(slotKey, { [field]: event.target.value } as Partial<SlotEntry>)}
                placeholder={FIELD_LABELS[field]}
              />
            </label>
          ))}
        </div>
      </article>
    </div>
  );
}
