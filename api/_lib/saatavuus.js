/**
 * Printify-varianttien saatavuus (oma tausta). Tuoterivin kenttä unavailable_variants on lista variant_map-avaimia
 * ("Väri|Koko"), joita Printify ei juuri nyt valmista: variantti ei ole tuotteessa käytössä (is_enabled false), se on
 * loppu (is_available false), se puuttuu tuotteesta tai se puuttuu painotalon katalogista (poistunut valikoimasta).
 *
 * - ajaSaatavuus: päivittäinen tarkistus (api/cron/tilaukset.js?tehtava=saatavuus, GitHub Actions saatavuus.yml).
 *   Tuote, jonka yksikään variantti ei ole saatavilla, piilotetaan (is_active false) ja palautetaan myyntiin, kun
 *   jokin variantti palaa. Vain tarkistuksen itse piilottamat palautetaan (kv saatavuus_piilotetut).
 * - karsiVariantit: /api/products poistaa saatavuudettomat yhdistelmät variant_map-kartasta sekä värit ja koot,
 *   joilla ei ole yhtään saatavaa yhdistelmää.
 * - varianttiSaatavilla ja liveSaatavuus: kassa hylkää saatavuudettoman variantin.
 * Sama avainmuoto kuin mainin src/data/printify-saatavuus.json (products[slug].unavailable).
 */

export const EI_SAATAVILLA_VIESTI = "Valitsemaasi kokoa tai väriä ei voi juuri nyt valmistaa. Valitse toinen koko tai väri.";
export const KV_PIILOTETUT = "saatavuus_piilotetut";
export const KV_MUUTOKSET = "saatavuus_muutokset";
export const KV_VIIMEISIN = "saatavuus_viimeisin";

const kartta = (p) => {
  const k = p?.variants?.variant_map;
  return k && typeof k === "object" ? k : {};
};

/** Tuoterivin saatavuudettomat avaimet listana (jsonb tai merkkijono). */
export function saatavuusLista(p) {
  let v = p?.unavailable_variants;
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch { v = []; }
  }
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

/** Kaikki variant_map-avaimet saatavuudettomia (tyhjä kartta ei ole). */
export function kaikkiPoissa(p, lista = saatavuusLista(p)) {
  const avaimet = Object.keys(kartta(p));
  if (avaimet.length === 0) return false;
  const pois = new Set(lista);
  return avaimet.every((a) => pois.has(a));
}

/** Onko Printify-variantti (tunnus) saatavilla tuoterivin tietojen mukaan. */
export function varianttiSaatavilla(p, varianttiId, lista = saatavuusLista(p)) {
  if (lista.length === 0) return true;
  const pois = new Set(lista);
  return !Object.entries(kartta(p)).some(([avain, id]) => Number(id) === Number(varianttiId) && pois.has(avain));
}

/**
 * Saatavuudettomat avaimet Printify-tuotteesta (GET /shops/{shop}/products/{id}.json) ja valinnaisesta
 * katalogin varianttijoukosta (Set tunnuksia tai null, jos katalogia ei saatu).
 */
export function epakelvotAvaimet(tuote, printifyTuote, katalogi = null) {
  const pv = new Map((printifyTuote?.variants || []).map((v) => [Number(v.id), v]));
  return Object.entries(kartta(tuote))
    .filter(([, id]) => {
      const v = pv.get(Number(id));
      if (!v || v.is_enabled === false || v.is_available === false) return true;
      return !!katalogi && !katalogi.has(Number(id));
    })
    .map(([avain]) => avain)
    .sort();
}

/** Katalogin vastauksesta saatavien varianttien tunnukset; tyhjä tai outo vastaus: null (ei käytetä). */
export function katalogiJoukko(data) {
  const lista = Array.isArray(data) ? data : Array.isArray(data?.variants) ? data.variants : [];
  const joukko = new Set(lista.filter((v) => v && v.is_available !== false && v.available !== false).map((v) => Number(v.id)));
  return joukko.size ? joukko : null;
}

