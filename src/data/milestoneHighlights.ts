// Teemapohjaiset merkkipäivätuotteiden nostot blogiartikkeleille.
//
// `selectMilestoneHighlights(slug)` luokittelee artikkelin slugin perusteella ja palauttaa
// aiheeseen sopivan tuotejoukon (tai null, jos aihe ei sovi: tarrat, vauva, lemmikit, sauna,
// kalastus jne.). Slug on luotettavampi aiheen ilmaisin kuin tagit (joissa on ristiinmyyntiä).
// Kolme ikäoppaan slugia palauttavat nullin, koska ne saavat ikäryhmittäin jaotellut
// suositukset (GuideProductRecommendations).

// --- Tuotepoolit (t-paidat hero-tuotteina, mukit omana poolina) ---
const MEN = [
  "level-30-selka-rusahtaa-nyt-t-paita",
  "30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-t-paita",
  "40v-kunto-kuin-20v-20-vuotta-sitten-t-paita",
  "40-vuotta-henkisesti-18-t-paita",
  "40v-ei-keski-ika-klassikko-t-paita",
  "50v-puoli-vuosisataa-ei-naarmuakaan-t-paita",
  "50-ja-paras-vasta-tulossa-t-paita",
  "60v-mutta-fyysinen-kunto-kuin-20v-t-paita",
  "60-vuotta-nuori-t-paita",
  "60v-takuu-mennyt-toimii-silti-t-paita",
];
const WOMEN = [
  "30-ja-loistossaan-t-paita",
  "30v-paranen-ian-myota-kuin-viini-t-paita",
  "40v-henkisesti-18-tyylilla-40-t-paita",
  "40-ja-fabulous-t-paita",
  "40v-ei-vanha-vintage-t-paita",
  "50-ja-hopeanhohtoinen-vain-hiukset-t-paita",
  "50v-klassikkomalli-t-paita",
  "60v-mutta-sydan-kuin-20v-t-paita",
  "60-vuotta-nuori-ja-nokkela-t-paita",
  "60v-kokenut-ei-vanha-t-paita",
];
const ELAKE = [
  "elakkeella-kiireinen-tekemaan-ei-mitaan-t-paita",
  "virallisesti-tyoton-epavirallisesti-vapaa-t-paita",
  "40-vuotta-toita-nyt-ikuinen-viikonloppu-t-paita",
  "elakelainen-aamuheratys-vapaaehtoinen-t-paita",
];
const AGE50 = [
  "50v-puoli-vuosisataa-ei-naarmuakaan-t-paita",
  "50-ja-paras-vasta-tulossa-t-paita",
  "50-ja-hopeanhohtoinen-vain-hiukset-t-paita",
  "50v-klassikkomalli-t-paita",
];
const MUGS = [
  "level-30-selka-rusahtaa-nyt-muki",
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
  "level-30-selka-rusahtaa-nyt-t-paita",
  "40v-kunto-kuin-20v-20-vuotta-sitten-t-paita",
  "50v-puoli-vuosisataa-ei-naarmuakaan-t-paita",
  "60v-mutta-fyysinen-kunto-kuin-20v-t-paita",
  "40-ja-fabulous-t-paita",
  "50-ja-hopeanhohtoinen-vain-hiukset-t-paita",
  "60v-mutta-sydan-kuin-20v-t-paita",
  "elakkeella-kiireinen-tekemaan-ei-mitaan-t-paita",
];

// Ikäoppaat hoidetaan GuideProductRecommendations-komponentilla → ei nostoa tässä.
const AGE_GUIDES = new Set([
  "lahja-miehelle-30v-40v-50v-60v",
  "lahja-naiselle-30v-40v-50v-60v",
  "hauskimmat-elakelahjat-selviytymisopas",
]);

export interface MilestoneHighlight {
  title: string;
  slugs: string[];
}

export function selectMilestoneHighlights(slug: string): MilestoneHighlight | null {
  if (AGE_GUIDES.has(slug)) return null;
  const s = slug.toLowerCase();
  const has = (...k: string[]) => k.some((w) => s.includes(w));

  // Selvästi epäsopivat aiheet (vartalot taivutusmuotojen vuoksi) → ei nostoa.
  if (has("tarra", "vauva", "body", "koira", "kissa", "saun", "kalast", "nört", "nort",
    "gamer", "peli", "opettaja", "urheilij", "liikunta", "pipo", "peit", "lauk", "kassi",
    "seinataulu", "polttari", "teini", "juhannu", "valmistujais", "mökki", "mokki")) return null;

  const mies = has("miehelle", "isälle", "isalle", "isänpäiv", "isanpaiv", "setä", "seta");
  const nainen = has("naiselle", "äiti", "aiti", "äitienpäiv", "aitienpaiv");

  if (mies && nainen) return { title: "Hauskat syntymäpäivälahjat", slugs: MIX };
  // "alle 20 €" → vain mukit (19,90 €) mahtuvat; paidat ovat 24,90 €.
  if (has("muki", "kahvi", "toimisto", "tyokave", "työkave", "pomo", "alle-20")) {
    return { title: "Hauskat merkkipäivämukit", slugs: MUGS };
  }
  if (has("eläke", "elake", "elakkeel")) return { title: "Hauskat eläkelahjat", slugs: ELAKE };
  if (has("50-vuotia", "50v")) return { title: "Hauskat 50-vuotislahjat", slugs: AGE50 };
  if (mies) return { title: "Hauskat lahjat miehelle", slugs: MEN };
  if (nainen) return { title: "Hauskat lahjat naiselle", slugs: WOMEN };
  if (has("syntymäpäiv", "syntymapaiv", "merkkipäiv", "merkkipaiv", "ikävuos", "ikavuos",
    "jolla-on-jo-kaikkea", "vuotiaalle")) {
    return { title: "Hauskat syntymäpäivälahjat", slugs: MIX };
  }
  // Yleiset lahja-aiheiset artikkelit.
  if (has("alle-30", "budjet", "edullin", "joulu", "kaverille", "meemi", "miksi-hauska",
    "hauskat-lahjat", "hauska-lahja", "lahjaopas", "t-paita")) {
    return { title: "Hauskat merkkipäivälahjat", slugs: MIX };
  }
  return null;
}
