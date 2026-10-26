/**
 * EU-painotalosiirron puhdas logiikka (ei verkkoa, ei tietokantaa). Käyttää scripts/printify-eu-painotalot.mjs,
 * testit src/test/eu-painotalot.test.ts.
 *
 * Omistajan päätös 21.10.2026: kaikki EU:n ulkopuolella painettavat Printify-tuotteet siirretään EU-painotaloille
 * (SIIRTOSAANNOT alla). Painotalot ja blueprintit haetaan ajon aikana nimellä Printifyn katalogista; jos nimi ei
 * osu yksiselitteisesti, tuote ohitetaan selkeällä syyllä eikä mitään arvata.
 */

/** EU:n jäsenvaltiot (ISO 3166-1 alpha-2), 27 maata. Kreikka myös EL-muodossa (EU:n oma lyhenne). */
export const EU_MAAT = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "EL", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

export function onEU(maa) {
  return EU_MAAT.has(String(maa || "").trim().toUpperCase());
}

/** Painotalon maa katalogin /catalog/print_providers/{id}.json -vastauksesta. */
export function painotalonMaa(painotalo) {
  return painotalo?.location?.country ? String(painotalo.location.country).trim().toUpperCase() : null;
}

export function normalisoi(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/(\d+)\s*oz\b/g, "$1oz")
    .trim();
}

/**
 * Siirtosäännöt. kategoria = buildProductRow-kategoria; lahdePainotalo = (valinnainen) vanhan painotalon nimen osa.
 * blueprint.sisaltaa: kaikkien osien on löydyttävä blueprintin "title brand model" -tekstistä.
 * blueprint.sama: kokeile ensin samaa blueprintia (id, sitten sama nimi) kohdepainotalolla, sitten avainsanoja.
 * blueprint.suosi: jos ehdokkaita on useita, suositaan ensimmäistä osumaa näistä (vanhan tuotteen koko ensin).
 */
export const SIIRTOSAANNOT = [
  // 26.10.2026: Harrierin (GB) Accent-muki -> Textildruck Europan Two-Tone 11oz (kulu 6,90 + 10,39 € vs 7,91 + 10,39 €).
  // Ennen yleistä mukisääntöä, koska ensimmäinen osuva sääntö valitaan.
  { kategoria: "mukit", lahdePainotalo: "Harrier", painotalo: "Textildruck Europa", blueprint: { sisaltaa: ["two-tone coffee mug"] } },
  { kategoria: "mukit", painotalo: "OPT OnDemand", blueprint: { sisaltaa: ["ceramic mug", "(eu)"], suosi: ["{koko}", "11oz"] } },
  { kategoria: "t-paidat", lahdePainotalo: "Monster Digital", painotalo: "OPT OnDemand", blueprint: { sisaltaa: ["softstyle", "64000"], suosi: ["unisex"] } },
  // 22.10.2026: Printify Choice (US) -paidat samalle blueprintille OPT OnDemandille (Suomeen halvempi kulu + toimitus,
  // KATTEET.md: kate noin 10 % -> 24 % hinnalla 24,90 €).
  // 26.10.2026: Choicen Garment-Dyed-paita (706) -> Softstyle 64000 kuten Monster Digitalilla (OPT:lla ei 706:ta).
  { kategoria: "t-paidat", lahdePainotalo: "Printify Choice", painotalo: "OPT OnDemand", blueprint: { sama: true, sisaltaa: ["softstyle", "64000"], suosi: ["unisex"] } },
  // 26.10.2026: SPOKE-mukit, joiden nimessä "tee" (esim. "teen") luokittuu t-paidaksi, ovat 11oz-mukeja.
  { kategoria: "t-paidat", lahdePainotalo: "SPOKE", painotalo: "OPT OnDemand", blueprint: { sisaltaa: ["ceramic mug", "(eu)"], suosi: ["{koko}", "11oz"] } },
  // 26.10.2026: Printify Choice -hupparit (Gildan 18500, reititysverkko, voi painaa Yhdysvalloissa) samalle
  // blueprintille Textildruck Europalle (DE). Mitattu (KATTEET.md "EU-kiinteät painotalot"): etupaino S-2XL kulu
  // 24,77-25,48 € + toimitus 10,89 € vs Choice 21,58-23,77 € + 15,59 €; jokainen yhdistetty variantti vähintään yhtä
  // hyvä. Kaulapaino maksaa Textildruckilla 2,78 € lisää (Choicella ei), jolloin kate heikkenee yli 1 %-yks.: ohitetaan.
  { kategoria: "hupparit", lahdePainotalo: "Printify Choice", painotalo: "Textildruck Europa", blueprint: { sama: true, sisaltaa: [] }, ohitaPaikat: ["neck"] },
  { kategoria: "bodyt", painotalo: "Textildruck Europa", blueprint: { sisaltaa: ["babybugz", "bz10"] } },
  { kategoria: "koristeet", painotalo: "Harrier", blueprint: { sisaltaa: ["ceramic ornament"] } },
  { kategoria: "peitot", painotalo: "MWW On Demand", blueprint: { sama: true, sisaltaa: ["blanket"] } },
  { kategoria: "seinataulut", painotalo: "Jondo", blueprint: { sama: true, sisaltaa: [] } },
];

