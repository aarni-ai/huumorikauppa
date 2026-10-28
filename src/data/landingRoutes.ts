/**
 * Kevyt reittiluettelo laskeutumissivuille (App.tsx, Header). Itse sisältö ja suodattimet ovat
 * src/data/landingPages.ts:ssä; testi varmistaa, että LANDING_PATHS vastaa sitä.
 */
import { YHDISTETYT_KATEGORIAT } from "@/lib/hiddenCategories";

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
  "/meemipaidat",
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
];

/**
 * Yhdistetyt ja poistuneet sivut: vanha polku -> uusi polku. Samat 301-ohjaukset ovat
 * vercel.json:ssa (testattu). Asiakaspuoli ohjaa näillä (App.tsx), esirenderöinti ja sivukartta
 * ohittavat ne.
 */
export const LANDING_REDIRECTS: Record<string, string> = {
  // Alle 8 sopivaa tuotetta -> lähin sivu
  "/lahjat/alle-20-euroa": "/lahjat/alle-30-euroa",
  "/harrastus/videopelit": "/lahjat/harrastajalle",
  // 29.10.2026: harrastus- ja ammattisarjojen laskeutumissivut korvaavat päällekkäiset harrastus- ja ammattisivut
  "/harrastus/kalastus": "/lahjat/kalastajalle",
  "/harrastus/metsastys": "/lahjat/metsastajalle",
  "/harrastus/golf": "/lahjat/golfaajalle",
  "/harrastus/sauna": "/lahjat/mokkeilijalle",
  "/ammatti/rakennusmies": "/lahjat/remontoijalle",
  "/ammatti/maanviljelija": "/lahjat/maanviljelijalle",
  "/ammatti/koodari": "/lahjat/it-ihmiselle",
  "/lahjat/kahvinystavalle": "/lahjat/tyokaverille",
  "/lahjat/saunaan": "/lahjat/mokkeilijalle",
  "/lahjat/opettajalle": "/ammattipaidat",
  "/lahjat/hoitajalle": "/ammattipaidat",
  // Päällekkäiset sivut (sama hakuaikomus kuin laskeutumissivulla)
  "/lahja-tyokaverille": "/lahjat/tyokaverille",
  "/lahjat/joulu": "/joululahjat",
  // Isänpäivä: sama hakuaikomus ("hauskat isänpäivälahjat") kuin /hauska-isanpaivalahja
  "/isanpaiva-lahjat": "/hauska-isanpaivalahja",
  "/lahjat/isanpaiva": "/hauska-isanpaivalahja",
  // Ääkköset slugeissa -> ASCII
  "/lahjat/isoäidille": "/lahjat/isoaidille",
  "/ammatti/insinöori": "/ammatti/insinoori",
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
  "/lahjat/yrittajalle": "/ammatti/yrittaja",
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
  "/sauna-t-paidat": "/suomalainen-huumori-paidat",
};

/** Isänpäivä-valikko (Header, työpöytä ja mobiili). Ikivihreä: jää valikkoon myös isänpäivän jälkeen. */
export const FATHERS_DAY_MENU: { href: string; label: string }[] = [
  { href: "/isanpaivalahja", label: "Isänpäivälahja isän tyypin mukaan" },
  { href: "/hauska-isanpaivalahja", label: "Hauska isänpäivälahja" },
  { href: "/joululahja-isalle", label: "Joululahja isälle" },
  { href: "/lahjat/isoisalle", label: "Lahja isoisälle" },
];

/** Joululahjat-valikko (Header, työpöytä ja mobiili). */
export const CHRISTMAS_MENU: { href: string; label: string }[] = [
  { href: "/joululahjat", label: "Kaikki joululahjat" },
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
