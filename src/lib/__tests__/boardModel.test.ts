import { describe, expect, it } from "vitest";

import {
  clearSlotPayload,
  canAssignPlayerToSlot,
  createInitialBoardState,
  moveSlotPayload,
  upsertSlotPayload
} from "../boardModel";
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
      playerInternalId: "internal-11",
      playerImageUrl: "https://example.test/player.png",
      player: "MOVER",
      club: "Genoa",
      videoUrl: "https://onedrive.live.com/video"
    });

    const moved = moveSlotPayload(withPlayer, sourceKey, targetKey);
    expect(moved[sourceKey].player).toBe("");
    expect(moved[sourceKey].videoUrl).toBe("");
    expect(moved[targetKey].player).toBe("MOVER");
    expect(moved[targetKey].club).toBe("Genoa");
    expect(moved[targetKey].playerInternalId).toBe("internal-11");
    expect(moved[targetKey].playerImageUrl).toBe("https://example.test/player.png");
    expect(moved[targetKey].videoUrl).toBe("https://onedrive.live.com/video");
  });

  it("clears payload while preserving coordinates", () => {
    const state = createInitialBoardState();
    const slotKey = buildSlotKey({
      positionId: "11-ST",
      rank: 1,
      scenario: "0-2",
      lane: "A1B1"
    });

    const withPlayer = upsertSlotPayload(state, slotKey, {
      name: "Antoine",
      player: "Beydts",
      playerId: "player-1",
      playerInternalId: "internal-1",
      playerImageUrl: "https://example.test/player.png",
      videoUrl: "https://video.test/id"
    });
    const cleared = clearSlotPayload(withPlayer, slotKey);

    expect(cleared[slotKey].positionId).toBe("11-ST");
    expect(cleared[slotKey].rank).toBe(1);
    expect(cleared[slotKey].player).toBe("");
    expect(cleared[slotKey].playerId).toBe("");
    expect(cleared[slotKey].playerInternalId).toBe("");
    expect(cleared[slotKey].playerImageUrl).toBe("");
    expect(cleared[slotKey].videoUrl).toBe("");
  });

  it("allows reusing same player in position after clear", () => {
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

    const withPlayer = upsertSlotPayload(state, sourceKey, { playerId: "p-1", player: "TEST PLAYER" });
    const cleared = clearSlotPayload(withPlayer, sourceKey);
    expect(canAssignPlayerToSlot(cleared, targetKey, "p-1")).toBe(true);
  });
});
