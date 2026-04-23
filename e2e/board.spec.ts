import { expect, test } from "@playwright/test";

const emptyBoardResponse = {
  meta: {
    shareToken: "token-e2e",
    title: "Scouting ShortList",
    seasonId: "2026",
    gender: "male",
    updatedAt: new Date().toISOString()
  },
  slots: []
};

test("selects a player with 3-step flow and updates a slot", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (route.request().method() === "GET" && path.includes("/catalog/competitions")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          competitions: [{ id: "IT1", name: "Serie A", area: "Italy", season: "2026" }]
        })
      });
    }
    if (route.request().method() === "GET" && path.includes("/catalog/teams")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          teams: [{ teamId: "team-1", teamName: "Genoa CFC" }]
        })
      });
    }
    if (route.request().method() === "GET" && path.includes("/catalog/players")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          players: [
            {
              playerId: "player-1",
              firstName: "Antoine",
              lastName: "Beydts",
              dateOfBirth: "2008-01-01T00:00:00.000Z",
              contractExpires: "2026-06-30T00:00:00.000Z",
              teams: [{ isMain: true, name: "Genoa CFC", externalId: "team-1" }]
            }
          ]
        })
      });
    }
    if (route.request().method() === "GET" && path.includes("/board/")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(emptyBoardResponse)
      });
    }
    if (route.request().method() === "PUT" && path.includes("/board/")) {
      const body = route.request().postData() ?? "{}";
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body
      });
    }
    if (route.request().method() === "POST" && path.includes("/export-xlsx")) {
      return route.fulfill({
        status: 200,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        body: "ok"
      });
    }
    return route.fulfill({ status: 404, body: "not mocked" });
  });

  await page.goto("/?token=token-e2e");
  await page.getByRole("button", { name: "Seleziona player" }).first().click();

  await page.getByLabel("Competizione").selectOption("IT1");
  await page.getByLabel("Squadra").selectOption("team-1");
  await page.getByLabel("Giocatore").selectOption("player-1");
  await page.getByRole("button", { name: "Applica" }).click();

  await expect(page.getByLabel("Player").first()).toHaveValue("Beydts");
  await expect(page.getByLabel("Name").first()).toHaveValue("Antoine");
});
