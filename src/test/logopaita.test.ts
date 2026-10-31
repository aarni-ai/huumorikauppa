import { describe, expect, it, beforeAll } from "vitest";
import { laskeTilaus, laskettuNettokate, KassaVirhe } from "../../api/_lib/kassa.js";
import { tilausRunko } from "../../api/_lib/printify.js";
import { laskuData, laskeTarjous } from "../../api/_lib/yritysmyynti.js";
import {
  LOGOPAITA_SLUG, LOGOPAITA_TUOTE, LOGODESIGNIT, jasennaLogopaita, logopaitaTeksti, naytettavaTeksti, sallitutVarit, tarkistaLogopaita,
} from "../../api/_lib/logopaita.js";
import { tarkistaSvg } from "../../api/_lib/logopaita-kuva.js";

beforeAll(() => { process.env.MARKKINOINTI_SALAISUUS = process.env.MARKKINOINTI_SALAISUUS || "testisalaisuus"; });
const LOGO = "0b6f4a52-7d1c-4f3e-9a51-2c8e0f6d1a77";
const osoite = { address: "Katu 1", zip: "00100", city: "Helsinki" };
const design = LOGODESIGNIT[0].slug;
const teksti = (v: Parameters<typeof logopaitaTeksti>[0]) => logopaitaTeksti(v);
const pyynto = (koot: Record<string, number>, customText: string, color = "Valkoinen") => ({
  items: Object.entries(koot).map(([size, quantity]) => ({ slug: LOGOPAITA_SLUG, quantity, size, color, customText })),
  customerEmail: "a@b.fi", shippingAddress: osoite,
});

describe("Oma logo -paita", () => {
  it("valinta: logo tai teksti pakollinen, design listalta, kirosanat ja vieraat merkit estetään", () => {
    expect(tarkistaLogopaita({ logo: LOGO, rivit: [], design: null }).ok).toBe(true);
    expect(tarkistaLogopaita({ rivit: ["Yritys Oy", "huumorikauppa.fi"] }).ok).toBe(true);
    expect(tarkistaLogopaita({ rivit: ["", " "] }).ok).toBe(false);
    expect(tarkistaLogopaita({ logo: "ei-uuid", rivit: [] }).ok).toBe(false);
    expect(tarkistaLogopaita({ rivit: ["Perkeleen hyvä tiimi"] }).ok).toBe(false);
    expect(tarkistaLogopaita({ rivit: ["<script>"] }).ok).toBe(false);
    expect(tarkistaLogopaita({ rivit: ["x".repeat(29)] }).ok).toBe(false);
    expect(tarkistaLogopaita({ rivit: ["Oy"], design: "ei-ole-olemassa" }).ok).toBe(false);
    const v = { logo: LOGO, rivit: ["Yritys Oy", "Tiimi 2026"], design };
    expect(jasennaLogopaita(logopaitaTeksti(v))).toMatchObject({ ok: true, ...v });
    expect(naytettavaTeksti(logopaitaTeksti(v))).toMatch(/^Oma logo, teksti Yritys Oy \/ Tiimi 2026, design /);
    expect(naytettavaTeksti("Kalle 50v")).toBe("Kalle 50v");
  });

  it("kassa: 10 paitaa määräalennuksella, kate vähintään 5 €/paita, logo talteen riville", () => {
    const ct = teksti({ logo: LOGO, rivit: ["Yritys Oy"], design });
    const r = laskeTilaus(pyynto({ M: 4, L: 4, XL: 2 }, ct), [], null);
    expect(r.rivit[0]).toMatchObject({ slug: LOGOPAITA_SLUG, printify_product_id: "LOGOPAITA", custom_text: ct, logo: { id: LOGO, rivit: ["Yritys Oy"], design } });
    expect(r.subtotal).toBeCloseTo(10 * LOGOPAITA_TUOTE.price, 2);
    expect(r.discount + r.basket_discount).toBeGreaterThan(0);
    expect(r.shipping).toBe(0);
    expect(laskettuNettokate(r, [])).toBeGreaterThanOrEqual(5 * 10);
    for (const n of [25, 50]) {
      const iso = laskeTilaus(pyynto({ L: n }, ct), [], null);
      expect(laskettuNettokate(iso, [])).toBeGreaterThanOrEqual(5 * n);
    }
  });

  it("kassa hylkää alle 10 paitaa, väärän värin designin kanssa ja virheellisen valinnan", () => {
    const ct = teksti({ rivit: ["Yritys Oy"], design });
    expect(() => laskeTilaus(pyynto({ L: 9 }, ct), [], null)).toThrow(/vähintään 10/);
    expect(() => laskeTilaus(pyynto({ L: 10 }, ct, "Musta"), [], null)).toThrow(KassaVirhe);
    expect(sallitutVarit(design)).not.toContain("Musta");
    expect(() => laskeTilaus(pyynto({ L: 10 }, teksti({ rivit: ["Yritys Oy"] }), "Musta"), [], null)).not.toThrow();
    expect(() => laskeTilaus(pyynto({ L: 10 }, "Logo: x"), [], null)).toThrow(KassaVirhe);
  });

  it("Printify-rivi: lennosta luotu tuote OPT:lla (145/30, EU), allekirjoitettu tilauskohtainen painokuva", () => {
    const r = laskeTilaus(pyynto({ L: 10 }, teksti({ logo: LOGO, rivit: ["Yritys Oy"] }), "Tummansininen"), [], null);
    const runko = tilausRunko({ id: "abcdef12-0000", customer_email: "a@b.fi", shipping_address: osoite, items: r.rivit });
    expect(runko.line_items[0]).toMatchObject({ blueprint_id: 145, print_provider_id: 30, quantity: 10, variant_id: LOGOPAITA_TUOTE.variants.variant_map["Tummansininen|L"] });
    expect(runko.line_items[0].print_areas.front).toMatch(/\/api\/painokuva\?t=/);
  });

  it("lasku ja tarjouslaskuri: kuvaus laskulla, porrashinta tarjouksessa", () => {
    const r = laskeTilaus(pyynto({ L: 10 }, teksti({ logo: LOGO, rivit: ["Yritys Oy"] })), [], null);
    const d = laskuData({ rivit: r.rivit, toimitus: 0, tilausId: "t1", asiakas: { yritys: "Y", email: "a@b.fi", osoite: "K", postinumero: "00100", kaupunki: "H", ytunnus: "1234567-1" } });
    expect(d.items[0].description).toMatch(/oma logo, teksti Yritys Oy/);
    const t = laskeTarjous({ malli: "logopaita", koot: { M: 5, L: 5 } });
    expect(t).toMatchObject({ kpl: 10, alennusProsentti: 10 });
    expect(t!.katePerKpl).toBeGreaterThanOrEqual(5);
  });

  it("SVG-logo: skriptit ja ulkoiset viittaukset hylätään", () => {
    expect(tarkistaSvg('<svg viewBox="0 0 10 10"><path d="M0 0h10v10z"/></svg>')).toBeNull();
    expect(tarkistaSvg("<svg><script>alert(1)</script></svg>")).not.toBeNull();
    expect(tarkistaSvg('<svg onload="x()"></svg>')).not.toBeNull();
    expect(tarkistaSvg('<svg><image href="https://x.fi/a.png"/></svg>')).not.toBeNull();
    expect(tarkistaSvg("<html></html>")).not.toBeNull();
  });
});
