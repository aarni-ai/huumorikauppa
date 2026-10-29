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
import TOP50 from "./top50.generated.js";
import { KATELUOKAT, MYYDYIMMAT } from "./kateluokat.js";

/** Kate (0-1) -> custom_label_0 (samat rajat kuin scripts/generoi-kateluokat.mjs). */
export function kateluokka(kate) {
  if (kate < 0.2) return "kate-alle-20";
  if (kate < 0.3) return "kate-20-30";
  if (kate < 0.4) return "kate-30-40";
  return "kate-yli-40";
}

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
/**
 * Lisäkuvat (29.10.2026): lifestyle- ja ympäristökuvat ensin, sitten muut etukuvat, lopuksi takakuvat. Pääkuva
 * (image_link) pysyy selkeänä etukuvana (api/_lib/syote-korjaukset.js).
 */
const KUVAJARJESTYS = ["lifestyle", "context", "front", "front-collar-closeup", "back", "back-2"];
export function jarjestaLisakuvat(item) {
  const kuvat = [...item.matchAll(/<g:additional_image_link>([^<]*)<\/g:additional_image_link>/g)].map((m) => m[1]);
  if (kuvat.length < 2) return item;
  const kulma = (u) => (decodeURIComponent(u).match(/camera_label=([a-z0-9-]+)/) || [])[1] || "";
  const sija = (u) => { const i = KUVAJARJESTYS.indexOf(kulma(u)); return i < 0 ? KUVAJARJESTYS.length : i; };
  const jarjestetty = kuvat.map((u, i) => ({ u, i })).sort((a, b) => sija(a.u) - sija(b.u) || a.i - b.i).map((x) => x.u);
  let k = 0;
  return item.replace(/<g:additional_image_link>[^<]*<\/g:additional_image_link>/g, () => `<g:additional_image_link>${jarjestetty[k++]}</g:additional_image_link>`);
}

/** custom_label_3: kampanjoitava teema otsikon ja slugin perusteella. */
export function teemaluokka(teksti) {
  const t = String(teksti).toLowerCase();
  if (/joulu|tonttu|pukki|pikkujoulu/.test(t)) return "joulu";
  if (/eläk|elak/.test(t)) return "elakelaiselle";
  if (/\bisä|isälle|isalle|iskä|faija/.test(t)) return "isalle";
  if (/äiti|aiti|äidille|mummo|vaimo|naiselle/.test(t)) return "naiselle";
  if (/(^|[^0-9])(30|40|50|60|70)(v|-vuo| vuo| ja)/.test(t)) return "ikavuosi";
  if (/kalast|metsäst|metsast|golf|mökki|mokki|autoil|remont|maanviljel|it-ihmi|koodar|sähkö|putki/.test(t)) return "harrastus-ammatti";
  if (/tonnin|seteli|oispa|tunarit|aatana|kalju|amatimies|meemi/.test(t)) return "meemi";
  return "muut";
}

/** custom_label_4 "top50": api/_lib/top50.generated.js (myydyimmät, suosituimmuussäännöt, Search Consolen ikävuosihaut). */
export const onTop50 = (slug) => TOP50.has(slug);

export function lisaaKentat(item, { nyt = new Date(), kate = null, kateluokat = KATELUOKAT, myydyimmat = MYYDYIMMAT } = {}) {
  const hinta = parseFloat(kentta(item, "price") || "0");
  const toimitus = hinta >= ILMAINEN_RAJA ? 0 : TOIMITUS;
  const gkat = (kentta(item, "google_product_category") || "").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const tyyppi = (TUOTETYYPIT.find(([re]) => re.test(gkat)) || [null, "Hauskat lahjat"])[1];
  // Toimitusaika 3-10 arkipäivää (src/config/toimitus.ts): valmistus 2-5 ja kuljetus 1-5 arkipäivää.
  let out = item.replace(/<g:shipping>[\s\S]*?<\/g:shipping>/, `<g:shipping>
        <g:country>FI</g:country>
        <g:service>Posti kotiinkuljetus</g:service>
        <g:price>${toimitus.toFixed(2)} EUR</g:price>
        <g:min_handling_time>2</g:min_handling_time>
        <g:max_handling_time>5</g:max_handling_time>
        <g:min_transit_time>1</g:min_transit_time>
        <g:max_transit_time>5</g:max_transit_time>
      </g:shipping>`);
  out = jarjestaLisakuvat(out);
  const lisat = [];
  const lisaa = (nimi, arvo) => {
    if (arvo != null && !new RegExp(`<g:${nimi}>`).test(out)) lisat.push(`      <g:${nimi}>${arvo}</g:${nimi}>`);
  };
  lisaa("shipping_label", toimitus === 0 ? "ilmainen_toimitus" : "vakiotoimitus");
  lisaa("product_type", tyyppi.replace(/&/g, "&amp;").replace(/>/g, "&gt;"));
  lisaa("identifier_exists", "no");
  lisaa("custom_label_1", sesonki(nyt));
  const slug = slugLinkista(item);
  // Oma tausta: elävä kate tietokannan Printify-kuluista (opts.kate), muuten generoitu kateluokka (kateluokat.js).
  lisaa("custom_label_0", typeof kate === "number" ? kateluokka(kate) : Object.prototype.hasOwnProperty.call(kateluokat, slug) ? kateluokat[slug] : null);
  lisaa("custom_label_2", myydyimmat.has(slug) ? "myydyin" : "muut");
  lisaa("custom_label_3", teemaluokka(`${kentta(out, "title") || ""} ${slug}`));
  lisaa("custom_label_4", onTop50(slug) ? "top50" : "muut");
  if (!/<g:free_shipping_threshold>/.test(out)) {
    lisat.push(`      <g:free_shipping_threshold>
        <g:country>FI</g:country>
        <g:price_threshold>${ILMAINEN_RAJA.toFixed(2)} EUR</g:price_threshold>
      </g:free_shipping_threshold>`);
  }
  return lisat.length ? out.replace(/\s*<\/item>$/, `\n${lisat.join("\n")}\n    </item>`) : out;
}

/**
 * @param toinen Date (main) tai funktio tuote-id -> kate 0-1 (oma tausta). Kumpikin muoto käy.
 */
export function lisaaKentatSyotteeseen(xml, toinen = new Date(), opts = {}) {
  const kateIdlle = typeof toinen === "function" ? toinen : () => null;
  const nyt = toinen instanceof Date ? toinen : opts.nyt ?? new Date();
  return xml.replace(/<item>[\s\S]*?<\/item>/g, (item) => lisaaKentat(item, { ...opts, nyt, kate: kateIdlle(kentta(item, "id")) }));
}
