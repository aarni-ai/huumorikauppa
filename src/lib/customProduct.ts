/**
 * Detects products that are personalised with the customer's own text/image.
 * Used to require a design-wish input before the product can be ordered.
 */
export function isCustomTextProduct(product: { name: string; description: string }): boolean {
  const t = (product.name + " " + (product.description || "")).toLowerCase();
  return (
    t.includes("oma teksti") ||
    t.includes("omalla tekstillä") ||
    t.includes("oma kuva") ||
    t.includes("omalla kuvalla") ||
    t.includes("custom text") ||
    t.includes("custom design") ||
    t.includes("personoi") ||
    t.includes("personoitava")
  );
}