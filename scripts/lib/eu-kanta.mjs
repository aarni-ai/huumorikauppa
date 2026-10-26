/**
 * EU-kopiot omassa tietokannassa (oma tausta). scripts/printify-eu-painotalot.mjs loi EU-painotalokopiot vanhoista
 * Printify-tuotteista ja kirjasi jokaisen siirron tiedostoon data/eu-siirto-<pvm>.json ({ siirrot: [{ vanhaId, uusiId,
 * title, ... }] }). Vanhat tuotteet jäävät Printifyyn samalla nimellä, joten nimen perusteella tuotaessa syntyisi
 * kaksoisrivejä, joiden slugissa on Printify-tunnuksen 6 viimeistä merkkiä (Lovablen synkan virhe).
 *
 * Säännöt (käyttävät printify-tuonti.mjs, tuo-tuotteet.mjs ja printify-eu-painotalot.mjs --paivita-kanta):
 *   - Printify-tuote, jonka id on jonkin siirron vanhaId, ohitetaan tuonnissa: EU-kopio korvaa sen.
 *   - EU-kopio (uusiId), jolle kannassa on rivi vanhalla id:llä, PÄIVITTÄÄ sen rivin: printify_product_id, variants
 *     (variant_map, värit, koot, kuvat, costs, shipping_cents) ja images vaihtuvat; slug, nimi, hinta, näkyvyys ja
 *     kuvaus säilyvät. Uutta riviä ei luoda.
 *   - Jos EU-kopio on jo ehditty tuoda omaksi rivikseen jälkiliitteellisellä slugilla (perus-slug + "-" + 6 heksaa),
 *     se poistetaan, kun perusrivi siirretään EU-kopioon.
 *
 * Tietokanta käytetään pienen liittymän kautta (postgresKanta), jotta logiikka on testattavissa muistissa.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { suomenToimitus, uudetDbVariantit } from "./eu-painotalot.mjs";

/** Kaikki kirjatut siirrot: vanhaan (vanhaId -> kirjaus) ja uuteen (uusiId -> kirjaus). Rikkinäinen tiedosto ohitetaan. */
export function lueEuSiirrot(dataKansio, { varoita = (v) => console.warn(v) } = {}) {
  const vanhaan = new Map();
  const uuteen = new Map();
  const tiedostot = [];
  if (!existsSync(dataKansio)) return { vanhaan, uuteen, tiedostot };
  for (const f of readdirSync(dataKansio).filter((f) => /^eu-siirto-.*\.json$/.test(f)).sort()) {
    let siirrot;
    try {
      siirrot = JSON.parse(readFileSync(path.join(dataKansio, f), "utf8")).siirrot || [];
    } catch (e) {
      varoita(`${f}: ei luettavissa (${e.message}), ohitetaan`);
      continue;
    }
    tiedostot.push(f);
    for (const r of siirrot) {
      if (!r?.vanhaId || !r?.uusiId) continue;
      vanhaan.set(String(r.vanhaId), r);
      uuteen.set(String(r.uusiId), r);
    }
  }
  return { vanhaan, uuteen, tiedostot };
}

/** Lovable-tyyppinen kaksoiskappaleslug: <perus>-<6 heksaa, joukossa numero>. */
export function onKaksoisSlug(slug, perusSlug) {
  const m = /^(.+)-([0-9a-f]{6})$/.exec(String(slug || ""));
  return !!m && /\d/.test(m[2]) && (perusSlug == null || m[1] === perusSlug);
}

/** postgres.js-yhteys liittymäksi. */
export function postgresKanta(sql) {
  const json = new Set(["variants", "images", "unavailable_variants"]);
  const arvot = (kentat) => Object.fromEntries(Object.entries(kentat).map(([k, v]) => [k, json.has(k) ? sql.json(v) : v]));
  return {
    rivit: () => sql`select slug, printify_product_id, variants from products`,
    rivitTuotteelle: (id) => sql`select slug, printify_product_id, variants from products where printify_product_id = ${String(id)}`,
    async paivita(slug, kentat) {
      const a = arvot(kentat);
      await sql`update products set ${sql(a, Object.keys(a))}, updated_at = now() where slug = ${slug}`;
    },
    async lisaa(rivi) {
      const a = arvot(rivi);
      const r = await sql`insert into products ${sql(a, Object.keys(a))} on conflict (slug) do nothing returning slug`;
      return r.length > 0;
    },
    async poista(slug) {
      await sql`delete from products where slug = ${slug}`;
    },
  };
}

