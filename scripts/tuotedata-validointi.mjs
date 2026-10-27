/**
 * Tuotesivujen Product-JSON-LD:n tarkistus Googlen Product snippets- ja Merchant listings
 * -vaatimuksia vasten (pakolliset ja suositellut kentät, joita kauppa pystyy todenmukaisesti antamaan).
 *
 * Puhdas moduuli ilman sivuvaikutuksia: CLI on scripts/validoi-tuotedata.mjs ja testit
 * src/seo/tuotedataValidointi.test.ts.
 */

const SCHEMA = "https://schema.org/";
const AVAILABILITY = new Set(["InStock", "OutOfStock", "PreOrder", "BackOrder", "LimitedAvailability", "Discontinued", "SoldOut", "OnlineOnly"].map((v) => SCHEMA + v));
const RETURN_CATEGORIES = new Set(["MerchantReturnFiniteReturnWindow", "MerchantReturnNotPermitted", "MerchantReturnUnlimitedWindow", "MerchantReturnUnspecified"].map((v) => SCHEMA + v));

/** Poimii kaikki <script type="application/ld+json"> -lohkot. Palauttaa { data, error } per lohko. */
export function extractJsonLd(html) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      out.push({ data: JSON.parse(m[1]) });
    } catch (e) {
      out.push({ error: `JSON-LD ei ole kelvollista JSONia: ${e.message}` });
    }
  }
  return out;
}

/** Litistää @graph-rakenteet ja taulukot yksittäisiksi solmuiksi. */
export function flattenNodes(data) {
  const nodes = [];
  const visit = (n) => {
    if (Array.isArray(n)) return n.forEach(visit);
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n["@graph"])) n["@graph"].forEach(visit);
    if (n["@type"]) nodes.push(n);
  };
  visit(data);
  return nodes;
}

const isType = (n, t) => n && (n["@type"] === t || (Array.isArray(n["@type"]) && n["@type"].includes(t)));
const nonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const absUrl = (v) => typeof v === "string" && /^https:\/\/[^\s]+$/.test(v);
const isoDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(Date.parse(v));
const isNum = (v) => typeof v === "number" && Number.isFinite(v);

function checkQuantitative(errors, where, q) {
  if (!isType(q, "QuantitativeValue")) return errors.push(`${where}: @type QuantitativeValue puuttuu`);
  if (!Number.isInteger(q.minValue) || q.minValue < 0) errors.push(`${where}.minValue puuttuu tai ei ole kokonaisluku`);
  if (!Number.isInteger(q.maxValue) || q.maxValue < q.minValue) errors.push(`${where}.maxValue puuttuu tai on pienempi kuin minValue`);
  if (q.unitCode !== "DAY" && q.unitCode !== "d") errors.push(`${where}.unitCode ei ole DAY`);
}

/**
 * Tarkistaa yhden Product-solmun.
 * @param {object} p Product-solmu
 * @param {{ now?: Date, expectedDeliveryDays?: { min: number, max: number }, expectedShipping?: { fee: number, freeThreshold: number }, personalised?: boolean }} [opts]
 * @returns {string[]} virheet (tyhjä = kunnossa)
 */
