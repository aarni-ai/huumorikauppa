import { computeSellPrice } from "@/lib/pricing";

// Mirrors slugify() in the Printify sync so slugs are consistent across suppliers.
export function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Minimal RFC-4180-ish CSV parser (handles quoted fields, commas, and "" escapes).
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "", row: string[] = [], inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); field = ""; row = []; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const nonEmpty = rows.filter((r) => r.some((x) => x.trim() !== ""));
  if (nonEmpty.length === 0) return [];
  const header = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, idx) => { o[h] = (r[idx] ?? "").trim(); });
    return o;
  });
}

export const VALID_CATEGORIES = [
  "t-paidat", "hupparit", "pitkahihaiset", "bodyt", "mukit", "tarrat",
  "seinataulut", "peitot", "pipot", "laukut", "koristeet", "housut",
];

// Trademarked terms that make an AliExpress listing an IP risk — flagged (not blocked).
const BRAND_KEYWORDS = [
  "mario", "luigi", "nintendo", "pokemon", "pikachu", "doritos", "goku",
  "dragon ball", "spiderman", "spider-man", "marvel", "disney", "teen titans",
  "batman", "superman", "sonic", "minecraft", "roblox", "hello kitty",
  "coca", "pepsi", "nike", "adidas", "gucci", "louis vuitton",
];

export function detectBrand(name: string, description: string): string | null {
  const hay = `${name} ${description}`.toLowerCase();
  const hit = BRAND_KEYWORDS.find((b) => hay.includes(b));
  return hit || null;
}

// Parse "Koko: S | M | L ; Väri: Musta | Valkoinen" into the products.variants shape.
export function parseVariants(str: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!str || !str.trim()) return out;
  for (const part of str.split(";")) {
    const [rawName, rawVals] = part.split(":");
    if (!rawName || !rawVals) continue;
    const name = rawName.trim().toLowerCase();
    const vals = rawVals.split("|").map((v) => v.trim()).filter(Boolean);
    if (vals.length === 0) continue;
    if (/koko|size/.test(name)) out.sizes = vals;
    else if (/väri|vari|color/.test(name)) out.colors = vals;
    else out[name] = vals;
  }
  return out;
}

export interface RowResult {
  line: number;
  name: string;
  status: "ok" | "warning" | "error";
  price?: number;
  messages: string[];
}

/** Validate + price a single CSV row. Never throws; returns a per-row result. */
export function evaluateRow(
  row: Record<string, string>,
  line: number,
  uploadedFilenames: Set<string>,
): RowResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const name = (row.name || "").trim();
  if (!name) errors.push("puuttuva name");

  const category = (row.category || "").trim().toLowerCase();
  if (!VALID_CATEGORIES.includes(category)) errors.push(`virheellinen category "${row.category}"`);

  const cost = parseFloat((row.cost_price_eur || "").replace(",", "."));
  const override = (row.sell_price_eur || "").trim();
  const overrideNum = override ? parseFloat(override.replace(",", ".")) : NaN;
  if (isNaN(cost) && isNaN(overrideNum)) errors.push("puuttuva hinta (cost_price_eur / sell_price_eur)");

  if (!(row.aliexpress_url || "").trim()) errors.push("puuttuva aliexpress_url");

  const imageFiles = (row.image_files || "").split(",").map((f) => f.trim()).filter(Boolean);
  if (imageFiles.length === 0) errors.push("puuttuva image_files");
  const missingImgs = imageFiles.filter((f) => !uploadedFilenames.has(f));
  if (missingImgs.length) errors.push(`kuvatiedostoja ei ladattu: ${missingImgs.join(", ")}`);

  const brand = detectBrand(name, row.description || "");
  if (brand) warnings.push(`mahdollinen brändituote ("${brand}") — tarkista IP-oikeudet ennen julkaisua`);

  const price = !isNaN(overrideNum) ? Math.round(overrideNum * 100) / 100
    : (!isNaN(cost) ? computeSellPrice(cost) : undefined);

  const status: RowResult["status"] = errors.length ? "error" : warnings.length ? "warning" : "ok";
  return { line, name: name || "(nimetön)", status, price, messages: [...errors, ...warnings] };
}
