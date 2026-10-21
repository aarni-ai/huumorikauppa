#!/usr/bin/env node
/**
 * Saatavuustarkistus (GitHub Actions, .github/workflows/saatavuus.yml, päivittäin).
 *   node scripts/saatavuus.mjs [--url https://huumorikauppa.fi]
 * - GET /, /kategoria/t-paidat ja /kassa: odotetaan 200 ja HTML.
 * - POST /api/checkout tyhjällä rungolla: odotetaan JSON-vastausta. 5xx on virhe, paitsi dokumentoitu 503
 *   "not_configured" (kassa ei käytössä tässä ympäristössä), joka on varoitus.
 * Päättyy koodiin 1, jos jokin tarkistus epäonnistuu.
 */
const i = process.argv.indexOf("--url");
const POHJA = (i > 0 ? process.argv[i + 1] : process.env.KAUPPA_URL || "https://huumorikauppa.fi").replace(/\/$/, "");
const UA = "HuumorikauppaSaatavuus/1.0 (+https://huumorikauppa.fi)";

/** Kassan vastauksen arvio (testattava): { ok, varoitus, viesti }. */
export function arvioiKassa(status, sisaltotyyppi, runko) {
  let json = null;
  try { json = JSON.parse(runko); } catch { /* ei JSONia */ }
  if (!json || !/json/i.test(sisaltotyyppi || "")) return { ok: false, viesti: `POST /api/checkout: ei JSON-vastausta (HTTP ${status}, ${sisaltotyyppi || "ei tyyppiä"})` };
  if (status === 503 && json?.diagnostics?.error_stage === "not_configured") return { ok: true, varoitus: true, viesti: "POST /api/checkout: 503 not_configured (kassa ei ole käytössä tässä ympäristössä)" };
  if (status >= 500) return { ok: false, viesti: `POST /api/checkout: HTTP ${status} ${runko.slice(0, 200)}` };
  return { ok: true, viesti: `POST /api/checkout: HTTP ${status}, JSON ok` };
}

async function main() {
  const virheet = [];
  const rivit = [];
  for (const polku of ["/", "/kategoria/t-paidat", "/kassa"]) {
    const alku = Date.now();
    try {
      const r = await fetch(`${POHJA}${polku}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
      const html = await r.text();
      const ms = Date.now() - alku;
      if (r.status !== 200) virheet.push(`GET ${polku}: HTTP ${r.status}`);
      else if (!/<div id="root"/.test(html)) virheet.push(`GET ${polku}: sivun runko puuttuu`);
      rivit.push(`GET ${polku}: HTTP ${r.status} (${ms} ms)`);
    } catch (e) {
      virheet.push(`GET ${polku}: ${e?.cause?.code || e?.message || e}`);
    }
  }
  try {
    const r = await fetch(`${POHJA}/api/checkout`, {
      method: "POST",
      headers: { "User-Agent": UA, "Content-Type": "application/json" },
      body: "",
      signal: AbortSignal.timeout(30000),
    });
    const a = arvioiKassa(r.status, r.headers.get("content-type"), await r.text());
    rivit.push(a.viesti);
    if (!a.ok) virheet.push(a.viesti);
  } catch (e) {
    virheet.push(`POST /api/checkout: ${e?.cause?.code || e?.message || e}`);
  }
  console.log(`Saatavuus ${POHJA}\n${rivit.map((r) => `  ${r}`).join("\n")}`);
  if (virheet.length) {
    console.log(`\nVIRHEET:\n${virheet.map((v) => `  - ${v}`).join("\n")}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
