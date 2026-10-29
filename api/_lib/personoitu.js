/**
 * Personoitu t-paita (29.10.2026): asiakas valitsee mallin ja kirjoittaa nimen ja iän, tuotesivu näyttää
 * esikatselun, ja maksun jälkeen Printifyyn luodaan tilaus lennosta luotavalla tuotteella (print_areas) ja
 * tilauskohtaisella painokuvalla (api/painokuva.js). Pohja Gildan Softstyle 64000, OPT OnDemand (Tšekki, pp 30).
 *
 * Kassalle tuote on virtuaalinen tuoterivi (PERSONOITU_TUOTE) samassa muodossa kuin tietokannan rivit, joten hinta,
 * katevahti, variantit ja toimitus lasketaan kuten muillekin. Variantit ja kulut amatimies-t-paidan riviltä
 * (sama pohja ja painotalo, Printifyn variantti-id:t ovat katalogin id:t).
 *
 * Personointi tallentuu ostoskorin customText-kenttään luettavassa muodossa "Malli: Nimi 50v", ja palvelin jäsentää
 * ja tarkistaa sen uudelleen (jasennaPersonointi).
 */
import { HINNASTO } from "./vakiot.js";

export const PERSONOITU_SLUG = "personoitu-ikapaita-t-paita";
export const PERSONOITU_PRINTIFY = "PERSONOITU";
export const PERSONOITU_POHJA = { blueprint_id: 145, print_provider_id: 30 };
export const PERSONOITU_HINTA = HINNASTO.personoitu;
/** Painoalue (catalog/blueprints/145/print_providers/30/variants.json, front). */
export const PAINOALUE = { leveys: 3461, korkeus: 3955 };
export const NIMI_MAX = 14;

/** Mallit: 4 myydyintä ikävuositeemaa ja Amatimies (etusivun suosituimmuussäännöt). */
export const MALLIT = [
  { id: "kokenut", nimi: "Kokenut, ei vanha", ika: true, rivit: (n, i) => [`${n} ${i}v`, "kokenut, ei vanha"] },
  { id: "nuori", nimi: "Vuotta nuori", ika: true, rivit: (n, i) => [n, `${i} vuotta nuori`] },
  { id: "paras", nimi: "Paras vasta tulossa", ika: true, rivit: (n, i) => [`${n} ${i}`, "ja paras vasta tulossa"] },
  { id: "takuu", nimi: "Takuu mennyt, toimii silti", ika: true, rivit: (n, i) => [`${n} ${i}v`, "takuu mennyt, toimii silti"] },
  { id: "amatimies", nimi: "Amatimies", ika: false, rivit: (n) => ["amatimies", n] },
];

/**
 * Estetyt sanat (kirosanat, solvaukset, väkivalta, ääriliikkeet). PITKAT haetaan mistä kohdasta tahansa, LYHYET vain
 * sanan alusta, jottei esimerkiksi nimi Tapani tai Panu esty. Vertailu pienaakkosilla, numerot kirjaimiksi.
 */
const PITKAT = [
  "vittu", "perkele", "saatana", "helvet", "paska", "kyrpä", "kyrpa", "mulkku", "huora", "lutka", "neekeri", "ryssä",
  "ryssa", "mutakuono", "natsi", "hitler", "raiskaa", "tappaa", "fuck", "shit", "bitch", "cunt", "nigger", "nigga",
  "whore", "porno", "nussi",
];
const LYHYET = ["vitu", "kusi", "pillu", "homo", "neeke", "kill", "fag", "sex", "kuole"];

const normalisoi = (s) => String(s).toLowerCase().normalize("NFC").replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s");

/** Onko teksti sallittu (ei estettyä sanaa, ei osoitteita). */
export function sallittuTeksti(s) {
  if (/https?:|www\.|@|\.(fi|com|net)\b/i.test(String(s))) return false;
  const n = normalisoi(s);
  const yhteen = n.replace(/[^a-zåäö]/g, "");
  if (PITKAT.some((e) => yhteen.includes(e))) return false;
  const sanat = n.split(/[^a-zåäö]+/).filter(Boolean);
  return !sanat.some((w) => LYHYET.some((e) => w.startsWith(e)));
}

/**
 * Tarkistaa personoinnin: { malli, nimi, ika } -> { ok: true, malli, nimi, ika } tai { ok: false, virhe }.
 * Nimi 1-14 merkkiä (kirjaimet, välilyönti, väliviiva, heittomerkki), ikä 18-110, kun malli vaatii sen.
 */
