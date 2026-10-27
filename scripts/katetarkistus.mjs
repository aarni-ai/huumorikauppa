#!/usr/bin/env node
/**
 * Katetarkistus käsiajona koneelta. Viikoittainen ajo: Vercel Cron (/api/cron/tilaukset?tehtava=katetarkistus,
 * laskenta api/_lib/katevalvonta.js).
 *   node scripts/katetarkistus.mjs [--url https://huumorikauppa.fi]
 * Tuotteet: tietokannasta (DATABASE_URL tai POSTGRES_URL), muuten sivuston /api/products. Kate api/_lib/kate.js
 * (heikoin variantti). Jos jokin näkyvä tuote on alle myynnin rajan (20 %) tai sen kulut ovat tuntemattomat, yhteenveto lähetetään
 * sähköpostilla osoitteeseen OMISTAJA_EMAIL (Vercelin ympäristömuuttuja; oletus huumorikauppa@gmail.com) Resendillä (RESEND_API_KEY). Ilman avainta
 * työ päättyy virheeseen ja tulostaa yhteenvedon. Huom: /api/products palauttaa vain myynnissä olevat, joten alle 20 %:n
 * tuotteet (jotka kauppa on jo piilottanut) näkyvät vain tietokantatilassa.
 */
import { laheta, OMISTAJA } from "../api/_lib/sahkoposti.js";
import { katevalvonta, yhteenveto, katetarkistusAihe, htmlEsi } from "../api/_lib/katevalvonta.js";

export { katevalvonta, yhteenveto };

const i = process.argv.indexOf("--url");
const POHJA = (i > 0 ? process.argv[i + 1] : process.env.KAUPPA_URL || "https://huumorikauppa.fi").replace(/\/$/, "");

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
    subject: katetarkistusAihe(t),
    text: teksti,
    html: htmlEsi(teksti),
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
