/**
 * Ryhmätilausten palvelu (2.11.2026): tietokanta (Neon, taulut luodaan create table if not exists), Stripe-maksut,
 * lukitus ja lähetys Printifyyn. Säännöt ja hinnat: api/_lib/ryhmatilaus.js.
 *
 * Rajapinta on api/checkout.js:ssä (Vercel Hobby rajaa funktioiden määrän): POST { action: "ryhma-..." }, ks.
 * ryhmaToiminto. Stripen maksut tunnistetaan metadatasta (ryhma_id, ryhma_maksu "jasen" | "vetaja", ryhma_jasen):
 * webhook ja tunnin cron ohjaavat ne api/_lib/tilaus.js kasitteleMaksu -> kasitteleRyhmaMaksu.
 *
 * Kun ryhmä lähtee painoon, siitä tehdään yksi tavallinen tilausrivi (orders, status maksettu), jonka
 * api/_lib/tilaus.js jalkikasittely vie Printifyyn (uudelleenyritykset, tilausvahti, seuranta ja lähetysviesti kuten
 * muillakin tilauksilla). Printify-rivin etu- ja selkäkuva: api/_lib/printify.js ryhmaPainokuvat, api/painokuva.js.
 *
 * Linkit: jäsenlinkki /ryhma/<jasen_tunnus> (sama koko ryhmälle, tallessa sellaisenaan, jotta vetäjä näkee sen),
 * vetäjän hallintalinkki /ryhma/hallinta/<tunnus> ja jäsenen oman rivin tunnus (?oma=). Hallinta- ja omat tunnukset
 * tallennetaan vain SHA-256-tiivisteinä. Kaikki tunnukset ovat 18 satunnaista tavua (base64url).
 *
 * Henkilötiedot: vetäjän nimi, sähköposti, puhelin ja toimitusosoite (toimitus), jäsenistä selkänimi, numero ja koko.
 * Jäsenten sähköpostia ei tallenneta (Stripe lähettää kuitin). Ryhmät poistetaan 180 päivän kuluttua lähetyksestä tai
 * perumisesta ja maksamattomat ryhmät 180 päivän kuluttua luonnista (ajaRyhmaValvonta). Tilausrivi (orders) säilyy
 * kirjanpitoa varten kuten muutkin tilaukset.
 *
 * Mittari: taulu ryhmatilaus_laskuri (päivä, tapahtuma, määrä, kate), ryhmatilausMittari(db).
 */
import { RYHMA_MAKSUTAVAT } from "./maksutavat.js";
import { createHash, randomBytes } from "node:crypto";
import {
  RYHMATYYPIT, RYHMA_MIN_KPL, RYHMA_MAX_KPL, RYHMA_VARIT, RYHMA_HINNASTO, aktiiviset, maksetut, omaMaksu, kaikkiMaksaneet,
  liittymisenEste, maksunEste, lukitusSuunnitelma, tilausRivit, tarkistaDesign, tarkistaJasen, tarkistaVari, perushinta,
  kootVarille, kootYhteensa, hintaportaat, hintaporras,
} from "./ryhmatilaus.js";

export const uusiTunnus = () => randomBytes(18).toString("base64url");
export const tiiviste = (s) => createHash("sha256").update(String(s)).digest("hex");
const TUNNUS_RE = /^[A-Za-z0-9_-]{20,40}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sentit = (e) => Math.round(Number(e) * 100);
const pyorista = (x) => Math.round(x * 100) / 100;
const teksti = (x, max) => (typeof x === "string" && x.trim() ? x.trim().replace(/\s+/g, " ").slice(0, max) : null);
const eur = (x) => `${Number(x).toFixed(2).replace(".", ",")} €`;

export class RyhmaVirhe extends Error {}

// ── Tietokanta ─────────────────────────────────────────────────────────────────────────────────────────────────────

let taulutValmiina = false;
async function varmistaTaulut(db) {
  if (taulutValmiina) return;
  await db`create table if not exists ryhmatilaukset (id uuid primary key default gen_random_uuid(), tyyppi text not null,
    tila text not null default 'avoin', maksutapa text not null, paikat integer not null, design jsonb not null, vari text not null,
    jasen_tunnus text not null unique, hallinta_tiiviste text not null unique, vetaja jsonb not null, takaraja date,
    testi boolean not null default false, suunnitelma jsonb, vetaja_session text, vetaja_maksu jsonb, order_id uuid,
    lukittu_at timestamptz, lahetetty_at timestamptz, created_at timestamptz not null default now(),
    updated_at timestamptz not null default now())`;
  await db`create table if not exists ryhmatilaus_jasenet (id uuid primary key default gen_random_uuid(),
    ryhma_id uuid not null references ryhmatilaukset(id) on delete cascade, oma_tiiviste text not null unique,
    nimi text not null, numero text, koko text not null, tila text not null default 'tayttanyt', maksaja text,
    maksettu numeric(10,2), hyvitetty numeric(10,2) not null default 0, hyvitys_odottaa numeric(10,2) not null default 0,
    payment_intent text, stripe_session_id text, created_at timestamptz not null default now(),
    updated_at timestamptz not null default now())`;
  await db`create index if not exists ryhmatilaus_jasenet_ryhma on ryhmatilaus_jasenet (ryhma_id)`;
  // Kokonaan palautetut maksut (vanhentunut lukitus, poistettu rivi, kaksoismaksu): tunnin paikkaus ei palauta uudelleen.
  await db`create table if not exists ryhmatilaus_palautukset (session text primary key, ryhma_id uuid, summa numeric(10,2),
    created_at timestamptz not null default now())`;
  await db`create table if not exists ryhmatilaus_laskuri (paiva date not null, tapahtuma text not null,
    n integer not null default 0, kate numeric(10,2) not null default 0, primary key (paiva, tapahtuma))`;
  taulutValmiina = true;
}

const RYHMA_SARAKKEET = ["tila", "maksutapa", "paikat", "design", "vari", "takaraja", "suunnitelma", "vetaja_session", "vetaja_maksu", "order_id", "lukittu_at", "lahetetty_at"];
const JASEN_SARAKKEET = ["nimi", "numero", "koko", "tila", "maksaja", "maksettu", "hyvitetty", "hyvitys_odottaa", "payment_intent", "stripe_session_id"];
const JSON_SARAKKEET = new Set(["design", "suunnitelma", "vetaja_maksu", "vetaja"]);
const nro = (r) => (r ? { ...r, maksettu: r.maksettu === null || r.maksettu === undefined ? null : Number(r.maksettu), hyvitetty: Number(r.hyvitetty || 0), hyvitys_odottaa: Number(r.hyvitys_odottaa || 0) } : null);

