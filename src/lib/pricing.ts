/**
 * Retail price for a dropship product from its cost.
 *
 * Rule: sell = max(cost × 3, 6.90 €), then rounded UP to the nearest X.90.
 * Used by the AliExpress CSV import (a per-product manual override is allowed).
 */
export function computeSellPrice(costEur: number): number {
  const base = Math.max(costEur * 3, 6.9);
  const floorEuro = Math.floor(base + 1e-9);
  let price = floorEuro + 0.9;
  if (price < base - 1e-9) price = floorEuro + 1.9; // base already past X.90 → next euro
  return Math.round(price * 100) / 100;
}
