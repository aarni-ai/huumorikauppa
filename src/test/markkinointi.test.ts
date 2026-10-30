// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  allekirjoita, tarkistaTunniste, tilaaUutiskirje, tallennaKori, peruViestit, ajaMarkkinointi, muistutusVaihe, arvosteluAika,
  tarkistaEnsitilausKoodi, luoEnsitilausKoodi, peruutusOtsakkeet, koriMuistutusViesti, arvostelupyyntoViesti, tervetuloViesti,
  SUOSTUMUS_UUTISKIRJE, SUOSTUMUS_MUISTUTUS,
} from "../../api/_lib/markkinointi.js";
import { laheta } from "../../api/_lib/sahkoposti.js";
import { kasittele } from "../../api/sahkoposti.js";
import { ENSITILAUS_ALENNUS_PROSENTTI } from "../../api/_lib/vakiot.js";
import { laskeTilauksenKate, ALENNUS_KATE_RAJA } from "../../api/_lib/kate.js";
import { laskeTilaus, KassaVirhe } from "../../api/_lib/kassa.js";

type Rivi = Record<string, unknown>;

/** Muistivarasto pgMarkkinointi-rajapinnalla. */
function muistiVarasto() {
  const kv = new Map<string, string>();
  const tilaajat = new Map<string, Rivi>();
  const kiellot = new Map<string, Rivi>();
  const korit = new Map<string, Rivi>();
  const tilaukset: Rivi[] = [];
  const arviot: Rivi[] = [];
  let id = 0;
  const s = {
    kv, tilaajat, kiellot, korit, tilaukset, arviot,
    lueKv: async (k: string) => kv.get(k) ?? null,
    kirjoitaKv: async (k: string, v: string) => void kv.set(k, v),
    haeTilaaja: async (e: string) => tilaajat.get(e) ?? null,
    haeTilaajaKoodilla: async (k: string) => [...tilaajat.values()].find((t) => t.discount_code === k) ?? null,
    tallennaTilaaja: async (t: Rivi) => {
      const vanha = tilaajat.get(t.email as string);
      tilaajat.set(t.email as string, { ...vanha, ...t, discount_code: vanha?.discount_code ?? t.discount_code, discount_percent: vanha?.discount_percent ?? t.discount_percent });
    },
    merkitseTervetulo: async (e: string, aika: Date) => void (tilaajat.get(e)!.welcome_sent_at = aika),
    maksettujaTilauksia: async (e: string) => tilaukset.filter((t) => String(t.customer_email).toLowerCase() === e && t.status === "maksettu").length,
    koodiKaytetty: async (k: string) => tilaukset.some((t) => t.discount_code === k && t.status === "maksettu"),
    onKielto: async (e: string) => kiellot.has(e),
    lisaaKielto: async (e: string, lahde: string, aika: Date) => {
      if (!kiellot.has(e)) kiellot.set(e, { source: lahde, created_at: aika });
      const k = korit.get(e);
      if (k && !k.stopped_at) k.stopped_at = aika;
    },
    poistaKielto: async (e: string) => void kiellot.delete(e),
    tallennaKori: async (k: Rivi & { consent_at: Date }) => {
      const vanha = korit.get(k.email as string);
      const alusta = !vanha || vanha.recovered_order_id || vanha.stopped_at || vanha.reminder2_sent_at;
      korit.set(k.email as string, {
        ...(alusta ? { id: `kori-${++id}`, created_at: k.consent_at, reminder1_sent_at: null } : vanha),
        ...k, updated_at: k.consent_at, reminder2_sent_at: null, recovered_order_id: null, stopped_at: null,
      });
    },
    poistaKori: async (e: string) => void korit.delete(e),
    haeKori: async (kid: string) => [...korit.values()].find((k) => k.id === kid) ?? null,
    muistutettavatKorit: async () => [...korit.values()].filter((k) => !k.stopped_at && !k.recovered_order_id && !k.reminder2_sent_at),
    maksettuTilausSitten: async (e: string, aika: Date) =>
      (tilaukset.find((t) => String(t.customer_email).toLowerCase() === e && t.status === "maksettu" && new Date(t.paid_at as string) >= new Date(aika))?.id as string) ?? null,
    merkitseKori: async (kid: string, kentat: Rivi) => {
      const k = [...korit.values()].find((x) => x.id === kid)!;
      Object.assign(k, kentat);
    },
    lopetaKoriMaksettuna: async () => {},
    arvostelupyyntoEhdokkaat: async () => tilaukset.filter((t) => t.status === "maksettu" && !t.review_email_sent_at && t.delivered_at),
    merkitseArvostelupyynto: async (tid: string, aika: Date) => void (tilaukset.find((t) => t.id === tid)!.review_email_sent_at = aika),
    haeTilaus: async (tid: string) => tilaukset.find((t) => t.id === tid) ?? null,
    tarjouspyynnot: [] as Rivi[],
    tallennaTarjouspyynto: async function (this: { tarjouspyynnot: Rivi[] }, t: Rivi) { s.tarjouspyynnot.push(t); return s.tarjouspyynnot.length; },
    julkaistutArviot: async (slug: string) => arviot.filter((a) => a.status === "julkaistu"
      && tilaukset.some((t) => t.id === a.order_id && t.status === "maksettu" && (t.items as Rivi[]).some((i) => i.name === a.product_name && i.slug === slug))),
    arvostellut: async (tid: string) => arviot.filter((a) => a.order_id === tid).map((a) => a.product_name as string),
    tallennaArvio: async (a: Rivi) => {
      if (arviot.some((x) => x.order_id === a.order_id && x.product_name === a.product_name)) return false;
      arviot.push(a);
      return true;
    },
  };
  return s;
}

