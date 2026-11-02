/**
 * Ryhmätilaukset (2.11.2026): hinnoittelu ja kate (kaikki määrät 1-100, kaikki koot ja värit, molemmat maksutavat,
 * myös ALV-varasuunnitelman hinnasto), tekstisäännöt, tilakone (luonti, jäsenet, maksut, lukitus, Printify-lähetys)
 * muistivarastolla ja Printify-runko. Tuotannon kulut: src/test/fixtures/kate-tilannekuva.json (OPT OnDemand -t-paidat).
 */
import { describe, expect, it, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import {
  RYHMAPAITA_TUOTE, RYHMA_MIN_KPL, RYHMA_MAX_KPL, RYHMA_MIN_KATE_PER_PAITA, RYHMA_SELKA_KULU_SENTIT, RYHMA_KOOT,
  kappalehinta, perushinta, hintaporras, ryhmanNettokate, tarkistaDesign, tarkistaJasen, lukitusSuunnitelma, kaikkiMaksaneet,
  tilausRivit, etuSvg, selkaSvg, kootVarille, variantti,
} from "../../api/_lib/ryhmatilaus.js";
import { ryhmaPalvelu, tiiviste } from "../../api/_lib/ryhmatilaus-db.js";
import { HINNASTOT, HINNASTO } from "../../api/_lib/vakiot.js";
import { PERSONOITU_TUOTE } from "../../api/_lib/personoitu.js";
import { tilausRunko } from "../../api/_lib/printify.js";
import { tarkistaTunniste } from "../../api/_lib/markkinointi.js";

beforeAll(() => { process.env.MARKKINOINTI_SALAISUUS = process.env.MARKKINOINTI_SALAISUUS || "testisalaisuus"; });

const VARIANTIT = Object.keys(RYHMAPAITA_TUOTE.variants.variant_map) as string[];

// ── Hinnoittelu ja kate ──────────────────────────────────────────────────────────────────────────────────────────

describe("ryhmäpaidan hinnat", () => {
  it("portaat 5+, 10+, 25+ ja 50+, hinta laskee määrän kasvaessa, 3XL-5XL + 2 €", () => {
    expect(HINNASTO.ryhmapaita).toBe(HINNASTOT.perus.ryhmapaita);
    expect([5,9, 10, 24, 25, 49, 50, 100].map((n) => kappalehinta(n, "M"))).toEqual([37.9, 37.9, 35.9, 35.9, 34.9, 34.9, 33.9, 33.9]);
    expect(kappalehinta(10, "3XL")).toBe(37.9);
    expect(perushinta("L")).toBe(37.9);
    expect(perushinta("5XL")).toBe(39.9);
    for (let n = 2; n <= 100; n++) expect(kappalehinta(n, "M")).toBeLessThanOrEqual(kappalehinta(n - 1, "M"));
    expect(hintaporras(1)).toEqual({ min: 5, hinta: 37.9 });
  });

  it("kulut: tuotannon OPT-t-paidan kulu + selkäpainatuksen arvio jokaiselle variantille", () => {
    const tuotanto = JSON.parse(readFileSync("src/test/fixtures/kate-tilannekuva.json", "utf8")) as { tuotteet: { variants?: { costs?: Record<string, number> } }[] };
    const tuotannonKulu = new Map<string, number>();
    for (const t of tuotanto.tuotteet) for (const [id, c] of Object.entries(t.variants?.costs || {})) tuotannonKulu.set(id, Math.max(c, tuotannonKulu.get(id) ?? 0));
    let verrattu = 0;
    for (const avain of VARIANTIT) {
      const id = String(RYHMAPAITA_TUOTE.variants.variant_map[avain]);
      const etu = RYHMAPAITA_TUOTE.variants.costs[id] - RYHMA_SELKA_KULU_SENTIT;
      expect(etu, avain).toBe((PERSONOITU_TUOTE.variants.costs as Record<string, number>)[id]);
      if (tuotannonKulu.has(id)) { expect(etu, avain).toBeGreaterThanOrEqual(tuotannonKulu.get(id)!); verrattu++; }
    }
    expect(verrattu).toBeGreaterThan(20);
    expect(RYHMAPAITA_TUOTE.variants.shipping_cents).toBe(849);
    expect(RYHMAPAITA_TUOTE.variants.shipping_additional_cents).toBe(119);
  });

  // Pahin tapaus: kaikki paidat samaa varianttia (toimitus on tilauskohtainen, joten sekoitus ei ole pahempi).
  const tapaukset = [
    ["perus", HINNASTOT.perus.ryhmapaita, 1],
    ["ALV-varasuunnitelma (Printify-kulu x 1,255)", HINNASTOT.alvKulu.ryhmapaita, 1.255],
  ] as const;
  for (const [nimi, h, kerroin] of tapaukset) {
    it(`${nimi}: nettokate vähintään ${RYHMA_MIN_KATE_PER_PAITA} € paidalta kaikilla määrillä ${RYHMA_MIN_KPL}-${RYHMA_MAX_KPL}, kaikilla koilla ja väreillä, molemmilla maksutavoilla`, () => {
      let pienin = Infinity;
      for (let n = 1; n <= 100; n++) {
        for (const avain of VARIANTIT) {
          const [vari, koko] = avain.split("|");
          const hinta = kappalehinta(n, koko, h);
          for (const tapa of ["jasenet", "vetaja"] as const) {
            const rivit = Array.from({ length: n }, () => ({ vari, koko, hinta, maksettu: tapa === "jasenet" ? perushinta(koko, h) : hinta }));
            const k = ryhmanNettokate(rivit, { maksuja: tapa === "jasenet" ? n : 1, kerroin });
            expect(k.tunnettu).toBe(true);
            if (n < RYHMA_MIN_KPL) continue; // alle 5 paidan tilausta ei voi lukita (alla)
            expect(k.perPaita, `${n} kpl ${avain} ${tapa}`).toBeGreaterThanOrEqual(RYHMA_MIN_KATE_PER_PAITA);
            pienin = Math.min(pienin, k.perPaita);
          }
        }
      }
      expect(pienin).toBeGreaterThanOrEqual(RYHMA_MIN_KATE_PER_PAITA);
    });
  }

  it("pienin kate portaittain (raportti): jokainen porras täyttää rajan", () => {
    const portaittain: Record<number, number> = {};
    for (let n = RYHMA_MIN_KPL; n <= RYHMA_MAX_KPL; n++) {
      for (const avain of VARIANTIT) {
        const [vari, koko] = avain.split("|");
        const hinta = kappalehinta(n, koko);
        const k = ryhmanNettokate(Array.from({ length: n }, () => ({ vari, koko, hinta, maksettu: perushinta(koko) })), { maksuja: n });
        const p = hintaporras(n).min;
        portaittain[p] = Math.min(portaittain[p] ?? Infinity, k.perPaita!);
      }
    }
    expect(Object.keys(portaittain).map(Number)).toEqual([5, 10, 25, 50]);
    for (const v of Object.values(portaittain)) expect(v).toBeGreaterThanOrEqual(RYHMA_MIN_KATE_PER_PAITA);
  });

  it("alle 5 paidan tilausta ei voi lukita, 5 paitaa voi", () => {
    const ryhma = { id: "r", tila: "avoin", maksutapa: "vetaja", paikat: 10, vari: "Musta", design: { nimi: "Abit" } };
    const jasenet = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `j${i}`, tila: "tayttanyt", koko: "M", nimi: "Aino" }));
    for (let n = 1; n < RYHMA_MIN_KPL; n++) expect(lukitusSuunnitelma(ryhma, jasenet(n), "vetaja").ok, `${n}`).toBe(false);
    expect(lukitusSuunnitelma(ryhma, jasenet(5), "vetaja")).toMatchObject({ ok: true, kpl: 5, vetajanSumma: 189.5 });
  });

  it("lukituksen suunnitelma: lopullinen hinta paitamäärästä ja hyvitys itse maksaneille", () => {
    const ryhma = { id: "r", tila: "avoin", maksutapa: "jasenet", paikat: 12, vari: "Valkoinen", design: { nimi: "Abit" } };
    const jasenet = Array.from({ length: 12 }, (_, i) => ({ id: `j${i}`, tila: i < 10 ? "maksettu" : "tayttanyt", maksaja: i < 10 ? "jasen" : null, maksettu: i < 10 ? 37.9 : null, hyvitetty: 0, koko: "L", nimi: "Eetu" }));
    const pois = lukitusSuunnitelma(ryhma, jasenet, "jata-pois");
    expect(pois).toMatchObject({ ok: true, kpl: 10, pois: ["j10", "j11"], vetajaMaksaa: [], vetajanSumma: 0 });
    expect(pois.hyvitykset).toHaveLength(10);
    expect(pois.hyvitykset[0]).toEqual({ id: "j0", summa: 2 });
    const loput = lukitusSuunnitelma(ryhma, jasenet, "maksa-loput");
    expect(loput).toMatchObject({ ok: true, kpl: 12, vetajaMaksaa: ["j10", "j11"], vetajanSumma: 71.8 });
    expect(lukitusSuunnitelma(ryhma, jasenet, "jotain").ok).toBe(false);
  });
});

