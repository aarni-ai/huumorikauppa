/**
 * "Sopii lahjaksi" -rivi tuotesivulle (2.11.2026): kenelle tuote sopii ja linkki saman aiheen lahjasivulle. Puhdas
 * funktio: päätellään slugista (ASCII, väliviivoin erotetut sanat) ja kategoriasta, ei tuotekuvauksesta, joten sama rivi
 * syntyy selaimessa ja esirenderöinnissä (src/seo/prerender, ProductPage previewOnly).
 *
 * Linkit osoittavat vain laskeutumissivuihin, jotka ovat olemassa eivätkä ohjaudu 301:llä (src/data/landingRoutes.ts
 * LANDING_PATHS, testi src/lib/sopiiLahjaksi.test.ts). Tekstit ilman ajatusviivoja.
 */

export interface SopiiLahjaksi {
  /** Esim. ["isälle", "saunojalle"] (enintään kaksi). */
  kenelle: string[];
  /** Esim. "Sopii lahjaksi isälle ja saunojalle." */
  teksti: string;
  /** Lahjasivun polku (LANDING_PATHS). */
  polku: string;
  /** Linkin teksti, esim. "Lisää lahjoja isälle". */
  linkkiTeksti: string;
}

interface Saanto {
  /** Kenelle (lauseessa allatiivissa), esim. "isälle". */
  kenelle: string;
  polku: string;
  linkkiTeksti?: string;
  /** Osuu, jos jokin slugin sana täsmää. */
  sanat?: RegExp;
}

type TuoteTiedot = { slug: string; category?: string | null };

/** Ammatit slugin lopussa (uudet ammattisarjat "-t-paita-poliisille") ja niiden kirjoitusasu. */
const AMMATIT: Record<string, string> = {
  poliisille: "poliisille", palomiehelle: "palomiehelle", sairaanhoitajalle: "sairaanhoitajalle", lahihoitajalle: "lähihoitajalle",
  opettajalle: "opettajalle", varhaiskasvattajalle: "varhaiskasvattajalle", insinoorille: "insinöörille", kokille: "kokille",
  rekkakuskille: "rekkakuskille", kuskille: "kuskille", parturille: "parturille", myyntimiehelle: "myyntimiehelle",
  siivoojalle: "siivoojalle", asiakaspalvelijalle: "asiakaspalvelijalle", putkimiehelle: "putkimiehelle",
  sahkomiehelle: "sähkömiehelle", sahkoasentajalle: "sähköasentajalle", rakentajalle: "rakentajalle",
  rakennusmiehelle: "rakennusmiehelle", linja: "linja-autonkuljettajalle", tuelle: "IT-tuelle",
};

/** Harrastukset slugissa, jotka eivät kuulu omaan sarjaansa. */
const HARRASTUKSET: Record<string, string> = {
  kitaristille: "kitaristille", pelaajalle: "pelaajalle", juoksijalle: "juoksijalle", lumilautailijalle: "lumilautailijalle",
  valokuvaajalle: "valokuvaajalle", grillimesterille: "grillimestarille", avantouijalle: "avantouimarille",
  retkeilijalle: "retkeilijälle", pyorailijalle: "pyöräilijälle", kuntosaliharrastajalle: "kuntosaliharrastajalle",
  rottaharrastajalle: "rotanomistajalle", koiranomistajalle: "koiranomistajalle",
};

const sanat = (...s: string[]) => new RegExp(`^(${s.join("|")})$`);