/** Palauttaa säännön tai null. lahdePainotaloNimi = vanhan painotalon title katalogista. */
export function valitseSaanto(kategoria, lahdePainotaloNimi, saannot = SIIRTOSAANNOT) {
  const lahde = normalisoi(lahdePainotaloNimi);
  return saannot.find((s) => s.kategoria === kategoria && (!s.lahdePainotalo || lahde.includes(normalisoi(s.lahdePainotalo)))) || null;
}

/**
 * Painotalo nimellä listasta (GET /catalog/print_providers.json). Osuma = kirjainkoosta riippumaton osamerkkijono;
 * useasta osumasta kelpaa vain täsmälleen samanniminen.
 */
export function valitsePainotalo(painotalot, nimi) {
  const n = normalisoi(nimi);
  const osumat = (painotalot || []).filter((p) => normalisoi(p.title).includes(n));
  if (osumat.length === 1) return { ok: true, painotalo: osumat[0] };
  const tarkat = osumat.filter((p) => normalisoi(p.title) === n);
  if (tarkat.length === 1) return { ok: true, painotalo: tarkat[0] };
  if (!osumat.length) return { ok: false, syy: `painotaloa "${nimi}" ei löydy katalogista` };
  return { ok: false, syy: `painotalo "${nimi}" ei yksiselitteinen: ${osumat.map((p) => `${p.title} (${p.id})`).join(", ")}` };
}

export function blueprintTeksti(bp) {
  return normalisoi([bp?.title, bp?.brand, bp?.model].filter(Boolean).join(" "));
}

/** Vanhan tuotteen koko (esim. "15oz") varianttien nimistä, mukisuosintaa varten. */
export function tuotteenKoko(variantit) {
  for (const v of variantit || []) {
    if (v.is_enabled === false) continue;
    const m = normalisoi(v.title).match(/\b(\d+oz)\b/);
    if (m) return m[1];
  }
  return null;
}

/**
 * Kohdeblueprint kohdepainotalon blueprinteista (painotalon tarjoamat, esim. /catalog/print_providers/{id}.json
 * .blueprints tai blueprints.json suodatettuna). vanha = { blueprint_id, blueprintTitle, koko }.
 */
export function valitseBlueprint(blueprintit, saanto, vanha = {}) {
  const bp = saanto.blueprint || {};
  const lista = blueprintit || [];
  if (bp.sama) {
    const sama = lista.filter((b) => Number(b.id) === Number(vanha.blueprint_id));
    if (sama.length === 1) return { ok: true, blueprint: sama[0], peruste: "sama blueprint" };
    const samaNimi = vanha.blueprintTitle ? lista.filter((b) => normalisoi(b.title) === normalisoi(vanha.blueprintTitle)) : [];
    if (samaNimi.length === 1) return { ok: true, blueprint: samaNimi[0], peruste: "sama blueprint-nimi" };
  }
  const osat = (bp.sisaltaa || []).map(normalisoi);
  if (!osat.length) {
    return { ok: false, syy: `kohdepainotalolla ei ole samaa blueprintia (${vanha.blueprint_id} ${vanha.blueprintTitle || ""}) eikä sääntö anna hakusanoja` };
  }
  let ehdokkaat = lista.filter((b) => osat.every((o) => blueprintTeksti(b).includes(o)));
  if (!ehdokkaat.length) return { ok: false, syy: `blueprintia ei löydy hakusanoilla [${bp.sisaltaa.join(", ")}]` };
  if (ehdokkaat.length > 1 && bp.suosi) {
    for (const s of bp.suosi) {
      const sana = s === "{koko}" ? vanha.koko : s;
      if (!sana) continue;
      const suositut = ehdokkaat.filter((b) => blueprintTeksti(b).includes(normalisoi(sana)));
      if (suositut.length) { ehdokkaat = suositut; break; }
    }
  }
  if (ehdokkaat.length === 1) return { ok: true, blueprint: ehdokkaat[0], peruste: `hakusanat [${bp.sisaltaa.join(", ")}]` };
  return { ok: false, syy: `blueprint ei yksiselitteinen: ${ehdokkaat.map((b) => `${b.title}${b.model ? ` ${b.model}` : ""} (${b.id})`).join(", ")}` };
}

