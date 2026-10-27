/**
 * Schema.org JSON-LD -rakentajat. Yksi lähde kolmelle käyttäjälle:
 *  - React (SEOHead, ProductPage) asiakaspuolen navigoinnissa
 *  - build-vaiheen esirenderöinti (scripts/prerender.mjs)
 *  - Vercelin middleware (middleware.ts) niille sivuille, joita ei ole esirenderöity
 *
 * Riippuvuudeton tiedosto (vain suhteelliset importit), jotta Edge-middleware voi käyttää sitä.
 */
import { ORGANIZATION, RETURNS, SHIPPING, SITE_NAME, SITE_URL, absoluteUrl } from "./site.js";
import { isFullyUnavailable } from "../lib/variantAvailability.js";
import { isCustomTextProduct } from "../lib/customProduct.js";

export type JsonLd = Record<string, unknown>;

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FaqEntry {
  q: string;
  a: string;
}

export interface ProductForSchema {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  /** Absoluuttiset kuva-URLit. */
  images: string[];
  price: number;
  stock?: number | null;
  categoryName?: string;
  /** Tuotteen variants (colors, sizes, variant_map) saatavuuden tarkistukseen; puuttuessa vain generaattorin lista. */
  variants?: unknown;
  /** Personoitu tuote (oma teksti/kuva): ei palautusoikeutta. Puuttuessa päätellään nimestä ja kuvauksesta. */
  personalised?: boolean;
}

/**
 * Hinnan voimassaolo Googlen Merchant listings -tietoja varten: seuraavan vuoden viimeinen päivä.
 * Lasketaan rakennus- tai pyyntöhetkellä, joten päivä ei vanhene niin kauan kuin sivusto rakennetaan
 * vähintään kerran vuodessa.
 */
export function priceValidUntil(now: Date = new Date()): string {
  return `${now.getUTCFullYear() + 1}-12-31`;
}

/** Personoidut tuotteet valmistetaan asiakkaan toiveiden mukaan, eikä niillä ole peruutusoikeutta (ReturnsPolicy.tsx). */
function noReturnsPolicy(): JsonLd {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: SHIPPING.country,
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
  };
}

function merchantReturnPolicy(): JsonLd {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: SHIPPING.country,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: RETURNS.days,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: RETURNS.customerPaysReturnShipping
      ? "https://schema.org/ReturnFeesCustomerResponsibility"
      : "https://schema.org/FreeReturn",
  };
}

export function buildOrganizationJsonLd(): JsonLd {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: ORGANIZATION.name,
    legalName: ORGANIZATION.legalName,
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      url: ORGANIZATION.logo,
      width: 256,
      height: 256,
    },
    email: ORGANIZATION.email,
    address: {
      "@type": "PostalAddress",
      ...(ORGANIZATION.streetAddress ? { streetAddress: ORGANIZATION.streetAddress } : {}),
      ...(ORGANIZATION.postalCode ? { postalCode: ORGANIZATION.postalCode } : {}),
      addressLocality: ORGANIZATION.addressLocality,
      addressCountry: ORGANIZATION.addressCountry,
    },
    taxID: ORGANIZATION.legalId,
    vatID: ORGANIZATION.vatID,
    identifier: {
      "@type": "PropertyValue",
      propertyID: "Y-tunnus",
      value: ORGANIZATION.legalId,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: ORGANIZATION.email,
      availableLanguage: "fi",
    },
    sameAs: [...ORGANIZATION.sameAs],
    hasMerchantReturnPolicy: merchantReturnPolicy(),
  };
}

