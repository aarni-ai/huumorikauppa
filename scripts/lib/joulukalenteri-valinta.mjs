/**
 * Joulukalenterin luukkujen valinta (4.11.2026, scripts/joulukalenteri-valinta.mjs). Puhdas: suosiojärjestys ja
 * myytävät tuotteet sisään, 24 luukkua ulos.
 *
 * Säännöt:
 * - Vain myytävät (api/_lib/tuotteet.js myynnissa), t-paidat ja hupparit, ei personoituja; jokainen luukku eri malli
 *   (sama design t-paitana ja huppareina on yksi malli).
 * - Hinta api/_lib/joulukalenteri.js luukunHinta: suurin tasaeuroinen alennus, jolla jokaisen variantin kate on
 *   vähintään 7 € + varmuusvara kappaleelta. Tuote, jolle alennusta ei voi antaa (esim. 24,90 €:n t-paidat), ohitetaan.
 * - Vaihtelu: enintään AIHE_MAX luukkua samasta aiheesta (esim. eläkeläinen, tonnin seteli, glögi).
 * - Parittomina päivinä t-paita, parillisina huppari (jos sopivaa ei ole, ensin toinen aihe, sitten toinen tyyppi).
 * - Jouluaiheiset lähemmäs jouluaattoa: 1.-8.12. suosituimmat muut, 9.-16.12. joka toinen jouluaiheinen,
 *   17.-24.12. jouluaiheiset.
 */
import { luukunHinta, LUUKKUJA } from "../../api/_lib/joulukalenteri.js";
import { myynnissa } from "../../api/_lib/tuotteet.js";

export const malli = (slug) => slug.replace(/-(t-paita|huppari|pitkahihainen-paita|t-shirt-t-paita)(-.*)?$/, "");
export const JOULU_RE = /joulu|glogi|glögi|kinkku|tonttu|pukki|pikkujoulu|riisipuuro|lahjapaniikki|lahjatoive|lahjat-ostettu|anopin-joulu/i;
export const onJouluaiheinen = (p) => JOULU_RE.test(`${p.slug} ${p.name || ""}`);
/** Aihe vaihtelun vuoksi: mallin alku (4 merkkiä, "se-oli-" pois; ikävuosipaidat yhtenä aiheena). Enintään AIHE_MAX luukkua per aihe. */
export const aihe = (slug) => { const m = malli(slug).replace(/^se-oli-/, ""); return /^\d/.test(m) ? "ikavuodet" : m.slice(0, 4); };
export const AIHE_MAX = 2;
export const haluttuJoulu = (paiva) => paiva >= 17 || (paiva >= 9 && paiva % 2 === 0);
export const haluttuKategoria = (paiva) => (paiva % 2 === 1 ? "t-paidat" : "hupparit");

/**
 * @param jarjestys slugit suosiojärjestyksessä (paras ensin)
 * @param tuotteet myytävät tuoterivit (kuluineen)
 * Palauttaa [{ paiva, slug, nimi, kategoria, normaali, hinta, heikoinKate, joulu }].
 */
export function valitseLuukut(jarjestys, tuotteet) {
  const bySlug = new Map(tuotteet.map((p) => [p.slug, p]));
  // Ehdokkaat: suosiojärjestys ensin, sitten loput jouluaiheiset (joulumallisto on uusi, sillä ei vielä ole historiaa).
  const slugit = [...new Set([...jarjestys, ...tuotteet.filter(onJouluaiheinen).map((p) => p.slug)])];
  const ehdokkaat = [];
  for (const slug of slugit) {
    const p = bySlug.get(slug);
    if (!p || !myynnissa(p) || !["t-paidat", "hupparit"].includes(p.category) || p.variants?.personoitu) continue;
    const h = luukunHinta(p);
    if (!h) continue;
    ehdokkaat.push({ p, h, joulu: onJouluaiheinen(p) });
  }
  const kaytetyt = new Set();
  const aiheet = new Map();
  const luukut = [];
  for (let paiva = 1; paiva <= LUUKKUJA; paiva++) {
    const sopii = (e, kategoria, joulu) => !kaytetyt.has(malli(e.p.slug)) && (aiheet.get(aihe(e.p.slug)) || 0) < AIHE_MAX && (kategoria === null || e.p.category === kategoria) && (joulu === null || e.joulu === joulu);
    const j = haluttuJoulu(paiva);
    const k = haluttuKategoria(paiva);
    const e = ehdokkaat.find((x) => sopii(x, k, j)) ?? ehdokkaat.find((x) => sopii(x, k, null)) ?? ehdokkaat.find((x) => sopii(x, null, j)) ?? ehdokkaat.find((x) => sopii(x, null, null));
    if (!e) throw new Error(`Luukulle ${paiva} ei löydy tuotetta (ehdokkaita ${ehdokkaat.length}).`);
    kaytetyt.add(malli(e.p.slug));
    aiheet.set(aihe(e.p.slug), (aiheet.get(aihe(e.p.slug)) || 0) + 1);
    luukut.push({ paiva, slug: e.p.slug, nimi: e.p.name, kategoria: e.p.category, normaali: Number(e.p.price), hinta: e.h.hinta, heikoinKate: e.h.heikoinKate, joulu: e.joulu });
  }
  return luukut;
}

/** api/_lib/joulukalenteri-data.js:n sisältö. */
export function dataTiedosto(luukut, { lahde, paiva }) {
  const rivit = luukut.map((l) => `  { paiva: ${l.paiva}, slug: ${JSON.stringify(l.slug)}, nimi: ${JSON.stringify(l.nimi)}, normaali: ${l.normaali}, hinta: ${l.hinta} }, // kate vähintään ${l.heikoinKate.toFixed(2).replace(".", ",")} €/kpl${l.joulu ? ", jouluaiheinen" : ""}`);
  return `/**
 * Joulukalenterin luukut 1.-24.12.2026. VAIN PALVELIMELLA: tätä tiedostoa ei saa tuoda selaimen koodiin (src/), jotta
 * tulevien luukkujen tuotteet ja hinnat eivät päädy staattiseen pakettiin (src/test/joulukalenteri.test.ts tarkistaa).
 * Rajapinta /api/products?joulukalenteri=1 palauttaa vain tämän päivän luukun tuotteen ja hinnan.
 *
 * Generoitu: node scripts/joulukalenteri-valinta.mjs (${paiva}, lähde: ${lahde}).
 * paiva = joulukuun päivä, hinta = luukun hinta perushinnalle (muut koot saman euromäärän alennuksella),
 * normaali = perushinta valintahetkellä, valinnainen kpl (sarja), koot ja varit (rajaus).
 */
export const JOULUKALENTERI = [
${rivit.join("\n")}
];

export default JOULUKALENTERI;
`;
}
