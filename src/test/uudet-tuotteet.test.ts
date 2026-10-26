import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  parseLista, hinnoittele, ylosX90, idempotenssiAvain, lueKirjaukset, joLuodut, kirjausRivi, otsikkoTeksti, normArvo,
  valitseVariantit, ratkaiseKohde, kasitteleTuote, TiedostoKatalogi, LiveKatalogi, teeApi, tekstivariRyhmat, VIIVA,
  KATEGORIAN_POHJAHINNAT, SUUNNITELTU_TOIMITUSMAKSU, SUUNNITELTU_ILMAINEN_RAJA, HINTAMALLIT, suomenToimitusVarianteille,
  blueprintEhdokkaat, kateAlvilla, TUOTETYYPIT,
} from "../../scripts/lib/uudet-tuotteet.mjs";
import { laskeKate, HINNOITTELU_KATE, KATE_RAJA as MYYNNIN_RAJA } from "../../api/_lib/kate.js";

const DATA = path.resolve(__dirname, "../../data/uudet-tuotteet");
const lue = (f: string) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));
const esimerkki = lue("katalogi-esimerkki.json");

const kateHinnalla = (hinta: number, kulu: number, toimitus: number, asetukset = {}) =>
  laskeKate({ price: hinta, variants: { costs: { v: kulu }, shipping_cents: toimitus } }, "v", { raja: HINNOITTELU_KATE, ...asetukset });

describe("hinnoittelun tavoite ja myynnin raja", () => {
  it("uudet tuotteet hinnoitellaan 40 %:n katteelle, myynti estetään vasta alle 20 %:n", () => {
    expect(HINNOITTELU_KATE).toBe(0.4);
    expect(MYYNNIN_RAJA).toBe(0.2);
  });
});

