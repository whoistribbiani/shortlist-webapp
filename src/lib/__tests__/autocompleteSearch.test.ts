import { describe, expect, it } from "vitest";

import { rankAutocompleteOptions } from "../autocompleteSearch";

interface Option {
  id: string;
  label: string;
}

const options: Option[] = [
  { id: "serie-a", label: "Serie A - Italy - S2026" },
  { id: "serie-b", label: "Serie B - Italy - S2026" },
  { id: "champions", label: "UEFA Champions League - Europe - S2026" },
  { id: "primera", label: "Priméra División - Argentina - S2026" },
  { id: "generic", label: "Italian Serie A Primavera - Italy - S2026" }
];

function search(query: string, limit = 20): Option[] {
  return rankAutocompleteOptions(options, query, (item) => item.label, limit);
}

describe("rankAutocompleteOptions", () => {
  it("matches compact queries against labels with spaces", () => {
    expect(search("seriea").map((item) => item.id)).toContain("serie-a");
  });

  it("matches regardless of letter case", () => {
    expect(search("SERIE").map((item) => item.id)).toEqual(search("serie").map((item) => item.id));
  });

  it("matches accented text with unaccented queries", () => {
    expect(search("primera division").map((item) => item.id)).toContain("primera");
  });

  it("matches query tokens in any order", () => {
    expect(search("league champions").map((item) => item.id)).toContain("champions");
  });

  it("ranks direct matches before generic content matches", () => {
    expect(search("serie a").map((item) => item.id).slice(0, 2)).toEqual(["serie-a", "generic"]);
  });

  it("applies the requested result limit", () => {
    const manyOptions = Array.from({ length: 25 }, (_, index) => ({
      id: `competition-${index}`,
      label: `Competition ${index}`
    }));

    expect(rankAutocompleteOptions(manyOptions, "competition", (item) => item.label, 20)).toHaveLength(20);
  });
});
