import { describe, expect, it, beforeAll } from "vitest";
import { laskeTilaus, laskettuNettokate, KassaVirhe } from "../../api/_lib/kassa.js";
import { tilausRunko } from "../../api/_lib/printify.js";
import { laskeTilauksenNettokate } from "../../api/_lib/kate.js";
import { rivinHinta } from "../../api/_lib/kokohinnat.js";
import { HINNASTO, HINNASTOT, toimitusmaksu } from "../../api/_lib/vakiot.js";
import { tarkistaTunniste } from "../../api/_lib/markkinointi.js";
import { tavaramerkki } from "../../api/_lib/tavaramerkit.js";
import {
  MALLIT, PAINOALUEET, PERSONOITU_TUOTE, PERSONOITU_HUPPARI, PERSONOITU_HUPPARI_SLUG, PERSONOITU_SLUG,
  asettele, jasennaPersonointi, painokuvaSvg, personointiTeksti, tarkistaPersonointi,
} from "../../api/_lib/personoitu.js";
import painokuva from "../../api/painokuva.js";

beforeAll(() => { process.env.MARKKINOINTI_SALAISUUS = process.env.MARKKINOINTI_SALAISUUS || "testisalaisuus"; });
const osoite = { address: "Katu 1", zip: "00100", city: "Helsinki" };
const pyynto = (slug: string, customText: string, size = "L", color = "Musta") => ({
  items: [{ slug, quantity: 1, size, color, customText }], customerEmail: "a@b.fi", shippingAddress: osoite,
});
const TUOTTEET = [["t-paita", PERSONOITU_TUOTE], ["huppari", PERSONOITU_HUPPARI]] as const;

describe("personoidut mallit", () => {
  it("25 mallia: 5 vanhaa ikäpaitaa ja 20 uutta, pakolliset mukana", () => {
    expect(MALLIT.filter((m) => m.vanha).map((m) => m.id)).toEqual(["kokenut", "nuori", "paras", "takuu", "amatimies"]);
    expect(MALLIT.filter((m) => !m.vanha)).toHaveLength(20);
    expect(new Set(MALLIT.map((m) => m.id)).size).toBe(MALLIT.length);
    expect(new Set(MALLIT.map((m) => m.nimi)).size).toBe(MALLIT.length);
    const rivit = (id: string, a: Record<string, unknown>) => MALLIT.find((m) => m.id === id)!.rivit(a).map(([t]) => t.toUpperCase()).join(" ");
    expect(rivit("paras-isa", { nimi: "Pekka" })).toBe("MAAILMAN PARAS ISÄ: PEKKA");
    expect(rivit("saunan-vanhin", { nimi: "Erkki" })).toBe("ERKKI, SAUNAN VANHIN");
    expect(rivit("elakkeella-vuodesta", { vuosi: 2026 })).toBe("ELÄKKEELLÄ VUODESTA 2026");
    expect(rivit("naimisissa", { nimi: "Pekka", nimi2: "Marja", vuosi: 1998 })).toBe("PEKKA JA MARJA NAIMISISSA 1998 LÄHTIEN");
    expect(rivit("mokkimestari", { nimi: "Seppo" })).toBe("MÖKKIMESTARI SEPPO");
  });

  it("asiakastekstit ilman ajatusviivoja", () => {
    for (const m of MALLIT) {
      for (const t of [m.nimi, m.kuvaus, ...m.rivit({ ...m.esimerkki }).map(([r]) => r)]) expect(t, m.id).not.toMatch(/[–—]/);
    }
  });

  it("jokainen malli: esimerkki kelpaa, customText jäsentyy takaisin samaksi molemmilla tuotteilla", () => {
    for (const m of MALLIT) {
      for (const [tuote] of TUOTTEET) {
        const p = tarkistaPersonointi({ malli: m.id, ...m.esimerkki }, { tuote });
        expect(p.ok, `${m.id} ${tuote}`).toBe(true);
        const teksti = personointiTeksti(p);
        expect(jasennaPersonointi(teksti, { tuote }), teksti).toEqual(p);
      }
    }
  });

  it("vanhojen ostoskorien customText toimii yhä", () => {
    expect(jasennaPersonointi("Kokenut, ei vanha: Marja 50v")).toMatchObject({ ok: true, malli: "kokenut", nimi: "Marja", ika: 50 });
    expect(jasennaPersonointi("Takuu mennyt, toimii silti: Jussi 60v")).toMatchObject({ ok: true, malli: "takuu", ika: 60 });
    expect(jasennaPersonointi("Amatimies: Pertti")).toMatchObject({ ok: true, malli: "amatimies", nimi: "Pertti" });
    expect(personointiTeksti({ malli: "nuori", nimi: "Pekka", ika: 60 })).toBe("Vuotta nuori: Pekka 60v");
  });

  it("uusien mallien customText on luettava", () => {
    const p = tarkistaPersonointi({ malli: "naimisissa", nimi: "Pekka", nimi2: "Marja", vuosi: "1998" });
    expect(personointiTeksti(p)).toBe("Naimisissa: Pekka & Marja, 1998");
    expect(personointiTeksti(tarkistaPersonointi({ malli: "synttarisankari", nimi: "Ville", ika: "7" }))).toBe("Synttärisankari: Ville, 7v");
    expect(personointiTeksti(tarkistaPersonointi({ malli: "elakkeella-vuodesta", vuosi: "2026" }))).toBe("Eläkkeellä vuodesta: 2026");
    expect(jasennaPersonointi("Naimisissa: Pekka, 1998").ok).toBe(false);
    expect(jasennaPersonointi("Naimisissa: Pekka & Marja, 1998, ylimääräinen").ok).toBe(false);
  });

  it("vuosi ja ikä mallin välillä, kentät pakollisia", () => {
    expect(tarkistaPersonointi({ malli: "elakkeella-vuodesta", vuosi: "1890" }).ok).toBe(false);
    expect(tarkistaPersonointi({ malli: "elakkeella-vuodesta", vuosi: "20x6" }).ok).toBe(false);
    expect(tarkistaPersonointi({ malli: "naimisissa", nimi: "Pekka", vuosi: "1998" })).toMatchObject({ ok: false, virhe: "Kirjoita toinen nimi." });
    expect(tarkistaPersonointi({ malli: "synttarisankari", nimi: "Ville", ika: "0" }).ok).toBe(false);
    expect(tarkistaPersonointi({ malli: "kokenut", nimi: "Marja", ika: "17" }).ok).toBe(false);
  });
});

