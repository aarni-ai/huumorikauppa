// @vitest-environment node
/**
 * Pikkujoulupaketit yrityksille (4.11.2026, api/_lib/pikkujoulut.js, /pikkujoulut-yritykset).
 *
 * Kulut: src/test/fixtures/kate-kaikki-2026-11-03.json (tuotannon /api/products 3.11.2026: variant_map, Printifyn
 * kulut, toimitus, painotalo ja kokohinnat). Kate vähintään PIKKUJOULU_MIN_KATE (9 €) jokaista paitaa kohden kaikilla
 * paketeilla, sallituilla designeilla ja kokojakaumilla.
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import {
  PIKKUJOULU_MIN_KATE, PIKKUJOULU_PAKETIT, PIKKUJOULU_SALLITUT, PIKKUJOULU_VAIHTOEHDOT, PIKKUJOULU_KOOT, PIKKUJOULU_LAHDE, PIKKUJOULU_POLKU,
  DESIGNIT, laskePikkujoulu, tarkistaPikkujoulu, tarkistaPikkujouluLomake, pikkujouluTarjous, oletusValinta, sallitutKoot, pahimmatKulut,
  korvaaPuuttuvat, PIKKUJOULU_MIN_TAYTTOAIKA_MS,
} from "../../api/_lib/pikkujoulut.js";
import { koostaPikkujoulu, pikkujouluRivi, PIKKUJOULU_TAPAHTUMAT } from "../../api/_lib/pikkujoulu-seuranta.js";
import { MAARAALENNUS } from "../../api/_lib/vakiot.js";
import { MIN_KATE_PER_KPL } from "../../api/_lib/katesaanto.js";
import { printifyToimitusSentit, PRINTIFY_TOIMITUS_FI } from "../../api/_lib/kate.js";
import { tuotepohja } from "../../api/_lib/materiaali.js";
import { rivinHinta } from "../../api/_lib/kokohinnat.js";
import { onPiilotettuTuote } from "../../api/_lib/piilotetut.js";
import { kasittele } from "../../api/sahkoposti.js";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { pikkujoulutYrityksetPage, PIKKUJOULU_OLETUSHINNAT, pakettiTeksti } from "@/data/pikkujoulutYrityksetPage";

type Tuote = { slug: string; name: string; category: string; price: number; is_active?: boolean; variants: { variant_map: Record<string, number>; costs: Record<string, number>; shipping_cents: number; shipping_additional_cents?: number; print_provider_id?: number; size_prices?: Record<string, number> } };
const KULUT = JSON.parse(readFileSync("src/test/fixtures/kate-kaikki-2026-11-03.json", "utf8")) as { tuotteet: Tuote[] };
const bySlug = new Map(KULUT.tuotteet.map((t) => [t.slug, t]));
type Koot = Record<string, number>;
const D = DESIGNIT as Record<string, { nimi: string; koot: Record<string, [number, number]>; pp: number; eka: number; lisa: number }>;
const KOLMEXL = "huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-t-paita";

/** Kaikki paketti x design -valinnat: oletusvalikoima ja jokainen sallittu design vuorollaan ensimmäisellä paikalla. */
function valinnat() {
  const out: { paketti: (typeof PIKKUJOULU_PAKETIT)[number]; designit: string[] }[] = [];
  for (const p of PIKKUJOULU_PAKETIT) {
    out.push({ paketti: p, designit: [...p.designit] });
    for (const s of PIKKUJOULU_SALLITUT) {
      if (p.designit.includes(s)) continue;
      out.push({ paketti: p, designit: [s, ...p.designit.slice(1)] });
      out.push({ paketti: p, designit: [...p.designit.slice(0, -1), s] });
    }
  }
  return out;
}

