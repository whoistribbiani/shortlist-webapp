import { EMPTY_SLOT_PAYLOAD, POSITIONS } from "../constants/layout";
import type { SlotEntry, SlotPayload } from "../types";
import { allSlotCoordinatesForPosition, buildSlotKey, parseSlotKey } from "./slotKey";

export type BoardState = Record<string, SlotEntry>;

function slotIsEmpty(slot: SlotEntry): boolean {
  return (
    !slot.playerId &&
    !slot.player &&
    !slot.name &&
    !slot.club &&
    !slot.age &&
    !slot.expiring &&
    !slot.videoUrl &&
    !slot.playerInternalId &&
    !slot.playerImageUrl
  );
}

export function createInitialBoardState(): BoardState {
  const out: BoardState = {};
  for (const position of POSITIONS) {
    for (const coordinate of allSlotCoordinatesForPosition(position.id)) {
      const key = buildSlotKey(coordinate);
      out[key] = { ...coordinate, ...EMPTY_SLOT_PAYLOAD };
    }
  }
  return out;
}

export function upsertSlotPayload(
  state: BoardState,
  slotKey: string,
  patch: Partial<SlotPayload | SlotEntry>
): BoardState {
  const current = state[slotKey];
  if (!current) {
    return state;
  }
  return {
    ...state,
    [slotKey]: {
      ...current,
      ...patch
    }
  };
}

export function clearSlotPayload(state: BoardState, slotKey: string): BoardState {
  const current = state[slotKey];
  if (!current) {
    return state;
  }
  return {
    ...state,
    [slotKey]: {
      ...current,
      ...EMPTY_SLOT_PAYLOAD
    }
  };
}

export function canAssignPlayerToSlot(state: BoardState, targetSlotKey: string, playerId: string): boolean {
  if (!playerId.trim()) {
    return true;
  }
  const target = state[targetSlotKey];
  if (!target) {
    return false;
  }
  for (const [key, slot] of Object.entries(state)) {
    if (key === targetSlotKey) {
      continue;
    }
    if (slot.positionId !== target.positionId) {
      continue;
    }
    if (slot.playerId && slot.playerId === playerId) {
      return false;
    }
  }
  return true;
}

export function moveSlotPayload(state: BoardState, fromSlotKey: string, toSlotKey: string): BoardState {
  if (fromSlotKey === toSlotKey) {
    return state;
  }
  const source = state[fromSlotKey];
  const target = state[toSlotKey];
  if (!source || !target || slotIsEmpty(source)) {
    return state;
  }

  const sourcePayload: SlotPayload = {
    name: source.name,
    player: source.player,
    club: source.club,
    age: source.age,
    expiring: source.expiring,
    videoUrl: source.videoUrl,
    playerId: source.playerId,
    playerInternalId: source.playerInternalId,
    playerImageUrl: source.playerImageUrl,
    teamId: source.teamId,
    competitionId: source.competitionId
  };

  return {
    ...state,
    [toSlotKey]: {
      ...target,
      ...sourcePayload
    },
    [fromSlotKey]: {
      ...source,
      ...EMPTY_SLOT_PAYLOAD
    }
  };
}

export function boardStateToArray(state: BoardState): SlotEntry[] {
  return Object.values(state);
}

export function arrayToBoardState(entries: SlotEntry[]): BoardState {
  const base = createInitialBoardState();
  for (const entry of entries) {
    const key = buildSlotKey(entry);
    if (!base[key]) {
      continue;
    }
    base[key] = {
      ...base[key],
      ...entry
    };
  }
  return base;
}

export function ensureBoardState(input: BoardState | SlotEntry[] | undefined): BoardState {
  if (!input) {
    return createInitialBoardState();
  }
  if (Array.isArray(input)) {
    return arrayToBoardState(input);
  }
  return input;
}

export function inferPositionIdFromSlotKey(slotKey: string): string {
  return parseSlotKey(slotKey)?.positionId ?? "";
}