describe("suodatus: kirosanat ja tavaramerkit", () => {
  it("tavaramerkit estetään normalisoituna", () => {
    for (const t of ["Nike", "Coca-Cola", "coca cola", "Muumi", "Moomin", "Kärpät", "McDonald's", "Star Wars", "HIFK", "Hello Kitty", "Lego", "Pokémon", "Marimekko"]) {
      expect(tavaramerkki(t), t).not.toBeNull();
    }
    for (const n of ["Annike", "Elsa", "Valkonen", "Mario", "Pekka", "Marja-Liisa", "Legolas"]) expect(tavaramerkki(n), n).toBeNull();
  });
  it("estetty nimi ei kelpaa malliin eikä kahden nimen yhdistelmänä", () => {
    expect(tarkistaPersonointi({ malli: "paras-isa", nimi: "Disney" })).toMatchObject({ ok: false });
    expect(tarkistaPersonointi({ malli: "paras-isa", nimi: "Perkele" })).toMatchObject({ ok: false });
    expect(tarkistaPersonointi({ malli: "naimisissa", nimi: "Coca", nimi2: "Cola", vuosi: "2000" })).toMatchObject({ ok: false });
    expect(tarkistaPersonointi({ malli: "paras-isa", nimi: "Pekka-1" }).ok).toBe(false);
  });
});

