/**
 * Merchant-syötteen hakusisältö (28.10.2026): otsikko, kuvaus, product_type, google_product_category (numeerinen
 * Googlen taksonomia-ID) ja material tuoterivistä. Ajetaan api/product-feed.js:ssä viimeisenä vaiheena
 * (korjaaSyote-vaiheen jälkeen), joten aiemmat vaiheet näkevät yhä kategoriapolut.
 *
 * Otsikko etupainotteisesti sillä, mitä haetaan (Googlen automaattiehdotukset 28.10.2026: "hauska t paita isälle",
 * "lahja eläkeläiselle", "pikkujoululahja", "hauska joulupaita", "40v lahja", "hauska lahja työkaverille"):
 *   "{tuotetyyppi} {kenelle}: {painoteksti}, {lahjahaku}"   esim. "Hauska t-paita isälle: En nuku. Lepuutan silmiä, isänpäivälahja"
 * Ei mainostekstiä, ei versaaleja, ei emojeja, max 150 merkkiä. Kuvaus 500-1500 merkkiä ilman ajatusviivoja
 * ja ilman toimitus-, hinta- tai palautusmainintoja. Materiaali vain, jos tuotteen oma kuvaus kertoo sen.
 * Tarkistus: scripts/validoi-syote.mjs, testit src/test/syote-sisalto.test.ts.
 */
import { saatavatKoot } from "./syote-korjaukset.js";
import { POHJAT, syoteMateriaali, tuotepohja } from "./materiaali.js";

/** Kaupan kategoria -> Googlen taksonomia-ID (taxonomy-with-ids.en-US.txt, versio 2021-09-21). */
export const GOOGLE_KATEGORIA_ID = {
  "t-paidat": 212, // Apparel & Accessories > Clothing > Shirts & Tops
  hupparit: 212, // vetoketjuton huppari on paita, ei takki (Coats & Jackets 5598)
  pitkahihaiset: 212,
  bodyt: 5411, // ... > Baby & Toddler Clothing > Baby One-Pieces
  mukit: 2169, // Home & Garden > Kitchen & Dining > Tableware > Drinkware > Mugs
  tarrat: 4054, // ... > Embellishments & Trims > Decorative Stickers
  seinataulut: 500044, // Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork
  peitot: 1985, // Home & Garden > Linens & Bedding > Bedding > Blankets
  pipot: 173, // Apparel & Accessories > Clothing Accessories > Hats
  laukut: 6551, // Apparel & Accessories > Handbags, Wallets & Cases
  koristeet: 3144, // Home & Garden > Decor > Seasonal & Holiday Decorations > Holiday Ornaments
  housut: 204, // Apparel & Accessories > Clothing > Pants
};

/** Syötteessä käytetyt ID:t -> polku (validaattori tarvitsee polun vaatekenttien sääntöihin ilman verkkoa). */
export const GOOGLE_KATEGORIAT = {
  212: "Apparel & Accessories > Clothing > Shirts & Tops",
  5411: "Apparel & Accessories > Clothing > Baby & Toddler Clothing > Baby One-Pieces",
  2169: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Mugs",
  4054: "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Materials > Embellishments & Trims > Decorative Stickers",
  500044: "Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork",
  1985: "Home & Garden > Linens & Bedding > Bedding > Blankets",
  173: "Apparel & Accessories > Clothing Accessories > Hats",
  6551: "Apparel & Accessories > Handbags, Wallets & Cases",
  3144: "Home & Garden > Decor > Seasonal & Holiday Decorations > Holiday Ornaments",
  204: "Apparel & Accessories > Clothing > Pants",
  5598: "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets",
};

