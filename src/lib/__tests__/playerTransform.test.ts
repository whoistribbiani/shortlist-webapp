import { describe, expect, it } from "vitest";

import { toAutofillFromApiPlayer } from "../playerTransform";

describe("playerTransform", () => {
  it("maps an API player payload into slot autofill fields", () => {
    const slot = toAutofillFromApiPlayer(
      {
        playerId: "123",
        internalId: "internal-123",
        firstName: "Antoine",
        lastName: "Beydts",
        imageUrlV2: "/images/player.png",
        dateOfBirth: "2008-03-11T00:00:00.000Z",
        contractExpires: "2026-06-30T00:00:00.000Z",
        teams: [
          {
            isMain: true,
            name: "MVV Maastricht",
            externalId: "team-1"
          }
        ]
      },
      "comp-77"
    );

    expect(slot).toMatchObject({
      playerId: "123",
      playerInternalId: "internal-123",
      playerImageUrl: "https://genoacfc.scoutastic.com/images/player.png",
      teamLogoUrl: "",
      competitionId: "comp-77",
      name: "Antoine",
      player: "Beydts",
      club: "MVV Maastricht",
      age: "2008",
      expiring: "2026-06-30",
      teamId: "team-1"
    });
  });

  it("gracefully handles partial player payload", () => {
    const slot = toAutofillFromApiPlayer(
      {
        id: "legacy-id",
        name: "Single Name"
      },
      ""
    );

    expect(slot.playerId).toBe("legacy-id");
    expect(slot.player).toBe("Single Name");
    expect(slot.playerInternalId).toBe("");
    expect(slot.playerImageUrl).toBe("");
    expect(slot.teamLogoUrl).toBe("");
    expect(slot.name).toBe("");
    expect(slot.club).toBe("");
    expect(slot.age).toBe("");
    expect(slot.expiring).toBe("");
  });

  it("uses Transfermarkt ID as player id fallback and maps direct lookup team data", () => {
    const slot = toAutofillFromApiPlayer(
      {
        transfermarktId: "698415",
        name: "Direct Player",
        teams: [
          {
            isMain: true,
            name: "Genoa CFC",
            externalId: "team-3376",
            imageUrlV2: "/images/team.png"
          }
        ]
      },
      ""
    );

    expect(slot.playerId).toBe("698415");
    expect(slot.player).toBe("Direct Player");
    expect(slot.club).toBe("Genoa CFC");
    expect(slot.teamId).toBe("team-3376");
    expect(slot.teamLogoUrl).toBe("https://genoacfc.scoutastic.com/images/team.png");
    expect(slot.competitionId).toBe("");
  });
});
