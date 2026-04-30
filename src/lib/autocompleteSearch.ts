interface RankedItem<T> {
  item: T;
  rank: number;
  index: number;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function compact(value: string): string {
  return value.replace(/\s+/g, "");
}

function rankText(text: string, query: string): number {
  const normalizedText = normalizeSearchText(text);
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const textCompact = compact(normalizedText);
  const queryCompact = compact(normalizedQuery);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  if (normalizedText === normalizedQuery || textCompact === queryCompact) {
    return 1;
  }
  if (normalizedText.startsWith(normalizedQuery) || textCompact.startsWith(queryCompact)) {
    return 2;
  }
  if (normalizedText.includes(` ${normalizedQuery}`)) {
    return 3;
  }
  if (normalizedText.includes(normalizedQuery)) {
    return 4;
  }
  if (queryTokens.length > 1 && queryTokens.every((token) => normalizedText.includes(token))) {
    return 5;
  }
  if (textCompact.includes(queryCompact)) {
    return 6;
  }
  return Number.POSITIVE_INFINITY;
}

export function rankAutocompleteOptions<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string,
  limit: number
): T[] {
  return items
    .map((item, index): RankedItem<T> => ({ item, rank: rankText(getSearchText(item), query), index }))
    .filter((entry) => Number.isFinite(entry.rank))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.item);
}
