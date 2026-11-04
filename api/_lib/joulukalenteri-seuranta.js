/**
 * Joulukalenterin mittaus ja tuotevalinnan suosio (4.11.2026). Vain palvelimella.
 *
 * Mittaus: koostemäärä päivä x tapahtuma (kuten api/_lib/lisamyynti.js), ei evästeitä eikä tunnisteita. Selain
 * (src/lib/joulukalenteri.ts) lähettää tapahtuman vasta, kun käynti on luokiteltu (src/lib/aitous.ts
 * lahetaKunLuokiteltu), ja api/sahkoposti.js ohittaa botit ja oman liikenteen (ohitaTaiBotti).
 *   kaynti  /joulukalenteri avattiin
 *   luukku  päivän luukku avattiin
 *   kori    luukun tuote lisättiin koriin luukusta
 * Ostot: maksetut tilaukset, joiden rivillä on luukun merkintä (api/_lib/kassa.js joulukalenteri = luukun päivä).
 *
 * Suosio (?tehtava=suosituimmat-tuotteet): maksetut tilausrivit 90 päivältä (paino OSTO_PAINO kappaleelta) ja aidot
 * tuotesivun katselut (api/_lib/tuoteseuranta.js tuotesivu_katselut; ennen sitä laskeutumiset /tuote/<slug>,
 * api/_lib/laskeutumiset.js). Vain slugit ja lukumäärät.
 */
import { varmistaLaskeutumiset } from "./laskeutumiset.js";
import { varmistaTuotekatselut } from "./tuoteseuranta.js";
import { avoinLuukku, julkisetLuukut, kalenterinTila, helsinginPaiva, kelpaaLuukkuun, luukunKappalehinta, luukunToimitus, alinHinta30pv,
  JOULUKALENTERI_ALKU, JOULUKALENTERI_LOPPU } from "./joulukalenteri.js";
import { myynnissa } from "./tuotteet.js";
import { myytavatVariantit } from "./kate.js";
import { karsiVariantit } from "./saatavuus.js";
import { katePerKpl, MIN_KATE_PER_KPL } from "./katesaanto.js";