/** Postgres-varasto (postgres.js). Sama rajapinta kuin testien muistivarasto (src/test/ryhmatilaus.test.ts). */
export function pgRyhmat(db) {
  const arvot = (muutokset, sallitut) => Object.fromEntries(Object.entries(muutokset).filter(([k]) => sallitut.includes(k))
    .map(([k, v]) => [k, JSON_SARAKKEET.has(k) && v !== null ? db.json(v) : v]));
  return {
    varmista: () => varmistaTaulut(db),
    async luoRyhma(r) {
      await varmistaTaulut(db);
      const [rivi] = await db`insert into ryhmatilaukset (tyyppi, maksutapa, paikat, design, vari, jasen_tunnus, hallinta_tiiviste, vetaja, takaraja, testi)
        values (${r.tyyppi}, ${r.maksutapa}, ${r.paikat}, ${db.json(r.design)}, ${r.vari}, ${r.jasen_tunnus}, ${r.hallinta_tiiviste},
          ${db.json(r.vetaja)}, ${r.takaraja}, ${!!r.testi}) returning *`;
      return rivi;
    },
    async haeRyhma(id) { await varmistaTaulut(db); return (await db`select * from ryhmatilaukset where id = ${id}`)[0] || null; },
    async haeRyhmaTunnuksella(t) { await varmistaTaulut(db); return (await db`select * from ryhmatilaukset where jasen_tunnus = ${t}`)[0] || null; },
    async haeRyhmaHallinnalla(h) { await varmistaTaulut(db); return (await db`select * from ryhmatilaukset where hallinta_tiiviste = ${h}`)[0] || null; },
    async paivitaRyhma(id, muutokset, vaadittuTila = null) {
      const a = arvot(muutokset, RYHMA_SARAKKEET);
      const [r] = vaadittuTila
        ? await db`update ryhmatilaukset set ${db(a)}, updated_at = now() where id = ${id} and tila = ${vaadittuTila} returning *`
        : await db`update ryhmatilaukset set ${db(a)}, updated_at = now() where id = ${id} returning *`;
      return r || null;
    },
    async jasenet(ryhmaId) { return (await db`select * from ryhmatilaus_jasenet where ryhma_id = ${ryhmaId} order by created_at, id`).map(nro); },
    async haeJasen(id) { return nro((await db`select * from ryhmatilaus_jasenet where id = ${id}`)[0]); },
    async haeJasenTunnuksella(ryhmaId, h) { return nro((await db`select * from ryhmatilaus_jasenet where ryhma_id = ${ryhmaId} and oma_tiiviste = ${h}`)[0]); },
    async lisaaJasen(j) {
      const [r] = await db`insert into ryhmatilaus_jasenet (ryhma_id, oma_tiiviste, nimi, numero, koko)
        values (${j.ryhma_id}, ${j.oma_tiiviste}, ${j.nimi}, ${j.numero}, ${j.koko}) returning *`;
      return nro(r);
    },
    async paivitaJasen(id, muutokset, vaadittuTila = null) {
      const a = arvot(muutokset, JASEN_SARAKKEET);
      const [r] = vaadittuTila
        ? await db`update ryhmatilaus_jasenet set ${db(a)}, updated_at = now() where id = ${id} and tila = ${vaadittuTila} returning *`
        : await db`update ryhmatilaus_jasenet set ${db(a)}, updated_at = now() where id = ${id} returning *`;
      return nro(r);
    },
    /** Lukittu ryhmä tilaukseksi yhdessä transaktiossa: tila lahetetty vain kerran, ja tilausrivi syntyy vain kerran. */
    async lahetaTilaus(ryhmaId, t) {
      return db.begin(async (tx) => {
        const [r] = await tx`update ryhmatilaukset set tila = 'lahetetty', lahetetty_at = now(), updated_at = now()
          where id = ${ryhmaId} and tila = 'lukittu' and order_id is null returning id`;
        if (!r) return null;
        const [o] = await tx`insert into orders (customer_email, customer_name, recipient_name, phone, shipping_address, items,
            subtotal, shipping, discount_code, discount, bundle_discount, total, gift_card_code, gift_card_amount, printify_status,
            status, paid_at, amount_paid)
          values (${t.customer_email}, ${t.customer_name}, ${t.recipient_name}, ${t.phone}, ${db.json(t.shipping_address)}, ${db.json(t.items)},
            ${t.total}, 0, ${t.discount_code}, 0, 0, ${t.total}, null, 0, 'ei_lahetetty', 'maksettu', now(), ${t.total})
          returning id`;
        await tx`update ryhmatilaukset set order_id = ${o.id} where id = ${ryhmaId}`;
        await tx`insert into order_events (order_id, kind, details) values (${o.id}, 'ryhmatilaus', ${db.json({ ryhma: ryhmaId, kpl: t.items.length })})`;
        return o.id;
      });
    },
    async tilauksenTila(orderId) {
      const [o] = await db`select printify_status, tracking_url, shipped_at from orders where id = ${orderId}`;
      return o || null;
    },
    async haeTilaus(orderId) { return (await db`select * from orders where id = ${orderId}`)[0] || null; },
    async kirjaa(tapahtuma, n = 1, kate = 0) {
      await varmistaTaulut(db);
      await db`insert into ryhmatilaus_laskuri (paiva, tapahtuma, n, kate) values ((now() at time zone 'Europe/Helsinki')::date, ${tapahtuma}, ${n}, ${kate})
        on conflict (paiva, tapahtuma) do update set n = ryhmatilaus_laskuri.n + excluded.n, kate = ryhmatilaus_laskuri.kate + excluded.kate`;
    },
    async poistaRyhma(id) { await db`delete from ryhmatilaukset where id = ${id}`; },
    async onPalautettu(session) { await varmistaTaulut(db); return (await db`select 1 from ryhmatilaus_palautukset where session = ${session}`).length > 0; },
    async merkitsePalautettu(session, ryhmaId, summa) {
      await db`insert into ryhmatilaus_palautukset (session, ryhma_id, summa) values (${session}, ${ryhmaId}, ${summa}) on conflict (session) do nothing`;
    },
    async logoOlemassa(id) { return (await db`select 1 from yrityslogot where id = ${id}`.catch(() => [])).length > 0; },
  };
}

// ── Stripe ─────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Stripe-sovitin: Checkout-istunto, istunnon haku, palautus (osittainen tai koko maksu). */
export function stripeMaksut(st) {
  return {
    async luoIstunto({ rivit, metadata, paluu, email }) {
      const s = await st.checkout.sessions.create({
        // Kortti (myös Apple Pay ja Google Pay) ja MobilePay: Klarnalla 9 €:n kate paidalta ei täyty (api/_lib/maksutavat.js).
        payment_method_types: RYHMA_MAKSUTAVAT,
        mode: "payment",
        locale: "fi",
        ...(email ? { customer_email: email } : {}),
        line_items: rivit.map((r) => ({ price_data: { currency: "eur", product_data: { name: r.nimi, ...(r.kuvaus ? { description: r.kuvaus } : {}) }, unit_amount: r.sentit }, quantity: r.kpl })),
        success_url: paluu,
        cancel_url: paluu.replace(/[?&]maksu=\{CHECKOUT_SESSION_ID\}/, ""),
        metadata,
        payment_intent_data: { metadata, ...(email ? { receipt_email: email } : {}) },
      });
      return { id: s.id, url: s.url };
    },
    haeIstunto: (id) => st.checkout.sessions.retrieve(id),
    async palauta(paymentIntent, summaSentit) {
      try {
        const r = await st.refunds.create({ payment_intent: paymentIntent, amount: summaSentit, metadata: { syy: "ryhmatilaus" } });
        return { ok: true, id: r.id };
      } catch (e) {
        return { ok: false, virhe: String(e?.message || e) };
      }
    },
    async vanhennaIstunto(id) { try { await st.checkout.sessions.expire(id); } catch { /* jo maksettu tai vanhentunut */ } },
  };
}

// ── Palvelu ────────────────────────────────────────────────────────────────────────────────────────────────────────

