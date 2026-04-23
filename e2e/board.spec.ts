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

test("selects a player with autocomplete flow and enriches the slot", async ({ page }) => {
  let hasImageProxyRequest = false;
  page.on("dialog", (dialog) => dialog.accept());

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
              internalId: "internal-1",
              firstName: "Antoine",
              lastName: "Savio Camarda Lunghissimo Profilo",
              playerImageUrl: "https://example.test/antoine.png",
              dateOfBirth: "2008-01-01T00:00:00.000Z",
              contractExpires: "2026-06-30T00:00:00.000Z",
              teams: [{ isMain: true, name: "VITORIA GUIMARAES SPORTING CLUB MOLTO LUNGO", externalId: "team-1" }]
            }
          ]
        })
      });
    }
    if (route.request().method() === "GET" && path.includes("/catalog/player-image")) {
      hasImageProxyRequest = true;
      const onePixelPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7N7V8AAAAASUVORK5CYII=",
        "base64"
      );
      return route.fulfill({
        status: 200,
        contentType: "image/png",
        body: onePixelPng
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
  await page.getByTestId("slot-select").first().click();

  await page.getByLabel("Competizione").fill("serie");
  await page.locator("[data-testid='competition-suggestions']").getByRole("button", { name: /Serie A/ }).click();

  await page.getByLabel("Squadra").fill("genoa");
  await page.locator("[data-testid='team-suggestions']").getByRole("button", { name: "Genoa CFC" }).click();

  await page.getByLabel("Giocatore").fill("camarda");
  await page
    .locator("[data-testid='player-suggestions']")
    .getByRole("button", { name: "Antoine Savio Camarda Lunghissimo Profilo" })
    .click();

  await page.getByRole("button", { name: "Applica" }).click();

  const firstCard = page.locator(".slot-card").first();
  await expect(firstCard).toHaveAttribute("data-state", "filled");
  await expect(firstCard.locator('input[aria-label="Player"]')).toHaveCount(0);
  await expect(firstCard.locator('input[aria-label="Name"]')).toHaveCount(0);
  await expect(firstCard.locator(".slot-thumb")).toHaveAttribute("src", /\/api\/catalog\/player-image\?src=/);
  await expect(firstCard.locator(".slot-player-link")).toHaveAttribute(
    "href",
    "https://genoacfc.scoutastic.com/#/player/internal-1"
  );
  expect(hasImageProxyRequest).toBe(true);

  await firstCard.getByLabel("Video").fill("https://onedrive.live.com/watch?v=abcdefghijk_lunghissimo_valore");
  await expect(firstCard.getByLabel("Video")).toHaveValue(
    "https://onedrive.live.com/watch?v=abcdefghijk_lunghissimo_valore"
  );

  const noOverflow = await firstCard.locator(".slot-player-link, .autofit-text, .autofit-input").evaluateAll((els) =>
    els.every((el) => {
      const fontSize = Number.parseFloat(window.getComputedStyle(el).fontSize || "0");
      return el.scrollWidth <= el.clientWidth + 1 || fontSize <= 10.1;
    })
  );
  expect(noOverflow).toBe(true);

  await firstCard.getByTestId("slot-remove").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect(firstCard).toHaveAttribute("data-state", "empty");
  await expect(firstCard.locator('input[aria-label="Player"]')).toHaveCount(0);
  await expect(firstCard.locator('input[aria-label="Name"]')).toHaveCount(0);
});
