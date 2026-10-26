/**
 * Merchant-syötteen lisäkentät (21.10.2026). Toimii syötteen jokaiselle <item>-lohkolle:
 *  - g:shipping: hinta kassan säännöllä (src/config/toimitus.ts), aiemmin syötteessä aina 0,00 € (ristiriita kassan kanssa)
 *  - g:shipping_label: ilmainen_toimitus | vakiotoimitus
 *  - g:product_type: suomenkielinen tuotetyyppi Google-kategoriasta
 *  - g:identifier_exists: no (omat painotuotteet, ei GTIN:iä)
 *  - g:custom_label_1: sesonki (joulu 1.10.-24.12., muuten ympari_vuoden)
 *  - g:custom_label_0: kateluokka kate-alle-20 | kate-20-30 | kate-30-40 | kate-yli-40 (api/_lib/kateluokat.js,
 *    generoitu Printify-kuluista: scripts/generoi-kateluokat.mjs); puuttuu, jos tuotteen katetta ei tunneta
 *  - g:custom_label_2: myydyin | muut (Printify-tilaukset, api/_lib/kateluokat.js)
 */
import { KATELUOKAT, MYYDYIMMAT } from "./kateluokat.js";

// Peili: src/config/toimitus.ts (ILMAINEN_TOIMITUS_RAJA, TOIMITUSMAKSU). src/config/toimitus.test.ts
// kaatuu, jos arvot eroavat; Vercel-funktio ei tuo TypeScript-tiedostoa src/:stä.
export const ILMAINEN_RAJA = 79;
export const TOIMITUS = 6.9;

const TUOTETYYPIT = [
  [/T-Shirts/, "Vaatteet > T-paidat"],
  [/Coats & Jackets/, "Vaatteet > Hupparit"],
  [/Shirts & Tops/, "Vaatteet > Pitkähihaiset"],
  [/Undershirts/, "Vauvat > Bodyt"],
  [/Sticker/, "Tarrat"],
  [/Artwork|Posters/, "Sisustus > Seinätaulut"],
  [/Blankets/, "Sisustus > Peitot"],
  [/Hats/, "Asusteet > Pipot ja lippikset"],
  [/Handbags/, "Asusteet > Laukut"],
  [/Ornaments/, "Sisustus > Koristeet"],
  [/Pants/, "Vaatteet > Housut"],
];

export function sesonki(nyt = new Date()) {
  const kk = nyt.getUTCMonth() + 1;
  const pv = nyt.getUTCDate();
  return (kk >= 10 && kk <= 11) || (kk === 12 && pv <= 24) ? "joulu" : "ympari_vuoden";
}

const kentta = (item, nimi) => (item.match(new RegExp(`<g:${nimi}>([^<]*)</g:${nimi}>`)) || [])[1];

const slugLinkista = (item) => (item.match(/<g:link>[^<]*\/tuote\/([^<?#/]+)/) || [])[1] || "";

/**
 * @param item yhden <item>-lohkon XML
 * @param opts.kateluokat slug -> kateluokka (oletus api/_lib/kateluokat.js)
 * @param opts.myydyimmat myydyimpien slugit (oletus api/_lib/kateluokat.js)
 */
export function lisaaKentat(item, { nyt = new Date(), kateluokat = KATELUOKAT, myydyimmat = MYYDYIMMAT } = {}) {
  const hinta = parseFloat(kentta(item, "price") || "0");
  const toimitus = hinta >= ILMAINEN_RAJA ? 0 : TOIMITUS;
  const gkat = (kentta(item, "google_product_category") || "").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const tyyppi = (TUOTETYYPIT.find(([re]) => re.test(gkat)) || [null, "Hauskat lahjat"])[1];
  let out = item.replace(/<g:shipping>[\s\S]*?<\/g:shipping>/, `<g:shipping>
        <g:country>FI</g:country>
        <g:service>Posti kotiinkuljetus</g:service>
        <g:price>${toimitus.toFixed(2)} EUR</g:price>
      </g:shipping>`);
  const lisat = [];
  const lisaa = (nimi, arvo) => {
    if (arvo != null && !new RegExp(`<g:${nimi}>`).test(out)) lisat.push(`      <g:${nimi}>${arvo}</g:${nimi}>`);
  };
  lisaa("shipping_label", toimitus === 0 ? "ilmainen_toimitus" : "vakiotoimitus");
  lisaa("product_type", tyyppi.replace(/&/g, "&amp;").replace(/>/g, "&gt;"));
  lisaa("identifier_exists", "no");
  lisaa("custom_label_1", sesonki(nyt));
  const slug = slugLinkista(item);
  lisaa("custom_label_0", Object.prototype.hasOwnProperty.call(kateluokat, slug) ? kateluokat[slug] : null);
  lisaa("custom_label_2", myydyimmat.has(slug) ? "myydyin" : "muut");
  return lisat.length ? out.replace(/\s*<\/item>$/, `\n${lisat.join("\n")}\n    </item>`) : out;
}

export function lisaaKentatSyotteeseen(xml, nyt = new Date(), opts = {}) {
  return xml.replace(/<item>[\s\S]*?<\/item>/g, (item) => lisaaKentat(item, { ...opts, nyt }));
}