describe("mahtuminen painoalueelle", () => {
  it("liian pitkä teksti hylätään selkeällä virheellä, sama tarkistus kassassa", () => {
    const pitka = { malli: "naimisissa", nimi: "Annamaria Liis", nimi2: "Wilhelmiina Mm", vuosi: "1998" };
    expect(tarkistaPersonointi(pitka)).toEqual({ ok: false, virhe: "Teksti ei mahdu painoalueelle. Lyhennä nimeä." });
    const teksti = "Naimisissa: Annamaria Liis & Wilhelmiina Mm, 1998";
    expect(jasennaPersonointi(teksti).ok).toBe(false);
    expect(() => laskeTilaus(pyynto(PERSONOITU_SLUG, teksti), [], null)).toThrow(/ei mahdu/);
    expect(() => laskeTilaus(pyynto(PERSONOITU_HUPPARI_SLUG, teksti), [], null)).toThrow(KassaVirhe);
  });
  it("pisin sallittu yksittäinen nimi mahtuu jokaiseen malliin", () => {
    for (const m of MALLIT.filter((x) => x.kentat.nimi && !x.kentat.nimi2)) {
      for (const [tuote] of TUOTTEET) {
        expect(tarkistaPersonointi({ malli: m.id, ...m.esimerkki, nimi: "Marja-Liisa Ko" }, { tuote }).ok, `${m.id} ${tuote}`).toBe(true);
      }
    }
  });
  it("rivit pysyvät painoalueen sisällä ja fonttikoko alarajan yläpuolella", () => {
    for (const m of MALLIT) {
      for (const [tuote] of TUOTTEET) {
        const a = asettele(m.rivit({ ...m.esimerkki }), tuote);
        expect(a.mahtuu).toBe(true);
        expect(Math.max(...a.linjat), `${m.id} ${tuote}`).toBeLessThanOrEqual(PAINOALUEET[tuote].korkeus);
      }
    }
  });
  it("painokuvan SVG tuotteen painoalueen mitoissa", () => {
    const p = tarkistaPersonointi({ malli: "golfari", nimi: "Kari" }, { tuote: "huppari" });
    expect(painokuvaSvg(p, "Valkoinen", { tuote: "huppari" })).toMatch(/^<svg [^>]*width="3709" height="2472"/);
    expect(painokuvaSvg(p, "Musta")).toMatch(/width="3461" height="3955"[\s\S]*fill="#ffffff"/);
  });
  it("painokuvareitti hylkää allekirjoitetunkin tekstin, joka ei mahdu", async () => {
    const { allekirjoita } = await import("../../api/_lib/markkinointi.js");
    const t = allekirjoita("painokuva", JSON.stringify({ m: "naimisissa", a: { nimi: "Annamaria Liis", nimi2: "Wilhelmiina Mm", vuosi: 1998 }, v: "Musta", t: "huppari" }));
    let status = 0;
    const res = { status: (s: number) => { status = s; return res; }, json: () => res, setHeader: () => res, send: () => res };
    await painokuva({ method: "GET", query: { t } } as never, res as never);
    expect(status).toBe(400);
  });
});

describe("kate: vähintään 10 € jokaisella variantilla (yhden tuotteen tilaus, toimitusmaksu kuten kassassa)", () => {
  const kate = (tuote: typeof PERSONOITU_TUOTE | typeof PERSONOITU_HUPPARI, avain: string, kerroin = 1, hinta?: number) => {
    const id = (tuote.variants.variant_map as Record<string, number>)[avain];
    const yksikkohinta = hinta ?? rivinHinta(tuote, avain.split("|")[1]);
    const maksu = toimitusmaksu({ summa: yksikkohinta, kpl: 1 });
    return laskeTilauksenNettokate([{ tuote, varianttiId: id, maara: 1, yksikkohinta }], maksu, { kerroin });
  };

  it("hinnat: t-paita 32,90 €, huppari 57,90 € ja 3XL+ 60,90 €", () => {
    expect(PERSONOITU_TUOTE.price).toBe(32.9);
    expect(PERSONOITU_HUPPARI.price).toBe(57.9);
    expect(rivinHinta(PERSONOITU_HUPPARI, "2XL")).toBe(57.9);
    for (const k of ["3XL", "4XL", "5XL"]) expect(rivinHinta(PERSONOITU_HUPPARI, k)).toBe(60.9);
    expect(HINNASTO.personoitu).toBe(32.9);
  });

  for (const [nimi, tuote] of TUOTTEET) {
    it(`${nimi}: kaikki variantit`, () => {
      const avaimet = Object.keys(tuote.variants.variant_map);
      expect(avaimet.length).toBeGreaterThan(20);
      for (const avain of avaimet) {
        const k = kate(tuote, avain);
        expect(k.tunnettu, avain).toBe(true);
        expect(k.nettokate, `${nimi} ${avain}`).toBeGreaterThanOrEqual(10);
      }
    });
    it(`${nimi}: ALV-varasuunnitelman hinnasto (Printify-kulu x 1,255) täyttää saman rajan`, () => {
      const h = HINNASTOT.alvKulu;
      for (const avain of Object.keys(tuote.variants.variant_map)) {
        const iso = /^(3|4|5)XL$/.test(avain.split("|")[1]);
        const hinta = nimi === "huppari" ? (iso ? h.personoituHuppari.iso : h.personoituHuppari.perus) : h.personoitu;
        expect(kate(tuote, avain, 1.255, hinta).nettokate, `${nimi} ${avain}`).toBeGreaterThanOrEqual(10);
      }
    });
    it(`${nimi}: kassan laskenta yhden tuotteen tilauksella`, () => {
      for (const avain of Object.keys(tuote.variants.variant_map)) {
        const [vari, koko] = avain.split("|");
        const r = laskeTilaus(pyynto(tuote.slug, "Golfari: Kari", koko, vari), [], null);
        expect(r.shipping).toBe(6.9);
        expect(laskettuNettokate(r, []), avain).toBeGreaterThanOrEqual(10);
      }
    });
  }
});