/** Kokojakaumien reunatapaukset: kaikki yhtä kokoa, oletus, tasainen, 3XL-painotteinen ja S + 3XL. */
function jakaumat(kpl: number, oletus: Koot, saatavilla: string[]): Koot[] {
  const tyhja = () => Object.fromEntries(PIKKUJOULU_KOOT.map((k) => [k, 0])) as Koot;
  const out: Koot[] = [{ ...oletus }];
  for (const k of saatavilla) out.push({ ...tyhja(), [k]: kpl });
  const tasan = tyhja();
  saatavilla.forEach((k, i) => { tasan[k] = Math.floor(kpl / saatavilla.length) + (i < kpl % saatavilla.length ? 1 : 0); });
  out.push(tasan);
  if (saatavilla.includes("3XL")) {
    out.push({ ...tyhja(), S: 1, "3XL": kpl - 1 });
    out.push({ ...tyhja(), "2XL": Math.floor(kpl / 2), "3XL": kpl - Math.floor(kpl / 2) });
  }
  out.push({ ...tyhja(), S: kpl - 1, "2XL": 1 });
  return out;
}

const r2 = (x: number) => Math.round(x * 100) / 100;
/** Kate annetulla alennuksella (sama kaava kuin api/_lib/yritysmyynti.js hinnoitteleTarjous). */
const kateAlennuksella = (ennen: number, kulut: number, p: number) => {
  const yhteensa = r2(r2(ennen * (1 - p / 100)) + (ennen >= 79 ? 0 : 6.9));
  return r2(yhteensa / 1.255 - kulut - (yhteensa * 0.015 + 0.25));
};

/**
 * Todellinen nettokate tilannekuvan kuluilla: paidat jaetaan designeille kierrossa (koko kerrallaan vain designeille,
 * joilla koko on), tuotekulu variantin kalleimman värin mukaan ja toimitus kate.js printifyToimitusSentit.
 */
