/**
 * Painotiedoston laatu (3.11.2026, Teron Tonnin seteli -reklamaatio): tehollinen resoluutio painoalueella ja
 * painoalueen ylitys Printify-tuotteen print_areas-tiedoista. scripts/painotiedostot-tarkistus.mjs ajaa tämän kaikille
 * myynnissä oleville tuotteille.
 *
 * Printifyn mallit: painoalueen (placeholder) leveys ja korkeus ovat pikseleitä 300 DPI:n painotiedostossa. Kuvan x ja
 * y ovat keskipisteen paikka painoalueella (0-1), ja scale on kuvan leveys painoalueen leveyden osuutena.
 *   tehollinen DPI = 300 x kuvan leveys px / (scale x painoalueen leveys px)
 */
export const PAINOALUE_DPI = 300;
/** Alaraja: alle tämän painatus voi näkyä pehmeänä tai porrastuneena. */
export const MIN_DPI = 150;
/** Pyöristysvara painoalueen reunoilla (osuus painoalueesta). */
const VARA = 0.005;

/**
 * kuva: { width, height, x, y, scale, angle }, alue: { width, height } (px).
 * Palauttaa { dpi, vasen, oikea, yla, ala, ylittaa, kierretty } (reunat painoalueen osuuksina).
 */
export function arvioiPainokuva(kuva, alue) {
  const leveys = Number(kuva.scale);
  const korkeus = (leveys * alue.width * (kuva.height / kuva.width)) / alue.height;
  const dpi = (PAINOALUE_DPI * kuva.width) / (leveys * alue.width);
  const vasen = kuva.x - leveys / 2, oikea = kuva.x + leveys / 2, yla = kuva.y - korkeus / 2, ala = kuva.y + korkeus / 2;
  const ylittaa = vasen < -VARA || oikea > 1 + VARA || yla < -VARA || ala > 1 + VARA;
  return { dpi: Math.round(dpi), vasen, oikea, yla, ala, ylittaa, kierretty: Number(kuva.angle || 0) !== 0 };
}

/**
 * Ylitys näkyvän sisällön mukaan: rajat = kuvan näkyvän (ei läpinäkyvän) sisällön laatikko kuvan osuuksina
 * { x0, y0, x1, y1 }. Läpinäkyvä reuna saa mennä painoalueen yli, koska sitä ei paineta. Palauttaa sisällön reunat
 * painoalueen osuuksina ja tiedon, leikkautuuko näkyvää sisältöä.
 */
export function sisallonYlitys(kuva, alue, rajat) {
  const a = arvioiPainokuva(kuva, alue);
  const lev = a.oikea - a.vasen, kor = a.ala - a.yla;
  const r = { vasen: a.vasen + rajat.x0 * lev, oikea: a.vasen + rajat.x1 * lev, yla: a.yla + rajat.y0 * kor, ala: a.yla + rajat.y1 * kor };
  const ylittaa = r.vasen < -VARA || r.oikea > 1 + VARA || r.yla < -VARA || r.ala > 1 + VARA;
  return { ...r, ylittaa };
}

/**
 * Tuotteen painopaikkojen tarkistus. tuote = Printify-tuote (print_areas, variants), paikat = { [position]: { width,
 * height } } suurin painoalue tuotteen käytössä olevista varianteista (katalogista). Palauttaa löydökset:
 * [{ paikka, kuva, syy: "resoluutio" | "ylitys" | "kierretty" | "ei_painoaluetta", dpi }].
 */