/**
 * Siirtää rivit, joiden printify_product_id = vanhaId, EU-kopioon `uusi` (Printify-tuoteobjekti). Idempotentti:
 * toisella kerralla vanhalla id:llä ei ole rivejä. Palauttaa { tila, slugit, poistetut }.
 */
export async function siirraRivitEuKopioon(kanta, vanhaId, uusi, { buildProductRow, shippingCents = null }) {
  const rivit = await kanta.rivitTuotteelle(String(vanhaId));
  if (!rivit.length) return { tila: "ei-rivia", slugit: [], poistetut: [] };
  const rakennettu = buildProductRow(uusi, []);
  if (!rakennettu) return { tila: "ei-tunnistettu", slugit: [], poistetut: [] };
  const slugit = [];
  for (const r of rivit) {
    const kentat = {
      printify_product_id: String(uusi.id),
      variants: uudetDbVariantit(r.variants, rakennettu, uusi, shippingCents),
      // Vanhan painotalon saatavuustieto ei koske uutta tuotetta; päivittäinen tarkistus täyttää sen uudelleen.
      unavailable_variants: [],
    };
    if (rakennettu.images?.length) kentat.images = rakennettu.images;
    await kanta.paivita(r.slug, kentat);
    slugit.push(r.slug);
  }
  const poistetut = [];
  for (const d of await kanta.rivitTuotteelle(String(uusi.id))) {
    if (!slugit.includes(d.slug) && slugit.some((s) => onKaksoisSlug(d.slug, s))) {
      await kanta.poista(d.slug);
      poistetut.push(d.slug);
    }
  }
  return { tila: "paivitetty", slugit, poistetut };
}

/**
 * Kaikki kirjatut siirrot kantaan (tuo-tuotteet.mjs ja --paivita-kanta). Printifystä haetaan vain ne EU-kopiot, joiden
 * vanhalla id:llä on vielä rivejä, joten uusinta-ajo ei tee mitään.
 *   haeTuote(uusiId) -> Printify-tuote tai null; toimitus(bp, pp) -> Suomen toimituskulu sentteinä tai null.
 */
export async function paivitaSiirrotKantaan({ kanta, siirrot, haeTuote, toimitus, buildProductRow, loki = () => {} }) {
  const tulos = { paivitetty: 0, jo: 0, eiRivia: 0, poistetut: [], virheet: [] };
  const ids = new Set((await kanta.rivit()).map((r) => String(r.printify_product_id ?? "")));
  for (const s of siirrot.vanhaan.values()) {
    const vanhaId = String(s.vanhaId);
    const uusiId = String(s.uusiId);
    if (!ids.has(vanhaId)) {
      if (ids.has(uusiId)) tulos.jo++;
      else tulos.eiRivia++;
      continue;
    }
    try {
      const uusi = await haeTuote(uusiId);
      if (!uusi) throw new Error(`EU-kopiota ${uusiId} ei löydy Printifystä`);
      const shippingCents = await toimitus(uusi.blueprint_id, uusi.print_provider_id);
      const r = await siirraRivitEuKopioon(kanta, vanhaId, uusi, { buildProductRow, shippingCents });
      if (r.tila !== "paivitetty") throw new Error(`${r.tila} (${s.title})`);
      tulos.paivitetty += r.slugit.length;
      tulos.poistetut.push(...r.poistetut);
      ids.delete(vanhaId);
      ids.add(uusiId);
      loki(`  ${r.slugit.join(", ")}: ${vanhaId} -> ${uusiId}${r.poistetut.length ? ` (poistettu kaksoisrivi ${r.poistetut.join(", ")})` : ""}`);
    } catch (e) {
      tulos.virheet.push({ vanhaId, uusiId, virhe: String(e?.message ?? e) });
      loki(`  VIRHE ${vanhaId} -> ${uusiId}: ${e?.message ?? e}`);
    }
  }
  return tulos;
}

