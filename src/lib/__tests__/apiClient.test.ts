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

  it("keeps team logo urls from the teams endpoint", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          teams: [{ teamId: "team-1", teamName: "Genoa CFC", teamLogoUrl: "https://example.test/team.png" }]
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    const api = createApiClient("https://api.example.test", () => "token-123");
    const result = await api.fetchTeams({ competitionId: "IT1", seasonId: "2026" });

    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl = String(mockFetch.mock.calls[0]?.[0] ?? "");
    expect(calledUrl).toContain("/catalog/teams?competitionId=IT1&seasonId=2026");
    expect(result[0]).toMatchObject({
      teamId: "team-1",
      teamName: "Genoa CFC",
      teamLogoUrl: "https://example.test/team.png"
    });
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

  it("fetches a player by Transfermarkt ID with auth headers", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          player: {
            transfermarktId: "698415",
            internalId: "internal-698415",
            firstName: "Antoine",
            lastName: "Beydts"
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    const api = createApiClient("https://api.example.test", () => "token-123");
    const result = await api.fetchPlayerByTransfermarkt({
      transfermarktId: "698415",
      seasonId: "2026",
      gender: "male"
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl = String(mockFetch.mock.calls[0]?.[0] ?? "");
    expect(calledUrl).toContain(
      "/catalog/player-by-transfermarkt?transfermarktId=698415&seasonId=2026&gender=male"
    );
    const init = (mockFetch.mock.calls[0]?.[1] ?? {}) as RequestInit;
    const headers = (init.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token-123");
    expect(result.label).toBe("Antoine Beydts");
    expect(result.transfermarktId).toBe("698415");
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
