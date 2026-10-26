#!/usr/bin/env node
/**
 * Viikoittainen katetarkistus (GitHub Actions, .github/workflows/katetarkistus.yml).
 *   node scripts/katetarkistus.mjs [--url https://huumorikauppa.fi]
 * Tuotteet: tietokannasta (DATABASE_URL tai POSTGRES_URL), muuten sivuston /api/products. Kate api/_lib/kate.js
 * (heikoin variantti). Jos jokin näkyvä tuote on alle myynnin rajan (20 %) tai sen kulut ovat tuntemattomat, yhteenveto lähetetään
 * sähköpostilla osoitteeseen OMISTAJA_EMAIL (oletus info@seniorituki.fi) Resendillä (RESEND_API_KEY). Ilman avainta
 * työ päättyy virheeseen ja tulostaa yhteenvedon. Huom: /api/products palauttaa vain myynnissä olevat, joten alle 20 %:n
 * tuotteet (jotka kauppa on jo piilottanut) näkyvät vain tietokantatilassa.
 */
import { heikoinKate, KATE_RAJA } from "../api/_lib/kate.js";
import { onPiilotettu } from "../api/_lib/piilotetut.js";
import { laheta, OMISTAJA } from "../api/_lib/sahkoposti.js";

const i = process.argv.indexOf("--url");
const POHJA = (i > 0 ? process.argv[i + 1] : process.env.KAUPPA_URL || "https://huumorikauppa.fi").replace(/\/$/, "");

/** Näkyvien tuotteiden katevalvonta: { tarkistettu, alle, tuntematon } (puhdas, testattava). */
export function katevalvonta(tuotteet) {
  const naytettavat = tuotteet.filter((p) => p.is_active !== false && !onPiilotettu(p.category));
  const alle = [];
  const tuntematon = [];
  for (const p of naytettavat) {
    const k = heikoinKate(p);
    if (!k.tunnettu) tuntematon.push({ slug: p.slug, nimi: p.name, hinta: Number(p.price) });
    else if (!k.sallittu) alle.push({ slug: p.slug, nimi: p.name, hinta: Number(p.price), kate: k.kate, nettokate: k.nettokate });
  }
  alle.sort((a, b) => a.kate - b.kate);
  return { tarkistettu: naytettavat.length, alle, tuntematon };
}

export function yhteenveto(t, lahde) {
  const pros = (x) => `${(x * 100).toFixed(1).replace(".", ",")} %`;
  return [
    `Katetarkistus (${lahde}): ${t.tarkistettu} näkyvää tuotetta, raja ${pros(KATE_RAJA)}.`,
    `Alle rajan: ${t.alle.length}. Kulut tuntemattomat (kassa ei ota maksua): ${t.tuntematon.length}.`,
    ...(t.alle.length ? ["", "Alle rajan:", ...t.alle.slice(0, 100).map((p) => `- ${p.nimi} (${p.slug}): ${pros(p.kate)}, nettokate ${p.nettokate} €, hinta ${p.hinta} €`)] : []),
    ...(t.tuntematon.length ? ["", "Kulut tuntemattomat (aja scripts/printify-tuonti.mjs --kulut):", ...t.tuntematon.slice(0, 50).map((p) => `- ${p.nimi} (${p.slug})`), ...(t.tuntematon.length > 50 ? [`... ja ${t.tuntematon.length - 50} muuta`] : [])] : []),
  ].join("\n");
}

async function lataaTuotteet() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : "require", max: 1, prepare: false });
    try {
      const rivit = await sql`select * from products`;
      return { tuotteet: rivit.map((r) => ({ ...r, price: Number(r.price) })), lahde: "tietokanta" };
    } finally {
      await sql.end();
    }
  }
  const r = await fetch(`${POHJA}/api/products`, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`${POHJA}/api/products: HTTP ${r.status}`);
  return { tuotteet: await r.json(), lahde: `${POHJA}/api/products` };
}

async function main() {
  const { tuotteet, lahde } = await lataaTuotteet();
  const t = katevalvonta(tuotteet);
  const teksti = yhteenveto(t, lahde);
  console.log(teksti);
  if (!t.alle.length && !t.tuntematon.length) return;
  if (!process.env.RESEND_API_KEY) {
    console.log("\nRESEND_API_KEY puuttuu: sähköpostia ei lähetetty, työ merkitään epäonnistuneeksi.");
    process.exitCode = 1;
    return;
  }
  const r = await laheta({
    to: OMISTAJA(),
    subject: `[Huumorikauppa] Katetarkistus: ${t.alle.length} alle ${pros(KATE_RAJA)}, ${t.tuntematon.length} tuntematonta`,
    text: teksti,
    html: `<pre style="font-family:monospace;white-space:pre-wrap">${teksti.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</pre>`,
  });
  if (!r.ok) {
    console.log(`\nSähköposti epäonnistui: ${r.virhe}`);
    process.exitCode = 1;
  } else {
    console.log(`\nYhteenveto lähetetty: ${OMISTAJA()}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e?.message || e);
    process.exit(1);
  });
}