export function buildWebSiteJsonLd(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    alternateName: "Huumorikauppa.fi",
    url: `${SITE_URL}/`,
    inLanguage: "fi",
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/haku?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Koko sivuston yhteinen JSON-LD (Organization + WebSite). */
export function buildSiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationJsonLd(), buildWebSiteJsonLd()],
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function buildFaqJsonLd(faqs: FaqEntry[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function buildCollectionPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  products: { slug: string; name: string }[];
  limit?: number;
}): JsonLd {
  const items = opts.products.slice(0, opts.limit ?? 20);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.url),
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/tuote/${p.slug}`,
        name: p.name,
      })),
    },
  };
}

/** Toimituskulu yhden tuotteen tilaukselle (src/config/toimitus.ts, sama sääntö kuin kassalla). */
export function shippingFeeForPrice(price: number): number {
  return price >= SHIPPING.freeThresholdEur ? 0 : SHIPPING.feeEur;
}

export function buildOfferShippingDetails(price: number): JsonLd {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: shippingFeeForPrice(price).toFixed(2),
      currency: "EUR",
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: SHIPPING.country,
    },
    // Käsittely + kuljetus = kaupan ehtojen kokonaistoimitusaika (src/config/toimitus.ts).
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: SHIPPING.handlingBusinessDaysMin,
        maxValue: SHIPPING.handlingBusinessDaysMax,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: SHIPPING.transitBusinessDaysMin,
        maxValue: SHIPPING.transitBusinessDaysMax,
        unitCode: "DAY",
      },
      businessDays: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "https://schema.org/Monday",
          "https://schema.org/Tuesday",
          "https://schema.org/Wednesday",
          "https://schema.org/Thursday",
          "https://schema.org/Friday",
        ],
      },
    },
  };
}

export function buildProductJsonLd(product: ProductForSchema): JsonLd {
  const url = `${SITE_URL}/tuote/${product.slug}`;
  // Yksi Offer koko tuotteelle: InStock vain, jos vähintään yksi koko/väri on Printifyn valmistettavissa
  // (src/lib/variantAvailability.ts). Valmistamattomat koot eivät näy tarjouksessa, koska kokoja ei listata.
  const outOfStock = (typeof product.stock === "number" && product.stock <= 0) || isFullyUnavailable({ slug: product.slug, variants: product.variants });
  const description = (product.description || product.name).slice(0, 5000);
  const personalised = product.personalised ?? isCustomTextProduct({ name: product.name, description: product.description || "" });
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description,
    image: product.images.length > 0 ? product.images : [`${SITE_URL}/placeholder.svg`],
    url,
    sku: product.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(product.categoryName ? { category: product.categoryName } : {}),
    offers: {
      "@type": "Offer",
      url,
      price: product.price.toFixed(2),
      priceCurrency: "EUR",
      availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: priceValidUntil(),
      seller: { "@type": "Organization", "@id": ORGANIZATION_ID, name: ORGANIZATION.name },
      shippingDetails: buildOfferShippingDetails(product.price),
      hasMerchantReturnPolicy: personalised ? noReturnsPolicy() : merchantReturnPolicy(),
    },
  };
}

/**
 * Serialisoi JSON-LD:n turvallisesti <script>-tagin sisään: "<" escapoidaan, jotta
 * tuotekuvauksen "</script>" ei voi katkaista tagia.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(poistaPitkatViivat(data))
    .replace(/</g, "\\u003c");
}

/**
 * Korvaa ajatus- ja lukuvälivivat (U+2013, U+2014) tavallisella yhdysmerkillä kaikista JSON-LD:n
 * merkkijonoista. Tuotenimet tulevat tietokannasta muodossa "Made in Espoo – hauska t-paita";
 * rakenteiseen dataan ja hakutuloksiin ne menevät muodossa "Made in Espoo - hauska t-paita".
 */
export function poistaPitkatViivat<T>(data: T): T {
  if (typeof data === "string") return data.replace(/[\u2013\u2014]/g, "-") as T;
  if (Array.isArray(data)) return data.map((v) => poistaPitkatViivat(v)) as T;
  if (data && typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) out[k] = poistaPitkatViivat(v);
    return out as T;
  }
  return data;
}
