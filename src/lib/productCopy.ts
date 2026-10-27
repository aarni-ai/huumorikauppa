import { cleanProductName } from "@/lib/productNames";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI } from "@/config/toimitus";
import { jouluLause } from "@/data/tilauspaivat";

// Deterministic per-product SEO copy generator.
// Produces UNIQUE long-form Finnish content per product so that product pages
// (and the Google Merchant feed) are not flagged as thin/duplicate.

export interface ProductCopyInput {
  id?: string;
  name: string;
  slug?: string;
  category: string;
  price?: number;
  description?: string;
}

export interface ProductCopy {
  longDescription: string;        // 150-300 sanaa, uniikki
  shortDescription: string;       // 150-160 merkkiä, meta/feed
  audience: string;
  occasions: string;
  whyFunny: string;
  whyBuy: string;
  material: string;
  care: string;
  scenarios: string[];            // 3 short bullets
  giftUseCases: string[];         // 3 short bullets
  feedDescription: string;        // 300-500 merkkiä Google-feediin
}

const CATEGORY_LABEL: Record<string, string> = {
  "t-paidat": "t-paita",
  "hupparit": "huppari",
  "tarrat": "tarra",
  "bodyt": "vauvan body",
  "peitot": "peitto",
  "pipot": "pipo",
  "laukut": "kangaskassi",
  "seinataulut": "seinätaulu",
  "koristeet": "koriste",
  "pitkahihaiset": "pitkähihainen paita",
};

const CATEGORY_PLURAL: Record<string, string> = {
  "t-paidat": "t-paitoja",
  "hupparit": "huppareita",
  "tarrat": "tarroja",
  "bodyt": "bodyja",
  "peitot": "peittoja",
  "pipot": "pipoja",
  "laukut": "kasseja",
  "seinataulut": "seinätauluja",
  "koristeet": "koristeita",
  "pitkahihaiset": "pitkähihaisia paitoja",
};

const CATEGORY_MATERIAL: Record<string, string> = {
  "t-paidat": "Puuvillapaita, tarkka materiaali ja paino ovat tuotekuvauksessa. Saatavilla olevat koot ja värit valitset yllä, ja tuotesivun kokoavusta näet koon valinnan ohjeet.",
  "hupparit": "Pehmeä puuvilla-polyesterisekoite, tarkka koostumus on tuotekuvauksessa. Saatavilla olevat koot ja värit valitset yllä, ja tuotesivun kokoavusta näet koon valinnan ohjeet.",
  "tarrat": "Kestävä vinyylimateriaali UV- ja vesisuojattuna. Pysyy kirkkaana läppärissä, vesipullossa, autossa ja jääkaapissa vuosia.",
  "bodyt": "100 % puuvillaa, pehmeää ja hengittävää vauvan iholle. Painonapit haaroissa, hellävarainen kaulus.",
  "peitot": "Pehmeä polyesterifleece, lämmin ja kevyt. Soveltuu sohva- tai vuodepeitoksi.",
  "pipot": "Akryylineulosta, lämmin ja venyvä. Sopii useimmille pään koolle, brodeerattu kuvio kestää pesun.",
  "laukut": "Kestävää puuvillakangasta, pitkät kantokahvat. Sopii ostoksille ja arkikäyttöön.",
  "seinataulut": "Korkealaatuinen kanvaspohja puukehyksellä. Värit eivät haalistu ja taulu on heti ripustusvalmis.",
  "koristeet": "Kestävä materiaali, sisäkäyttöön. Painatus pysyy kirkkaana vuodesta toiseen.",
  "pitkahihaiset": "Pehmeä ja paksu puuvillasekoite (~200 g/m²), mukava päällä syksyllä ja keväällä.",
};

const CATEGORY_CARE: Record<string, string> = {
  "t-paidat": "Pese nurinpäin enintään 30 °C, ei kloorivalkaisua eikä kemiallista pesua. Tarkka hoito-ohje on tuotekuvauksessa.",
  "hupparit": "Pese nurinpäin enintään 30 °C, ei kloorivalkaisua eikä kemiallista pesua. Tarkka hoito-ohje on tuotekuvauksessa.",
  "tarrat": "Pyyhi puhdas, kuiva pinta ennen liimausta. Vältä jatkuvaa hankausta.",
  "bodyt": "Konepesu max 40 °C, ei valkaisua, silitys keskilämmöllä nurjalta puolelta.",
  "peitot": "Konepesu max 30 °C, ei valkaisua, ei kuivausrumpua.",
  "pipot": "Käsinpesu suositeltava, kuivaus tasolla muodon säilyttämiseksi.",
  "laukut": "Konepesu max 30 °C, ei valkaisua. Painatus kestää useita pesuja.",
  "seinataulut": "Pyyhi pölyt kuivalla, pehmeällä liinalla. Älä käytä kemikaaleja.",
  "koristeet": "Pyyhi tarvittaessa kostealla liinalla. Säilytä kuivassa.",
  "pitkahihaiset": "Konepesu max 30 °C nurinpäin, ei valkaisua, silitys nurjalta puolelta.",
};

