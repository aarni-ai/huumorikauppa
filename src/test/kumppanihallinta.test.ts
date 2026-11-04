// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { koodiNimesta, vapaaKoodi, malliTekstista, jasennaKumppaniRivit, luoKumppanit, tarkistaKumppaniSyote } from "../../api/_lib/kumppanihallinta.js";
import { KUMPPANIKOODI } from "../../api/_lib/kumppani.js";

beforeAll(() => { process.env.MARKKINOINTI_SALAISUUS = "testisalaisuus-kumppanit"; });

/** Kanta muistissa: vain kyselyt, joita luoKumppanit tekee (luonti, haku, lisäys). */
function muistikanta(alku: { koodi: string; nimi: string; malli: string }[] = []) {
  const rivit = new Map(alku.map((r) => [r.koodi, { ...r }]));
  const lisatyt: unknown[][] = [];
  const db = (osat: TemplateStringsArray, ...arvot: unknown[]) => {
    const q = osat.join("?").trim();
    if (/^(create|alter)/.test(q)) return Promise.resolve([]);
    if (q.startsWith("select koodi, nimi, malli from kumppanit")) return Promise.resolve([...rivit.values()]);
    if (q.startsWith("insert into kumppanit")) {
      const [koodi, nimi, , malli] = arvot as string[];
      lisatyt.push(arvot);
      const vanha = rivit.get(koodi);
      rivit.set(koodi, { koodi, nimi, malli: vanha ? ((arvot[4] as string) ?? vanha.malli) : malli });
      return Promise.resolve([]);
    }
    throw new Error(`odottamaton kysely: ${q}`);
  };
  return { db, rivit, lisatyt };
}

describe("kumppanikoodi nimestä", () => {
  it("pienet kirjaimet, ä -> a, ö -> o, å -> a, muut väliviivaksi", () => {
    expect(koodiNimesta("Antti Heinonen")).toBe("antti-heinonen");
    expect(koodiNimesta("Äijä Öljynen")).toBe("aija-oljynen");
    expect(koodiNimesta("Åsa Söderström")).toBe("asa-soderstrom");
    expect(koodiNimesta("  Keisarit ry!! ")).toBe("keisarit-ry");
    expect(koodiNimesta("Café & Bar 24/7")).toBe("cafe-bar-24-7");
  });
  it("enintään 30 merkkiä, ei väliviivaa lopussa, kelpaa koodiksi", () => {
    const k = koodiNimesta("Pohjois-Pohjanmaan Huumoriyhdistys ry");
    expect(k!.length).toBeLessThanOrEqual(30);
    expect(k).not.toMatch(/-$/);
    expect(KUMPPANIKOODI.test(k!)).toBe(true);
    expect(koodiNimesta("A")).toBeNull();
    expect(koodiNimesta("!!!")).toBeNull();
  });
  it("varattu toisella nimellä: -2, -3; sama nimi saa saman koodin", () => {
    const varatut = new Map([["antti", "Antti Heinonen"], ["antti-2", "Antti Virtanen"]]);
    expect(vapaaKoodi("antti", "Antti Mäkelä", varatut)).toBe("antti-3");
    expect(vapaaKoodi("antti", "antti  heinonen", varatut)).toBe("antti");
    expect(vapaaKoodi("matti", "Matti", varatut)).toBe("matti");
  });
});

describe("massaluonnin rivit", () => {
  it("puolipiste, sarkain ja pilkku; malli 1 tai 2; koodi valinnainen", () => {
    const { rivit, virheet } = jasennaKumppaniRivit("Nimi;koodi;malli\nAntti Heinonen; 1\n\nKeisarit ry\tkeisarit\t2\nMaija Mäki, malli 2, maija@esimerkki.fi\nPekka");
    expect(virheet).toEqual([]);
    expect(rivit).toEqual([
      { rivi: 2, nimi: "Antti Heinonen", koodi: null, malli: "provisio", email: null },
      { rivi: 4, nimi: "Keisarit ry", koodi: "keisarit", malli: "alennus", email: null },
      { rivi: 5, nimi: "Maija Mäki", koodi: null, malli: "alennus", email: "maija@esimerkki.fi" },
      { rivi: 6, nimi: "Pekka", koodi: null, malli: null, email: null },
    ]);
  });
  it("virheelliset rivit kerrotaan rivinumerolla", () => {
    const { virheet } = jasennaKumppaniRivit("Antti; <script>; 1\n; 2\nMaija; maija; 1; ylimaarainen\nPekka; pekka@");
    expect(virheet.map((v) => v.rivi)).toEqual([1, 2, 3, 4]);
  });
  it("malli tekstistä", () => {
    expect(["1", "malli 1", "Malli1", "provisio", "M1"].map(malliTekstista)).toEqual(Array(5).fill("provisio"));
    expect(["2", "malli 2", "alennus"].map(malliTekstista)).toEqual(Array(3).fill("alennus"));
    expect(malliTekstista("3")).toBeNull();
  });
  it("syötteen tarkistus", () => {
    expect(tarkistaKumppaniSyote({ nimi: "" }).virhe).toBeTruthy();
    expect(tarkistaKumppaniSyote({ nimi: "A", koodi: "X Y" }).virhe).toBeTruthy();
    expect(tarkistaKumppaniSyote({ nimi: "A", malli: "3" }).virhe).toBeTruthy();
    expect(tarkistaKumppaniSyote({ nimi: "A", email: "ei" }).virhe).toBeTruthy();
    expect(tarkistaKumppaniSyote({ nimi: " Anna  K ", koodi: "Anna-K", malli: "2" })).toEqual({ nimi: "Anna K", koodi: "anna-k", malli: "alennus", email: null });
  });
});

