/**
 * Somevideoiden lataus Vercel Blobiin kaupan palvelimen kautta (3.11.2026, @vercel/blob client upload). Palvelin luo
 * handleUploadilla lyhytikäisen lataustokenin omalla BLOB_READ_WRITE_TOKENillaan; kone lataa tiedoston suoraan Blobiin
 * tällä tokenilla (scripts/some-blob.mjs --palvelin). Lukuavainta ei tarvita koneella.
 *
 * Reitti: POST /api/cron/tilaukset?tehtava=blob-lataus (Authorization: Bearer CRON_SECRET). Token annetaan vain
 * somekansion ja lahjaoppaan (media/lahjaopas, PDF) tiedostoille, oikealle tiedostotyypille, enintään 50 Mt ja 10 minuutiksi. Manifesti ylikirjoitetaan
 * samaan osoitteeseen (/hallinta/some lukee sen), muut tiedostot saavat satunnaisen päätteen.
 */
// 3.11.2026 ilta: myös Pinterest- ja Shopping-lisäkuvat (some/pinterest, some/shopping) sekä lahjaoppaan medialle
// vaakakuvat ja PDF (scripts/pinterest-kuvat.mjs, some-blob.mjs --lisakuvat, lahjaopas-media*.mjs --palvelin).
export const BLOB_POLKU = /^(?:some\/(?:videot\/[a-z0-9-]{1,120}\.(?:mp4|jpg)|(?:pinterest|shopping)\/[a-z0-9-]{1,120}\.jpg|JULKAISUT\.md|manifest\.json)|media\/lahjaopas\/[a-z0-9-]{1,120}\.jpg|media\/huumorikauppa-lahjaopas-2026\.pdf)$/;
const TYYPIT = { mp4: "video/mp4", jpg: "image/jpeg", pdf: "application/pdf" };
export const MAKS_TAVUA = 50 * 1024 * 1024;
export const VOIMASSA_MS = 10 * 60 * 1000;

/** Tokenin ehdot polulle, tai null, jos polkua ei sallita. */
export function latausEhdot(pathname, nyt = Date.now()) {
  const polku = String(pathname || "");
  if (!BLOB_POLKU.test(polku)) return null;
  const yhteiset = { maximumSizeInBytes: MAKS_TAVUA, validUntil: nyt + VOIMASSA_MS };
  if (polku === "some/manifest.json") return { ...yhteiset, allowedContentTypes: ["application/json"], addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 };
  if (polku === "some/JULKAISUT.md") return { ...yhteiset, allowedContentTypes: ["text/*"], addRandomSuffix: true, allowOverwrite: false };
  return { ...yhteiset, allowedContentTypes: [TYYPIT[polku.split(".").pop()]], addRandomSuffix: true, allowOverwrite: false };
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
