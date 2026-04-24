import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import * as XLSX from "npm:xlsx@0.18.5";

type ScenarioId = "0-2" | "2-5" | "5-10" | "10-20";
type LaneId = "A1B1" | "A2" | "B1";

interface SlotEntry {
  positionId: string;
  rank: number;
  scenario: ScenarioId;
  lane: LaneId;
  name: string;
  player: string;
  club: string;
  age: string;
  expiring: string;
  videoUrl: string;
  playerId: string;
  playerInternalId: string;
  playerImageUrl: string;
  teamId: string;
  competitionId: string;
}

interface BoardMeta {
  shareToken: string;
  title: string;
  seasonId: string;
  gender: "male" | "female";
  updatedAt: string;
}

interface BoardDocument {
  meta: BoardMeta;
  slots: SlotEntry[];
}

const POSITIONS = [
  { id: "1-GK", code: 1, title: "GK - GoalKeeper" },
  { id: "2-RWB", code: 2, title: "RWB - Right Wing Back" },
  { id: "3-LWB", code: 3, title: "LWB - Left Wing Back" },
  { id: "4-RCB", code: 4, title: "RCB - Right Centre Back" },
  { id: "5-CB", code: 5, title: "CB - Centre Back" },
  { id: "6-LCB", code: 6, title: "LCB - Left Centre Back" },
  { id: "7-CM", code: 7, title: "CM - Central Midfielder" },
  { id: "8-DM", code: 8, title: "DM - Difensive Midfielder" },
  { id: "9-CF", code: 9, title: "CF - Central Forward" },
  { id: "10-AM", code: 10, title: "AM - Attacking Midfielder" },
  { id: "11-ST", code: 11, title: "ST - 2nd Striker" },
  { id: "12-AW", code: 12, title: "AW - Attacking Winger" }
] as const;

const SCENARIOS: Array<{ id: ScenarioId; columns: [number, number, number] }> = [
  { id: "0-2", columns: [3, 4, 5] },
  { id: "2-5", columns: [6, 7, 8] },
  { id: "5-10", columns: [9, 10, 11] },
  { id: "10-20", columns: [12, 13, 14] }
];

const LANE_INDEX: Record<LaneId, 0 | 1 | 2> = {
  A1B1: 0,
  A2: 1,
  B1: 2
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS"
};

interface AuthTokenPayload {
  sub: string;
  exp: number;
}

const SESSION_TTL_SECONDS = 12 * 60 * 60;

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getDefaultBoardToken(): string {
  const token = clean(Deno.env.get("APP_DEFAULT_BOARD_TOKEN") ?? "");
  if (!token || !tokenIsValid(token)) {
    throw new Error("Missing or invalid APP_DEFAULT_BOARD_TOKEN");
  }
  return token;
}

function parseUsersPasswords(): string[] {
  const raw = clean(Deno.env.get("APP_USERS_PASSWORDS_JSON") ?? "");
  if (!raw) {
    throw new Error("Missing APP_USERS_PASSWORDS_JSON");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid APP_USERS_PASSWORDS_JSON");
  }

  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).passwords)
      ? ((parsed as Record<string, unknown>).passwords as unknown[])
      : [];

  const out = list.map((item) => clean(item)).filter(Boolean);
  if (out.length === 0) {
    throw new Error("No valid passwords in APP_USERS_PASSWORDS_JSON");
  }
  return out;
}

