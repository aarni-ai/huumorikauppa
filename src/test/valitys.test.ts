import { describe, expect, it } from "vitest";
import { valitysKohde, julkinenOrigin, UUSI_TUOTANTO } from "../../middleware";

describe("vanhan projektin välitys uuteen", () => {
  it("vanha projekti (ei UUSI_TAUSTA) välittää kaiken uuden projektin tuotantoon", () => {
    expect(valitysKohde("https://huumorikauppa.fi/tuote/x?a=1", undefined)).toBe(`${UUSI_TUOTANTO}/tuote/x?a=1`);
    expect(valitysKohde("https://huumorikauppa.fi/assets/i-abc.js", undefined)).toBe(`${UUSI_TUOTANTO}/assets/i-abc.js`);
  });
  it("uusi projekti ei välitä", () => {
    expect(valitysKohde("https://huumorikauppa.fi/", "1")).toBeNull();
    expect(valitysKohde(`${UUSI_TUOTANTO}/`, undefined)).toBeNull();
  });
  it("julkinen osoite vain huumorikauppa.fi-otsakkeesta", () => {
    const u = new URL(`${UUSI_TUOTANTO}/x`);
    expect(julkinenOrigin(new Request(u, { headers: { "x-huumorikauppa-proxy": "https://huumorikauppa.fi" } }), u)).toBe("https://huumorikauppa.fi");
    expect(julkinenOrigin(new Request(u, { headers: { "x-huumorikauppa-proxy": "https://evil.example" } }), u)).toBe(UUSI_TUOTANTO);
    expect(julkinenOrigin(new Request(u), u)).toBe(UUSI_TUOTANTO);
  });
});
