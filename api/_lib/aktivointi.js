/**
 * Hallinnan kertakäyttöinen aktivointikoodi (2.11.2026): kun sähköposti ei vielä toimi (Resend-domain vahvistamatta),
 * Coworkin Chrome saa hallintasivujen 90 päivän evästeet syöttämällä lyhyen koodin sivulla /hallinta/aktivoi.
 * Koodi vanhenee 24 tunnissa ja toimii yhden kerran. Kannassa vain koodin SHA-256-tiiviste. Arvaamisen esto: yli
 * VIRHEITA_TUNNISSA epäonnistunutta yritystä tunnissa lukitsee aktivoinnin tunniksi.
 * Koodin luo cron ?tehtava=aktivointikoodi (CRON_SECRET); sitä ei tallenneta repoon.
 *
 * Taikalinkki (2.11.2026): Cowork ei syötä koodeja. Linkki /hallinta/aktivoi?t=<tunniste> (256-bittinen satunnainen
 * tunniste) aktivoi selaimen avattaessa, vanhenee 48 tunnissa ja toimii kerran. Sivu lähettää tunnisteen JavaScriptillä,
 * joten sähköpostin linkkiskannerit (ei JavaScriptiä) eivät kuluta linkkiä. Linkki lähetetään sähköpostilla
 * (cron ?tehtava=aktivointilinkki-viesti) ja päivän yhteenvedossa, kun edellisestä aktivoinnista on yli
 * UUSI_LINKKI_PAIVAN_JALKEEN päivää (eväste on voimassa 90 päivää).
 */
import { createHash, randomBytes, randomInt } from "node:crypto";

const AAKKOSTO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const VOIMASSA_TUNTIA = 24;
export const VIRHEITA_TUNNISSA = 20;
export const LINKKI_VOIMASSA_TUNTIA = 48;
export const EVASTE_PAIVAA = 90;
export const UUSI_LINKKI_PAIVAN_JALKEEN = 80;
const LINKKI = /^[A-Za-z0-9_-]{43}$/;
const linkinTiiviste = (t) => createHash("sha256").update(`linkki:${t}`).digest("hex");

