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

  it("fetches a team logo from the team endpoint", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ teamId: "team-1", teamName: "Genoa CFC", teamLogoUrl: "https://example.test/logo.png" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    const api = createApiClient("https://api.example.test", () => "token-123");
    const result = await api.fetchTeam({ teamId: "team-1", gender: "male" });

    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl = String(mockFetch.mock.calls[0]?.[0] ?? "");
    expect(calledUrl).toContain("/catalog/team?teamId=team-1&gender=male");
    const init = (mockFetch.mock.calls[0]?.[1] ?? {}) as RequestInit;
    const headers = (init.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token-123");
    expect(result.teamLogoUrl).toBe("https://example.test/logo.png");
  });

  it("adds bearer token on protected requests", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ meta: { shareToken: "", title: "", seasonId: "2026", gender: "male", updatedAt: "" }, slots: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    const api = createApiClient("https://api.example.test", () => "token-123");
    await api.getBoardCurrent();

    const init = (mockFetch.mock.calls[0]?.[1] ?? {}) as RequestInit;
    const headers = (init.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token-123");
  });

  it("calls login without bearer header", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ token: "abc" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    const api = createApiClient("https://api.example.test", () => "token-123");
    await api.login("pass");

    const init = (mockFetch.mock.calls[0]?.[1] ?? {}) as RequestInit;
    const headers = (init.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});
