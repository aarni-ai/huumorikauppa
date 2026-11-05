/**
 * Blob-puskurin valvonta ja siirto kantaan (api/cron/tilaukset.js, tunnin valvonta; 5.11.2026).
 *
 * puskuriValvonta: kun tietokanta ei vastaa. Puskuritilaukset (puskuri/tilaukset/*.json): maksamattomien Stripe-sessioiden
 *   paikkaus (webhook jäi tulematta), Printify-siirron uudelleenyritys kasvavin välein ja omistajan ilmoitus.
 * siirraPuskuri: kun tietokanta vastaa. Puskuritilaukset orders-tauluun samalla id:llä (tapahtumat order_events-tauluun),
 *   seurantaerät kantaan (api/_lib/puskuri.js siirraTapahtumat), sitten Blob-tiedostot poistetaan.
 * Neonin kulutus: heräämiset (pg_postmaster_start_time) tauluun db_heratykset ja kuukauden CU-tuntiarvio mittariin.
 */
import { TILAUS_ETULIITE, listaaBlob, poistaBlob, siirraTapahtumat } from "./puskuri.js";
import { blobTilausVarasto, kasitteleMaksu, lahetaPrintifyyn, ilmoitaOmistajalle } from "./tilaus.js";
import { onStripe, stripe } from "./stripe.js";

const VALMIS = ["tuotannossa", "lahetetty", "ei_tarvita", "pysaytetty"];
const idPolusta = (p) => String(p).slice(TILAUS_ETULIITE.length).replace(/\.json$/, "");

export async function puskuriValvonta({ kuiva = false, aikaa = () => true, varasto = blobTilausVarasto(), listaa = listaaBlob, nyt = new Date() } = {}) {
  const loki = [];
  const blobit = await listaa(TILAUS_ETULIITE);
  for (const b of blobit) {
    if (!aikaa()) { loki.push("aika loppui"); break; }
    const id = idPolusta(b.pathname);
    const t = await varasto.hae(id);
    if (!t) continue;
    if (t.status === "odottaa_maksua" && t.stripe_session_id && onStripe()) {
      const s = await stripe().checkout.sessions.retrieve(t.stripe_session_id).catch(() => null);
      if (s?.payment_status === "paid") {
        loki.push(`puskuri: paikkaus ${id.slice(0, 8)}`);
        if (!kuiva) await kasitteleMaksu(s);
      } else if (s?.status === "expired" && !kuiva) {
        await varasto.paivita(id, { status: "peruttu" });
        const { vapautaPuskuriVaraukset } = await import("./tilaus.js");
        await vapautaPuskuriVaraukset(t);
      }
      continue;
    }
    if (t.status === "maksettu" && !VALMIS.includes(t.printify_status) && (!t.next_retry_at || new Date(t.next_retry_at) <= nyt)) {
      loki.push(`puskuri: Printify ${id.slice(0, 8)}`);
      if (!kuiva) {
        const r = await lahetaPrintifyyn(id, varasto);
        await ilmoitaOmistajalle(id, varasto);
        loki.push(`  ${r.ok ? "tuotannossa" : `${r.vaihe}: ${r.viesti}`}`);
      }
    }
  }
  return { tilauksia: blobit.length, loki };
}

/** Puskuritilauksen rivi orders-tauluun: vain taulun sarakkeet, jsonb-kentät db.json:lla. */
export function tilausRivi(t, sarakkeet, db) {
  const json = new Set(["items", "shipping_address"]);
  const rivi = {};
  for (const [k, v] of Object.entries(t)) {
    if (!sarakkeet.has(k) || v === undefined) continue;
    rivi[k] = json.has(k) ? db.json(v ?? (k === "items" ? [] : {})) : v;
  }
  return rivi;
}

