/**
 * Somevideoiden lataus Vercel Blobiin kaupan palvelimen kautta (3.11.2026, @vercel/blob client upload). Palvelin luo
 * handleUploadilla lyhytikäisen lataustokenin omalla BLOB_READ_WRITE_TOKENillaan; kone lataa tiedoston suoraan Blobiin
 * tällä tokenilla (scripts/some-blob.mjs --palvelin). Lukuavainta ei tarvita koneella.
 *
 * Reitti: POST /api/cron/tilaukset?tehtava=blob-lataus (Authorization: Bearer CRON_SECRET). Token annetaan vain
 * somekansion tiedostoille, oikealle tiedostotyypille, enintään 50 Mt ja 10 minuutiksi. Manifesti ylikirjoitetaan
 * samaan osoitteeseen (/hallinta/some lukee sen), muut tiedostot saavat satunnaisen päätteen.
 */
export const BLOB_POLKU = /^some\/(?:videot\/[a-z0-9-]{1,120}\.(mp4|jpg)|(JULKAISUT\.md)|(manifest\.json))$/;
const TYYPIT = { mp4: "video/mp4", jpg: "image/jpeg" };
export const MAKS_TAVUA = 50 * 1024 * 1024;
export const VOIMASSA_MS = 10 * 60 * 1000;

/** Tokenin ehdot polulle, tai null, jos polkua ei sallita. */
export function latausEhdot(pathname, nyt = Date.now()) {
  const m = BLOB_POLKU.exec(String(pathname || ""));
  if (!m) return null;
  const yhteiset = { maximumSizeInBytes: MAKS_TAVUA, validUntil: nyt + VOIMASSA_MS };
  if (m[3]) return { ...yhteiset, allowedContentTypes: ["application/json"], addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 };
  if (m[2]) return { ...yhteiset, allowedContentTypes: ["text/*"], addRandomSuffix: true, allowOverwrite: false };
  return { ...yhteiset, allowedContentTypes: [TYYPIT[m[1]]], addRandomSuffix: true, allowOverwrite: false };
}

/** handleUpload-kutsu: vain tokenin luonti (valmistumisilmoituksia ei käytetä). */
export async function luoLatausToken(req, body) {
  if (body?.type !== "blob.generate-client-token") return { status: 400, json: { error: "vain blob.generate-client-token" } };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { status: 503, json: { error: "Blob-varasto puuttuu" } };
  const { handleUpload } = await import("@vercel/blob/client");
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const ehdot = latausEhdot(pathname);
        if (!ehdot) throw new Error(`polku ei sallittu: ${String(pathname).slice(0, 80)}`);
        return ehdot;
      },
    });
    return { status: 200, json };
  } catch (e) {
    return { status: 400, json: { error: e.message } };
  }
}