function pickAudience(text: string, category: string): string {
  const t = text.toLowerCase();
  if (t.includes("äiti") || t.includes("mamma") || t.includes("mummi")) return "äidille, mummille tai anopille";
  if (t.includes("isä") || t.includes("iskä") || t.includes("ukki") || t.includes("pappa")) return "isälle, ukille, papalle tai sedälle";
  if (t.includes("kala") || t.includes("kalamies")) return "kalastusta harrastavalle kaverille, isälle tai sedälle";
  if (t.includes("eläke") || t.includes("museo")) return "eläkkeelle siirtyvälle työkaverille tai juuri eläköityneelle läheiselle";
  if (t.includes("polttari") || t.includes("morsian") || t.includes("sulhanen")) return "polttariporukalle, morsiamelle tai sulhaselle";
  if (t.includes("vauva") || category === "bodyt") return "vauvalle ja iloisille vanhemmille";
  if (t.includes("girlfriend") || t.includes("tyttöystävä")) return "tyttöystävälle tai puolisolle";
  if (t.includes("boyfriend") || t.includes("poikaystävä")) return "poikaystävälle tai puolisolle";
  if (t.includes("kalju")) return "kaljulle ystävälle, jolla on terve itseironia";
  if (t.includes("sähkömies") || t.includes("rakennus") || t.includes("ammatti")) return "ammattilaisille ja työkavereille jotka arvostavat ammattihuumoria";
  if (t.includes("kaljaa") || t.includes("alkoholi")) return "ystäväporukalle ja iltojen pelastajalle";
  if (t.includes("nörtti") || t.includes("it ")) return "IT-alan ammattilaiselle tai nörttihuumorin ystävälle";
  if (t.includes("auto") || t.includes("mersu") || t.includes("audi") || t.includes("bemari")) return "autoharrastajalle ja konekulkupelin ystävälle";
  if (category === "bodyt") return "vauvalle ja vanhemmille";
  return "kaverille, perheenjäsenelle, työkaverille tai itsellesi";
}

function pickOccasions(text: string, category: string): string {
  const t = text.toLowerCase();
  if (t.includes("äiti")) return "äitienpäivään, äidin syntymäpäiviin, jouluksi ja kiitoslahjaksi";
  if (t.includes("isä") || t.includes("iskä")) return "isänpäivään, isän syntymäpäiviin, jouluksi ja yllätyslahjaksi";
  if (t.includes("eläke")) return "eläkejuhliin, läksiäisiin ja eläköitymispäivään";
  if (t.includes("polttari")) return "polttareihin, hääjuhliin ja kihlausjuhliin";
  if (t.includes("joulu")) return "jouluksi, pikkujouluihin ja joulukalenterin täytteeksi";
  if (category === "bodyt") return "ristiäisiin, vauvanpäiville ja äitiyspakkaukseen";
  return "syntymäpäiviin, jouluun, pikkujouluihin, ystävänpäivään ja yllätyslahjaksi";
}

function categoryNoun(category: string): string {
  return CATEGORY_LABEL[category] || "tuote";
}

function categoryPlural(category: string): string {
  return CATEGORY_PLURAL[category] || "tuotteita";
}

function whyFunnyFor(name: string): string {
  return `${cleanProductName(name)} naurattaa, koska se yhdistää tunnistettavan arkitilanteen ja juuri sopivasti yliampuvan tekstin. Sellaisen lahjan saaja muistaa, ja sitä myös käytetään.`;
}

function whyBuyFor(name: string, category: string): string {
  const noun = categoryNoun(category);
  return `${cleanProductName(name)} on ${noun}, jonka teksti tekee lahjasta henkilökohtaisen. Tuote painetaan tilauksesta ja toimitetaan ${TOIMITUSAIKA_TEKSTI} arkipäivässä, ja ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen toimitus on ilmainen.`;
}