function todellinenKate(designit: string[], koot: Koot, yhteensa: number) {
  const maarat = new Map<string, number>();
  let tuotteet = 0;
  let i = 0;
  for (const k of PIKKUJOULU_KOOT) {
    const sopivat = designit.filter((s) => Object.keys(bySlug.get(s)!.variants.variant_map).some((v) => v.split("|")[1] === k));
    for (let n = 0; n < (koot[k] || 0); n++) {
      const s = sopivat[i++ % sopivat.length];
      const t = bySlug.get(s)!;
      tuotteet += Math.max(...Object.entries(t.variants.variant_map).filter(([v]) => v.split("|")[1] === k).map(([, id]) => t.variants.costs[String(id)]));
      maarat.set(s, (maarat.get(s) || 0) + 1);
    }
  }
  const toimitus = printifyToimitusSentit([...maarat].map(([s, maara]) => ({ tuote: bySlug.get(s), maara })));
  expect(toimitus).not.toBeNull();
  return r2(yhteensa / 1.255 - (tuotteet + toimitus!) / 100 - (yhteensa * 0.015 + 0.25));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Pikkujoulupaketit: määritykset", () => {
  it("raja 9 €/paita on tavallista 7 €:n sääntöä tiukempi", () => {
    expect(PIKKUJOULU_MIN_KATE).toBe(9);
    expect(PIKKUJOULU_MIN_KATE).toBeGreaterThan(MIN_KATE_PER_KPL);
    expect(PIKKUJOULU_POLKU).toBe("/pikkujoulut-yritykset");
    expect(PIKKUJOULU_LAHDE).toBe("pikkujoulut-yritykset");
  });

  it("kolme pakettia: 10, 25 ja 50 paitaa, 5, 8 ja 10 eri designia, oletuskoot summautuvat", () => {
    expect(PIKKUJOULU_PAKETIT.map((p) => [p.kpl, p.designit.length])).toEqual([[10, 5], [25, 8], [50, 10]]);
    expect(PIKKUJOULU_PAKETIT[0].oletusKoot).toMatchObject({ S: 1, M: 3, L: 3, XL: 2, "2XL": 1 });
    for (const p of PIKKUJOULU_PAKETIT) {
      expect(new Set(p.designit).size).toBe(p.designit.length);
      expect((Object.values(p.oletusKoot) as number[]).reduce((s, n) => s + n, 0)).toBe(p.kpl);
      expect(tarkistaPikkujoulu(oletusValinta(p)).ok).toBe(true);
    }
    expect(PIKKUJOULU_VAIHTOEHDOT.length).toBeGreaterThanOrEqual(5);
    expect(PIKKUJOULU_VAIHTOEHDOT.length).toBeLessThanOrEqual(10);
    expect(PIKKUJOULU_SALLITUT.length).toBeLessThanOrEqual(20);
  });

  it("designit ovat myynnissä olevia, piilottamattomia t-paitoja ja kulut vastaavat tuotannon tilannekuvaa", () => {
    for (const [slug, d] of Object.entries(D)) {
      const t = bySlug.get(slug);
      expect(t, slug).toBeDefined();
      expect(t!.category).toBe("t-paidat");
      expect(t!.is_active).not.toBe(false);
      expect(onPiilotettuTuote(t)).toBe(false);
      const fixtureKoot = PIKKUJOULU_KOOT.filter((k) => Object.keys(t!.variants.variant_map).some((v) => v.split("|")[1] === k));
      expect(Object.keys(d.koot).sort(), slug).toEqual([...fixtureKoot].sort());
      for (const k of fixtureKoot) {
        const kulut = Object.entries(t!.variants.variant_map).filter(([v]) => v.split("|")[1] === k).map(([, id]) => t!.variants.costs[String(id)]);
        expect(d.koot[k], `${slug} ${k}`).toEqual([rivinHinta(t, k), Math.max(...kulut)]);
      }
      const pohja = tuotepohja(slug);
      const taulu = pohja ? PRINTIFY_TOIMITUS_FI[`${pohja.b}/${pohja.p}`] : undefined;
      expect(d.eka).toBe(t!.variants.shipping_cents);
      expect(d.lisa).toBe(t!.variants.shipping_additional_cents ?? taulu?.lisa);
      expect(d.pp).toBe(t!.variants.print_provider_id ?? pohja?.p);
    }
  });

  it("saman koon hinta on sama kaikissa designeissa (hinta ei riipu jaosta)", () => {
    for (const k of PIKKUJOULU_KOOT) {
      const hinnat = new Set(Object.values(D).map((d) => d.koot[k]?.[0]).filter((x) => x !== undefined));
      expect(hinnat.size, k).toBe(1);
    }
  });

  it("tekstit ilman ajatusviivoja ja superlatiiveja", () => {
    const tekstit = [
      ...PIKKUJOULU_PAKETIT.flatMap((p) => [p.nimi, p.kuvaus]), ...Object.values(D).map((d) => d.nimi),
      ...pikkujoulutYrityksetPage.intro, pikkujoulutYrityksetPage.hintaehto, pikkujoulutYrityksetPage.maksu, pikkujoulutYrityksetPage.jako,
      ...pikkujoulutYrityksetPage.faqs.flatMap((f) => [f.q, f.a]), ...Object.values(STATIC_PAGE_META["/pikkujoulut-yritykset"]),
      ...PIKKUJOULU_PAKETIT.map((p) => pakettiTeksti(p.id)),
    ].join("\n");
    expect(tekstit).not.toMatch(/[–—]| - /);
    expect(tekstit).not.toMatch(/\b(paras|parhaat|halvin|edullisin|ainoa|ykkönen)\b/i);
    expect(STATIC_PAGE_META["/pikkujoulut-yritykset"].title.length).toBeLessThan(60);
  });
});

