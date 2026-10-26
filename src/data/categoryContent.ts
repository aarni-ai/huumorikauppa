/**
 * Kategoriasivujen otsikot ja tekstiosiot. Yhteinen lähde CategoryPage-komponentille ja
 * build-vaiheen esirenderöinnille (scripts/prerender.mjs).
 */
import { getPriorityRank } from "@/lib/productPriority";
export const CATEGORY_H1: Record<string, string> = {
  "t-paidat": "Hauskat t-paidat",
  "hupparit": "Hauskat hupparit",
  "tarrat": "Hauskat tarrat",
  "bodyt": "Hauskat bodyt pienimmille",
  "peitot": "Hauskat peitot",
  "pipot": "Hauskat pipot",
  "laukut": "Hauskat laukut ja kassit",
  "seinataulut": "Hauskat seinätaulut",
  "koristeet": "Hauskat koristeet",
  "pitkahihaiset": "Hauskat pitkähihaiset paidat",
};

// Category-specific H2 text sections for richer SEO
export const CATEGORY_H2_SECTIONS: Record<string, { h2: string; text: string }[]> = {
  "t-paidat": [
    { h2: "Miksi hauska t-paita on hyvä lahja?", text: "Hauskat t-paidat ja huumoripaidat ovat lahjoja jotka naurattavat, ilahduttavat ja tulevat oikeasti käyttöön. Ne sopivat syntymäpäiviin, polttareihin, joululahjaksi ja kaikkeen muuhun. Meiltä löydät satoja erilaisia huumoripaitoja - meemipaitoja, setähuumoripaitoja, kalastuspaitoja ja paljon muuta." },
    { h2: "Huumoripaidat ja hauskat t-paidat", text: "Valikoimastamme löydät muun muassa setähuumoripaitoja, eläkeläispaitoja, ammattihuumoripaitoja ja meemipaitoja. Kaikissa hauskoissa t-paidoissa on laadukas DTG-painatus ja mukava istuvuus koissa XS-3XL." },
  ],
  "hupparit": [
    { h2: "Miksi hauska huppari on hyvä lahja?", text: "Hauska huppari yhdistää lämmön ja huumorin. Se on käytännöllinen, mukava ja hauska lahja kenelle tahansa. Valikoimastamme löydät meemihuppareita, setähuumorihuppareita ja sarkastisia tekstihuppareita." },
    { h2: "Huumorihupparit", text: "Valikoimastamme löydät muun muassa 'Maailman paras' -sarjan huppareita, kalastushuppareita ja eläkehuumorihuppareita. Laadukas materiaali ja kestävä painatus." },
  ],
  "tarrat": [
    { h2: "Mihin hauskoja tarroja voi käyttää?", text: "Hauskat tarrat sopivat läppäriin, vesipulloon ja lahjan kylkeen. Tarra on myös pieni lahja tai lisä isomman paketin oheen." },
  ],
  "bodyt": [
    { h2: "Miksi hauska body on hyvä vauvalahja?", text: "Hauska lahja ilahduttaa vauvaperhettä. Se naurattaa koko perhettä." },
  ],
  "peitot": [
    { h2: "Miksi hauska lämmin lahja ilahduttaa?", text: "Hauska lahja pitää lämpimänä ja hymyilyttää. Se sopii syntymäpäiviin, jouluun tai eläkejuhliin." },
  ],
  "pipot": [
    { h2: "Miksi hauska pipo on hyvä talvilahja?", text: "Hauska pipo yhdistää käytännöllisyyden ja huumorin: se pitää pään lämpimänä ja tunnelman korkealla. Laadukkaat materiaalit ja hauska brodeeraus tekevät pipostamme mukavan talvilahjan." },
  ],
  "laukut": [
    { h2: "Miksi hauska kangaskassi on hyvä lahja?", text: "Hauska kangaskassi on ekologinen, käytännöllinen ja hauska, kolme ominaisuutta jotka tekevät siitä hyvän lahjan. Kassimme sopivat arkikäyttöön, ostoksille ja kaikkialle muuallekin." },
  ],
  "seinataulut": [
    { h2: "Miksi hauska sisustus sopii kotiin?", text: "Hauska sisustus piristää kotia ja tuo hymyn huulille joka päivä." },
  ],
  "koristeet": [
    { h2: "Miksi hauska koriste on hyvä lahja?", text: "Hauska koriste tuo huumoria kodin jokaiseen nurkkaan. Se on yllättävä ja persoonallinen lahja joka sopii syntymäpäiviin, tupaantuliaisiin ja jouluun." },
  ],
  "pitkahihaiset": [
    { h2: "Miksi valita pitkähihainen?", text: "Pitkähihainen hauska paita on erinomainen valinta syksylle ja keväälle. Se toimii myös kerrostettuna takin alla talvella. Laadukas materiaali ja kestävä painatus." },
  ],
};

function isCustomTextProduct(name: string, description: string): boolean {
  const t = (name + ' ' + description).toLowerCase();
  return t.includes('oma teksti') || t.includes('oma kuva') || t.includes('custom text') || t.includes('personoi');
}

// Kategoriakohtaiset "kielletyt" avainsanat tuotenimessä - estää esim. mukin näkymisen T-paidat-sivulla,
// jos tuotteen kategoria on virheellisesti tallennettu.
const CATEGORY_EXCLUDE_NAME_KEYWORDS: Record<string, string[]> = {
  "t-paidat":      ["muki", "kuppi", "huppari", "pipo", "tarra", "kassi", "laukku", "peitto", "taulu", "body"],
  "hupparit":      ["muki", "kuppi", "t-paita", "tpaita", "pipo", "tarra", "kassi", "peitto", "taulu", "body"],
  "mukit":         ["t-paita", "tpaita", "huppari", "pipo", "tarra", "kassi", "peitto", "taulu", "body"],
  "pitkahihaiset": ["muki", "kuppi", "huppari", "pipo", "tarra", "kassi", "peitto", "taulu", "body"],
};

function matchesCategoryStrictly(name: string, slug: string | undefined): boolean {
  if (!slug) return true;
  const banned = CATEGORY_EXCLUDE_NAME_KEYWORDS[slug];
  if (!banned) return true;
  const n = name.toLowerCase();
  return !banned.some(k => n.includes(k));
}

// Printify folded/flat mockups look like packaged shirts. Push them to the bottom.
function isFoldedImage(url?: string): boolean {
  if (!url) return false;
  return /camera_label=(folded|flat)/i.test(url);
}
function garmentSortWeight(p: { images?: string[] }): number {
  return isFoldedImage(p.images?.[0]) ? 1 : 0;
}

type CategoryProductLike = { name: string; description: string; category: string; images?: string[] };

/** Kategoriasivun tuotelista samassa järjestyksessä kuin CategoryPage näyttää sen. */
export function selectCategoryProducts<T extends CategoryProductLike>(all: T[], slug: string | undefined): T[] {
  const categoryProducts = all.filter((p) => p.category === slug && matchesCategoryStrictly(p.name, slug));
  const nonCustomProducts = categoryProducts.filter((p) => !isCustomTextProduct(p.name, p.description));
  return [...(nonCustomProducts.length > 0 ? nonCustomProducts : categoryProducts)].sort((a, b) => {
    // Priority best-sellers absolutely first
    const pr = getPriorityRank(a) - getPriorityRank(b);
    if (pr !== 0) return pr;
    // Then push folded/flat mockups to the bottom
    return garmentSortWeight(a) - garmentSortWeight(b);
  });
}