/** /api/products: saatavuudettomat yhdistelmät pois kartasta, samoin värit ja koot ilman yhtään saatavaa yhdistelmää. */
export function karsiVariantit(p) {
  const lista = saatavuusLista(p);
  if (lista.length === 0 || !p?.variants?.variant_map) return { ...p, unavailable_variants: lista };
  const pois = new Set(lista);
  const kaikki = Object.keys(p.variants.variant_map);
  const jaljella = Object.fromEntries(Object.entries(p.variants.variant_map).filter(([a]) => !pois.has(a)));
  const osa = (i) => ({ kaikki: new Set(kaikki.map((a) => a.split("|")[i])), saatavat: new Set(Object.keys(jaljella).map((a) => a.split("|")[i])) });
  const varit = osa(0);
  const koot = osa(1);
  // Arvo, joka ei esiinny kartassa lainkaan (esim. yksikokoinen ilman kokoa), jätetään ennalleen.
  const pida = (o) => (x) => !o.kaikki.has(x) || o.saatavat.has(x);
  const variants = { ...p.variants, variant_map: jaljella };
  if (Array.isArray(p.variants.colors)) variants.colors = p.variants.colors.filter(pida(varit));
  if (Array.isArray(p.variants.sizes)) variants.sizes = p.variants.sizes.filter(pida(koot));
  if (variants.default_color && Array.isArray(variants.colors) && !variants.colors.includes(variants.default_color)) {
    variants.default_color = variants.colors[0];
  }
  return { ...p, variants, unavailable_variants: lista };
}

/**
 * Tilannekuvatila: mainin src/data/printify-saatavuus.json (products[slug].unavailable, kokonaan_ei_saatavilla)
 * riveille, joilla ei ole omaa unavailable_variants-kenttää.
 */
export function liitaSaatavuusTiedosto(rivit, tiedosto) {
  if (!tiedosto || typeof tiedosto !== "object") return rivit;
  const tuotteet = tiedosto.products || {};
  const kokonaan = new Set(tiedosto.kokonaan_ei_saatavilla || []);
  return rivit.map((p) => {
    if (p.unavailable_variants !== undefined) return p;
    if (kokonaan.has(p.slug)) return { ...p, unavailable_variants: Object.keys(kartta(p)).sort() };
    const u = tuotteet[p.slug]?.unavailable;
    return Array.isArray(u) && u.length ? { ...p, unavailable_variants: u.filter((x) => typeof x === "string") } : p;
  });
}

const nuku = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Kuristin: enintään yksi kutsu per vali ms (oletus 200 ms = 5/s) kaikille käärityille funktioille yhteensä,
 * 429-vastauksella uudelleen 1, 2, 4 s välein. Kääritty funktio palauttaa { ok, status, data, virhe }.
 */
export function teeKuristin({ vali = 200, yritykset = 4, odota = nuku, kello = Date.now } = {}) {
  let seuraava = 0;
  return (fn) => async (...args) => {
    for (let i = 0; ; i++) {
      const nyt = kello();
      const viive = Math.max(0, seuraava - nyt);
      seuraava = Math.max(nyt, seuraava) + vali;
      if (viive) await odota(viive);
      const r = await fn(...args);
      if (r?.status !== 429 || i >= yritykset - 1) return r;
      await odota(1000 * 2 ** i);
    }
  };
}

/**
 * Yhden tuotteen tarkistus: { unavailable } tai { virhe }. Printifystä poistettu tuote (404): kaikki poissa.
 * katalogit: Map "bp/pp" -> Promise<Set|null> (välimuisti ajon ajaksi).
 */
export async function tarkistaTuote(p, { haeTuote, haeKatalogi = null, katalogit = new Map() }) {
  const r = await haeTuote(p.printify_product_id);
  if (r?.status === 404) return { unavailable: Object.keys(kartta(p)).sort(), poistettu: true };
  if (!r?.ok || !r.data) return { virhe: r?.virhe || `Printify ${r?.status ?? "?"}` };
  let katalogi = null;
  const bp = r.data.blueprint_id;
  const pp = r.data.print_provider_id;
  if (haeKatalogi && bp && pp) {
    const avain = `${bp}/${pp}`;
    if (!katalogit.has(avain)) katalogit.set(avain, haeKatalogi(bp, pp).then((k) => (k?.ok ? katalogiJoukko(k.data) : null)).catch(() => null));
    katalogi = await katalogit.get(avain);
  }
  return { unavailable: epakelvotAvaimet(p, r.data, katalogi) };
}

const erotus = (a, b) => {
  const s = new Set(b);
  return a.filter((x) => !s.has(x));
};