const TYYPIT = {
  "t-paidat": { nimi: "Hauska t-paita", joulu: "Hauska joulupaita", ryhma: "Vaatteet > T-paidat > Hauskat t-paidat", sana: "t-paita" },
  hupparit: { nimi: "Hauska huppari", joulu: "Hauska jouluhuppari", ryhma: "Vaatteet > Hupparit > Hauskat hupparit", sana: "huppari" },
  pitkahihaiset: { nimi: "Hauska pitkähihainen paita", ryhma: "Vaatteet > Pitkähihaiset > Hauskat pitkähihaiset", sana: "paita" },
  bodyt: { nimi: "Hauska vauvan body", ryhma: "Vauvat > Bodyt > Hauskat bodyt", sana: "body" },
  mukit: { nimi: "Hauska muki", ryhma: "Keittiö > Mukit > Hauskat mukit", sana: "muki" },
  tarrat: { nimi: "Hauska tarra", ryhma: "Tarrat > Hauskat tarrat", sana: "tarra" },
  seinataulut: { nimi: "Hauska juliste", joulu: "Hauska joulujuliste", ryhma: "Sisustus > Julisteet > Hauskat julisteet", sana: "juliste" },
  peitot: { nimi: "Hauska viltti", ryhma: "Sisustus > Viltit > Hauskat viltit", sana: "viltti" },
  pipot: { nimi: "Hauska pipo", ryhma: "Asusteet > Pipot > Hauskat pipot", sana: "pipo" },
  laukut: { nimi: "Hauska kangaskassi", ryhma: "Asusteet > Laukut > Hauskat laukut", sana: "kassi" },
  koristeet: { nimi: "Hauska joulukoriste", ryhma: "Sisustus > Joulukoristeet > Hauskat joulukoristeet", sana: "koriste" },
  housut: { nimi: "Hauskat housut", ryhma: "Vaatteet > Housut > Hauskat housut", sana: "housut" },
};
const OLETUSTYYPPI = { nimi: "Hauska lahja", ryhma: "Lahjat > Hauskat lahjat", sana: "tuote" };
const VAATE = new Set(["t-paidat", "hupparit", "pitkahihaiset", "bodyt", "pipot", "housut"]);

// Tuotetyyppisanat nimen loppuosassa ("| T-paita isälle", ", hauska huppari").
const TYYPPISANA = /^(?:hauska\s+|hauskat\s+|personoitava\s+)?(?:t-paita|huppari|juliste(?:\s*\(poster\))?|tarra|muki|body|pipo|viltti|kassi|koriste|paita)\b\s*/i;
const ERISNIMET = new Set(["Suomi", "Finland", "Sweden", "Swedish", "Helsinki", "Tampere", "Turku", "Oulu", "Lappi", "I"]);
const AKRONYYMIT = new Set(["EU", "USA", "XL", "2XL", "3XL", "4XL", "5XL", "DTG", "DTF", "A3", "A4", "OK", "GPS", "IT", "HIFK", "HJK", "TPS", "KPS", "HPK"]);

