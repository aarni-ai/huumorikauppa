/**
 * Hakusanoja sisältävä tuoteotsikko (2.11.2026), jaettu: Merchant-syötteen g:title, tuotesivun <title> ja og:title
 * (src/pages/ProductPage.tsx), esirenderöinti (src/seo/prerender/pages.ts) ja botit (middleware.ts).
 * Muoto "{tuotetyyppi + kenelle tai aihe}: {painoteksti}", esim. "Hauska t-paita isälle: En nuku. Lepuutan silmiä",
 * "Saunapaita: Löylyä ja lämpöä", "Joulupaita: Tonttu koeajalla". Alle 70 merkkiä, ei brändiä, ei versaaleja,
 * ei emojeja, ei ajatusviivoja. H1, JSON-LD:n name ja tuoteosoite (slug) eivät muutu.
 *
 * Moduuli on puhdasta JS:ää ilman node-importteja, jotta selain voi ajaa sen: aiheen päättely (aihe, puraNimi,
 * siistiTeksti) asuu täällä ja syote-sisalto.js tuo ne tästä.
 */

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


export const OTSIKKO_MAX = 69;

const KATEGORIA_SANAT = {
  "t-paidat": { perus: "Hauska t-paita", joulu: "Joulupaita", sauna: "Saunapaita", pikkujoulu: "Pikkujoulupaita" },
  hupparit: { perus: "Hauska huppari", joulu: "Jouluhuppari", sauna: "Saunahuppari", pikkujoulu: "Pikkujouluhuppari" },
  pitkahihaiset: { perus: "Hauska pitkähihainen paita", joulu: "Joulupaita", sauna: "Saunapaita", pikkujoulu: "Pikkujoulupaita" },
  bodyt: { perus: "Hauska vauvan body" },
  mukit: { perus: "Hauska muki", joulu: "Joulumuki", sauna: "Saunamuki" },
  tarrat: { perus: "Hauska tarra" },
  seinataulut: { perus: "Hauska juliste", joulu: "Joulujuliste", sauna: "Saunajuliste" },
  peitot: { perus: "Hauska viltti" },
  pipot: { perus: "Hauska pipo", joulu: "Joulupipo", sauna: "Saunapipo" },
  laukut: { perus: "Hauska kangaskassi" },
  koristeet: { perus: "Hauska joulukoriste" },
  housut: { perus: "Hauskat housut" },
};
const OLETUS_SANAT = { perus: "Hauska lahja" };

// Lopusta pois jäävät pienet sidesanat, kun painoteksti katkaistaan sanarajalta.
const SIDESANAT = new Set(["ja", "on", "ei", "tai", "että", "se", "kun", "ne", "mä", "mun", "oon", "en", "vai", "mutta", "kuin", "niin", "jos", "ku", "sitä", "tää", "oma", "yksi", "ole", "olen", "kuka"]);

/** Aihe ja painoteksti ilman tuotetyyppisanaa, joka voi jäädä nimen loppuun ("..., hauska kahvimuki"). */
function painoteksti(p0) {
  // "Hauska Kahvimuki Yrittäjälle – ..." luetaan kuten "Hauska Muki Yrittäjälle – ...".
  const p = { ...p0, name: String(p0?.name || "").replace(/^(Hauska|Personoitava)\s+Kahvi(?:muki|kuppi)\b/i, "$1 Muki") };
  const a = aihe(p);
  let t = siistiTeksti(a.teksti) || siistiTeksti(p.name);
  t = t.replace(/[,:]?\s*hauska\s+(?:kahvi)?(?:muki|kuppi)$/i, "").replace(/\s*[|,]\s*kahvi(?:muki|kuppi)$/i, "");
  t = t.replace(/[.,;:\s]+$/, "");
  return { a, teksti: t.charAt(0).toUpperCase() + t.slice(1) };
}

function katkaise(teksti, tila) {
  if (teksti.length <= tila) return teksti;
  let osa = teksti.slice(0, tila + 1);
  osa = osa.slice(0, Math.max(osa.lastIndexOf(" "), 0)).trim();
  for (;;) {
    const ennen = osa;
    osa = osa.replace(/[\s,.:;-]+$/, "");
    const viimeinen = (osa.match(/(\S+)$/) || [])[1];
    if (viimeinen && SIDESANAT.has(viimeinen.toLowerCase()) && osa.includes(" ")) osa = osa.slice(0, osa.length - viimeinen.length);
    if (osa === ennen) break;
  }
  return osa;
}

/**
 * Hakusanaotsikko tuoterivistä (name, slug, category, description). Alku on luonnollinen hakulause (tuotetyyppi ja
 * kenelle tai aihe), sen jälkeen painoteksti. Jos kokonaisuus ei mahdu 69 merkkiin, kenelle-osa jää pois ja vasta
 * sitten painoteksti katkaistaan sanarajalta (ilman "...").
 */
export function hakuotsikko(p) {
  const { a, teksti } = painoteksti(p);
  const s = { ...OLETUS_SANAT, ...(KATEGORIA_SANAT[p?.category] || {}) };
  const haku = `${p?.name || ""} ${p?.slug || ""}`;
  let sana = s.perus;
  let kenelle = a.kenelle || "";
  if (a.personoitava) sana = s.perus.replace(/^Hauska(t)?/, "Personoitava");
  else if (a.kenelle === "pikkujouluihin" && s.pikkujoulu) {
    sana = s.pikkujoulu;
    kenelle = "";
  } else if (a.joulu && s.joulu) sana = s.joulu;
  else if (s.sauna && /(?<![\p{L}])(?:sauna|saunoj|saunan|löyly|loyly)/iu.test(haku)) {
    sana = s.sauna;
    kenelle = "";
  }
  const laaja = kenelle ? `${sana} ${kenelle}` : sana;
  const yhdista = (alku, t) => `${alku}: ${t}`;
  let otsikko;
  if (yhdista(laaja, teksti).length <= OTSIKKO_MAX) otsikko = yhdista(laaja, teksti);
  else if (yhdista(sana, teksti).length <= OTSIKKO_MAX) otsikko = yhdista(sana, teksti);
  else otsikko = yhdista(sana, katkaise(teksti, OTSIKKO_MAX - sana.length - 2));
  return otsikko.replace(/[–—]/g, ",");
}