describe("Pikkujoulupaketit: hinta-arvio ja vähintään 9 € katetta paitaa kohden", () => {
  it("oletuspaketit: hinnat, alennus ja pahimman tapauksen kate", () => {
    const tulos = PIKKUJOULU_PAKETIT.map((p) => {
      const h = laskePikkujoulu(oletusValinta(p));
      return { id: p.id, yhteensa: h.yhteensa, perKpl: h.perKpl, alennusProsentti: h.alennusProsentti, toimitus: h.toimitus };
    });
    expect(tulos).toEqual([
      { id: "pikkujoulu-10", yhteensa: 279, perKpl: 27.9, alennusProsentti: 0, toimitus: 0 },
      { id: "pikkujoulu-25", yhteensa: 627.75, perKpl: 25.11, alennusProsentti: 10, toimitus: 0 },
      { id: "pikkujoulu-50", yhteensa: 1255.5, perKpl: 25.11, alennusProsentti: 10, toimitus: 0 },
    ]);
    expect(PIKKUJOULU_OLETUSHINNAT.map((h) => h.yhteensa)).toEqual([279, 627.75, 1255.5]);
  });

  it("kaikki paketit x sallitut designit x kokojakaumat: kate >= 9 €/paita ja suurin sallittu porras", () => {
    let tapauksia = 0;
    for (const { paketti, designit } of valinnat()) {
      for (const koot of jakaumat(paketti.kpl, paketti.oletusKoot, sallitutKoot(designit))) {
        const h = laskePikkujoulu({ paketti: paketti.id, designit, koot });
        expect(h.ok, `${paketti.id} ${designit.join()} ${JSON.stringify(koot)} ${h.virheet}`).toBe(true);
        expect(h.kate / h.kpl, `${paketti.id} ${JSON.stringify(koot)}`).toBeGreaterThanOrEqual(PIKKUJOULU_MIN_KATE);
        // Suurin porras: jokainen suurempi kappalemäärän sallima porras jäisi alle 9 €/paita.
        const kulut = pahimmatKulut(designit, h.koot)!;
        const suuremmat = MAARAALENNUS.portaat.filter((p) => p.min <= paketti.kpl && p.prosentti > h.alennusProsentti);
        for (const p of suuremmat) expect(kateAlennuksella(h.ennen, kulut, p.prosentti) / h.kpl).toBeLessThan(PIKKUJOULU_MIN_KATE);
        expect(kateAlennuksella(h.ennen, kulut, h.alennusProsentti)).toBe(h.kate);
        // Todellinen kate tilannekuvan kuluilla (kierrossa jaettu) ei ole pahinta arviota pienempi.
        const todellinen = todellinenKate(designit, h.koot, h.yhteensa);
        expect(todellinen + 0.01).toBeGreaterThanOrEqual(h.kate);
        expect(todellinen / h.kpl).toBeGreaterThanOrEqual(PIKKUJOULU_MIN_KATE);
        tapauksia++;
      }
    }
    expect(tapauksia).toBeGreaterThan(150);
  });

  it("kaikki 3XL: sallittu vain 3XL-designin kanssa, kate >= 9 €/paita kaikissa paketeissa", () => {
    for (const p of PIKKUJOULU_PAKETIT) {
      const koot = { S: 0, M: 0, L: 0, XL: 0, "2XL": 0, "3XL": p.kpl };
      expect(laskePikkujoulu({ paketti: p.id, designit: p.designit, koot }).ok).toBe(false);
      const designit = [KOLMEXL, ...p.designit.slice(1)];
      const h = laskePikkujoulu({ paketti: p.id, designit, koot });
      expect(h.ok).toBe(true);
      expect(h.kate / p.kpl).toBeGreaterThanOrEqual(9);
      expect(h.perKpl).toBeGreaterThan(0);
    }
  });

  it("kulukerroin 1,255 (ALV kuluna): kate pysyy rajalla tai alennus pienenee", () => {
    for (const p of PIKKUJOULU_PAKETIT) {
      const h = laskePikkujoulu(oletusValinta(p), { kerroin: 1.255 });
      expect(h.ok).toBe(true);
      expect(h.alennusProsentti).toBeLessThanOrEqual(laskePikkujoulu(oletusValinta(p)).alennusProsentti);
    }
  });
});