/** Isot alkukirjaimet tavalliseksi: "ÄITI" -> "äiti", "Sää Päättää Teen Silti" -> "Sää päättää teen silti". */
export function siistiTeksti(s) {
  let t = String(s || "")
    .replace(/\s*❤️?\s*/gu, " love ")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  // Paikkamerkit: [NIMI] -> NIMI (personoitavuus kerrotaan otsikon alussa), englanninkieliset tyyppisanat pois.
  t = t.replace(/\[([^\]]*)\]/g, "$1").replace(/\s+(?:ornament|t-shirt|hoodie|poster)$/i, "").replace(/lll/g, "ll").trim();
  // Joka sana isolla (vähintään 2 sanaa, ei erisnimiä): virkekirjoitukseen, paitsi virkkeen alku.
  const sanat = t.split(/[\s-]/).filter((w) => /\p{L}/u.test(w));
  if (sanat.length >= 2 && sanat.every((w) => /^[^\p{L}]*\p{Lu}/u.test(w)) && !sanat.some((w) => ERISNIMET.has(w.replace(/\P{L}/gu, "")))) {
    t = t.replace(/([^\s/-]*)([\s/-]+)(\p{Lu})/gu, (m, ed, vali, iso) => (/[.!?:]$/.test(ed) ? m : `${ed}${vali}${iso.toLowerCase()}`));
  }
  // Versaalisanat (vähintään 2 kirjainta) pieniksi, paitsi lyhenteet.
  t = t.replace(/\p{Lu}[\p{Lu}]+/gu, (w) => (AKRONYYMIT.has(w) ? w : w.toLowerCase()));
  t = t.replace(/^\s*love\b/, "Love").replace(/\bi love\b/gi, "I love").replace(/\s+([,.!?:])/g, "$1").replace(/\s+/g, " ").trim();
  t = t.replace(/[.,;:\s]+$/, (m) => (/\.\.\.$/.test(t) ? m : ""));
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Tuotenimestä painoteksti ja nimen kertoma kohde ("isälle", "pikkujouluihin"). */
export function puraNimi(nimi) {
  const n = String(nimi || "").replace(/lll/g, "ll").replace(/\s*｜\s*/g, " | ").replace(/\s*[–—]\s*/g, ", ").replace(/\s+/g, " ").trim();
  let m = n.match(/^(Hauska|Personoitava)\s+(?:T-Paita|Huppari|Juliste|Tarra|Muki|Body|Paita)(?:\s+([^,:]+?))?[,:]\s*(.+)$/i);
  if (m) return { teksti: m[3], kohde: (m[2] || "").toLowerCase(), personoitava: /personoitava/i.test(m[1]) };
  const pysty = n.lastIndexOf(" | ");
  if (pysty > 0) {
    const loppu = n.slice(pysty + 3).replace(TYYPPISANA, "").trim();
    return { teksti: n.slice(0, pysty), kohde: loppu.toLowerCase(), personoitava: /oma teksti|personoi/i.test(n) };
  }
  m = n.match(/^(.+?),\s*hauska\s+(?:t-paita|huppari|juliste|tarra|muki)(?:\s+(\S+))?$/i);
  if (m) return { teksti: m[1], kohde: (m[2] || "").toLowerCase(), personoitava: false };
  return { teksti: n.replace(/,?\s*hauska\s+(?:t-paita|huppari)$/i, ""), kohde: "", personoitava: /oma teksti|personoi/i.test(n) };
}

