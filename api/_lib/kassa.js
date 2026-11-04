/**
 * Kassan laskenta (puhdas, testattava). Samat säännöt kuin vanhassa create-checkoutissa: hinta palvelimelta,
 * toimitus (vakiot.js) alle ilmaisen toimituksen rajan jäävissä tilauksissa, prosentti- tai euroalennus. Uutta: tuote, jonka Printify-varianttia
 * ei löydy, tai myynnistä piilotettu tuote hylätään ennen maksua.
 *
 * Lisäksi (kasvu-oma-tausta):
 * - Lahjakortit (type "giftcard", api/_lib/lahjakortti.js): ei Printifyä, ei katesääntöä, ei toimitusmaksua, eivät
 *   kerrytä ilmaisen toimituksen rajaa eikä alennuskoodi koske niitä. Pelkkä lahjakorttitilaus ei vaadi osoitetta.
 * - Pakettialennus (api/_lib/paketit.js): kun paketin molemmat tuotteet ovat korissa eikä alennuskoodia käytetä,
 *   ja vain jos paketin nettokate ilmaisella toimituksella on vähintään PAKETTI_MIN_KATE_EUROA (12 €). Lahjapaketti
 *   saa kahden tuotteen ilmaisen toimituksen (2.11.2026).
 * - Saatavuus (api/_lib/saatavuus.js): variantti, joka on tuoterivin unavailable_variants-listassa (päivittäinen
 *   Printify-tarkistus, kassalla tuoreella haulla täydennettynä), hylätään ennen maksua.
 * - Lahjakortilla maksu: tarkistettu saldo vähennetään maksettavasta (lahjakortti { koodi, saldo }).
 * - Ensitilauksen koodi (alennus.ensitilaus, api/_lib/markkinointi.js): sama sääntö kuin muilla koodeilla, eli tilauksen
 *   nettokate alennuksen jälkeen vähintään TILAUKSEN_MIN_KATE_EUROA (2.11.2026; aiemmin 30 %:n katteen raja).
 * - Kahden tuotteen alennus (api/_lib/korialennus.js, vakiot.js KORIALENNUS_*): ilman alennuskoodia, kun korissa on
 *   vähintään kaksi fyysistä tuotetta; koskee pakettiin kuulumattomia rivejä ja annetaan vain, jos tilauksen nettokate
 *   alennuksen jälkeen pysyy katevahdin rajalla. Ilmaisen toimituksen raja lasketaan alennusta edeltävästä summasta.
 * - Riveille tallentuu Printifyn kulu tilaushetkellä (kulu_sentit, toimitus_sentit): päivän yhteenvedon kate.
 * - TERVE-koodi (4.11.2026): lisäksi nettokate vähintään 7 € jokaista tilauksen kappaletta kohden (api/_lib/katesaanto.js).
 * - Ensimmäisen tilauksen -5 % (A/B-testi 5.11.2026, api/_lib/ensitilaus.js): vain versiossa B, kun palvelin on todennut
 *   tilauksen ensimmäiseksi (lisat.ensimmainenTilaus), ei minkään muun alennuksen kanssa, ja vain jos nettokate
 *   alennuksen jälkeen on vähintään 7 € kappaletta kohden. Lasketaan hintatestin (toimitustesti.js) jälkeen.
 * - Joulukalenteri (4.11.2026, api/_lib/joulukalenteri.js): lisat.joulukalenteri { luukut, nyt } (api/checkout.js).
 *   Tämän päivän (Suomen aika) luukun tuotteen rivit saavat luukun hinnan, kun alennuskoodia ei ole. Silloin tilaukselle
 *   ei anneta paketti-, kahden tuotteen-, määrä- eikä ensitilauksen alennusta eikä hintatestin B-hintaa, ja toimitus on
 *   pienin porras, jolla nettokate on vähintään 7 € kappaletta kohden. Jos raja ei täyty, luukun hintaa ei anneta.
 *   Jos tilaus olisi tavallisilla säännöillä (kahden tuotteen alennus, ilmainen toimitus, määräalennus) edullisempi,
 *   käytetään niitä (laskeTilaus vertaa, joulukalenteri.syy "edullisempi_ilman").
 */
