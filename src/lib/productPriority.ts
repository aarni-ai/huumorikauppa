// Shared priority-sort + forced-thumbnail-color logic for top best-sellers.
// Used by AllProducts, Index carousel, and category grids so the same
// hero products always appear at the top of every listing.

export interface PriorityRule {
  // Lower rank = higher priority. Rank 0 is the very top of the grid.
  rank: number;
  // All keywords must be present in the product name (case-insensitive).
  keywords: string[];
  // Optional category filter (product.category slug).
  category?: string;
  // Force a specific color variant as the card thumbnail.
  forcedColor?: string;
}

// Order here IS the on-page order.
export const PRIORITY_RULES: PriorityRule[] = [
  { rank: 0,  keywords: ["saatanan", "tunarit"] },
  { rank: 1,  keywords: ["tonnin", "seteli"] },
  { rank: 2,  keywords: ["i love my girlfriend"], category: "t-paidat", forcedColor: "Black" },
  { rank: 3,  keywords: ["i love my boyfriend"], category: "hupparit", forcedColor: "White" },
  { rank: 4,  keywords: ["minulla ei ole alkoholiongelmaa"], forcedColor: "Black" },
  { rank: 5,  keywords: ["maailman paras", "äiti"], forcedColor: "Pink" },
  { rank: 6,  keywords: ["eläkeläinen"], category: "t-paidat", forcedColor: "Black" },
  { rank: 7,  keywords: ["mersumies"], category: "mukit" },
  { rank: 8,  keywords: ["olen eläkkeellä"] },
  { rank: 9,  keywords: ["amatimies"] },
  { rank: 10, keywords: ["kalju"] },
];

const UNRANKED = 9999;

export function findPriorityRule(product: { name: string; category?: string }): PriorityRule | null {
  const name = product.name.toLowerCase();
  for (const rule of PRIORITY_RULES) {
    if (rule.category && product.category !== rule.category) continue;
    if (rule.keywords.every(kw => name.includes(kw.toLowerCase()))) return rule;
  }
  return null;
}

export function getPriorityRank(product: { name: string; category?: string }): number {
  const rule = findPriorityRule(product);
  return rule ? rule.rank : UNRANKED;
}

export function getForcedColor(product: { name: string; category?: string }): string | undefined {
  return findPriorityRule(product)?.forcedColor;
}

// Sort helper: priority items first (in rule order), then keep original order for the rest.
export function sortByPriority<T extends { name: string; category?: string }>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const ra = getPriorityRank(a);
    const rb = getPriorityRank(b);
    if (ra !== rb) return ra - rb;
    return 0;
  });
}