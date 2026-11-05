/**
 * Blob-puskuri (5.11.2026, Neonin ilmaiskiintiö loppui ja kauppa kaatui): kävijät eivät herätä tietokantaa.
 *
 *  - Tilastot, suppilo ja A/B-kirjaukset (api/sahkoposti.js) kirjataan tallentavaan kantaan (tallentavaKanta): kysely
 *    ja sen arvot (myös päivä, laskettu kirjaushetkellä) jäävät instanssin muistiin. Erä kirjoitetaan Blobiin, kun
 *    rivejä on ERA_RIVEJA tai vanhin on ERA_IKA_MS vanha (yksi put per erä, Hobbyn Blob-kiintiö 2 000 kirjoitusta/kk).
 *    Tunnin valvonta (api/cron/tilaukset.js) ajaa erät tietokantaan samoina kyselyinä, kun kanta vastaa, ja poistaa ne.
 *  - Tilaukset, kun tietokanta ei vastaa (api/checkout.js): yksi Blob-tiedosto per tilaus (puskuri/tilaukset/<id>.json),
 *    maksu, Printify ja vahvistus käsitellään sen varassa (api/_lib/tilaus.js blobTilausVarasto), ja valvonta siirtää
 *    tilauksen kantaan samalla id:llä, kun kanta vastaa.
 *
 * Blob-varasto on julkinen (somevideot), joten sisältö salataan (AES-256-GCM, avain CRON_SECRETista johdettu).
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { onTietokanta, sql } from "./db.js";

export const TAPAHTUMA_ETULIITE = "puskuri/tapahtumat/";
export const TILAUS_ETULIITE = "puskuri/tilaukset/";
export const ERA_RIVEJA = 50;
export const ERA_IKA_MS = 30 * 60 * 1000;
const MUISTI_MAKS = 5000;

export const onBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

const avain = () => createHash("sha256").update(`hk-puskuri:${process.env.CRON_SECRET || process.env.BLOB_READ_WRITE_TOKEN || ""}`).digest();

export function salaa(arvo, k = avain()) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k, iv);
  const data = Buffer.concat([c.update(JSON.stringify(arvo), "utf8"), c.final()]);
  return { v: 1, iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), data: data.toString("base64") };
}

export function pura(kuori, k = avain()) {
  const d = createDecipheriv("aes-256-gcm", k, Buffer.from(kuori.iv, "base64"));
  d.setAuthTag(Buffer.from(kuori.tag, "base64"));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(kuori.data, "base64")), d.final()]).toString("utf8"));
}

// ---------- Blob ----------

export async function kirjoitaBlob(polku, arvo) {
  const { put } = await import("@vercel/blob");
  return put(polku, JSON.stringify(salaa(arvo)), {
    access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60,
  });
}

async function lueUrl(url) {
  const r = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Blob ${r.status}`);
  return pura(await r.json());
}

/** Polun sisältö tai null (head antaa osoitteen; puuttuva tiedosto null). */
export async function lueBlob(polku) {
  const { head } = await import("@vercel/blob");
  let tiedot;
  try { tiedot = await head(polku); } catch (e) {
    if (e?.name === "BlobNotFoundError" || /not.?found|not exist|404/i.test(`${e?.name || ""} ${e?.message || e}`)) return null;
    throw e;
  }
  return lueUrl(tiedot.url);
}

