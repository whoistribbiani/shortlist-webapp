import { describe, expect, it } from "vitest";

import { canAssignPlayerToSlot, createInitialBoardState, moveSlotPayload, upsertSlotPayload } from "../boardModel";
import { buildSlotKey } from "../slotKey";

describe("boardModel", () => {
  it("blocks duplicates in the same position", () => {
    const state = createInitialBoardState();
    const sourceKey = buildSlotKey({
      positionId: "3-LWB",
      rank: 1,
      scenario: "0-2",
      lane: "A1B1"
    });
    const targetKey = buildSlotKey({
      positionId: "3-LWB",
      rank: 2,
      scenario: "2-5",
      lane: "A2"
    });

    const withPlayer = upsertSlotPayload(state, sourceKey, {
      playerId: "p-1",
      player: "TEST PLAYER"
    });

    expect(canAssignPlayerToSlot(withPlayer, targetKey, "p-1")).toBe(false);
  });

  it("allows same player in different positions", () => {
    const state = createInitialBoardState();
    const sourceKey = buildSlotKey({
      positionId: "3-LWB",
      rank: 1,
      scenario: "0-2",
      lane: "A1B1"
    });
    const targetKey = buildSlotKey({
      positionId: "4-RCB",
      rank: 2,
      scenario: "2-5",
      lane: "A2"
    });

    const withPlayer = upsertSlotPayload(state, sourceKey, {
      playerId: "p-1",
      player: "TEST PLAYER"
    });

    expect(canAssignPlayerToSlot(withPlayer, targetKey, "p-1")).toBe(true);
  });

  it("moves payload between slots with move semantics", () => {
    const state = createInitialBoardState();
    const sourceKey = buildSlotKey({
      positionId: "11-ST",
      rank: 1,
      scenario: "0-2",
      lane: "A2"
    });
    const targetKey = buildSlotKey({
      positionId: "11-ST",
      rank: 4,
      scenario: "10-20",
      lane: "B1"
    });

    const withPlayer = upsertSlotPayload(state, sourceKey, {
      playerId: "p-11",
      player: "MOVER",
      club: "Genoa"
    });

    const moved = moveSlotPayload(withPlayer, sourceKey, targetKey);
    expect(moved[sourceKey].player).toBe("");
    expect(moved[targetKey].player).toBe("MOVER");
    expect(moved[targetKey].club).toBe("Genoa");
  });
});
