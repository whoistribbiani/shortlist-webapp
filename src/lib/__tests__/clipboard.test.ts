import { afterEach, describe, expect, it, vi } from "vitest";

import { copyTextToClipboard } from "../clipboard";

describe("clipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses navigator clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    await copyTextToClipboard("token");
    expect(writeText).toHaveBeenCalledWith("token");
  });

  it("falls back to execCommand when clipboard API is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true
    });
    const execSpy = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      value: execSpy,
      configurable: true
    });

    await copyTextToClipboard("token");
    expect(execSpy).toHaveBeenCalledWith("copy");
  });

  it("throws when copy fallback fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true
    });
    Object.defineProperty(document, "execCommand", {
      value: vi.fn().mockReturnValue(false),
      configurable: true
    });

    await expect(copyTextToClipboard("token")).rejects.toThrow("Copia negli appunti non riuscita");
  });
});
