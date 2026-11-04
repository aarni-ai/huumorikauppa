// @vitest-environment node
/**
 * Joulukalenteri (4.11.2026, api/_lib/joulukalenteri.js): luukut lukossa Suomen päivän mukaan, palvelin ei paljasta tulevia
 * luukkuja, kassa antaa luukun hinnan vain luukun päivänä, kate vähintään 7 € kappaleelta jokaisella luukulla ja
 * variantilla, eikä luukun hinta yhdisty muihin alennuksiin.
 *
 * Kulut: src/test/fixtures/kate-kaikki-2026-11-03.json (tuotannon /api/products 3.11.2026), kuten kassaKatevahti.test.ts.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  avoinLuukku, luukunTila, kalenterinTila, julkisetLuukut, luukunNumero, helsinginPaiva, sovellaLuukku, luukunHinta,
  luukunHeikoinKate, alinHinta30pv, sekuntejaKeskiyohon, LUUKKUJA, JOULUKALENTERI_ALKU, JOULUKALENTERI_LOPPU,
} from "../../api/_lib/joulukalenteri.js";
import JOULUKALENTERI from "../../api/_lib/joulukalenteri-data.js";
import { kalenterinJulkinenTila, koostaSuosio, koostaJoulukalenteri, joulukalenteriRivit, luukkuViestiin } from "../../api/_lib/joulukalenteri-seuranta.js";
import { laskeTilaus, laskettuNettokate } from "../../api/_lib/kassa.js";
import { valmisteleRivi, myynnissa } from "../../api/_lib/tuotteet.js";
import { myytavatVariantit } from "../../api/_lib/kate.js";
import { MIN_KATE_PER_KPL } from "../../api/_lib/katesaanto.js";
import { KAMPANJAPAIVAT } from "../../api/_lib/vakiot.js";
import { joulukalenteriViesti, ajaUutiskirje, luukkuViestiAuki, JOULUKAMPANJA } from "../../api/_lib/uutiskirje.js";
import { valitseLuukut, malli, onJouluaiheinen } from "../../scripts/lib/joulukalenteri-valinta.mjs";
import TOP50 from "../../api/_lib/top50.generated.js";
import { helsinkiTimeToUtcMs } from "@/data/campaignSchedule";
import { buildJoulukalenteriPage } from "@/seo/prerender/pages";

type Tuote = { id: string; slug: string; name: string; category: string; price: number; variants: Record<string, unknown> & { variant_map: Record<string, number> } };
type Luukku = { paiva: number; slug: string; nimi: string; normaali: number; hinta: number; kpl?: number };
const LUUKUT = JOULUKALENTERI as Luukku[];
const KAIKKI = (JSON.parse(fs.readFileSync("src/test/fixtures/kate-kaikki-2026-11-03.json", "utf8")) as { tuotteet: Tuote[] }).tuotteet.map((t) => valmisteleRivi(t) as Tuote);
const bySlug = new Map(KAIKKI.map((t) => [t.slug, t]));
/** Suomen seinäkelloaika -> Date. */
const fi = (y: number, m: number, d: number, h = 0, min = 0, s = 0, ms = 0) => new Date(helsinkiTimeToUtcMs(y, m, d, h, min, s, ms));
const osoite = { address: "Katu 1", zip: "00100", city: "Helsinki" };
type Item = { id: string; slug: string; quantity: number; size: string; color: string };
const item = (t: Tuote, avain: string, quantity = 1): Item => {
  const [color, size] = avain.split("|");
  return { id: t.id, slug: t.slug, quantity, size, color };
};
const tilaa = (items: Item[], { nyt, alennus = null, lisat = {} }: { nyt: Date | null; alennus?: { type: string; value: number; ensitilaus?: boolean } | null; lisat?: Record<string, unknown> }) =>
  laskeTilaus({ items, customerEmail: "a@b.fi", shippingAddress: osoite }, KAIKKI, alennus, {
    korialennus: { nyt: nyt ?? new Date("2026-12-10T10:00:00Z") },
    ...(nyt ? { joulukalenteri: { luukut: LUUKUT, nyt } } : {}),
    ...lisat,
  });
