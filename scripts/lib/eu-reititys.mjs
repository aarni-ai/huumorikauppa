/**
 * EU-reitityksen puhdas logiikka (ei verkkoa). Käyttää scripts/eu-reititys.mjs, testit src/test/eu-reititys.test.ts.
 *
 * Tausta 27.10.2026: Printify-tilaus 26630629.21 (muki, SPOKE Custom Products, US) painettiin Yhdysvalloissa ja
 * tuotti tappiota. Kaupassa näkyvä tuote ei saa osoittaa Printify-tuotteeseen, jonka painotalo on EU:n ulkopuolella
 * tai joka on reitityspainotalo (Printify Choice), joka voi valita painopaikan EU:n ulkopuolelta.
 *
 * Päätös riviä kohden:
 *   - painotalo EU:ssa                      -> ok
 *   - painotalo EU:n ulkopuolella / reititys -> EU-kopio (data/eu-siirto-*.json tai Printifyssä samanniminen tuote
 *     EU-painotalolla). Jos kopioon osoittaa täsmälleen yksi näkyvä saman kategorian kaupparivi, 301-ohjaus siihen;
 *     muuten piilotus.
 *   - Printify-tuotetta ei löydy kaupasta    -> tuntematon (vain raporttiin; scripts/printify-saatavuus.mjs hoitaa)
 */

/** EU:n jäsenvaltiot (ISO 3166-1 alpha-2). Kreikka myös EL-muodossa. */
export const EU_MAAT = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "EL", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

/**
 * Reitityspainotalot: tilaus ohjautuu verkoston painotalolle, jota ei voi valita. Printify Choice (99): sijainti
 * Miami (US), toimitusprofiilit vain US, CA, AU ja REST_OF_THE_WORLD (Suomi kuuluu tähän, käsittelyaika 10-30 pv),
 * eli Suomen tilaus painetaan verkoston (US) painotalolla. Merkitään aina EU:n ulkopuoliseksi.
 */
export const REITITYSPAINOTALOT = new Set([99]);

export const onEUMaa = (maa) => EU_MAAT.has(String(maa || "").trim().toUpperCase());

/** Painotalo { id, title, location: { country } } -> { eu, maa, syy }. */
export function painotalonTila(id, painotalo) {
  const maa = painotalo?.location?.country ? String(painotalo.location.country).trim().toUpperCase() : null;
  if (REITITYSPAINOTALOT.has(Number(id))) return { eu: false, maa, syy: "reititys" };
  if (!maa) return { eu: false, maa: null, syy: "sijainti_tuntematon" };
  return onEUMaa(maa) ? { eu: true, maa, syy: null } : { eu: false, maa, syy: "ei_eu" };
}

export const normalisoiOtsikko = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

/** data/eu-siirto-*.json -sisällöt -> Map(vanhaId -> [uusiId, ...]). */
export function siirtoKartta(tiedostot) {
  const m = new Map();
  for (const t of tiedostot || []) {
    for (const s of t?.siirrot || []) {
      if (!s?.vanhaId || !s?.uusiId) continue;
      const k = String(s.vanhaId);
      if (!m.has(k)) m.set(k, []);
      if (!m.get(k).includes(String(s.uusiId))) m.get(k).push(String(s.uusiId));
    }
  }
  return m;
}

/**
 * Pääfunktio.
 *   rivit:        Supabasen products-rivit (slug, name, category, is_active, printify_product_id, variants)
 *   tuotteet:     Printify-kaupan tuotteet (id, title, print_provider_id, blueprint_id, variants)
 *   painotalot:   Map/olio provider id -> { title, location }
 *   siirrot:      siirtoKartta(...)
 *   onNakyva(r):  kaupan näkyvyyssääntö ilman EU-reititystä (aktiivinen, ei piilotettu, ei vercel-ohjattu)
 * Palauttaa { tuotteet: [...], ohjaukset: {slug: kohde}, piilotetut: {slug: printifyId}, eiEuTuotteet: [printifyId], yhteenveto }.
 */