function tarkistaVetaja(v = {}) {
  const t = { nimi: teksti(v.nimi, 100), email: teksti(v.email, 200), puhelin: teksti(v.puhelin, 40), osoite: teksti(v.osoite, 200),
    postinumero: teksti(v.postinumero, 10), kaupunki: teksti(v.kaupunki, 80) };
  if (!t.nimi || !t.email || !EMAIL_RE.test(t.email)) return { ok: false, virhe: "Kirjoita vetäjän nimi ja sähköposti." };
  if (!t.osoite || !/^\d{5}$/.test(t.postinumero || "") || !t.kaupunki) return { ok: false, virhe: "Kirjoita toimitusosoite, postinumero ja postitoimipaikka. Kaikki paidat toimitetaan tähän osoitteeseen." };
  return { ok: true, vetaja: t };
}

function tarkistaPaikat(p, varattu = 0) {
  const n = Number(p);
  if (!Number.isInteger(n) || n < RYHMA_MIN_KPL || n > RYHMA_MAX_KPL) return { ok: false, virhe: `Paitoja on ${RYHMA_MIN_KPL}-${RYHMA_MAX_KPL}.` };
  if (n < varattu) return { ok: false, virhe: `Kokotaulukossa on jo ${varattu} riviä. Poista rivejä ennen kuin pienennät paikkamäärää.` };
  return { ok: true, paikat: n };
}