export function tarkistaPersonointi({ malli, nimi, ika }) {
  const m = MALLIT.find((x) => x.id === malli);
  if (!m) return { ok: false, virhe: "Valitse malli." };
  const n = String(nimi ?? "").trim().replace(/\s+/g, " ");
  if (!n) return { ok: false, virhe: "Kirjoita nimi." };
  if (n.length > NIMI_MAX) return { ok: false, virhe: `Nimessä voi olla enintään ${NIMI_MAX} merkkiä.` };
  if (!/^[\p{L}][\p{L}' -]*$/u.test(n)) return { ok: false, virhe: "Nimessä voi olla vain kirjaimia, välilyönti ja väliviiva." };
  if (!sallittuTeksti(n)) return { ok: false, virhe: "Tätä nimeä ei voi painaa. Kirjoita toinen nimi." };
  let i = null;
  if (m.ika) {
    i = Number.parseInt(String(ika ?? ""), 10);
    if (!Number.isInteger(i) || i < 18 || i > 110) return { ok: false, virhe: "Kirjoita ikä numerona (18-110)." };
  }
  return { ok: true, malli: m.id, nimi: n, ika: i };
}

/** Ostoskorin customText: "Kokenut, ei vanha: Marja 50v". */
export function personointiTeksti({ malli, nimi, ika }) {
  const m = MALLIT.find((x) => x.id === malli);
  return `${m.nimi}: ${nimi}${m.ika ? ` ${ika}v` : ""}`;
}

/** customText -> tarkistettu personointi tai { ok: false }. */
export function jasennaPersonointi(teksti) {
  const s = String(teksti ?? "").trim();
  for (const m of MALLIT) {
    if (!s.startsWith(`${m.nimi}: `)) continue;
    const loput = s.slice(m.nimi.length + 2);
    const osuma = m.ika ? /^(.+) (\d{1,3})v$/.exec(loput) : [null, loput];
    if (!osuma) return { ok: false, virhe: "Personointi puuttuu." };
    return tarkistaPersonointi({ malli: m.id, nimi: osuma[1], ika: osuma[2] });
  }
  return { ok: false, virhe: "Personointi puuttuu." };
}

/** Tummalle paidalle valkoinen teksti, vaalealle musta. */
export const TUMMAT = new Set(["Musta", "Tummansininen"]);
export const tekstinVari = (vari) => (TUMMAT.has(vari) ? "#ffffff" : "#111111");

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Painokuvan SVG (sama selaimen esikatselussa ja palvelimen PNG:ssä). Anton, versaalit, kaksi riviä keskitettynä;
 * fonttikoko pienenee pitkillä riveillä, jotta teksti mahtuu painoalueen leveyteen (Antonin merkin leveys noin 0,46 em).
 */
export function painokuvaSvg({ malli, nimi, ika }, vari, { leveys = PAINOALUE.leveys, korkeus = PAINOALUE.korkeus, fontti = "Anton" } = {}) {
  const m = MALLIT.find((x) => x.id === malli);
  const [r1, r2] = m.rivit(nimi, ika).map((r) => r.toUpperCase());
  const koko = (r, max) => Math.min(max, Math.floor((leveys * 0.92) / (Math.max(r.length, 1) * 0.46)));
  const k1 = koko(r1, leveys * 0.2);
  const k2 = koko(r2, leveys * 0.13);
  const vali = Math.round(k2 * 0.35);
  const y1 = Math.round(korkeus * 0.12 + k1);
  const y2 = y1 + vali + k2;
  const v = tekstinVari(vari);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${leveys}" height="${korkeus}" viewBox="0 0 ${leveys} ${korkeus}">` +
    `<text x="${leveys / 2}" y="${y1}" font-family="${fontti}" font-size="${k1}" fill="${v}" text-anchor="middle">${xml(r1)}</text>` +
    `<text x="${leveys / 2}" y="${y2}" font-family="${fontti}" font-size="${k2}" fill="${v}" text-anchor="middle">${xml(r2)}</text>` +
    `</svg>`;
}

export const PERSONOITU_VARIANTIT = {"Musta|S": 38164, "Musta|M": 38178, "Musta|L": 38192, "Musta|XL": 38206, "Musta|2XL": 38220, "Musta|3XL": 42122, "Musta|4XL": 66213, "Musta|5XL": 95180, "Valkoinen|S": 38163, "Valkoinen|M": 38177, "Valkoinen|L": 38191, "Valkoinen|XL": 38205, "Valkoinen|2XL": 38219, "Valkoinen|3XL": 42120, "Valkoinen|4XL": 66211, "Vaaleanharmaa|S": 38162, "Vaaleanharmaa|M": 38176, "Vaaleanharmaa|L": 38190, "Vaaleanharmaa|XL": 38204, "Vaaleanharmaa|2XL": 38218, "Vaaleanharmaa|3XL": 42119, "Vaaleanharmaa|4XL": 66210, "Tummansininen|S": 38161, "Tummansininen|M": 38175, "Tummansininen|L": 38189, "Tummansininen|XL": 38203, "Tummansininen|2XL": 38217, "Tummansininen|3XL": 42118, "Tummansininen|4XL": 66208};
const KULUT = {"38161": 890, "38162": 890, "38163": 890, "38164": 890, "38175": 890, "38176": 890, "38177": 890, "38178": 890, "38189": 890, "38190": 890, "38191": 890, "38192": 890, "38203": 890, "38204": 890, "38205": 890, "38206": 890, "38217": 890, "38218": 890, "38219": 890, "38220": 890, "42118": 993, "42119": 993, "42120": 993, "42122": 993, "66208": 993, "66210": 993, "66211": 993, "66213": 993, "95180": 993};

/** Virtuaalinen tuoterivi kassalle (sama muoto kuin tietokannan products-rivi). */
export const PERSONOITU_TUOTE = {
  id: "personoitu-ikapaita",
  slug: PERSONOITU_SLUG,
  name: "Personoitu ikäpaita | T-Paita",
  category: "t-paidat",
  price: PERSONOITU_HINTA,
  stock: 99,
  is_active: true,
  supplier: "printify",
  description: "T-paita, johon painetaan saajan nimi ja ikä. Gildan Softstyle 64000, painetaan tilauksesta EU:ssa.",
  images: [],
  printify_product_id: PERSONOITU_PRINTIFY,
  variants: {
    variant_map: PERSONOITU_VARIANTIT,
    costs: KULUT,
    colors: ["Musta", "Valkoinen", "Vaaleanharmaa", "Tummansininen"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    default_color: "Musta",
    shipping_cents: 849,
    shipping_additional_cents: 119,
    print_provider_id: 30,
    personoitu: true,
  },
};

export const onPersonoitu = (p) => p?.slug === PERSONOITU_SLUG || p?.printify_product_id === PERSONOITU_PRINTIFY;