/** Kaupunkituotteen asukasnimi allatiivissa ja kaupunki (#kaupunki:-tagi tai kuvauksen "lahja lahtelaiselle"). */
function kaupunki(nimi, kuvaus) {
  const tagi = (String(kuvaus || "").match(/#kaupunki:([^\s<]+)/) || [])[1];
  const kaikki = `${nimi} ${kuvaus || ""}`;
  // Asukasnimi: kuvauksen "lahja lahtelaiselle" tai painotekstin "lahtelainen" / "lahtelaista verta".
  const asukas =
    (kaikki.match(/(?:lahja|t-paita|huppari|juliste|paita)\s+(\p{L}+(?:lai|läi|vai|väi)selle)(?![\p{L}])/iu) || [])[1] ||
    ((nimi.match(/(?<![\p{L}])(\p{L}+(?:lai|läi|vai|väi))(?:nen|sta|stä)(?![\p{L}])/iu) || [])[1] ? `${nimi.match(/(?<![\p{L}])(\p{L}+(?:lai|läi|vai|väi))(?:nen|sta|stä)(?![\p{L}])/iu)[1]}selle` : null);
  const kotiteksti = /verta|Made in|Syntymäkaupunki|Kotona vain|selviää mistä vain|parempi kuin Helsinki|parempi kuin kaikki/i.test(nimi);
  if (!tagi && !(kotiteksti && asukas)) return null;
  return { kaupunki: tagi || null, asukas: asukas ? asukas.toLowerCase() : null };
}

/**
 * Harrastus- ja ammattisarjat (29.10.2026, laskeutumissivut /lahjat/<sarja>): tuotteen nimen kohde ("T-paita
 * kalastajalle") -> otsikon "kenelle", lahjahaku, product_typen taso ja kuvauksen lahjalause. Kattaa sarjojen uudet
 * paidat ja saman aiheen aiemmat tuotteet (Hauska T-Paita Kalastajalle jne.), jotta haku "lahja metsästäjälle"
 * osuu kaikkiin. Avain on kohde pienillä kirjaimilla.
 */
const SARJAT = [
  { re: /^(?:remontoijalle|rakennusmiehelle|sähköasentajalle|putkimiehelle)$/, taso: "Remontoijat ja rakentajat", yleinen: "remontoijalle tai rakentajalle", kenelle: (k) => k },
  { re: /^(?:kalastajalle|pilkkijälle)$/, taso: "Kalastajat", yleinen: "kalastajalle tai pilkkijälle", kenelle: (k) => k },
  { re: /^metsästäjälle$/, taso: "Metsästäjät", yleinen: "metsästäjälle tai metsästysseuran jäsenelle", kenelle: (k) => k },
  { re: /^(?:autoilijalle|autoharrastajalle)$/, taso: "Autoilijat ja motoristit", yleinen: "autoilijalle, autoharrastajalle tai motoristille", kenelle: (k) => k },
  { re: /^golfaajalle$/, taso: "Golfaajat", yleinen: "golfaajalle", kenelle: (k) => k },
  { re: /^(?:mökkeilijälle|saunojalle)$/, taso: "Mökkeilijät ja saunojat", yleinen: "mökkeilijälle tai saunojalle", kenelle: (k) => k },
  { re: /^maanviljelijälle$/, taso: "Maanviljelijät ja metsänomistajat", yleinen: "maanviljelijälle tai metsänomistajalle", kenelle: (k) => k },
  { re: /^(?:it-ihmiselle|koodarille)$/, taso: "Tekniikka- ja IT-ihmiset", yleinen: "IT-ihmiselle tai koodarille", kenelle: (k) => (k === "it-ihmiselle" ? "IT-ihmiselle" : k) },
];

/**
 * Aihe: kenelle (otsikon "{tyyppi} {kenelle}"), lahjahaku (otsikon loppu), product_typen viimeinen taso ja kuvauksen
 * lahjalause. Järjestys: tarkin ensin.
 */
export function aihe(p) {
  const { teksti, kohde, personoitava } = puraNimi(p.name);
  const nimi = String(p.name || "");
  const kuvaus = String(p.description || "");
  const kaikki = `${nimi} ${kohde}`;
  const tulos = (o) => ({ teksti, personoitava, ...o });

  if (/pikkujoulu/i.test(kaikki)) {
    return tulos({ kenelle: "pikkujouluihin", lahja: "pikkujoululahja", taso: "Pikkujoulut", lause: "Sopii asuksi pikkujouluihin, työpaikan juhliin tai pikkujoululahjaksi työkaverille." });
  }
  if (/joulu|tonttu|glögi|kinkku|piparivaras|riisipuuro|joulupukki/i.test(kaikki)) {
    return tulos({ joulu: true, kenelle: "", lahja: "joululahja", taso: "Joulu", lause: "Sopii jouluasuksi, joulujuhliin tai joululahjaksi perheenjäsenelle, ystävälle tai työkaverille." });
  }
  if (/eläk/i.test(kaikki) || /eläkeläi|eläkkeelle/i.test(kuvaus.slice(0, 300))) {
    return tulos({ kenelle: "eläkeläiselle", lahja: "lahja eläkeläiselle", taso: "Eläkeläiset", lause: "Hauska lahja eläkeläiselle tai eläkkeelle jäävälle työkaverille läksiäisiin, syntymäpäiville tai jouluksi." });
  }
  if (/\b(?:pappa|papalle|ukki|ukille|vaari|isoisä)/i.test(kaikki)) {
    const k = /ukki|ukille/i.test(kaikki) ? "ukille" : /vaari/i.test(kaikki) ? "vaarille" : "papalle";
    return tulos({ kenelle: k, lahja: "lahja isoisälle", taso: "Isät ja isoisät", lause: `Hyvä lahja ${k} isänpäiväksi, syntymäpäiväksi tai jouluksi.` });
  }
  if (/(?<![\p{L}])(?:isä|isälle|isän|isänpäivä\p{L}*|iskä\p{L}*|isille)(?![\p{L}])/iu.test(kaikki)) {
    return tulos({ kenelle: "isälle", lahja: "isänpäivälahja", taso: "Isät ja isoisät", lause: "Hyvä lahja isälle isänpäiväksi, syntymäpäiväksi tai jouluksi." });
  }
  if (/(?<![\p{L}])(?:äiti|äidille|äiskä|mamma)/iu.test(kaikki)) {
    return tulos({ kenelle: "äidille", lahja: "lahja äidille", taso: "Äidit", lause: "Hyvä lahja äidille äitienpäiväksi, syntymäpäiväksi tai jouluksi." });
  }
  const ika = (kaikki.match(/(?<![\d%])(\d{2})(?:\s?v\b|\s+vuotta\b|\s+ja\b|-vuotia)/i) || [])[1];
  if (ika) {
    return tulos({ kenelle: `${ika}-vuotiaalle`, lahja: `${ika}v lahja`, taso: "Syntymäpäivät", lause: `Hauska lahja ${ika}-vuotissyntymäpäivälle, ${ika}v juhliin tai synttärisankarille, joka ottaa iän huumorilla.` });
  }
  const kp = kaupunki(nimi, kuvaus);
  if (kp) {
    const k = kp.asukas || "";
    const lahja = kp.kaupunki ? `${kp.kaupunki}-lahja` : "";
    const lause = kp.kaupunki
      ? `Hyvä lahja ${k || "kotikaupungistaan ylpeälle"}, ${kp.kaupunki} kotiseudukseen tuntevalle tai kaupungista pois muuttaneelle.`
      : `Hyvä lahja ${k} tai kotikaupungistaan pois muuttaneelle.`;
    return tulos({ kenelle: k, lahja, taso: "Paikkakunnat", lause });
  }
  const sarja = SARJAT.find((x) => x.re.test(kohde));
  if (sarja) {
    const k = sarja.kenelle(kohde);
    return tulos({ kenelle: k, lahja: `lahja ${k}`, taso: sarja.taso, lause: `Hauska lahja ${sarja.yleinen} syntymäpäiväksi, jouluksi tai muuten vain.` });
  }
  if (kohde && /\p{L}+(?:lle|ille)$/u.test(kohde)) {
    return tulos({ kenelle: kohde, lahja: /loma/.test(kohde) ? "" : `lahja ${kohde}`, taso: "Ammatit ja harrastukset", lause: `Hauska lahja ${kohde} esimerkiksi syntymäpäiväksi, jouluksi tai työpaikan pikkujouluihin.` });
  }
  if (/työkaveri|työpaikka|pomo|palaveri|etätö|konttori/i.test(kaikki)) {
    return tulos({ kenelle: "työkaverille", lahja: "lahja työkaverille", taso: "Työelämä", lause: "Hauska lahja työkaverille syntymäpäiväksi, läksiäisiin tai pikkujouluihin." });
  }
  return tulos({ kenelle: "", lahja: personoitava ? "personoitu lahja" : "hauska lahja", taso: personoitava ? "Personoitavat" : "Huumori", lause: "Hauska lahja ystävälle, työkaverille tai perheenjäsenelle syntymäpäiväksi, jouluksi tai ihan muuten vain." });
}

const tyyppi = (p) => TYYPIT[p?.category] || OLETUSTYYPPI;

/**
 * Otsikko (29.10.2026): "{teksti} | {tyyppi} {kenelle} | Huumorikauppa", esim. "En nuku. Lepuutan silmiä | Hauska
 * t-paita isälle | Huumorikauppa". Aihe ensin, koska se on tuotteen erottava tieto. Max 150: teksti lyhennetään
 * sanarajalta.
 */
export const SYOTE_BRAND_LOPPU = " | Huumorikauppa";
export function syoteOtsikko(p) {
  const a = aihe(p);
  const t = tyyppi(p);
  const nimi = a.personoitava ? t.nimi.replace(/^Hauska(t)?/, "Personoitava") : a.joulu && t.joulu ? t.joulu : t.nimi;
  const alku = `${nimi}${a.kenelle ? ` ${a.kenelle}` : ""}`;
  const teksti = (siistiTeksti(a.teksti) || siistiTeksti(p.name)).replace(/[.!?]+$/, (m) => (m === "." ? "" : m));
  const loppu = ` | ${alku}${SYOTE_BRAND_LOPPU}`;
  if (teksti.length + loppu.length <= 150) return `${teksti}${loppu}`;
  const cut = teksti.slice(0, 150 - loppu.length);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.:;\s]+$/, "")}${loppu}`;
}

/**
 * Materiaali Printifyn pohjatuotteesta ja väreistä (api/_lib/materiaali.js), muuten tuotteen omasta kuvauksesta
 * (ei arvata): "puuvilla", "puuvilla/polyesteri", "paperi" tai null. Värikohtaisesti vaihteleva jää pois.
 */
export function materiaali(p) {
  const pohjasta = syoteMateriaali(p?.slug);
  if (pohjasta) return pohjasta;
  const pohja = tuotepohja(p?.slug);
  if (pohja && POHJAT[pohja.b]?.luokat) return null;
  const d = String(p?.description || "");
  if (/50\s?%\s?puuvillaa\s*(?:\/|ja)\s*50\s?%\s?polyester|50\/50\s*puuvilla-polyester/i.test(d)) return "puuvilla/polyesteri";
  if (/100\s?%\s?(?:luomu)?puuvillaa/i.test(d)) return "puuvilla";
  if (p?.category === "seinataulut" && /\bpaperi/i.test(d)) return "paperi";
  return null;
}

const PROMO_LAUSE = /ilmai|toimitu|toimitet|€|\beur\b|hinta|hintaan|palautu|alennu|tarjou|\bale\b|kampanja|osta nyt|tilaa nyt|USA:n/i;

/** Tuoterivin oma kuvaus siistittynä: ominaisuus-/hoito-osio pois, mainoslauseet pois, ei ajatusviivoja. */
export function siistiKuvaus(desc) {
  let d = String(desc || "")
    .split(/Tuotteen ominaisuudet|Hoito-ohjeet/)[0]
    .replace(/\s*#[\p{L}_]+:[^\s<]+/gu, "")
    .replace(/([\p{Ll}0-9)])([.!?])(\p{Lu})/gu, "$1$2 $3")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  const lauseet = d.match(/[^.!?]+(?:[.!?]+|$)/g) || [];
  return lauseet.map((l) => l.trim()).filter((l) => l && !PROMO_LAUSE.test(l) && !/^Hauska tuote Huumorikaupasta/i.test(l)).join(" ").replace(/,\s*,/g, ",").trim();
}

const luettelo = (xs) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ja ${xs[xs.length - 1]}`);