const tarkistaTakaraja = (s) => (s && /^\d{4}-\d{2}-\d{2}$/.test(String(s)) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`)) ? String(s) : null);
const paivaksi = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d ? String(d).slice(0, 10) : null);

/** Ryhmän julkiset tiedot (jäsenlinkki): ei vetäjän henkilötietoja. */
function julkinen(r, jasenet) {
  const akt = aktiiviset(jasenet);
  return { tyyppi: r.tyyppi, design: r.design, vari: r.vari, tila: r.tila, maksutapa: r.maksutapa, paikat: r.paikat, takaraja: paivaksi(r.takaraja),
    vapaana: Math.max(0, r.paikat - akt.length), riveja: akt.length, maksettuja: maksetut(akt).length, koot: kootVarille(r.vari) };
}

const hinnatNakyma = (vari) => ({ perus: Object.fromEntries(kootVarille(vari).map((k) => [k, perushinta(k)])), portaat: hintaportaat(), isoLisa: RYHMA_HINNASTO.isoLisa });

/**
 * Palvelu riippuvuuksineen. deps: { store (pgRyhmat tai muistivarasto), maksut (stripeMaksut tai testisovitin),
 * viimeistele(orderId) (tilauksen jälkikäsittely: Printify, vahvistus), ilmoita(otsikko, rivit) (omistajan hälytys),
 * tunnus() (satunnainen tunnus) }.
 */
export function ryhmaPalvelu({ store, maksut, viimeistele = async () => {}, ilmoita = async () => {}, tunnus = uusiTunnus }) {
  async function hallinnalla(hallinta) {
    if (!TUNNUS_RE.test(String(hallinta || ""))) throw new RyhmaVirhe("Hallintalinkki ei kelpaa.");
    const r = await store.haeRyhmaHallinnalla(tiiviste(hallinta));
    if (!r) throw new RyhmaVirhe("Hallintalinkki ei kelpaa.");
    return r;
  }
  async function tunnuksella(t) {
    if (!TUNNUS_RE.test(String(t || ""))) throw new RyhmaVirhe("Linkki ei kelpaa. Pyydä vetäjältä uusi linkki.");
    const r = await store.haeRyhmaTunnuksella(String(t));
    if (!r) throw new RyhmaVirhe("Linkki ei kelpaa. Pyydä vetäjältä uusi linkki.");
    return r;
  }
  /** Ladattu logo on tallessa (yrityslogot), muuten painokuvaa ei voi tehdä. */
  async function varmistaLogo(logo) {
    if (logo && store.logoOlemassa && !(await store.logoOlemassa(logo))) throw new RyhmaVirhe("Logo puuttuu. Lataa logo uudelleen.");
  }
  async function omaRivi(r, oma) {
    if (!TUNNUS_RE.test(String(oma || ""))) return null;
    return store.haeJasenTunnuksella(r.id, tiiviste(oma));
  }

  /** Palautus itse maksaneelle (summa euroina). Epäonnistunut palautus jää odottamaan (ajaRyhmaValvonta yrittää uudelleen). */
  async function palauta(j, summa, syy) {
    if (!(summa > 0)) return { ok: true };
    await store.paivitaJasen(j.id, { hyvitys_odottaa: pyorista(Number(j.hyvitys_odottaa || 0) + summa) });
    const r = j.payment_intent ? await maksut.palauta(j.payment_intent, sentit(summa)) : { ok: true, testi: true };
    if (r.ok) {
      const nyt = await store.haeJasen(j.id);
      await store.paivitaJasen(j.id, { hyvitetty: pyorista(Number(nyt.hyvitetty || 0) + summa), hyvitys_odottaa: pyorista(Math.max(0, Number(nyt.hyvitys_odottaa || 0) - summa)) });
    } else {
      await ilmoita("Ryhmätilauksen palautus epäonnistui", [`Ryhmä ${j.ryhma_id}, rivi ${j.id}`, `Summa ${eur(summa)} (${syy})`, r.virhe || "", "Valvonta yrittää uudelleen tunnin välein."]);
    }
    return r;
  }

  /** Lukitun ryhmän lähetys: tilausrivi, hyvitykset, laskuri ja Printify (viimeistele). Idempotentti. */
  async function laheta(ryhmaId) {
    const r = await store.haeRyhma(ryhmaId);
    if (!r || r.tila !== "lukittu" || !r.suunnitelma) return { ok: r?.tila === "lahetetty", tila: r?.tila ?? null };
    const s = r.suunnitelma;
    if (s.vetajaMaksaa.length && !r.vetaja_maksu) return { ok: false, odottaa: "vetajan_maksu" };
    for (const id of s.pois) await store.paivitaJasen(id, { tila: "pois" }, "tayttanyt");
    const jasenet = await store.jasenet(r.id);
    const rivit = tilausRivit(r, jasenet, s);
    const total = pyorista(rivit.reduce((x, i) => x + i.unit_price, 0));
    const tilaus = {
      customer_email: r.vetaja.email, customer_name: r.vetaja.nimi, recipient_name: r.vetaja.nimi, phone: r.vetaja.puhelin || null,
      shipping_address: { address: r.vetaja.osoite, zip: r.vetaja.postinumero, city: r.vetaja.kaupunki, phone: r.vetaja.puhelin || "", country: "FI" },
      items: rivit, total, discount_code: `RYHMA ${s.kpl} kpl`,
    };
    let orderId = null;
    if (r.testi) {
      await store.paivitaRyhma(r.id, { tila: "lahetetty", lahetetty_at: new Date() }, "lukittu");
    } else {
      orderId = await store.lahetaTilaus(r.id, tilaus);
      if (!orderId) return { ok: true, jo: true };
    }
    const byId = new Map(jasenet.map((j) => [j.id, j]));
    for (const h of s.hyvitykset) await palauta(byId.get(h.id), h.summa, "määräalennuksen erotus");
    if (!r.testi) {
      await store.kirjaa("ryhma_maksettu", 1, s.kate);
      await store.kirjaa("paitoja", s.kpl);
      await viimeistele(orderId);
    }
    return { ok: true, orderId, tilaus };
  }

  /** Lukitus ja tarvittaessa vetäjän maksu. */
  async function lukitse(r, tapa, paluu, { automaattinen = false } = {}) {
    const jasenet = await store.jasenet(r.id);
    const s = lukitusSuunnitelma(r, jasenet, tapa, { testi: r.testi });
    if (!s.ok) {
      if (s.kate) await ilmoita("Ryhmätilauksen kate alle rajan", [`Ryhmä ${r.id}`, `Kate ${eur(s.kate.nettokate)}, ${eur(s.kate.perPaita)} paidalta`]);
      throw new RyhmaVirhe(s.virhe);
    }
    const lukittu = await store.paivitaRyhma(r.id, { tila: "lukittu", suunnitelma: s, lukittu_at: new Date() }, "avoin");
    if (!lukittu) throw new RyhmaVirhe("Ryhmätilaus on jo lukittu.");
    if (!s.vetajaMaksaa.length) return { ...(await laheta(r.id)), automaattinen };
    // Vetäjä maksaa: rivit koon ja hinnan mukaan.
    const ryhmitelty = new Map();
    for (const id of s.vetajaMaksaa) {
      const j = jasenet.find((x) => x.id === id);
      const k = `${j.koko}|${s.hinnat[id]}`;
      ryhmitelty.set(k, { koko: j.koko, hinta: s.hinnat[id], kpl: (ryhmitelty.get(k)?.kpl || 0) + 1 });
    }
    const istunto = await maksut.luoIstunto({
      rivit: [...ryhmitelty.values()].map((x) => ({ nimi: `Ryhmäpaita: ${r.design.nimi}, koko ${x.koko}`, kuvaus: `${s.kpl} paidan ryhmätilaus, ${r.vari.toLowerCase()} t-paita, selkään jokaisen oma nimi.`, sentit: sentit(x.hinta), kpl: x.kpl })),
      metadata: { ryhma_id: r.id, ryhma_maksu: "vetaja" },
      paluu, email: r.vetaja.email,
    });
    await store.paivitaRyhma(r.id, { vetaja_session: istunto.id });
    return { ok: true, url: istunto.url, summa: s.vetajanSumma };
  }

  /** Stripe-maksu (webhook, cron ja paluusivu). Idempotentti. */
  async function kasitteleMaksu(session) {
    if (session?.payment_status !== "paid") return { ok: false, syy: "ei maksettu" };
    const m = session.metadata || {};
    const r = await store.haeRyhma(m.ryhma_id);
    const pi = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
    const summa = (session.amount_total ?? 0) / 100;
    if (store.onPalautettu && (await store.onPalautettu(session.id))) return { ok: false, jo: true, palautettu: true };
    const palautaKokonaan = async (syy) => {
      if (pi) {
        const p = await maksut.palauta(pi, sentit(summa));
        if (p.ok && store.merkitsePalautettu) await store.merkitsePalautettu(session.id, r?.id ?? null, summa);
        await ilmoita(`Ryhmätilauksen maksu palautettiin: ${syy}`, [`Ryhmä ${m.ryhma_id}`, `Session ${session.id}`, `Summa ${eur(summa)}`, p.ok ? "Palautus tehty." : `Palautus epäonnistui: ${p.virhe}`]);
      }
      return { ok: false, syy, palautettu: true };
    };
    if (!r) return palautaKokonaan("ryhmää ei löydy");
    if (m.ryhma_maksu === "jasen") {
      const j = await store.haeJasen(m.ryhma_jasen);
      if (j?.stripe_session_id === session.id && j.tila === "maksettu") return { ok: true, jo: true };
      if (!j || j.ryhma_id !== r.id || maksunEste(r, j)) return palautaKokonaan(j?.tila === "maksettu" ? "rivi oli jo maksettu" : "ryhmä lukittu tai rivi poistettu");
      const p = await store.paivitaJasen(j.id, { tila: "maksettu", maksaja: "jasen", maksettu: summa, payment_intent: pi, stripe_session_id: session.id }, "tayttanyt");
      if (!p) return { ok: true, jo: true };
      const kaikki = await store.jasenet(r.id);
      const nyt = await store.haeRyhma(r.id);
      if (kaikkiMaksaneet(nyt, kaikki)) {
        try {
          return { ok: true, ...(await lukitse(nyt, "jata-pois", null, { automaattinen: true })) };
        } catch (e) {
          if (!(e instanceof RyhmaVirhe)) throw e;
          await ilmoita("Ryhmätilauksen automaattinen lukitus epäonnistui", [`Ryhmä ${r.id}`, e.message]);
        }
      }
      return { ok: true };
    }
    if (m.ryhma_maksu === "vetaja") {
      if (r.vetaja_maksu?.session === session.id) return { ok: true, jo: true };
      if (r.tila !== "lukittu" || r.vetaja_session !== session.id) return palautaKokonaan("vetäjän maksu vanhaan lukitukseen");
      const s = r.suunnitelma;
      if (Math.abs(summa - s.vetajanSumma) > 0.01) {
        await ilmoita("Ryhmätilauksen vetäjän maksu poikkeaa", [`Ryhmä ${r.id}`, `Maksettu ${eur(summa)}, odotettu ${eur(s.vetajanSumma)}`]);
      }
      const p = await store.paivitaRyhma(r.id, { vetaja_maksu: { session: session.id, payment_intent: pi, summa } }, "lukittu");
      if (!p) return { ok: true, jo: true };
      for (const id of s.vetajaMaksaa) await store.paivitaJasen(id, { tila: "maksettu", maksaja: "vetaja", maksettu: s.hinnat[id] }, "tayttanyt");
      return { ok: true, ...(await laheta(r.id)) };
    }
    return { ok: false, syy: "tuntematon maksu" };
  }

  async function hallintaNakyma(r) {
    const jasenet = await store.jasenet(r.id);
    const akt = aktiiviset(jasenet);
    const tilaus = r.order_id && store.tilauksenTila ? await store.tilauksenTila(r.order_id) : null;
    const arvio = (tapa) => {
      if (r.tila !== "avoin") return null;
      const s = lukitusSuunnitelma(r, jasenet, tapa, { testi: r.testi });
      return s.ok ? { ok: true, kpl: s.kpl, vetajanSumma: s.vetajanSumma, pois: s.pois.length, hinta: s.porras.hinta } : { ok: false, virhe: s.virhe };
    };
    return {
      ok: true,
      ryhma: { ...julkinen(r, jasenet), vetaja: r.vetaja, jasenTunnus: r.jasen_tunnus, lukittu: paivaksi(r.lukittu_at), lahetetty: paivaksi(r.lahetetty_at),
        suunnitelma: r.suunnitelma ? { kpl: r.suunnitelma.kpl, vetajanSumma: r.suunnitelma.vetajanSumma, odottaaMaksua: r.tila === "lukittu" && r.suunnitelma.vetajaMaksaa.length > 0 && !r.vetaja_maksu } : null },
      jasenet: jasenet.filter((j) => j.tila !== "poistettu").map((j) => ({ id: j.id, nimi: j.nimi, numero: j.numero, koko: j.koko, tila: j.tila, maksaja: j.maksaja,
        maksettu: j.maksettu, hyvitetty: j.hyvitetty })),
      koot: kootYhteensa(jasenet),
      porrasNyt: hintaporras(akt.length),
      hinnat: hinnatNakyma(r.vari),
      arvio: r.maksutapa === "vetaja" ? { vetaja: arvio("vetaja") } : { jataPois: arvio("jata-pois"), maksaLoput: arvio("maksa-loput") },
      tilaus: tilaus ? { printify: tilaus.printify_status, seuranta: tilaus.tracking_url || null } : null,
    };
  }

  async function jasenNakyma(r, oma) {
    const jasenet = await store.jasenet(r.id);
    const j = oma ? await omaRivi(r, oma) : null;
    return {
      ok: true,
      ryhma: julkinen(r, jasenet),
      nimet: aktiiviset(jasenet).map((x) => [x.nimi, x.numero].filter(Boolean).join(" ")),
      hinnat: hinnatNakyma(r.vari),
      oma: j && j.tila !== "poistettu" ? { nimi: j.nimi, numero: j.numero, koko: j.koko, tila: j.tila, hyvitetty: j.hyvitetty, maksettu: j.maksettu } : null,
    };
  }

  /** Paluusivu: Stripe-istunnon tila haetaan ja käsitellään heti, jos webhook ei ole vielä ehtinyt. */
  async function kasittelePaluu(r, maksu) {
    if (typeof maksu !== "string" || !/^cs_[A-Za-z0-9_]+$/.test(maksu)) return;
    try {
      const s = await maksut.haeIstunto(maksu);
      if (s?.metadata?.ryhma_id === r.id) await kasitteleMaksu(s);
    } catch (e) {
      console.error("ryhmä paluu:", e?.message || e);
    }
  }

  return {
    kasitteleMaksu,
    laheta,

    async luo(syote) {
      const tyyppi = RYHMATYYPIT.includes(syote?.tyyppi) ? syote.tyyppi : null;
      if (!tyyppi) throw new RyhmaVirhe("Valitse ryhmän tyyppi.");
      const d = tarkistaDesign(syote.design);
      if (!d.ok) throw new RyhmaVirhe(d.virhe);
      if (!tarkistaVari(syote.vari)) throw new RyhmaVirhe(`Valitse paidan väri (${RYHMA_VARIT.join(", ")}).`);
      if (!["vetaja", "jasenet"].includes(syote.maksutapa)) throw new RyhmaVirhe("Valitse, maksaako vetäjä kaikki paidat vai jokainen omansa.");
      const p = tarkistaPaikat(syote.paikat);
      if (!p.ok) throw new RyhmaVirhe(p.virhe);
      const v = tarkistaVetaja(syote.vetaja);
      if (!v.ok) throw new RyhmaVirhe(v.virhe);
      await varmistaLogo(d.logo);
      const hallinta = tunnus();
      const jasenTunnus = tunnus();
      const r = await store.luoRyhma({ tyyppi, maksutapa: syote.maksutapa, paikat: p.paikat, design: { nimi: d.nimi, vuosi: d.vuosi, teksti: d.teksti, logo: d.logo },
        vari: syote.vari, jasen_tunnus: jasenTunnus, hallinta_tiiviste: tiiviste(hallinta), vetaja: v.vetaja, takaraja: tarkistaTakaraja(syote.takaraja), testi: !!syote.testi });
      if (!r.testi) await store.kirjaa("ryhma_luotu");
      return { ok: true, id: r.id, hallinta, jasenTunnus };
    },

    async hae(t, { oma, maksu } = {}) {
      const r = await tunnuksella(t);
      if (maksu) await kasittelePaluu(r, maksu);
      return jasenNakyma(await store.haeRyhma(r.id), oma);
    },

    async hallinta(h, { maksu } = {}) {
      const r = await hallinnalla(h);
      if (maksu) await kasittelePaluu(r, maksu);
      return hallintaNakyma(await store.haeRyhma(r.id));
    },

    async liity(t, syote) {
      const r = await tunnuksella(t);
      const jasenet = await store.jasenet(r.id);
      const este = liittymisenEste(r, jasenet);
      if (este) throw new RyhmaVirhe(este);
      const j = tarkistaJasen(syote, r.vari);
      if (!j.ok) throw new RyhmaVirhe(j.virhe);
      const oma = tunnus();
      const uusi = await store.lisaaJasen({ ryhma_id: r.id, oma_tiiviste: tiiviste(oma), nimi: j.nimi, numero: j.numero, koko: j.koko });
      // Samanaikainen liittyminen: viimeinen yli paikkamäärän poistetaan.
      if (aktiiviset(await store.jasenet(r.id)).length > r.paikat) {
        await store.paivitaJasen(uusi.id, { tila: "poistettu" });
        throw new RyhmaVirhe("Kokotaulukko on täynnä. Pyydä ryhmän vetäjää lisäämään paikkoja.");
      }
      if (!r.testi) await store.kirjaa("jasen_liittyi");
      return { ok: true, oma, id: uusi.id };
    },

    async muokkaa(t, oma, syote) {
      const r = await tunnuksella(t);
      const j = await omaRivi(r, oma);
      if (!j || !["tayttanyt", "maksettu"].includes(j.tila)) throw new RyhmaVirhe("Riviä ei löydy.");
      if (r.tila !== "avoin") throw new RyhmaVirhe("Ryhmätilaus on jo lukittu, joten rivejä ei voi muuttaa.");
      const u = tarkistaJasen({ nimi: syote?.nimi ?? j.nimi, numero: syote?.numero ?? j.numero, koko: syote?.koko ?? j.koko }, r.vari);
      if (!u.ok) throw new RyhmaVirhe(u.virhe);
      if (j.tila === "maksettu" && u.koko !== j.koko) throw new RyhmaVirhe("Koon voi vaihtaa ennen maksua. Pyydä vetäjää poistamaan rivisi, niin maksu palautetaan, ja täytä uusi rivi.");
      await store.paivitaJasen(j.id, { nimi: u.nimi, numero: u.numero, koko: u.koko });
      return { ok: true };
    },

    async maksa(t, oma, origin) {
      const r = await tunnuksella(t);
      const j = await omaRivi(r, oma);
      const este = maksunEste(r, j);
      if (este) throw new RyhmaVirhe(este);
      const hinta = perushinta(j.koko);
      const istunto = await maksut.luoIstunto({
        rivit: [{ nimi: `Ryhmäpaita: ${r.design.nimi}, koko ${j.koko}`, kuvaus: `Selkään ${[j.nimi, j.numero].filter(Boolean).join(" ")}. Määräalennuksen erotus palautetaan kortille, kun tilaus lähtee painoon.`, sentit: sentit(hinta), kpl: 1 }],
        metadata: { ryhma_id: r.id, ryhma_maksu: "jasen", ryhma_jasen: j.id },
        paluu: `${origin}/ryhma/${t}?oma=${encodeURIComponent(oma)}&maksu={CHECKOUT_SESSION_ID}`,
      });
      await store.paivitaJasen(j.id, { stripe_session_id: istunto.id });
      return { ok: true, url: istunto.url };
    },

    async paivita(h, syote) {
      const r = await hallinnalla(h);
      if (r.tila !== "avoin") throw new RyhmaVirhe("Lukittua ryhmätilausta ei voi muuttaa.");
      const jasenet = await store.jasenet(r.id);
      const muutokset = {};
      if (syote.design) {
        const d = tarkistaDesign(syote.design);
        if (!d.ok) throw new RyhmaVirhe(d.virhe);
        await varmistaLogo(d.logo);
        muutokset.design = { nimi: d.nimi, vuosi: d.vuosi, teksti: d.teksti, logo: d.logo };
      }
      if (syote.vari && syote.vari !== r.vari) {
        if (!tarkistaVari(syote.vari)) throw new RyhmaVirhe("Valitse paidan väri listalta.");
        const puuttuu = aktiiviset(jasenet).filter((j) => !kootVarille(syote.vari).includes(j.koko));
        if (puuttuu.length) throw new RyhmaVirhe(`Värissä ${syote.vari.toLowerCase()} ei ole kokoa ${puuttuu[0].koko}.`);
        muutokset.vari = syote.vari;
      }
      if (syote.paikat !== undefined) {
        const p = tarkistaPaikat(syote.paikat, aktiiviset(jasenet).length);
        if (!p.ok) throw new RyhmaVirhe(p.virhe);
        muutokset.paikat = p.paikat;
      }
      if (syote.takaraja !== undefined) muutokset.takaraja = tarkistaTakaraja(syote.takaraja);
      if (syote.maksutapa && syote.maksutapa !== r.maksutapa) {
        if (!["vetaja", "jasenet"].includes(syote.maksutapa)) throw new RyhmaVirhe("Valitse maksutapa.");
        if (maksetut(jasenet).length) throw new RyhmaVirhe("Maksutapaa ei voi vaihtaa, kun joku on jo maksanut.");
        muutokset.maksutapa = syote.maksutapa;
      }
      if (Object.keys(muutokset).length) await store.paivitaRyhma(r.id, muutokset, "avoin");
      return hallintaNakyma(await store.haeRyhma(r.id));
    },

    async poistaJasen(h, jasenId) {
      const r = await hallinnalla(h);
      if (r.tila !== "avoin") throw new RyhmaVirhe("Lukitusta ryhmätilauksesta ei voi poistaa rivejä.");
      const j = await store.haeJasen(jasenId);
      if (!j || j.ryhma_id !== r.id || !["tayttanyt", "maksettu"].includes(j.tila)) throw new RyhmaVirhe("Riviä ei löydy.");
      const p = await store.paivitaJasen(j.id, { tila: "poistettu" }, j.tila);
      if (!p) throw new RyhmaVirhe("Rivi muuttui juuri. Päivitä sivu.");
      await palauta(j, omaMaksu(j), "vetäjä poisti rivin");
      return hallintaNakyma(await store.haeRyhma(r.id));
    },

    async lukitse(h, tapa, origin) {
      const r = await hallinnalla(h);
      return lukitse(r, r.maksutapa === "vetaja" ? "vetaja" : tapa, `${origin}/ryhma/hallinta/${h}?maksu={CHECKOUT_SESSION_ID}`);
    },

    /** Lukittu, maksamaton ryhmä takaisin avoimeksi (vetäjä ei maksanut). Vanha Stripe-istunto vanhennetaan. */
    async avaa(h) {
      const r = await hallinnalla(h);
      if (r.tila !== "lukittu" || r.vetaja_maksu) throw new RyhmaVirhe("Vain maksamattoman lukituksen voi avata.");
      const p = await store.paivitaRyhma(r.id, { tila: "avoin", suunnitelma: null, vetaja_session: null, lukittu_at: null }, "lukittu");
      if (!p) throw new RyhmaVirhe("Ryhmätilaus muuttui juuri. Päivitä sivu.");
      if (r.vetaja_session && maksut.vanhennaIstunto) await maksut.vanhennaIstunto(r.vetaja_session);
      return hallintaNakyma(p);
    },

    async peru(h) {
      const r = await hallinnalla(h);
      if (!["avoin", "lukittu"].includes(r.tila) || r.vetaja_maksu) throw new RyhmaVirhe("Painoon lähtenyttä ryhmätilausta ei voi perua.");
      const p = await store.paivitaRyhma(r.id, { tila: "peruttu" }, r.tila);
      if (!p) throw new RyhmaVirhe("Ryhmätilaus muuttui juuri. Päivitä sivu.");
      for (const j of await store.jasenet(r.id)) await palauta(j, omaMaksu(j), "ryhmätilaus peruttu");
      if (r.vetaja_session && maksut.vanhennaIstunto) await maksut.vanhennaIstunto(r.vetaja_session);
      return hallintaNakyma(p);
    },
  };
}

// ── Tuotannon kytkennät ────────────────────────────────────────────────────────────────────────────────────────────

async function tuotantoPalvelu() {
  const [{ sql, onTietokanta }, { stripe, onStripe }, { halytys }] = await Promise.all([import("./db.js"), import("./stripe.js"), import("./sahkoposti.js")]);
  if (!onTietokanta() || !onStripe()) return null;
  return ryhmaPalvelu({
    store: pgRyhmat(sql()),
    maksut: stripeMaksut(stripe()),
    ilmoita: (o, r) => halytys(o, r),
    viimeistele: async (orderId) => {
      const { jalkikasittely } = await import("./tilaus.js");
      const [t] = await sql()`select * from orders where id = ${orderId}`;
      if (t) await jalkikasittely(t);
    },
  });
}

/** Stripe-maksu ryhmätilaukseen (api/_lib/tilaus.js kasitteleMaksu ohjaa tänne metadatan ryhma_id:n perusteella). */
export async function kasitteleRyhmaMaksu(session) {
  const p = await tuotantoPalvelu();
  if (!p) return null;
  const r = await p.kasitteleMaksu(session);
  return r;
}

/** Vetäjän linkit sähköpostiin (vain, kun oma lähetysdomain on vahvistettu). */
async function lahetaLinkit(vetaja, origin, hallinta, jasenTunnus, nimi) {
  try {
    const { laheta, omaVahvistusKaytossa } = await import("./sahkoposti.js");
    if (!omaVahvistusKaytossa()) return false;
    const h = `${origin}/ryhma/hallinta/${hallinta}`;
    const j = `${origin}/ryhma/${jasenTunnus}`;
    const r = await laheta({ to: vetaja.email, subject: `Ryhmätilaus ${nimi}: linkit`,
      text: `Hei ${vetaja.nimi},\n\nryhmätilauksesi ${nimi} on luotu.\n\nJaa tämä linkki ryhmälle, niin jokainen täyttää oman nimensä ja koonsa:\n${j}\n\nOma hallintalinkkisi (älä jaa tätä):\n${h}\n\nHallintasivulla näet kokotaulukon ja maksut ja lukitset tilauksen.\n\nHuumorikauppa`,
      html: `<p>Hei ${vetaja.nimi.replace(/</g, "&lt;")},</p><p>ryhmätilauksesi <strong>${nimi.replace(/</g, "&lt;")}</strong> on luotu.</p><p>Jaa tämä linkki ryhmälle, niin jokainen täyttää oman nimensä ja koonsa:<br><a href="${j}">${j}</a></p><p>Oma hallintalinkkisi (älä jaa tätä):<br><a href="${h}">${h}</a></p><p>Hallintasivulla näet kokotaulukon ja maksut ja lukitset tilauksen.</p><p>Huumorikauppa</p>` });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * HTTP-toiminnot (api/checkout.js, POST { action }):
 *   ryhma-luo       { tyyppi, design: { nimi, vuosi, teksti, logo }, vari, maksutapa, paikat, takaraja, vetaja }  -> { ok, hallinta, jasenTunnus }
 *   ryhma-hae       { tunnus, oma?, maksu? }           jäsenlinkin näkymä (maksu = Stripe-paluu)
 *   ryhma-liity     { tunnus, nimi, numero, koko }     uusi rivi kokotaulukkoon -> { ok, oma }
 *   ryhma-muokkaa   { tunnus, oma, nimi, numero, koko }
 *   ryhma-maksa     { tunnus, oma }                    -> { ok, url } (Stripe Checkout)
 *   ryhma-hallinta  { hallinta, maksu? }               vetäjän näkymä
 *   ryhma-paivita   { hallinta, design?, vari?, paikat?, takaraja?, maksutapa? }
 *   ryhma-poista    { hallinta, jasen }                rivin poisto (itse maksettu palautetaan)
 *   ryhma-lukitse   { hallinta, tapa: "jata-pois" | "maksa-loput" }  -> { ok, url? } (vetäjän maksu) tai lähetys
 *   ryhma-avaa      { hallinta }                       maksamaton lukitus takaisin avoimeksi
 *   ryhma-peru      { hallinta }                       peruutus, itse maksaneille palautus
 */
export async function ryhmaToiminto(pyynto, req, res) {
  const p = await tuotantoPalvelu().catch(() => null);
  if (!p) return res.status(503).json({ ok: false, error: "Ryhmätilaukset eivät ole vielä käytössä tässä ympäristössä." });
  const origin = (req.headers.origin && /^https:\/\//.test(req.headers.origin) ? req.headers.origin : `https://${req.headers.host}`).replace(/\/$/, "");
  try {
    switch (pyynto.action) {
      case "ryhma-luo": {
        const r = await p.luo({ ...pyynto, testi: false });
        const lahetetty = await lahetaLinkit(pyynto.vetaja, origin, r.hallinta, r.jasenTunnus, teksti(pyynto.design?.nimi, 40) || "");
        return res.status(200).json({ ok: true, hallinta: r.hallinta, jasenTunnus: r.jasenTunnus, sahkoposti: lahetetty });
      }
      case "ryhma-hae": return res.status(200).json(await p.hae(pyynto.tunnus, { oma: pyynto.oma, maksu: pyynto.maksu }));
      case "ryhma-liity": return res.status(200).json(await p.liity(pyynto.tunnus, pyynto));
      case "ryhma-muokkaa": return res.status(200).json(await p.muokkaa(pyynto.tunnus, pyynto.oma, pyynto));
      case "ryhma-maksa": return res.status(200).json(await p.maksa(pyynto.tunnus, pyynto.oma, origin));
      case "ryhma-hallinta": return res.status(200).json(await p.hallinta(pyynto.hallinta, { maksu: pyynto.maksu }));
      case "ryhma-paivita": return res.status(200).json(await p.paivita(pyynto.hallinta, pyynto));
      case "ryhma-poista": return res.status(200).json(await p.poistaJasen(pyynto.hallinta, pyynto.jasen));
      case "ryhma-lukitse": {
        const r = await p.lukitse(pyynto.hallinta, pyynto.tapa, origin);
        return res.status(200).json({ ok: r.ok, url: r.url ?? null, summa: r.summa ?? null, lahetetty: !!r.orderId || !!r.jo });
      }
      case "ryhma-avaa": return res.status(200).json(await p.avaa(pyynto.hallinta));
      case "ryhma-peru": return res.status(200).json(await p.peru(pyynto.hallinta));
      default: return res.status(400).json({ ok: false, error: "Tuntematon toiminto." });
    }
  } catch (e) {
    if (e instanceof RyhmaVirhe) return res.status(200).json({ ok: false, error: e.message });
    console.error("ryhmätilaus:", e?.message || e);
    return res.status(200).json({ ok: false, error: "Toiminto epäonnistui. Yritä hetken kuluttua uudelleen." });
  }
}