/** Resend-kutsut mockatulla fetchillä. */
function resendMock(vastaus = 200) {
  const viestit: Array<Record<string, unknown>> = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: { body: string; headers: Record<string, string> }) => {
    expect(url).toBe("https://api.resend.com/emails");
    viestit.push(JSON.parse(init.body));
    return new Response(vastaus === 200 ? '{"id":"x"}' : "virhe", { status: vastaus });
  }));
  return viestit;
}

const T0 = new Date("2026-10-26T10:00:00Z");
const min = (m: number) => new Date(T0.getTime() + m * 60000);

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_testi");
  vi.stubEnv("MARKKINOINTI_SALAISUUS", "testisalaisuus");
  vi.stubEnv("KAUPPA_URL", "https://huumorikauppa.fi");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Allekirjoitetut linkit", () => {
  it("tarkoitus ja allekirjoitus tarkistetaan", () => {
    const t = allekirjoita("peru", "a@b.fi");
    expect(tarkistaTunniste(t, "peru")).toBe("a@b.fi");
    expect(tarkistaTunniste(t, "kori")).toBeNull();
    expect(tarkistaTunniste(`${t.split(".")[0]}.vaara`, "peru")).toBeNull();
    expect(tarkistaTunniste("roskaa", "peru")).toBeNull();
    vi.stubEnv("MARKKINOINTI_SALAISUUS", "toinen");
    expect(tarkistaTunniste(t, "peru")).toBeNull();
  });
  it("List-Unsubscribe ja yhden klikkauksen otsake jokaisessa markkinointiviestissä", () => {
    const o = peruutusOtsakkeet("A@B.fi");
    expect(o["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(o["List-Unsubscribe"]).toMatch(/^<https:\/\/huumorikauppa\.fi\/api\/sahkoposti\?peru=.+>$/);
    const kori = { id: "k1", email: "a@b.fi", items: [{ name: "Paita", quantity: 1 }], total: 24.9 };
    const tilaus = { id: "abcdef12-3456", customer_email: "a@b.fi", items: [{ name: "Paita" }], shipped_at: T0, delivered_at: null };
    for (const v of [koriMuistutusViesti(kori, 1), koriMuistutusViesti(kori, 2), arvostelupyyntoViesti(tilaus), tervetuloViesti({ email: "a@b.fi" })]) {
      expect(v.headers["List-Unsubscribe"]).toBeTruthy();
      expect(v.html).toContain("/unsubscribe?token=");
      expect(v.text).toContain("/unsubscribe?token=");
      // Ei ajatus- tai lukuväliviivoja asiakkaan viesteissä.
      expect(`${v.subject} ${v.html} ${v.text}`).not.toMatch(/[–—]/);
    }
  });
});