import { myynnissa, printifyVariantti } from "./tuotteet.js";
import { laskeKate, laskeTilauksenNettokate, toimitusmaksuKatteella } from "./kate.js";
import { sovellaKassaan } from "./toimitustesti.js";
import { ensitilausAlennus, alennaRivit, pohjaSentit } from "./ensitilaus.js";
import { riittaaPerKpl } from "./katesaanto.js";
import { rivinHinta } from "./kokohinnat.js";
import { ILMAINEN_TOIMITUS_RAJA, TOIMITUS, TILAUKSEN_MIN_KATE_EUROA, LISATUOTE_KATEGORIAT, toimitusmaksu } from "./vakiot.js";
import { sovellaPaketit } from "./paketit.js";
import { sovellaKorialennus } from "./korialennus.js";
import { lahjakorttiTuote, onLahjakortti, kaytettavaSumma } from "./lahjakortti.js";
import { varianttiSaatavilla, EI_SAATAVILLA_VIESTI } from "./saatavuus.js";
import { PERSONOITU_TUOTE, PERSONOITU_HUPPARI, onPersonoitu, personoitujenTyyppi, jasennaPersonointi, personointiTeksti } from "./personoitu.js";
import { LOGOPAITA_TUOTE, LOGOPAITA_MIN_KPL, onLogopaita, jasennaLogopaita, logopaitaTeksti, sallitutVarit } from "./logopaita.js";
import { avoinLuukku, sovellaLuukku, luukunToimitus } from "./joulukalenteri.js";

export { ILMAINEN_TOIMITUS_RAJA, TOIMITUS };
/**
 * Koodit, jos tietokantaa ei ole. Tyhjä 29.10.2026 alkaen: HUUMORI5 ja PALAA10 poistettiin (KATTEET.md
 * "Alennuskoodit 29.10.2026"). Tietokannan discount_codes ja ensitilauksen koodit toimivat, kun tilauksen kate pysyy
 * alennuksen jälkeen vähintään TILAUKSEN_MIN_KATE_EUROA.
 */
export const OLETUSKOODIT = {};

const sentit = (x) => Math.round(x * 100);
const STRIPE_MINIMI_SENTIT = 50;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const teksti = (x, max) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null);

export class KassaVirhe extends Error {
  constructor(viesti, vaihe) {
    super(viesti);
    this.vaihe = vaihe;
  }
}

function lahjakorttiRivi(it) {
  const p = lahjakorttiTuote(String(it.id || it.slug || "").replace(/^lahjakortti-/, ""));
  if (!p) throw new KassaVirhe(`Tuntematon lahjakortti: ${it.name || it.slug}`, "unknown_product");
  const vastaanottaja = it.giftCard || {};
  const email = teksti(vastaanottaja.recipientEmail, 200);
  if (email && !EMAIL_RE.test(email)) throw new KassaVirhe("Lahjakortin saajan sähköpostiosoite on virheellinen.", "invalid_recipient_email");
  return {
    type: "giftcard",
    product_id: p.id, slug: p.slug, name: p.name, size: null, color: null, custom_text: null, image: null,
    quantity: it.quantity, unit_price: p.price, printify_product_id: null, variant_id: null,
    recipient_email: email, recipient_name: teksti(vastaanottaja.recipientName, 100), message: teksti(vastaanottaja.message, 500),
  };
}

/**
 * @param pyynto { items, customerEmail, customerName, shippingAddress, recipientName, discountCode }
 * @param tuotteet kaikki tuoterivit
 * @param alennus { type, value } tai null
 * @param lisat { paketit: pakettimääritykset, lahjakortti: { koodi, saldo } tarkistettu kortti tai null,
 *   korialennus: asetukset ({ prosentti, minKpl, minKateEuroa }, oletus vakiot.js), toimitusVersio: "a" | "b",
 *   ensitilausVersio: "a" | "b", ensimmainenTilaus: true vain, kun palvelin on todennut, ettei osoitteella ole maksettuja tilauksia }
 */
