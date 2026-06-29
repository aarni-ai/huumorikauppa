// Merkkipäivätuotteiden nostot suosituimmille / relevanteimmille blogiartikkeleille.
//
// `milestoneHighlightArticles`: blogi-slugit (täsmälleen kuten blog.ts:ssä) joilla nosto näytetään.
// Valittu sitemap-prioriteetin (0.7–0.8) + aiheellisuuden perusteella. Vaihda tähän omat
// Analytics/Search Console -kärkiartikkelisi kun ne ovat tiedossa — tämä on ainoa muutos.
export const milestoneHighlightArticles: string[] = [
  "hauskat-lahjat-alle-30-euroa",
  "hauskat-valmistujaislahjat-2026",
  "hauska-lahja-juhannukseen-2026",
  "hauskat-pikkujoululahjat-tyokavereille",
  "hauskat-syntymapaivaLahjat-opas",
  "mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea",
  "hauskat-lahjat-miehelle-naiselle-syntymapaivaLahjat",
];

// Edustava poikkileikkaus uusista merkkipäivätuotteista (t-paidat eri ikäryhmistä).
export const milestoneHighlightSlugs: string[] = [
  "level-30-selka-rusahtaa-nyt-t-paita",
  "40v-kunto-kuin-20v-20-vuotta-sitten-t-paita",
  "50v-puoli-vuosisataa-ei-naarmuakaan-t-paita",
  "60v-mutta-fyysinen-kunto-kuin-20v-t-paita",
  "40-ja-fabulous-t-paita",
  "50-ja-hopeanhohtoinen-vain-hiukset-t-paita",
  "60v-mutta-sydan-kuin-20v-t-paita",
  "elakkeella-kiireinen-tekemaan-ei-mitaan-t-paita",
];
