import { describe, expect, it } from "vitest";
import { valitysKohde, julkinenOrigin, fetchValitys, wwwOhjaus, UUSI_TUOTANTO } from "../../middleware";
import { STATIC_PAGE_META } from "../seo/staticPageMeta";
import { SITE_URL } from "../seo/site";

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

describe("välitystapa", () => {
  it("POST ja rajapinta fetchillä (runko mukana), sivut ja tiedostot rewritellä", () => {
    expect(fetchValitys("POST", "/api/checkout")).toBe(true);
    expect(fetchValitys("GET", "/api/products")).toBe(true);
    expect(fetchValitys("GET", "/tuote/x")).toBe(false);
    expect(fetchValitys("GET", "/assets/a.js")).toBe(false);
  });
});

describe("www-osoite (Search Console 3.11.2026)", () => {
  it("www ohjataan 301-kohteeseen ilman www:tä, polku ja kysely säilyvät", () => {
    expect(wwwOhjaus("https://www.huumorikauppa.fi/lahjat/pomolle?a=1")).toBe("https://huumorikauppa.fi/lahjat/pomolle?a=1");
    expect(wwwOhjaus("https://huumorikauppa.fi/")).toBeNull();
    expect(wwwOhjaus(`${UUSI_TUOTANTO}/x`)).toBeNull();
  });
  it("välitetyn www-pyynnön julkinen osoite (uudelleenohjaukset, canonical) on ilman www:tä", () => {
    const u = new URL(`${UUSI_TUOTANTO}/x`);
    expect(julkinenOrigin(new Request(u, { headers: { "x-huumorikauppa-proxy": "https://www.huumorikauppa.fi" } }), u)).toBe("https://huumorikauppa.fi");
  });
  it("sivuston perusosoite on ilman www:tä", () => {
    expect(SITE_URL).toBe("https://huumorikauppa.fi");
  });
  it("etusivu on hakulausekkeiden hauskat lahjat ja huumorilahjat kohdesivu", () => {
    expect(STATIC_PAGE_META["/"].title.toLowerCase()).toContain("hauskat lahjat");
    expect(STATIC_PAGE_META["/"].h1.toLowerCase()).toContain("huumorilahjat");
  });
});