/**
 * Printify -> kanta (scripts/printify-tuonti.mjs). tuotteet: Printify-tuotteet; kulutRivi(p) -> { costs, shipping_cents }.
 * Palauttaa laskurit. kuiva: ei kirjoita (kanta voi olla null).
 */
export async function tuoPrintifysta({ tuotteet, kanta, siirrot, buildProductRow, kulutRivi, hinnat = false, kulut = false, julkaise = false, kuiva = false }) {
  const olemassa = kanta ? await kanta.rivit() : [];
  const slugit = olemassa.map((r) => r.slug);
  const byPrintify = new Map();
  for (const r of olemassa) if (r.printify_product_id && !byPrintify.has(String(r.printify_product_id))) byPrintify.set(String(r.printify_product_id), r.slug);
  const t = { uusia: 0, paivitetty: 0, korvattu: 0, ohitettuSiirretty: 0, ohitettu: 0, poistetut: [] };

  for (const p of tuotteet) {
    const id = String(p.id);
    if (siirrot.vanhaan.has(id)) { t.ohitettuSiirretty++; continue; }
    const vanhaId = siirrot.uuteen.has(id) ? String(siirrot.uuteen.get(id).vanhaId) : null;
    if (vanhaId && byPrintify.has(vanhaId)) {
      if (!kuiva) {
        const { shipping_cents } = await kulutRivi(p);
        const r = await siirraRivitEuKopioon(kanta, vanhaId, p, { buildProductRow, shippingCents: shipping_cents });
        if (r.tila !== "paivitetty") { t.ohitettu++; continue; }
        t.poistetut.push(...r.poistetut);
        for (const s of r.poistetut) slugit.splice(slugit.indexOf(s), 1);
      }
      byPrintify.set(id, byPrintify.get(vanhaId)); // EU-kopio osoittaa nyt perusriviin
      byPrintify.delete(vanhaId);
      t.korvattu++;
      continue;
    }
    const rivi = buildProductRow(p, slugit);
    if (!rivi) { t.ohitettu++; continue; }
    const vanhaSlug = byPrintify.get(id);
    if (kuiva) { vanhaSlug ? t.paivitetty++ : t.uusia++; continue; }
    if (kulut) Object.assign(rivi.variants, await kulutRivi(p));
    if (vanhaSlug) {
      await kanta.paivita(vanhaSlug, { printify_product_id: id, variants: rivi.variants, images: rivi.images, ...(hinnat ? { price: rivi.price } : {}) });
      t.paivitetty++;
    } else {
      const lisatty = await kanta.lisaa({
        name: rivi.name, slug: rivi.slug, category: rivi.category, humor_type: rivi.humor_type ?? null, price: rivi.price,
        stock: rivi.stock ?? 99, description: rivi.description ?? null, images: rivi.images, variants: rivi.variants,
        printify_product_id: id, supplier: "printify", is_active: julkaise,
      });
      slugit.push(rivi.slug);
      if (lisatty) { byPrintify.set(id, rivi.slug); t.uusia++; } else t.ohitettu++;
    }
  }
  return t;
}

// ---------- Tilannekuva ja Printify-haut (tuo-tuotteet.mjs, printify-tuonti.mjs) ----------

export const TILANNEKUVA_SARAKKEET = ["id", "name", "slug", "category", "humor_type", "price", "stock", "description", "images", "variants",
  "is_featured", "is_new", "is_gift_idea", "is_active", "supplier", "aliexpress_url", "origin_country", "printify_product_id", "created_at", "updated_at"];
const EU_SARAKKEET = new Set(["printify_product_id", "variants", "images", "id", "slug"]);

/**
 * Tilannekuvan rivit kantaan (upsert slugin mukaan). Turvallinen ajaa uudelleen ja erissä: uusinta-ajo ei palauta jo
 * EU-kopioon siirrettyä riviä vanhaan tuotteeseen (printify_product_id, variants, images, id ja slug säilyvät).
 * sql: postgres.js-yhteys. Palauttaa tuotujen rivien määrän.
 */
