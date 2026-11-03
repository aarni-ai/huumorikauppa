/**
 * Kevyt reittiluettelo laskeutumissivuille (App.tsx, Header). Itse sisältö ja suodattimet ovat
 * src/data/landingPages.ts:ssä; testi varmistaa, että LANDING_PATHS vastaa sitä.
 */
import { YHDISTETYT_KATEGORIAT } from "@/lib/hiddenCategories";
import { AMMATTISIVU_SLUGIT } from "./ammattisivut/polut";

export const LANDING_PATHS: readonly string[] = [
  "/joululahjat",
  "/lahjat/joululahjaksi-miehelle",
  "/lahjat/joululahjaksi-naiselle",
  "/joululahja-miehelle-jolla-on-kaikki",
  "/joululahja-isalle",
  "/joululahja-aidille",
  "/joululahja-vaimolle",
  "/joululahja-kaverille",
  "/joululahja-tyokaverille",
  "/lahjat/pomolle",
  "/joululahja-mummolle",
  "/joululahja-papalle",
  "/joululahja-elakelaiselle",
  "/joululahja-teinille",
  "/lahjat/alle-30-euroa",
  "/joululahja-alle-50-euroa",
  "/lahjat/pikkujouluihin",
  "/salainen-joulupukki-lahja",
  "/black-friday",
  "/meemipaidat",
  "/suosituimmat",
  "/suomalainen-huumori-paidat",
  "/tonnin-seteli-paita",
  "/setamiespaidat",
  "/lahjat/30-vuotiaalle-miehelle",
  "/lahjat/40-vuotiaalle-miehelle",
  "/lahjat/50-vuotiaalle-miehelle",
  "/lahjat/60-vuotiaalle-miehelle",
  "/lahjat/70-vuotiaalle",
  "/lahjat/50-vuotiaalle-naiselle",
  "/lahjat/60-vuotiaalle-naiselle",
  "/elakelahjat",
  "/lahjat/isoisalle",
  "/lahjat/isoaidille",
  "/lahjat/siskolle",
  "/lahjat/veljelle",
  "/lahjat/puolisolle",
  "/lahjat/vauvalle",
  "/lahja-kaverille",
  "/lahjat/tyokaverille",
  "/isanpaivalahja",
  "/hauska-isanpaivalahja",
  "/hauskat-lahjat-miehelle",
  "/hauskat-lahjat-naiselle",
  "/syntymapaivalahjat",
  "/lahjat/harrastajalle",
  "/lahjat/remontoijalle",
  "/lahjat/kalastajalle",
  "/lahjat/metsastajalle",
  "/lahjat/autoilijalle",
  "/lahjat/golfaajalle",
  "/lahjat/mokkeilijalle",
  "/lahjat/maanviljelijalle",
  "/lahjat/it-ihmiselle",
  "/ammattipaidat",
  // Aihesivut (2.11.2026, src/data/landingPagesAiheet.ts)
  "/olut",
  "/sauna",
  "/ammatit",
  // Lahjahakujen sivut (2.11.2026, src/data/lahjaoppaat2026.ts)
  "/joulu",
  "/joululahja-anopille",
  "/hauska-joululahja",
  "/pikkujoululahja-alle-30-euroa",
  "/40-vuotislahja",
  "/50-vuotislahja",
  "/60-vuotislahja",
  // Ammatti- ja harrastussivut (2.11.2026, src/data/ammattisivut)
  ...AMMATTISIVU_SLUGIT.map((s) => `/paidat/${s}`),
];

/**
 * Yhdistetyt ja poistuneet sivut: vanha polku -> uusi polku. Samat 301-ohjaukset ovat
 * vercel.json:ssa (testattu). Asiakaspuoli ohjaa näillä (App.tsx), esirenderöinti ja sivukartta
 * ohittavat ne.
 */
