/**
 * Merchant-syötteen lisäkentät (21.10.2026). Toimii syötteen jokaiselle <item>-lohkolle:
 *  - g:shipping: hinta kassan säännöllä (6,90 €, ilmainen 79 €:sta), aiemmin syötteessä aina 0,00 € (ristiriita kassan kanssa)
 *  - g:shipping_label: ilmainen_toimitus | vakiotoimitus
 *  - g:product_type: suomenkielinen tuotetyyppi Google-kategoriasta
 *  - g:identifier_exists: no (omat painotuotteet, ei GTIN:iä)
 *  - g:custom_label_1: sesonki (joulu 1.10.-24.12., muuten ympari_vuoden)
 *  - g:custom_label_0: kateluokka (kate_yli_50 | kate_40_50), vain jos kate tunnetaan (oma tausta, Printify-kulut)
 */
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

/** @param item yhden <item>-lohkon XML  @param kate valinnainen kate (0-1) */
export function lisaaKentat(item, { kate = null, nyt = new Date() } = {}) {
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
  if (typeof kate === "number") lisaa("custom_label_0", kate >= 0.5 ? "kate_yli_50" : "kate_40_50");
  return lisat.length ? out.replace(/\s*<\/item>$/, `\n${lisat.join("\n")}\n    </item>`) : out;
}

export function lisaaKentatSyotteeseen(xml, kateIdlle = () => null, nyt = new Date()) {
  return xml.replace(/<item>[\s\S]*?<\/item>/g, (item) => lisaaKentat(item, { kate: kateIdlle(kentta(item, "id")), nyt }));
}
