/**
 * Kevyt reittiluettelo laskeutumissivuille (App.tsx, Header). Itse sisältö ja suodattimet ovat
 * src/data/landingPages.ts:ssä; testi varmistaa, että LANDING_PATHS vastaa sitä.
 */
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
  "/joululahja-teinille",
  "/lahjat/alle-30-euroa",
  "/joululahja-alle-50-euroa",
  "/lahjat/pikkujouluihin",
  "/salainen-joulupukki-lahja",
  "/hauskat-t-paidat",
  "/hauskat-hupparit",
  "/meemipaidat",
  "/suomalainen-huumori-paidat",
  "/setamiespaidat",
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
  "/lahja-kaverille",
  "/lahjat/tyokaverille",
  "/isanpaiva-lahjat",
  "/hauskat-lahjat-miehelle",
  "/hauskat-lahjat-naiselle",
  "/syntymapaivalahjat",
  "/lahjat/harrastajalle",
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
  "/lahjat/kalastajalle": "/lahjat/harrastajalle",
  "/lahjat/metsastajalle": "/lahjat/harrastajalle",
  "/harrastus/kalastus": "/lahjat/harrastajalle",
  "/harrastus/videopelit": "/lahjat/harrastajalle",
  "/lahjat/kahvinystavalle": "/lahjat/tyokaverille",
  "/lahjat/saunaan": "/suomalainen-huumori-paidat",
  "/lahjat/opettajalle": "/ammattipaidat",
  "/lahjat/hoitajalle": "/ammattipaidat",
  // Päällekkäiset sivut (sama hakuaikomus kuin laskeutumissivulla)
  "/lahja-tyokaverille": "/lahjat/tyokaverille",
  "/lahjat/joulu": "/joululahjat",
  // Ääkköset slugeissa -> ASCII
  "/lahjat/isoäidille": "/lahjat/isoaidille",
  "/ammatti/insinöori": "/ammatti/insinoori",
  "/ammatti/maanviljelijä": "/ammatti/maanviljelija",
  "/kaupunki/ylojärvi": "/kaupunki/ylojarvi",
  "/kaupunki/lempäälä": "/kaupunki/lempaala",
};

/**
 * avainsanat.csv-kohdesivut, joita ei luotu, koska sopivia tuotteita on alle 8. Ne eivät ole
 * koskaan olleet julkisia, joten uudelleenohjausta ei tarvita. Hakuaikomuksen kattaa lähin sivu.
 */
export const NOT_CREATED_LANDINGS: Record<string, string> = {
  "/joululahja-alle-10-euroa": "/lahjat/alle-30-euroa",
  "/joulupaidat": "/hauskat-t-paidat",
  "/jouluhupparit": "/hauskat-hupparit",
  "/vauvan-ensimmainen-joulu": "/joululahjat",
  "/sauna-t-paidat": "/suomalainen-huumori-paidat",
  "/lahjat/mokkeilijalle": "/lahjat/harrastajalle",
};

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
  { href: "/joululahja-miehelle-jolla-on-kaikki", label: "Miehelle, jolla on kaikki" },
  { href: "/lahjat/alle-30-euroa", label: "Alle 30 €" },
  { href: "/joululahja-alle-50-euroa", label: "Alle 50 €" },
  { href: "/lahjat/pikkujouluihin", label: "Pikkujoululahjat" },
  { href: "/joulun-viimeiset-tilauspaivat", label: "Viimeiset tilauspäivät" },
];