describe("Pikkujoulupaketit: valinnan tarkistus", () => {
  const p25 = PIKKUJOULU_PAKETIT[1];
  const ok = () => oletusValinta(p25);
  it("kokojen summan pitää olla paketin koko", () => {
    expect(tarkistaPikkujoulu({ ...ok(), koot: { ...p25.oletusKoot, M: 8 } })).toMatchObject({ ok: false, virheet: ["Kokojen summa on 26, paketissa on 25 paitaa."] });
    expect(tarkistaPikkujoulu({ ...ok(), koot: { ...p25.oletusKoot, M: 6 } }).ok).toBe(false);
    expect(tarkistaPikkujoulu({ ...ok(), koot: {} }).ok).toBe(false);
    expect(tarkistaPikkujoulu({ ...ok(), koot: { ...p25.oletusKoot, M: -3, L: 18 } }).ok).toBe(false);
    expect(tarkistaPikkujoulu({ ...ok(), koot: { S: 25 } }).ok).toBe(true);
    expect(tarkistaPikkujoulu({ ...ok(), koot: { S: "25" } }).ok).toBe(true);
  });
  it("designeja paketin verran, eri designit, vain sallitulta listalta", () => {
    expect(tarkistaPikkujoulu({ ...ok(), designit: p25.designit.slice(1) }).virheet).toContain("Valitse 8 eri designia.");
    expect(tarkistaPikkujoulu({ ...ok(), designit: [p25.designit[1], ...p25.designit.slice(1)] }).virheet).toContain("Sama design on valittu kahdesti.");
    expect(tarkistaPikkujoulu({ ...ok(), designit: ["saatanan-tunarit-t-paita", ...p25.designit.slice(1)] }).virheet).toContain("Valitse designit listalta.");
    expect(tarkistaPikkujoulu({ ...ok(), designit: [PIKKUJOULU_VAIHTOEHDOT[0], ...p25.designit.slice(1)] }).ok).toBe(true);
  });
  it("koko pitää löytyä valituista designeista; tuntematon paketti ja koko hylätään", () => {
    expect(tarkistaPikkujoulu({ ...ok(), koot: { ...p25.oletusKoot, M: 6, "3XL": 1 } }).virheet).toContain("Kokoa 3XL ei ole valituissa designeissa.");
    expect(tarkistaPikkujoulu({ ...ok(), koot: { ...p25.oletusKoot, M: 6, "4XL": 1 } }).ok).toBe(false);
    expect(tarkistaPikkujoulu({ paketti: "pikkujoulu-30", designit: [], koot: {} }).virheet).toEqual(["Valitse paketti."]);
    expect(sallitutKoot(p25.designit)).toEqual(["S", "M", "L", "XL", "2XL"]);
    expect(sallitutKoot([KOLMEXL])).toContain("3XL");
  });
  it("myynnistä poistunut design korvataan vaihtoehdolla", () => {
    const pois = new Set([p25.designit[2]]);
    const d = korvaaPuuttuvat(p25.designit, (s: string) => !pois.has(s));
    expect(d).toHaveLength(8);
    expect(d).not.toContain(p25.designit[2]);
    expect(new Set(d).size).toBe(8);
    expect(korvaaPuuttuvat(p25.designit, () => true)).toEqual(p25.designit);
  });
});

describe("Pikkujoulupaketit: lomake", () => {
  const hyva = { yritys: "Testi Oy", nimi: "Anna", email: "Anna@Testi.fi", postinumero: "00100", kaupunki: "Helsinki" };
  it("pakolliset kentät ja muodot", () => {
    expect(tarkistaPikkujouluLomake(hyva)).toMatchObject({ ok: true, kentat: { email: "anna@testi.fi", puhelin: "" } });
    expect(tarkistaPikkujouluLomake({}).virheet).toHaveLength(5);
    expect(tarkistaPikkujouluLomake({ ...hyva, email: "anna" }).ok).toBe(false);
    expect(tarkistaPikkujouluLomake({ ...hyva, postinumero: "001" }).ok).toBe(false);
    expect(tarkistaPikkujouluLomake({ ...hyva, postinumero: "00 100" }).ok).toBe(true);
    expect(tarkistaPikkujouluLomake({ ...hyva, kaupunki: " " }).ok).toBe(false);
    expect(tarkistaPikkujouluLomake({ ...hyva, puhelin: "abc" }).ok).toBe(false);
    expect(tarkistaPikkujouluLomake({ ...hyva, puhelin: "+358 40 123 4567" }).ok).toBe(true);
  });
});

