/**
 * Hallinnan kertakäyttöinen aktivointikoodi (2.11.2026): kun sähköposti ei vielä toimi (Resend-domain vahvistamatta),
 * Coworkin Chrome saa hallintasivujen 90 päivän evästeet syöttämällä lyhyen koodin sivulla /hallinta/aktivoi.
 * Koodi vanhenee 24 tunnissa ja toimii yhden kerran. Kannassa vain koodin SHA-256-tiiviste. Arvaamisen esto: yli
 * VIRHEITA_TUNNISSA epäonnistunutta yritystä tunnissa lukitsee aktivoinnin tunniksi.
 * Koodin luo cron ?tehtava=aktivointikoodi (CRON_SECRET); sitä ei tallenneta repoon.
 */
import { createHash, randomInt } from "node:crypto";

const AAKKOSTO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const VOIMASSA_TUNTIA = 24;
export const VIRHEITA_TUNNISSA = 20;

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
