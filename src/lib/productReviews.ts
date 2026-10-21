// Shared review data + deterministic selection used by ProductPage, ProductCard,
// CheckoutPage and any other surface that needs a star summary.
//
// Vain todennettavat arviot: jokaisella arviolla on päivämäärä, joka on aikaisintaan ensimmäisen
// oikean tilauksen päivä (25.3.2026). Aiemmin tänne kovakoodatut arviot (kaikki päivätty ennen sitä)
// on siirretty tiedostoon src/data/arvostelut-arkisto.ts, jota sovellus ei tuo. Palautusohje on
// arkistotiedoston alussa. Arvioita ei viedä rakenteiseen dataan (ei aggregateRatingia eikä Reviewta).

export type Review = { name: string; text: string; stars: number; date: string };

/** Ensimmäisen oikean tilauksen päivä. Sitä aiemmin päivätyt arviot eivät voi olla aitoja. */
export const FIRST_REAL_ORDER_DATE = new Date(2026, 2, 25);

/** "p.k.vvvv" -> Date, tai null jos päivämäärä puuttuu tai on virheellinen. */
export function parseReviewDate(date: string | undefined | null): Date | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec((date ?? "").trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return d.getDate() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 ? d : null;
}

/** Näytetäänkö arvio: päivätty ja aikaisintaan ensimmäisen oikean tilauksen päivänä. */
export function isPublishableReview(review: { date?: string | null }): boolean {
  const d = parseReviewDate(review.date);
  return !!d && d.getTime() >= FIRST_REAL_ORDER_DATE.getTime();
}

// Todennetut arviot kategorioittain. Tyhjä, kunnes omistaja on todentanut arviot (ks. arkisto).
const REVIEWS_BY_CATEGORY: Record<string, Review[]> = {};

const REVIEWS_GENERIC: Review[] = [];

// Theme-specific reviews — only added on a word-boundary match so we don't drop
// an "äiti"-review onto an unrelated product.
const THEME_REVIEWS: Record<string, Review[]> = {};

const published = (list: Review[]) => list.filter(isPublishableReview);

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function matchesThemeKeyword(nameLower: string, keyword: string): boolean {
  // word-boundary-ish: keyword surrounded by non-letter chars (or start/end)
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^a-zåäö])${escaped}([^a-zåäö]|$)`, "i");
  return re.test(nameLower);
}

export function getProductReviews(product: { id: string; name: string; category: string }): Review[] {
  const h = hashString(product.id);
  const counts = [3, 4, 4, 5, 3, 4, 5, 3];
  const count = counts[h % counts.length];

  const categoryReviews = published(REVIEWS_BY_CATEGORY[product.category] || REVIEWS_GENERIC);

  const nameLower = product.name.toLowerCase();
  let themeReview: Review | null = null;
  for (const [keyword, allThemeReviews] of Object.entries(THEME_REVIEWS)) {
    const reviews = published(allThemeReviews);
    if (reviews.length > 0 && matchesThemeKeyword(nameLower, keyword)) {
      themeReview = reviews[h % reviews.length];
      break;
    }
  }

  const picked: Review[] = [];
  const usedNames = new Set<string>();

  if (themeReview) {
    picked.push(themeReview);
    usedNames.add(themeReview.name);
  }

  if (categoryReviews.length === 0) return picked;
  const startIdx = h % categoryReviews.length;
  for (let i = 0; picked.length < count; i++) {
    const review = categoryReviews[(startIdx + i) % categoryReviews.length];
    if (!usedNames.has(review.name)) {
      picked.push(review);
      usedNames.add(review.name);
    }
    if (i > categoryReviews.length + 5) break;
  }

  return picked;
}

export function getProductRating(product: { id: string; name: string; category: string }): {
  average: number;
  count: number;
} {
  const reviews = getProductReviews(product);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.stars, 0);
  return { average: sum / reviews.length, count: reviews.length };
}