// ── Tekstisäännöt ────────────────────────────────────────────────────────────────────────────────────────────────

describe("ryhmäpaidan tekstisäännöt", () => {
  it("etupuoli: nimi pakollinen, vuosi ja teksti valinnaisia, ei kirosanoja, osoitteita eikä tavaramerkkejä", () => {
    expect(tarkistaDesign({ nimi: "Abit", vuosi: "2027", teksti: "Viimeinen päivä koulussa" })).toMatchObject({ ok: true, nimi: "Abit", vuosi: "2027" });
    expect(tarkistaDesign({ nimi: "  Kylän   kuoro " })).toMatchObject({ ok: true, nimi: "Kylän kuoro", vuosi: null, teksti: null, logo: null });
    expect(tarkistaDesign({ nimi: "" }).ok).toBe(false);
    expect(tarkistaDesign({ nimi: "A".repeat(25) }).ok).toBe(false);
    expect(tarkistaDesign({ nimi: "Abit", vuosi: "27" }).ok).toBe(false);
    expect(tarkistaDesign({ nimi: "Abit", vuosi: "3027" }).ok).toBe(false);
    for (const huono of ["Perkeleen abit", "Vittu mitä porukkaa", "Saatana 2027"]) expect(tarkistaDesign({ nimi: huono }).ok, huono).toBe(false);
    for (const merkki of ["Kärpät fanit", "HIFK 2026", "Nike tiimi", "Disney porukka"]) expect(tarkistaDesign({ nimi: merkki }).ok, merkki).toBe(false);
    expect(tarkistaDesign({ nimi: "Abit", teksti: "www.esimerkki.fi" }).ok).toBe(false);
    expect(tarkistaDesign({ nimi: "Abit", teksti: "<script>" }).ok).toBe(false);
    expect(tarkistaDesign({ nimi: "Abit", logo: "ei-uuid" }).ok).toBe(false);
    expect(tarkistaDesign({ nimi: "Abit", logo: "123e4567-e89b-12d3-a456-426614174000", teksti: "Penkkarit" })).toMatchObject({ ok: true });
    expect(tarkistaDesign({ nimi: "Abit", vuosi: "2027", logo: "123e4567-e89b-12d3-a456-426614174000", teksti: "Viimeinen päivä koulussa ja" }).ok).toBe(false);
  });

  it("selkä: nimi 1-14 merkkiä, numero 0-99, koko värin mukaan", () => {
    expect(tarkistaJasen({ nimi: "Iso-Jussi", numero: "7", koko: "XL" }, "Musta")).toEqual({ ok: true, nimi: "Iso-Jussi", numero: "7", koko: "XL" });
    expect(tarkistaJasen({ nimi: "Aino", numero: "", koko: "S" }, "Valkoinen")).toMatchObject({ ok: true, numero: null });
    expect(tarkistaJasen({ nimi: "", koko: "M" }).ok).toBe(false);
    expect(tarkistaJasen({ nimi: "Maximilianusson", koko: "M" }).ok).toBe(false);
    expect(tarkistaJasen({ nimi: "Aino", numero: "100", koko: "M" }).ok).toBe(false);
    expect(tarkistaJasen({ nimi: "Aino2", koko: "M" }).ok).toBe(false);
    expect(tarkistaJasen({ nimi: "Huora", koko: "M" }).ok).toBe(false);
    expect(tarkistaJasen({ nimi: "Tapani", koko: "M" }).ok).toBe(true);
    expect(tarkistaJasen({ nimi: "Lego", koko: "M" }).ok).toBe(false);
    expect(tarkistaJasen({ nimi: "Aino", koko: "5XL" }, "Musta").ok).toBe(true);
    expect(tarkistaJasen({ nimi: "Aino", koko: "5XL" }, "Valkoinen").ok).toBe(false);
    expect(kootVarille("Musta")).toEqual(RYHMA_KOOT);
  });

  it("painokuvat: etu ja selkä painoalueen mitoissa, teksti versaaleilla, väri paidan mukaan", () => {
    const d = tarkistaDesign({ nimi: "Abit", vuosi: "2027", teksti: "Penkkarit" });
    const etu = etuSvg(d, "Musta");
    expect(etu).toMatch(/^<svg [^>]*width="3461" height="3955"/);
    expect(etu).toContain(">ABIT<");
    expect(etu).toContain(">2027<");
    expect(etu).toContain('fill="#ffffff"');
    const selka = selkaSvg(tarkistaJasen({ nimi: "Aino", numero: "7", koko: "M" }, "Valkoinen"), "Valkoinen");
    expect(selka).toContain(">AINO<");
    expect(selka).toContain(">7<");
    expect(selka).toContain('fill="#111111"');
  });
});