// ── Valvonta, mittari ja testi ─────────────────────────────────────────────────────────────────────────────────────

/**
 * Tunnin valvonta (api/cron/tilaukset.js, ei omaa ajastinta): epäonnistuneet palautukset uudelleen, lukitut ja
 * maksetut ryhmät, joiden lähetys jäi kesken, sekä vanhojen ryhmien poisto (henkilötiedot). Palauttaa lokirivit.
 */
export async function ajaRyhmaValvonta(db, { kuiva = false } = {}) {
  const loki = [];
  await varmistaTaulut(db);
  const p = kuiva ? null : await tuotantoPalvelu();
  const odottavat = await db`select * from ryhmatilaus_jasenet where hyvitys_odottaa > 0 and updated_at < now() - interval '30 minutes' limit 20`;
  for (const j of odottavat) {
    loki.push(`ryhmä: palautus ${j.id} ${j.hyvitys_odottaa} €`);
    if (kuiva || !p || !j.payment_intent) continue;
    const { stripe } = await import("./stripe.js");
    const r = await stripeMaksut(stripe()).palauta(j.payment_intent, sentit(j.hyvitys_odottaa));
    if (r.ok) await db`update ryhmatilaus_jasenet set hyvitetty = hyvitetty + hyvitys_odottaa, hyvitys_odottaa = 0, updated_at = now() where id = ${j.id}`;
  }
  const kesken = await db`select id from ryhmatilaukset where tila = 'lukittu' and order_id is null and testi = false
    and lukittu_at < now() - interval '15 minutes'
    and (vetaja_maksu is not null or jsonb_array_length(coalesce(suunnitelma->'vetajaMaksaa', '[]'::jsonb)) = 0) limit 10`;
  for (const { id } of kesken) {
    loki.push(`ryhmä: lähetys ${id}`);
    if (!kuiva && p) await p.laheta(id).catch((e) => loki.push(`ryhmä ${id}: ${e?.message || e}`));
  }
  const vanhat = await db`select id from ryhmatilaukset r where
      (tila in ('lahetetty', 'peruttu') and updated_at < now() - interval '180 days')
      or (tila = 'avoin' and created_at < now() - interval '180 days'
          and not exists (select 1 from ryhmatilaus_jasenet j where j.ryhma_id = r.id and j.tila = 'maksettu'))
      or (testi and created_at < now() - interval '1 day')`;
  if (vanhat.length) {
    loki.push(`ryhmä: poistetaan ${vanhat.length} vanhaa ryhmää`);
    if (!kuiva) await db`delete from ryhmatilaukset where id = any(${vanhat.map((r) => r.id)}::uuid[])`;
  }
  return loki;
}

