import { EMPTY_SLOT_PAYLOAD } from "../constants/layout";
import type { PlayerApiDoc, PlayerApiTeam, SlotPayload } from "../types";

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

export function toAutofillFromApiPlayer(player: PlayerApiDoc, competitionId: string): SlotPayload {
  const firstName = (player.firstName ?? "").trim();
  const lastName = (player.lastName ?? "").trim();
  const fullName = (player.name ?? "").trim();
  const mainTeam = pickMainTeam(player.teams);

  const name = firstName;
  const playerField = lastName || fullName || firstName;
  const playerId = (player.playerId ?? player.id ?? player.internalId ?? "").trim();
  const teamId = (mainTeam?.externalId ?? mainTeam?.teamId ?? mainTeam?.id ?? "").trim();
  const club = (mainTeam?.name ?? "").trim();

  return {
    ...EMPTY_SLOT_PAYLOAD,
    name,
    player: playerField,
    club,
    age: isoDateToYear(player.dateOfBirth),
    expiring: isoDateToDay(player.contractExpires),
    playerId,
    teamId,
    competitionId: competitionId.trim()
  };
}

export function playerLabel(player: PlayerApiDoc): string {
  const first = (player.firstName ?? "").trim();
  const last = (player.lastName ?? "").trim();
  const full = `${first} ${last}`.trim();
  if (full) {
    return full;
  }
  return (player.name ?? player.playerId ?? player.id ?? "Player").trim();
}
