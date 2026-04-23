import { describe, expect, it } from "vitest";

import { isValidVideoUrl } from "../videoUrl";

describe("videoUrl", () => {
  it("accepts http/https urls", () => {
    expect(isValidVideoUrl("https://onedrive.live.com/watch?v=abc")).toBe(true);
    expect(isValidVideoUrl("http://example.com/video")).toBe(true);
  });

  it("rejects empty or whitespace values", () => {
    expect(isValidVideoUrl("")).toBe(false);
    expect(isValidVideoUrl("   ")).toBe(false);
  });

  it("rejects non-http protocols and invalid urls", () => {
    expect(isValidVideoUrl("ftp://example.com/file")).toBe(false);
    expect(isValidVideoUrl("not-a-url")).toBe(false);
  });
});
