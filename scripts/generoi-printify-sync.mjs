#!/usr/bin/env node
/**
 * supabase/functions/_shared/printify-sync.ts -> api/_lib/printify-sync.generated.js (esbuild, vain tyypit pois).
 * Vercel-funktio (api/cron/tilaukset.js ?tehtava=eu-siirrot) tarvitsee buildProductRow-funktion, mutta ei voi tuoda
 * TypeScript-tiedostoa Supabase-kansiosta. Testi src/test/printify-sync-generated.test.ts tarkistaa, että tiedosto on
 * ajan tasalla: aja tämä uudelleen, kun printify-sync.ts muuttuu (esim. mainin yhdistämisen jälkeen).
 *
 *   node scripts/generoi-printify-sync.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";

export const LAHDE = fileURLToPath(new URL("../supabase/functions/_shared/printify-sync.ts", import.meta.url));
export const KOHDE = fileURLToPath(new URL("../api/_lib/printify-sync.generated.js", import.meta.url));

export function generoi(lahde = readFileSync(LAHDE, "utf8")) {
  const { code } = transformSync(lahde, { loader: "ts", format: "esm", target: "node18" });
  return [
    "// GENEROITU: node scripts/generoi-printify-sync.mjs (lähde supabase/functions/_shared/printify-sync.ts). Älä muokkaa käsin.",
    "/* eslint-disable */",
    code,
  ].join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(KOHDE, generoi());
  console.log(`Kirjoitettu ${KOHDE}`);
}
