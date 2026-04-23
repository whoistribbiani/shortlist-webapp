import { describe, expect, it } from "vitest";

import { EMPTY_SLOT_PAYLOAD } from "../../constants/layout";
import { isSlotPopulated } from "../slotState";

describe("slotState", () => {
  it("returns false for empty slot payload", () => {
    expect(isSlotPopulated(EMPTY_SLOT_PAYLOAD)).toBe(false);
  });

  it("returns true when a player id is present", () => {
    expect(
      isSlotPopulated({
        ...EMPTY_SLOT_PAYLOAD,
        playerId: "player-1"
      })
    ).toBe(true);
  });

  it("returns true when supporting fields are present", () => {
    expect(
      isSlotPopulated({
        ...EMPTY_SLOT_PAYLOAD,
        club: "Genoa"
      })
    ).toBe(true);
  });
});