// ---------- Varianttien yhdistäminen ----------

/** Saman vaihtoehdon eri kirjoitusasut eri painotaloilla (koko ja harmaa/grey). */
export function vaihtoehto(s) {
  let t = normalisoi(s).replace(/\bgray\b/g, "grey");
  const nb = t.match(/^nb \((.+)\)$/);
  if (nb) t = nb[1];
  // Vauvakoot: SwiftPOD "6M" = Babybugz "3-6M" jne. Värit: Babybugzin nimet SwiftPODin vastaaville. Mukin "Glossy"
  // (Textildruck Europan Two-Tone) on ainoa pintavaihtoehto, joten se ei erota variantteja.
  return {
    xxl: "2xl", xxxl: "3xl", xxxxl: "4xl", newborn: "0-3m", nb: "0-3m", "6m": "3-6m", "12m": "6-12m", "18m": "12-18m",
    "heather grey melange": "heather", "powder pink": "pink", glossy: "",
  }[t] ?? t;
}

/** Variantin vaihtoehdot normalisoituna joukkona: katalogivariantin options-objekti tai "Black / M" -nimi. */
export function variantinOsat(v) {
  let osat;
  if (v?.options && !Array.isArray(v.options) && typeof v.options === "object") osat = Object.values(v.options);
  else osat = String(v?.title ?? "").split("/");
  return osat.map(vaihtoehto).filter(Boolean).sort();
}

const avain = (osat) => osat.join("|");

/**
 * Vanhan tuotteen variantit (product.variants: id, title, price, is_enabled) -> kohdeblueprintin katalogivariantit
 * (variants.json: id, title, options). Osuma = samat vaihtoehdot (väri ja koko) kirjainkoosta riippumatta.
 * Jos kummallakin on vain yksi (käytössä oleva) variantti, ne yhdistetään (esim. koriste "Round" -> "Circle").
 */
export function yhdistaVariantit(vanhat, uudet) {
  const uusiAvaimella = new Map();
  const uusiIdlla = new Map();
  for (const u of uudet || []) {
    const k = avain(variantinOsat(u));
    if (!uusiAvaimella.has(k)) uusiAvaimella.set(k, u);
    uusiIdlla.set(Number(u.id), u);
  }
  // Sama nimi voi esiintyä vanhassa tuotteessa kahdesti (esim. Gildan 18500:n kaksi "Ash"-väriä, joista vain toinen on
  // käytössä). Järjestys: 1) sama variant-id ja samat vaihtoehdot (sama blueprint), 2) käytössä olevat nimellä,
  // 3) pois käytöstä olevat nimellä. Näin pois käytöstä oleva kaksoisnimi ei vie käytössä olevan varianttia.
  const kaytetyt = new Set();
  const pari = new Map(); // vanha-indeksi -> uusi
  const lista = vanhat || [];
  lista.forEach((v, i) => {
    const u = uusiIdlla.get(Number(v.id));
    if (u && !kaytetyt.has(u.id) && avain(variantinOsat(u)) === avain(variantinOsat(v))) { kaytetyt.add(u.id); pari.set(i, u); }
  });
  for (const vaihe of [true, false]) {
    lista.forEach((v, i) => {
      if (pari.has(i) || (v.is_enabled !== false) !== vaihe) return;
      const u = uusiAvaimella.get(avain(variantinOsat(v)));
      if (u && !kaytetyt.has(u.id)) { kaytetyt.add(u.id); pari.set(i, u); }
    });
  }
  const yhdistetyt = [];
  const pudotetut = [];
  lista.forEach((v, i) => {
    const u = pari.get(i);
    if (u) yhdistetyt.push({ vanhaId: v.id, uusiId: u.id, title: v.title, uusiTitle: u.title, price: v.price, is_enabled: v.is_enabled !== false });
    else pudotetut.push({ vanhaId: v.id, title: v.title, is_enabled: v.is_enabled !== false });
  });
  const kaytossa = (vanhat || []).filter((v) => v.is_enabled !== false);
  if (!yhdistetyt.length && kaytossa.length === 1 && (uudet || []).length === 1) {
    const v = kaytossa[0], u = uudet[0];
    return {
      yhdistetyt: [{ vanhaId: v.id, uusiId: u.id, title: v.title, uusiTitle: u.title, price: v.price, is_enabled: true, ainoa: true }],
      pudotetut: pudotetut.filter((p) => p.vanhaId !== v.id),
    };
  }
  return { yhdistetyt, pudotetut };
}

