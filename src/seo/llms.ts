/**
 * /llms.txt ja /llms-full.txt (https://llmstxt.org). Kirjoitetaan buildissa
 * (scripts/prerender.mjs) dist-kansioon, jotta sivu- ja tuotelistat pysyvät ajan tasalla.
 *
 * Faktat on poimittu kaupan omista sivuista: Terms.tsx (toimitusehdot), ReturnsPolicy.tsx
 * (palautusehdot), FAQ (src/seo/pageFaqs.ts) ja src/seo/site.ts. Tuntemattomia tietoja ei lisätä.
 * Ei ajatusviivoja eikä todistamattomia superlatiiveja.
 */
import { categories } from "@/data/products";
import { giftCategories } from "@/data/giftCategories";
import { situationGifts } from "@/data/situationGifts";
import { blogPosts } from "@/data/blog";
import { onPiilotettu } from "@/lib/hiddenCategories";
import type { Product } from "@/types/product";
import { ORGANIZATION, RETURNS, SHIPPING, SITE_URL, formatPriceFi } from "./site";
import { GIFT_ROUTE_SLUGS } from "./prerender/pages";

const fee = formatPriceFi(SHIPPING.feeEur);

/** Datasta (blogi, lahjaoppaat, tuotenimet) tulevat ajatusviivat tavuviivoiksi. */
export function withoutDashes(text: string): string {
  return text.replace(/(\d)\s*[–—]\s*(\d)/g, "$1-$2").replace(/\s*[–—]\s*/g, " - ");
}
const days = `${SHIPPING.deliveryBusinessDaysMin}-${SHIPPING.deliveryBusinessDaysMax}`;

function categoriesWithProducts(products: Product[]) {
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return categories
    .filter((c) => !onPiilotettu(c.slug))
    .filter((c) => products.length === 0 || (counts.get(c.slug) ?? 0) > 0)
    .map((c) => ({ ...c, count: counts.get(c.slug) ?? 0 }));
}

function factsSection(products: Product[]): string {
  const cats = categoriesWithProducts(products);
  return `## Kauppa
Huumorikauppa.fi on suomalainen verkkokauppa, joka myy hauskoja vaatteita ja lahjatuotteita suomalaisella huumorilla. Designit suunnitellaan Suomessa ja jokainen tuote painetaan tilauksesta (print-on-demand, painopalvelu EU-alueella).
- Sijainti: ${ORGANIZATION.addressLocality}, Suomi
- Y-tunnus: ${ORGANIZATION.legalId}
- Kieli: suomi

## Mitä myymme
${cats.map((c) => `- ${c.name}: ${SITE_URL}/kategoria/${c.slug}`).join("\n")}

Mukeja ei tällä hetkellä myydä.
Suosittuja teemoja ovat ammattihuumori, kalastus, eläkeläishuumori sekä syntymäpäivä- ja juhlavuositeemat.

## Toimitus
- Toimitamme vain Suomeen (myös Ahvenanmaalle).
- Toimitusaika on ${days} arkipäivää tilauksesta.
- Toimituskulut ovat ${fee}. Yli ${SHIPPING.freeThresholdEur} € tilaukset toimitetaan ilman toimituskuluja.
- Noutoa ei ole.

## Maksutavat
Visa, Mastercard, Apple Pay, Google Pay ja Klarna. Hinnat sisältävät arvonlisäveron (ALV 25,5 %).

## Palautukset
- Kuluttajansuojalain mukainen ${RETURNS.days} päivän peruutusoikeus tuotteen vastaanottamisesta.
- Peruutusilmoitus sähköpostitse osoitteeseen ${ORGANIZATION.email}. Ilmoitukseen tilausnumero, palautettavat tuotteet ja yhteystiedot.
- Asiakas maksaa palautuksen postikulut, ellei tuote ole virheellinen tai väärin toimitettu.
- Hyvitys maksetaan alkuperäisellä maksutavalla ${RETURNS.days} päivän kuluessa palautuksen vastaanottamisesta.
- Peruutusoikeus ei koske asiakkaan toiveiden mukaan valmistettuja tuotteita.

## Yhteystiedot
- Sähköposti: ${ORGANIZATION.email}
- Vastaamme 1-2 arkipäivässä.`;
}

const KEY_PAGES = [
  ["Etusivu", "/"],
  ["Kaikki tuotteet", "/kaikki-tuotteet"],
  ["Usein kysytyt kysymykset", "/usein-kysytyt-kysymykset"],
  ["Toimitusehdot", "/toimitusehdot"],
  ["Palautusehdot", "/palautusehdot"],
  ["Yhteystiedot", "/yhteystiedot"],
  ["Tietoa meistä", "/tietoa-meista"],
  ["Blogi", "/blogi"],
] as const;

function giftLinks(): string {
  return giftCategories
    .filter((g) => (GIFT_ROUTE_SLUGS as readonly string[]).includes(g.slug))
    .map((g) => `- ${g.name}: ${SITE_URL}/${g.slug}`)
    .join("\n");
}

export function buildLlmsTxt(products: Product[]): string {
  return withoutDashes(`# Huumorikauppa.fi

> Suomalainen verkkokauppa: hauskat t-paidat, hupparit ja muut huumorituotteet. Toimitus Suomeen ${days} arkipäivässä, ilmainen yli ${SHIPPING.freeThresholdEur} € tilauksiin, ${RETURNS.days} päivän palautusoikeus.

${factsSection(products)}

## Tärkeimmät sivut
${KEY_PAGES.map(([name, path]) => `- ${name}: ${SITE_URL}${path === "/" ? "/" : path}`).join("\n")}

## Lahjaideat
${giftLinks()}

## Lisää
- Täysi versio (tuotteet, oppaat, blogi): ${SITE_URL}/llms-full.txt
- Sivukartta: ${SITE_URL}/sitemap.xml
`);
}

export function buildLlmsFullTxt(products: Product[]): string {
  const cats = categoriesWithProducts(products);
  const productSections = cats
    .map((c) => {
      const list = products.filter((p) => p.category === c.slug);
      if (list.length === 0) return "";
      return `### ${c.name} (${list.length})\n${list
        .map((p) => `- ${p.name}, ${formatPriceFi(p.price)}: ${SITE_URL}/tuote/${p.slug}`)
        .join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");
  const posts = [...blogPosts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return withoutDashes(`${buildLlmsTxt(products).trimEnd()}

## Lahjaoppaat tilanteen mukaan
${situationGifts.map((s) => `- ${s.h1}: ${SITE_URL}/lahjat/${encodeURI(s.slug)}`).join("\n")}

## Blogi
${posts.map((p) => `- ${p.title}: ${SITE_URL}/blogi/${p.slug}\n  ${p.excerpt}`).join("\n")}
${
  products.length > 0
    ? `
## Tuotteet
Hinnat euroina, sisältävät arvonlisäveron. Lista päivittyy jokaisessa julkaisussa.

${productSections}
`
    : ""
}`);
}
