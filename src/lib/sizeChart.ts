/**
 * Kokotiedot tuotesivulle. Vain oikeita mittoja: taulukko näytetään vain, jos tuotteen oma
 * kuvaus (Printify-kuvaus) sisältää mittataulukon. Lukuja ei koskaan keksitä eikä lainata
 * toisesta tuotteesta; muuten näytetään saatavilla olevat koot ja ohje koon valintaan.
 */

/** Vaatekategoriat, joille kokoapu näytetään. */
export const CLOTHING_CATEGORIES = ["t-paidat", "hupparit", "pitkahihaiset", "bodyt"] as const;

export function isClothingCategory(category: string): boolean {
  return (CLOTHING_CATEGORIES as readonly string[]).includes(category);
}

export interface SizeTable {
  /** Koot taulukon sarakkeina, kuvauksen järjestyksessä. */
  sizes: string[];
  /** Mittarivit sellaisinaan kuvauksesta: otsake ja arvo jokaiselle koolle. */
  rows: { label: string; values: string[] }[];
  /** Yksikkö kuvauksen mukaan ("cm" tai "in"), tai null jos kuvaus ei kerro sitä. */
  unit: "cm" | "in" | null;
}

const SIZE_TOKEN = /^(XXS|XS|S|M|L|XL|XXL|XXXL|[2-6]XL|\d{1,2}-\d{1,2}\s?(kk|m|mo)|NB|\d{1,2}(kk|m|mo))$/i;
const NUMBER_TOKEN = /^\d{1,3}(?:[.,]\d{1,2})?$/;

function sizeHeader(line: string): string[] | null {
  const tokens = line
    .replace(/^(koko|koot|size|sizes)\s*[:|]?\s*/i, "")
    .split(/[\s|\t]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  return tokens.length >= 2 && tokens.every((t) => SIZE_TOKEN.test(t)) ? tokens : null;
}

function unitOf(label: string): SizeTable["unit"] {
  if (/\bcm\b|senttimet/i.test(label)) return "cm";
  if (/\bin\b|inch|tuuma|"/i.test(label)) return "in";
  return null;
}

/**
 * Etsii kuvauksesta mittataulukon muodossa
 *   S M L XL
 *   Width, in 18.00 20.00 22.00 24.00
 *   Leveys (cm) 46 51 56 61
 * Palauttaa null, jos kuvauksessa ei ole kokoriviä ja vähintään yhtä täyttä mittariviä.
 */
export function parseSizeTable(description: string | null | undefined): SizeTable | null {
  if (!description) return null;
  const lines = description.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const sizes = sizeHeader(lines[i]);
    if (!sizes) continue;
    const rows: SizeTable["rows"] = [];
    let unit: SizeTable["unit"] = null;
    for (let j = i + 1; j < lines.length; j++) {
      const tokens = lines[j].split(/[\s|\t]+/).filter(Boolean);
      const values = tokens.slice(-sizes.length);
      const label = tokens.slice(0, tokens.length - sizes.length).join(" ").replace(/[:|]\s*$/, "").trim();
      if (!label || values.length !== sizes.length || !values.every((v) => NUMBER_TOKEN.test(v))) break;
      rows.push({ label, values });
      unit = unit ?? unitOf(label);
    }
    if (rows.length > 0) return { sizes, rows, unit };
  }
  return null;
}