const kpl = (r: { rivit: { quantity: number; type?: string }[] }) => r.rivit.filter((x) => x.type !== "giftcard").reduce((s, x) => s + x.quantity, 0);
const perKpl = (r: ReturnType<typeof laskeTilaus>) => laskettuNettokate(r, KAIKKI) / kpl(r);

describe("joulukalenteri: data (api/_lib/joulukalenteri-data.js)", () => {
  it("24 luukkua 1.-24.12., eri tuotteet ja mallit, kaikki myynnissä, hinta alle normaalin", () => {
    expect(LUUKUT).toHaveLength(LUUKKUJA);
    expect(LUUKUT.map((l) => l.paiva)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    expect(new Set(LUUKUT.map((l) => l.slug)).size).toBe(24);
    expect(new Set(LUUKUT.map((l) => malli(l.slug))).size).toBe(24);
    for (const l of LUUKUT) {
      const t = bySlug.get(l.slug);
      expect(t, l.slug).toBeTruthy();
      expect(myynnissa(t!), l.slug).toBe(true);
      expect(["t-paidat", "hupparit"]).toContain(t!.category);
      expect(l.hinta, l.slug).toBeLessThan(Number(t!.price) * (l.kpl ?? 1));
      expect(l.normaali, l.slug).toBe(Number(t!.price));
      expect(`${l.nimi}`).not.toMatch(/[–—]/);
    }
    const kategoriat = new Set(LUUKUT.map((l) => bySlug.get(l.slug)!.category));
    expect(kategoriat).toEqual(new Set(["t-paidat", "hupparit"]));
    // Jouluaiheiset lähempänä jouluaattoa.
    const joulu = (l: Luukku) => onJouluaiheinen(bySlug.get(l.slug)!);
    expect(LUUKUT.slice(16).every(joulu)).toBe(true);
    expect(LUUKUT.slice(0, 8).filter(joulu).length).toBeLessThan(LUUKUT.slice(16).filter(joulu).length);
  });

  it("valintaskripti tuottaa saman listan etusivun suosituimmista ja tuotekuvasta (scripts/joulukalenteri-valinta.mjs --paikallinen)", () => {
    const valinta = valitseLuukut([...(TOP50 as Set<string>)], KAIKKI);
    expect(valinta.map((l: Luukku) => [l.paiva, l.slug, l.hinta])).toEqual(LUUKUT.map((l) => [l.paiva, l.slug, l.hinta]));
  });

  it("selaimen paketti ei sisällä luukkuja: mikään src/-tiedosto eikä puhdas moduuli tuo joulukalenteri-data.js:ää", () => {
    const tiedostot: string[] = [];
    const kay = (d: string) => {
      for (const f of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, f.name);
        if (f.isDirectory()) kay(p);
        else if (/\.(ts|tsx|js|mjs)$/.test(f.name) && !/\.test\.(ts|tsx)$/.test(f.name)) tiedostot.push(p);
      }
    };
    kay("src");
    const TUONTI = /(from\s+|import\(\s*)["'][^"']*joulukalenteri-data/;
    for (const f of tiedostot) expect(fs.readFileSync(f, "utf8"), f).not.toMatch(TUONTI);
    // Selaimen tuomat palvelinmoduulit (src/lib/ostoskori.ts, src/lib/joulukalenteri.ts, kassa ei ole selaimessa).
    for (const f of ["api/_lib/joulukalenteri.js", "api/_lib/kate.js", "api/_lib/vakiot.js", "api/_lib/katesaanto.js", "api/_lib/kokohinnat.js"]) {
      expect(fs.readFileSync(f, "utf8"), f).not.toMatch(TUONTI);
    }
    // Esirenderöity sivu: ei yhtään luukun tuotetta tai hintaa.
    const sivu = JSON.stringify(buildJoulukalenteriPage());
    for (const l of LUUKUT) {
      expect(sivu).not.toContain(l.slug);
      expect(sivu).not.toContain(l.hinta.toFixed(2).replace(".", ","));
    }
  });
});

describe("joulukalenteri: lukitus Suomen päivän mukaan", () => {
  it("rajat 23.59/00.00 sekä ennen 1.12. ja 24.12. jälkeen", () => {
    expect(avoinLuukku(LUUKUT, fi(2026, 11, 30, 23, 59, 59, 999))).toBeNull();
    expect(kalenterinTila(fi(2026, 11, 30, 23, 59, 59, 999))).toBe("tulossa");
    expect(avoinLuukku(LUUKUT, fi(2026, 12, 1))?.paiva).toBe(1);
    expect(avoinLuukku(LUUKUT, fi(2026, 12, 1, 23, 59, 59, 999))?.paiva).toBe(1);
    expect(avoinLuukku(LUUKUT, fi(2026, 12, 2))?.paiva).toBe(2);
    expect(luukunTila(1, fi(2026, 12, 2))).toBe("mennyt");
    expect(luukunTila(2, fi(2026, 12, 2))).toBe("auki");
    expect(luukunTila(3, fi(2026, 12, 2, 23, 59, 59, 999))).toBe("tuleva");
    expect(luukunTila(3, fi(2026, 12, 3))).toBe("auki");
    expect(avoinLuukku(LUUKUT, fi(2026, 12, 24, 23, 59, 59, 999))?.paiva).toBe(24);
    expect(avoinLuukku(LUUKUT, fi(2026, 12, 25))).toBeNull();
    expect(kalenterinTila(fi(2026, 12, 25))).toBe("paattynyt");
    expect(avoinLuukku(LUUKUT, fi(2027, 12, 5, 12))).toBeNull();
    // UTC-päivä ei ratkaise: 1.12. klo 00.30 Suomessa on vielä 30.11. UTC.
    expect(fi(2026, 12, 1, 0, 30).toISOString().slice(0, 10)).toBe("2026-11-30");
    expect(avoinLuukku(LUUKUT, fi(2026, 12, 1, 0, 30))?.paiva).toBe(1);
    expect(luukunNumero("2026-11-30")).toBeNull();
    expect(luukunNumero("2026-12-25")).toBeNull();
    expect([JOULUKALENTERI_ALKU, JOULUKALENTERI_LOPPU]).toEqual([KAMPANJAPAIVAT.joulukalenteri.alku, KAMPANJAPAIVAT.joulukalenteri.loppu]);
  });

  it("julkiset luukut: vain menneet ja tämän päivän, ei koskaan tulevia", () => {
    expect(julkisetLuukut(fi(2026, 11, 30, 23))).toEqual([]);
    const l = julkisetLuukut(fi(2026, 12, 5, 12));
    expect(l.map((x) => x.paiva)).toEqual([1, 2, 3, 4, 5]);
    expect(l.map((x) => x.tila)).toEqual(["mennyt", "mennyt", "mennyt", "mennyt", "auki"]);
    expect(julkisetLuukut(fi(2026, 12, 26))).toHaveLength(24);
  });

  it("välimuisti päättyy ennen keskiyötä Suomen aikaa", () => {
    expect(sekuntejaKeskiyohon(fi(2026, 12, 5, 23, 59, 0))).toBe(60);
    expect(sekuntejaKeskiyohon(fi(2026, 12, 5, 12))).toBe(12 * 3600);
    expect(helsinginPaiva(new Date(fi(2026, 12, 5, 23, 59, 59).getTime() + sekuntejaKeskiyohon(fi(2026, 12, 5, 23, 59, 59)) * 1000))).toBe("2026-12-06");
  });
});

describe("joulukalenteri: palvelin ei paljasta tulevia luukkuja (kalenterinJulkinenTila)", () => {
  it("jokainen tunti 30.11.-25.12.: vain tämän päivän luukun tuote ja hinta, ei tulevien slugia", async () => {
    for (let t = helsinkiTimeToUtcMs(2026, 11, 30, 12); t < helsinkiTimeToUtcMs(2026, 12, 25, 12); t += 3 * 3600_000) {
      const nyt = new Date(t);
      const s = await kalenterinJulkinenTila({ luukut: LUUKUT, tuotteet: KAIKKI, nyt });
      const json = JSON.stringify(s);
      const n = luukunNumero(helsinginPaiva(nyt));
      for (const l of LUUKUT) {
        if (l.paiva === n) continue;
        expect(json, `${helsinginPaiva(nyt)} luukku ${l.paiva}`).not.toContain(`"${l.slug}"`);
      }
      expect(s.luukut.every((x: { tila: string }) => x.tila !== "tuleva")).toBe(true);
      if (n) {
        expect(s.avoin?.paiva).toBe(n);
        expect(s.avoin?.product.slug).toBe(LUUKUT[n - 1].slug);
        expect(s.avoin?.hinta).toBe(LUUKUT[n - 1].hinta);
        expect(s.avoin?.alin30).toBe(LUUKUT[n - 1].normaali);
      } else {
        expect(s.avoin).toBeNull();
      }
    }
  });

  it("30 päivän alin hinta: pienin hintahistoriasta ja nykyisestä", async () => {
    expect(alinHinta30pv(27.9, [27.9, 24.9, 27.9])).toBe(24.9);
    expect(alinHinta30pv(27.9, [])).toBe(27.9);
    const s = await kalenterinJulkinenTila({ luukut: LUUKUT, tuotteet: KAIKKI, nyt: fi(2026, 12, 3, 9), historia: async () => [20.9] });
    expect(s.avoin?.alin30).toBe(20.9);
  });

  it("myynnistä poistunut tuote ei avaa luukkua", async () => {
    const piilossa = KAIKKI.map((t) => (t.slug === LUUKUT[2].slug ? { ...t, is_active: false } : t));
    expect((await kalenterinJulkinenTila({ luukut: LUUKUT, tuotteet: piilossa, nyt: fi(2026, 12, 3, 9) })).avoin).toBeNull();
  });
});

describe("joulukalenteri: kassa (api/_lib/kassa.js)", () => {
  const l5 = LUUKUT[4];
  const t5 = bySlug.get(l5.slug)!;
  const v5 = myytavatVariantit(t5)[0][0] as string;

  it("luukun hinta vain luukun päivänä Suomen aikaa", () => {
    const paiva = tilaa([item(t5, v5)], { nyt: fi(2026, 12, 5, 12) });
    expect(paiva.joulukalenteri).toMatchObject({ paiva: "2026-12-05", luukku: 5 });
    expect(paiva.rivit[0].unit_cents).toBe(Math.round(l5.hinta * 100) + Math.round((paiva.rivit[0].unit_price - l5.normaali) * 100));
    for (const nyt of [fi(2026, 12, 4, 23, 59, 59, 999), fi(2026, 12, 6), fi(2026, 11, 5, 12), fi(2026, 12, 25, 12)]) {
      const r = tilaa([item(t5, v5)], { nyt });
      expect(r.joulukalenteri, nyt.toISOString()).toBeNull();
      expect(r.rivit[0].unit_cents, nyt.toISOString()).toBe(Math.round(r.rivit[0].unit_price * 100));
    }
    expect(tilaa([item(t5, v5)], { nyt: fi(2026, 12, 5, 23, 59, 59, 999) }).joulukalenteri?.luukku).toBe(5);
    // Ilman kalenteria (vanha kutsu) ei koskaan luukun hintaa.
    expect(tilaa([item(t5, v5)], { nyt: null }).joulukalenteri).toBeNull();
    // Toisen päivän tuote ei saa luukun hintaa.
    const t6 = bySlug.get(LUUKUT[5].slug)!;
    expect(tilaa([item(t6, myytavatVariantit(t6)[0][0] as string)], { nyt: fi(2026, 12, 5, 12) }).joulukalenteri).toBeNull();
  });

  it("kate vähintään 7 € kappaleelta: 24 luukkua x kaikki variantit (yksi kpl, kaksi kpl, hintatestin B)", () => {
    let tarkistettu = 0;
    for (const l of LUUKUT) {
      const t = bySlug.get(l.slug)!;
      const nyt = fi(2026, 12, l.paiva, 12);
      const heikoin = luukunHeikoinKate(t, l);
      expect(heikoin, l.slug).toBeGreaterThanOrEqual(MIN_KATE_PER_KPL);
      for (const [avain] of myytavatVariantit(t) as [string, number][]) {
        for (const [maara, versio] of [[1, "a"], [1, "b"], [2, "a"]] as [number, string][]) {
          const r = tilaa([item(t, avain, maara)], { nyt, lisat: { toimitusVersio: versio } });
          const kuvaus = `${l.paiva}.12. ${l.slug} ${avain} x${maara} ${versio}`;
          // Yksi kappale: luukun hinta aina. Kaksi: luukun hinta tai tavalliset säännöt, kumpi on asiakkaalle edullisempi.
          if (maara === 1) expect(r.joulukalenteri?.luukku, kuvaus).toBe(l.paiva);
          if (r.joulukalenteri?.paiva) {
            expect(r.shipping_included, kuvaus).toBe(false);
            expect(perKpl(r), kuvaus).toBeGreaterThanOrEqual(MIN_KATE_PER_KPL);
          }
          tarkistettu++;
        }
      }
    }
    expect(tarkistettu).toBeGreaterThan(24 * 10 * 3);
  });

  it("luukunHinta on suurin tasaeuroinen alennus, joka täyttää rajan (seuraava euro ei täytä)", () => {
    for (const l of LUUKUT) {
      const t = bySlug.get(l.slug)!;
      const h = luukunHinta(t);
      expect(h?.hinta, l.slug).toBe(l.hinta);
      const halvempi = luukunHeikoinKate(t, { slug: t.slug, hinta: Math.round((l.hinta - 1) * 100) / 100, kpl: 1 });
      expect(halvempi === null || halvempi < MIN_KATE_PER_KPL + 0.2, l.slug).toBe(true);
    }
  });

  it("ei yhdisty: alennuskoodi vie luukun hinnan, ensitilauksen -5 % ei luukun kanssa", () => {
    const nyt = fi(2026, 12, 5, 12);
    const koodi = tilaa([item(t5, v5)], { nyt, alennus: { type: "percent", value: 5 } });
    expect(koodi.joulukalenteri).toEqual({ syy: "alennuskoodi" });
    expect(koodi.rivit[0].joulukalenteri).toBeUndefined();
    expect(koodi.discount).toBeGreaterThan(0);
    const ensi = tilaa([item(t5, v5)], { nyt, lisat: { ensitilausVersio: "b", ensimmainenTilaus: true } });
    expect(ensi.joulukalenteri?.luukku).toBe(5);
    expect(ensi.first_order_discount).toBe(0);
  });

  it("monen tuotteen kori: joko luukun hinta tai tavalliset alennukset, ei molempia, eikä koskaan kalliimpi kuin ilman kalenteria", () => {
    const t6 = bySlug.get(LUUKUT[5].slug)!;
    const tpaita = LUUKUT.find((l) => bySlug.get(l.slug)!.category === "t-paidat")!;
    const huppari = LUUKUT.find((l) => bySlug.get(l.slug)!.category === "hupparit")!;
    const ens = (t: Tuote) => myytavatVariantit(t)[0][0] as string;
    const tapaukset: [string, Luukku, (t: Tuote) => Item[]][] = [
      ["luukku + toinen", LUUKUT[4], (t) => [item(t, ens(t)), item(t6, ens(t6))]],
      ["kaksi luukun t-paitaa", tpaita, (t) => [item(t, ens(t), 2)]],
      ["kaksi luukun hupparia", huppari, (t) => [item(t, ens(t), 2)]],
      ["kymmenen luukun t-paitaa", tpaita, (t) => [item(t, ens(t), 10)]],
      ["luukku + tarra", LUUKUT[4], (t) => [item(t, ens(t)), ...KAIKKI.filter((x) => x.category === "tarrat").slice(0, 1).map((x) => item(x, ens(x)))]],
    ];
    for (const [nimi, l, rivit] of tapaukset) {
      const t = bySlug.get(l.slug)!;
      const nyt = fi(2026, 12, l.paiva, 12);
      const r = tilaa(rivit(t), { nyt });
      const ilman = tilaa(rivit(t), { nyt: null, lisat: { korialennus: { nyt } } });
      expect(r.total, nimi).toBeLessThanOrEqual(ilman.total);
      if (r.joulukalenteri?.paiva) {
        expect(r.basket_discount, nimi).toBe(0);
        expect(r.bundle_discount, nimi).toBe(0);
        expect(r.first_order_discount, nimi).toBe(0);
        expect(r.rivit.some((x: { maaraalennus_prosentti?: number; korialennus_prosentti?: number; tpaitapari?: boolean }) => x.maaraalennus_prosentti || x.korialennus_prosentti || x.tpaitapari), nimi).toBe(false);
        expect(perKpl(r), nimi).toBeGreaterThanOrEqual(MIN_KATE_PER_KPL);
      } else {
        expect(r.rivit.some((x: { joulukalenteri?: string }) => x.joulukalenteri), nimi).toBe(false);
        expect(r.total, nimi).toBe(ilman.total);
      }
    }
  });

  it("sarjaluukku (kpl 2): vain täydet sarjat, rivi jaetaan", () => {
    const sarja = { ...LUUKUT[1], paiva: 2, hinta: Math.round((LUUKUT[1].normaali * 2 - 4) * 100) / 100, kpl: 2, pvm: "2026-12-02" };
    const t = bySlug.get(sarja.slug)!;
    const avain = myytavatVariantit(t)[0][0] as string;
    const [color, size] = avain.split("|");
    const rivi = { slug: t.slug, size, color, quantity: 3, unit_cents: Math.round(Number(t.price) * 100) };
    const s = sovellaLuukku([rivi], sarja, bySlug);
    expect(s?.kpl).toBe(2);
    expect(s?.rivit.map((r: { quantity: number; unit_cents: number }) => [r.quantity, r.unit_cents])).toEqual([[2, rivi.unit_cents - 200], [1, rivi.unit_cents]]);
    expect(sovellaLuukku([{ ...rivi, quantity: 1 }], sarja, bySlug)).toBeNull();
  });
});

describe("joulukalenteri: uutiskirje (api/_lib/uutiskirje.js)", () => {
  const ENV = { ...process.env };
  beforeEach(() => { process.env.CRON_SECRET = "testi-salaisuus"; });
  afterEach(() => { process.env = { ...ENV }; });
  const varasto = (emails: string[], tanaanSaaneet: string[] = []) => {
    const kv = new Map<string, string>();
    const loki = new Set<string>();
    return {
      loki,
      lueKv: async (k: string) => kv.get(k) ?? null,
      kirjoitaKv: async (k: string, v: string) => void kv.set(k, v),
      haeTilaaja: async () => null,
      tervetulojono: async () => [],
      kampanjanVastaanottajat: async (v: string, raja: number, o: { eiTanaan?: string } = {}) =>
        emails.filter((e) => !loki.has(`${v}|${e}`) && !(o.eiTanaan && (tanaanSaaneet.includes(e) || [...loki].some((x) => x.endsWith(`|${e}`) && !x.startsWith(v))))).slice(0, raja).map((email) => ({ email })),
      varaaLahetys: async (v: string, e: string) => (loki.has(`${v}|${e}`) ? false : (loki.add(`${v}|${e}`), true)),
      vapautaLahetys: async (v: string, e: string) => void loki.delete(`${v}|${e}`),
    };
  };
  const ok = () => vi.fn(async () => ({ ok: true }));

  it("viesti: luukun päivä, hinta, 30 päivän alin hinta, peruutus, ei ajatusviivoja", async () => {
    const l = await luukkuViestiin({ luukut: LUUKUT, tuotteet: KAIKKI, nyt: fi(2026, 12, 7, 8) });
    expect(l?.id).toBe("joulukalenteri-2026-12-07");
    expect(await luukkuViestiin({ luukut: LUUKUT, tuotteet: KAIKKI, nyt: fi(2026, 11, 30, 8) })).toBeNull();
    const m = joulukalenteriViesti(l, "a@b.fi");
    const kaikki = `${m.subject} ${m.html} ${m.text}`;
    expect(kaikki).not.toMatch(/[–—]| - /);
    expect(kaikki).not.toMatch(/suosituin|myydyin|paras hinta/i);
    expect(m.text).toContain("Alin hinta 30 päivän aikana ennen tarjousta");
    expect(m.text).toContain("vain tänään 7.12.");
    expect(m.text).toContain("perillä joulun jälkeen");
    expect(m.html).toContain("utm_source=uutiskirje");
    expect(m.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("lähetys: vain luukun päivänä klo 7 alkaen, kerran per osoite, ei ilman vahvistettua domainia, päiväraja", async () => {
    const l = await luukkuViestiin({ luukut: LUUKUT, tuotteet: KAIKKI, nyt: fi(2026, 12, 7, 8) });
    expect(luukkuViestiAuki(l, fi(2026, 12, 7, 6, 59))).toBe(false);
    expect(luukkuViestiAuki(l, fi(2026, 12, 7, 7))).toBe(true);
    expect(luukkuViestiAuki(l, fi(2026, 12, 8, 8))).toBe(false);
    const s = varasto(["a@b.fi", "b@b.fi", "c@b.fi"]);
    const lah = ok();
    expect((await ajaUutiskirje(s, { laheta: lah, vahvistettu: false, nyt: fi(2026, 12, 7, 8), luukku: l })).lahetetty).toBe(0);
    expect((await ajaUutiskirje(s, { laheta: lah, vahvistettu: true, nyt: fi(2026, 12, 7, 6), luukku: l })).lahetetty).toBe(0);
    expect((await ajaUutiskirje(s, { laheta: lah, vahvistettu: true, nyt: fi(2026, 12, 7, 8), luukku: l, rajat: { ajo: 20, paiva: 2 } })).lahetetty).toBe(2);
    // Päiväraja täynnä: kolmas ei saa tänään (yhteinen markkinoinnin kv-laskuri).
    expect((await ajaUutiskirje(s, { laheta: lah, vahvistettu: true, nyt: fi(2026, 12, 7, 9), luukku: l, rajat: { ajo: 20, paiva: 2 } })).lahetetty).toBe(0);
    // Kerran per osoite: uusi ajo isommalla rajalla lähettää vain puuttuvan.
    expect((await ajaUutiskirje(s, { laheta: lah, vahvistettu: true, nyt: fi(2026, 12, 7, 10), luukku: l, rajat: { ajo: 20, paiva: 60 } })).lahetetty).toBe(1);
    expect(lah).toHaveBeenCalledTimes(3);
  });

  it("joulukampanjan viesti samana päivänä ensin, luukku vain niille, jotka eivät saaneet viestiä tänään", async () => {
    const nyt = fi(2026, 12, 1, 10);
    const l = await luukkuViestiin({ luukut: LUUKUT, tuotteet: KAIKKI, nyt });
    const s = varasto(["a@b.fi", "b@b.fi"], ["b@b.fi"]);
    const lah = ok();
    await ajaUutiskirje(s, { laheta: lah, vahvistettu: true, nyt, luukku: l, rajat: { ajo: 20, paiva: 60 } });
    const id3 = JOULUKAMPANJA[2].id;
    expect(s.loki.has(`${id3}|a@b.fi`)).toBe(true);
    expect(s.loki.has(`${l!.id}|a@b.fi`)).toBe(false);
    expect(s.loki.has(`${l!.id}|b@b.fi`)).toBe(false);
  });
});

describe("joulukalenteri: suosio ja mittaus", () => {
  it("suosio: ostot painotettuna, katseluista suurempi lähde, vain slug ja luvut", () => {
    const s = koostaSuosio([{ slug: "a", kpl: 2 }], [{ slug: "b", n: 30 }, { slug: "a", n: 1 }], [{ slug: "b", n: 40 }, { slug: "c", n: 5 }], 25);
    expect(s).toEqual([
      { slug: "a", ostot: 2, katselut: 1, pisteet: 51 },
      { slug: "b", ostot: 0, katselut: 40, pisteet: 40 },
      { slug: "c", ostot: 0, katselut: 5, pisteet: 5 },
    ]);
  });

  it("päivän yhteenvedon rivi", () => {
    const k = koostaJoulukalenteri("2026-12-05", [{ tapahtuma: "kaynti", n: 40 }, { tapahtuma: "luukku", n: 25 }, { tapahtuma: "kori", n: 6 }, { tapahtuma: "x", n: 9 }], { tilauksia: 3, kpl: 4 });
    expect(joulukalenteriRivit(k)).toEqual(["Joulukalenteri 5.12.: 40 aitoa käyntiä, 25 luukun avausta, luukun tuote koriin 6 kertaa, 3 tilausta luukun hinnalla (4 kpl)."]);
  });

  it("valinta: jokainen luukku eri malli, myös muulla järjestyksellä", () => {
    const v = valitseLuukut([...(TOP50 as Set<string>)].reverse(), KAIKKI);
    expect(new Set(v.map((l: Luukku) => malli(l.slug))).size).toBe(24);
  });
});