function authSigningSecret(): string {
  const secret = clean(Deno.env.get("APP_AUTH_SIGNING_SECRET") ?? "");
  if (!secret) {
    throw new Error("Missing APP_AUTH_SIGNING_SECRET");
  }
  return secret;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function importSigningKey(): Promise<CryptoKey> {
  const secret = authSigningSecret();
  const keyData = new TextEncoder().encode(secret);
  return crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function signAuthPayload(payloadBase64: string): Promise<string> {
  const key = await importSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadBase64));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function createAuthToken(payload: AuthTokenPayload): Promise<string> {
  const payloadBase64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signAuthPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  const [payloadBase64, signatureBase64] = token.split(".");
  if (!payloadBase64 || !signatureBase64) {
    return null;
  }

  const expectedSignature = await signAuthPayload(payloadBase64);
  const expectedBytes = base64UrlToBytes(expectedSignature);
  const gotBytes = base64UrlToBytes(signatureBase64);
  if (!timingSafeEqual(expectedBytes, gotBytes)) {
    return null;
  }

  try {
    const payloadText = new TextDecoder().decode(base64UrlToBytes(payloadBase64));
    const parsed = JSON.parse(payloadText) as Partial<AuthTokenPayload>;
    const exp = Number(parsed.exp ?? 0);
    if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      sub: clean(parsed.sub),
      exp
    };
  } catch {
    return null;
  }
}

function parseBearerToken(request: Request): string {
  const auth = clean(request.headers.get("authorization") ?? "");
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return "";
  }
  return clean(auth.slice(7));
}

function tokenIsValid(token: string): boolean {
  return /^[A-Za-z0-9_-]{8,128}$/.test(token);
}

function toScenario(value: string): ScenarioId {
  if (value === "2-5" || value === "5-10" || value === "10-20") {
    return value;
  }
  return "0-2";
}

function toLane(value: string): LaneId {
  if (value === "A2" || value === "B1") {
    return value;
  }
  return "A1B1";
}

function toRank(value: unknown): number {
  const rank = Number(value);
  if (!Number.isFinite(rank)) {
    return 1;
  }
  return Math.min(6, Math.max(1, Math.round(rank)));
}

function normalizeSlot(input: unknown): SlotEntry | null {
  if (!input || typeof input !== "object") {
    return null;
  }
  const raw = input as Record<string, unknown>;
  const positionId = clean(raw.positionId);
  if (!POSITIONS.find((position) => position.id === positionId)) {
    return null;
  }
  return {
    positionId,
    rank: toRank(raw.rank),
    scenario: toScenario(clean(raw.scenario)),
    lane: toLane(clean(raw.lane)),
    name: clean(raw.name),
    player: clean(raw.player),
    club: clean(raw.club),
    age: clean(raw.age),
    expiring: clean(raw.expiring),
    videoUrl: clean(raw.videoUrl),
    playerId: clean(raw.playerId),
    playerInternalId: clean(raw.playerInternalId),
    playerImageUrl: clean(raw.playerImageUrl),
    teamId: clean(raw.teamId),
    competitionId: clean(raw.competitionId)
  };
}

function slotMapKey(slot: Pick<SlotEntry, "positionId" | "rank" | "scenario" | "lane">): string {
  return `${slot.positionId}|${slot.rank}|${slot.scenario}|${slot.lane}`;
}

function parsePath(requestUrl: string): string[] {
  const pathname = new URL(requestUrl).pathname;
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "api") {
    return segments.slice(1);
  }
  const apiIndex = segments.indexOf("api");
  if (apiIndex >= 0) {
    return segments.slice(apiIndex + 1);
  }
  return segments;
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

function scoutasticConfig() {
  const baseUrl = clean(Deno.env.get("SCOUTASTIC_BASE_URL") ?? "");
  if (!baseUrl) {
    throw new Error("Missing SCOUTASTIC_BASE_URL or Scoutastic access key");
  }
  const host = new URL(baseUrl).hostname.toLowerCase();
  const fallbackKey = clean(Deno.env.get("SCOUTASTIC_ACCESS_KEY") ?? "");
  const hostSpecific =
    host === "scoutingdepartment.scoutastic.com"
      ? clean(Deno.env.get("SCOUTASTIC_ACCESS_KEY_SCOUTINGDEPARTMENT") ?? "")
      : host === "genoacfc.scoutastic.com"
        ? clean(Deno.env.get("SCOUTASTIC_ACCESS_KEY_GENOACFC") ?? "")
        : "";
  const accessKey = hostSpecific || fallbackKey;
  if (!accessKey) {
    throw new Error("Missing SCOUTASTIC_BASE_URL or Scoutastic access key");
  }
  return { baseUrl, accessKey };
}