export async function siirraPuskuri(db, { aikaa = () => true, varasto = blobTilausVarasto(), listaa = listaaBlob, poista = poistaBlob } = {}) {
  const tulos = { tilauksia: 0, virheita: 0, tapahtumat: null };
  const blobit = await listaa(TILAUS_ETULIITE);
  if (blobit.length) {
    // Puskurikassan lisäkentät (A/B-versiot, lähde, koon esivalinta): sarakkeet varmistetaan kuten kassan kantapolulla.
    await db`alter table orders add column if not exists ab_versio text, add column if not exists toimitus_versio text,
      add column if not exists toimitus_kate numeric, add column if not exists ensitilaus_versio text,
      add column if not exists ensitilaus_kate numeric, add column if not exists ensitilaus_alennus numeric,
      add column if not exists lahde text, add column if not exists koko_versio text`.catch((e) => console.error("orders-sarakkeet:", e?.message));
    const sarakkeet = new Set((await db`select column_name from information_schema.columns where table_name = 'orders'`).map((r) => r.column_name));
    for (const b of blobit) {
      if (!aikaa()) break;
      const id = idPolusta(b.pathname);
      try {
        const t = await varasto.hae(id);
        if (!t) continue;
        const rivi = tilausRivi(t, sarakkeet, db);
        const paivitys = Object.keys(rivi).filter((k) => k !== "id");
        await db.begin(async (tx) => {
          await tx`insert into orders ${tx(rivi)} on conflict (id) do update set ${tx(rivi, paivitys)}`;
          for (const e of t.tapahtumat || []) {
            await tx`insert into order_events (order_id, kind, details, created_at) values (${id}, ${e.kind}, ${tx.json(e.details || {})}, ${e.created_at})`;
          }
          await tx`insert into order_events (order_id, kind, details) values (${id}, 'puskurista_kantaan', ${tx.json({ blob: b.pathname })})`;
        });
        await poista([b.url]);
        tulos.tilauksia++;
      } catch (e) {
        tulos.virheita++;
        console.error("puskuritilaus kantaan:", id, e?.message || e);
      }
    }
  }
  tulos.tapahtumat = await siirraTapahtumat(db, { aikaa });
  // Koodit (kumppanit, tilaajat, lahjakorttien käytöt, kertakäyttöiset) tilausten jälkeen: lahjakorttikäyttö viittaa tilaukseen.
  try {
    const K = await import("./koodit.js");
    tulos.koodit = await K.siirraKoodit(db, { aikaa });
  } catch (e) {
    tulos.koodit = { virhe: String(e?.message || e) };
  }
  return tulos;
}

// ---------- Neonin kulutus ----------

export const NEON_KIINTIO_CUH = 100;
export const NEON_MIN_CU = 0.25;
export const NEON_TAUKO_MIN = 5;

/** Heräämisen kirjaus (kanta on jo hereillä, joten kirjaus ei lisää kulutusta). Ei kaada kutsujaa. */
export async function kirjaaHeratys(db) {
  try {
    await db`create table if not exists db_heratykset (alku timestamptz primary key, viimeksi timestamptz not null)`;
    await db`insert into db_heratykset (alku, viimeksi) values (pg_postmaster_start_time(), now())
      on conflict (alku) do update set viimeksi = greatest(db_heratykset.viimeksi, excluded.viimeksi)`;
  } catch (e) {
    console.error("db_heratykset:", e?.message || e);
  }
}

/**
 * Kuukauden CU-tunnit heräämisistä: (viimeksi - alku + 5 min tauko) x 0,25 CU. Alaraja: autoskaalaus yli 0,25 CU:n ja
 * kirjaamattomat kyselyt eivät näy. Ennuste = käytetty / kulunut osa kuukaudesta. NEON_API_KEY ja
 * DATABASE_NEON_PROJECT_ID ympäristössä: Neonin oma luku (compute_time_seconds) korvaa arvion.
 */