function scenariosFor(name: string, category: string): string[] {
  const noun = categoryNoun(category);
  const items = [
    `Yllätyslahjaksi syntymäpäivään: paketin avaaja nauraa ja muistaa hetken pitkään.`,
    `Pikkujouluihin tai polttareihin: koko porukka tunnistaa vitsin heti.`,
    `Joululahjaksi sukulaiselle, jolle "ei keksi mitään": tämä ${noun} ratkaisee asian.`,
    `Itselle piristykseksi tylsään maanantaiaamuun.`,
    `Lahjaksi työkaverille läksiäisissä tai eläkejuhlissa.`,
  ];
  // pick 3 deterministically by name length
  const start = name.length % items.length;
  return [items[start % items.length], items[(start + 1) % items.length], items[(start + 2) % items.length]];
}

function giftUseCasesFor(category: string): string[] {
  const noun = categoryNoun(category);
  return [
    `Hauska ${noun} päätyy käyttöön eikä jää kaapin perälle.`,
    `Lisää pakettiin oma korttiviesti, joka jatkaa vitsiä.`,
    jouluLause(),
  ];
}

/** Lyhentää tekstin enintään max merkkiin sanarajalta (ei katkaista sanaa kesken). */
export function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:\u2013\u2014-]+$/, "")}…`;
}

/**
 * Generate the full unique copy block for a product.
 */
export function generateProductCopy(p: ProductCopyInput): ProductCopy {
  const name = p.name.trim();
  const noun = categoryNoun(p.category);
  const plural = categoryPlural(p.category);
  const audience = pickAudience(name + " " + (p.description || ""), p.category);
  const occasions = pickOccasions(name + " " + (p.description || ""), p.category);
  const whyFunny = whyFunnyFor(name);
  const whyBuy = whyBuyFor(name, p.category);
  const material = CATEGORY_MATERIAL[p.category] || "Laadukas materiaali, kestävä painatus.";
  const care = CATEGORY_CARE[p.category] || "Hellävarainen pesu suositeltavaa.";
  const scenarios = scenariosFor(name, p.category);
  const giftUseCases = giftUseCasesFor(p.category);

  const longDescription = [
    `${cleanProductName(name)} on hauska ${noun}, joka painetaan tilauksesta. Se sopii ${audience}, kenelle tahansa, joka arvostaa rentoa suomalaista huumoria.`,
    `Tämä ${noun} on lahjavalinta, kun etsit jotain ${occasions}. ${whyFunny}`,
    `Materiaali: ${material} Hoito-ohjeet: ${care}`,
    `${whyBuy}`,
  ].join("\n\n");

  const feedDescription = `${cleanProductName(name)}: hauska ${noun} ${audience}. Sopii ${occasions}. ${material} Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä, ilmainen ${ILMAINEN_RAJA_TEKSTI} eurosta alkaen, 14 päivän peruutusoikeus. Painetaan tilauksesta.`.slice(0, 4900);

  const shortDescription = truncateAtWord(
    `${cleanProductName(name)}: hauska ${noun} Huumorikaupasta. Sopii ${audience}. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä, ilmainen ${ILMAINEN_RAJA_TEKSTI} eurosta alkaen.`,
    158,
  );

  // help linter / future use
  void plural;

  return {
    longDescription,
    shortDescription,
    audience,
    occasions,
    whyFunny,
    whyBuy,
    material,
    care,
    scenarios,
    giftUseCases,
    feedDescription,
  };
}

/**
 * Detect the generic placeholder description from Printify import so we can
 * replace it with rich generated copy.
 */
export function isGenericDescription(d?: string): boolean {
  if (!d) return true;
  const t = sanitizeProductDescription(d).toLowerCase();
  if (t.length < 60) return true;
  if (t.startsWith("hauska tuote huumorikaupasta")) return true;
  return false;
}

/**
 * Poistaa tietokannan tuotekuvauksista lauseet, joiden väitteet eivät pidä paikkaansa
 * (painopaikka, vanha toimitusraja, mukit). Tietokantaa ei voi muokata, joten korjaus tehdään tässä.
 */
const FALSE_CLAIM_SENTENCE =
  /[^.!?\n]*(painettu eu:ssa|painettu suomessa|painetaan suomessa|yli 60 €|\bmuki|mukissa|kahvimuki)[^.!?\n]*[.!?]?/gi; // toimitus-grep: sallittu (tietokannan vanha teksti siivotaan)

export function sanitizeProductDescription(d?: string | null): string {
  if (!d) return "";
  return d.replace(FALSE_CLAIM_SENTENCE, "").replace(/[ \t]{2,}/g, " ").trim();
}
