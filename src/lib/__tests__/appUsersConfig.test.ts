import { describe, expect, it } from "vitest";

import { findUserByPassword, parseAppUsersConfig } from "../../../supabase/functions/api/authConfig";

describe("app users config", () => {
  it("maps structured users to independent board tokens", () => {
    const users = parseAppUsersConfig({
      usersJson: JSON.stringify({
        users: [
          { password: "primary-pass", boardToken: "primary-board" },
          { password: "secondary-pass", boardToken: "secondary-board", cloneFromBoardToken: "primary-board" }
        ]
      })
    });

    expect(findUserByPassword(users, "primary-pass")).toMatchObject({
      boardToken: "primary-board"
    });
    expect(findUserByPassword(users, "secondary-pass")).toMatchObject({
      boardToken: "secondary-board",
      cloneFromBoardToken: "primary-board"
    });
  });

  it("keeps legacy password config on the default board token", () => {
    const users = parseAppUsersConfig({
      passwordsJson: JSON.stringify(["owner-pass", "other-pass"]),
      defaultBoardToken: "internal-board"
    });

    expect(users).toEqual([
      { password: "owner-pass", boardToken: "internal-board" },
      { password: "other-pass", boardToken: "internal-board" }
    ]);
  });

  it("merges additional users and clones from the default board without exposing legacy secrets", () => {
    const users = parseAppUsersConfig({
      passwordsJson: JSON.stringify(["owner-pass"]),
      additionalUsersJson: JSON.stringify({
        users: [{ password: "secondary-pass", boardToken: "secondary-board", cloneFromDefaultBoard: true }]
      }),
      defaultBoardToken: "internal-board"
    });

    expect(findUserByPassword(users, "owner-pass")).toMatchObject({
      boardToken: "internal-board"
    });
    expect(findUserByPassword(users, "secondary-pass")).toMatchObject({
      boardToken: "secondary-board",
      cloneFromBoardToken: "internal-board"
    });
  });

  it("rejects invalid structured users", () => {
    expect(() =>
      parseAppUsersConfig({
        usersJson: JSON.stringify({ users: [{ password: "short-token", boardToken: "short" }] })
      })
    ).toThrow("No valid users in APP_USERS_JSON");
  });
});