export function neonArvio(rivit, nyt = new Date()) {
  const kkAlku = new Date(Date.UTC(nyt.getUTCFullYear(), nyt.getUTCMonth(), 1));
  const kkLoppu = new Date(Date.UTC(nyt.getUTCFullYear(), nyt.getUTCMonth() + 1, 1));
  let tunnit = 0;
  let heratyksia = 0;
  for (const r of rivit) {
    const alku = new Date(r.alku);
    const loppu = new Date(Math.min(new Date(r.viimeksi).getTime() + NEON_TAUKO_MIN * 60000, nyt.getTime()));
    if (loppu <= kkAlku) continue;
    const a = Math.max(alku.getTime(), kkAlku.getTime());
    tunnit += Math.max(0, loppu.getTime() - a) / 3600e3;
    heratyksia++;
  }
  const cuh = tunnit * NEON_MIN_CU;
  const osuus = (nyt - kkAlku) / (kkLoppu - kkAlku);
  const ennuste = osuus > 0 ? cuh / osuus : cuh;
  return { lahde: "arvio", cuh: Math.round(cuh * 10) / 10, ennuste: Math.round(ennuste * 10) / 10, heratyksia, kiintio: NEON_KIINTIO_CUH };
}

export async function neonKulutus(db, { nyt = new Date(), hae = fetch } = {}) {
  const avain = process.env.NEON_API_KEY;
  const projekti = process.env.DATABASE_NEON_PROJECT_ID || process.env.NEON_PROJECT_ID;
  if (avain && projekti) {
    try {
      const r = await hae(`https://console.neon.tech/api/v2/projects/${encodeURIComponent(projekti)}`, { headers: { Authorization: `Bearer ${avain}` }, signal: AbortSignal.timeout(8000) });
      const p = r.ok ? (await r.json())?.project : null;
      if (p && Number.isFinite(Number(p.compute_time_seconds))) {
        const cuh = Number(p.compute_time_seconds) / 3600;
        const alku = p.consumption_period_start ? new Date(p.consumption_period_start) : new Date(Date.UTC(nyt.getUTCFullYear(), nyt.getUTCMonth(), 1));
        const loppu = p.consumption_period_end ? new Date(p.consumption_period_end) : new Date(Date.UTC(nyt.getUTCFullYear(), nyt.getUTCMonth() + 1, 1));
        const osuus = Math.max(0.01, (nyt - alku) / (loppu - alku));
        return { lahde: "neon", cuh: Math.round(cuh * 10) / 10, ennuste: Math.round((cuh / osuus) * 10) / 10, kiintio: NEON_KIINTIO_CUH };
      }
    } catch { /* arvio */ }
  }
  const kkAlku = new Date(Date.UTC(nyt.getUTCFullYear(), nyt.getUTCMonth(), 1));
  const rivit = await db`select alku, viimeksi from db_heratykset where viimeksi >= ${kkAlku}`.catch(() => []);
  return neonArvio(rivit, nyt);
}

/** Hälytys, jos ennuste ylittää 80 % kiintiöstä tai käytetty jo 70 %. */
export function neonHalytys(k) {
  if (!k) return null;
  if (k.ennuste >= k.kiintio * 0.8 || k.cuh >= k.kiintio * 0.7) {
    return `HÄLYTYS: Neonin kulutus ${k.cuh} CU-h tässä kuussa, ennuste ${k.ennuste} CU-h (ilmainen kiintiö ${k.kiintio}). Kauppa toimii ilman kantaa, mutta tilastojen ja tilausten siirto kantaan pysähtyy, jos kiintiö loppuu.`;
  }
  return null;
}

export const neonRivi = (k) => (k ? `Neonin kulutus tässä kuussa: ${k.cuh} CU-h, ennuste ${k.ennuste} / ${k.kiintio} CU-h (${k.lahde === "neon" ? "Neonin luku" : `arvio heräämisistä, ${k.heratyksia} kpl, alaraja`})` : null);