function resolveScoutasticMediaUrl(raw: string, baseUrl: string): string {
  const value = clean(raw);
  if (!value) {
    return "";
  }
  try {
    return new URL(value).toString();
  } catch {
    try {
      return new URL(value, `${new URL(baseUrl).origin}/`).toString();
    } catch {
      return "";
    }
  }
}

function resolveScoutasticImageRequestUrl(source: string, baseUrl: string): URL | null {
  const src = clean(source);
  if (!src) {
    return null;
  }
  let candidate: URL;
  const scoutasticBase = new URL(baseUrl);
  try {
    candidate = new URL(src);
  } catch {
    candidate = new URL(src, `${scoutasticBase.origin}/`);
  }
  if (!["http:", "https:"].includes(candidate.protocol)) {
    return null;
  }
  if (candidate.hostname.toLowerCase() !== scoutasticBase.hostname.toLowerCase()) {
    return null;
  }
  return candidate;
}

async function scoutasticGet(
  path: string,
  params: Record<string, string | number | boolean | undefined | null>
): Promise<unknown> {
  const { baseUrl, accessKey } = scoutasticConfig();
  const url = new URL(path.replace(/^\/+/, ""), `${baseUrl.replace(/\/+$/, "")}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessKey}`
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Scoutastic ${response.status}: ${body || "request failed"}`);
  }
  return response.json();
}

function competitionApiIds(doc: Record<string, unknown>): string[] {
  const ordered = [
    clean(doc.transfermarktId),
    clean(doc.externalId),
    clean(doc.competitionExternalId),
    clean(doc.internalId),
    clean(doc.id)
  ];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of ordered) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    out.push(value);
  }
  return out;
}

async function fetchCompetitionsCatalog(seasonId: string, gender: string) {
  const maxPages = 30;
  const docs: Array<Record<string, unknown>> = [];
  let page = 1;
  while (page <= maxPages) {
    const payload = (await scoutasticGet("/competitions", {
      seasons: seasonId,
      gender,
      teamIds: "true",
      limit: 200,
      page
    })) as Record<string, unknown>;

    const pageDocs = Array.isArray(payload.docs) ? (payload.docs as Array<Record<string, unknown>>) : [];
    docs.push(...pageDocs);

    const hasNextPage = !!payload.hasNextPage;
    const totalPages = Number(payload.totalPages ?? 0);
    if ((totalPages > 0 && page >= totalPages) || (!hasNextPage && pageDocs.length === 0)) {
      break;
    }
    page += 1;
  }

  const deduped = new Map<
    string,
    {
      id: string;
      name: string;
      area: string;
      season: string;
      apiIds: string[];
    }
  >();
  for (const doc of docs) {
    const ids = competitionApiIds(doc);
    if (ids.length === 0) {
      continue;
    }
    const id = ids[0];
    deduped.set(id, {
      id,
      name: clean(doc.name) || id,
      area: clean(doc.area),
      season: clean(doc.season) || seasonId,
      apiIds: ids
    });
  }

  return [...deduped.values()].sort((a, b) => `${a.name}|${a.area}`.localeCompare(`${b.name}|${b.area}`));
}

async function fetchTeamsByCompetition(competitionId: string, seasonId: string) {
  const payload = (await scoutasticGet(`/competitions/${competitionId}/teams/${seasonId}`, {})) as Record<
    string,
    unknown
  >;
  const teams = Array.isArray(payload.teams) ? (payload.teams as Array<Record<string, unknown>>) : [];
  return teams
    .map((team) => {
      const teamId = clean(team.externalId) || clean(team.teamId) || clean(team.id);
      const teamName = clean(team.name) || clean(team.teamName) || teamId;
      return { teamId, teamName };
    })
    .filter((team) => !!team.teamId || !!team.teamName);
}

async function fetchPlayersByTeam(teamId: string, seasonId: string) {
  const { baseUrl } = scoutasticConfig();
  const payload = (await scoutasticGet(`/teams/${teamId}/players/${seasonId}`, {
    marketValues: "false",
    performanceData: "false",
    injuryData: "false",
    debuts: "false"
  })) as Record<string, unknown>;
  const players = Array.isArray(payload.players) ? (payload.players as Array<Record<string, unknown>>) : [];
  return players.map((player) => ({
    playerId: clean(player.playerId) || clean(player.id) || clean(player.internalId),
    id: clean(player.id),
    internalId: clean(player.internalId),
    firstName: clean(player.firstName),
    lastName: clean(player.lastName),
    name: clean(player.name),
    dateOfBirth: clean(player.dateOfBirth),
    contractExpires: clean(player.contractExpires),
    playerImageUrl: resolveScoutasticMediaUrl(clean(player.imageUrlV2) || clean(player.imageUrl), baseUrl),
    teams: Array.isArray(player.teams) ? player.teams : []
  }));
}

async function proxyScoutasticPlayerImage(source: string): Promise<Response> {
  const { baseUrl, accessKey } = scoutasticConfig();
  const imageUrl = resolveScoutasticImageRequestUrl(source, baseUrl);
  if (!imageUrl) {
    return jsonResponse({ error: "Invalid image source" }, 400);
  }

  const response = await fetch(imageUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessKey}`
    }
  });
  if (!response.ok) {
    const text = await response.text();
    return jsonResponse({ error: text || `Scoutastic image proxy failed (${response.status})` }, response.status);
  }

  const headers = new Headers(CORS_HEADERS);
  headers.set("Content-Type", response.headers.get("content-type") || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=1800");
  return new Response(response.body, { status: 200, headers });
}