describe("Pikkujoulupaketit: paketti -> tarjouspyyntö", () => {
  const lomake = { yritys: "Testi Oy", nimi: "Anna", email: "anna@testi.fi", postinumero: "33100", kaupunki: "Tampere", logoToive: "Logo selkään", viesti: "Musta väri" };
  it("pikkujouluTarjous: tarjouspyynnön kentät ja arvio", () => {
    const p = PIKKUJOULU_PAKETIT[1];
    const r = pikkujouluTarjous({ ...lomake, pikkujoulu: oletusValinta(p) });
    expect(r.ok).toBe(true);
    expect(r.tarjous).toMatchObject({
      yritys: "Testi Oy", email: "anna@testi.fi", maara: 25, paketti: "pikkujoulu-25", malli: "tpaita", hinta: 627.75, lahde: "pikkujoulut-yritykset",
      koot: { S: 2, M: 7, L: 8, XL: 5, "2XL": 3 }, viesti: "Musta väri",
      pikkujoulu: { nimi: "Pikkujoulupaketti 25", alennusProsentti: 10, perKpl: 25.11, yhteensa: 627.75, postinumero: "33100", kaupunki: "Tampere", logoToive: "Logo selkään" },
    });
    expect(r.tarjous.pikkujoulu.designit).toHaveLength(8);
    expect(r.tarjous.pikkujoulu.designit[0]).toEqual({ slug: p.designit[0], nimi: D[p.designit[0]].nimi });
    expect(r.tarjous.koot).not.toHaveProperty("3XL");
    expect(r.tarjous.kate / 25).toBeGreaterThanOrEqual(9);
    expect(r.arvio).toEqual({ malli: "pikkujoulu", nimi: "Pikkujoulupaketti 25 (8 designia)", kpl: 25, yhteensa: 627.75, perKpl: 25.11, alennusProsentti: 10, toimitus: 0 });
    expect(JSON.stringify(r.arvio)).not.toContain("kate");
    expect(pikkujouluTarjous({ ...lomake, email: "x", pikkujoulu: { ...oletusValinta(p), koot: { S: 1 } } })).toMatchObject({ ok: false });
  });

  const kutsu = async (store: Record<string, unknown>, body: Record<string, unknown>) => {
    const out = { status: 0, body: null as unknown };
    const res = { status: (c: number) => { out.status = c; return res; }, json: (b: unknown) => { out.body = b; return res; }, setHeader: () => res };
    await kasittele({ method: "POST", query: {}, headers: {}, body: { action: "tarjouspyynto", ...body } }, res, store);
    return out as { status: number; body: Record<string, unknown> };
  };
  const varasto = () => {
    const rivit: Record<string, unknown>[] = [];
    return { rivit, tallennaTarjouspyynto: async (t: Record<string, unknown>) => { rivit.push(t); return rivit.length; }, merkitseTarjousIlmoitus: async () => {} };
  };

  it("api/sahkoposti tarjouspyynto: tallennus lähteellä, ilmoitus omistajalle, arvio vastauksessa", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_testi");
    const viestit: Array<Record<string, unknown>> = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: { body: string }) => { viestit.push(JSON.parse(init.body)); return new Response('{"id":"x"}', { status: 200 }); }));
    const st = varasto();
    const p = PIKKUJOULU_PAKETIT[0];
    const r = await kutsu(st, { ...lomake, ytunnus: "3653666-7", pikkujoulu: oletusValinta(p), kesto: 20000 });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, hinta: 279, arvio: [{ malli: "pikkujoulu", kpl: 10, yhteensa: 279, perKpl: 27.9, alennusProsentti: 0 }] });
    expect(JSON.stringify(r.body)).not.toContain("kate");
    expect(st.rivit[0]).toMatchObject({ lahde: "pikkujoulut-yritykset", paketti: "pikkujoulu-10", malli: "tpaita", maara: 10, hinta: 279, ytunnus: "3653666-7" });
    expect((st.rivit[0].pikkujoulu as { designit: unknown[] }).designit).toHaveLength(5);
    expect(String(viestit[0].subject)).toContain("Tarjouspyyntö: Testi Oy, Pikkujoulupaketti 10");
    expect(String(viestit[0].text)).toContain("Toimitus: 33100 Tampere");
  });

  it("api/sahkoposti tarjouspyynto: virheellinen valinta 400, piilokenttä ja liian nopea täyttö kuitataan tallentamatta", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    const st = varasto();
    const p = PIKKUJOULU_PAKETIT[2];
    const vaara = await kutsu(st, { ...lomake, pikkujoulu: { ...oletusValinta(p), koot: { M: 49 } }, kesto: 20000 });
    expect(vaara.status).toBe(400);
    expect(String(vaara.body.error)).toContain("Kokojen summa on 49");
    expect((await kutsu(st, { ...lomake, pikkujoulu: oletusValinta(p), kotisivu: "http://x" })).body).toEqual({ ok: true });
    expect((await kutsu(st, { ...lomake, pikkujoulu: oletusValinta(p), kesto: PIKKUJOULU_MIN_TAYTTOAIKA_MS - 1 })).body).toEqual({ ok: true });
    expect(st.rivit).toHaveLength(0);
  });

  it("tavallinen tarjouspyyntö saa lähteen yritykset tai yritykset-ala", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    const st = varasto();
    await kutsu(st, { yritys: "Oy", nimi: "A", email: "a@b.fi", maara: "10" });
    await kutsu(st, { yritys: "Oy", nimi: "A", email: "a@b.fi", maara: "10", ala: "Rakennus" });
    expect(st.rivit.map((r) => r.lahde)).toEqual(["yritykset", "yritykset-ala"]);
  });
});