// ── Tilakone muistivarastolla ────────────────────────────────────────────────────────────────────────────────────

type Rivi = Record<string, unknown> & { id: string };
function muistivarasto() {
  const ryhmat = new Map<string, Rivi>();
  const jasenet = new Map<string, Rivi>();
  const tilaukset: Rivi[] = [];
  const laskuri: Record<string, { n: number; kate: number }> = {};
  let seq = 0;
  const id = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`;
  const kopio = <T,>(x: T): T => (x ? JSON.parse(JSON.stringify(x)) : x);
  return {
    ryhmat, jasenetMap: jasenet, tilaukset, laskuri,
    async luoRyhma(r: Rivi) { const uusi = { ...r, id: id(), tila: "avoin", suunnitelma: null, vetaja_session: null, vetaja_maksu: null, order_id: null }; ryhmat.set(uusi.id, uusi); return kopio(uusi); },
    async haeRyhma(i: string) { return kopio(ryhmat.get(i) ?? null); },
    async haeRyhmaTunnuksella(t: string) { return kopio([...ryhmat.values()].find((r) => r.jasen_tunnus === t) ?? null); },
    async haeRyhmaHallinnalla(h: string) { return kopio([...ryhmat.values()].find((r) => r.hallinta_tiiviste === h) ?? null); },
    async paivitaRyhma(i: string, m: Record<string, unknown>, tila: string | null = null) {
      const r = ryhmat.get(i);
      if (!r || (tila && r.tila !== tila)) return null;
      Object.assign(r, kopio(m));
      return kopio(r);
    },
    async jasenet(ryhmaId: string) { return kopio([...jasenet.values()].filter((j) => j.ryhma_id === ryhmaId)); },
    async haeJasen(i: string) { return kopio(jasenet.get(i) ?? null); },
    async haeJasenTunnuksella(ryhmaId: string, h: string) { return kopio([...jasenet.values()].find((j) => j.ryhma_id === ryhmaId && j.oma_tiiviste === h) ?? null); },
    async lisaaJasen(j: Rivi) { const uusi = { ...j, id: id(), tila: "tayttanyt", maksaja: null, maksettu: null, hyvitetty: 0, hyvitys_odottaa: 0, payment_intent: null, stripe_session_id: null }; jasenet.set(uusi.id, uusi); return kopio(uusi); },
    async paivitaJasen(i: string, m: Record<string, unknown>, tila: string | null = null) {
      const j = jasenet.get(i);
      if (!j || (tila && j.tila !== tila)) return null;
      Object.assign(j, kopio(m));
      return kopio(j);
    },
    async lahetaTilaus(ryhmaId: string, t: Rivi) {
      const r = ryhmat.get(ryhmaId);
      if (!r || r.tila !== "lukittu" || r.order_id) return null;
      const o = { ...kopio(t), id: id(), status: "maksettu", printify_status: "ei_lahetetty" };
      tilaukset.push(o);
      Object.assign(r, { tila: "lahetetty", order_id: o.id });
      return o.id;
    },
    async tilauksenTila(orderId: string) { const o = tilaukset.find((x) => x.id === orderId); return o ? { printify_status: o.printify_status, tracking_url: null } : null; },
    async kirjaa(t: string, n = 1, kate = 0) { laskuri[t] = { n: (laskuri[t]?.n ?? 0) + n, kate: (laskuri[t]?.kate ?? 0) + kate }; },
    palautetut: new Set<string>(),
    async onPalautettu(s: string) { return this.palautetut.has(s); },
    async merkitsePalautettu(s: string) { this.palautetut.add(s); },
    async poistaRyhma(i: string) { ryhmat.delete(i); for (const [k, j] of jasenet) if (j.ryhma_id === i) jasenet.delete(k); },
  };
}

function testiPalvelu() {
  const store = muistivarasto();
  const istunnot: { id: string; rivit: { sentit: number; kpl: number }[]; metadata: Record<string, string> }[] = [];
  const palautukset: { pi: string; sentit: number }[] = [];
  const valmiit: string[] = [];
  const ilmoitukset: string[] = [];
  let n = 0;
  const maksut = {
    async luoIstunto(a: { rivit: { sentit: number; kpl: number }[]; metadata: Record<string, string>; paluu: string }) {
      const s = { id: `cs_test_${++n}`, rivit: a.rivit, metadata: a.metadata, paluu: a.paluu };
      istunnot.push(s);
      return { id: s.id, url: `https://checkout.stripe.test/${s.id}` };
    },
    async haeIstunto(sid: string) { return maksettu(sid); },
    async palauta(pi: string, sentit: number) { palautukset.push({ pi, sentit }); return { ok: true }; },
    async vanhennaIstunto() {},
  };
  let tunnusN = 0;
  const palvelu = ryhmaPalvelu({
    store, maksut,
    viimeistele: async (orderId: string) => { valmiit.push(orderId); },
    ilmoita: async (o: string) => { ilmoitukset.push(o); },
    tunnus: () => `tunnus${String(++tunnusN).padStart(20, "x")}`,
  });
  /** Stripen maksettu istunto (sama muoto kuin webhookissa). */
  function maksettu(sid: string) {
    const s = istunnot.find((x) => x.id === sid)!;
    return { id: s.id, payment_status: "paid", amount_total: s.rivit.reduce((x, r) => x + r.sentit * r.kpl, 0), payment_intent: `pi_${s.id}`, metadata: s.metadata };
  }
  return { store, palvelu, istunnot, palautukset, valmiit, ilmoitukset, maksettu };
}

