export interface AppUserConfig {
  password: string;
  boardToken: string;
  cloneFromBoardToken?: string;
}

interface ParseUsersInput {
  usersJson?: string;
  additionalUsersJson?: string;
  passwordsJson?: string;
  defaultBoardToken?: string;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function tokenIsValid(token: string): boolean {
  return /^[A-Za-z0-9_-]{8,128}$/.test(token);
}

function parseJson(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Invalid ${label}`);
  }
}

function parseStructuredUsers(raw: string, label: string, defaultBoardToken = ""): AppUserConfig[] {
  const parsed = parseJson(raw, label);
  const list =
    parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).users)
      ? ((parsed as Record<string, unknown>).users as unknown[])
      : Array.isArray(parsed)
        ? parsed
        : [];

  const users = list
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }
      const rawUser = item as Record<string, unknown>;
      const password = clean(rawUser.password);
      const boardToken = clean(rawUser.boardToken);
      const cloneFromDefaultBoard = rawUser.cloneFromDefaultBoard === true;
      const cloneFromBoardToken = cloneFromDefaultBoard ? clean(defaultBoardToken) : clean(rawUser.cloneFromBoardToken);
      if (!password || !tokenIsValid(boardToken)) {
        return null;
      }
      return {
        password,
        boardToken,
        ...(cloneFromBoardToken && tokenIsValid(cloneFromBoardToken) ? { cloneFromBoardToken } : {})
      };
    })
    .filter((user): user is AppUserConfig => user !== null);

  if (users.length === 0) {
    throw new Error(`No valid users in ${label}`);
  }
  return users;
}

function parseLegacyUsers(raw: string, defaultBoardToken: string): AppUserConfig[] {
  if (!tokenIsValid(defaultBoardToken)) {
    throw new Error("Missing or invalid APP_DEFAULT_BOARD_TOKEN");
  }
  const parsed = parseJson(raw, "APP_USERS_PASSWORDS_JSON");
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).passwords)
      ? ((parsed as Record<string, unknown>).passwords as unknown[])
      : [];

  const users = list
    .map((item) => clean(item))
    .filter(Boolean)
    .map((password) => ({ password, boardToken: defaultBoardToken }));

  if (users.length === 0) {
    throw new Error("No valid passwords in APP_USERS_PASSWORDS_JSON");
  }
  return users;
}

export function parseAppUsersConfig(input: ParseUsersInput): AppUserConfig[] {
  const usersJson = clean(input.usersJson);
  const additionalUsersJson = clean(input.additionalUsersJson);
  const defaultBoardToken = clean(input.defaultBoardToken);
  if (usersJson) {
    const baseUsers = parseStructuredUsers(usersJson, "APP_USERS_JSON", defaultBoardToken);
    return additionalUsersJson
      ? [...baseUsers, ...parseStructuredUsers(additionalUsersJson, "APP_ADDITIONAL_USERS_JSON", defaultBoardToken)]
      : baseUsers;
  }

  const passwordsJson = clean(input.passwordsJson);
  if (!passwordsJson) {
    throw new Error("Missing APP_USERS_JSON or APP_USERS_PASSWORDS_JSON");
  }
  const legacyUsers = parseLegacyUsers(passwordsJson, defaultBoardToken);
  return additionalUsersJson
    ? [...legacyUsers, ...parseStructuredUsers(additionalUsersJson, "APP_ADDITIONAL_USERS_JSON", defaultBoardToken)]
    : legacyUsers;
}

export function findUserByPassword(users: AppUserConfig[], password: string): AppUserConfig | null {
  const cleanedPassword = clean(password);
  return users.find((user) => user.password === cleanedPassword) ?? null;
}
