export type ScenarioId = "0-2" | "2-5" | "5-10" | "10-20";

export type LaneId = "A1B1" | "A2" | "B1";

export type PositionId =
  | "1-GK"
  | "2-RWB"
  | "3-LWB"
  | "4-RCB"
  | "5-CB"
  | "6-LCB"
  | "7-CM"
  | "8-DM"
  | "9-CF"
  | "10-AM"
  | "11-ST"
  | "12-AW";

export interface PositionDefinition {
  id: PositionId;
  code: number;
  title: string;
}

export interface SlotCoordinate {
  positionId: PositionId;
  rank: number;
  scenario: ScenarioId;
  lane: LaneId;
}

export interface SlotPayload {
  name: string;
  player: string;
  club: string;
  age: string;
  expiring: string;
  playerId: string;
  teamId: string;
  competitionId: string;
}

export type SlotEntry = SlotCoordinate & SlotPayload;

export interface BoardMeta {
  shareToken: string;
  title: string;
  seasonId: string;
  gender: "male" | "female";
  updatedAt: string;
}

export interface BoardDocument {
  meta: BoardMeta;
  slots: SlotEntry[];
}

export interface CompetitionOption {
  id: string;
  name: string;
  area: string;
  season: string;
}

export interface TeamOption {
  teamId: string;
  teamName: string;
}

export interface PlayerApiTeam {
  isMain?: boolean;
  name?: string;
  externalId?: string;
  teamId?: string;
  id?: string;
}

export interface PlayerApiDoc {
  playerId?: string;
  id?: string;
  internalId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  dateOfBirth?: string;
  contractExpires?: string;
  teams?: PlayerApiTeam[];
}

export interface PlayerOption extends PlayerApiDoc {
  label: string;
}