describe("Pikkujoulupaketit: seuranta", () => {
  it("kooste tapahtumista ja tallennetuista pyynnöistä", () => {
    expect(PIKKUJOULU_TAPAHTUMAT).toEqual(["sivu", "paketti", "tarjous"]);
    const k = koostaPikkujoulu(
      [{ tapahtuma: "sivu", paketti: "", n: 40 }, { tapahtuma: "paketti", paketti: "pikkujoulu-25", n: 6 }, { tapahtuma: "tarjous", paketti: "pikkujoulu-25", n: 2 }, { tapahtuma: "muu", paketti: "", n: 9 }],
      [{ paketti: "pikkujoulu-25", n: 2 }, { paketti: "pikkujoulu-10", n: 1 }],
    );
    expect(k).toMatchObject({ sivu: 40, paketti: 6, tarjous: 2, tallennetut: 3, paketeittain: { "pikkujoulu-25": { paketti: 6, tarjous: 2, tallennetut: 2 }, "pikkujoulu-10": { tallennetut: 1 } } });
    const rivi = pikkujouluRivi({ alku: "2026-10-05", loppu: "2026-11-04", ...k });
    expect(rivi).toContain("sivukäynnit 40, paketin valinnat 6, tarjouspyynnöt 3");
    expect(rivi).not.toMatch(/[–—]/);
  });

  it("botit ja oma liikenne ohitetaan ennen kirjausta", async () => {
    const out = { status: 0, body: null as unknown };
    const res = { status: (c: number) => { out.status = c; return res; }, json: (b: unknown) => { out.body = b; return res; }, setHeader: () => res };
    await kasittele({ method: "POST", query: {}, headers: { "user-agent": "Googlebot/2.1" }, body: { action: "pikkujoulu", tapahtuma: "sivu", aitous: "aito" } }, res, {});
    expect(out.body).toMatchObject({ ok: false, ohitettu: expect.any(String) });
  });
});