/** Järjestyksessä: ensimmäinen osuma määrää linkin, toinen eri vastaanottaja täydentää lauseen. */
const SAANNOT: Saanto[] = [
  { kenelle: "pikkujouluihin", polku: "/lahjat/pikkujouluihin", sanat: /^pikkujoulu/ },
  { kenelle: "anopille", polku: "/joululahja-anopille", sanat: /^anop|^anoppi/ },
  { kenelle: "isälle", polku: "/joululahja-isalle", sanat: sanat("isa", "isan", "isalle", "isaksi", "iska", "iskalle", "isavitsi", "isavitsien", "isanpaiva", "isanpaivana", "faija") },
  { kenelle: "papalle", polku: "/joululahja-papalle", sanat: sanat("pappa", "papalle", "ukki", "ukille", "vaari", "isoisa", "isoisalle") },
  { kenelle: "äidille", polku: "/joululahja-aidille", sanat: sanat("aiti", "aidille", "aiska", "aiskalle") },
  { kenelle: "mummolle", polku: "/joululahja-mummolle", sanat: sanat("mummo", "mummolle", "isoaiti", "isoaidille") },
  { kenelle: "eläkeläiselle", polku: "/joululahja-elakelaiselle", sanat: /^elak|^elake/ },
  { kenelle: "saunojalle", polku: "/sauna", sanat: /sauna|^loyly|^kiuas|^avanto$/ },
  { kenelle: "kalastajalle", polku: "/lahjat/kalastajalle", sanat: sanat("kalastajalle", "kalastan", "kalastus", "kalamies", "kalassa", "kala", "pilkki", "pilkilla", "pilkkijalle", "syotti", "viehelaatikko") },
  { kenelle: "metsästäjälle", polku: "/lahjat/metsastajalle", sanat: /^metsast|^jahti$|^hirvi$|^peijaiset$|^passissa$/ },
  { kenelle: "mökkeilijälle", polku: "/lahjat/mokkeilijalle", sanat: /^mokk|^mokilla$|^mokki|^laituri|^huussi$|^kantovesi$/ },
  { kenelle: "golfaajalle", polku: "/lahjat/golfaajalle", sanat: /^golf|^bogey$/ },
  { kenelle: "autoilijalle", polku: "/lahjat/autoilijalle", sanat: sanat("autoilijalle", "autoharrastajalle", "moottoripyora", "tallissa", "auto", "auton") },
  { kenelle: "remontoijalle", polku: "/lahjat/remontoijalle", sanat: sanat("remontoijalle", "remontti", "rakentajalle", "rakennusmiehelle") },
  { kenelle: "maanviljelijälle", polku: "/lahjat/maanviljelijalle", sanat: sanat("maanviljelijalle", "maanviljelija", "traktori") },
  { kenelle: "IT-ihmiselle", polku: "/lahjat/it-ihmiselle", sanat: sanat("ihmiselle", "koodarille", "koodari", "koodia", "bugi", "tuelle") },
  { kenelle: "oluen ystävälle", polku: "/olut", sanat: /^olu|^kalja|^kaljaa$|^panttipullot$/ },
  { kenelle: "pomolle", polku: "/lahjat/pomolle", sanat: sanat("pomolle", "pomo") },
];

/** Ikävuodet: sana "40", "40v" tai "40-vuotiaalle" (uusien tuotteiden slug). */
const IKASIVUT: Record<string, string> = {
  "30": "/lahjat/30-vuotiaalle-miehelle", "40": "/40-vuotislahja", "50": "/50-vuotislahja", "60": "/60-vuotislahja", "70": "/lahjat/70-vuotiaalle",
};

const TYOKAVERI = sanat("tyokaverille", "tyokaverillle", "tyokaverit", "palaverien", "palaveri", "etatoita", "lounastaukoa", "tiimipelaajalle", "kahvitunnilla");
const JOULU = /^joulu|^jouluun$|^tonttu|^tontun$|^glogi|^kinkku|^kinkkua$|^joulupukin$|^piparivaras$|^riisipuurosta$|^lahjapaniikki$|^laatikkovastaava$/;
/** Kaupunkipaidat: "100-turkulaista-verta", "syntymakaupunki-turku", "made-in-turku", "-t-paita-turkulaiselle" (ei eläkeläiselle). */
const KAUPUNKI = /^(verta|syntymakaupunki|kaupunkilaiselle|made)$|^(?!elak|suoma).*la(iselle|inen|ista)$/;

function lause(kenelle: string[]): string {
  return `Sopii lahjaksi ${kenelle.length > 1 ? `${kenelle[0]} ja ${kenelle[1]}` : kenelle[0]}.`;
}