describe("Printify-tilausrunko personoiduille tuotteille", () => {
  const runko = (rivit: unknown[]) => tilausRunko({ id: "abcdef12-0000", customer_email: "a@b.fi", shipping_address: osoite, items: rivit });

  it("t-paita: bp 145 / pp 30, katalogin variantti-id ja allekirjoitettu kuva-URL", () => {
    const r = laskeTilaus(pyynto(PERSONOITU_SLUG, "Maailman paras isä: Pekka", "XL", "Valkoinen"), [], null);
    const rivi = runko(r.rivit).line_items[0];
    expect(rivi).toMatchObject({ blueprint_id: 145, print_provider_id: 30, variant_id: 38205, quantity: 1 });
    expect(Object.keys(rivi.print_areas)).toEqual(["front"]);
    const url = new URL(rivi.print_areas.front);
    expect(url.pathname).toBe("/api/painokuva");
    expect(JSON.parse(tarkistaTunniste(url.searchParams.get("t"), "painokuva"))).toEqual({ m: "paras-isa", a: { nimi: "Pekka" }, v: "Valkoinen", t: "t-paita" });
  });

  it("huppari: bp 77 / pp 402 (Atelier Katanga), 3XL-hinta ja tuotetyyppi kuvassa", () => {
    const r = laskeTilaus(pyynto(PERSONOITU_HUPPARI_SLUG, "Naimisissa: Pekka & Marja, 1998", "3XL", "Tummansininen"), [], null);
    expect(r.rivit[0]).toMatchObject({ unit_price: 60.9, printify_product_id: "PERSONOITU_HUPPARI", variant_id: 32899, kulu_sentit: 3117, toimitus_sentit: 1089 });
    const rivi = runko(r.rivit).line_items[0];
    expect(rivi).toMatchObject({ blueprint_id: 77, print_provider_id: 402, variant_id: 32899, quantity: 1 });
    expect(rivi).not.toHaveProperty("product_id");
    const t = new URL(rivi.print_areas.front).searchParams.get("t");
    expect(JSON.parse(tarkistaTunniste(t, "painokuva"))).toEqual({ m: "naimisissa", a: { nimi: "Pekka", nimi2: "Marja", vuosi: 1998 }, v: "Tummansininen", t: "huppari" });
  });

  it("t-paita ja huppari samassa tilauksessa: kaksi lennosta luotua riviä, ilmainen toimitus kahdesta tuotteesta", () => {
    const r = laskeTilaus({ items: [
      { slug: PERSONOITU_SLUG, quantity: 1, size: "M", color: "Musta", customText: "Kokenut, ei vanha: Marja 50v" },
      { slug: PERSONOITU_HUPPARI_SLUG, quantity: 1, size: "L", color: "Vaaleanharmaa", customText: "Eläkkeellä vuodesta: 2026" },
    ], customerEmail: "a@b.fi", shippingAddress: osoite }, [], null);
    const rivit = runko(r.rivit).line_items;
    expect(rivit.map((l) => [l.blueprint_id, l.print_provider_id, l.variant_id])).toEqual([[145, 30, 38178], [77, 402, 32904]]);
    expect(laskettuNettokate(r, [])).toBeGreaterThanOrEqual(10);
  });

  it("hupparista puuttuva väri ja koko ei mene kassalle", () => {
    expect(() => laskeTilaus(pyynto(PERSONOITU_HUPPARI_SLUG, "Golfari: Kari", "5XL", "Tummansininen"), [], null)).toThrow(KassaVirhe);
  });

  it("virheellinen personointi tilausrivillä kaataa rungon (ei painoon ilman tekstiä)", () => {
    expect(() => runko([{ printify_product_id: "PERSONOITU_HUPPARI", variant_id: 32920, quantity: 1, custom_text: "Golfari: Nike", color: "Musta" }])).toThrow(/Personointi/);
  });
});

describe("PersonoidutNosto", () => {
  it("valitsee polusta neljä olemassa olevaa mallia", async () => {
    const { nostonMallit } = await import("@/components/PersonoidutNosto");
    for (const polku of ["/", "/joulu", "/joululahja-isalle", "/isanpaiva", "/lahjat/aidille", "/sauna", "/lahjat/mokkeilijalle", "/lahjat/elakkeelle-jaavalle", "/lahjat/50-vuotiaalle-miehelle", "/haalarimerkit"]) {
      const ids = nostonMallit(polku);
      expect(ids, polku).toHaveLength(4);
      for (const id of ids) expect(MALLIT.some((m) => m.id === id), `${polku} ${id}`).toBe(true);
    }
    expect(nostonMallit("/joulu")[0]).toBe("tonttu");
    expect(nostonMallit("/sauna")[0]).toBe("saunan-vanhin");
  });
});