/** Muutosrivit sähköpostiin. */
export function muutosRivit(muutokset) {
  const rivit = [];
  for (const m of muutokset) {
    const nimi = `${m.name || m.slug} (${m.slug})`;
    if (m.piilotettu) rivit.push(`PIILOTETTU: ${nimi}, yksikään variantti ei ole saatavilla${m.poistettu ? " (tuote puuttuu Printifystä)" : ""}`);
    if (m.palautettu_myyntiin) rivit.push(`PALAUTETTU MYYNTIIN: ${nimi}`);
    if (m.lisatty?.length && !m.piilotettu) rivit.push(`Ei saatavilla: ${nimi}: ${m.lisatty.join(", ")}`);
    if (m.palautettu?.length) rivit.push(`Taas saatavilla: ${nimi}: ${m.palautettu.join(", ")}`);
  }
  return rivit;
}

/**
 * Päivittäinen tarkistus erissä (Vercel-funktion aikaraja): tarkistaa tuotteet, joita ei ole tarkistettu 20 tuntiin,
 * kunnes budjetti loppuu. Muutokset kertyvät kv:hen ja niistä lähtee yksi yhteenveto, kun kierros on valmis
 * (jaljella 0). Kutsuja toistaa, kunnes jaljella on 0.
 * @param varasto pgVarasto(db) tai testin muistivarasto
 * @param ilmoita async (muutokset, virheet) => { ok, eiKaytossa }
 */
export async function ajaSaatavuus(varasto, { haeTuote, haeKatalogi = null, ilmoita = null, budjettiMs = 35000, kuiva = false, kello = Date.now, raja = 500 }) {
  const piilotetut = new Set(JSON.parse((await varasto.lueKv(KV_PIILOTETUT)) || "[]"));
  const odottavat = JSON.parse((await varasto.lueKv(KV_MUUTOKSET)) || "[]");
  const rivit = await varasto.tarkistettavat([...piilotetut], raja);
  const alku = kello();
  const katalogit = new Map();
  const muutokset = [];
  const virheet = [];
  let tarkistettu = 0;
  for (const p of rivit) {
    if (kello() - alku > budjettiMs) break;
    const t = await tarkistaTuote(p, { haeTuote, haeKatalogi, katalogit });
    tarkistettu++;
    if (t.virhe) {
      virheet.push(`${p.slug}: ${t.virhe.slice(0, 200)}`);
      if (!kuiva) await varasto.merkitseTarkistetuksi(p.id);
      continue;
    }
    const vanha = saatavuusLista(p);
    const kaikki = kaikkiPoissa(p, t.unavailable);
    const oliAktiivinen = p.is_active !== false;
    let aktiivinen = oliAktiivinen;
    const m = { slug: p.slug, name: p.name, lisatty: erotus(t.unavailable, vanha), palautettu: erotus(vanha, t.unavailable) };
    if (kaikki && oliAktiivinen) {
      aktiivinen = false;
      m.piilotettu = true;
      if (t.poistettu) m.poistettu = true;
      piilotetut.add(p.id);
    } else if (!kaikki && piilotetut.has(p.id)) {
      piilotetut.delete(p.id);
      if (!oliAktiivinen) {
        aktiivinen = true;
        m.palautettu_myyntiin = true;
      }
    }
    if (!kuiva) {
      await varasto.tallenna(p.id, { unavailable: t.unavailable, is_active: aktiivinen });
      if (m.piilotettu) await varasto.tapahtuma("saatavuus_piilotettu", { product_id: p.id, slug: p.slug, poistettu: !!t.poistettu });
      if (m.palautettu_myyntiin) await varasto.tapahtuma("saatavuus_palautettu", { product_id: p.id, slug: p.slug });
    }
    if (m.lisatty.length || m.palautettu.length || m.piilotettu || m.palautettu_myyntiin) muutokset.push(m);
  }
  const tulos = { tarkistettu, muutoksia: muutokset.length, virheita: virheet.length, muutokset: muutokset.slice(0, 50), virheet: virheet.slice(0, 20) };
  if (kuiva) return { ...tulos, jaljella: Math.max(0, rivit.length - tarkistettu), ilmoitettu: false };

  await varasto.kirjoitaKv(KV_PIILOTETUT, JSON.stringify([...piilotetut]));
  const kertyneet = [...odottavat, ...muutokset];
  const jaljella = await varasto.jaljella([...piilotetut]);
  let ilmoitettu = false;
  if (jaljella === 0 && kertyneet.length && ilmoita) {
    const r = await ilmoita(kertyneet, virheet);
    ilmoitettu = !!r?.ok;
    // Ilman sähköpostia kertymää ei säilytetä (muuten se kasvaisi loputtomiin); epäonnistunut lähetys yritetään uudelleen.
    await varasto.kirjoitaKv(KV_MUUTOKSET, JSON.stringify(r?.ok || r?.eiKaytossa ? [] : kertyneet.slice(-500)));
  } else {
    await varasto.kirjoitaKv(KV_MUUTOKSET, JSON.stringify(kertyneet.slice(-500)));
  }
  await varasto.kirjoitaKv(KV_VIIMEISIN, JSON.stringify({ at: new Date(kello()).toISOString(), tarkistettu, muutoksia: muutokset.length, virheita: virheet.length, jaljella }));
  return { ...tulos, jaljella, ilmoitettu };
}

