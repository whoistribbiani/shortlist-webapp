import { describe, expect, it } from "vitest";

import { allSlotCoordinatesForPosition, buildSlotKey, parseSlotKey } from "../slotKey";
import { SCENARIOS } from "../../constants/layout";
import type { PositionId } from "../../types";

describe("slotKey", () => {
  it("builds and parses a slot key", () => {
    const key = buildSlotKey({
      positionId: "3-LWB",
      rank: 2,
      scenario: "5-10",
      lane: "A2"
    });

    expect(key).toBe("3-LWB|2|5-10|A2");
    expect(parseSlotKey(key)).toEqual({
      positionId: "3-LWB",
      rank: 2,
      scenario: "5-10",
      lane: "A2"
    });
  });

  it("returns every slot coordinate for a position", () => {
    const coordinates = allSlotCoordinatesForPosition("1-GK" satisfies PositionId);

    expect(coordinates).toHaveLength(72);
    expect(coordinates[0]).toEqual({
      positionId: "1-GK",
      rank: 1,
      scenario: SCENARIOS[0].id,
      lane: "A1B1"
    });
    expect(coordinates[71]).toEqual({
      positionId: "1-GK",
      rank: 6,
      scenario: SCENARIOS[3].id,
      lane: "B1"
    });
  });
});
