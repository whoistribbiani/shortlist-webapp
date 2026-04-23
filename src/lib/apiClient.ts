import type {
  BoardDocument,
  CompetitionOption,
  PlayerOption,
  TeamOption
} from "../types";
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

interface ApiClient {
  fetchCompetitions(query: CompetitionsQuery): Promise<CompetitionOption[]>;
  fetchTeams(query: TeamsQuery): Promise<TeamOption[]>;
  fetchPlayers(query: PlayersQuery): Promise<PlayerOption[]>;
  getBoard(shareToken: string): Promise<BoardDocument>;
  putBoard(shareToken: string, payload: BoardDocument): Promise<BoardDocument>;
  exportBoard(shareToken: string, payload: BoardDocument): Promise<Blob>;
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
      typeof window !== "undefined" && /^https?:/i.test(window.location.href)
        ? window.location.href
        : "http://localhost/";
    return new URL(urlOrPath, fallbackBase).toString();
  }
}

function buildRequestUrl(base: string, path: string): string {
  return toAbsoluteUrl(joinPath(base, path));
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export function createApiClient(baseUrl: string): ApiClient {
  return {
    async fetchCompetitions(query) {
      const url = new URL(buildRequestUrl(baseUrl, "/catalog/competitions"));
      url.searchParams.set("seasonId", query.seasonId);
      url.searchParams.set("gender", query.gender);
      const payload = await fetchJson<{ competitions: CompetitionOption[] }>(url.toString());
      return payload.competitions ?? [];
    },

    async fetchTeams(query) {
      const url = new URL(buildRequestUrl(baseUrl, "/catalog/teams"));
      url.searchParams.set("competitionId", query.competitionId);
      url.searchParams.set("seasonId", query.seasonId);
      const payload = await fetchJson<{ teams: TeamOption[] }>(url.toString());
      return payload.teams ?? [];
    },

    async fetchPlayers(query) {
      const url = new URL(buildRequestUrl(baseUrl, "/catalog/players"));
      url.searchParams.set("teamId", query.teamId);
      url.searchParams.set("seasonId", query.seasonId);
      const payload = await fetchJson<{ players: PlayerOption[] }>(url.toString());
      return (payload.players ?? []).map((player) => ({
        ...player,
        label: playerLabel(player)
      }));
    },

    async getBoard(shareToken) {
      return fetchJson<BoardDocument>(buildRequestUrl(baseUrl, `/board/${encodeURIComponent(shareToken)}`));
    },

    async putBoard(shareToken, payload) {
      return fetchJson<BoardDocument>(buildRequestUrl(baseUrl, `/board/${encodeURIComponent(shareToken)}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },

    async exportBoard(shareToken, payload) {
      const response = await fetch(buildRequestUrl(baseUrl, `/board/${encodeURIComponent(shareToken)}/export-xlsx`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
