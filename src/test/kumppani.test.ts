import { describe, expect, it } from "vitest";
import { kumppaniKoodi, provisio } from "../../api/_lib/kumppani.js";
import { KUMPPANUUS } from "../../api/_lib/vakiot.js";

describe("kumppanuusohjelma", () => {
  const paalla = { ...KUMPPANUUS, kaytossa: true };
  it("pois päältä oletuksena: koodia ei hyväksytä", () => {
    expect(KUMPPANUUS.kaytossa).toBe(false);
    expect(kumppaniKoodi("anna")).toBeNull();
  });
  it("vain tunnetut, kelvolliset koodit", () => {
    const kumppanit = { "anna-k": "Anna K." };
    expect(kumppaniKoodi("Anna-K", { asetukset: paalla, kumppanit })).toBe("anna-k");
    expect(kumppaniKoodi("tuntematon", { asetukset: paalla, kumppanit })).toBeNull();
    expect(kumppaniKoodi("<script>", { asetukset: paalla, kumppanit })).toBeNull();
  });
  it("provisio 10 % tuotteista ilman ALV:tä, kate jää vähintään 2 €", () => {
    expect(provisio(24.9, 7.22, paalla)).toBe(1.98);
    expect(provisio(71.15, 7.01 - 0, paalla)).toBe(5.01);
    expect(provisio(71.15, 3, paalla)).toBe(1);
    expect(provisio(49.99, 1.5, paalla)).toBe(0);
  });
});
