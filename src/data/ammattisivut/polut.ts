/**
 * Ammatti- ja harrastussivujen slugit (/paidat/<slug>) kevyenä listana reititykselle (src/data/landingRoutes.ts).
 * Järjestys on sama kuin sivukartassa (api/sitemap.js) ja laskeutumissivujen listassa (testattu).
 */
export const AMMATTISIVU_SLUGIT = [
  // Ammatit (24)
  "opettaja",
  "insinoori",
  "laakari",
  "sairaanhoitaja",
  "poliisi",
  "kampaaja",
  "palomies",
  "lahihoitaja",
  "metsuri",
  "fysioterapeutti",
  "ensihoitaja",
  "sahkomies",
  "kokki",
  "hammaslaakari",
  "yrittaja",
  "siivooja",
  "katilo",
  "lentaja",
  "putkimies",
  "rekkakuski",
  "elainlaakari",
  "mekaanikko",
  "arkkitehti",
  "juristi",
  // Harrastukset (16)
  "kissaihminen",
  "koiraihminen",
  "kahvinjuoja",
  "kuntosali",
  "padel",
  "jalkapallo",
  "jaakiekko",
  "hiihtaja",
  "salibandy",
  "muusikko",
  "pyorailija",
  "juoksija",
  "puutarhuri",
  "hevosihminen",
  "retkeilija",
  "pelaaja",
] as const;

/**
 * Uusien mallien kohde allatiivissa sivuittain (tuotenimi "... | T-paita <kohde>") tuotesivun Sopii lahjaksi -riville
 * (src/lib/sopiiLahjaksi.ts) ilman sivujen tekstejä. Testi varmistaa, että sama kuin sisällön kohde.
 */
export const AMMATTISIVU_KOHTEET: Readonly<Record<(typeof AMMATTISIVU_SLUGIT)[number], string>> = {
  opettaja: "opettajalle", insinoori: "insinöörille", laakari: "lääkärille", sairaanhoitaja: "sairaanhoitajalle",
  poliisi: "poliisille", kampaaja: "kampaajalle", palomies: "palomiehelle", lahihoitaja: "lähihoitajalle",
  metsuri: "metsurille", fysioterapeutti: "fysioterapeutille", ensihoitaja: "ensihoitajalle", sahkomies: "sähkömiehelle",
  kokki: "kokille", hammaslaakari: "hammaslääkärille", yrittaja: "yrittäjälle", siivooja: "siivoojalle",
  katilo: "kätilölle", lentaja: "lentäjälle", putkimies: "putkimiehelle", rekkakuski: "rekkakuskille",
  elainlaakari: "eläinlääkärille", mekaanikko: "mekaanikolle", arkkitehti: "arkkitehdille", juristi: "juristille",
  kissaihminen: "kissaihmiselle", koiraihminen: "koiraihmiselle", kahvinjuoja: "kahvinjuojalle",
  kuntosali: "kuntosaliharrastajalle", padel: "padelin pelaajalle", jalkapallo: "jalkapalloilijalle",
  jaakiekko: "jääkiekkoilijalle", hiihtaja: "hiihtäjälle", salibandy: "salibandyn pelaajalle", muusikko: "muusikolle",
  pyorailija: "pyöräilijälle", juoksija: "juoksijalle", puutarhuri: "puutarhurille", hevosihminen: "hevosihmiselle",
  retkeilija: "retkeilijälle", pelaaja: "pelaajalle",
};