const VETAJA = { nimi: "Vera Vetäjä", email: "vera@example.com", puhelin: "0401234567", osoite: "Koulukatu 1", postinumero: "00100", kaupunki: "Helsinki" };
const luonti = (muuta: Record<string, unknown> = {}) => ({ tyyppi: "abi", design: { nimi: "Abit", vuosi: "2027", teksti: "Penkkarit" }, vari: "Musta", maksutapa: "jasenet", paikat: 5, vetaja: VETAJA, ...muuta });
const NIMET = ["Aino", "Eetu", "Iida", "Onni", "Venla", "Leo", "Ella", "Elias", "Aada", "Oliver", "Helmi", "Väinö"];

describe("ryhmän tilakone", () => {
  it("luonti: satunnaiset linkit, vetäjän linkki eri kuin jäsenten, hallintalinkki vain tiivisteenä", async () => {
    const t = testiPalvelu();
    const r = await t.palvelu.luo(luonti());
    expect(r.hallinta).not.toBe(r.jasenTunnus);
    const rivi = [...t.store.ryhmat.values()][0];
    expect(rivi.hallinta_tiiviste).toBe(tiiviste(r.hallinta));
    expect(JSON.stringify(rivi)).not.toContain(r.hallinta);
    expect(t.store.laskuri.ryhma_luotu.n).toBe(1);
    await expect(t.palvelu.luo(luonti({ paikat: 4 }))).rejects.toThrow(/5-100/);
    await expect(t.palvelu.luo(luonti({ vetaja: { ...VETAJA, postinumero: "123" } }))).rejects.toThrow(/postinumero/);
    await expect(t.palvelu.luo(luonti({ design: { nimi: "Perkele" } }))).rejects.toThrow();
    await expect(t.palvelu.hallinta("vaara-tunnus-123456789012")).rejects.toThrow(/Hallintalinkki/);
    await expect(t.palvelu.hallinta(r.jasenTunnus)).rejects.toThrow(/Hallintalinkki/);
  });

  it("jäsenen näkymä ei paljasta vetäjän tietoja eikä muiden maksuja", async () => {
    const t = testiPalvelu();
    const r = await t.palvelu.luo(luonti());
    const l = await t.palvelu.liity(r.jasenTunnus, { nimi: "Aino", numero: "7", koko: "M" });
    const n = await t.palvelu.hae(r.jasenTunnus, { oma: l.oma });
    const teksti = JSON.stringify(n);
    expect(teksti).not.toMatch(/vera@example\.com|Koulukatu|Vera|hallinta|jasen_tunnus/);
    expect(n.oma).toMatchObject({ nimi: "Aino", numero: "7", koko: "M", tila: "tayttanyt" });
    expect(n.nimet).toEqual(["Aino 7"]);
    const muu = await t.palvelu.hae(r.jasenTunnus, {});
    expect(muu.oma).toBeNull();
    expect(t.store.laskuri.jasen_liittyi.n).toBe(1);
  });

  it("jäsenet maksavat: kun kaikki paikat on maksettu, tilaus lukittuu ja lähtee Printifyyn automaattisesti", async () => {
    const t = testiPalvelu();
    const r = await t.palvelu.luo(luonti({ paikat: 5 }));
    const omat: string[] = [];
    for (const [i, nimi] of NIMET.slice(0, 5).entries()) omat.push((await t.palvelu.liity(r.jasenTunnus, { nimi, koko: i === 4 ? "3XL" : "M" })).oma);
    await expect(t.palvelu.liity(r.jasenTunnus, { nimi: "Kuudes", koko: "M" })).rejects.toThrow(/täynnä/);
    for (const [i, oma] of omat.entries()) {
      const m = await t.palvelu.maksa(r.jasenTunnus, oma, "https://huumorikauppa.fi");
      expect(m.url).toMatch(/^https:/);
      const s = t.istunnot.at(-1)!;
      expect(s.rivit[0].sentit).toBe(i === 4 ? 3990 : 3790);
      expect(s.metadata).toMatchObject({ ryhma_maksu: "jasen" });
      const k = await t.palvelu.kasitteleMaksu(t.maksettu(s.id));
      expect(k.ok).toBe(true);
      // Sama webhook kahdesti: ei muutosta.
      expect((await t.palvelu.kasitteleMaksu(t.maksettu(s.id))).jo).toBe(true);
      if (i < 4) expect(t.store.tilaukset).toHaveLength(0);
    }
    expect(t.store.tilaukset).toHaveLength(1);
    expect(t.valmiit).toEqual([t.store.tilaukset[0].id]);
    const o = t.store.tilaukset[0] as unknown as { items: { unit_price: number; size: string; ryhma: { selka: { nimi: string } } }[]; total: number; customer_email: string; shipping_address: { zip: string } };
    expect(o.items).toHaveLength(5);
    expect(o.items.map((x) => x.unit_price)).toEqual([37.9, 37.9, 37.9, 37.9, 39.9]);
    expect(o.total).toBe(191.5);
    expect(o.customer_email).toBe("vera@example.com");
    expect(o.shipping_address.zip).toBe("00100");
    expect(t.palautukset).toEqual([]);
    expect(t.store.laskuri.ryhma_maksettu.n).toBe(1);
    expect(t.store.laskuri.paitoja.n).toBe(5);
    expect(t.store.laskuri.ryhma_maksettu.kate).toBeGreaterThanOrEqual(5 * RYHMA_MIN_KATE_PER_PAITA);
    const v = await t.palvelu.hallinta(r.hallinta);
    expect(v.ryhma.tila).toBe("lahetetty");
    expect(v.tilaus).toEqual({ printify: "ei_lahetetty", seuranta: null });
  });

  it("vetäjä lukitsee aiemmin: maksamattomat jäävät pois, itse maksaneille palautetaan määräalennuksen erotus", async () => {
    const t = testiPalvelu();
    const r = await t.palvelu.luo(luonti({ paikat: 12 }));
    const omat: string[] = [];
    for (const nimi of NIMET.slice(0, 12)) omat.push((await t.palvelu.liity(r.jasenTunnus, { nimi, koko: "L" })).oma);
    for (const oma of omat.slice(0, 10)) {
      await t.palvelu.maksa(r.jasenTunnus, oma, "https://huumorikauppa.fi");
      await t.palvelu.kasitteleMaksu(t.maksettu(t.istunnot.at(-1)!.id));
    }
    expect(t.store.tilaukset).toHaveLength(0);
    const lukitus = await t.palvelu.lukitse(r.hallinta, "jata-pois", "https://huumorikauppa.fi");
    expect(lukitus.ok).toBe(true);
    expect(t.store.tilaukset).toHaveLength(1);
    expect((t.store.tilaukset[0] as unknown as { items: unknown[]; total: number }).items).toHaveLength(10);
    expect((t.store.tilaukset[0] as unknown as { total: number }).total).toBe(359);
    // 10 paitaa: 35,90 €; jokainen maksoi 37,90 € -> 2,00 € takaisin.
    expect(t.palautukset).toHaveLength(10);
    expect(t.palautukset.every((p) => p.sentit === 200)).toBe(true);
    const jasenet = await t.store.jasenet([...t.store.ryhmat.keys()][0]);
    expect(jasenet.filter((j) => j.tila === "pois")).toHaveLength(2);
    expect(jasenet.filter((j) => j.tila === "maksettu").every((j) => j.hyvitetty === 2)).toBe(true);
    // Lukituksen jälkeen myöhästynyt maksu palautetaan kokonaan.
    await expect(t.palvelu.maksa(r.jasenTunnus, omat[10], "https://huumorikauppa.fi")).rejects.toThrow(/lukittu/);
  });

  it("vetäjä maksaa maksamattomat: Stripe-istunto lopullisilla hinnoilla, lähetys maksun jälkeen", async () => {
    const t = testiPalvelu();
    const r = await t.palvelu.luo(luonti({ paikat: 6 }));
    const omat: string[] = [];
    for (const nimi of NIMET.slice(0, 6)) omat.push((await t.palvelu.liity(r.jasenTunnus, { nimi, koko: "M" })).oma);
    for (const oma of omat.slice(0, 2)) {
      await t.palvelu.maksa(r.jasenTunnus, oma, "https://huumorikauppa.fi");
      await t.palvelu.kasitteleMaksu(t.maksettu(t.istunnot.at(-1)!.id));
    }
    const l = await t.palvelu.lukitse(r.hallinta, "maksa-loput", "https://huumorikauppa.fi");
    expect(l.url).toMatch(/^https:/);
    expect(l.summa).toBe(151.6);
    const s = t.istunnot.at(-1)!;
    expect(s.metadata).toEqual({ ryhma_id: expect.any(String), ryhma_maksu: "vetaja" });
    expect(t.store.tilaukset).toHaveLength(0);
    // Jäsen ei voi enää maksaa lukittuun ryhmään.
    await expect(t.palvelu.maksa(r.jasenTunnus, omat[3], "https://huumorikauppa.fi")).rejects.toThrow(/lukittu/);
    await t.palvelu.kasitteleMaksu(t.maksettu(s.id));
    expect(t.store.tilaukset).toHaveLength(1);
    expect((t.store.tilaukset[0] as unknown as { total: number }).total).toBe(227.4);
    expect(t.palautukset).toEqual([]);
    expect((await t.store.jasenet([...t.store.ryhmat.keys()][0])).filter((j) => j.maksaja === "vetaja")).toHaveLength(4);
  });

  it("vetäjä maksaa kaikki: jäsenet eivät maksa, lukitus avaa Stripen kassan; vanhaan lukitukseen tullut maksu palautetaan", async () => {
    const t = testiPalvelu();
    const r = await t.palvelu.luo(luonti({ maksutapa: "vetaja", paikat: 25 }));
    const omat: string[] = [];
    for (const nimi of NIMET.slice(0, 4)) omat.push((await t.palvelu.liity(r.jasenTunnus, { nimi, koko: "S" })).oma);
    await expect(t.palvelu.maksa(r.jasenTunnus, omat[0], "https://huumorikauppa.fi")).rejects.toThrow(/vetäjä maksaa/);
    await expect(t.palvelu.lukitse(r.hallinta, null, "https://huumorikauppa.fi")).rejects.toThrow(/vähintään 5/);
    omat.push((await t.palvelu.liity(r.jasenTunnus, { nimi: "Viides", koko: "S" })).oma);
    const eka = await t.palvelu.lukitse(r.hallinta, null, "https://huumorikauppa.fi");
    expect(eka.summa).toBe(189.5);
    const vanha = t.istunnot.at(-1)!.id;
    await t.palvelu.avaa(r.hallinta);
    await t.palvelu.liity(r.jasenTunnus, { nimi: "Kuudes", koko: "S" });
    const toka = await t.palvelu.lukitse(r.hallinta, null, "https://huumorikauppa.fi");
    expect(toka.summa).toBe(227.4);
    const vanhaTulos = await t.palvelu.kasitteleMaksu(t.maksettu(vanha));
    expect(vanhaTulos.palautettu).toBe(true);
    expect(t.palautukset).toEqual([{ pi: `pi_${vanha}`, sentit: 18950 }]);
    // Tunnin paikkaus käsittelee saman istunnon uudelleen: ei toista palautusta.
    expect((await t.palvelu.kasitteleMaksu(t.maksettu(vanha))).jo).toBe(true);
    expect(t.palautukset).toHaveLength(1);
    expect(t.store.tilaukset).toHaveLength(0);
    // Paluusivu käsittelee maksun, jos webhook ei ole ehtinyt.
    await t.palvelu.hallinta(r.hallinta, { maksu: t.istunnot.at(-1)!.id });
    expect(t.store.tilaukset).toHaveLength(1);
    expect(t.valmiit).toHaveLength(1);
  });

  it("peruutus ja rivin poisto palauttavat itse maksetut; muokkaus ennen lukitusta", async () => {
    const t = testiPalvelu();
    const r = await t.palvelu.luo(luonti({ paikat: 8 }));
    const a = await t.palvelu.liity(r.jasenTunnus, { nimi: "Aino", koko: "M" });
    const b = await t.palvelu.liity(r.jasenTunnus, { nimi: "Eetu", koko: "L" });
    await t.palvelu.muokkaa(r.jasenTunnus, a.oma, { nimi: "Aino K", numero: "9", koko: "S" });
    for (const oma of [a.oma, b.oma]) {
      await t.palvelu.maksa(r.jasenTunnus, oma, "https://huumorikauppa.fi");
      await t.palvelu.kasitteleMaksu(t.maksettu(t.istunnot.at(-1)!.id));
    }
    await expect(t.palvelu.muokkaa(r.jasenTunnus, a.oma, { koko: "XL" })).rejects.toThrow(/ennen maksua/);
    await t.palvelu.muokkaa(r.jasenTunnus, a.oma, { nimi: "Aino" });
    const ryhmaId = [...t.store.ryhmat.keys()][0];
    const eetu = (await t.store.jasenet(ryhmaId)).find((j) => j.nimi === "Eetu")!;
    await t.palvelu.poistaJasen(r.hallinta, eetu.id);
    expect(t.palautukset).toEqual([{ pi: expect.stringMatching(/^pi_/), sentit: 3790 }]);
    await t.palvelu.peru(r.hallinta);
    expect(t.palautukset).toHaveLength(2);
    expect((await t.store.haeRyhma(ryhmaId))!.tila).toBe("peruttu");
    await expect(t.palvelu.liity(r.jasenTunnus, { nimi: "Myöhäinen", koko: "M" })).rejects.toThrow(/peruttu/);
  });

  it("kaikkiMaksaneet vaatii jokaisen paikan ja rivin maksetuksi", () => {
    const ryhma = { tila: "avoin", maksutapa: "jasenet", paikat: 2 };
    expect(kaikkiMaksaneet(ryhma, [{ tila: "maksettu" }, { tila: "tayttanyt" }])).toBe(false);
    expect(kaikkiMaksaneet(ryhma, [{ tila: "maksettu" }])).toBe(false);
    expect(kaikkiMaksaneet(ryhma, [{ tila: "maksettu" }, { tila: "maksettu" }, { tila: "poistettu" }])).toBe(true);
    expect(kaikkiMaksaneet({ ...ryhma, maksutapa: "vetaja" }, [{ tila: "maksettu" }, { tila: "maksettu" }])).toBe(false);
  });
});

