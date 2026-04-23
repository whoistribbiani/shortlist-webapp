import { EMPTY_SLOT_PAYLOAD } from "../constants/layout";
import type { PlayerApiDoc, PlayerApiTeam, SlotPayload } from "../types";

const SCOUTASTIC_ORIGIN = "https://genoacfc.scoutastic.com";

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function pickMainTeam(teams: PlayerApiTeam[] | undefined): PlayerApiTeam | undefined {
  if (!teams || !Array.isArray(teams) || teams.length === 0) {
    return undefined;
  }
  return teams.find((team) => team.isMain) ?? teams[0];
}

function isoDateToDay(input: string | undefined): string {
  if (!input) {
    return "";
  }
  const day = input.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
}

function isoDateToYear(input: string | undefined): string {
  if (!input || input.length < 4) {
    return "";
  }
  const year = input.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "";
}

function resolvePlayerImageUrl(player: PlayerApiDoc): string {
  const raw = clean(player.playerImageUrl) || clean(player.imageUrlV2) || clean(player.imageUrl);
  if (!raw) {
    return "";
  }
  try {
    return new URL(raw).toString();
  } catch {
    try {
      return new URL(raw, `${SCOUTASTIC_ORIGIN}/`).toString();
    } catch {
      return "";
    }
  }
}

export function toAutofillFromApiPlayer(player: PlayerApiDoc, competitionId: string): SlotPayload {
  const firstName = clean(player.firstName);
  const lastName = clean(player.lastName);
  const fullName = clean(player.name);
  const mainTeam = pickMainTeam(player.teams);

  const name = firstName;
  const playerField = lastName || fullName || firstName;
  const playerId = clean(player.playerId) || clean(player.id) || clean(player.internalId);
  const playerInternalId = clean(player.internalId);
  const teamId = clean(mainTeam?.externalId) || clean(mainTeam?.teamId) || clean(mainTeam?.id);
  const club = clean(mainTeam?.name);

  return {
    ...EMPTY_SLOT_PAYLOAD,
    name,
    player: playerField,
    club,
    age: isoDateToYear(player.dateOfBirth),
    expiring: isoDateToDay(player.contractExpires),
    playerId,
    playerInternalId,
    playerImageUrl: resolvePlayerImageUrl(player),
    teamId,
    competitionId: competitionId.trim()
  };
}

export function playerLabel(player: PlayerApiDoc): string {
  const first = clean(player.firstName);
  const last = clean(player.lastName);
  const full = `${first} ${last}`.trim();
  if (full) {
    return full;
  }
  return (player.name ?? player.playerId ?? player.id ?? "Player").trim();
}