/**
 * Ryhmätilausten mittari (koostelaskuri ryhmatilaus_laskuri, ei henkilötietoja): ryhmiä luotu, jäseniä liittynyt,
 * maksettuja (painoon lähteneitä) ryhmiä, paitoja ja kate (nettokate lähetyshetken laskelmasta). Kytkentä:
 * api/cron/tilaukset.js ?tehtava=mittarit tai scripts/mittarit.mjs. Palauttaa { kk, p30, yhteensa }.
 */
export async function ryhmatilausMittari(db) {
  await varmistaTaulut(db);
  const rivit = await db`select tapahtuma,
      sum(n) filter (where paiva >= date_trunc('month', (now() at time zone 'Europe/Helsinki'))::date) as kk_n,
      sum(kate) filter (where paiva >= date_trunc('month', (now() at time zone 'Europe/Helsinki'))::date) as kk_kate,
      sum(n) filter (where paiva > (now() at time zone 'Europe/Helsinki')::date - 30) as p30_n,
      sum(kate) filter (where paiva > (now() at time zone 'Europe/Helsinki')::date - 30) as p30_kate,
      sum(n) as n, sum(kate) as kate
    from ryhmatilaus_laskuri group by tapahtuma`;
  const jakso = (n, kate) => {
    const t = Object.fromEntries(rivit.map((r) => [r.tapahtuma, { n: Number(r[n] || 0), kate: Number(r[kate] || 0) }]));
    const x = (k) => t[k] || { n: 0, kate: 0 };
    return { ryhmiaLuotu: x("ryhma_luotu").n, jaseniaLiittynyt: x("jasen_liittyi").n, maksettujaRyhmia: x("ryhma_maksettu").n,
      paitoja: x("paitoja").n, kate: pyorista(x("ryhma_maksettu").kate) };
  };
  return { kk: jakso("kk_n", "kk_kate"), p30: jakso("p30_n", "p30_kate"), yhteensa: jakso("n", "kate") };
}

