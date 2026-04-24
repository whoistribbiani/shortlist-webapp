import type { BoardDocument, CompetitionOption, PlayerOption, TeamOption } from "../types";
import { playerLabel } from "./playerTransform";

export interface CompetitionsQuery {
  seasonId: string;
  gender: string;
}

export interface TeamsQuery {
  competitionId: string;
  seasonId: string;
}

export interface PlayersQuery {
  teamId: string;
  seasonId: string;
}

type GetToken = () => string | null;

export interface ApiClient {
  login(password: string): Promise<{ token: string }>;
  validateAuth(): Promise<{ valid: boolean }>;
  logout(): Promise<{ ok: boolean }>;
  fetchCompetitions(query: CompetitionsQuery): Promise<CompetitionOption[]>;
  fetchTeams(query: TeamsQuery): Promise<TeamOption[]>;
  fetchPlayers(query: PlayersQuery): Promise<PlayerOption[]>;
  getBoardCurrent(): Promise<BoardDocument>;
  putBoardCurrent(payload: BoardDocument): Promise<BoardDocument>;
  exportBoardCurrent(payload: BoardDocument): Promise<Blob>;
}

function joinPath(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function toAbsoluteUrl(urlOrPath: string): string {
  try {
    return new URL(urlOrPath).toString();
  } catch {
    const fallbackBase =
      typeof window !== "undefined" && /^https?:/i.test(window.location.href) ? window.location.href : "http://localhost/";
    return new URL(urlOrPath, fallbackBase).toString();
  }
}

function buildRequestUrl(base: string, path: string): string {
  return toAbsoluteUrl(joinPath(base, path));
}

function authHeaders(getToken: GetToken): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    if (text) {
      try {
        const parsed = JSON.parse(text) as { error?: string; message?: string };
        const msg = (parsed.error ?? parsed.message ?? "").trim();
        throw new Error(msg || `Request failed with status ${response.status}`);
      } catch {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
    }
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export function createApiClient(baseUrl: string, getToken: GetToken = () => null): ApiClient {
  return {
    async login(password) {
      return fetchJson<{ token: string }>(buildRequestUrl(baseUrl, "/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
    },

    async validateAuth() {
      return fetchJson<{ valid: boolean }>(buildRequestUrl(baseUrl, "/auth/validate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(getToken)
        }
      });
    },

    async logout() {
      return fetchJson<{ ok: boolean }>(buildRequestUrl(baseUrl, "/auth/logout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(getToken)
        }
      });
    },

    async fetchCompetitions(query) {
      const url = new URL(buildRequestUrl(baseUrl, "/catalog/competitions"));
      url.searchParams.set("seasonId", query.seasonId);
      url.searchParams.set("gender", query.gender);
      const payload = await fetchJson<{ competitions: CompetitionOption[] }>(url.toString(), {
        headers: authHeaders(getToken)
      });
      return payload.competitions ?? [];
    },

    async fetchTeams(query) {
      const url = new URL(buildRequestUrl(baseUrl, "/catalog/teams"));
      url.searchParams.set("competitionId", query.competitionId);
      url.searchParams.set("seasonId", query.seasonId);
      const payload = await fetchJson<{ teams: TeamOption[] }>(url.toString(), {
        headers: authHeaders(getToken)
      });
      return payload.teams ?? [];
    },

    async fetchPlayers(query) {
      const url = new URL(buildRequestUrl(baseUrl, "/catalog/players"));
      url.searchParams.set("teamId", query.teamId);
      url.searchParams.set("seasonId", query.seasonId);
      const payload = await fetchJson<{ players: PlayerOption[] }>(url.toString(), {
        headers: authHeaders(getToken)
      });
      return (payload.players ?? []).map((player) => ({
        ...player,
        label: playerLabel(player)
      }));
    },

    async getBoardCurrent() {
      return fetchJson<BoardDocument>(buildRequestUrl(baseUrl, "/board/current"), {
        headers: authHeaders(getToken)
      });
    },

    async putBoardCurrent(payload) {
      return fetchJson<BoardDocument>(buildRequestUrl(baseUrl, "/board/current"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(getToken)
        },
        body: JSON.stringify(payload)
      });
    },

    async exportBoardCurrent(payload) {
      const response = await fetch(buildRequestUrl(baseUrl, "/board/current/export-xlsx"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(getToken)
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Export failed with status ${response.status}`);
      }
      return response.blob();
    }
  };
}
