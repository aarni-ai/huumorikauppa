/**
 * Vercel Blob -lataus ilman Blob-avainta koneella (3.11.2026): lyhytikäinen lataustoken kaupan palvelimelta
 * (POST /api/cron/tilaukset?tehtava=blob-lataus, CRON_SECRET tiedostosta .env.cron.local; sallitut polut
 * api/_lib/blob-lataus.js), ja tiedosto ladataan suoraan Blobiin (@vercel/blob client upload).
 * Käyttö: some-blob.mjs, lahjaopas-media.mjs ja lahjaopas-media-pdf.mjs valitsimella --palvelin.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const JUURI = new URL("../..", import.meta.url).pathname;

export async function palvelimenPut(pathname, body, { contentType, multipart } = {}) {
  const { put: clientPut } = await import("@vercel/blob/client");
  const tiedosto = join(JUURI, ".env.cron.local");
  const salaisuus = process.env.CRON_SECRET || (existsSync(tiedosto) ? (readFileSync(tiedosto, "utf8").match(/^CRON_SECRET=["']?([^"'\n]+)/m) || [])[1] : "");
  const kauppa = process.env.KAUPPA || "https://huumorikauppa-five.vercel.app";
  const r = await fetch(`${kauppa}/api/cron/tilaukset?tehtava=blob-lataus`, {
    method: "POST",
    headers: { Authorization: `Bearer ${salaisuus}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "blob.generate-client-token", payload: { pathname, clientPayload: null, multipart: Boolean(multipart) } }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.clientToken) throw new Error(`lataustoken ${pathname}: ${r.status} ${j.error || ""}`);
  return clientPut(pathname, body, { access: "public", token: j.clientToken, contentType, multipart });
}
