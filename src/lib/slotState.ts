import type { SlotPayload } from "../types";

export function isSlotPopulated(slot: SlotPayload): boolean {
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