export function laskeEuReititys({ rivit, tuotteet, painotalot, siirrot = new Map(), onNakyva }) {
  const pt = painotalot instanceof Map ? painotalot : new Map(Object.entries(painotalot || {}).map(([k, v]) => [Number(k), v]));
  const pf = new Map((tuotteet || []).map((p) => [String(p.id), p]));
  const tila = (p) => painotalonTila(p.print_provider_id, pt.get(Number(p.print_provider_id)));
  const onEUTuote = (p) => !!p && tila(p).eu;

  const nakyvat = (rivit || []).filter((r) => r && r.slug && onNakyva(r));
  const nakyvatPid = new Map();
  for (const r of nakyvat) {
    const k = String(r.printify_product_id || "");
    if (!nakyvatPid.has(k)) nakyvatPid.set(k, []);
    nakyvatPid.get(k).push(r);
  }
  const otsikolla = new Map();
  for (const p of tuotteet || []) {
    if (/^copy of /i.test(String(p.title || ""))) continue;
    const k = normalisoiOtsikko(p.title);
    if (!otsikolla.has(k)) otsikolla.set(k, []);
    otsikolla.get(k).push(p);
  }

  const lista = [];
  const liputetut = [];
  for (const r of nakyvat) {
    const p = pf.get(String(r.printify_product_id || ""));
    const vmap = r.variants?.variant_map && typeof r.variants.variant_map === "object" ? r.variants.variant_map : {};
    const idt = Object.values(vmap).map(Number).filter(Number.isFinite);
    const omat = new Set((p?.variants || []).map((v) => Number(v.id)));
    const t = p ? tila(p) : null;
    const rivi = {
      slug: r.slug,
      kategoria: r.category ?? null,
      printify_product_id: r.printify_product_id ?? null,
      print_provider_id: p ? Number(p.print_provider_id) : null,
      painotalo: p ? pt.get(Number(p.print_provider_id))?.title ?? null : null,
      maa: t?.maa ?? null,
      eu: t ? t.eu : null,
      variantteja: idt.length,
      variantteja_ei_tuotteessa: p ? idt.filter((id) => !omat.has(id)).length : null,
      tila: !p ? "tuntematon" : t.eu ? "ok" : "liputettu",
      syy: !p ? "printify_tuote_puuttuu" : t.syy,
    };
    lista.push(rivi);
    if (rivi.tila === "liputettu") liputetut.push({ rivi, r, p });
  }

  const liputetutSlugit = new Set(liputetut.map((x) => x.rivi.slug));
  const ohjaukset = {};
  const piilotetut = [];
  for (const { rivi, r, p } of liputetut) {
    const kopioIdt = new Set(siirrot.get(String(p.id)) || []);
    for (const q of otsikolla.get(normalisoiOtsikko(p.title)) || []) if (String(q.id) !== String(p.id)) kopioIdt.add(String(q.id));
    const euKopiot = [...kopioIdt].filter((id) => onEUTuote(pf.get(id)));
    const kohteet = euKopiot
      .flatMap((id) => nakyvatPid.get(id) || [])
      .filter((x) => x.slug !== r.slug && x.category === r.category && !liputetutSlugit.has(x.slug));
    const kohdeSlugit = [...new Set(kohteet.map((x) => x.slug))];
    rivi.eu_kopiot = euKopiot;
    if (kohdeSlugit.length === 1) {
      rivi.toimenpide = "ohjaus";
      rivi.kohde = kohdeSlugit[0];
      ohjaukset[r.slug] = kohdeSlugit[0];
    } else {
      rivi.toimenpide = "piilotus";
      rivi.kohde = null;
      rivi.piilotuksen_syy = euKopiot.length === 0 ? "ei_eu_kopiota" : kohdeSlugit.length === 0 ? "eu_kopiolla_ei_nakyvaa_kaupparivia" : "useita_kohteita";
      piilotetut.push([r.slug, String(p.id)]);
    }
  }

  // Kaikki kaupan Printify-tuotteet, joiden painotalo ei ole EU:ssa: rivi piilotetaan myös, jos yöllinen synkronointi
  // osoittaa sen ajojen välillä johonkin näistä.
  const eiEuTuotteet = (tuotteet || []).filter((p) => !onEUTuote(p)).map((p) => String(p.id)).sort();

  const painotaloittain = {};
  for (const x of lista) {
    const k = x.print_provider_id == null ? "tuntematon" : `${x.print_provider_id} ${x.painotalo ?? ""} (${x.maa ?? "?"})`.trim();
    painotaloittain[k] = (painotaloittain[k] || 0) + 1;
  }
  const yhteenveto = {
    nakyvia_riveja: lista.length,
    variantteja: lista.reduce((a, x) => a + x.variantteja, 0),
    liputettuja: liputetut.length,
    liputettuja_variantteja: liputetut.reduce((a, x) => a + x.rivi.variantteja, 0),
    ohjattuja: Object.keys(ohjaukset).length,
    piilotettuja: piilotetut.length,
    eu_kopio_ilman_kaupparivia: liputetut.filter((x) => x.rivi.piilotuksen_syy === "eu_kopiolla_ei_nakyvaa_kaupparivia").length,
    tuntemattomia: lista.filter((x) => x.tila === "tuntematon").length,
    ei_eu_printify_tuotteita: eiEuTuotteet.length,
    painotaloittain,
  };
  return {
    tuotteet: lista.sort((a, b) => a.slug.localeCompare(b.slug)),
    ohjaukset: Object.fromEntries(Object.entries(ohjaukset).sort(([a], [b]) => a.localeCompare(b))),
    piilotetut: Object.fromEntries(piilotetut.sort(([a], [b]) => a.localeCompare(b))),
    eiEuTuotteet,
    yhteenveto,
  };
}

/** Ajonaikainen moduuli api/_lib/eu-reititys-data.js (JSON-import ei käänny Vercelin middleware-buildissa). */
export function renderDataModule({ generoitu, ohjaukset, piilotetut, eiEuTuotteet }) {
  return [
    "// GENEROITU: scripts/eu-reititys.mjs kirjoittaa tämän tiedoston. Älä muokkaa käsin.",
    "// EU:n ulkopuolella (tai Printify Choicen reitityksellä) valmistettavat kauppatuotteet: 301-ohjaus EU-kopioon",
    "// tai piilotus. Raportti: data/eu-reititys.json. Käyttö: api/_lib/eu-reititys.js.",
    `export const EU_REITITYS_GENERATED_AT = ${JSON.stringify(generoitu)};`,
    `export const EU_OHJAUKSET = ${JSON.stringify(ohjaukset, null, 2)};`,
    "// slug -> Printify-tuote, jonka takia rivi piilotettiin. Jos synkronointi osoittaa rivin muuhun kuin EU:n",
    "// ulkopuoliseen tuotteeseen (esim. EU-kopioon), piilotus raukeaa ilman uutta ajoa.",
    `export const EU_PIILOTETUT = ${JSON.stringify(piilotetut, null, 2)};`,
    `export const EI_EU_PRINTIFY_TUOTTEET = ${JSON.stringify(eiEuTuotteet)};`,
    "",
  ].join("\n");
}