/** Kuvaus 500-1500 merkkiä: painoteksti, tuotetyyppi, oma kuvaus, lahjalause, koot/värit/materiaali, valmistus. */
export function syoteKuvaus(p) {
  const a = aihe(p);
  const t = tyyppi(p);
  const teksti = siistiTeksti(a.teksti) || siistiTeksti(p.name);
  const otsikkoNimi = (a.joulu && t.joulu ? t.joulu : t.nimi).replace(/^Hauska(t)?/, a.personoitava ? "Personoitava" : "Hauska$1");
  const osat = [];
  osat.push(`${otsikkoNimi}${a.kenelle ? ` ${a.kenelle}` : ""}, jossa on painatuksena teksti "${teksti.replace(/"/g, "")}".`);
  // Oma kuvaus ilman alun painotekstin toistoa (painoteksti on jo edellisessä lauseessa).
  let oma = siistiKuvaus(p.description);
  const alku = teksti.replace(/[.!?]+$/, "").toLowerCase();
  if (alku && oma.toLowerCase().startsWith(alku)) oma = oma.slice(alku.length).replace(/^[.!?,:;\s]+/, "");
  oma = oma.charAt(0).toUpperCase() + oma.slice(1);
  if (oma && oma.length > 20) osat.push(oma.length > 700 ? `${oma.slice(0, 700).replace(/[^.!?]*$/, "").trim() || oma.slice(0, 700)}` : oma);
  osat.push(a.lause);
  if (VAATE.has(p.category)) {
    const koot = saatavatKoot(p.slug, p.variants);
    const varit = (Array.isArray(p.variants?.colors) ? p.variants.colors : []).map((v) => String(v).toLowerCase());
    const mat = materiaali(p);
    const malli = p.category === "bodyt" ? "Vauvan body" : "Unisex-malli, joka sopii sekä miehille että naisille";
    osat.push(`${malli}${mat ? `, materiaali ${mat === "puuvilla" ? "puuvilla" : "puuvilla ja polyesteri"}` : ""}.`);
    if (koot.length) osat.push(`Saatavilla koot ${luettelo(koot)}.`);
    if (varit.length) osat.push(varit.length > 8 ? `Värivaihtoehtoja on ${varit.length}, esimerkiksi ${luettelo(varit.slice(0, 6))}.` : `Värit: ${luettelo(varit)}.`);
  }
  osat.push(`Jokainen ${t.sana} painetaan tilauksesta Euroopassa ja toimitetaan Suomeen.`);
  osat.push(`Huumorikauppa.fi on suomalainen verkkokauppa, jonka hauskat t-paidat, hupparit ja julisteet on tehty suomalaisella huumorilla.`);
  let d = osat.join(" ");
  if (d.length < 500 && VAATE.has(p.category)) d += " Pese nurin käännettynä enintään 30 asteessa, niin painatus pysyy pitkään hyvänä.";
  if (d.length < 500) d += ` Valitse ${t.sana} lahjaksi tai itsellesi, kun haluat tuoda arkeen hymyn ja hyvän puheenaiheen.`;
  if (d.length < 500) d += ` Tuote valmistetaan vasta tilauksen jälkeen, joten turhaa varastoa ei synny.`;
  if (d.length < 500) d += ` Tuotekuvat näyttävät, miltä painatus näyttää valmiissa tuotteessa.`;
  d = d.replace(/[–—]/g, ",").replace(/\s+/g, " ").trim();
  if (d.length > 1500) d = d.slice(0, 1500).replace(/[^.!?]*$/, "").trim();
  return d;
}