// ── Printify ─────────────────────────────────────────────────────────────────────────────────────────────────────

describe("ryhmätilaus Printifyyn", () => {
  it("jokainen paita omana rivinään: bp 145 / pp 30, front ja back allekirjoitettuina painokuvina", () => {
    const ryhma = { id: "r1", tila: "avoin", maksutapa: "vetaja", paikat: 5, vari: "Tummansininen", design: { nimi: "FC Kulmapotku", vuosi: "2026", teksti: null, logo: null } };
    const jasenet = NIMET.slice(0, 5).map((nimi, i) => ({ id: `j${i}`, tila: "tayttanyt", koko: i === 0 ? "3XL" : "L", nimi, numero: i === 0 ? "10" : null }));
    const s = lukitusSuunnitelma(ryhma, jasenet, "vetaja");
    const rivit = tilausRivit(ryhma, jasenet, s);
    expect(rivit[0]).toMatchObject({ unit_price: 39.9, variant_id: variantti("Tummansininen", "3XL"), printify_product_id: "RYHMAPAITA", quantity: 1, custom_text: "Selkä: Aino 10" });
    const runko = tilausRunko({ id: "abcdef12-0000", customer_email: "a@b.fi", shipping_address: { address: "Katu 1", zip: "00100", city: "Helsinki" }, items: rivit });
    expect(runko.line_items).toHaveLength(5);
    for (const l of runko.line_items) {
      expect(l).toMatchObject({ blueprint_id: 145, print_provider_id: 30, quantity: 1 });
      expect(Object.keys(l.print_areas)).toEqual(["front", "back"]);
    }
    const etu = new URL(runko.line_items[0].print_areas.front).searchParams.get("t")!;
    const selka = new URL(runko.line_items[0].print_areas.back).searchParams.get("t")!;
    expect(JSON.parse(tarkistaTunniste(etu, "ryhmaetu")!)).toEqual({ d: { nimi: "FC Kulmapotku", vuosi: "2026", teksti: null, logo: null }, v: "Tummansininen" });
    expect(JSON.parse(tarkistaTunniste(selka, "ryhmaselka")!)).toEqual({ s: { nimi: "Aino", numero: "10" }, v: "Tummansininen" });
    expect(tarkistaTunniste(etu, "ryhmaselka")).toBeNull();
  });

  it("virheellinen selkänimi tilausrivillä kaataa rungon (ei painoon)", () => {
    const rivi = { printify_product_id: "RYHMAPAITA", variant_id: 38178, quantity: 1, color: "Musta", size: "M", ryhma: { etu: { nimi: "Abit" }, selka: { nimi: "Vittu" } } };
    expect(() => tilausRunko({ id: "abcdef12-0000", customer_email: "a@b.fi", shipping_address: {}, items: [rivi] })).toThrow(/selkänimi/);
  });
});
