/**
 * Tuotteen materiaali pohjatuotteen (Printify blueprint) ja värin mukaan, Printifyn katalogikuvauksista 29.10.2026.
 * Tuotekohtainen pohja, painotalo ja värien luokat: api/_lib/tuotepohjat.generated.js (scripts/tuotemateriaalit.mjs).
 * Väri, jonka koostumusta katalogi ei kerro, jätetään pois; tuote ilman tietoa jää ilman materiaaliriviä.
 */
import TUOTEPOHJAT from "./tuotepohjat.generated.js";

const PUUVILLA_RK = "100 % rengaskehrättyä puuvillaa";

/**
 * luokat: koostumukset; luokka(englanninkielinen väri) -> indeksi tai null (ei tietoa). teksti: koko tuotteen
 * materiaali, kun se ei riipu väristä.
 */
export const POHJAT = {
  // "Solid colors are 100% cotton ... Heather colors 35% ring-spun cotton, 65% polyester; Sport Grey and Antique
  // colors 90% cotton, 10% polyester; Graphite Heather 50% ring-spun cotton, 50% polyester", 153 g/m².
  145: {
    nimi: "Gildan Softstyle 64000", paino: "153 g/m²",
    luokat: [PUUVILLA_RK, "35 % rengaskehrättyä puuvillaa ja 65 % polyesteriä", "90 % puuvillaa ja 10 % polyesteriä", "50 % rengaskehrättyä puuvillaa ja 50 % polyesteriä"],
    luokka: (c) => (/^Graphite Heather$/i.test(c) ? 3 : /heather/i.test(c) ? 1 : /^Sport Grey$|^Antique/i.test(c) ? 2 : 0),
  },
  // "100% cotton", 180 g/m². Meleerattujen ja Sport Greyn koostumusta katalogi ei kerro.
  6: {
    nimi: "Gildan 5000", paino: "180 g/m²",
    luokat: ["100 % puuvillaa"],
    luokka: (c) => (/heather|sport grey|^ash$/i.test(c) ? null : 0),
  },
  // "50% cotton and 50% polyester ... Heather Sport colors 60% polyester, 40% cotton", 271 g/m².
  77: {
    nimi: "Gildan Heavy Blend 18500", paino: "271 g/m²",
    luokat: ["50 % puuvillaa ja 50 % polyesteriä", "40 % puuvillaa ja 60 % polyesteriä"],
    luokka: (c) => (/^Heather Sport/i.test(c) ? 1 : 0),
  },
  476: { teksti: "Tulostettava premium-vinyyli, harmaa liimapinta. Sisä- ja ulkokäyttöön." },
  531: { teksti: "3 mm paksu keramiikka, kiiltävä pinta ja painatus toisella puolella. Mukana kullanvärinen ripustusnaru." },
};

/** Värin luokka pohjatuotteelle; null, jos pohjaa tai väriä ei tunneta. */
export function materiaaliluokka(bp, vari) {
  const pohja = POHJAT[bp];
  if (!pohja?.luokat || !vari) return null;
  const i = pohja.luokka(vari);
  return i == null ? null : i;
}

/** Tuotteen pohja ja painotalo ({ b, p, v }) slugin mukaan, tai null. */
export const tuotepohja = (slug) => (slug && TUOTEPOHJAT[slug]) || null;

const pieni = (osat) => osat.map((o) => o.charAt(0).toLowerCase() + o.slice(1));
const luettelo = (osat) => { const o = pieni(osat); return o.length < 2 ? o[0] : `${o.slice(0, -1).join(", ")} ja ${o.at(-1)}`; };
const isolla = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Materiaalirivi: "Gildan Softstyle 64000, 153 g/m², 100 % rengaskehrättyä puuvillaa." tai värikohtaisesti
 * "Gildan Softstyle 64000, 153 g/m². Valkoinen 100 % ...; vaaleanharmaa 90 % ...". Kun jonkin värin koostumus
 * puuttuu (t.puuttuu), rivi nimeää värit, joita se koskee. null, jos tietoa ei ole.
 */
export function materiaaliRivi(slug) {
  const t = tuotepohja(slug);
  const pohja = t && POHJAT[t.b];
  if (!pohja) return null;
  if (pohja.teksti) return pohja.teksti;
  const varit = Object.entries(t.v || {});
  if (!varit.length) return null;
  const ryhmat = new Map();
  for (const [c, i] of varit) ryhmat.set(i, [...(ryhmat.get(i) || []), c]);
  const alku = `${pohja.nimi}, ${pohja.paino}`;
  if (ryhmat.size === 1 && !t.puuttuu) return `${alku}, ${pohja.luokat[varit[0][1]]}.`;
  const osat = [...ryhmat].sort((a, b) => a[0] - b[0]).map(([i, cs]) => `${luettelo(cs)} ${pohja.luokat[i]}`);
  return `${alku}. ${isolla(osat.join("; "))}.`;
}

/** Merchant-syötteen material: "puuvilla" tai "puuvilla/polyesteri", jos sama kaikille väreille; muuten null. */
export function syoteMateriaali(slug) {
  const t = tuotepohja(slug);
  const pohja = t && POHJAT[t.b];
  if (!pohja?.luokat || !t.v || t.puuttuu) return null;
  const luokat = new Set(Object.values(t.v).map((i) => pohja.luokat[i]));
  if (luokat.size !== 1) return null;
  return /^100 %/.test([...luokat][0]) ? "puuvilla" : "puuvilla/polyesteri";
}