describe("Uutiskirje ja ensitilauksen koodi", () => {
  it("vaatii suostumuksen ja kelvollisen osoitteen", async () => {
    const s = muistiVarasto();
    const l = vi.fn();
    expect(await tilaaUutiskirje(s, { email: "a@b.fi", suostumus: false }, { laheta: l })).toMatchObject({ ok: false });
    expect(await tilaaUutiskirje(s, { email: "ei-osoite", suostumus: true }, { laheta: l })).toMatchObject({ ok: false });
    expect(s.tilaajat.size).toBe(0);
    expect(l).not.toHaveBeenCalled();
  });
  it("koodi pois käytöstä (0 %): suostumus tallentuu, tervetuloviesti ilman koodia, peruutusotsake mukana", async () => {
    expect(ENSITILAUS_ALENNUS_PROSENTTI).toBe(0);
    const s = muistiVarasto();
    const viestit = resendMock();
    const r = await tilaaUutiskirje(s, { email: " Anna@Esimerkki.fi ", suostumus: true, lahde: "popup" }, { laheta, nyt: T0 });
    expect(r).toEqual({ ok: true, koodiLahetetty: false });
    expect(s.tilaajat.get("anna@esimerkki.fi")).toMatchObject({ consent_at: T0, consent_text: SUOSTUMUS_UUTISKIRJE, source: "popup", discount_code: null });
    expect(viestit).toHaveLength(1);
    expect(viestit[0].to).toEqual(["anna@esimerkki.fi"]);
    expect(String(viestit[0].html)).not.toMatch(/TERVE-/);
    expect((viestit[0].headers as Record<string, string>)["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    // Uusi tilaus samalla osoitteella ei lähetä viestiä uudelleen.
    await tilaaUutiskirje(s, { email: "anna@esimerkki.fi", suostumus: true }, { laheta, nyt: min(5) });
    expect(viestit).toHaveLength(1);
  });
  it("koodi käytössä: yksi koodi per osoite, ei jo tilanneelle", async () => {
    const s = muistiVarasto();
    const viestit = resendMock();
    const r = await tilaaUutiskirje(s, { email: "b@b.fi", suostumus: true }, { laheta, nyt: T0, prosentti: 10 });
    expect(r.koodiLahetetty).toBe(true);
    const koodi = s.tilaajat.get("b@b.fi")!.discount_code as string;
    expect(koodi).toMatch(/^TERVE-[A-Z2-9]{6}$/);
    expect(String(viestit[0].html)).toContain(koodi);
    await tilaaUutiskirje(s, { email: "b@b.fi", suostumus: true }, { laheta, prosentti: 10 });
    expect(s.tilaajat.get("b@b.fi")!.discount_code).toBe(koodi);
    s.tilaukset.push({ id: "o1", customer_email: "c@b.fi", status: "maksettu", paid_at: T0 });
    await tilaaUutiskirje(s, { email: "c@b.fi", suostumus: true }, { laheta, prosentti: 10 });
    expect(s.tilaajat.get("c@b.fi")!.discount_code).toBeNull();
  });
  it("koodin tarkistus: sama osoite, vain ensimmäinen tilaus, kerran", () => {
    const tilaaja = { email: "b@b.fi", discount_code: "TERVE-ABCDEF", discount_percent: 10 };
    expect(tarkistaEnsitilausKoodi({ tilaaja, email: "b@b.fi", aiempiaTilauksia: 0, koodiKaytetty: false, prosentti: 0 }).ok).toBe(false);
    expect(tarkistaEnsitilausKoodi({ tilaaja, email: "x@b.fi", aiempiaTilauksia: 0, koodiKaytetty: false, prosentti: 10 }).ok).toBe(false);
    expect(tarkistaEnsitilausKoodi({ tilaaja, email: "b@b.fi", aiempiaTilauksia: 1, koodiKaytetty: false, prosentti: 10 }).ok).toBe(false);
    expect(tarkistaEnsitilausKoodi({ tilaaja, email: "b@b.fi", aiempiaTilauksia: 0, koodiKaytetty: true, prosentti: 10 }).ok).toBe(false);
    expect(tarkistaEnsitilausKoodi({ tilaaja: null, email: "b@b.fi", aiempiaTilauksia: 0, koodiKaytetty: false, prosentti: 10 }).ok).toBe(false);
    expect(tarkistaEnsitilausKoodi({ tilaaja, email: "B@b.fi ", aiempiaTilauksia: 0, koodiKaytetty: false, prosentti: 10 }))
      .toEqual({ ok: true, alennus: { type: "percent", value: 10, ensitilaus: true } });
    expect(luoEnsitilausKoodi((n: number) => new Uint8Array(n))).toBe("TERVE-AAAAAA");
  });
});

describe("Ensitilauksen alennus ja kate", () => {
  // Tyypillinen tilaus 25.10.2026 kuluilla: yksi t-paita 24,90 €, tuotekulu 8,90 €, toimitus Suomeen 8,49 €.
  const paita = (hinta: number, kulu = 890) => ({
    id: "p1", slug: "paita", name: "Paita", category: "t-paidat", price: hinta, is_active: true, printify_product_id: "pf1",
    variants: { variant_map: { "Musta|M": 11 }, costs: { "11": kulu }, shipping_cents: 849 },
  });
  const kate = (hinta: number, ale: number, kulu = 890) =>
    laskeTilauksenKate([{ tuote: paita(hinta, kulu), varianttiId: 11, maara: 1, yksikkohinta: hinta * (1 - ale / 100) }], 5.9);
  it("nykyhinnalla mikään 5-10 %:n alennus ei pidä 30 %:n katetta: koodi pois käytöstä", () => {
    expect(ALENNUS_KATE_RAJA).toBe(0.3);
    expect(kate(24.9, 0).kate).toBeCloseTo(0.262, 3);
    for (const ale of [5, 6, 7, 8, 9, 10]) expect(kate(24.9, ale).sallittu).toBe(false);
  });
  it("vaadittu hintataso: 5 % vaatii 28,90 €, 10 % vaatii 29,90 € (kulu 9,93 €: 30,90 € ja 31,90 €)", () => {
    expect(kate(28.9, 5).sallittu).toBe(true);
    expect(kate(27.9, 5).sallittu).toBe(false);
    expect(kate(29.9, 10).sallittu).toBe(true);
    expect(kate(28.9, 10).sallittu).toBe(false);
    expect(kate(30.9, 5, 993).sallittu).toBe(true);
    expect(kate(31.9, 10, 993).sallittu).toBe(true);
    expect(kate(30.9, 10, 993).sallittu).toBe(false);
  });
  it("kassa hylkää ensitilauksen koodin, jos tilauksen kate jää alle 30 %", () => {
    const pyynto = { items: [{ id: "p1", quantity: 1, size: "M", color: "Musta" }], customerEmail: "a@b.fi", shippingAddress: { address: "K 1", zip: "00100", city: "Hki" } };
    const koodi = { type: "percent", value: 10, ensitilaus: true };
    expect(() => laskeTilaus(pyynto, [paita(24.9)], koodi)).toThrow(KassaVirhe);
    expect(() => laskeTilaus(pyynto, [paita(24.9)], koodi)).toThrow(/Ensitilauksen alennuskoodia ei voi käyttää/);
    const ok = laskeTilaus(pyynto, [paita(29.9)], koodi);
    expect(ok.discount).toBe(2.99);
    // Tavallinen koodi: hylätään, jos tilauksen nettokate jäisi alle 7 € (29.10.2026), muuten hyväksytään.
    expect(() => laskeTilaus(pyynto, [paita(24.9)], { type: "percent", value: 10 })).toThrow(/Alennuskoodia ei voi käyttää/);
    expect(laskeTilaus(pyynto, [paita(29.9)], { type: "percent", value: 5 }).discount).toBe(1.49);
    // Kulut tallentuvat riville päivän yhteenvetoa varten.
    expect(ok.rivit[0]).toMatchObject({ kulu_sentit: 890, toimitus_sentit: 849 });
  });
});

describe("Keskeneräisen tilauksen muistutus", () => {
  const items = [{ product: { slug: "tonnin-seteli-t-paita", name: "Tonnin seteli | T-paita", price: 24.9 }, quantity: 2, selectedSize: "L", selectedColor: "Musta" }];
  it("tallentuu vain suostumuksella, suostumuksen peruminen poistaa korin", async () => {
    const s = muistiVarasto();
    expect((await tallennaKori(s, { email: "a@b.fi", items, suostumus: true }, { nyt: T0 })).ok).toBe(true);
    expect(s.korit.get("a@b.fi")).toMatchObject({ total: 49.8, consent_text: SUOSTUMUS_MUISTUTUS, consent_at: T0 });
    expect((s.korit.get("a@b.fi")!.items as Rivi[])[0]).toEqual({ slug: "tonnin-seteli-t-paita", name: "Tonnin seteli | T-paita", price: 24.9, quantity: 2, size: "L", color: "Musta", customText: undefined });
    await tallennaKori(s, { email: "a@b.fi", items, suostumus: false });
    expect(s.korit.size).toBe(0);
    expect((await tallennaKori(s, { email: "a@b.fi", items: [], suostumus: true })).ok).toBe(false);
  });
  it("yksi muistutus 24 h kuluttua, ei tunnin muistutusta", async () => {
    const s = muistiVarasto();
    const viestit = resendMock();
    await tallennaKori(s, { email: "a@b.fi", items, suostumus: true }, { nyt: T0 });
    expect((await ajaMarkkinointi(s, { laheta, nyt: min(61) })).lahetetty).toBe(0);
    expect((await ajaMarkkinointi(s, { laheta, nyt: min(23 * 60) })).lahetetty).toBe(0);
    expect((await ajaMarkkinointi(s, { laheta, nyt: min(24 * 60 + 1) })).lahetetty).toBe(1);
    expect(viestit[0].subject).toMatch(/yhä tallessa/);
    expect(String(viestit[0].html)).toContain("/palauta-kori?token=");
    expect(String(viestit[0].html)).toContain("ainoa muistutus");
    expect(String(viestit[0].html)).not.toMatch(/alennuskoodi/i);
    expect((await ajaMarkkinointi(s, { laheta, nyt: min(48 * 60) })).lahetetty).toBe(0);
    expect(viestit).toHaveLength(1);
    expect(muistutusVaihe({ updated_at: T0, created_at: T0 }, min(8 * 24 * 60))).toBeNull();
  });
  it("maksettu tilaus lopettaa muistutukset", async () => {
    const s = muistiVarasto();
    const viestit = resendMock();
    await tallennaKori(s, { email: "a@b.fi", items, suostumus: true }, { nyt: T0 });
    s.tilaukset.push({ id: "o1", customer_email: "A@b.fi", status: "maksettu", paid_at: min(20).toISOString() });
    const r = await ajaMarkkinointi(s, { laheta, nyt: min(24 * 60 + 1) });
    expect(r.lahetetty).toBe(0);
    expect(s.korit.get("a@b.fi")!.recovered_order_id).toBe("o1");
    expect(viestit).toHaveLength(0);
  });
  it("peruutus lopettaa muistutukset", async () => {
    const s = muistiVarasto();
    const viestit = resendMock();
    await tallennaKori(s, { email: "a@b.fi", items, suostumus: true }, { nyt: T0 });
    await peruViestit(s, "a@b.fi", { nyt: min(10) });
    expect((await ajaMarkkinointi(s, { laheta, nyt: min(24 * 60 + 1) })).lahetetty).toBe(0);
    expect(viestit).toHaveLength(0);
  });
  it("lähetysraja: ajo- ja päiväraja, loput seuraavaan ajoon", async () => {
    const s = muistiVarasto();
    resendMock();
    for (const e of ["a@b.fi", "b@b.fi", "c@b.fi"]) await tallennaKori(s, { email: e, items, suostumus: true }, { nyt: T0 });
    const r = await ajaMarkkinointi(s, { laheta, nyt: min(24 * 60 + 1), rajat: { ajo: 2, paiva: 60 } });
    expect(r).toMatchObject({ lahetetty: 2, ohitettu: 1 });
    expect(s.kv.get("markkinointi_lahetetty_2026-10-27")).toBe("2");
    const r2 = await ajaMarkkinointi(s, { laheta, nyt: min(24 * 60 + 10), rajat: { ajo: 20, paiva: 2 } });
    expect(r2).toMatchObject({ lahetetty: 0, ohitettu: 1 });
    const r3 = await ajaMarkkinointi(s, { laheta, nyt: min(24 * 60 + 10), rajat: { ajo: 20, paiva: 3 } });
    expect(r3.lahetetty).toBe(1);
  });
  it("Resendin virhe: ei merkitä lähetetyksi", async () => {
    const s = muistiVarasto();
    resendMock(500);
    await tallennaKori(s, { email: "a@b.fi", items, suostumus: true }, { nyt: T0 });
    const r = await ajaMarkkinointi(s, { laheta, nyt: min(24 * 60 + 1) });
    expect(r.lahetetty).toBe(0);
    expect(s.korit.get("a@b.fi")!.reminder1_sent_at).toBeNull();
  });
  it("ilman allekirjoitusavainta ei lähetetä mitään", async () => {
    vi.stubEnv("MARKKINOINTI_SALAISUUS", "");
    vi.stubEnv("CRON_SECRET", "");
    const s = muistiVarasto();
    await tallennaKori(s, { email: "a@b.fi", items, suostumus: true }, { nyt: T0 });
    expect((await ajaMarkkinointi(s, { laheta: vi.fn(), nyt: min(61) })).loki[0]).toMatch(/ohitettu/);
  });
});

describe("Arviopyyntö", () => {
  const tilaus = (extra: Rivi) => ({ id: "abcdef12-0000", status: "maksettu", customer_email: "a@b.fi", customer_name: "Anna A", items: [{ name: "Paita" }, { name: "Kortti", type: "giftcard" }], ...extra });
  it("vain varmistetun perillemenon jälkeen: 7 pv toimituksesta, pelkkä lähetys ei riitä", () => {
    expect(arvosteluAika(tilaus({ delivered_at: T0, shipped_at: min(-3000) }), min(6 * 24 * 60))).toBe(false);
    expect(arvosteluAika(tilaus({ delivered_at: T0 }), min(7 * 24 * 60))).toBe(true);
    expect(arvosteluAika(tilaus({ shipped_at: T0 }), min(30 * 24 * 60))).toBe(false);
    expect(arvosteluAika(tilaus({ delivered_at: T0, review_email_sent_at: T0 }), min(20 * 24 * 60))).toBe(false);
    expect(arvosteluAika(tilaus({}), min(20 * 24 * 60))).toBe(false);
  });
  it("kerran per tilaus, peruutus ohittaa", async () => {
    const s = muistiVarasto();
    const viestit = resendMock();
    s.tilaukset.push(tilaus({ shipped_at: T0, delivered_at: min(2 * 24 * 60) }), { ...tilaus({ shipped_at: T0, delivered_at: min(2 * 24 * 60) }), id: "bbbbbbbb-0000", customer_email: "pois@b.fi" });
    await peruViestit(s, "pois@b.fi");
    const r = await ajaMarkkinointi(s, { laheta, nyt: min(11 * 24 * 60) });
    expect(r.lahetetty).toBe(1);
    expect(viestit[0].to).toEqual(["a@b.fi"]);
    expect(String(viestit[0].html)).toContain("/arvostele?token=");
    // Suora linkki tuotteen arvioon (rivi 0 = Paita), lahjakortille ei linkkiä.
    expect(String(viestit[0].html)).toContain("&amp;t=0");
    expect(String(viestit[0].html)).not.toContain("Kortti");
    expect((await ajaMarkkinointi(s, { laheta, nyt: min(12 * 24 * 60) })).lahetetty).toBe(0);
    expect(s.tilaukset[1].review_email_sent_at).toBeTruthy();
  });
});

describe("/api/sahkoposti tarjouspyyntö (/yritykset)", () => {
  const kutsu = async (st: ReturnType<typeof muistiVarasto>, body: Rivi) => {
    const out = { status: 0, body: null as unknown };
    const res = { status: (c: number) => { out.status = c; return res; }, json: (b: unknown) => { out.body = b; return res; }, setHeader: () => res };
    await kasittele({ method: "POST", query: {}, body: { action: "tarjouspyynto", ...body } }, res, st);
    return out;
  };
  it("tallentaa ja ilmoittaa, puutteellinen ja roskaposti hylätään", async () => {
    const st = muistiVarasto();
    const viestit = resendMock();
    expect((await kutsu(st, { yritys: "Oy Ab", nimi: "Anna", email: "ei-osoite" })).status).toBe(400);
    expect((await kutsu(st, { yritys: "Oy Ab", nimi: "Anna", email: "a@b.fi", kotisivu: "http://x" })).body).toEqual({ ok: true });
    expect(st.tarjouspyynnot.length).toBe(0);
    expect((await kutsu(st, { yritys: "Oy Ab", nimi: "Anna", email: "A@B.fi", maara: "25", viesti: "Joulupaidat" })).body).toMatchObject({ ok: true, hinta: null });
    expect(st.tarjouspyynnot[0]).toMatchObject({ yritys: "Oy Ab", email: "a@b.fi", maara: 25 });
    // Laskuri: palvelin laskee hinnan ja kateen uudelleen; koot ja toivottu päivä tallentuvat.
    const r = await kutsu(st, { yritys: "Oy Ab", nimi: "Anna", email: "a@b.fi", malli: "meemipaita", koot: { M: 5, L: 5 }, toimituspaiva: "2099-12-01", ytunnus: "3653666-7" });
    expect(r.body).toMatchObject({ ok: true, hinta: 224.1, aikataulu: { ehtii: true } });
    expect(st.tarjouspyynnot[1]).toMatchObject({ maara: 10, malli: "meemipaita", koot: { M: 5, L: 5 }, hinta: 224.1, ytunnus: "3653666-7", toivottu_paiva: "2099-12-01", ehtii: true });
    expect(st.tarjouspyynnot[1].kate).toBeGreaterThan(50);
    expect(String(viestit[0].subject)).toContain("Tarjouspyyntö: Oy Ab, 25 kpl");
  });
});

describe("/api/sahkoposti ?arviot=<slug>", () => {
  it("vain julkaistut arviot maksetuista tilauksista, nimi lyhennettynä", async () => {
    const s = muistiVarasto();
    s.tilaukset.push({ id: "t1", status: "maksettu", items: [{ name: "Paita", slug: "paita-t-paita" }] });
    s.arviot.push({ order_id: "t1", product_name: "Paita", stars: 5, body: "Hyvä", customer_name: "Anna Asiakas", status: "julkaistu", created_at: new Date("2026-11-02T10:00:00Z") },
      { order_id: "t1", product_name: "Paita", stars: 1, body: "x", customer_name: "B", status: "odottaa", created_at: new Date("2026-11-02T10:00:00Z") });
    const out = { status: 0, body: null as unknown };
    const res = { status: (c: number) => { out.status = c; return res; }, json: (b: unknown) => { out.body = b; return res; }, setHeader: () => res };
    await kasittele({ method: "GET", query: { arviot: "paita-t-paita" }, body: {} }, res, s);
    expect(out.body).toEqual({ arviot: [{ nimi: "Anna A.", tahdet: 5, teksti: "Hyvä", pvm: "2026-11-02" }] });
  });
});

describe("/api/sahkoposti", () => {
  const kutsu = async (s: ReturnType<typeof muistiVarasto>, req: Rivi) => {
    const out = { status: 0, body: null as unknown };
    const res = { status: (c: number) => { out.status = c; return res; }, json: (b: unknown) => { out.body = b; return res; } };
    await kasittele({ method: "GET", query: {}, body: {}, ...req }, res, s);
    return out;
  };
  it("yhden klikkauksen peruutus POSTilla, GET vain tarkistaa", async () => {
    const s = muistiVarasto();
    const token = allekirjoita("peru", "a@b.fi");
    expect(await kutsu(s, { query: { peru: token } })).toEqual({ status: 200, body: { valid: true } });
    expect(s.kiellot.size).toBe(0);
    expect(await kutsu(s, { method: "POST", query: { peru: token }, body: "List-Unsubscribe=One-Click" })).toEqual({ status: 200, body: { success: true } });
    expect(s.kiellot.has("a@b.fi")).toBe(true);
    expect((await kutsu(s, { query: { peru: token } })).body).toEqual({ valid: false, reason: "already_unsubscribed" });
    expect((await kutsu(s, { method: "POST", body: { action: "peru", token } })).body).toEqual({ success: false, reason: "already_unsubscribed" });
    expect((await kutsu(s, { query: { peru: "vaara.tunniste" } })).status).toBe(400);
  });
  it("tilaus ja kori lomakkeelta, korin palautus linkistä", async () => {
    const s = muistiVarasto();
    resendMock();
    expect((await kutsu(s, { method: "POST", body: { action: "tilaa", email: "a@b.fi" } })).status).toBe(400);
    expect(await kutsu(s, { method: "POST", body: { action: "tilaa", email: "a@b.fi", suostumus: true, lahde: "popup" } })).toEqual({ status: 200, body: { ok: true, koodiLahetetty: false } });
    const items = [{ product: { slug: "x-t-paita", name: "X", price: 10 }, quantity: 1 }];
    expect((await kutsu(s, { method: "POST", body: { action: "kori", email: "a@b.fi", items, suostumus: true } })).status).toBe(200);
    const kori = s.korit.get("a@b.fi")!;
    const r = await kutsu(s, { query: { kori: allekirjoita("kori", kori.id as string) } });
    expect(r).toMatchObject({ status: 200, body: { ok: true, items: [{ slug: "x-t-paita", quantity: 1 }] } });
    expect((await kutsu(s, { query: { kori: allekirjoita("peru", kori.id as string) } })).status).toBe(404);
  });
  it("arvio: tilauksen tuotteet, tallennus kerran, peruutus", async () => {
    const s = muistiVarasto();
    s.tilaukset.push({ id: "o1", status: "maksettu", customer_email: "a@b.fi", customer_name: "Anna Aho", items: [{ name: "Paita", quantity: 1 }, { name: "Kortti", type: "giftcard" }] });
    const token = allekirjoita("arvostelu", "o1");
    expect((await kutsu(s, { query: { arvostelu: token } })).body).toEqual({ products: [{ name: "Paita", quantity: 1, reviewed: false }], customerName: "Anna", unsubscribed: false });
    const arvio = { action: "review", token, productName: "Paita", stars: 5, text: "Hyvä", customerName: "Anna" };
    expect((await kutsu(s, { method: "POST", body: arvio })).status).toBe(200);
    expect((await kutsu(s, { method: "POST", body: arvio })).status).toBe(409);
    expect((await kutsu(s, { method: "POST", body: { ...arvio, productName: "Muu" } })).status).toBe(400);
    expect((await kutsu(s, { method: "POST", body: { ...arvio, stars: 6 } })).status).toBe(400);
    expect(s.arviot[0]).toMatchObject({ order_id: "o1", stars: 5, body: "Hyvä" });
    await kutsu(s, { method: "POST", body: { action: "unsubscribe", token } });
    expect(s.kiellot.has("a@b.fi")).toBe(true);
    expect((await kutsu(s, { query: { arvostelu: allekirjoita("arvostelu", "ei-ole") } })).status).toBe(404);
  });
});

describe("kiitosviestin Seuraava tilaus -suositukset", async () => {
  const { seuraavaTilausSuositukset, vahvistusViesti } = await import("../../api/_lib/sahkoposti.js");
  const tuotteet = [
    { slug: "amatimies-huppari", name: "Amatimies | Huppari", category: "hupparit", price: 49.99, is_active: true },
    { slug: "amatimies-t-paita", name: "Amatimies | T-Paita", category: "t-paidat", price: 24.9, is_active: true },
    { slug: "amatimies-juliste-poster", name: "Amatimies | Juliste (poster)", category: "seinataulut", price: 22.9, is_active: true },
    { slug: "kalju-t-paita", name: "Kalju | T-Paita", category: "t-paidat", price: 24.9, is_active: true },
  ];
  const tilaus = { id: "abcdef12-0000", items: [{ slug: "amatimies-huppari", name: "Amatimies | Huppari", quantity: 1, unit_price: 49.99 }], shipping: 6.9, total: 56.89 };
  it("sama aihe muina tuotetyyppeinä, ei ostettua eikä muita aiheita, ei alennuskoodia", () => {
    const s = seuraavaTilausSuositukset(tilaus, tuotteet);
    expect(s.map((x) => x.slug)).toEqual(["amatimies-t-paita", "amatimies-juliste-poster"]);
    const v = vahvistusViesti(tilaus, s);
    expect(v.html).toContain("Seuraava tilaus");
    expect(v.html).toContain("/tuote/amatimies-t-paita");
    expect(v.html).not.toMatch(/koodi|alennus -/i);
  });
});