describe("hinta ja kate", () => {
  it("pienin x,90-hinta ylöspäin", () => {
    expect(ylosX90(7.9)).toBe(790);
    expect(ylosX90(7.91)).toBe(890);
    expect(ylosX90(34)).toBe(3490);
    expect(ylosX90(0)).toBe(90);
  });

  it("oletuksena suunniteltu toimitusmaksu 5,90 € ja ilmainen 60 €:sta", () => {
    expect(SUUNNITELTU_TOIMITUSMAKSU).toBe(5.9);
    expect(SUUNNITELTU_ILMAINEN_RAJA).toBe(60);
  });

  it("halpa paita: kategorian pohjahinta riittää", () => {
    const h = hinnoittele({ kulut: { 1: 1050, 2: 1250 }, toimitusSentit: 490, kategoria: "t-paidat" });
    expect(h.ok).toBe(true);
    expect(h.hinta).toBe(34.9);
    expect(h.peruste).toBe("kategorian pohjahinta");
    expect(h.kate).toBeGreaterThanOrEqual(0.4);
  });

  it("kallis huppari: pienin x,90, jolla kate >= 40 %, laskettuna suurimmalla kululla", () => {
    const h = hinnoittele({ kulut: { 1: 2250, 2: 2450 }, toimitusSentit: 690, kategoria: "hupparit" });
    expect(h.ok).toBe(true);
    expect(Math.round(h.hinta * 100) % 100).toBe(90);
    expect(h.hinta).toBeGreaterThanOrEqual(KATEGORIAN_POHJAHINNAT.hupparit);
    const asetukset = { toimitusmaksu: 5.9, ilmainenRaja: 60 };
    expect(kateHinnalla(h.hinta, 2450, 690, asetukset).sallittu).toBe(true);
    expect(kateHinnalla(h.hinta - 1, 2450, 690, asetukset).sallittu).toBe(false);
    expect(h.hinta).toBe(68.9);
  });

  it("toimitusmaksu ja ilmaisen toimituksen raja vaikuttavat (kate ei ole monotoninen rajalla)", () => {
    const kulut = { 1: 2000 }, toimitusSentit = 600;
    const suunniteltu = hinnoittele({ kulut, toimitusSentit, kategoria: "x" });
    const nyt = hinnoittele({ kulut, toimitusSentit, kategoria: "x", toimitusmaksu: 6.9, ilmainenRaja: 79 });
    expect(nyt.hinta).toBeLessThanOrEqual(suunniteltu.hinta);
    // Rajan alla toimitusmaksu kasvattaa myyntiä: 59,90 voi riittää, vaikka 60,90 ei riittäisi.
    const raja = hinnoittele({ kulut: { 1: 2400 }, toimitusSentit: 600, kategoria: "x" });
    expect(raja.hinta).toBeLessThan(60);
    expect(kateHinnalla(60.9, 2400, 600, { toimitusmaksu: 5.9, ilmainenRaja: 60 }).sallittu).toBe(false);
  });

  it("suunnitellulla maksulla laskettu hinta täyttää myös nykyisen säännön (6,90 € / 79 €)", () => {
    for (const [kulu, toimitus, kat] of [[1250, 490, "t-paidat"], [2450, 690, "hupparit"], [260, 350, "tarrat"], [750, 520, "koristeet"]] as const) {
      const h = hinnoittele({ kulut: { 1: kulu }, toimitusSentit: toimitus, kategoria: kat });
      expect(kateHinnalla(h.hinta, kulu, toimitus).sallittu).toBe(true);
      expect(h.kateNyt).toBeGreaterThanOrEqual(0.4);
    }
  });

  it("enimmäishinta: tarra mahtuu, koriste ei (pohjahinta 24,90 €), kallis tarra ei (kate)", () => {
    expect(hinnoittele({ kulut: { 1: 260 }, toimitusSentit: 350, kategoria: "tarrat", enimmaishinta: 19.9 }).ok).toBe(true);
    const koriste = hinnoittele({ kulut: { 1: 750 }, toimitusSentit: 520, kategoria: "koristeet", enimmaishinta: 19.9 });
    expect(koriste.ok).toBe(false);
    expect(koriste.eiToteutettavissa).toBe(true);
    expect(koriste.syy).toMatch(/pohjahinta 24,90 €/);
    const kallis = hinnoittele({ kulut: { 1: 900 }, toimitusSentit: 600, kategoria: "tarrat", enimmaishinta: 19.9 });
    expect(kallis.ok).toBe(false);
    expect(kallis.hinta).toBeGreaterThan(19.9); // hintaa ei laske katerajan alle
    expect(kallis.syy).toMatch(/40 %:n kate vaatii/);
  });

  it("listan hinta: kelpaa vain, jos se täyttää pohjan ja katteen", () => {
    expect(hinnoittele({ kulut: { 1: 1050 }, toimitusSentit: 490, kategoria: "t-paidat", ohitushinta: 39.9 }).hinta).toBe(39.9);
    const liianHalpa = hinnoittele({ kulut: { 1: 1050 }, toimitusSentit: 490, kategoria: "t-paidat", ohitushinta: 24.9 });
    expect(liianHalpa.hinta).toBe(34.9);
    expect(liianHalpa.varoitus).toMatch(/pohjahinnan/);
    const alleKatteen = hinnoittele({ kulut: { 1: 2450 }, toimitusSentit: 690, kategoria: "hupparit", ohitushinta: 64.9 });
    expect(alleKatteen.hinta).toBe(68.9);
    expect(alleKatteen.varoitus).toMatch(/katerajan/);
  });

  it("tuntemattomat kulut: ei hintaa", () => {
    expect(hinnoittele({ kulut: {}, toimitusSentit: 490, kategoria: "t-paidat" }).ok).toBe(false);
    expect(hinnoittele({ kulut: { 1: 100 }, toimitusSentit: null, kategoria: "t-paidat" }).ok).toBe(false);
  });
});