export const JOULUKALENTERI_TAPAHTUMAT = ["kaynti", "luukku", "kori"];
/** Ostetun kappaleen paino suhteessa yhteen aitoon katseluun. */
export const OSTO_PAINO = 25;
export const SUOSIO_PAIVIA = 90;
const TESTI = "kassatesti@huumorikauppa.fi";
const hki = (d = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(d);

export async function varmistaJoulukalenteriSeuranta(db) {
  await db`create table if not exists joulukalenteri_seuranta (paiva date not null, tapahtuma text not null, n integer not null default 0,
    primary key (paiva, tapahtuma))`;
}

export async function kirjaaJoulukalenteri(db, tapahtuma) {
  if (!JOULUKALENTERI_TAPAHTUMAT.includes(tapahtuma)) return false;
  await varmistaJoulukalenteriSeuranta(db);
  await db`insert into joulukalenteri_seuranta (paiva, tapahtuma, n) values (${hki()}::date, ${tapahtuma}, 1)
    on conflict (paiva, tapahtuma) do update set n = joulukalenteri_seuranta.n + 1`;
  return true;
}

/** Päivän luvut: { paiva, kaynti, luukku, kori, tilauksia, kpl }. */
export async function joulukalenteriPaivalta(db, paiva) {
  await varmistaJoulukalenteriSeuranta(db);
  const rivit = await db`select tapahtuma, n from joulukalenteri_seuranta where paiva = ${paiva}::date`;
  const [o] = await db`select count(distinct o.id)::int as tilauksia, coalesce(sum((i->>'quantity')::int), 0)::int as kpl
    from orders o, jsonb_array_elements(o.items) i
    where o.status = 'maksettu' and o.paid_at is not null and o.customer_email <> ${TESTI}
      and (o.paid_at at time zone 'Europe/Helsinki')::date = ${paiva}::date and i->>'joulukalenteri' is not null`;
  return koostaJoulukalenteri(paiva, rivit, o);
}

export function koostaJoulukalenteri(paiva, rivit, ostot = {}) {
  const n = Object.fromEntries(JOULUKALENTERI_TAPAHTUMAT.map((t) => [t, 0]));
  for (const r of rivit || []) if (r.tapahtuma in n) n[r.tapahtuma] += Number(r.n) || 0;
  return { paiva, ...n, tilauksia: Number(ostot?.tilauksia) || 0, kpl: Number(ostot?.kpl) || 0 };
}

/** Päivän yhteenvedon rivi (api/cron/tilaukset.js lisarivit, joulukuussa). */
export function joulukalenteriRivit(s) {
  if (!s) return [];
  const [, m, d] = s.paiva.split("-").map(Number);
  return [`Joulukalenteri ${d}.${m}.: ${s.kaynti} aitoa käyntiä, ${s.luukku} luukun avausta, luukun tuote koriin ${s.kori} kertaa, ${s.tilauksia} tilausta luukun hinnalla (${s.kpl} kpl).`];
}

/**
 * Suosio slugeittain: ostot [{ slug, kpl }], katselut [{ slug, n }], laskeutumiset [{ slug, n }]. Katselut = suurempi
 * tuotesivun katseluista ja laskeutumisista (laskeutumiset ovat osa katseluita, ei lasketa kahdesti).
 * Palauttaa [{ slug, ostot, katselut, pisteet }] pisteiden mukaan.
 */
export function koostaSuosio(ostot = [], katselut = [], laskeutumiset = [], paino = OSTO_PAINO) {
  const m = new Map();
  const rivi = (slug) => {
    if (!m.has(slug)) m.set(slug, { slug, ostot: 0, katselut: 0, laskeutumiset: 0 });
    return m.get(slug);
  };
  for (const o of ostot) if (o?.slug) rivi(o.slug).ostot += Number(o.kpl) || 0;
  for (const k of katselut) if (k?.slug) rivi(k.slug).katselut += Number(k.n) || 0;
  for (const l of laskeutumiset) if (l?.slug) rivi(l.slug).laskeutumiset += Number(l.n) || 0;
  return [...m.values()]
    .map((r) => {
      const katselu = Math.max(r.katselut, r.laskeutumiset);
      return { slug: r.slug, ostot: r.ostot, katselut: katselu, pisteet: r.ostot * paino + katselu };
    })
    .sort((a, b) => b.pisteet - a.pisteet || b.ostot - a.ostot || a.slug.localeCompare(b.slug));
}

export async function suosituimmatTuotteet(db, { paivia = SUOSIO_PAIVIA, raja = 300 } = {}) {
  await varmistaTuotekatselut(db);
  await varmistaLaskeutumiset(db);
  const ostot = await db`select i->>'slug' as slug, sum(coalesce((i->>'quantity')::int, 1))::int as kpl
    from orders o, jsonb_array_elements(o.items) i
    where o.status = 'maksettu' and o.paid_at > now() - make_interval(days => ${paivia}) and o.customer_email <> ${TESTI}
      and coalesce(i->>'type', '') <> 'giftcard' and i->>'slug' is not null
    group by 1`;
  const katselut = await db`select slug, sum(katselut)::int as n from tuotesivu_katselut
    where paiva > (now() at time zone 'Europe/Helsinki')::date - ${paivia}::int group by 1`;
  const laskeutumiset = await db`select substring(polku from 8) as slug, sum(n)::int as n from laskeutumiset
    where polku like '/tuote/%' and paiva > (now() at time zone 'Europe/Helsinki')::date - ${paivia}::int group by 1`;
  return { paivia, osto_paino: OSTO_PAINO, tuotteet: koostaSuosio(ostot, katselut, laskeutumiset).slice(0, raja) };
}

// ---------- Rajapinta /api/products?joulukalenteri=1 ----------

/**
 * Kalenterin julkinen tila hetkellä nyt (api/products.js). Tulevista luukuista vain numero, päivä ja tila; menneistä
 * samoin ("mennyt", ei tarjousta); tämän päivän luukusta tuote, luukun hinta, myytävien kokojen hinnat ja 30 päivän alin
 * hinta. Tuote, joka ei ole enää myynnissä, ei avaa luukkua (avoin null). Ennen 1.12. ja 24.12. jälkeen ei koskaan tuotetta.
 * luukut: api/_lib/joulukalenteri-data.js, tuotteet: kaikki tuoterivit, historia(slug) -> hinnat 30 päivältä.
 */
export async function kalenterinJulkinenTila({ luukut, tuotteet, nyt = new Date(), historia = async () => [] }) {
  const pohja = { tanaan: helsinginPaiva(nyt), tila: kalenterinTila(nyt), alku: JOULUKALENTERI_ALKU, loppu: JOULUKALENTERI_LOPPU, luukut: julkisetLuukut(nyt), avoin: null };
  const l = avoinLuukku(luukut, nyt);
  const p = l ? tuotteet.find((t) => t.slug === l.slug) : null;
  if (!l || !p || !myynnissa(p)) return pohja;
  // Koot, joilla jokainen myytävä variantti täyttää 7 €:n rajan luukun hinnalla (tuoreet kulut); muut koot pois.
  const koot = {};
  const hylatyt = new Set();
  for (const [avain, id] of myytavatVariantit(p)) {
    const [vari, koko] = avain.split("|");
    if (!kelpaaLuukkuun({ slug: p.slug, size: koko, color: vari }, l)) continue;
    const hinta = luukunKappalehinta(p, koko, l);
    const t = hinta === null ? null : luukunToimitus({ osat: [{ tuote: p, varianttiId: id, maara: l.kpl, yksikkohinta: hinta }], summa: hinta * l.kpl, toimitusKpl: l.kpl, kpl: l.kpl, min: -Infinity });
    if (!t || katePerKpl(t.nettokate, l.kpl) < MIN_KATE_PER_KPL) { hylatyt.add(koko); continue; }
    koot[koko] = hinta;
  }
  for (const k of hylatyt) delete koot[k];
  if (!Object.keys(koot).length) return pohja;
  const alin = alinHinta30pv(p.price, await historia(p.slug).catch(() => []));
  return {
    ...pohja,
    avoin: { paiva: l.paiva, pvm: l.pvm, hinta: l.hinta, kpl: l.kpl, normaali: Number(p.price), alin30: alin, koot, varit: l.varit ?? null, product: karsiVariantit(p) },
  };
}

/**
 * Uutiskirjeen aamuviestin luukku (api/_lib/uutiskirje.js joulukalenteriViesti): vain tämän päivän luukku, ja vain kun
 * se on avattavissa sivulla (kalenterinJulkinenTila). Palauttaa { id, paiva, pvm, slug, nimi, hinta, kpl, normaali, alin30,
 * kuva } tai null.
 */
export async function luukkuViestiin({ luukut, tuotteet, db = null, nyt = new Date() }) {
  const tanaan = helsinginPaiva(nyt);
  const t = await kalenterinJulkinenTila({ luukut, tuotteet, nyt, historia: async (slug) => (db ? hintahistoria30(db, slug, tanaan) : []) });
  const a = t.avoin;
  if (!a) return null;
  return {
    id: `joulukalenteri-${a.pvm}`, paiva: a.paiva, pvm: a.pvm, slug: a.product.slug, nimi: a.product.name, hinta: a.hinta, kpl: a.kpl,
    normaali: a.normaali, alin30: a.alin30, kuva: Array.isArray(a.product.images) ? a.product.images[0] ?? null : null,
  };
}

/** Hintahistoria (api/cron/tilaukset.js hintatarkistus) 30 päivältä ennen annettua päivää. */
export async function hintahistoria30(db, slug, paiva) {
  const rivit = await db`select price::float as hinta from hintahistoria where slug = ${slug}
    and paiva >= ${paiva}::date - 30 and paiva < ${paiva}::date`;
  return rivit.map((r) => r.hinta);
}
