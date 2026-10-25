import { describe, expect, it } from "vitest";
import { kaksoiskappaleenPerusslug, onTestikopio, onKaksoiskappaleTaiTestikopio } from "../../api/_lib/kaksoiskappaleet.js";
import { onPiilotettuTuote } from "@/lib/hiddenCategories";
import { dropHiddenItems } from "../../api/product-feed.js";

describe("Lovable-synkronoinnin kaksoiskappaleet", () => {
  it("tunnistaa Printify-tunnuksen päätteen ja palauttaa perusslugin", () => {
    expect(kaksoiskappaleenPerusslug("100-akaalaista-verta-hauska-t-paita-0d6670")).toBe("100-akaalaista-verta-hauska-t-paita");
    expect(kaksoiskappaleenPerusslug("amatimies-huppari-0e3e76")).toBe("amatimies-huppari");
    expect(kaksoiskappaleenPerusslug("saatanan-tunarit-t-paita")).toBeNull();
    // Pelkät kirjaimet eivät riitä (sanat kuten "decade").
    expect(kaksoiskappaleenPerusslug("paita-decade")).toBeNull();
    expect(kaksoiskappaleenPerusslug("40-vuotta-t-paita")).toBeNull();
  });
  it("testikopiot", () => {
    expect(onTestikopio("copy-of-olen-elakkeella-t-paita")).toBe(true);
    expect(onTestikopio("ceramic-mug-eu")).toBe(true);
    expect(onTestikopio("olen-elakkeella-t-paita")).toBe(false);
    expect(onKaksoiskappaleTaiTestikopio("copy-of-x")).toBe(true);
  });
  it("piilotetaan kaupasta ja syötteestä", () => {
    expect(onPiilotettuTuote({ slug: "amatimies-t-paita-02f10a", category: "t-paidat" })).toBe(true);
    expect(onPiilotettuTuote({ slug: "amatimies-t-paita", category: "t-paidat" })).toBe(false);
    const xml = `<channel><item><g:link>https://huumorikauppa.fi/tuote/amatimies-t-paita-02f10a</g:link></item><item><g:link>https://huumorikauppa.fi/tuote/amatimies-t-paita</g:link></item></channel>`;
    const out = dropHiddenItems(xml);
    expect(out).not.toContain("02f10a");
    expect(out).toContain("/tuote/amatimies-t-paita</g:link>");
  });
});
