import { afterEach, describe, expect, it, vi } from "vitest";

import { createApiClient } from "../apiClient";

describe("apiClient", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("calls competitions endpoint with query params", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ competitions: [{ id: "IT1", name: "Serie A" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    const api = createApiClient("https://api.example.test");
    const result = await api.fetchCompetitions({ seasonId: "2026", gender: "male" });

    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl = String(mockFetch.mock.calls[0]?.[0] ?? "");
    expect(calledUrl).toContain("/catalog/competitions?seasonId=2026&gender=male");
    expect(result[0].id).toBe("IT1");
  });

  it("supports relative api base urls", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ competitions: [{ id: "IT1", name: "Serie A" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    const api = createApiClient("/api");
    await api.fetchCompetitions({ seasonId: "2026", gender: "male" });

    const calledUrl = String(mockFetch.mock.calls[0]?.[0] ?? "");
    expect(calledUrl).toContain("/api/catalog/competitions?seasonId=2026&gender=male");
  });
});