describe("listojen jäsennys", () => {
  it("oletukset yhdistyvät, tyyppitagi ja teema tageiksi, otsikko pohjasta", () => {
    const r = parseLista({
      nimi: "Testi", enimmaishinta: "19,90",
      oletukset: { tyyppi: "tarra", kategoria: "Pikkulahjat", tagit: ["Lahja"], otsikko: "{teksti} | {tuote} lahjaksi", kuvaus: "{teksti}. Hauska {tuote_pienella} pikkulahjaksi ja muuta tekstiä riittävästi." },
      tuotteet: [{ rivit: ["NO NIIN."] }, { rivit: ["JOO EI."], tyyppi: "t-paita", varit: ["Black"], hinta: "39,90" }],
    }, { tiedosto: "testi" });
    expect(r.virheet).toEqual([]);
    expect(r.enimmaishinta).toBe(19.9);
    expect(r.tuotteet[0]).toMatchObject({ tyyppi: "tarra", otsikko: "No niin | Tarra lahjaksi", koot: ["3x3", "4x4"], tagit: ["Tarra", "Pikkulahjat", "Lahja"] });
    expect(r.tuotteet[0].kuvaus).toMatch(/^No niin\. Hauska tarra pikkulahjaksi/);
    expect(r.tuotteet[1]).toMatchObject({ tyyppi: "t-paita", hinta: 39.9, varit: ["Black"], koot: ["S", "M", "L", "XL", "2XL"] });
  });

  it("pelkkä taulukko kelpaa", () => {
    const r = parseLista([{ rivit: ["NO NIIN"], tyyppi: "tarra" }]);
    expect(r.virheet).toEqual([]);
    expect(r.tuotteet[0].otsikko).toBe("No niin | Tarra");
  });

  it("virheelliset rivit raportoidaan eikä niitä käsitellä", () => {
    const r = parseLista({
      tuotteet: [
        { rivit: ["KAHVI – ENSIN"], tyyppi: "tarra" },
        { rivit: ["OK"], tyyppi: "tarra", otsikko: "{teksti} — tarra" },
        { rivit: [], tyyppi: "tarra" },
        { rivit: ["MUKAVA"], tyyppi: "pipo" },
        { rivit: ["TEE SE ITSE"], tyyppi: "tarra" },
        { rivit: ["PAINOTUOTE"], tyyppi: "tarra", kuvaus: "{teksti}. Painettu EU:ssa." },
        { rivit: ["SAMA"], tyyppi: "tarra" },
        { rivit: ["sama "], tyyppi: "tarra" },
        { rivit: ["HINTA"], tyyppi: "tarra", hinta: "halpa" },
      ],
    });
    expect(r.tuotteet.map((t) => t.teksti)).toEqual(["SAMA"]);
    const v = r.virheet.join("\n");
    expect(v).toMatch(/#1.*ajatusviiva/);
    expect(v).toMatch(/#2.*ajatusviiva/);
    expect(v).toMatch(/#3.*rivit puuttuu/);
    expect(v).toMatch(/#4.*tuntematon tyyppi/);
    expect(v).toMatch(/#5.*kategoriaan t-paidat/);
    expect(v).toMatch(/#6.*väite/);
    expect(v).toMatch(/#8.*jo aiemmin/);
    expect(v).toMatch(/#9.*ei ole luku/);
  });

  it("otsikkoteksti riveistä", () => {
    expect(otsikkoTeksti(["KILTTI.", "SUURIN PIIRTEIN."])).toBe("Kiltti. Suurin piirtein");
    expect(otsikkoTeksti(["MIINUS 25?", "TAKKI AUKI."])).toBe("Miinus 25? Takki auki");
    expect(otsikkoTeksti(["ÄLÄ PUHU MULLE", "ENNEN KAHVIA"])).toBe("Älä puhu mulle ennen kahvia");
  });

  it("esimerkkilistat: 10 + 10 tuotetta, ei virheitä, ei ajatusviivoja otsikoissa", () => {
    const joulu = parseLista(lue("joulupaidat.json"), { tiedosto: "joulupaidat" });
    const alle = parseLista(lue("alle-20.json"), { tiedosto: "alle-20" });
    expect(joulu.virheet).toEqual([]);
    expect(alle.virheet).toEqual([]);
    expect(joulu.tuotteet).toHaveLength(10);
    expect(alle.tuotteet).toHaveLength(10);
    expect(new Set(joulu.tuotteet.map((t) => t.tyyppi))).toEqual(new Set(["t-paita", "huppari"]));
    expect(alle.enimmaishinta).toBe(19.9);
    for (const t of [...joulu.tuotteet, ...alle.tuotteet]) {
      expect(t.otsikko).not.toMatch(VIIVA);
      expect(t.otsikko).not.toMatch(/[–—]/);
      expect(t.kuvaus).not.toMatch(/[–—]/);
      expect(t.rivit.join(" ")).not.toMatch(/[–—]/);
      expect(t.kuvaus.length).toBeGreaterThanOrEqual(60);
    }
    // Raakatiedostoissakaan ei ajatusviivoja.
    for (const f of ["joulupaidat.json", "alle-20.json"]) expect(fs.readFileSync(path.join(DATA, f), "utf8")).not.toMatch(/[–—]/);
  });
});

describe("idempotenssi", () => {
  it("avain: tyyppi + teksti, kirjainkoko ja välilyönnit eivät vaikuta", () => {
    expect(idempotenssiAvain("tarra", ["NO  NIIN"])).toBe(idempotenssiAvain("tarra", ["no niin"]));
    expect(idempotenssiAvain("tarra", ["NO NIIN"])).not.toBe(idempotenssiAvain("t-paita", ["NO NIIN"]));
  });

  it("kirjauksista luetaan vain Printifyyn luodut, kaikista luotu-*.json-tiedostoista", () => {
    const kansio = fs.mkdtempSync(path.join(os.tmpdir(), "uudet-"));
    fs.writeFileSync(path.join(kansio, "luotu-2026-10-20.json"), JSON.stringify({ tuotteet: [{ avain: "tarra|no niin", printify_id: "a1" }] }));
    fs.writeFileSync(path.join(kansio, "luotu-2026-10-21.json"), JSON.stringify({ tuotteet: [{ avain: "tarra|joo ei", printify_id: "a2", tila: "yli-enimmaishinnan" }, { avain: "tarra|kesken" }] }));
    fs.writeFileSync(path.join(kansio, "luotu-rikki.json"), "{");
    fs.writeFileSync(path.join(kansio, "alle-20.json"), JSON.stringify({ tuotteet: [{ avain: "tarra|lista" , printify_id: "x" }] }));
    const luodut = joLuodut(lueKirjaukset(kansio));
    expect([...luodut].sort()).toEqual(["tarra|joo ei", "tarra|no niin"]);
    expect(lueKirjaukset(path.join(kansio, "ei-ole"))).toEqual([]);
  });
});

describe("katalogi ja painotalo", () => {
  const katalogi = new TiedostoKatalogi(esimerkki, "esimerkki");

  it("normalisointi: mitat ja koot", () => {
    expect(normArvo('3" × 3"')).toBe("3x3");
    expect(normArvo("XXL")).toBe("2xl");
    const v = valitseVariantit(esimerkki.variants["9400/9700"], { koot: ["3x3", "4x4", "5x5"] });
    expect(v.valitut).toHaveLength(2);
    expect(v.puuttuvatKoot).toEqual(["5x5"]);
  });

  it("paita: suositeltu EU-painotalo (EU-siirron sääntö), ei EU:n ulkopuolista", async () => {
    const k = await ratkaiseKohde("t-paita", katalogi, { varit: ["Black", "Red"], koot: ["S", "M"] });
    expect(k.ok).toBe(true);
    expect(k.painotalo.title).toBe("OPT OnDemand");
    expect(k.valinta.valitut).toHaveLength(4);
    expect(k.hylatyt.join()).toMatch(/Monster Digital \(US\)/);
  });

  it("puuttuva väri ratkaisee painotalon ennen suosintaa", async () => {
    const k = await ratkaiseKohde("huppari", katalogi, { varit: ["Black", "Red"], koot: ["M"] });
    expect(k.painotalo.title).toBe("Textildruck Europa");
    expect(k.valinta.puuttuvatVarit).toEqual([]);
  });

  it("tarra nimellä Kiss-Cut Stickers EU-maasta, koriste ceramic ornament", async () => {
    const tarra = await ratkaiseKohde("tarra", katalogi, { koot: ["3x3"] });
    expect(tarra.blueprint.title).toBe("Kiss-Cut Stickers");
    expect(tarra.maa).toBe("PL");
    const koriste = await ratkaiseKohde("koriste", katalogi, { koot: ["Circle|Round"] });
    expect(koriste.painotalo.title).toBe("Harrier");
    expect(koriste.valinta.valitut).toHaveLength(1);
  });

  it("ei EU-painotaloa: ohitetaan syyn kanssa", async () => {
    const k = await ratkaiseKohde("tarra", katalogi, { koot: ["3x3"] }, { blueprint: 9402 });
    expect(k.ok).toBe(false);
    expect(k.syy).toMatch(/ei EU-painotaloa/);
  });

  it("tekstin väri: tummat valkoisella, vaaleat mustalla", () => {
    const v = valitseVariantit(esimerkki.variants["9145/9030"], { varit: ["Black", "White"], koot: ["M"] }).valitut;
    const r = tekstivariRyhmat(v);
    expect(r.map((x) => [x.vari, x.tuotevarit])).toEqual([["#FFFFFF", ["Black"]], ["#111111", ["White"]]]);
  });

  it("live-katalogi tekee vain GET-kutsuja (mockattu fetch)", async () => {
    const kutsut: string[] = [];
    const fetchImpl = async (url: string, init: { method: string }) => {
      kutsut.push(`${init.method} ${url}`);
      const polku = url.replace("https://api.printify.com/v1", "");
      const m = polku.match(/^\/catalog\/blueprints\/(\d+)\/print_providers\/(\d+)\/(variants|shipping)\.json$/);
      let data: unknown = null;
      if (polku === "/catalog/blueprints.json") data = esimerkki.blueprints;
      else if (m) data = m[3] === "variants" ? { variants: esimerkki.variants[`${m[1]}/${m[2]}`] } : esimerkki.shipping[`${m[1]}/${m[2]}`];
      else if (/^\/catalog\/blueprints\/(\d+)\/print_providers\.json$/.test(polku)) data = esimerkki.blueprint_providers[polku.split("/")[3]];
      else if (/^\/catalog\/print_providers\/(\d+)\.json$/.test(polku)) data = esimerkki.print_providers.find((p: { id: number }) => String(p.id) === polku.split("/")[3].replace(".json", ""));
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(data) };
    };
    const live = new LiveKatalogi(teeApi({ key: "testi", fetchImpl }), { arviot: esimerkki.kuluarviot });
    const k = await ratkaiseKohde("tarra", live, { koot: ["3x3"] });
    expect(k.ok).toBe(true);
    expect(kutsut.every((c) => c.startsWith("GET "))).toBe(true);
    expect(live.vienti().variants["9400/9700"]).toHaveLength(4);
  });
});

describe("luonti mockatulla Printify-rajapinnalla", () => {
  function mockApi(kulu: number) {
    const kutsut: { method: string; polku: string; body: any }[] = [];
    const fetchImpl = async (url: string, init: { method: string; body?: string }) => {
      const polku = url.replace("https://api.printify.com/v1", "");
      const body = init.body ? JSON.parse(init.body) : null;
      kutsut.push({ method: init.method, polku, body });
      let data: unknown = {};
      if (polku === "/uploads/images.json") data = { id: `kuva-${kutsut.length}` };
      else if (init.method === "POST" && polku === "/shops/123/products.json") data = { id: "uusi-1" };
      else if (init.method === "GET" && polku === "/shops/123/products/uusi-1.json") {
        const luonti = kutsut.find((k) => k.method === "POST" && k.polku === "/shops/123/products.json")!.body;
        data = { id: "uusi-1", title: luonti.title, tags: luonti.tags, variants: luonti.variants.map((v: any) => ({ ...v, cost: kulu, title: "x" })) };
      }
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(data) };
    };
    return { kutsut, api: teeApi({ key: "testi", fetchImpl }) };
  }
  const ctx = (api: any, extra = {}) => ({
    katalogi: new TiedostoKatalogi(esimerkki, "esimerkki"), enimmaishinta: null, toimitusmaksu: 5.9, ilmainenRaja: 60, ohitukset: {},
    renderoi: async () => {}, kuvaKansio: "/tmp/kuvat", luoKuvat: true, toteuta: true, api, shopId: "123", lueTiedosto: () => Buffer.from("png"), ...extra,
  });

  it("listan painotalo ohittaa suosinnan, komentorivin --painotalo ohittaa listan", async () => {
    const { api } = mockApi(1000);
    const lista = parseLista({ oletukset: { tyyppi: "t-paita", varit: ["Black"], koot: ["S"], painotalo: "Textildruck Europa" }, tuotteet: [{ rivit: ["TESTI"] }] });
    expect(lista.virheet).toEqual([]);
    expect(lista.tuotteet[0].painotalo).toBe("Textildruck Europa");
    const r = await kasitteleTuote(lista.tuotteet[0], ctx(api, { toteuta: false, luoKuvat: false }));
    expect(r.painotalo).toMatch(/^Textildruck Europa/);
    expect(r.peruste).toBe("komentorivin valinta");
    const cli = await kasitteleTuote(lista.tuotteet[0], ctx(api, { toteuta: false, luoKuvat: false, ohitukset: { "t-paita": { painotalo: "OPT OnDemand" } } }));
    expect(cli.painotalo).toMatch(/^OPT OnDemand/);
    expect(parseLista({ tuotteet: [{ tyyppi: "t-paita", rivit: ["X"] }] }).tuotteet[0].painotalo).toBeNull();
  });

  it("kuiva-ajo ei kutsu rajapintaa", async () => {
    const { kutsut, api } = mockApi(1000);
    const t = parseLista(lue("joulupaidat.json")).tuotteet[0];
    const r = await kasitteleTuote(t, ctx(api, { toteuta: false }));
    expect(r.tila).toBe("suunniteltu");
    expect(r.hinnoittelu.hinta).toBe(34.9);
    expect(kutsut).toEqual([]);
  });

  it("toteutus: kuvat, tuote EU-painotalolle, ei julkaisua, hinta päivitetään oikeilla kuluilla", async () => {
    const { kutsut, api } = mockApi(1800); // oikea kulu arviota suurempi
    const t = parseLista(lue("joulupaidat.json")).tuotteet[0]; // Black, Red, White
    const r = await kasitteleTuote(t, ctx(api));
    expect(r.tila).toBe("luotu");
    expect(kutsut.filter((k) => k.polku === "/uploads/images.json")).toHaveLength(2); // valkoinen ja musta teksti
    const luonti = kutsut.find((k) => k.method === "POST" && k.polku === "/shops/123/products.json")!.body;
    expect(luonti).toMatchObject({ blueprint_id: 9145, print_provider_id: 9030, title: "Täällä vain kinkun takia | T-paita jouluun" });
    expect(luonti.variants).toHaveLength(15);
    expect(luonti.variants.every((v: any) => v.price === 3490 && v.is_enabled)).toBe(true);
    expect(luonti.print_areas).toHaveLength(2);
    expect(kutsut.some((k) => /publish/.test(k.polku))).toBe(false);
    const paivitys = kutsut.find((k) => k.method === "PUT")!;
    expect(paivitys.body.variants[0].price).toBe(Math.round(r.hinta * 100));
    expect(r.hinta).toBeGreaterThan(34.9);
    expect(kateHinnalla(r.hinta, 1800, 490, { toimitusmaksu: 5.9, ilmainenRaja: 60 }).sallittu).toBe(true);
    const rivi = kirjausRivi(r, "2026-10-21T00:00:00Z");
    expect(rivi).toMatchObject({ avain: t.avain, printify_id: "uusi-1", tila: "luotu", tuotu: false });
  });

  it("alle 20 €: arvion mukaan kelpaava, oikeilla kuluilla liian kallis raportoidaan (ei halvempaa hintaa)", async () => {
    const { kutsut, api } = mockApi(900);
    const t = parseLista(lue("alle-20.json")).tuotteet[0];
    const r = await kasitteleTuote(t, ctx(api, { enimmaishinta: 19.9 }));
    expect(r.tila).toBe("yli-enimmaishinnan");
    expect(r.hinta).toBeGreaterThan(19.9);
    expect(kutsut.find((k) => k.method === "PUT")!.body.variants[0].price).toBe(Math.round(r.hinta * 100));
  });

  it("koriste alle 20 €:n listalla: ohitetaan ennen luontia", async () => {
    const { kutsut, api } = mockApi(750);
    const t = parseLista({ enimmaishinta: 19.9, tuotteet: [{ rivit: ["JOULU"], tyyppi: "koriste" }] }).tuotteet[0];
    const r = await kasitteleTuote(t, ctx(api, { enimmaishinta: 19.9 }));
    expect(r.tila).toBe("ohitettu");
    expect(r.syy).toMatch(/ei toteutettavissa: kategorian koristeet pohjahinta 24,90 €/);
    expect(kutsut).toEqual([]);
  });
});

describe("live-hintamalli, kateraja 30 % ja EU-tyypit (26.10.2026)", () => {
  const live = HINTAMALLIT.live;
  const liveArgs = { toimitusmaksu: live.toimitusmaksu, ilmainenRaja: live.ilmainenRaja, pohjahinnat: live.pohjahinnat, kiinteat: live.kiinteat, kateraja: 0.3 };

  it("live: 6,90 € / 79 €, t-paita 24,90 € ja huppari 49,90 € kiinteät, muut Printifyn hinnalla ilman pohjahintaa", () => {
    expect(live).toMatchObject({ toimitusmaksu: 6.9, ilmainenRaja: 79, pohjahinnat: {}, kiinteat: { "t-paidat": 24.9, hupparit: 49.9 } });
    // Juliste OPT OnDemand: kulu 7,09 €, toimitus 8,49 € (oikeat luvut 26.10.2026) -> 22,90 €, ei seinätaulujen 49,90 €:n pohjaa.
    const j = hinnoittele({ kulut: { 1: 709 }, toimitusSentit: 849, kategoria: "seinataulut", ...liveArgs });
    expect(j.ok).toBe(true);
    expect(j.hinta).toBe(22.9);
    expect(j.peruste).toBe("30 %:n kate");
    expect(j.kate).toBeGreaterThanOrEqual(0.3);
    expect(kateHinnalla(21.9, 709, 849, { toimitusmaksu: 6.9, ilmainenRaja: 79 }).kate).toBeLessThan(0.3);
  });

  it("kiinteä hinta: t-paita ei yllä 30 %:iin 24,90 €:lla, raportoidaan lukuineen", () => {
    const t = hinnoittele({ kulut: { 1: 993 }, toimitusSentit: 849, kategoria: "t-paidat", ...liveArgs });
    expect(t.ok).toBe(false);
    expect(t.eiToteutettavissa).toBe(true);
    expect(t.hinta).toBe(24.9);
    expect(t.kate).toBeLessThan(0.3);
    expect(t.syy).toMatch(/kiinteällä hinnalla 24,90 € kate .* < 30 %:n raja/);
  });

  it("tarra 3,5\": 30 % vaatii 11,90 €, joten 9,90 €:n enimmäishinnalla ei toteutettavissa", () => {
    const t = hinnoittele({ kulut: { 1: 389 }, toimitusSentit: 559, kategoria: "tarrat", enimmaishinta: 9.9, ...liveArgs });
    expect(t.ok).toBe(false);
    expect(t.hinta).toBe(11.9);
    expect(t.syy).toMatch(/30 %:n kate vaatii 11,90 €, yli enimmäishinnan 9,90 €/);
  });

  it("Printifyn ALV (25,5 % kulusta ja toimituksesta) laskee katetta", () => {
    const ilman = kateHinnalla(22.9, 709, 849, { toimitusmaksu: 6.9, ilmainenRaja: 79 });
    const alv = kateAlvilla(2290, 709, 849, { toimitusmaksu: 6.9, ilmainenRaja: 79 });
    expect(alv.kate).toBeLessThan(ilman.kate);
    expect(kateHinnalla(22.9, Math.round(709 * 1.255), Math.round(849 * 1.255), { toimitusmaksu: 6.9, ilmainenRaja: 79 }).kate).toBe(alv.kate);
    expect(hinnoittele({ kulut: { 1: 709 }, toimitusSentit: 849, kategoria: "seinataulut", ...liveArgs }).kateAlv).toBe(alv.kate);
  });

  it("Suomen toimitus varianttikohtaisesta profiilista, suurin valituista", () => {
    const shipping = { profiles: [
      { variant_ids: [1, 2], countries: ["FI", "SE"], first_item: { cost: 849 } },
      { variant_ids: [3], countries: ["FI"], first_item: { cost: 929 } },
      { variant_ids: [1, 2, 3], countries: ["REST_OF_THE_WORLD"], first_item: { cost: 1319 } },
    ] };
    expect(suomenToimitusVarianteille(shipping, [1])).toBe(849);
    expect(suomenToimitusVarianteille(shipping, [1, 3])).toBe(929);
    expect(suomenToimitusVarianteille(shipping, [4])).toBe(null);
    // Tyhjä variant_ids = kaikki variantit.
    expect(suomenToimitusVarianteille({ profiles: [{ variant_ids: [], countries: ["FI"], first_item: { cost: 490 } }] }, [7])).toBe(490);
  });

  it("tarra: Kiss-Cut ensin, sitten EU:ssa tehtävä Square Vinyl Stickers", () => {
    const bps = [{ id: 476, title: "Square Vinyl Stickers" }, { id: 400, title: "Kiss-Cut Stickers" }, { id: 5372, title: "Kiss-Cut Sticker Sheet" }];
    expect(blueprintEhdokkaat(bps, { nimet: ["Kiss-Cut Stickers", "Square Vinyl Stickers"] }).map((b) => b.id)).toEqual([400, 476]);
  });

  it("t-paita: unisex-malli ennen naisten mallia (molemmissa softstyle 64000)", () => {
    const bps = [
      { id: 88, title: "Women's Softstyle Tee", brand: "Gildan", model: "64000L" },
      { id: 145, title: "Unisex Softstyle T-Shirt", brand: "Gildan", model: "64000" },
    ];
    expect(blueprintEhdokkaat(bps, TUOTETYYPIT["t-paita"].blueprint).map((b) => b.id)).toEqual([145, 88]);
  });

  it("lista joulu-elake-2026: 15 t-paitaa Textildruck Europan blueprintille 145, ei virheitä, ei törmäyksiä", () => {
    const l = parseLista(lue("joulu-elake-2026.json"), { tiedosto: "joulu-elake-2026" });
    expect(l.virheet).toEqual([]);
    expect(l.tuotteet).toHaveLength(15);
    expect(new Set(l.tuotteet.map((t) => t.otsikko)).size).toBe(15);
    for (const t of l.tuotteet) {
      expect(t.tyyppi).toBe("t-paita");
      expect(t.painotalo).toBe("Textildruck Europa");
      expect(t.blueprint).toBe("145");
      expect(t.koot).not.toContain("3XL");
      expect(VIIVA.test(`${t.otsikko} ${t.kuvaus}`)).toBe(false);
    }
  });

  it("listat tonnin-seteli ja ika-elake-kaupunki: ei virheitä, juliste seinätauluksi, tuotekohtainen enimmäishinta", () => {
    const tonni = parseLista(lue("tonnin-seteli.json"), { tiedosto: "tonnin-seteli" });
    const muut = parseLista(lue("ika-elake-kaupunki.json"), { tiedosto: "ika-elake-kaupunki" });
    expect(tonni.virheet).toEqual([]);
    expect(muut.virheet).toEqual([]);
    expect(muut.tuotteet).toHaveLength(10);
    const kaikki = [...tonni.tuotteet, ...muut.tuotteet];
    for (const t of kaikki) {
      expect(t.enimmaishinta).toBe(t.tyyppi === "tarra" ? 9.9 : 24.9);
      expect(`${t.otsikko} ${t.kuvaus}`).not.toMatch(/[–—]|painettu suomessa|painetaan suomessa/i);
    }
    expect(new Set(kaikki.map((t) => t.kuvaus)).size).toBe(kaikki.length); // jokaisella oma kuvaus
    expect(tonni.tuotteet.find((t) => t.tyyppi === "juliste")!.otsikko).toBe("Se oli tonnin seteli | Juliste (poster)");
  });
});