async function ensureBoard(shareToken: string) {
  const supabase = getSupabaseAdmin();
  const existing = await supabase
    .from("boards")
    .select("id, share_token, title, season_id, gender, updated_at")
    .eq("share_token", shareToken)
    .maybeSingle();
  if (existing.error) {
    throw existing.error;
  }
  if (existing.data) {
    return existing.data;
  }

  const inserted = await supabase
    .from("boards")
    .insert({
      share_token: shareToken
    })
    .select("id, share_token, title, season_id, gender, updated_at")
    .single();
  if (inserted.error) {
    throw inserted.error;
  }
  return inserted.data;
}

async function fetchBoardDocument(shareToken: string): Promise<BoardDocument> {
  const supabase = getSupabaseAdmin();
  const board = await ensureBoard(shareToken);

  const slotsResponse = await supabase
    .from("board_slots")
    .select(
      "position_id, rank, scenario, lane, name, player, club, age, expiring, video_url, player_id, player_internal_id, player_image_url, team_id, competition_id"
    )
    .eq("board_id", board.id);

  if (slotsResponse.error) {
    throw slotsResponse.error;
  }

  const slots: SlotEntry[] = (slotsResponse.data ?? []).map((row) => ({
    positionId: clean(row.position_id),
    rank: toRank(row.rank),
    scenario: toScenario(clean(row.scenario)),
    lane: toLane(clean(row.lane)),
    name: clean(row.name),
    player: clean(row.player),
    club: clean(row.club),
    age: clean(row.age),
    expiring: clean(row.expiring),
    videoUrl: clean(row.video_url),
    playerId: clean(row.player_id),
    playerInternalId: clean(row.player_internal_id),
    playerImageUrl: clean(row.player_image_url),
    teamId: clean(row.team_id),
    competitionId: clean(row.competition_id)
  }));

  return {
    meta: {
      shareToken,
      title: clean(board.title) || "Scouting ShortList",
      seasonId: clean(board.season_id) || "2026",
      gender: clean(board.gender) === "female" ? "female" : "male",
      updatedAt: clean(board.updated_at) || new Date().toISOString()
    },
    slots
  };
}