/** Postgres-toteutus (api/_lib/db.js sql()). */
export function pgVarasto(db) {
  // db.json: postgres.js sarjallistaa jsonb-parametrin itse; JSON.stringify(...)::jsonb koodasi taulukon kahdesti
  // (merkkijonoskalaari, "cannot extract elements from a scalar"), ja saatavuustehtävä kaatui oikeaa kantaa vasten.
  const vanhentunut = (idt) => db`printify_product_id is not null
    and (is_active is not false or id::text in (select jsonb_array_elements_text(${db.json((idt || []).map(String))})))
    and (availability_checked_at is null or availability_checked_at < now() - interval '20 hours')`;
  return {
    tarkistettavat: (idt, raja) => db`select id, slug, name, variants, printify_product_id, is_active, unavailable_variants
      from products where ${vanhentunut(idt)} order by availability_checked_at nulls first, id limit ${raja}`,
    jaljella: async (idt) => Number((await db`select count(*)::int as n from products where ${vanhentunut(idt)}`)[0].n),
    tallenna: (id, { unavailable, is_active }) => db`update products set unavailable_variants = ${db.json(unavailable)},
      availability_checked_at = now(), is_active = ${is_active},
      updated_at = case when is_active is distinct from ${is_active} then now() else updated_at end where id = ${id}`,
    merkitseTarkistetuksi: (id) => db`update products set availability_checked_at = now() where id = ${id}`,
    tapahtuma: (laji, tiedot) => db`insert into order_events (order_id, kind, details) values (null, ${laji}, ${db.json(tiedot)})`,
    lueKv: async (avain) => (await db`select value from kv where key = ${avain}`)[0]?.value ?? null,
    kirjoitaKv: (avain, arvo) => db`insert into kv (key, value) values (${avain}, ${arvo})
      on conflict (key) do update set value = excluded.value, updated_at = now()`,
  };
}

/**
 * Kassan reaaliaikainen tarkistus: yksi Printify-haku per korin eri tuote (haeTuote antaa oman aikarajansa, 3 s).
 * Palauttaa tuoterivit, joiden unavailable_variants on tallennetun ja tuoreen tiedon yhdiste. Virhe tai aikaraja:
 * tallennettu tieto (fail-open).
 */
export async function liveSaatavuus(tuotteet, items, { haeTuote, maksimi = 8 }) {
  try {
    const byId = new Map(tuotteet.map((p) => [p.id, p]));
    const bySlug = new Map(tuotteet.map((p) => [p.slug, p]));
    const korissa = new Map();
    for (const it of Array.isArray(items) ? items : []) {
      if (!it || it.type === "giftcard") continue;
      const p = (it.id && byId.get(it.id)) || (it.slug && bySlug.get(it.slug));
      if (p?.printify_product_id && !korissa.has(p.id)) korissa.set(p.id, p);
    }
    const valitut = [...korissa.values()].slice(0, maksimi);
    if (valitut.length === 0) return tuotteet;
    const tulokset = await Promise.all(valitut.map(async (p) => {
      try {
        const r = await haeTuote(p.printify_product_id);
        return r?.ok && r.data ? [p.id, epakelvotAvaimet(p, r.data)] : null;
      } catch {
        return null;
      }
    }));
    const tuoreet = new Map(tulokset.filter(Boolean));
    if (tuoreet.size === 0) return tuotteet;
    return tuotteet.map((p) => (tuoreet.has(p.id)
      ? { ...p, unavailable_variants: [...new Set([...saatavuusLista(p), ...tuoreet.get(p.id)])].sort() }
      : p));
  } catch {
    return tuotteet;
  }
}