/**
 * Koko polun testi tuotannossa (api/cron/tilaukset.js ?tehtava=ryhmatilaustesti, scripts/ryhmatilaus-testi.mjs):
 * testiryhmä (testi = true, ei laskuriin eikä orders-tauluun), kaksi jäsentä, maksut simuloituina Stripe-istuntoina
 * samalla käsittelijällä kuin webhook (kaikki maksaneet -> automaattinen lukitus), tilausrivit ja Printify-runko,
 * painokuvat (etu ja selkä, PNG painoalueen mitoissa), Printify-testitilaus nimellä TESTI, joka perutaan samassa ajossa,
 * ja testidatan poisto. deps: { db, tilausRunko, ajaTestitilaus, kuiva, stripeTesti (valinnainen Stripe-testitilan asiakas) }.
 */
export async function ryhmatilausTesti({ db, tilausRunko, ajaTestitilaus, kuiva = false, stripeTesti = null, design = null }) {
  const store = pgRyhmat(db);
  const vaiheet = [];
  const maksut = {
    async luoIstunto({ rivit, metadata }) {
      if (stripeTesti) {
        const s = await stripeMaksut(stripeTesti).luoIstunto({ rivit, metadata, paluu: "https://huumorikauppa.fi/ryhma/testi?maksu={CHECKOUT_SESSION_ID}" });
        await stripeTesti.checkout.sessions.expire(s.id).catch(() => {});
        return { id: `${s.id}`, url: s.url, testitila: true };
      }
      return { id: `cs_testi_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, url: null };
    },
    haeIstunto: async () => null,
    palauta: async () => ({ ok: true, testi: true }),
  };
  const palvelu = ryhmaPalvelu({ store, maksut });
  let ryhmaId = null;
  const tulos = { ok: false, vaiheet };
  try {
    const luotu = await palvelu.luo({ tyyppi: "abi", testi: true, maksutapa: "jasenet", paikat: RYHMA_MIN_KPL, vari: "Musta",
      design: design || { nimi: "TESTI Abit", vuosi: "2027", teksti: "Penkkarit" },
      vetaja: { nimi: "Kassa Testi", email: "kassatesti@huumorikauppa.fi", puhelin: "0401234567", osoite: "Testikatu 1", postinumero: "00100", kaupunki: "Helsinki" } });
    ryhmaId = luotu.id;
    vaiheet.push({ vaihe: "luonti", ok: true });
    // Testiryhmässä kaksi paikkaa: kun molemmat ovat maksaneet, tilaus lukittuu automaattisesti.
    await store.paivitaRyhma(ryhmaId, { paikat: 2 });
    const jasenet = [];
    for (const j of [{ nimi: "Testi", numero: "7", koko: "M" }, { nimi: "Kokeilu", numero: "", koko: "XL" }]) {
      const l = await palvelu.liity(luotu.jasenTunnus, j);
      jasenet.push({ ...j, ...l });
    }
    vaiheet.push({ vaihe: "jäsenet", ok: true, kpl: jasenet.length });
    for (const j of jasenet) {
      const m = await palvelu.maksa(luotu.jasenTunnus, j.oma, "https://huumorikauppa.fi");
      const istunto = (await store.haeJasen(j.id)).stripe_session_id;
      const k = await palvelu.kasitteleMaksu({ id: istunto, payment_status: "paid", amount_total: sentit(perushinta(j.koko)), payment_intent: null,
        metadata: { ryhma_id: ryhmaId, ryhma_maksu: "jasen", ryhma_jasen: j.id } });
      vaiheet.push({ vaihe: `maksu ${j.nimi}`, ok: k.ok, stripeTestitila: !!m.url, automaattinenLukitus: !!k.automaattinen });
    }
    const r = await store.haeRyhma(ryhmaId);
    if (r.tila !== "lahetetty") throw new Error(`ryhmä tilassa ${r.tila}, odotettu lahetetty`);
    vaiheet.push({ vaihe: "lukitus", ok: true, kpl: r.suunnitelma.kpl, hinnat: Object.values(r.suunnitelma.hinnat), kate: r.suunnitelma.kate });
    const rivit = tilausRivit(r, await store.jasenet(ryhmaId), r.suunnitelma);
    const runko = tilausRunko({ id: `testi-${Date.now().toString(36)}-0000`, customer_email: "kassatesti@huumorikauppa.fi", customer_name: "Kassa Testi",
      shipping_address: { address: "Testikatu 1", zip: "00100", city: "Helsinki", phone: "0401234567", country: "FI" }, items: rivit });
    const kuvat = [];
    for (const l of runko.line_items) {
      for (const [paikka, url] of Object.entries(l.print_areas)) {
        try {
          const v = await fetch(url, { signal: AbortSignal.timeout(25000) });
          const b = Buffer.from(await v.arrayBuffer());
          const png = b.length > 24 && b.toString("ascii", 1, 4) === "PNG";
          const mitat = png ? { leveys: b.readUInt32BE(16), korkeus: b.readUInt32BE(20) } : null;
          kuvat.push({ paikka, variantti: l.variant_id, status: v.status, mitat, ok: v.status === 200 && png && mitat.leveys === 3461 && mitat.korkeus === 3955 });
        } catch (e) {
          kuvat.push({ paikka, variantti: l.variant_id, ok: false, virhe: String(e?.message || e) });
        }
      }
    }
    vaiheet.push({ vaihe: "painokuvat", ok: kuvat.every((k) => k.ok), kuvat });
    tulos.rivit = runko.line_items.map(({ print_areas, ...l }) => ({ ...l, paikat: Object.keys(print_areas) }));
    if (!kuiva && kuvat.every((k) => k.ok)) {
      const { ennen, ...t } = await ajaTestitilaus(runko, "Ryhmätilaus");
      const arvio = Object.fromEntries(rivit.map((x) => [x.variant_id, x.kulu_sentit / 100]));
      tulos.printify = { ...t, selka: (ennen?.line_items || []).map((l) => ({ variantti: l.variant_id, todellinen: l.cost / 100, arvio: arvio[l.variant_id] ?? null,
        arvioRiittaa: arvio[l.variant_id] !== undefined && l.cost / 100 <= arvio[l.variant_id] })) };
      vaiheet.push({ vaihe: "printify", ok: t.luotu && t.peruttu });
      // Selkäpainatuksen kuluarvio: Printifyn rivikulu (etu + selkä) ei saa ylittää laskelman kulua.
      vaiheet.push({ vaihe: "kuluarvio", ok: tulos.printify.selka.length > 0 && tulos.printify.selka.every((s) => s.arvioRiittaa),
        virhe: tulos.printify.selka.map((s) => `${s.variantti}: Printify ${s.todellinen} €, arvio ${s.arvio} €`).join("; ") });
    }
  } catch (e) {
    vaiheet.push({ vaihe: "virhe", ok: false, virhe: String(e?.message || e) });
  } finally {
    if (ryhmaId) {
      await store.poistaRyhma(ryhmaId);
      const jai = await store.haeRyhma(ryhmaId);
      vaiheet.push({ vaihe: "siivous", ok: !jai });
    }
  }
  tulos.ok = vaiheet.every((v) => v.ok);
  tulos.kuiva = kuiva;
  return tulos;
}