// ---------- Print areas ----------

/**
 * Vanhan tuotteen print_areas uusille varianteille. Kuvat (id) ja sijoitus (x, y, scale, angle) kopioidaan
 * sellaisinaan: Printifyn koordinaatit ovat suhteellisia painoalueeseen, joten asettelu säilyy.
 * Paikka (front, back, ...) jätetään pois, jos kohdevariantilla ei ole sitä (raportoidaan).
 */
export function uudetPrintAreat(vanhatAlueet, yhdistetyt, uudetKatalogiVariantit) {
  const uusiIdlle = new Map(yhdistetyt.map((y) => [Number(y.vanhaId), Number(y.uusiId)]));
  const paikatVariantille = new Map(
    (uudetKatalogiVariantit || []).map((u) => [Number(u.id), new Set((u.placeholders || []).map((p) => p.position))]),
  );
  const alueet = [];
  const pudotetutPaikat = new Set();
  const kaytetyt = new Set();
  for (const alue of vanhatAlueet || []) {
    const variantIds = [...new Set((alue.variant_ids || []).map((id) => uusiIdlle.get(Number(id))).filter((id) => id != null && !kaytetyt.has(id)))];
    if (!variantIds.length) continue;
    variantIds.forEach((id) => kaytetyt.add(id));
    const placeholders = [];
    for (const ph of alue.placeholders || []) {
      const kuvat = (ph.images || []).filter((k) => k.id);
      if (!kuvat.length) continue;
      const kaikillaPaikka = variantIds.every((id) => !paikatVariantille.has(id) || paikatVariantille.get(id).has(ph.position));
      if (!kaikillaPaikka) { pudotetutPaikat.add(ph.position); continue; }
      placeholders.push({
        position: ph.position,
        images: kuvat.map((k) => {
          const kuva = { id: k.id, x: k.x, y: k.y, scale: k.scale, angle: k.angle ?? 0 };
          if (k.pattern) kuva.pattern = k.pattern;
          return kuva;
        }),
      });
    }
    if (!placeholders.length) continue;
    const uusi = { variant_ids: variantIds, placeholders };
    if (alue.background) uusi.background = alue.background;
    alueet.push(uusi);
  }
  return { print_areas: alueet, pudotetutPaikat: [...pudotetutPaikat] };
}

/** POST /shops/{shop}/products.json -runko. */
export function uusiTuoteRunko(vanha, blueprintId, painotaloId, yhdistetyt, printAreat) {
  return {
    title: vanha.title,
    description: vanha.description ?? "",
    tags: vanha.tags || [],
    blueprint_id: Number(blueprintId),
    print_provider_id: Number(painotaloId),
    variants: yhdistetyt.map((y) => ({ id: Number(y.uusiId), price: y.price, is_enabled: y.is_enabled })),
    print_areas: printAreat,
  };
}

/** Suomen toimituskulu (ensimmäinen kappale, sentit) shipping.json-vastauksesta, kuten printify-tuonti.mjs. */
export function suomenToimitus(shipping) {
  const profiilit = shipping?.profiles || [];
  const fi = profiilit.find((x) => (x.countries || []).includes("FI")) || profiilit.find((x) => (x.countries || []).includes("REST_OF_THE_WORLD"));
  return fi?.first_item?.cost ?? null;
}

/**
 * Tietokantarivin variants-kenttä uudelle tuotteelle: rakennettu (buildProductRow) korvaa värit, koot, kuvat ja
 * variant_mapin; costs/shipping_cents uudesta tuotteesta; muut vanhat avaimet säilyvät.
 */
export function uudetDbVariantit(vanhatVariantit, rakennettu, uusiTuote, shippingCents) {
  const costs = Object.fromEntries((uusiTuote?.variants || []).filter((v) => v.is_enabled).map((v) => [String(v.id), v.cost]));
  const tulos = { ...(vanhatVariantit || {}) };
  for (const k of ["sizes", "colors", "variant_images", "default_color", "variant_map"]) delete tulos[k];
  return { ...tulos, ...(rakennettu?.variants || {}), costs, shipping_cents: shippingCents };
}