export const LANDING_REDIRECTS: Record<string, string> = {
  // Alle 8 sopivaa tuotetta -> lähin sivu
  "/lahjat/alle-20-euroa": "/lahjat/alle-30-euroa",
  "/harrastus/videopelit": "/paidat/pelaaja",
  // 29.10.2026: harrastus- ja ammattisarjojen laskeutumissivut korvaavat päällekkäiset harrastus- ja ammattisivut
  "/harrastus/kalastus": "/lahjat/kalastajalle",
  "/harrastus/metsastys": "/lahjat/metsastajalle",
  // 3.11.2026: metsästäjän ja kalastajan sivut ovat /lahjat/-sarjassa; /paidat/-muotoinen osoite ohjaa niihin
  "/paidat/metsastaja": "/lahjat/metsastajalle",
  "/paidat/kalastaja": "/lahjat/kalastajalle",
  "/harrastus/golf": "/lahjat/golfaajalle",
  "/harrastus/sauna": "/sauna",
  "/ammatti/rakennusmies": "/lahjat/remontoijalle",
  "/ammatti/maanviljelija": "/lahjat/maanviljelijalle",
  "/ammatti/koodari": "/lahjat/it-ihmiselle",
  // 2.11.2026: ammatti- ja harrastussivut /paidat/<slug> (src/data/ammattisivut) korvaavat päällekkäiset
  // /ammatti/- ja /harrastus/-sivut (sama hakuaikomus, ohuempi sisältö). Valinta: seo/ammattisivut.md.
  "/ammatti/sahkoasentaja": "/paidat/sahkomies",
  "/ammatti/putkimies": "/paidat/putkimies",
  "/ammatti/sairaanhoitaja": "/paidat/sairaanhoitaja",
  "/ammatti/lahihoitaja": "/paidat/lahihoitaja",
  "/ammatti/laakari": "/paidat/laakari",
  "/ammatti/opettaja": "/paidat/opettaja",
  "/ammatti/kokki": "/paidat/kokki",
  "/ammatti/poliisi": "/paidat/poliisi",
  "/ammatti/palomies": "/paidat/palomies",
  "/ammatti/yrittaja": "/paidat/yrittaja",
  "/ammatti/fysioterapeutti": "/paidat/fysioterapeutti",
  "/ammatti/hammaslaakari": "/paidat/hammaslaakari",
  "/ammatti/insinoori": "/paidat/insinoori",
  "/ammatti/siivoja": "/paidat/siivooja",
  "/ammatti/rekkakuljettaja": "/paidat/rekkakuski",
  "/harrastus/juokseminen": "/paidat/juoksija",
  "/harrastus/kuntosali": "/paidat/kuntosali",
  "/harrastus/pyoraily": "/paidat/pyorailija",
  "/harrastus/koiraharrastus": "/paidat/koiraihminen",
  "/harrastus/kissaharrastus": "/paidat/kissaihminen",
  "/harrastus/retkily": "/paidat/retkeilija",
  "/lahjat/kahvinystavalle": "/paidat/kahvinjuoja",
  "/lahjat/saunaan": "/sauna",
  // 2.11.2026: oma saunasivu (aiemmin ei luotu, ohjaus /suomalainen-huumori-paidat)
  "/sauna-t-paidat": "/sauna",
  "/lahjat/opettajalle": "/paidat/opettaja",
  "/lahjat/hoitajalle": "/paidat/sairaanhoitaja",
  // Päällekkäiset sivut (sama hakuaikomus kuin laskeutumissivulla)
  "/lahja-tyokaverille": "/lahjat/tyokaverille",
  "/lahjat/joulu": "/joululahjat",
  // Isänpäivä: sama hakuaikomus ("hauskat isänpäivälahjat") kuin /hauska-isanpaivalahja
  "/isanpaiva-lahjat": "/hauska-isanpaivalahja",
  "/lahjat/isanpaiva": "/hauska-isanpaivalahja",
  // Ääkköset slugeissa -> ASCII
  "/lahjat/isoäidille": "/lahjat/isoaidille",
  "/ammatti/insinöori": "/paidat/insinoori",
  "/ammatti/maanviljelijä": "/lahjat/maanviljelijalle",
  "/kaupunki/ylojärvi": "/kaupunki/ylojarvi",
  "/kaupunki/lempäälä": "/kaupunki/lempaala",
  // 28.10.2026 canonical-korjaus (KASVU-RAPORTTI.md): Search Console "Google valitsi eri kanonisen sivun".
  // Sama hakuaikomus kuin toisella sivulla -> yhdistetty sivuun, jolla on oma sisältö.
  "/lahjat/miehelle": "/hauskat-lahjat-miehelle",
  "/lahja-miehelle": "/hauskat-lahjat-miehelle",
  "/lahjat/naiselle": "/hauskat-lahjat-naiselle",
  "/lahjat/aitienpaiva": "/aitienpaiva",
  "/lahjat/kollegalle": "/lahjat/tyokaverille",
  "/lahjat/syntymapaivasankarille": "/syntymapaivalahjat",
  "/lahjat/ystavalle": "/lahja-kaverille",
  "/lahjat/polttareihin": "/polttari-lahjat",
  "/lahjat/huumorilahjat": "/kaikki-tuotteet",
  "/lahjat/koodaajalle": "/lahjat/it-ihmiselle",
  "/lahjat/rakennusmiehelle": "/lahjat/remontoijalle",
  "/lahjat/yrittajalle": "/paidat/yrittaja",
  "/hauskat-t-paidat": "/kategoria/t-paidat",
  "/hauskat-hupparit": "/kategoria/hupparit",
  "/opiskelijan-haalarimerkit": "/haalarimerkit",
  // Alle 8 sopivaa tuotetta -> lähin sivu tai saman aiheen opas
  "/lahjat/autoharrastajalle": "/lahjat/autoilijalle",
  "/lahjat/muutoiset": "/lahja-kaverille",
  "/lahjat/ystavanpaiva": "/lahja-kaverille",
  "/lahjat/lapselle": "/joululahja-teinille",
  "/lahjat/valmistujaisiin": "/blogi/hauskat-valmistujaislahjat-2026",
  "/lahjat/juhannus": "/blogi/hauska-lahja-juhannukseen-2026",
  // Kategoriat, joissa alle 8 tuotetta (src/lib/hiddenCategories.ts)
  ...Object.fromEntries(Object.entries(YHDISTETYT_KATEGORIAT).map(([slug, to]) => [`/kategoria/${slug}`, to])),
};