describe("luonti ja linkit", () => {
  it("törmäys toisen nimen kanssa, sama nimi päivittyy, linkit ja raportti", async () => {
    const { db, rivit, lisatyt } = muistikanta([{ koodi: "antti", nimi: "Antti Heinonen", malli: "provisio" }]);
    const { tulokset } = await luoKumppanit(db, [
      { nimi: "Antti" , malli: "2" }, { nimi: "Antti Heinonen" }, { nimi: "Äiti Öhman" }, { nimi: "Antti" }, { nimi: "X" },
    ], { pohja: "https://huumorikauppa.fi" });
    expect(tulokset.map((t) => t.koodi ?? t.virhe)).toEqual(["antti-2", "antti-heinonen", "aiti-ohman", "antti-2", expect.stringContaining("anna koodi")]);
    // "Antti" (malli 2) on uusi; sama nimi samassa erässä päivittää saman koodin eikä vaihda mallia.
    expect(tulokset[0]).toMatchObject({ uusi: true, malli: "alennus", linkki: "https://huumorikauppa.fi/k/antti-2" });
    expect(tulokset[3]).toMatchObject({ uusi: false, malli: "alennus" });
    expect(tulokset[0].raportti).toMatch(/^https:\/\/huumorikauppa\.fi\/kumppanit\/raportti\?koodi=antti-2&avain=.+/);
    expect(lisatyt.length).toBe(4);
    expect(rivit.get("antti")!.nimi).toBe("Antti Heinonen");
  });
  it("esikatselu ei kirjoita", async () => {
    const { db, lisatyt } = muistikanta();
    const { tulokset } = await luoKumppanit(db, [{ nimi: "Maija Mäki", malli: "1" }], { esikatselu: true });
    expect(tulokset[0]).toMatchObject({ koodi: "maija-maki", uusi: true });
    expect(lisatyt).toEqual([]);
  });
  it("raporttiavain kelpaa raporttiin", async () => {
    const { db } = muistikanta();
    const { tulokset: [t] } = await luoKumppanit(db, [{ nimi: "Anna", koodi: "anna-k" }]);
    const { tarkistaTunniste } = await import("../../api/_lib/markkinointi.js");
    const { RAPORTTI_TARKOITUS } = await import("../../api/_lib/kumppani.js");
    expect(tarkistaTunniste(decodeURIComponent(new URL(t.raportti).searchParams.get("avain")!), RAPORTTI_TARKOITUS)).toBe("anna-k");
  });
});

describe("hallinta /hallinta/kumppanit vaatii avaimen", () => {
  const vastaus = () => {
    const r = { status: 0, json: undefined as unknown, h: {} as Record<string, unknown> };
    return Object.assign(r, {
      setHeader: (k: string, v: unknown) => { r.h[k.toLowerCase()] = v; },
      getHeader: (k: string) => r.h[k.toLowerCase()],
      status(this: typeof r, s: number) { r.status = s; return this; },
    }, { json: (j: unknown) => { r.json = j; return r; } });
  };
  it("ilman avainta, väärällä avaimella tai toisen sivun avaimella 404", async () => {
    const { kasittele } = await import("../../api/sahkoposti.js");
    const { allekirjoita } = await import("../../api/_lib/markkinointi.js");
    const muu = allekirjoita("hallinta", "mittarit");
    for (const req of [
      { method: "GET", query: { kumppanit: "" }, headers: {} },
      { method: "GET", query: { kumppanit: "vaara.avain" }, headers: {} },
      { method: "GET", query: { kumppanit: muu }, headers: {} },
      { method: "POST", query: {}, headers: {}, body: { action: "kumppani-luo", teksti: "Antti; 1" } },
      { method: "POST", query: {}, headers: {}, body: { action: "kumppani-luo", avain: muu, kumppani: { nimi: "Antti" } } },
      { method: "POST", query: {}, headers: {}, body: { action: "kumppani-tila", koodi: "antti", aktiivinen: false } },
    ]) {
      const res = vastaus();
      await kasittele(req, res, {});
      expect(res.status).toBe(404);
    }
  });
  it("toisen hallintasivun eväste (2.11. aktivointi) avaa myös kumppanisivun (4.11.2026)", async () => {
    const { hallintaPaasy } = await import("../../api/sahkoposti.js");
    const { allekirjoita } = await import("../../api/_lib/markkinointi.js");
    const muu = allekirjoita("hallinta", "mittarit");
    const res = vastaus();
    expect(hallintaPaasy({ headers: { cookie: `hk_hallinta_mittarit=${encodeURIComponent(muu)}` } }, res, "kumppanit", "")).toBe(true);
  });
  it("kumppanit on hallintasivu: linkki päivän yhteenvedossa ja hallintalinkkiviestissä", async () => {
    const { HALLINTASIVUT, hallintaLinkit, hallintalinkkiViesti, yhteenvetoRivit } = await import("../../api/_lib/hallinta.js");
    expect(HALLINTASIVUT.map((s) => s.sivu)).toContain("kumppanit");
    const l = hallintaLinkit("https://huumorikauppa.fi");
    expect(yhteenvetoRivit(l).join("\n")).toContain("https://huumorikauppa.fi/hallinta/kumppanit?avain=");
    expect(hallintalinkkiViesti(l).text).toContain("/hallinta/kumppanit?avain=");
  });
});