/** "Sopii lahjaksi" -rivi tuotteelle. Palauttaa aina rivin (oletus: kaverille). */
export function sopiiLahjaksi(tuote: TuoteTiedot): SopiiLahjaksi {
  const slug = String(tuote.slug || "").toLowerCase();
  const osat = slug.split("-").filter(Boolean);
  const osumat: Saanto[] = [];
  const lisaa = (s: Saanto) => {
    if (!osumat.some((o) => o.kenelle === s.kenelle)) osumat.push(s);
  };

  for (const s of SAANNOT) if (s.sanat && osat.some((o) => s.sanat!.test(o))) lisaa(s);

  // Ammatit ja harrastukset (uudet sarjat: "-t-paita-<kenelle>" tai "-huppari-<kenelle>").
  for (const o of osat) {
    if (AMMATIT[o] && !osumat.some((x) => x.polku === "/lahjat/remontoijalle" || x.polku === "/lahjat/it-ihmiselle")) {
      lisaa({ kenelle: AMMATIT[o], polku: "/ammattipaidat", linkkiTeksti: "Katso ammattipaidat" });
    }
    if (HARRASTUKSET[o]) lisaa({ kenelle: HARRASTUKSET[o], polku: "/lahjat/harrastajalle", linkkiTeksti: "Katso harrastajan lahjat" });
  }

  // Ikävuosi (pyöreät vuodet 30-70).
  const ika = osat.map((o) => o.match(/^([3-7]0)(v|-?vuotiaalle)?$/)?.[1]).find(Boolean);
  if (ika && IKASIVUT[ika] && !osat.includes("100")) {
    lisaa({ kenelle: `${ika}-vuotiaalle`, polku: IKASIVUT[ika], linkkiTeksti: `Lisää lahjoja ${ika}-vuotiaalle` });
  }

  if (osat.some((o) => TYOKAVERI.test(o))) lisaa({ kenelle: "työkaverille", polku: "/lahjat/tyokaverille" });
  if (osat.some((o) => JOULU.test(o))) lisaa({ kenelle: "joulupöytään", polku: "/joululahjat", linkkiTeksti: "Katso joululahjat" });
  if (osat.includes("naiselle")) lisaa({ kenelle: "naiselle", polku: "/hauskat-lahjat-naiselle" });
  if (osat.includes("miehelle") && !osat.includes("rakennusmiehelle")) lisaa({ kenelle: "miehelle", polku: "/hauskat-lahjat-miehelle" });
  if (osat.some((o) => KAUPUNKI.test(o)) || (osat.includes("parempi") && osat.includes("helsinki"))) {
    lisaa({ kenelle: "kotikaupungistaan ylpeälle", polku: "/lahja-kaverille", linkkiTeksti: "Lisää lahjoja kaverille" });
  }
  if (osumat.length === 0 && (osat.includes("tekstikuva") || osat.includes("personoitava") || osat.includes("lempinimi"))) {
    lisaa({ kenelle: "kenelle tahansa omalla tekstillä", polku: "/syntymapaivalahjat", linkkiTeksti: "Katso syntymäpäivälahjat" });
  }
  if (osat.includes("ystava") || osat.includes("kaverille")) lisaa({ kenelle: "kaverille", polku: "/lahja-kaverille" });

  // Oletus: kaverille.
  if (osumat.length === 0) lisaa({ kenelle: "kaverille", polku: "/lahja-kaverille" });

  const ensisijainen = osumat[0];
  // "joulupöytään" ei ole vastaanottaja vaan joulun merkki: lause muotoon "Sopii joululahjaksi ...".
  const kenelle = osumat.slice(0, 2).map((o) => o.kenelle);
  let teksti = lause(kenelle);
  if (kenelle[0] === "joulupöytään") teksti = kenelle[1] ? `Sopii joululahjaksi ${kenelle[1]}.` : "Sopii joululahjaksi kaverille, työkaverille tai perheenjäsenelle.";
  else if (kenelle[1] === "joulupöytään") teksti = kenelle[0] === "pikkujouluihin" ? lause([kenelle[0]]) : `Sopii joululahjaksi ${kenelle[0]}.`;
  return {
    kenelle: kenelle.filter((k) => k !== "joulupöytään"),
    teksti,
    polku: ensisijainen.polku,
    linkkiTeksti: ensisijainen.linkkiTeksti ?? `Lisää lahjoja ${ensisijainen.kenelle}`,
  };
}