/**
 * avainsanat.csv-kohdesivut, joita ei luotu, koska sopivia tuotteita on alle 8. Ne eivät ole
 * koskaan olleet julkisia, joten uudelleenohjausta ei tarvita. Hakuaikomuksen kattaa lähin sivu.
 */
export const NOT_CREATED_LANDINGS: Record<string, string> = {
  "/joululahja-alle-10-euroa": "/lahjat/alle-30-euroa",
  "/joulupaidat": "/joululahjat",
  "/jouluhupparit": "/joululahjat",
  "/vauvan-ensimmainen-joulu": "/lahjat/vauvalle",
};

/** Isänpäivä-valikko (Header, työpöytä ja mobiili). Ikivihreä: jää valikkoon myös isänpäivän jälkeen. */
export const FATHERS_DAY_MENU: { href: string; label: string }[] = [
  { href: "/isanpaivalahja", label: "Isänpäivälahja isän tyypin mukaan" },
  { href: "/hauska-isanpaivalahja", label: "Hauska isänpäivälahja" },
  { href: "/joululahja-isalle", label: "Joululahja isälle" },
  { href: "/lahjat/isoisalle", label: "Lahja isoisälle" },
];

/** Aiheet-valikko (Header, Muut tuotteet -valikon alla ja mobiilissa): aihesivut 2.11.2026. */
export const AIHE_MENU: { href: string; label: string }[] = [
  { href: "/olut", label: "Olut ja kalja" },
  { href: "/sauna", label: "Sauna" },
  { href: "/ammatit", label: "Ammatit" },
];

/** Joululahjat-valikko (Header, työpöytä ja mobiili). */
export const CHRISTMAS_MENU: { href: string; label: string }[] = [
  { href: "/joululahjat", label: "Kaikki joululahjat" },
  { href: "/joulu", label: "Joulumallisto 2026" },
  { href: "/lahjat/joululahjaksi-miehelle", label: "Miehelle" },
  { href: "/lahjat/joululahjaksi-naiselle", label: "Naiselle" },
  { href: "/joululahja-isalle", label: "Isälle" },
  { href: "/joululahja-aidille", label: "Äidille" },
  { href: "/joululahja-vaimolle", label: "Vaimolle" },
  { href: "/joululahja-kaverille", label: "Kaverille" },
  { href: "/joululahja-tyokaverille", label: "Työkaverille" },
  { href: "/joululahja-teinille", label: "Teinille" },
  { href: "/joululahja-mummolle", label: "Mummolle" },
  { href: "/joululahja-papalle", label: "Papalle" },
  { href: "/joululahja-elakelaiselle", label: "Eläkeläiselle" },
  { href: "/joululahja-miehelle-jolla-on-kaikki", label: "Miehelle, jolla on kaikki" },
  { href: "/lahjat/alle-30-euroa", label: "Alle 30 €" },
  { href: "/joululahja-alle-50-euroa", label: "Alle 50 €" },
  { href: "/lahjat/pikkujouluihin", label: "Pikkujoululahjat" },
  { href: "/joulun-viimeiset-tilauspaivat", label: "Viimeiset tilauspäivät" },
];

/** Uudelleenohjauksen kohde säilyttäen kyselymerkkijono (utm-parametrit) ja hash. Navigate-komponentti pudottaisi ne. */
export function redirectWithQuery(to: string, search: string, hash = ""): string {
  const [polku, kohteenHash = ""] = to.split("#");
  const yhdista = polku.includes("?") ? "&" : "?";
  const lisa = search.replace(/^\?/, "");
  const h = hash || (kohteenHash ? `#${kohteenHash}` : "");
  return `${polku}${lisa ? yhdista + lisa : ""}${h}`;
}
