import { describe, expect, it } from "vitest";

import { buildPlayerImageProxyUrl, resolveScoutasticMediaUrl } from "../scoutasticMedia";

describe("scoutasticMedia", () => {
  it("normalizes relative scoutastic media url", () => {
    expect(resolveScoutasticMediaUrl("/api/v1/images/player/test.jpg")).toBe(
      "https://genoacfc.scoutastic.com/api/v1/images/player/test.jpg"
    );
  });

  it("builds proxy endpoint url with encoded source", () => {
    const out = buildPlayerImageProxyUrl("/api", "https://genoacfc.scoutastic.com/a/b.jpg");
    expect(out).toContain("/api/catalog/player-image?src=");
    expect(decodeURIComponent(out.split("src=")[1])).toBe("https://genoacfc.scoutastic.com/a/b.jpg");
  });
});