export async function tuoTilannekuvaRivit(sql, rivit, siirrot) {
  const nykyiset = new Map((await sql`select slug, printify_product_id from products`).map((r) => [r.slug, String(r.printify_product_id ?? "")]));
  const sarakkeet = TILANNEKUVA_SARAKKEET;
  let n = 0;
  for (const r of rivit) {
    const arvot = Object.fromEntries(sarakkeet.map((k) => [k, ["images", "variants"].includes(k) ? sql.json(r[k] ?? (k === "images" ? [] : {})) : r[k] ?? null]));
    const euRivi = String(siirrot.uuteen.get(nykyiset.get(r.slug))?.vanhaId ?? "") === String(r.printify_product_id ?? "-");
    const paivitettavat = sarakkeet.filter((k) => (euRivi ? !EU_SARAKKEET.has(k) : k !== "id" && k !== "slug"));
    await sql`insert into products ${sql(arvot, sarakkeet)} on conflict (slug) do update set ${sql(arvot, paivitettavat)}`;
    n++;
  }
  return n;
}

/**
 * Printify-haut uusinnalla (429/5xx porrastetusti, 404 -> null) ja Suomen toimituskulu välimuistissa.
 *   haeTuote(id), toimitus(bp, pp) -> sentit tai null (suomenToimitus), kulutRivi(p) -> { costs, shipping_cents }.
 */
export function printifyHaut({ apiKey, shopId, fetchImpl = fetch, odota = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  const hae = async (polku) => {
    for (let yritys = 1; ; yritys++) {
      const res = await fetchImpl(`https://api.printify.com/v1${polku}`, { headers: { Authorization: `Bearer ${apiKey}`, "User-Agent": "huumorikauppa-tuonti" } });
      if ((res.status === 429 || res.status >= 500) && yritys < 6) { await odota(2000 * 2 ** (yritys - 1)); continue; }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Printify HTTP ${res.status} ${polku}`);
      return res.json();
    }
  };
  const toimitukset = new Map();
  /** Suomen toimitusprofiili: { eka, lisa } sentteinä (ensimmäinen ja lisäkappale) tai null. */
  const profiili = (bp, pp) => {
    if (!toimitukset.has(`${bp}/${pp}`)) {
      toimitukset.set(`${bp}/${pp}`, hae(`/catalog/blueprints/${bp}/print_providers/${pp}/shipping.json`).then((j) => {
        const prof = j?.profiles || [];
        const fi = prof.find((x) => (x.countries || []).includes("FI")) || prof.find((x) => (x.countries || []).includes("REST_OF_THE_WORLD"));
        return { eka: suomenToimitus(j), lisa: fi?.additional_items?.cost ?? null };
      }).catch(() => ({ eka: null, lisa: null })));
    }
    return toimitukset.get(`${bp}/${pp}`);
  };
  const toimitus = async (bp, pp) => (await profiili(bp, pp)).eka;
  // Korialennuksen katevahti (api/_lib/korialennus.js) tarvitsee lisäkappaleen toimituksen ja painotalon.
  const kulutRivi = async (p) => {
    const { eka, lisa } = await profiili(p.blueprint_id, p.print_provider_id);
    return {
      costs: Object.fromEntries((p.variants || []).filter((v) => v.is_enabled).map((v) => [String(v.id), v.cost])),
      shipping_cents: eka,
      shipping_additional_cents: lisa,
      print_provider_id: p.print_provider_id ?? null,
    };
  };
  return {
    hae,
    haeTuote: (id) => hae(`/shops/${shopId}/products/${id}.json`),
    /** Yksi sivu kaupan tuotteita (limit 50): { tuotteet, viimeinen }. */
    async tuotesivu(sivu) {
      const d = await hae(`/shops/${shopId}/products.json?page=${sivu}&limit=50`);
      const tuotteet = Array.isArray(d) ? d : d?.data || [];
      return { tuotteet, viimeinen: !tuotteet.length || tuotteet.length < 50 || (d?.last_page ? sivu >= d.last_page : false) };
    },
    toimitus,
    kulutRivi,
  };
}
