import { describe, it, expect, vi } from "vitest";
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({}) } }));
import { kuittiKuvaus, KUITTI_TOIMITUSAIKA } from "../../api/_lib/sahkoposti.js";
import { TOIMITUSAIKA_MIN_ARKIPAIVAA, TOIMITUSAIKA_MAX_ARKIPAIVAA } from "@/config/toimitus";

describe("Stripen kuitin kuvaus", () => {
  it("toimitusaika vastaa kaupan toimitusaikaa", () => {
    expect(KUITTI_TOIMITUSAIKA).toEqual([TOIMITUSAIKA_MIN_ARKIPAIVAA, TOIMITUSAIKA_MAX_ARKIPAIVAA]);
  });
  it("sisältää kaupan nimen, tilausnumeron, toimitusajan ja yhteystiedon", () => {
    const k = kuittiKuvaus("abcdef12-3456-7890-abcd-ef1234567890");
    expect(k).toContain("Huumorikauppa");
    expect(k).toContain("#ABCDEF12");
    expect(k).toMatch(/\d+-\d+ arkipäivää/);
    expect(k).toContain("huumorikauppa@gmail.com");
    expect(k.length).toBeLessThan(1000);
    expect(k).not.toMatch(/[–—]/);
  });
  it("pelkät lahjakortit ilman toimitusaikaa", () => {
    expect(kuittiKuvaus("abcdef12", { fyysisia: false })).not.toContain("arkipäivää");
  });
});

describe("kuitin rivin nimi", () => {
  it("lisää tilausnumeron ja toimitusajan rivin nimeen", async () => {
    const { kuittiRivinNimi } = await import("../../api/_lib/sahkoposti.js");
    expect(kuittiRivinNimi("Toimitus, Posti kotiinkuljetus", "abcdef12-xx")).toBe("Toimitus, Posti kotiinkuljetus (tilaus #ABCDEF12, toimitus yleensä 4-15 arkipäivää)");
    expect(kuittiRivinNimi("x".repeat(400), "abcdef12").length).toBeLessThanOrEqual(250);
  });
});