export async function listaaBlob(etuliite) {
  const { list } = await import("@vercel/blob");
  const kaikki = [];
  let cursor;
  do {
    const r = await list({ prefix: etuliite, cursor, limit: 1000 });
    kaikki.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return kaikki;
}

export async function poistaBlob(urlit) {
  if (!urlit.length) return;
  const { del } = await import("@vercel/blob");
  await del(urlit);
}

// ---------- Tietokannan tila ----------

let kannanTila = { at: 0, ok: null };

/**
 * Vastaako tietokanta (select 1, aikaraja). Tulos muistissa minuutin. TIETOKANTA_POIS=1 pakottaa puskuritilan.
 * Kutsutaan vain kassalla, maksun käsittelyssä ja valvonnassa: kävijän sivulataus ei koskaan herätä kantaa.
 */
export async function kantaVastaa({ aikaraja = 6000, kanta = sql, nyt = Date.now() } = {}) {
  if (!onTietokanta() || process.env.TIETOKANTA_POIS === "1") return false;
  if (kannanTila.ok !== null && nyt - kannanTila.at < 60000) return kannanTila.ok;
  let ok = false;
  try {
    let ajastin;
    await Promise.race([
      kanta()`select 1`,
      new Promise((_, hylkaa) => { ajastin = setTimeout(() => hylkaa(new Error("aikaraja")), aikaraja); }),
    ]).finally(() => clearTimeout(ajastin));
    ok = true;
  } catch (e) {
    console.error("tietokanta ei vastaa:", String(e?.message || e).slice(0, 160));
  }
  // Heräämisen kirjaus Neonin kulutusarvioon (kanta on jo hereillä).
  if (ok && kanta === sql) await import("./puskuri-siirto.js").then((m) => m.kirjaaHeratys(sql())).catch(() => {});
  kannanTila = { at: nyt, ok };
  return ok;
}

export const nollaaKannanTila = () => { kannanTila = { at: 0, ok: null }; };

// ---------- Tapahtumapuskuri ----------

const muisti = { rivit: [], alku: 0 };

/**
 * Tallentava kanta: sama tagged template -rajapinta kuin postgres.js, mutta kysely (tekstiosat ja arvot) kirjataan
 * puskuriin ja palautetaan tyhjä tulos. Seurantakirjastojen kyselyt ovat laskureita, joiden päivä lasketaan
 * kirjaushetkellä, joten myöhempi ajo kantaan tuottaa saman lopputuloksen.
 */
export function tallentavaKanta(kohde = muisti) {
  const db = (osat, ...arvot) => {
    if (!kohde.rivit.length) kohde.alku = Date.now();
    if (kohde.rivit.length < MUISTI_MAKS) kohde.rivit.push({ q: [...osat], v: arvot.map((a) => (a && a.__json !== undefined ? a : a instanceof Date ? a.toISOString() : a)) });
    return Promise.resolve([]);
  };
  db.json = (x) => ({ __json: x });
  return db;
}

export const puskurinKoko = () => muisti.rivit.length;

/** Erä Blobiin, kun rivejä tai ikää on tarpeeksi (pakota: aina, jos rivejä on). Epäonnistunut erä palautetaan muistiin. */
export async function tyhjennaTarvittaessa({ pakota = false, kohde = muisti, kirjoita = kirjoitaBlob, nyt = Date.now() } = {}) {
  if (!kohde.rivit.length || !onBlob() && kirjoita === kirjoitaBlob) return { kirjoitettu: 0 };
  if (!pakota && kohde.rivit.length < ERA_RIVEJA && nyt - kohde.alku < ERA_IKA_MS) return { kirjoitettu: 0 };
  const era = kohde.rivit.splice(0);
  const alku = kohde.alku;
  try {
    const nimi = `${TAPAHTUMA_ETULIITE}${new Date(nyt).toISOString().replace(/[:.]/g, "-")}-${randomBytes(4).toString("hex")}.json`;
    await kirjoita(nimi, { luotu: new Date(nyt).toISOString(), alku: new Date(alku).toISOString(), rivit: era });
    kohde.alku = kohde.rivit.length ? nyt : 0;
    return { kirjoitettu: era.length, nimi };
  } catch (e) {
    console.error("puskuri Blobiin:", e?.message || e);
    kohde.rivit.unshift(...era.slice(0, MUISTI_MAKS - kohde.rivit.length));
    kohde.alku = alku;
    return { kirjoitettu: 0, virhe: String(e?.message || e) };
  }
}

/** Postgres-kyselyn teksti tallennetuista osista ($1, $2, ...) ja arvot. */
export function kyselyTeksti(rivi) {
  const teksti = rivi.q.reduce((s, osa, i) => (i === 0 ? osa : `${s}$${i}${osa}`), "");
  const arvot = rivi.v.map((a) => (a && typeof a === "object" && "__json" in a ? JSON.stringify(a.__json) : a));
  return { teksti, arvot };
}

const RAKENNE = /^\s*(create table if not exists|alter table|create index if not exists)/i;

/**
 * Blobin tapahtumaerät tietokantaan (valvonta, kun kanta vastaa): jokainen erä yhdessä transaktiossa, sitten poisto.
 * Rakennekyselyt (create table if not exists) ajetaan kerran per ajo.
 */
export async function siirraTapahtumat(db, { listaa = listaaBlob, lue = lueUrl, poista = poistaBlob, aikaa = () => true } = {}) {
  const tulos = { eria: 0, riveja: 0, virheita: 0, jaljella: 0 };
  const blobit = (await listaa(TAPAHTUMA_ETULIITE)).sort((a, b) => String(a.pathname).localeCompare(String(b.pathname)));
  const ajetut = new Set();
  for (const b of blobit) {
    if (!aikaa()) { tulos.jaljella++; continue; }
    try {
      const era = await lue(b.url);
      const rivit = era?.rivit || [];
      await db.begin(async (tx) => {
        for (const r of rivit) {
          const { teksti, arvot } = kyselyTeksti(r);
          if (RAKENNE.test(teksti)) {
            if (ajetut.has(teksti)) continue;
            ajetut.add(teksti);
          }
          await tx.unsafe(teksti, arvot);
        }
      });
      await poista([b.url]);
      tulos.eria++;
      tulos.riveja += rivit.length;
    } catch (e) {
      tulos.virheita++;
      console.error("tapahtumaerä kantaan:", b.pathname, e?.message || e);
    }
  }
  return tulos;
}