async function saveBoardDocument(shareToken: string, payload: BoardDocument): Promise<BoardDocument> {
  const supabase = getSupabaseAdmin();
  const board = await ensureBoard(shareToken);

  const nextMeta = payload.meta ?? {
    shareToken,
    title: "Scouting ShortList",
    seasonId: "2026",
    gender: "male",
    updatedAt: new Date().toISOString()
  };

  const boardUpdate = await supabase
    .from("boards")
    .update({
      title: clean(nextMeta.title) || "Scouting ShortList",
      season_id: clean(nextMeta.seasonId) || "2026",
      gender: clean(nextMeta.gender) === "female" ? "female" : "male"
    })
    .eq("id", board.id);
  if (boardUpdate.error) {
    throw boardUpdate.error;
  }

  const metaUpsert = await supabase.from("board_meta").upsert({
    board_id: board.id,
    payload: payload.meta ?? {}
  });
  if (metaUpsert.error) {
    throw metaUpsert.error;
  }

  const normalizedSlots = Array.isArray(payload.slots)
    ? payload.slots.map((slot) => normalizeSlot(slot)).filter((slot): slot is SlotEntry => slot !== null)
    : [];

  const deleteSlots = await supabase.from("board_slots").delete().eq("board_id", board.id);
  if (deleteSlots.error) {
    throw deleteSlots.error;
  }

  if (normalizedSlots.length > 0) {
    const insertRows = normalizedSlots.map((slot) => ({
      board_id: board.id,
      position_id: slot.positionId,
      rank: slot.rank,
      scenario: slot.scenario,
      lane: slot.lane,
      name: slot.name,
      player: slot.player,
      club: slot.club,
      age: slot.age,
      expiring: slot.expiring,
      video_url: slot.videoUrl,
      player_id: slot.playerId,
      player_internal_id: slot.playerInternalId,
      player_image_url: slot.playerImageUrl,
      team_id: slot.teamId,
      competition_id: slot.competitionId
    }));
    const insertSlots = await supabase.from("board_slots").insert(insertRows);
    if (insertSlots.error) {
      throw insertSlots.error;
    }
  }

  return fetchBoardDocument(shareToken);
}

async function requireAuth(request: Request): Promise<AuthTokenPayload | null> {
  const token = parseBearerToken(request);
  if (!token) {
    return null;
  }
  return verifyAuthToken(token);
}

