/**
 * Blogisivujen rakenteisen datan tarkistus (Googlen Product snippets, ItemList ja FAQ).
 *
 * Search Console raportoi blogisivuilta kriittisen Product snippets -virheen: tuotekorteissa oli
 * mikrodataa (itemscope itemtype=Product, vain name ja image), josta puuttuu pakollinen offers,
 * review tai aggregateRating. Blogisivuilla ei siksi saa olla vajaita Product-kohteita: tuotelistat
 * merkitään ItemListinä, jonka ListItem-kohteilla on vain position ja url (Googlen
 * yhteenvetosivumalli).
 *
 * Puhdas moduuli ilman sivuvaikutuksia: CLI on scripts/validoi-blogidata.mjs ja testit
 * src/seo/blogidataValidointi.test.tsx.
 */
import { extractJsonLd, flattenNodes, validateProduct } from "./tuotedata-validointi.mjs";

const isType = (n, t) => n && (n["@type"] === t || (Array.isArray(n["@type"]) && n["@type"].includes(t)));
const nonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const absUrl = (v) => typeof v === "string" && /^https:\/\/[^\s]+$/.test(v);

/** Mikrodatan Product-kohteet: itemscope-elementit, joiden itemtype on schema.org/Product. */
const MICRODATA_PRODUCT = /<[a-z0-9]+\b[^>]*\bitemtype=["']https?:\/\/schema\.org\/Product["'][^>]*>/gi;
const MICRODATA_REQUIRED = /\bitemprop=["'](offers|review|aggregateRating)["']/gi;

/** ItemListin yksi ListItem: position + url (tai item, jolla on url/@id). Product-item tarkistetaan kokonaan. */
function validateListItem(li, where, opts) {
  const errors = [];
  if (!isType(li, "ListItem")) return [`${where}: @type ei ole ListItem`];
  if (!Number.isInteger(li.position) || li.position < 1) errors.push(`${where}.position puuttuu tai ei ole positiivinen kokonaisluku`);
  const item = li.item;
  if (item && typeof item === "object") {
    if (isType(item, "Product")) errors.push(...validateProduct(item, opts).map((e) => `${where}.item: ${e}`));
    else if (!absUrl(item.url) && !absUrl(item["@id"])) errors.push(`${where}.item: url tai @id puuttuu`);
  } else if (!absUrl(li.url) && !absUrl(item)) {
    errors.push(`${where}: url puuttuu (ListItem tarvitsee url- tai item-kentän)`);
  }
  return errors;
}

/**
 * Tarkistaa yhden blogisivun HTML:n.
 * @returns {{ errors: string[], counts: { jsonLdBlocks: number, products: number, itemLists: number, listItems: number, microdataProducts: number } }}
 */
export function validateBlogPage(html, opts = {}) {
  const errors = [];
  const blocks = extractJsonLd(html);
  const nodes = [];
  for (const b of blocks) {
    if (b.error) errors.push(b.error);
    else nodes.push(...flattenNodes(b.data));
  }

  // Erilliset Product-solmut (ei ItemListin sisällä) tarkistetaan kuten tuotesivuilla.
  const products = nodes.filter((n) => isType(n, "Product"));
  for (const [i, p] of products.entries()) {
    errors.push(...validateProduct(p, opts).map((e) => `Product #${i + 1} (${p.name ?? "nimetön"}): ${e}`));
  }

  const itemLists = nodes.filter((n) => isType(n, "ItemList"));
  let listItems = 0;
  for (const [i, list] of itemLists.entries()) {
    const els = Array.isArray(list.itemListElement) ? list.itemListElement : [];
    if (els.length === 0) errors.push(`ItemList #${i + 1}: itemListElement puuttuu tai on tyhjä`);
    listItems += els.length;
    els.forEach((li, j) => errors.push(...validateListItem(li, `ItemList #${i + 1}.itemListElement[${j}]`, opts)));
  }

  for (const faq of nodes.filter((n) => isType(n, "FAQPage"))) {
    const qs = Array.isArray(faq.mainEntity) ? faq.mainEntity : [];
    if (qs.length === 0) errors.push("FAQPage: mainEntity puuttuu");
    qs.forEach((q, j) => {
      if (!isType(q, "Question") || !nonEmptyString(q.name)) errors.push(`FAQPage.mainEntity[${j}]: Question.name puuttuu`);
      if (!nonEmptyString(q.acceptedAnswer?.text)) errors.push(`FAQPage.mainEntity[${j}]: acceptedAnswer.text puuttuu`);
    });
  }

  // Mikrodata: jokainen Product-kohde tarvitsee offers-, review- tai aggregateRating-ominaisuuden.
  const microdataProducts = (html.match(MICRODATA_PRODUCT) || []).length;
  const microdataRequired = (html.match(MICRODATA_REQUIRED) || []).length;
  if (microdataProducts > microdataRequired) {
    errors.push(
      `mikrodatan Product-kohteita ${microdataProducts}, joista ${microdataProducts - microdataRequired} ilman offers-, review- tai aggregateRating-kenttää`,
    );
  }

  return {
    errors,
    counts: { jsonLdBlocks: blocks.length, products: products.length, itemLists: itemLists.length, listItems, microdataProducts },
  };
}
