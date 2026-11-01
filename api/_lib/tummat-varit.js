/**
 * Tumma painatus tummalla pohjalla pois myynnistä (1.11.2026). Lista: api/_lib/tummat-varit.generated.js
 * (scripts/tummat-varit.mjs, painokuvan ja pohjavärin kontrasti). Väri poistetaan tuoterivistä kokonaan
 * valmisteleRivi-vaiheessa (api/_lib/tuotteet.js), joten se katoaa tuotesivulta, kassasta (variant_map) ja
 * Merchant-syötteestä (kuvat ja värit). Printifyssä samat variantit on poistettu käytöstä.
 */
import TUMMAT from "./tummat-varit.generated.js";

export { TUMMAT };

/** Mockup-kuvan variantti-id: images-api.printify.com/mockup/<tuote>/<variantti>/... */
const kuvanVariantti = (url) => Number((String(url).match(/\/mockup\/[0-9a-f]+\/(\d+)\//) || [])[1]) || null;

export function poistaTummatVarit(p, lista = TUMMAT) {
  const pois = lista[p?.slug];
  const v = p?.variants;
  if (!pois?.length || !v?.variant_map) return p;
  const poisJoukko = new Set(pois);
  const kartta = Object.entries(v.variant_map);
  const jaljella = Object.fromEntries(kartta.filter(([a]) => !poisJoukko.has(a.split("|")[0])));
  // Turva: ei koskaan tyhjennetä tuotetta (generaattori jättää aina vähintään yhden värin).
  if (!Object.keys(jaljella).length) return p;
  const poisIdt = new Set(kartta.filter(([a]) => poisJoukko.has(a.split("|")[0])).map(([, id]) => Number(id)));
  const variants = { ...v, variant_map: jaljella };
  if (Array.isArray(v.colors)) variants.colors = v.colors.filter((c) => !poisJoukko.has(c));
  if (v.variant_images) variants.variant_images = Object.fromEntries(Object.entries(v.variant_images).filter(([c]) => !poisJoukko.has(c)));
  if (variants.default_color && poisJoukko.has(variants.default_color)) variants.default_color = variants.colors?.[0] ?? null;
  // Kuva pois, jos sen variantti on poistetun värin tai URL on poistetun värin variant_images-listassa (pääkuva voi tulla
  // variantilta, joka ei ole variant_mapissa, esim. ei myynnissä oleva koko).
  const ilmanKyselya = (u) => String(u).split("?")[0];
  const poisUrlit = new Set(pois.flatMap((c) => v.variant_images?.[c] || []).map(ilmanKyselya));
  const poisKuvanIdt = new Set([...poisUrlit].map(kuvanVariantti).filter(Boolean));
  const images = Array.isArray(p.images)
    ? p.images.filter((u) => !poisIdt.has(kuvanVariantti(u)) && !poisKuvanIdt.has(kuvanVariantti(u)) && !poisUrlit.has(ilmanKyselya(u)))
    : p.images;
  const unavailable = Array.isArray(p.unavailable_variants) ? p.unavailable_variants.filter((a) => !poisJoukko.has(String(a).split("|")[0])) : p.unavailable_variants;
  return { ...p, variants, images: images?.length ? images : p.images, ...(unavailable !== undefined ? { unavailable_variants: unavailable } : {}) };
}
