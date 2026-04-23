import { describe, expect, it } from "vitest";

import { computeAutoFitFontSize } from "../autoFit";

describe("autoFit", () => {
  it("keeps near max font size for short text", () => {
    const size = computeAutoFitFontSize({
      availableWidth: 180,
      text: "Savio",
      minFontSize: 10,
      maxFontSize: 16,
      measure: (fontSize) => fontSize * 2
    });
    expect(size).toBe(16);
  });

  it("reduces font size for long text within range", () => {
    const size = computeAutoFitFontSize({
      availableWidth: 120,
      text: "VITORIA GUIMARAES SPORT CLUB",
      minFontSize: 10,
      maxFontSize: 16,
      measure: (fontSize) => fontSize * 10
    });
    expect(size).toBe(12);
  });

  it("returns minimum font size when text cannot fit", () => {
    const size = computeAutoFitFontSize({
      availableWidth: 20,
      text: "Super long text",
      minFontSize: 10,
      maxFontSize: 16,
      measure: (fontSize) => fontSize * 10
    });
    expect(size).toBe(10);
  });
});
