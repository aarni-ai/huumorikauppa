// Teemapohjaiset merkkipäivätuotteiden nostot blogiartikkeleille.
//
// `selectMilestoneHighlights(slug)` luokittelee artikkelin slugin perusteella ja palauttaa
// aiheeseen sopivan tuotejoukon (tai null, jos aihe ei sovi: tarrat, vauva, lemmikit, sauna,
// kalastus jne.). Slug on luotettavampi aiheen ilmaisin kuin tagit (joissa on ristiinmyyntiä).

// --- Tuotepoolit (t-paidat hero-tuotteina, mukit omana poolina) ---
const MEN = [
  "30v-selka-alkaa-jo-rusahdella-t-paita",
  "30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-t-paita",
  "40v-kunnossa-niinku-20v-t-paita",
  "40-vuotta-henkisesti-18-t-paita",
  "40v-ei-keski-ika-klassikko-t-paita",
  "50v-puoli-vuosisataa-ei-naarmuakaan-t-paita",
  "50-ja-paras-vasta-tulossa-t-paita",
  "60v-mutta-fyysinen-kunto-kuin-20v-t-paita",
  "60-vuotta-nuori-t-paita",
  "60v-takuu-mennyt-toimii-silti-t-paita",
];
const WOMEN = [
  "30-nuori-villi-ja-jo-vasynyt-t-paita",
  "30v-paranen-ian-myota-kuin-viini-t-paita",
  "40v-henkisesti-18-tyylilla-40-t-paita",
  "40-ja-fabulous-t-paita",
  "40v-ei-vanha-vintage-t-paita",
  "50-ja-hopeanhohtoinen-vain-hiukset-t-paita",
  "50-vuotta-nuori-t-paita",
  "60v-mutta-sydan-kuin-20v-t-paita",
  "60-vuotta-nuori-ja-nokkela-t-paita",
  "60v-kokenut-ei-vanha-t-paita",
];
const ELAKE = [
  "elakkeella-kiireinen-tekemaan-ei-mitaan-t-paita",
  "virallisesti-tyoton-epavirallisesti-vapaa-t-paita",
  "40-vuotta-toita-nyt-ikuinen-viikonloppu-t-paita",
  "elakelainen-aamuheratys-vapaaehtoinen-t-paita",
  "elakkeella-kiireinen-tekemaan-ei-mitaan-muki",
  "virallisesti-tyoton-epavirallisesti-vapaa-muki",
];
const AGE50 = [
  "50v-puoli-vuosisataa-ei-naarmuakaan-t-paita",
  "50-ja-paras-vasta-tulossa-t-paita",
  "50-ja-hopeanhohtoinen-vain-hiukset-t-paita",
  "50-vuotta-nuori-t-paita",
  "50-ja-paras-vasta-tulossa-muki",
  "50-ja-hopeanhohtoinen-vain-hiukset-muki",
];
const MUGS = [
  "30v-selka-alkaa-jo-rusahdella-muki",
  "40-vuotta-henkisesti-18-muki",
  "50-ja-paras-vasta-tulossa-muki",
  "60v-takuu-mennyt-toimii-silti-muki",
  "40v-henkisesti-18-tyylilla-40-muki",
  "50-ja-hopeanhohtoinen-vain-hiukset-muki",
  "60-vuotta-nuori-ja-nokkela-muki",
  "virallisesti-tyoton-epavirallisesti-vapaa-muki",
];
// Tasapainoinen poikkileikkaus (miehet/naiset/eläke) yleisille lahjaoppaille.
const MIX = [
  "30v-selka-alkaa-jo-rusahdella-t-paita",
  "40v-kunnossa-niinku-20v-t-paita",
  "50v-puoli-vuosisataa-ei-naarmuakaan-t-paita",
  "60v-mutta-fyysinen-kunto-kuin-20v-t-paita",
  "40-ja-fabulous-t-paita",
  "50-ja-hopeanhohtoinen-vain-hiukset-t-paita",
  "60v-mutta-sydan-kuin-20v-t-paita",
  "elakkeella-kiireinen-tekemaan-ei-mitaan-t-paita",
];

export interface MilestoneHighlight {
  title: string;
  slugs: string[];
  ctaLink: string;
  ctaLabel: string;
}

export function selectMilestoneHighlights(slug: string): MilestoneHighlight | null {
  const s = slug.toLowerCase();
  const has = (...k: string[]) => k.some((w) => s.includes(w));

  // Selvästi epäsopivat aiheet → ei nostoa.
  if (has("tarra", "vauva", "body", "koira", "kissa", "saun", "kalast", "nört", "nort",
    "gamer", "peli", "opettaja", "urheilij", "liikunta", "pipo", "peit", "lauk", "kassi",
    "seinataulu", "polttari", "teini", "juhannu", "valmistujais", "mökki", "mokki")) return null;

  const mies = has("miehelle", "isälle", "isalle", "isänpäiv", "isanpaiv", "setä", "seta");
  const nainen = has("naiselle", "äiti", "aiti", "äitienpäiv", "aitienpaiv");

  if (mies && nainen) return { title: "Hauskat syntymäpäivälahjat", slugs: MIX, ctaLink: "/kaikki-tuotteet", ctaLabel: "Katso kaikki hauskat lahjat" };
  if (has("muki", "kahvi", "toimisto", "tyokave", "työkave", "pomo", "alle-20")) {
    return { title: "Hauskat merkkipäivämukit", slugs: MUGS, ctaLink: "/kategoria/mukit", ctaLabel: "Katso kaikki mukit" };
  }
  if (has("eläke", "elake", "elakkeel")) return { title: "Hauskat eläkelahjat", slugs: ELAKE, ctaLink: "/elakelahjat", ctaLabel: "Katso kaikki eläkelahjat" };
  if (has("50-vuotia", "50v")) return { title: "Hauskat 50-vuotislahjat", slugs: AGE50, ctaLink: "/kaikki-tuotteet", ctaLabel: "Katso kaikki lahjaideat" };
  if (mies) return { title: "Hauskat lahjat miehelle", slugs: MEN, ctaLink: "/hauskat-lahjat-miehelle", ctaLabel: "Katso kaikki miesten lahjat" };
  if (nainen) return { title: "Hauskat lahjat naiselle", slugs: WOMEN, ctaLink: "/hauskat-lahjat-naiselle", ctaLabel: "Katso kaikki naisten lahjat" };
  if (has("syntymäpäiv", "syntymapaiv", "merkkipäiv", "merkkipaiv", "ikävuos", "ikavuos",
    "jolla-on-jo-kaikkea", "vuotiaalle")) {
    return { title: "Hauskat syntymäpäivälahjat", slugs: MIX, ctaLink: "/kaikki-tuotteet", ctaLabel: "Katso kaikki hauskat lahjat" };
  }
  if (has("alle-30", "budjet", "edullin", "joulu", "kaverille", "meemi", "miksi-hauska",
    "hauskat-lahjat", "hauska-lahja", "lahjaopas", "t-paita")) {
    return { title: "Hauskat merkkipäivälahjat", slugs: MIX, ctaLink: "/kaikki-tuotteet", ctaLabel: "Katso kaikki hauskat lahjat" };
  }
  return null;
}