export function validateProduct(p, opts = {}) {
  const errors = [];
  const now = opts.now ?? new Date();
  if (!isType(p, "Product")) return ["@type ei ole Product"];
  if (!nonEmptyString(p.name)) errors.push("name puuttuu");
  if (!nonEmptyString(p.description)) errors.push("description puuttuu");
  if (!nonEmptyString(p.sku)) errors.push("sku puuttuu");
  const images = Array.isArray(p.image) ? p.image : p.image ? [p.image] : [];
  if (images.length === 0) errors.push("image puuttuu");
  images.forEach((img, i) => {
    const u = typeof img === "string" ? img : img?.url;
    if (!absUrl(u)) errors.push(`image[${i}] ei ole absoluuttinen https-URL: ${u}`);
  });
  if (!isType(p.brand, "Brand") || p.brand.name !== "Huumorikauppa") errors.push("brand ei ole {@type Brand, name Huumorikauppa}");
  if ("aggregateRating" in p || "review" in p) errors.push("aggregateRating/review ei ole sallittu (ei todennettuja arvioita)");

  const offers = Array.isArray(p.offers) ? p.offers : p.offers ? [p.offers] : [];
  if (offers.length === 0) errors.push("offers puuttuu");
  offers.forEach((o, i) => {
    const w = `offers[${i}]`;
    if (!isType(o, "Offer")) errors.push(`${w}: @type ei ole Offer`);
    const price = Number(o.price);
    if (o.price === undefined || !Number.isFinite(price) || price <= 0) errors.push(`${w}.price puuttuu tai ei ole positiivinen`);
    else if (!/^\d+\.\d{2}$/.test(String(o.price))) errors.push(`${w}.price ei ole muotoa "24.90": ${o.price}`);
    if (o.priceCurrency !== "EUR") errors.push(`${w}.priceCurrency ei ole EUR`);
    if (!AVAILABILITY.has(o.availability)) errors.push(`${w}.availability puuttuu tai on tuntematon: ${o.availability}`);
    if (!absUrl(o.url)) errors.push(`${w}.url ei ole absoluuttinen https-URL`);
    if (o.itemCondition !== SCHEMA + "NewCondition") errors.push(`${w}.itemCondition ei ole NewCondition`);
    if (!isoDate(o.priceValidUntil)) errors.push(`${w}.priceValidUntil puuttuu tai ei ole ISO-päivä`);
    else if (Date.parse(o.priceValidUntil) <= now.getTime()) errors.push(`${w}.priceValidUntil on menneisyydessä: ${o.priceValidUntil}`);
    if (!o.seller || !(isType(o.seller, "Organization") && nonEmptyString(o.seller.name))) errors.push(`${w}.seller puuttuu (Organization + name)`);

    const sd = o.shippingDetails;
    if (!isType(sd, "OfferShippingDetails")) errors.push(`${w}.shippingDetails puuttuu (OfferShippingDetails)`);
    else {
      const rate = sd.shippingRate;
      if (!isType(rate, "MonetaryAmount") || rate.currency !== "EUR" || !Number.isFinite(Number(rate.value)) || Number(rate.value) < 0) {
        errors.push(`${w}.shippingDetails.shippingRate ei ole kelvollinen MonetaryAmount (EUR)`);
      }
      const ship = opts.expectedShipping;
      if (ship && Number.isFinite(price)) {
        const odotettu = (price >= ship.freeThreshold ? 0 : ship.fee).toFixed(2);
        if (String(rate?.value) !== odotettu) errors.push(`${w}.shippingDetails.shippingRate.value ${rate?.value}, odotettiin ${odotettu}`);
      }
      if (sd.shippingDestination?.addressCountry !== "FI") errors.push(`${w}.shippingDetails.shippingDestination ei ole FI`);
      const dt = sd.deliveryTime;
      if (!isType(dt, "ShippingDeliveryTime")) errors.push(`${w}.shippingDetails.deliveryTime puuttuu`);
      else {
        checkQuantitative(errors, `${w}.deliveryTime.handlingTime`, dt.handlingTime);
        checkQuantitative(errors, `${w}.deliveryTime.transitTime`, dt.transitTime);
        const exp = opts.expectedDeliveryDays;
        if (exp && isNum(dt.handlingTime?.minValue) && isNum(dt.transitTime?.minValue)) {
          const min = dt.handlingTime.minValue + dt.transitTime.minValue;
          const max = dt.handlingTime.maxValue + dt.transitTime.maxValue;
          if (min !== exp.min || max !== exp.max) errors.push(`${w}.deliveryTime yhteensä ${min}-${max} arkipäivää, lupaus ${exp.min}-${exp.max}`);
        }
      }
    }

    const rp = o.hasMerchantReturnPolicy;
    if (!isType(rp, "MerchantReturnPolicy")) errors.push(`${w}.hasMerchantReturnPolicy puuttuu`);
    else {
      if (rp.applicableCountry !== "FI") errors.push(`${w}.hasMerchantReturnPolicy.applicableCountry ei ole FI`);
      if (!RETURN_CATEGORIES.has(rp.returnPolicyCategory)) errors.push(`${w}.hasMerchantReturnPolicy.returnPolicyCategory tuntematon`);
      if (opts.personalised === true && rp.returnPolicyCategory !== SCHEMA + "MerchantReturnNotPermitted") {
        errors.push(`${w}: personoidun tuotteen palautuskäytännön pitää olla MerchantReturnNotPermitted`);
      }
      if (rp.returnPolicyCategory === SCHEMA + "MerchantReturnFiniteReturnWindow") {
        if (rp.merchantReturnDays !== 14) errors.push(`${w}.hasMerchantReturnPolicy.merchantReturnDays ei ole 14`);
        if (rp.returnMethod !== SCHEMA + "ReturnByMail") errors.push(`${w}.hasMerchantReturnPolicy.returnMethod ei ole ReturnByMail`);
        if (rp.returnFees !== SCHEMA + "ReturnFeesCustomerResponsibility") errors.push(`${w}.hasMerchantReturnPolicy.returnFees ei ole ReturnFeesCustomerResponsibility`);
      }
    }
  });
  return errors;
}