export function tuotetyyppi(p) {
  return `${tyyppi(p).ryhma} > ${aihe(p).taso}`;
}

const enc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Asettaa kentän (korvaa olemassa olevan tai lisää ennen </item>). */
function aseta(item, nimi, arvo) {
  if (arvo == null || arvo === "") return item;
  const rivi = `<g:${nimi}>${enc(arvo)}</g:${nimi}>`;
  const re = new RegExp(`<g:${nimi}>[^<]*</g:${nimi}>`);
  return re.test(item) ? item.replace(re, () => rivi) : item.replace(/\s*<\/item>$/, () => `\n      ${rivi}\n    </item>`);
}

/** Yhden <item>-lohkon hakusisältö tuoterivistä. Ilman riviä lohko palautetaan sellaisenaan. */
export function sisallotaItem(item, p) {
  if (!p) return item;
  let out = item;
  out = aseta(out, "title", syoteOtsikko(p));
  out = aseta(out, "description", syoteKuvaus(p));
  out = aseta(out, "product_type", tuotetyyppi(p));
  const id = GOOGLE_KATEGORIA_ID[p.category];
  if (id) out = aseta(out, "google_product_category", String(id));
  const mat = materiaali(p);
  if (mat) out = aseta(out, "material", mat);
  return out;
}

/** @param tuotteet Map tuote-id -> tuoterivi (name, slug, category, description, variants) */
export function sisallotaSyote(xml, tuotteet = new Map()) {
  return xml.replace(/<item>[\s\S]*?<\/item>/g, (item) => {
    const id = (item.match(/<g:id>([^<]*)<\/g:id>/) || [])[1];
    return sisallotaItem(item, tuotteet.get(id) || null);
  });
}