export const tiiviste = (koodi) => createHash("sha256").update(normalisoi(koodi)).digest("hex");
export const normalisoi = (koodi) => String(koodi || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Uusi koodi muotoa XXXX-XXXX (40 bittiä). */
export function uusiKoodi() {
  let s = "";
  for (let i = 0; i < 8; i++) s += AAKKOSTO[randomInt(32)];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

async function varmista(db) {
  await db`create table if not exists hallinta_aktivoinnit (tiiviste text primary key, luotu timestamptz not null default now(),
    vanhenee timestamptz not null, kaytetty timestamptz)`;
  await db`create table if not exists hallinta_aktivointivirheet (id bigserial primary key, aika timestamptz not null default now())`;
}

export async function luoAktivointikoodi(db) {
  await varmista(db);
  const koodi = uusiKoodi();
  const [r] = await db`insert into hallinta_aktivoinnit (tiiviste, vanhenee) values (${tiiviste(koodi)}, now() + ${`${VOIMASSA_TUNTIA} hours`}::interval)
    returning vanhenee`;
  return { koodi, vanhenee: r.vanhenee };
}

/** { ok: true } tai { ok: false, syy: "lukittu" | "virheellinen" }. Onnistunut käyttö merkitsee koodin käytetyksi. */
export async function kaytaAktivointikoodi(db, koodi) {
  await varmista(db);
  const [{ n }] = await db`select count(*)::int as n from hallinta_aktivointivirheet where aika > now() - interval '1 hour'`;
  if (n >= VIRHEITA_TUNNISSA) return { ok: false, syy: "lukittu" };
  const r = normalisoi(koodi).length === 8
    ? await db`update hallinta_aktivoinnit set kaytetty = now() where tiiviste = ${tiiviste(koodi)} and kaytetty is null and vanhenee > now() returning tiiviste`
    : [];
  if (r.length) return { ok: true };
  await db`insert into hallinta_aktivointivirheet default values`;
  return { ok: false, syy: "virheellinen" };
}

/** Uusi taikalinkki: { linkki, vanhenee }. Kannassa vain tiiviste. */
export async function luoAktivointilinkki(db, pohja = process.env.KAUPPA_URL || "https://huumorikauppa.fi") {
  await varmista(db);
  const t = randomBytes(32).toString("base64url");
  const [r] = await db`insert into hallinta_aktivoinnit (tiiviste, vanhenee) values (${linkinTiiviste(t)}, now() + ${`${LINKKI_VOIMASSA_TUNTIA} hours`}::interval)
    returning vanhenee`;
  return { linkki: `${String(pohja).replace(/\/$/, "")}/hallinta/aktivoi?t=${t}`, vanhenee: r.vanhenee };
}

/** Taikalinkin käyttö: { ok: true } tai { ok: false, syy }. Sama arvauslukko kuin koodeilla. */
export async function kaytaAktivointilinkki(db, t) {
  await varmista(db);
  const [{ n }] = await db`select count(*)::int as n from hallinta_aktivointivirheet where aika > now() - interval '1 hour'`;
  if (n >= VIRHEITA_TUNNISSA) return { ok: false, syy: "lukittu" };
  const r = LINKKI.test(String(t || ""))
    ? await db`update hallinta_aktivoinnit set kaytetty = now() where tiiviste = ${linkinTiiviste(t)} and kaytetty is null and vanhenee > now() returning tiiviste`
    : [];
  if (r.length) return { ok: true };
  await db`insert into hallinta_aktivointivirheet default values`;
  return { ok: false, syy: "virheellinen" };
}

/**
 * Tarvitaanko päivän yhteenvetoon uusi linkki: viimeisin aktivointi (koodi tai linkki) yli UUSI_LINKKI_PAIVAN_JALKEEN
 * päivää sitten tai ei koskaan. { tarvitaan, viimeisin, vanhenee } (vanhenee = evästeen arvioitu päättyminen).
 */
export async function evasteenTila(db) {
  await varmista(db);
  const [r] = await db`select max(kaytetty) as viimeisin from hallinta_aktivoinnit where kaytetty is not null`;
  const viimeisin = r?.viimeisin ? new Date(r.viimeisin) : null;
  const vanhenee = viimeisin ? new Date(viimeisin.getTime() + EVASTE_PAIVAA * 864e5) : null;
  const tarvitaan = !viimeisin || Date.now() - viimeisin.getTime() > UUSI_LINKKI_PAIVAN_JALKEEN * 864e5;
  return { tarvitaan, viimeisin, vanhenee };
}

/** Sähköposti Coworkille: taikalinkki ja ohje. */
export function aktivointilinkkiViesti(linkki, vanhenee) {
  const pvm = new Intl.DateTimeFormat("fi-FI", { timeZone: "Europe/Helsinki", dateStyle: "short", timeStyle: "short" }).format(new Date(vanhenee));
  const rivit = [
    "Hallinnan aktivointilinkki Coworkille",
    "Avaa linkki Chromen profiilissa \"Huumorikauppa\". Avaus antaa tälle selaimelle 90 päivän pääsyn sivuille /hallinta/mittarit, /hallinta/some ja /hallinta/tarjoukset. Koodia ei tarvitse syöttää.",
    `Linkki toimii kerran ja vanhenee ${pvm}. Älä jaa sitä eteenpäin.`,
    "Sama selain jätetään jatkossa pois kävijäluvuista, joten Coworkin omat käynnit eivät näy mittarissa.",
  ];
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;line-height:1.5;color:#1a1a1a"><h3>${esc(rivit[0])}</h3>`
    + `<p>${esc(rivit[1])}</p><p><a href="${esc(linkki)}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Aktivoi hallinta tässä selaimessa</a></p>`
    + `<p>${esc(rivit[2])}</p><p>${esc(rivit[3])}</p></div>`;
  return { subject: "Hallinnan aktivointilinkki Coworkille", html, text: [rivit[0], "", rivit[1], "", linkki, "", rivit[2], rivit[3]].join("\n") };
}
