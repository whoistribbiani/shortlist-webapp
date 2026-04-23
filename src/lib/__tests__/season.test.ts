import { describe, expect, it } from "vitest";

import { resolveDefaultSeasonId, resolveSeasonIdFromEnv } from "../season";

describe("season", () => {
  it("uses current year in January", () => {
    expect(resolveDefaultSeasonId(new Date(2026, 0, 15, 10, 0, 0))).toBe("2026");
  });

  it("uses previous year from February to December", () => {
    expect(resolveDefaultSeasonId(new Date(2026, 1, 1, 10, 0, 0))).toBe("2025");
    expect(resolveDefaultSeasonId(new Date(2026, 11, 31, 10, 0, 0))).toBe("2025");
  });

  it("keeps explicit env value as override", () => {
    expect(resolveSeasonIdFromEnv("2024", new Date(2026, 3, 23, 10, 0, 0))).toBe("2024");
  });
});
