/**
 * Tavoitemittari (1.11.2026): kuukauden kate suhteessa tavoitteeseen (KK_TAVOITE, 3000 €), ennuste, tilaukset,
 * keskiostos, käynnit ja konversio (oma laskuri api/_lib/kaynnit.js), liikenteen lähteet, yritysten tarjouspyynnöt
 * ja kumppanien myynti sekä tarve: montako tilausta ja käyntiä päivässä tavoite vaatii nykyisellä katteella ja
 * konversiolla. Näkyy sivulla /hallinta/mittarit (api/sahkoposti.js ?mittarit=) ja päivän yhteenvetoviestissä.
 *
 * Kate: Printifyn todellinen kulu, kun se tiedetään, muuten arvio tuotteen kulusta (api/_lib/valvonta.js toteutuneet),
 * josta vähennetään kumppaniprovisiot. Testitilaukset (kassatesti@huumorikauppa.fi) eivät ole mukana.
 */
import { aitousRivit } from "./botit.js";
import { lisamyyntiValilla, lisamyyntiRivi } from "./lisamyynti.js";
import { pikkujouluValilla, pikkujouluRivi } from "./pikkujoulu-seuranta.js";
import { KK_TAVOITE, helsinki, paivanAlku, toteutuneet, toteutunutKate, tilauksenKate } from "./valvonta.js";
import { provisioJaTila, provisioAsetukset } from "./kumppani.js";
import { kaynnitValilla } from "./kaynnit.js";
import { uutiskirjeLuvut } from "./uutiskirje.js";
import { yritysluvutValilla, summaaYritysluvut } from "./yritysluvut.js";
import { mainoskulutValilla, mainontaYhteenveto } from "./mainoskulut.js";
import { suppiloValilla } from "./suppilo.js";
import { LANDING_PATHS } from "../sitemap.js";

/** Liikenteen erittely (2.11.2026): blogi, yritysten alasivut, hakukoneet, lahjasivut (laskeutumissivujen osiot), media (utm_source=media), kumppanisivut (/k/). */
const HAKUKONEET = new Set(["google", "bing", "duckduckgo", "yahoo", "ecosia"]);
// 2.11.2026: ammatti- ja harrastussivut /paidat/<slug> lasketaan omana osionaan (ammattisivut), ei lahjasivuina.
export const AMMATTISIVU_OSIO = "paidat";
const LAHJAOSIOT = new Set([...LANDING_PATHS.map((p) => p.split("/")[1]), "lahjat"].filter((o) => o && o !== AMMATTISIVU_OSIO));
export function liikenne(k) {
  const lahde = (f) => k.lahteet.filter((l) => f(l.nimi)).reduce((s, l) => s + l.kaynnit, 0);
  const osio = (f) => k.osiot.filter((o) => f(o.nimi)).reduce((s, o) => s + o.kaynnit, 0);
  return { orgaaninen: lahde((n) => HAKUKONEET.has(n)), lahjasivut: osio((n) => LAHJAOSIOT.has(n)), media: lahde((n) => n === "media"),
    kumppanisivut: osio((n) => n === "k"), kumppanilinkit: lahde((n) => n === "kumppani"),
    // 2.11.2026: blogin ja yritysten alakohtaisten sivujen (/yritykset/<ala>) saapumiskäynnit.
    blogi: osio((n) => n === "blogi"), yritysAlat: osio((n) => n.startsWith("yritykset-")),
    ammattisivut: osio((n) => n === AMMATTISIVU_OSIO) };
}

const r2 = (x) => Math.round(x * 100) / 100;
const r1 = (x) => Math.round(x * 10) / 10;
const TESTI = "kassatesti@huumorikauppa.fi";

/**
 * Konversion varalukema, kunnes oma laskuri on kerännyt riittävästi dataa (vähintään 7 päivää ja 200 käyntiä):
 * GA4, 28 päivää ennen 29.10.2026: 1 036 kävijää, 6 tilausta (KASVU-RAPORTTI.md).
 */