/**
 * Tarkistaa yhden tuotesivun HTML:n: täsmälleen yksi Product ja kaikki JSON-LD kelvollista.
 * @returns {{ errors: string[], products: number, personalised: boolean }}
 */
export function validateProductPage(html, opts = {}) {
  const errors = [];
  const blocks = extractJsonLd(html);
  if (blocks.length === 0) errors.push("sivulla ei ole JSON-LD:tä");
  const nodes = [];
  for (const b of blocks) {
    if (b.error) errors.push(b.error);
    else nodes.push(...flattenNodes(b.data));
  }
  const viivat = [];
  const etsiViivat = (v, polku) => {
    if (typeof v === "string") {
      if (/[\u2013\u2014]/.test(v)) viivat.push(polku);
    } else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) etsiViivat(x, `${polku}.${k}`);
  };
  blocks.forEach((b, i) => b.data && etsiViivat(b.data, `ld[${i}]`));
  if (viivat.length) errors.push(`JSON-LD:ssä ajatusviivoja (U+2013/U+2014): ${viivat.slice(0, 5).join(", ")}`);
  const products = nodes.filter((n) => isType(n, "Product"));
  if (products.length !== 1) errors.push(`Product-solmuja ${products.length}, odotettiin 1`);
  let personalised = false;
  for (const p of products) {
    errors.push(...validateProduct(p, opts));
    const offers = Array.isArray(p.offers) ? p.offers : [p.offers];
    personalised ||= offers.some((o) => o?.hasMerchantReturnPolicy?.returnPolicyCategory === SCHEMA + "MerchantReturnNotPermitted");
  }
  return { errors, products: products.length, personalised };
}

/**
 * Sama tunnistus kuin src/lib/customProduct.ts (isCustomTextProduct); testi varmistaa, että ne pysyvät samoina.
 * Validaattori käyttää tätä tarkistaakseen, että personoidulla tuotteella on MerchantReturnNotPermitted.
 */
export const PERSONOITU_AVAINSANAT = ["oma teksti", "omalla tekstillä", "oma kuva", "omalla kuvalla", "custom text", "custom design", "personoi", "personoitava"];
export function looksPersonalised(name, description) {
  const t = `${name || ""} ${description || ""}`.toLowerCase();
  return PERSONOITU_AVAINSANAT.some((k) => t.includes(k));
}