function buildPositionSheet(meta: BoardMeta, position: (typeof POSITIONS)[number], slotIndex: Map<string, SlotEntry>) {
  const rows = Array.from({ length: 48 }, () => Array(17).fill(""));

  rows[0][0] = "Shortlist";
  rows[4][5] = meta.title || "Scouting ShortList";
  rows[4][7] = position.code;
  rows[4][8] = position.title;
  rows[4][13] = new Date().toISOString().slice(0, 10);

  rows[6][1] = "n";
  rows[6][2] = "Info";
  rows[6][3] = "Scenario: 0 - 2 m/EUR";
  rows[6][6] = "Scenario: 2 - 5 m/EUR";
  rows[6][9] = "Scenario: 5 - 10 m/EUR";
  rows[6][12] = "Scenario: 10 - 20 m/EUR";

  rows[7][3] = "A1 / B1";
  rows[7][4] = "A2";
  rows[7][5] = "B1";
  rows[7][6] = "A1 / B1";
  rows[7][7] = "A2";
  rows[7][8] = "B1";
  rows[7][9] = "A1 / B1";
  rows[7][10] = "A2";
  rows[7][11] = "B1";
  rows[7][12] = "A1 / B1";
  rows[7][13] = "A2";
  rows[7][14] = "B1";

  for (let rank = 1; rank <= 6; rank += 1) {
    const rowBase = 8 + (rank - 1) * 6;
    rows[rowBase][1] = rank;
    rows[rowBase][2] = "Name";
    rows[rowBase + 1][2] = "Player";
    rows[rowBase + 2][2] = "Club";
    rows[rowBase + 3][2] = "Age";
    rows[rowBase + 4][2] = "Expiring";
    rows[rowBase + 5][2] = "Video";

    for (const scenario of SCENARIOS) {
      for (const lane of (["A1B1", "A2", "B1"] as const)) {
        const slot = slotIndex.get(
          slotMapKey({
            positionId: position.id,
            rank,
            scenario: scenario.id,
            lane
          })
        );
        const col = scenario.columns[LANE_INDEX[lane]];
        if (!slot) {
          continue;
        }
        rows[rowBase][col] = slot.name;
        rows[rowBase + 1][col] = slot.player;
        rows[rowBase + 2][col] = slot.club;
        rows[rowBase + 3][col] = slot.age;
        rows[rowBase + 4][col] = slot.expiring;
        rows[rowBase + 5][col] = slot.videoUrl;
      }
    }
  }
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildRecapSheet(slotIndex: Map<string, SlotEntry>) {
  const rows = Array.from({ length: 86 }, () => Array(17).fill(""));

  rows[0][0] = "Shortlist";
  rows[4][5] = "Scouting ShortList";
  rows[4][13] = new Date().toISOString().slice(0, 10);
  rows[6][1] = "n";
  rows[6][2] = "Info";
  rows[6][3] = "Scenario: 0 - 2 m/EUR";
  rows[6][6] = "Scenario: 2 - 5 m/EUR";
  rows[6][9] = "Scenario: 5 - 10 m/EUR";
  rows[6][12] = "Scenario: 10 - 20 m/EUR";
  rows[7][3] = "A1 / B1";
  rows[7][4] = "A2";
  rows[7][5] = "B1";
  rows[7][6] = "A1 / B1";
  rows[7][7] = "A2";
  rows[7][8] = "B1";
  rows[7][9] = "A1 / B1";
  rows[7][10] = "A2";
  rows[7][11] = "B1";
  rows[7][12] = "A1 / B1";
  rows[7][13] = "A2";
  rows[7][14] = "B1";

  POSITIONS.forEach((position, index) => {
    const rowBase = 8 + index * 6;
    rows[rowBase][1] = position.id;
    rows[rowBase][2] = "Name";
    rows[rowBase + 1][2] = "Player";
    rows[rowBase + 2][2] = "Club";
    rows[rowBase + 3][2] = "Age";
    rows[rowBase + 4][2] = "Expiring";
    rows[rowBase + 5][2] = "Video";

    for (const scenario of SCENARIOS) {
      for (const lane of (["A1B1", "A2", "B1"] as const)) {
        const slot = slotIndex.get(
          slotMapKey({
            positionId: position.id,
            rank: 1,
            scenario: scenario.id,
            lane
          })
        );
        const col = scenario.columns[LANE_INDEX[lane]];
        if (!slot) {
          continue;
        }
        rows[rowBase][col] = slot.name;
        rows[rowBase + 1][col] = slot.player;
        rows[rowBase + 2][col] = slot.club;
        rows[rowBase + 3][col] = slot.age;
        rows[rowBase + 4][col] = slot.expiring;
        rows[rowBase + 5][col] = slot.videoUrl;
      }
    }
  });

  return XLSX.utils.aoa_to_sheet(rows);
}

function buildOverviewSheet(meta: BoardMeta) {
  const rows = Array.from({ length: 9 }, () => Array(6).fill(""));
  rows[1][1] = "Genoa CFC";
  rows[3][1] = "File Name:";
  rows[3][3] = meta.title || "Genoa Scouting Shortlist";
  rows[6][1] = "Link";
  rows[6][3] = "Description";
  rows[7][1] = "Recap";
  rows[7][2] = "Automatic";
  rows[7][3] = "Top 1 for each position";
  rows[8][1] = "Input Tab";
  rows[8][2] = "Manual";
  rows[8][3] = "Other tabs, one for each position";
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildWorkbook(meta: BoardMeta, slots: SlotEntry[]): Uint8Array {
  const slotIndex = new Map<string, SlotEntry>();
  for (const slot of slots) {
    slotIndex.set(slotMapKey(slot), slot);
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, buildOverviewSheet(meta), "Overview");
  XLSX.utils.book_append_sheet(workbook, buildRecapSheet(slotIndex), "Recap");

  for (const position of POSITIONS) {
    const sheet = buildPositionSheet(meta, position, slotIndex);
    XLSX.utils.book_append_sheet(workbook, sheet, position.id);
  }
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const segments = parsePath(request.url);
    const method = request.method.toUpperCase();

    if (segments[0] === "auth" && segments[1] === "login" && method === "POST") {
      const body = (await request.json()) as { password?: string };
      const password = clean(body?.password ?? "");
      if (!password) {
        return jsonResponse({ error: "password is required" }, 400);
      }
      const validPasswords = parseUsersPasswords();
      if (!validPasswords.includes(password)) {
        return jsonResponse({ error: "Invalid credentials" }, 401);
      }
      const token = await createAuthToken({
        sub: "owner-managed-user",
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
      });
      return jsonResponse({ token });
    }

    if (segments[0] === "auth" && segments[1] === "validate" && method === "POST") {
      const auth = await requireAuth(request);
      if (!auth) {
        return jsonResponse({ valid: false }, 401);
      }
      return jsonResponse({ valid: true, exp: auth.exp });
    }

    if (segments[0] === "auth" && segments[1] === "logout" && method === "POST") {
      return jsonResponse({ ok: true });
    }

    if (segments[0] === "catalog" && segments[1] === "player-image" && method === "GET") {
      const url = new URL(request.url);
      const source = clean(url.searchParams.get("src"));
      if (!source) {
        return jsonResponse({ error: "src is required" }, 400);
      }
      return proxyScoutasticPlayerImage(source);
    }

    const auth = await requireAuth(request);
    if (!auth) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (segments[0] === "catalog" && segments[1] === "competitions" && method === "GET") {
      const url = new URL(request.url);
      const seasonId = clean(url.searchParams.get("seasonId")) || "2026";
      const gender = clean(url.searchParams.get("gender")) || "male";
      const competitions = await fetchCompetitionsCatalog(seasonId, gender);
      return jsonResponse({ competitions });
    }

    if (segments[0] === "catalog" && segments[1] === "teams" && method === "GET") {
      const url = new URL(request.url);
      const competitionId = clean(url.searchParams.get("competitionId"));
      const seasonId = clean(url.searchParams.get("seasonId")) || "2026";
      if (!competitionId) {
        return jsonResponse({ error: "competitionId is required" }, 400);
      }
      const teams = await fetchTeamsByCompetition(competitionId, seasonId);
      return jsonResponse({ teams });
    }

    if (segments[0] === "catalog" && segments[1] === "players" && method === "GET") {
      const url = new URL(request.url);
      const teamId = clean(url.searchParams.get("teamId"));
      const seasonId = clean(url.searchParams.get("seasonId")) || "2026";
      if (!teamId) {
        return jsonResponse({ error: "teamId is required" }, 400);
      }
      const players = await fetchPlayersByTeam(teamId, seasonId);
      return jsonResponse({ players });
    }

    if (segments[0] === "board" && segments[1] === "current" && method === "GET") {
      const board = await fetchBoardDocument(getDefaultBoardToken());
      return jsonResponse(board);
    }

    if (segments[0] === "board" && segments[1] === "current" && method === "PUT") {
      const payload = (await request.json()) as BoardDocument;
      const board = await saveBoardDocument(getDefaultBoardToken(), payload);
      return jsonResponse(board);
    }

    if (segments[0] === "board" && segments[1] === "current" && segments[2] === "export-xlsx" && method === "POST") {
      const shareToken = getDefaultBoardToken();
      const payload = (await request.json()) as BoardDocument;
      const normalizedSlots = Array.isArray(payload.slots)
        ? payload.slots.map((slot) => normalizeSlot(slot)).filter((slot): slot is SlotEntry => slot !== null)
        : [];
      const bytes = buildWorkbook(
        payload.meta ?? {
          shareToken,
          title: "Scouting ShortList",
          seasonId: "2026",
          gender: "male",
          updatedAt: new Date().toISOString()
        },
        normalizedSlots
      );
      return new Response(bytes, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=\"shortlist-${shareToken}.xlsx\"`
        }
      });
    }

    if (segments[0] === "board" && segments[1] && (method === "GET" || method === "PUT" || method === "POST")) {
      return jsonResponse({ error: "Legacy board routes are disabled. Use /board/current." }, 404);
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unexpected error"
      },
      500
    );
  }
});