export const KONVERSIO_VARA = { prosentti: 0.58, lahde: "GA4, 28 pv ennen 29.10.2026 (1 036 kävijää, 6 tilausta)" };
export const LASKURI_RIITTAA = { paivia: 7, kaynteja: 200 };
/**
 * Kate per tilaus laskelmaan, kun 30 päivän toteutuneita tilauksia on alle 5 (uusi kassa 27.10.2026 alkaen, vanhan
 * kassan tilaukset eivät ole Neonissa): hinnoittelun laskettu keskikate 29.10.2026 (KATTEET.md, KASVU-RAPORTTI.md).
 */
export const KATE_PER_TILAUS_VARA = { kate: 9.51, lahde: "hinnoittelun laskettu keskikate 29.10.2026 (KATTEET.md)" };
export const TILAUKSIA_RIITTAA = 5;

const lisaaPaiva = (paiva, n) => {
  const [y, m, d] = paiva.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

/** Tilauslistan summat: tilaukset, myynti (sis. alv), kate ennen provisioita, provisiot, kate. */
export function tilausSummat(lista, provisiot = new Map(), tuotteetSlugilla = new Map()) {
  const t = toteutuneet(lista, tuotteetSlugilla);
  const myynti = lista.reduce((s, x) => s + (Number(x.total) || 0), 0);
  const prov = lista.reduce((s, x) => s + (provisiot.get(x.id)?.provisio || 0), 0);
  return { tilauksia: lista.length, myynti: r2(myynti), keskiostos: lista.length ? r2(myynti / lista.length) : 0,
    kateEnnenProvisioita: r2(t.yhteensa), provisiot: r2(prov), kate: r2(t.yhteensa - prov), kuluTiedossa: t.n };
}

/**
 * Tavoitelaskelma (puhdas funktio). kate = kuukauden kate tähän mennessä, paivia = kuun päivät, kulunut = kulunut
 * aika päivinä (desimaali), katePerTilaus ja konversio (%) nykyiseltä tasolta, kateTahti30 = 30 päivän kate per päivä.
 */
export function tavoitelaskelma({ kate, tavoite = KK_TAVOITE(), paivia, kulunut, jaljella, katePerTilaus, konversio, kateTahti30 = null }) {
  const omaTahti = kulunut >= 7;
  const tahti = omaTahti ? kate / kulunut : kateTahti30 ?? (kulunut > 0 ? kate / kulunut : 0);
  const ennuste = r2(omaTahti ? (kate / kulunut) * paivia : kate + (tahti || 0) * Math.max(0, paivia - kulunut));
  const matka = r2(Math.max(0, tavoite - kate));
  const perPaiva = tavoite / paivia;
  const tilauksiaPaivassa = katePerTilaus > 0 ? perPaiva / katePerTilaus : null;
  const kaynteja = (tilauksia) => (tilauksia != null && konversio > 0 ? tilauksia / (konversio / 100) : null);
  const jaljellaPaivassa = jaljella > 0 ? matka / jaljella : 0;
  const tilauksiaJaljella = katePerTilaus > 0 ? jaljellaPaivassa / katePerTilaus : null;
  return {
    tavoite, kate: r2(kate), prosentti: tavoite ? r1((kate / tavoite) * 100) : 0, matka, ennuste,
    ennusteTapa: omaTahti ? "kuukauden oma tahti" : "tähän asti kertynyt + 30 päivän tahti loppukuulle",
    tarve: {
      katePaivassa: r2(perPaiva),
      tilauksiaPaivassa: tilauksiaPaivassa == null ? null : r1(tilauksiaPaivassa),
      kaynteja_paivassa: kaynteja(tilauksiaPaivassa) == null ? null : Math.round(kaynteja(tilauksiaPaivassa)),
      jaljellaKatePaivassa: r2(jaljellaPaivassa),
      jaljellaTilauksiaPaivassa: tilauksiaJaljella == null ? null : r1(tilauksiaJaljella),
      jaljellaKaynteja_paivassa: kaynteja(tilauksiaJaljella) == null ? null : Math.round(kaynteja(tilauksiaJaljella)),
    },
  };
}

/** Kumppanitilausten provisiot: Map(tilausId -> { koodi, provisio }). */
async function provisiot(db, lista, tuotteetSlugilla) {
  const idt = lista.map((t) => t.id);
  if (!idt.length) return new Map();
  const tap = await db`select order_id, details from order_events where kind = 'kumppani' and order_id = any(${idt})`;
  const m = new Map();
  for (const e of tap) {
    const t = lista.find((x) => x.id === e.order_id);
    if (!t) continue;
    const kate = toteutunutKate(t)?.kate ?? tilauksenKate(t, tuotteetSlugilla).kate;
    const p = provisioJaTila((Number(t.total) || 0) - (Number(t.shipping) || 0), kate, provisioAsetukset(e.details));
    m.set(t.id, { koodi: e.details?.koodi || "?", provisio: p.provisio, myynti: Number(t.total) || 0 });
  }
  return m;
}

/**
 * Kokoaa mittarit. store = pgValvonta(db, kaikkiTuotteet, { haeTilaus }) (api/_lib/valvonta.js), db = postgres-tagi.
 * kuiva: ei tallenneta täydennettyjä Printify-kuluja.
 */
export async function keraaMittarit(db, store, { nyt = new Date(), kuiva = false } = {}) {
  const h = helsinki(nyt);
  const kuunAlkuPv = `${h.paiva.slice(0, 8)}01`;
  const kuunAlku = paivanAlku(kuunAlkuPv);
  const paivia = new Date(Date.UTC(h.vuosi, h.kuukausi, 0)).getUTCDate();
  const kulunut = r2((nyt.getTime() - kuunAlku.getTime()) / 864e5);
  const jaljella = r2(paivia - kulunut);
  const alku30Pv = lisaaPaiva(h.paiva, -30);
  const tuotteetSlugilla = await store.tuotteetSlugilla();
  const ilmanTesteja = (l) => l.filter((t) => String(t.customer_email || "").toLowerCase() !== TESTI);

  const kk = ilmanTesteja(await store.maksetutValilla(kuunAlku, nyt));
  const p30 = ilmanTesteja(await store.maksetutValilla(paivanAlku(alku30Pv), nyt));
  if (store.taydennaKulut) await store.taydennaKulut(p30, 15, { kuiva });
  const prov = await provisiot(db, p30, tuotteetSlugilla);
  const kkSumma = tilausSummat(kk, prov, tuotteetSlugilla);
  const s30 = tilausSummat(p30, prov, tuotteetSlugilla);

  // Edellinen kuukausi vertailuksi.
  const edAlkuPv = `${lisaaPaiva(kuunAlkuPv, -1).slice(0, 8)}01`;
  const ed = ilmanTesteja(await store.maksetutValilla(paivanAlku(edAlkuPv), kuunAlku));
  const edSumma = tilausSummat(ed, await provisiot(db, ed, tuotteetSlugilla), tuotteetSlugilla);

  // Käynnit: tämä kuu, 30 päivää ja laskurin koko historia konversiota varten.
  const kayKk = await kaynnitValilla(db, kuunAlkuPv, h.paiva);
  const kay30 = await kaynnitValilla(db, alku30Pv, h.paiva);
  let konversio = { prosentti: KONVERSIO_VARA.prosentti, lahde: KONVERSIO_VARA.lahde, oma: null };
  if (kay30.ensimmainen) {
    const laskurinAjalta = p30.filter((t) => helsinki(t.paid_at).paiva >= kay30.ensimmainen);
    const oma = kay30.yhteensa ? r2((laskurinAjalta.length / kay30.yhteensa) * 100) : null;
    konversio.oma = { prosentti: oma, kaynteja: kay30.yhteensa, tilauksia: laskurinAjalta.length, paivia: kay30.paivia, alkaen: kay30.ensimmainen };
    if (kay30.paivia >= LASKURI_RIITTAA.paivia && kay30.yhteensa >= LASKURI_RIITTAA.kaynteja && oma > 0) {
      konversio = { ...konversio, prosentti: oma, lahde: `oma laskuri, ${kay30.paivia} pv (${kay30.yhteensa} käyntiä, ${laskurinAjalta.length} tilausta)` };
    }
  }

  // Yritysten tarjouspyynnöt (tila 'testi' pois, 2.11.2026).
  let tarjoukset = { kk: 0, p30: 0, tilat: {}, lahteet: {}, arvoKk: 0, kateKk: 0 };
  try {
    // Lähde (4.11.2026): yritykset, yritykset-ala, pikkujoulut-yritykset; ennen saraketta tallennetut "yritykset".
    let t;
    try { t = await db`select tila, hinta, kate, created_at, coalesce(lahde, 'yritykset') as lahde from tarjouspyynnot where created_at >= ${paivanAlku(alku30Pv)} and tila <> 'testi'`; }
    catch { t = (await db`select tila, hinta, kate, created_at from tarjouspyynnot where created_at >= ${paivanAlku(alku30Pv)} and tila <> 'testi'`).map((x) => ({ ...x, lahde: "yritykset" })); }
    const kkT = t.filter((x) => new Date(x.created_at) >= kuunAlku);
    tarjoukset = {
      kk: kkT.length, p30: t.length,
      tilat: Object.fromEntries([...new Set(t.map((x) => x.tila))].map((tila) => [tila, t.filter((x) => x.tila === tila).length])),
      lahteet: Object.fromEntries([...new Set(t.map((x) => x.lahde))].map((l) => [l, t.filter((x) => x.lahde === l).length])),
      arvoKk: r2(kkT.reduce((s, x) => s + (Number(x.hinta) || 0), 0)), kateKk: r2(kkT.reduce((s, x) => s + (Number(x.kate) || 0), 0)),
    };
  } catch { /* taulua ei vielä ole */ }

  // Yritysmyynnin päiväluvut (Coworkin kirjaukset, api/_lib/yritysluvut.js).
  let yritysmyynti = null;
  try {
    const rivit = await yritysluvutValilla(db, alku30Pv, h.paiva);
    yritysmyynti = { kk: summaaYritysluvut(rivit.filter((r) => r.paiva >= kuunAlkuPv)), p30: summaaYritysluvut(rivit), paivat: rivit.slice(0, 14) };
  } catch { /* taulua ei vielä ole */ }

  // Mainoskulut (api/_lib/mainoskulut.js): ennen Google Ads -kokeilua nollaa, jotta tulos näkyy heti.
  let mainosrivit = [];
  try { mainosrivit = await mainoskulutValilla(db, kuunAlkuPv, h.paiva); } catch { /* taulua ei vielä ole */ }
  const mainonta = { ...mainontaYhteenveto(mainosrivit, { tilauksia: kkSumma.tilauksia, kate: kkSumma.kate }), paivat: mainosrivit.slice(0, 14) };

  // Ostosuppilo ja päivittäinen konversio 14 pv (api/_lib/suppilo.js; luotettava 2.11.2026 alkaen, jakso rajataan siihen).
  let suppilo = null;
  try {
    const alku14 = lisaaPaiva(h.paiva, -13);
    const kayPv = await db`select to_char(paiva, 'YYYY-MM-DD') as paiva, sum(kaynnit)::int as n from kaynnit where lahde not in ('testi', 'oma')
      and paiva between ${alku14}::date and ${h.paiva}::date group by 1`;
    suppilo = await suppiloValilla(db, alku14, h.paiva, Object.fromEntries(kayPv.map((r) => [r.paiva, r.n])));
  } catch { /* taulua ei vielä ole */ }

  // Pikkujoulupaketit 30 pv (api/_lib/pikkujoulu-seuranta.js, 4.11.2026): sivukäynnit, paketin valinnat, tarjouspyynnöt.
  let pikkujoulut = null;
  try { pikkujoulut = await pikkujouluValilla(db, alku30Pv, h.paiva); } catch { /* taulua ei vielä ole */ }

  // Korin lisämyynti 14 pv (api/_lib/lisamyynti.js, 2.11.2026).
  let lisamyynti = null;
  try { lisamyynti = await lisamyyntiValilla(db, lisaaPaiva(h.paiva, -13), h.paiva); } catch { /* taulua ei vielä ole */ }

  // Ryhmätilaukset (api/_lib/ryhmatilaus-db.js, 2.11.2026): ryhmät, jäsenet, maksetut ryhmät, paidat ja kate.
  let ryhmatilaukset = null;
  try { ryhmatilaukset = await (await import("./ryhmatilaus-db.js")).ryhmatilausMittari(db); } catch { /* taulua ei vielä ole */ }

  // Kumppanien myynti tässä kuussa.
  const kumppanit = new Map();
  for (const t of kk) {
    const p = prov.get(t.id);
    if (!p) continue;
    const k = kumppanit.get(p.koodi) || { koodi: p.koodi, tilauksia: 0, myynti: 0, provisio: 0 };
    k.tilauksia++; k.myynti = r2(k.myynti + p.myynti); k.provisio = r2(k.provisio + p.provisio);
    kumppanit.set(p.koodi, k);
  }

  // Uutiskirjeen tilaajat (api/_lib/uutiskirje.js, ilman peruneita).
  let uutiskirje = null;
  try { const u = await uutiskirjeLuvut(db); uutiskirje = { yhteensa: u.yhteensa, p7: u.pv7, p28: u.pv28, lahteet: u.lahteet }; } catch { /* taulua ei vielä ole */ }

  // Bottisuodatus 30 pv (api/_lib/botit.js): käynnit ja suppilo ovat vain aitoja, botit erikseen syittäin.
  let aitous = null;
  try { const { aitousValilla } = await import("./botit.js"); aitous = await aitousValilla(db, alku30Pv, h.paiva); } catch { /* taulua ei vielä ole */ }

  const toteutunutPerTilaus = s30.tilauksia ? r2(s30.kate / s30.tilauksia) : null;
  const riittaa = s30.tilauksia >= TILAUKSIA_RIITTAA;
  const katePerTilaus = riittaa ? toteutunutPerTilaus : KATE_PER_TILAUS_VARA.kate;
  const katePerTilausLahde = riittaa ? `toteutunut, ${s30.tilauksia} tilausta 30 pv` : `${KATE_PER_TILAUS_VARA.lahde}; toteutunut ${s30.tilauksia} tilauksesta ${toteutunutPerTilaus == null ? "-" : `${toteutunutPerTilaus.toFixed(2).replace(".", ",")} €`}`;
  const laskelma = tavoitelaskelma({ kate: kkSumma.kate, paivia, kulunut, jaljella, katePerTilaus, konversio: konversio.prosentti,
    kateTahti30: s30.kate / 30 });
  return {
    paiva: h.paiva, kuukausi: `${h.kuukausi}/${h.vuosi}`, paivia, kulunut, jaljella,
    tavoite: laskelma, kk: kkSumma, p30: { ...s30, katePerTilaus, katePerTilausLahde, toteutunutPerTilaus }, edellinen: { kuukausi: edAlkuPv.slice(0, 7), ...edSumma },
    kaynnit: { kk: kayKk, p30: kay30 }, liikenne: { kk: liikenne(kayKk), p30: liikenne(kay30) }, konversio, tarjoukset, yritysmyynti, mainonta, suppilo, lisamyynti, pikkujoulut, ryhmatilaukset, uutiskirje, kumppanit: [...kumppanit.values()],
    aitous,
    // Neonin kuukausikulutus (5.11.2026, ilmaiskiintiö 100 CU-h; api/_lib/puskuri-siirto.js).
    neon: await import("./puskuri-siirto.js").then((x) => x.neonKulutus(db)).catch(() => null),
  };
}

/**
 * Mittarin koosteluvut koneelle (2.11.2026): cron ?tehtava=mittarit (CRON_SECRET) ja scripts/mittarit.mjs. Vain
 * summat ja lukumäärät: ei kumppanikoodeja, sähköposteja eikä päiväkohtaisia rivejä.
 */
export function mittariKooste(m) {
  const t = m.tavoite;
  const lk = m.liikenne?.kk || {};
  return {
    paiva: m.paiva, kuukausi: m.kuukausi,
    tavoite: { tavoite: t.tavoite, kate: t.kate, prosentti: t.prosentti, ennuste: t.ennuste, matka: t.matka,
      tilauksiaPaivassa: t.tarve?.tilauksiaPaivassa ?? null, kayntejaPaivassa: t.tarve?.kaynteja_paivassa ?? null },
    kk: { tilauksia: m.kk.tilauksia, myynti: m.kk.myynti, keskiostos: m.kk.keskiostos, kate: m.kk.kate },
    p30: { tilauksia: m.p30.tilauksia, myynti: m.p30.myynti, kate: m.p30.kate, katePerTilaus: m.p30.katePerTilaus },
    edellinen: { kuukausi: m.edellinen.kuukausi, tilauksia: m.edellinen.tilauksia, kate: m.edellinen.kate },
    kaynnit: { kk: m.kaynnit.kk.yhteensa, p30: m.kaynnit.p30.yhteensa, laskuriAlkaen: m.kaynnit.p30.ensimmainen ?? null },
    konversio: { laskelmassa: m.konversio.prosentti, lahde: m.konversio.lahde, oma: m.konversio.oma?.prosentti ?? null },
    liikenneKk: { hakukoneet: lk.orgaaninen ?? 0, lahjasivut: lk.lahjasivut ?? 0, media: lk.media ?? 0, kumppanisivut: lk.kumppanisivut ?? 0,
      blogi: lk.blogi ?? 0, yritysAlat: lk.yritysAlat ?? 0, ammattisivut: lk.ammattisivut ?? 0 },
    uutiskirje: m.uutiskirje ? { yhteensa: m.uutiskirje.yhteensa, p7: m.uutiskirje.p7, p28: m.uutiskirje.p28 } : null,
    tarjoukset: { kk: m.tarjoukset.kk, p30: m.tarjoukset.p30, arvoKk: m.tarjoukset.arvoKk, lahteet: m.tarjoukset.lahteet ?? {} },
    pikkujoulut: m.pikkujoulut ? { sivu: m.pikkujoulut.sivu, paketti: m.pikkujoulut.paketti, tarjous: m.pikkujoulut.tarjous, tallennetut: m.pikkujoulut.tallennetut } : null,
    suppilo14: m.suppilo ? { ...m.suppilo.yhteensa, alku: m.suppilo.alku, luotettavaAlkaen: m.suppilo.luotettavaAlkaen } : null,
    lisamyynti14: m.lisamyynti ?? null,
    ryhmatilaukset: m.ryhmatilaukset ?? null,
    aitous: m.aitous ?? null,
    neon: m.neon ?? null,
    kumppanit: { tilauksia: m.kumppanit.reduce((s, k) => s + k.tilauksia, 0), myynti: r2(m.kumppanit.reduce((s, k) => s + k.myynti, 0)),
      provisio: r2(m.kumppanit.reduce((s, k) => s + k.provisio, 0)) },
  };
}

const eur = (x) => `${r2(x).toFixed(2).replace(".", ",")} €`;

/** Ryhmätilausten rivi (tässä kuussa). */
export function ryhmatilausRivi(r) {
  const k = r.kk;
  return `Ryhmätilaukset tässä kuussa: ryhmiä luotu ${k.ryhmiaLuotu}, jäseniä ${k.jaseniaLiittynyt}, maksettuja ryhmiä ${k.maksettujaRyhmia} (${k.paitoja} paitaa), kate ${eur(k.kate)}`;
}
const lu = (x) => String(x).replace(".", ",");

/** Mittarit tekstiriveinä päivän yhteenvetoviestiin. */
export function mittaririvit(m, linkki = null, someLinkki = null) {
  const t = m.tavoite;
  const lahteet = m.kaynnit.p30.lahteet.slice(0, 6).map((l) => `${l.nimi} ${l.kaynnit}`).join(", ") || "ei vielä käyntejä";
  return [
    "",
    `TAVOITEMITTARI ${m.kuukausi} (tavoite ${eur(t.tavoite)} katetta)`,
    `Kate tähän mennessä: ${eur(t.kate)} (${lu(t.prosentti)} %), matka tavoitteeseen ${eur(t.matka)}`,
    `Ennuste kuun lopulle: ${eur(t.ennuste)} (${t.ennusteTapa})`,
    `Tilaukset tässä kuussa: ${m.kk.tilauksia}, keskiostos ${eur(m.kk.keskiostos)}; 30 pv: ${m.p30.tilauksia} tilausta`,
    `Kate per tilaus laskelmassa: ${m.p30.katePerTilaus == null ? "-" : eur(m.p30.katePerTilaus)} (${m.p30.katePerTilausLahde || "toteutunut"})`,
    `Käynnit (oma laskuri): tässä kuussa ${m.kaynnit.kk.yhteensa}, 30 pv ${m.kaynnit.p30.yhteensa}${m.kaynnit.p30.ensimmainen ? ` (laskuri alkaen ${m.kaynnit.p30.ensimmainen})` : ""}`,
    `Konversio laskelmassa: ${lu(m.konversio.prosentti)} % (${m.konversio.lahde})${m.konversio.oma?.prosentti != null ? `; oma laskuri nyt ${lu(m.konversio.oma.prosentti)} %` : ""}`,
    `Lähteet 30 pv: ${lahteet}`,
    ...(m.liikenne ? [`Liikenne tässä kuussa: hakukoneet ${m.liikenne.kk.orgaaninen}, lahjasivut ${m.liikenne.kk.lahjasivut}, media ${m.liikenne.kk.media}, kumppanisivut ${m.liikenne.kk.kumppanisivut} (kumppanilinkit ${m.liikenne.kk.kumppanilinkit}), blogi ${m.liikenne.kk.blogi ?? 0}, yritysten alasivut ${m.liikenne.kk.yritysAlat ?? 0}, ammattisivut ${m.liikenne.kk.ammattisivut ?? 0}`] : []),
    ...(m.uutiskirje ? [`Uutiskirjeen tilaajat: ${m.uutiskirje.yhteensa} (7 pv +${m.uutiskirje.p7}, 28 pv +${m.uutiskirje.p28})`] : []),
    `Yritysten tarjouspyynnöt: tässä kuussa ${m.tarjoukset.kk} (arvo ${eur(m.tarjoukset.arvoKk)}), 30 pv ${m.tarjoukset.p30}${Object.keys(m.tarjoukset.lahteet || {}).length ? ` (${Object.entries(m.tarjoukset.lahteet).map(([l, n]) => `${l} ${n}`).join(", ")})` : ""}`,
    m.yritysmyynti
      ? `Yritysmyynti tässä kuussa (Cowork): viestejä lähetetty ${m.yritysmyynti.kk.viestit} / vastauksia ${m.yritysmyynti.kk.vastaukset} / tarjouspyyntöjä ${m.yritysmyynti.kk.tarjouspyynnot} / tilauksia ${m.yritysmyynti.kk.tilaukset}`
      : "Yritysmyynti (Cowork): ei kirjauksia",
    ...(m.mainonta ? [`Mainoskulut tässä kuussa: ${eur(m.mainonta.kulut)}, kustannus per tilaus ${m.mainonta.kustannusPerTilaus == null ? "-" : eur(m.mainonta.kustannusPerTilaus)}, kate mainoskulujen jälkeen ${eur(m.mainonta.kateMainonnanJalkeen)}${m.mainonta.klikit ? ` (${m.mainonta.klikit} klikkiä)` : ""}`] : []),
    ...(m.suppilo ? [`Suppilo ${m.suppilo.alku} alkaen (luotettava ${m.suppilo.luotettavaAlkaen} alkaen): käynnit ${m.suppilo.yhteensa.kaynnit}, tuotesivut ${m.suppilo.yhteensa.tuotesivu}, koriin ${m.suppilo.yhteensa.kori}, kassalle ${m.suppilo.yhteensa.kassa}, maksuun ${m.suppilo.yhteensa.maksu}, ostot ${m.suppilo.yhteensa.ostot} (konversio ${m.suppilo.yhteensa.konversio == null ? "-" : `${lu(m.suppilo.yhteensa.konversio)} %`})`,
      `Etusivun A/B-testi: A ${m.suppilo.ab.a.etusivu} näyttöä, ${m.suppilo.ab.a.kori} koriin, ${m.suppilo.ab.a.ostot} ostoa; B ${m.suppilo.ab.b.etusivu} näyttöä, ${m.suppilo.ab.b.kori} koriin, ${m.suppilo.ab.b.ostot} ostoa`] : []),
    ...(m.lisamyynti ? [lisamyyntiRivi(m.lisamyynti)] : []),
    ...(m.pikkujoulut ? [pikkujouluRivi(m.pikkujoulut)] : []),
    ...(m.aitous ? aitousRivit(m.aitous) : []),
    ...(m.neon ? [`Neonin kulutus tässä kuussa: ${lu(m.neon.cuh)} CU-h, ennuste ${lu(m.neon.ennuste)} / ${m.neon.kiintio} CU-h${m.neon.lahde === "neon" ? "" : " (arvio heräämisistä, alaraja)"}`] : []),
    ...(m.ryhmatilaukset ? [ryhmatilausRivi(m.ryhmatilaukset)] : []),
    `Kumppanien myynti tässä kuussa: ${m.kumppanit.length ? m.kumppanit.map((k) => `${k.koodi} ${k.tilauksia} kpl ${eur(k.myynti)}, provisio ${eur(k.provisio)}`).join("; ") : "ei tilauksia"}`,
    `Tarve 3000 €:oon: ${lu(t.tarve.tilauksiaPaivassa ?? "?")} tilausta ja ${t.tarve.kaynteja_paivassa ?? "?"} käyntiä päivässä (${eur(t.tarve.katePaivassa)} katetta/pv)`,
    `Loppukuulle tämän kuun tavoitteeseen: ${lu(t.tarve.jaljellaTilauksiaPaivassa ?? "?")} tilausta ja ${t.tarve.jaljellaKaynteja_paivassa ?? "?"} käyntiä päivässä`,
    `Edellinen kuukausi ${m.edellinen.kuukausi}: ${m.edellinen.tilauksia} tilausta, kate ${eur(m.edellinen.kate)}`,
    ...(linkki ? [`Mittarisivu: ${linkki}`] : []),
    ...(someLinkki ? [`Somevideot ja Pinterest-kuvat (Cowork): ${someLinkki}`] : []),
  ];
}
