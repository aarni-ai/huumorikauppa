import { describe, expect, it } from "vitest";
import { kumppaniKoodi, kumppaniKoodinMuoto, provisio, provisioJaTila, PROVISIOSAANTO } from "../../api/_lib/kumppani.js";
import { KUMPPANUUS } from "../../api/_lib/vakiot.js";

describe("kumppanuusohjelma (hyväksytty 29.10.2026: kauppaan jää vähintään 5 €)", () => {
  it("käytössä, 10 %, vähintään 5,00 € katetta kaupalle", () => {
    expect(KUMPPANUUS).toMatchObject({ kaytossa: true, provisioProsentti: 10, minKateEuroa: 5 });
    expect(PROVISIOSAANTO).toContain("10 %");
    expect(PROVISIOSAANTO).toContain("5,00 €");
  });
  it("koodin muoto ja varalista", () => {
    expect(kumppaniKoodinMuoto("Anna-K")).toBe("anna-k");
    expect(kumppaniKoodinMuoto("<script>")).toBeNull();
    expect(kumppaniKoodi("anna-k", { asetukset: KUMPPANUUS, kumppanit: { "anna-k": "Anna" } })).toBe("anna-k");
    expect(kumppaniKoodi("tuntematon", { asetukset: KUMPPANUUS, kumppanit: {} })).toBeNull();
  });
  it("provisio enintään 10 % ja enintään summa, joka jättää kauppaan 5 €; muuten 0", () => {
    expect(provisioJaTila(24.9, 7.22)).toEqual({ provisio: 1.98, tila: "taysi" });
    expect(provisioJaTila(49.99, 7.86)).toEqual({ provisio: 2.86, tila: "rajattu" });
    expect(provisioJaTila(47.49, 4.94)).toEqual({ provisio: 0, tila: "ei" });
    expect(provisioJaTila(24.9, 5)).toEqual({ provisio: 0, tila: "ei" });
    expect(provisioJaTila(24.9, NaN)).toEqual({ provisio: 0, tila: "kate-tuntematon" });
    for (const [t, k] of [[24.9, 7.22], [49.99, 7.86], [71.15, 7.01], [547.8, 158.89]]) {
      const p = provisio(t, k);
      expect(k - p).toBeGreaterThanOrEqual(5);
      expect(p).toBeLessThanOrEqual((t / 1.255) * 0.1 + 0.005);
    }
  });
});
