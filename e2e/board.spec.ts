import { expect, test } from "@playwright/test";

const emptyBoardResponse = {
  meta: {
    shareToken: "internal-board",
    title: "Scouting ShortList",
    seasonId: "2026",
    gender: "male",
    updatedAt: new Date().toISOString()
  },
  slots: []
};

test("selects a player with autocomplete flow and enriches the slot", async ({ page }) => {
  let hasImageProxyRequest = false;
  let hasAuthorizedApiCall = false;
  let hasTeamLogoRequest = false;
  page.on("dialog", (dialog) => dialog.accept());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () => Promise.resolve()
      },
      configurable: true
    });
  });

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const auth = route.request().headers()["authorization"] ?? "";
    if (auth === "Bearer test-auth-token") {
      hasAuthorizedApiCall = true;
    }
    if (route.request().method() === "POST" && path.includes("/auth/login")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ token: "test-auth-token" })
      });
    }
    if (route.request().method() === "POST" && path.includes("/auth/validate")) {
      if (auth !== "Bearer test-auth-token") {
        return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ valid: false }) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: true }) });
    }
    if (route.request().method() === "POST" && path.includes("/auth/logout")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }

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
    if (route.request().method() === "GET" && path.includes("/catalog/team")) {
      hasTeamLogoRequest = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          teamId: "team-1",
          teamName: "Genoa CFC",
          teamLogoUrl: "https://example.test/team-logo.png"
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
    if (route.request().method() === "GET" && path.includes("/board/current")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(emptyBoardResponse)
      });
    }
    if (route.request().method() === "PUT" && path.includes("/board/current")) {
      const body = route.request().postData() ?? "{}";
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body
      });
    }
    if (route.request().method() === "POST" && path.includes("/board/current/export-xlsx")) {
      return route.fulfill({
        status: 200,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        body: "ok"
      });
    }
    return route.fulfill({ status: 404, body: "not mocked" });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Accesso ShortList" })).toBeVisible();
  await page.getByLabel("Password").fill("owner-password");
  await page.getByRole("button", { name: "Accedi" }).click();

  await page.getByTestId("copy-link-btn").click();
  await expect(page.getByTestId("copy-link-btn")).toHaveText("Copiato");

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
  await expect(firstCard.locator(".slot-player-first-name")).toHaveText("Antoine");
  await expect(firstCard.locator(".slot-team-logo")).toHaveAttribute("src", /\/api\/catalog\/player-image\?src=/);
  expect(hasAuthorizedApiCall).toBe(true);
  expect(hasImageProxyRequest).toBe(true);
  expect(hasTeamLogoRequest).toBe(true);

  await expect(firstCard.getByTestId("video-open")).toHaveAttribute("aria-disabled", "true");
  await firstCard.getByTestId("video-edit").click();
  await expect(page.getByTestId("video-popover-overlay")).toBeVisible();
  await page
    .getByTestId("video-popover-input")
    .fill("https://onedrive.live.com/watch?v=abcdefghijk_lunghissimo_valore");
  await page.getByTestId("video-popover-save").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect(page.getByTestId("video-popover-overlay")).toHaveCount(0);
  await expect(firstCard.getByTestId("video-open")).toHaveAttribute(
    "href",
    "https://onedrive.live.com/watch?v=abcdefghijk_lunghissimo_valore"
  );
  await expect(firstCard.getByTestId("video-open")).toHaveAttribute("aria-disabled", "false");

  await firstCard.getByTestId("video-edit").click();
  await expect(page.getByTestId("video-popover-overlay")).toBeVisible();
  await page.getByTestId("video-popover-remove").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect(page.getByTestId("video-popover-overlay")).toHaveCount(0);
  await expect(firstCard.getByTestId("video-open")).not.toHaveAttribute("href", /https?:\/\//);
  await expect(firstCard.getByTestId("video-open")).toHaveAttribute("aria-disabled", "true");

  const noOverflow = await firstCard.locator(".slot-player-link, .autofit-text, .autofit-input").evaluateAll((els) =>
    els.every((el) => {
      const fontSize = Number.parseFloat(window.getComputedStyle(el).fontSize || "0");
      const minReadableSize =
        el.classList.contains("slot-player-link") || el.classList.contains("slot-player-label")
          ? 14.1
          : el.classList.contains("slot-player-first-name")
            ? 11.1
          : el.classList.contains("slot-player-team")
            ? 11.1
            : 10.1;
      return el.scrollWidth <= el.clientWidth + 1 || fontSize <= minReadableSize;
    })
  );
  expect(noOverflow).toBe(true);

  const footerInsideCard = await firstCard.evaluate((card) => {
    const footer = card.querySelector(".slot-footer-actions");
    const expiring = card.querySelector('input[aria-label="Expiring"]');
    if (!footer) {
      return false;
    }
    const cardRect = card.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const expiringRect = expiring?.getBoundingClientRect();
    return (
      footerRect.left >= cardRect.left &&
      footerRect.top >= cardRect.top &&
      footerRect.right <= cardRect.right &&
      footerRect.bottom <= cardRect.bottom &&
      (!expiringRect || footerRect.top >= expiringRect.bottom)
    );
  });
  expect(footerInsideCard).toBe(true);

  await page.setViewportSize({ width: 390, height: 780 });
  const mobileFooterInsideCard = await firstCard.evaluate((card) => {
    const footer = card.querySelector(".slot-footer-actions");
    const expiring = card.querySelector('input[aria-label="Expiring"]');
    if (!footer) {
      return false;
    }
    const cardRect = card.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const expiringRect = expiring?.getBoundingClientRect();
    return (
      footerRect.left >= cardRect.left &&
      footerRect.top >= cardRect.top &&
      footerRect.right <= cardRect.right &&
      footerRect.bottom <= cardRect.bottom &&
      (!expiringRect || footerRect.top >= expiringRect.bottom)
    );
  });
  expect(mobileFooterInsideCard).toBe(true);

  await firstCard.getByTestId("slot-remove").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect(firstCard).toHaveAttribute("data-state", "empty");
  await expect(firstCard.locator('input[aria-label="Player"]')).toHaveCount(0);
  await expect(firstCard.locator('input[aria-label="Name"]')).toHaveCount(0);
});