export function laskeTilaus(pyynto, tuotteet, alennus, lisat = {}) {
  // Joulukalenteri: luukun hinta vain, jos tilaus on sillä asiakkaalle vähintään yhtä edullinen kuin tavallisilla
  // säännöillä (esim. kahden tuotteen -5 % ja ilmainen toimitus voivat olla edullisempia). Ei koskaan molempia.
  const tulos = laskeTilausKerran(pyynto, tuotteet, alennus, lisat);
  if (!tulos.joulukalenteri?.paiva) return tulos;
  let ilman = null;
  try {
    ilman = laskeTilausKerran(pyynto, tuotteet, alennus, { ...lisat, joulukalenteri: null });
  } catch {
    ilman = null;
  }
  return ilman && ilman.total < tulos.total ? { ...ilman, joulukalenteri: { syy: "edullisempi_ilman" } } : tulos;
}

function laskeTilausKerran(pyynto, tuotteet, alennus, lisat = {}) {
  const { items, customerEmail, shippingAddress } = pyynto || {};
  if (!Array.isArray(items) || items.length === 0) throw new KassaVirhe("Ostoskori on tyhjä.", "missing_items");
  if (!customerEmail || !EMAIL_RE.test(customerEmail)) throw new KassaVirhe("Sähköpostiosoite puuttuu tai on virheellinen.", "missing_email");
  const vainLahjakortteja = items.every((it) => onLahjakortti(it));
  if (!vainLahjakortteja && (!shippingAddress?.address || !shippingAddress?.zip || !shippingAddress?.city)) {
    throw new KassaVirhe("Toimitusosoite puuttuu.", "missing_address");
  }
  // Personoitu t-paita ja huppari sekä Oma logo -paita ovat virtuaalisia tuoterivejä (api/_lib/personoitu.js, logopaita.js).
  const kaikki = [...tuotteet, PERSONOITU_TUOTE, PERSONOITU_HUPPARI, LOGOPAITA_TUOTE];
  const byId = new Map(kaikki.map((p) => [p.id, p]));
  const bySlug = new Map(kaikki.map((p) => [p.slug, p]));
  const lahjakortit = [];
  const rivit = [];
  for (const it of items) {
    if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 99) throw new KassaVirhe("Virheellinen määrä.", "invalid_quantity");
    if (onLahjakortti(it)) {
      lahjakortit.push(lahjakorttiRivi(it));
      continue;
    }
    const p = (it.id && byId.get(it.id)) || (it.slug && bySlug.get(it.slug));
    if (!p) throw new KassaVirhe(`Tuotetta ei löydy: ${it.name || it.slug}`, "unknown_product");
    if (!myynnissa(p)) throw new KassaVirhe(`Tuote ei ole enää myynnissä: ${p.name}`, "hidden_category");
    // Koon mukainen hinta (api/_lib/kokohinnat.js: hupparit 3XL+), muuten tuoterivin hinta.
    const hinta = Number(rivinHinta(p, it.size));
    if (!Number.isFinite(hinta) || hinta <= 0) throw new KassaVirhe(`Tuotteen hintaa ei voitu vahvistaa: ${p.name}`, "unknown_product_price");
    const variantti = printifyVariantti(p, it.color, it.size);
    if (!p.printify_product_id || variantti === null) {
      throw new KassaVirhe(`Valitse koko ja väri uudelleen tuotteelle ${p.name}. Tätä vaihtoehtoa ei voi nyt tilata.`, "missing_variant");
    }
    if (!varianttiSaatavilla(p, variantti)) throw new KassaVirhe(`${EI_SAATAVILLA_VIESTI} Tuote: ${p.name}.`, "variant_unavailable");
    // Katesääntö: alle rajan (kate.js tuotteenKateraja: 20 %, hupparit 10 %) tai tuntematon Printify-kulu -> ei maksua.
    const kate = laskeKate(p, variantti);
    if (!kate.tunnettu) throw new KassaVirhe(`Tuotteen ${p.name} hintaa ei voitu vahvistaa. Yritä hetken kuluttua uudelleen.`, "unknown_cost");
    if (!kate.sallittu) throw new KassaVirhe(`Tuote ${p.name} ei ole tällä hetkellä tilattavissa.`, "low_margin");
    // Personoitu: teksti tarkistetaan palvelimella uudelleen (merkkimäärä, estetyt sanat, tavaramerkit ja se, että
    // teksti mahtuu tuotteen painoalueelle).
    let customText = teksti(it.customText, 200);
    if (onPersonoitu(p)) {
      const pers = jasennaPersonointi(customText, { tuote: personoitujenTyyppi(p) });
      if (!pers.ok) throw new KassaVirhe(`Personoitu paita: ${pers.virhe}`, "invalid_personalization");
      customText = personointiTeksti(pers);
    }
    // Oma logo -paita: logo, teksti ja design tarkistetaan palvelimella uudelleen (logon olemassaolo api/checkout.js).
    let logo = null;
    if (onLogopaita(p)) {
      const v = jasennaLogopaita(customText);
      if (!v.ok) throw new KassaVirhe(`Oma logo -paita: ${v.virhe}`, "invalid_logo");
      if (!sallitutVarit(v.design).includes(it.color)) throw new KassaVirhe(`Oma logo -paita: valitulle designille sopivat värit ovat ${sallitutVarit(v.design).join(" ja ")}.`, "invalid_logo");
      customText = logopaitaTeksti(v);
      logo = { id: v.logo, rivit: v.rivit, design: v.design };
    }
    rivit.push({
      product_id: p.id, slug: p.slug, name: p.name, size: it.size || null, color: it.color || null,
      custom_text: customText, ...(logo ? { logo } : {}),
      image: typeof it.image === "string" && /^https?:\/\//.test(it.image) ? it.image : null,
      quantity: it.quantity, unit_price: hinta, printify_product_id: p.printify_product_id, variant_id: variantti,
      kulu_sentit: p.variants?.costs?.[String(variantti)] ?? null, toimitus_sentit: p.variants?.shipping_cents ?? null,
    });
  }
  if (lisat.lahjakortti && lahjakortit.length) {
    throw new KassaVirhe("Lahjakortilla ei voi ostaa lahjakortteja. Tee lahjakortin osto erillisenä tilauksena.", "giftcard_for_giftcard");
  }

  const logoKpl = rivit.filter((r) => r.logo).reduce((s, r) => s + r.quantity, 0);
  if (logoKpl > 0 && logoKpl < LOGOPAITA_MIN_KPL) {
    throw new KassaVirhe(`Oma logo -paitoja tilataan vähintään ${LOGOPAITA_MIN_KPL} kpl (nyt ${logoKpl}).`, "logo_min_quantity");
  }
  // Tarra myydään vain toisen fyysisen tuotteen lisänä.
  if (rivit.length && rivit.every((r) => LISATUOTE_KATEGORIAT.includes(byId.get(r.product_id)?.category))) {
    throw new KassaVirhe("Tarra myydään t-paidan, hupparin tai julisteen lisänä. Lisää koriin myös toinen tuote.", "addon_only");
  }
  // Fyysiset tuotteet: alennuskoodi ja toimitusmaksu kuten ennen.
  const valisumma = rivit.reduce((s, r) => s + r.unit_price * r.quantity, 0);
  const prosentti = alennus?.type === "percent" ? alennus.value : 0;
  const euroa = alennus?.type === "fixed" ? alennus.value : 0;
  const suhde = valisumma > 0 ? Math.max(0, valisumma - euroa) / valisumma : 1;
  // Ilmainen toimitus rajasta tai kahdesta tuotteesta (tarrat eivät lasketa); kahden tuotteen sääntö ei yhdisty
  // alennuskoodiin eikä t-paitapariin (vakiot.js ILMAINEN_TOIMITUS_KPL). Lahjapaketti saa sen (2.11.2026).
  const toimitusKpl = rivit.filter((r) => !LISATUOTE_KATEGORIAT.includes(byId.get(r.product_id)?.category)).reduce((s, r) => s + r.quantity, 0);
  // Rivikohtainen hinta sentteinä kuten Stripe veloittaa.
  let fyysiset = rivit.map((r) => ({ ...r, unit_cents: Math.max(0, Math.round(sentit(r.unit_price) * (1 - prosentti / 100) * suhde)) }));
  const osat = (rr) => rr.map((r) => ({ tuote: byId.get(r.product_id), varianttiId: r.variant_id, maara: r.quantity, yksikkohinta: r.unit_cents / 100 }));
  // Ilmainen toimitus vain, kun tilauksen nettokate ilman toimitusmaksua on vähintään 7 € (kate.js toimitusmaksuKatteella,
  // 2.11.2026); muuten pienin toimitusporras, jolla raja täyttyy.
  const maksuKatteella = (alennusKoodi) => (rivit.length === 0 ? { maksu: 0, rajattu: false }
    : toimitusmaksuKatteella({ summa: valisumma, kpl: toimitusKpl, alennus: alennusKoodi, osat: osat(fyysiset) }));
  const normaaliToimitus = maksuKatteella(true).maksu;
  const toimitusTila = maksuKatteella(!!alennus);
  let toimitus = toimitusTila.maksu;
  // Vähimmäiskate 7 €: alennuskoodi hylätään ja pakettialennus jätetään antamatta, jos kate jäisi alle rajan.
  const nettokate = (rr, maksu = toimitus) => laskeTilauksenNettokate(osat(rr), maksu);
  if (alennus && fyysiset.length) {
    const k = nettokate(fyysiset);
    if (!k.tunnettu || k.nettokate < TILAUKSEN_MIN_KATE_EUROA) throw new KassaVirhe("Alennuskoodia ei voi käyttää tähän tilaukseen.", "discount_low_margin");
    // TERVE-koodi: sama 7 €:n raja kappaletta kohden kuin ensimmäisen tilauksen alennuksessa (4.11.2026).
    if (alennus.ensitilaus && !riittaaPerKpl(k.nettokate, fyysiset.reduce((s, r) => s + r.quantity, 0))) {
      throw new KassaVirhe("Ensitilauksen koodia ei voi käyttää tähän tuoteyhdistelmään.", "discount_low_margin");
    }
  }
  // Joulukalenteri: tämän päivän luukun hinta ilman alennuskoodia; ei yhdisty muihin alennuksiin (alla luukkuKaytossa).
  let luukkuTulos = null;
  let luukkuSyy = null;
  const luukku = lisat.joulukalenteri ? avoinLuukku(lisat.joulukalenteri.luukut, lisat.joulukalenteri.nyt ?? new Date()) : null;
  if (luukku && fyysiset.length && rivit.some((r) => r.slug === luukku.slug)) {
    const s = alennus ? null : sovellaLuukku(fyysiset, luukku, bySlug);
    if (alennus) luukkuSyy = "alennuskoodi";
    else if (!s) luukkuSyy = "ei_rivia";
    else {
      const kplKaikki = s.rivit.reduce((a, r) => a + r.quantity, 0);
      const t = luukunToimitus({ osat: osat(s.rivit), summa: s.rivit.reduce((a, r) => a + r.unit_cents * r.quantity, 0) / 100, toimitusKpl, kpl: kplKaikki });
      if (t) {
        fyysiset = s.rivit;
        toimitus = t.maksu;
        luukkuTulos = { paiva: luukku.pvm, luukku: luukku.paiva, alennus: s.alennusSentit / 100, kpl: s.kpl, rajattu: t.rajattu };
      } else luukkuSyy = "kate";
    }
  }
  const luukkuKaytossa = !!luukkuTulos;
  let pakettiAlennus = 0;
  if (!alennus && !luukkuKaytossa && lisat.paketit?.length) {
    const p = sovellaPaketit(fyysiset, bySlug, lisat.paketit);
    const k = p.alennus > 0 ? nettokate(p.rivit, toimitus) : null;
    if (!k || (k.tunnettu && k.nettokate >= TILAUKSEN_MIN_KATE_EUROA)) {
      fyysiset = p.rivit;
      pakettiAlennus = p.alennus;
    }
  }
  let koriAlennus = 0;
  if (!alennus && !luukkuKaytossa && fyysiset.length) {
    let k = sovellaKorialennus(fyysiset, bySlug, toimitus, lisat.korialennus);
    // T-paitapari: kampanjahinta ja toimitus kuten ennen (ei kahden tuotteen ilmaista toimitusta).
    if (k.tyyppi === "tpaitapari" && toimitus !== normaaliToimitus) {
      toimitus = normaaliToimitus;
      k = sovellaKorialennus(fyysiset, bySlug, toimitus, lisat.korialennus);
    }
    fyysiset = k.rivit;
    koriAlennus = k.alennus;
  }
  // Ilmaisen toimituksen hintatesti (4.11.2026, api/_lib/toimitustesti.js): versiossa B yhden tuotteen tilauksen toimitus
  // sisältyy tuotteen hintaan (hinta + toimitusmaksu pyöristettynä ,90:aan), toimitus 0 €. Muut korit kuten A.
  let toimitusTesti = null;
  if (fyysiset.length && lisat.toimitusVersio === "b" && !luukkuKaytossa) {
    toimitusTesti = sovellaKassaan({ versio: lisat.toimitusVersio, rivit: fyysiset, toimitus, alennus: !!alennus || pakettiAlennus > 0 || koriAlennus > 0, tuote: (id) => byId.get(id) });
    if (toimitusTesti) {
      fyysiset = toimitusTesti.rivit;
      toimitus = toimitusTesti.toimitus;
    }
  }
  // Ensimmäisen tilauksen -5 % (A/B-testi, api/_lib/ensitilaus.js): ei muiden alennusten kanssa, 7 € kappaleelta.
  const ensitilausVersio = lisat.ensitilausVersio === "b" ? "b" : "a";
  let ensitilausAlennettu = 0;
  if (fyysiset.length && ensitilausVersio === "b" && lisat.ensimmainenTilaus === true && !alennus && !luukkuKaytossa && pakettiAlennus === 0 && koriAlennus === 0) {
    const e = ensitilausAlennus(fyysiset.map((r) => ({ tuote: byId.get(r.product_id), varianttiId: r.variant_id, maara: r.quantity, yksikkohinta: r.unit_cents / 100, pohja: pohjaSentit(r) / 100 })), toimitus);
    if (e.kaytossa) {
      fyysiset = alennaRivit(fyysiset, e.prosentti);
      ensitilausAlennettu = e.alennus;
    }
  }
  // Lopullinen katevahti (3.11.2026, Tiinan muki -10,07 €): tilaus kaikkien alennusten ja toimitusmaksun jälkeen
  // jättää vähintään 7 € nettokatetta, tai sitä ei voi maksaa. Toimituksen porraskaan ei aina riitä yksin.
  if (fyysiset.length) {
    const k = nettokate(fyysiset, toimitus);
    if (k.tunnettu && k.nettokate < TILAUKSEN_MIN_KATE_EUROA) {
      throw new KassaVirhe("Tätä tuoteyhdistelmää ei voi tilata. Lisää koriin toinen paita tai huppari, niin tilaus onnistuu.", "order_low_margin");
    }
  }
  const kortit = lahjakortit.map((r) => ({ ...r, unit_cents: sentit(r.unit_price) }));
  const stripeRivit = [...fyysiset, ...kortit];
  const tuotteetYht = fyysiset.reduce((s, r) => s + r.unit_cents * r.quantity, 0) / 100;
  const korttienSumma = kortit.reduce((s, r) => s + r.unit_cents * r.quantity, 0) / 100;
  const total = Math.round((tuotteetYht + korttienSumma + toimitus) * 100) / 100;
  let lahjakortilla = lisat.lahjakortti ? kaytettavaSumma(lisat.lahjakortti.saldo, total) : 0;
  // Stripen pienin veloitus on 0,50 €: jos lahjakortin jälkeen jäisi vähemmän, lahjakortilta käytetään sen verran vähemmän.
  const jaa = Math.round((total - lahjakortilla) * 100);
  if (jaa > 0 && jaa < STRIPE_MINIMI_SENTIT) lahjakortilla = Math.max(0, Math.round(total * 100) - STRIPE_MINIMI_SENTIT) / 100;
  const testiLisa = toimitusTesti ? toimitusTesti.hintaLisaSentit / 100 : 0;
  return {
    rivit: stripeRivit,
    subtotal: Math.round((valisumma + testiLisa + korttienSumma) * 100) / 100,
    shipping: toimitus,
    /** Ilmainen toimitus rajattu katevahdilla (toimitus pienempi kuin tavallinen mutta ei 0 €). */
    shipping_reduced: luukkuTulos ? luukkuTulos.rajattu : !toimitusTesti && toimitusTila.rajattu && toimitus === toimitusTila.maksu,
    /** Hintatestin B: toimitus sisältyy tuotteen hintaan (api/_lib/toimitustesti.js). */
    shipping_included: !!toimitusTesti,
    toimitus_versio: lisat.toimitusVersio === "b" ? "b" : "a",
    /** Ensimmäisen tilauksen alennus euroina (A/B-testi, api/_lib/ensitilaus.js); sisältyy discount-kenttään. */
    ensitilaus_versio: ensitilausVersio,
    first_order_discount: Math.round(ensitilausAlennettu * 100) / 100,
    discount: Math.round((valisumma + testiLisa - tuotteetYht) * 100) / 100,
    bundle_discount: Math.round(pakettiAlennus * 100) / 100,
    basket_discount: Math.round(koriAlennus * 100) / 100,
    /** Joulukalenterin luukku: { paiva, luukku, alennus (euroa), kpl } kun luukun hinta on käytössä; muuten { syy } tai null. */
    joulukalenteri: luukkuTulos ? { paiva: luukkuTulos.paiva, luukku: luukkuTulos.luukku, alennus: Math.round(luukkuTulos.alennus * 100) / 100, kpl: luukkuTulos.kpl } : luukkuSyy ? { syy: luukkuSyy } : null,
    total,
    gift_card_code: lisat.lahjakortti && lahjakortilla > 0 ? lisat.lahjakortti.koodi : null,
    gift_card_amount: lahjakortilla,
    amount_due: Math.round((total - lahjakortilla) * 100) / 100,
    only_gift_cards: rivit.length === 0,
  };
}

const VIRTUAALISET = new Map([PERSONOITU_TUOTE, PERSONOITU_HUPPARI, LOGOPAITA_TUOTE].map((t) => [t.id, t]));

/** Kassan laskennan nettokate (Printifyn kulut tuoteriviltä, api/_lib/kate.js), kumppanimallin 2 valintaan. */
export function laskettuNettokate(laskettu, tuotteet, stripeKulu = null) {
  const byId = new Map(tuotteet.map((t) => [t.id, t]));
  const osat = laskettu.rivit.filter((r) => r.type !== "giftcard")
    .map((r) => ({ tuote: byId.get(r.product_id) || VIRTUAALISET.get(r.product_id), varianttiId: r.variant_id, maara: r.quantity, yksikkohinta: r.unit_cents / 100 }));
  const k = laskeTilauksenNettokate(osat, laskettu.shipping, stripeKulu ? { stripeProsentti: stripeKulu.prosentti, stripeKiintea: stripeKulu.kiintea } : {});
  return k.tunnettu ? k.nettokate : NaN;
}