export function tarkistaTuote(tuote, paikat) {
  const loydot = [];
  const nahty = new Set();
  for (const area of tuote.print_areas || []) {
    for (const ph of area.placeholders || []) {
      for (const kuva of ph.images || []) {
        if (kuva.type && !/^image\//.test(kuva.type)) continue; // tekstikerrokset
        if (/svg/i.test(kuva.type || "") || /\.svg$/i.test(kuva.name || "")) continue; // vektori: ei resoluutiorajaa
        if (!kuva.width || !kuva.height) continue;
        const alue = paikat[ph.position];
        if (!alue) { loydot.push({ paikka: ph.position, kuva: kuva.name, syy: "ei_painoaluetta" }); continue; }
        // Sama kuva samassa paikassa toistuu tuotteen varianttiryhmissä: tarkistetaan kerran.
        const avain = [ph.position, kuva.id, kuva.x, kuva.y, kuva.scale].join("|");
        if (nahty.has(avain)) continue;
        nahty.add(avain);
        const a = arvioiPainokuva(kuva, alue);
        if (a.dpi < MIN_DPI) loydot.push({ paikka: ph.position, kuva: kuva.name, syy: "resoluutio", dpi: a.dpi });
        if (a.ylittaa) loydot.push({ paikka: ph.position, kuva: kuva.name, syy: "ylitys", dpi: a.dpi, kuvaId: kuva.id, reunat: [a.vasen, a.oikea, a.yla, a.ala].map((v) => Math.round(v * 1000) / 1000) });
        if (a.kierretty) loydot.push({ paikka: ph.position, kuva: kuva.name, syy: "kierretty", dpi: a.dpi });
      }
    }
  }
  return loydot;
}

/** Suurin painoalue paikoittain tuotteen käytössä olevista varianteista (katalogin variants.json). */
export function suurimmatPainoalueet(katalogiVariantit, kaytossa) {
  const paikat = {};
  for (const v of katalogiVariantit || []) {
    if (kaytossa && !kaytossa.has(v.id)) continue;
    for (const p of v.placeholders || []) {
      const n = paikat[p.position];
      if (!n || p.width * p.height > n.width * n.height) paikat[p.position] = { width: p.width, height: p.height };
    }
  }
  return paikat;
}

/** Marginaali painoalueen reunoilla korjatussa sijoituksessa (osuus painoalueesta). */
export const KORJAUS_MARGINAALI = 0.02;

/**
 * Sijoitus, jolla kuvan näkyvä sisältö mahtuu painoalueelle marginaalin sisään (scripts/painotiedostot-korjaus.mjs).
 * Kuvaa pienennetään vain, jos sisältö ei muuten mahdu; muuten se vain siirtyy. Palauttaa { x, y, scale }.
 */
export function korjattuSijoitus(kuva, alue, rajat, m = KORJAUS_MARGINAALI) {
  const s = sisallonYlitys(kuva, alue, rajat);
  const k = Math.min(1, (1 - 2 * m) / (s.ala - s.yla), (1 - 2 * m) / (s.oikea - s.vasen));
  // Skaalaus kuvan keskipisteen ympäri: sisällön reunat lähestyvät keskipistettä kertoimella k.
  const reuna = (v, keski) => keski + (v - keski) * k;
  const r = { vasen: reuna(s.vasen, kuva.x), oikea: reuna(s.oikea, kuva.x), yla: reuna(s.yla, kuva.y), ala: reuna(s.ala, kuva.y) };
  const siirto = (alku, loppu) => (alku < m ? m - alku : loppu > 1 - m ? 1 - m - loppu : 0);
  const pyor = (v) => Math.round(v * 1e6) / 1e6;
  return { x: pyor(kuva.x + siirto(r.vasen, r.oikea)), y: pyor(kuva.y + siirto(r.yla, r.ala)), scale: pyor(kuva.scale * k) };
}

/**
 * Resoluution korjaus (3.11.2026): painokuvaa pienennetään, kunnes tehollinen resoluutio on vähintään
 * MIN_DPI + 2. Yläreuna ja vaakakeskikohta pysyvät, joten painatus pysyy rinnan kohdalla. Vain, jos pienennys
 * jättää vähintään PIENENNYS_MIN_OSUUS nykyisestä leveydestä; muuten palauttaa null (tuote piilotetaan,
 * api/_lib/painolaatu.js).
 */
export const PIENENNYS_MIN_OSUUS = 0.6;
export function resoluutioSijoitus(kuva, alue, tavoite = MIN_DPI + 2) {
  const a = arvioiPainokuva(kuva, alue);
  if (a.dpi >= tavoite) return { x: kuva.x, y: kuva.y, scale: kuva.scale };
  const k = ((PAINOALUE_DPI * kuva.width) / (kuva.scale * alue.width)) / tavoite;
  if (k < PIENENNYS_MIN_OSUUS) return null;
  const pyor = (v) => Math.round(v * 1e6) / 1e6;
  const korkeus = a.ala - a.yla;
  return { x: pyor(kuva.x), y: pyor(a.yla + (korkeus * k) / 2), scale: pyor(kuva.scale * k) };
}
