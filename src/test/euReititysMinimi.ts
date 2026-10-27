/**
 * 27.10.2026: EU-reititys (api/_lib/eu-reititys.js) piilotti Printify Choicen (US) ja muiden EU:n ulkopuolisten
 * painotalojen tuotteet. Lovablen taustassa (main) kaupparivit osoittavat yhä vanhoihin tuotteisiin, joten seitsemän
 * lahjasivua jäi siellä alle LANDING_MIN_PRODUCTS:n.
 *
 * Oma tausta: kannan rivit siirretään EU-kopioihin (scripts/tuo-tuotteet.mjs ja api/cron/tilaukset.js
 * ?tehtava=eu-siirrot, kirjaukset data/eu-siirto-*.json). 35 piilotetusta 32:lla on EU-kopio (3 ilman: keraamiset
 * koristeet ja lippis, Printifyssä ei EU-painotaloa). Siksi poikkeuslista on tyhjä ja jokaisella sivulla pitää olla
 * vähintään LANDING_MIN_PRODUCTS tuotetta, kun tilannekuvan rivit osoittavat kannan tapaan EU-kopioihin (kannanRivit).
 *
 * Testit (landing.test.ts, joululahjat.test.ts) tarkistavat edelleen, että poikkeus poistetaan, kun sivu on täynnä.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { LANDING_MIN_PRODUCTS } from "@/data/landingPages";
import { onEuReititettySlug } from "../../api/_lib/eu-reititys.js";
import { lueEuSiirrot } from "../../scripts/lib/eu-kanta.mjs";
import { onPiilotettuTuotePerus } from "@/lib/hiddenCategories";
import type { Product } from "@/types/product";
import type { ProductRow } from "@/seo/prerender/pages";

export const EU_REITITYS_ALLE_MINIMIN: ReadonlySet<string> = new Set<string>();

export const landingMinimi = (path: string): number => (EU_REITITYS_ALLE_MINIMIN.has(path) ? 0 : LANDING_MIN_PRODUCTS);

const JUURI = path.resolve(__dirname, "../..");

/**
 * Tilannekuvan rivit oman taustan kannan tilassa: printify_product_id on oman taustan tilannekuvan
 * (data/products-snapshot.json) tunnus kirjattujen EU-siirtojen (data/eu-siirto-*.json) jälkeen, kuten
 * tuo-tuotteet.mjs ja ?tehtava=eu-siirrot vievät sen kantaan. Näin EU-reititys (onEuReititetty) päättää näkyvyyden
 * rivin tunnuksesta eikä pelkästä slugista.
 */
export function kannanRivit<T extends { slug: string }>(rows: T[]): (T & { printify_product_id?: string })[] {
  const data = JSON.parse(readFileSync(path.join(JUURI, "data/products-snapshot.json"), "utf8")) as { slug: string; printify_product_id?: string }[];
  const siirrot = lueEuSiirrot(path.join(JUURI, "data"));
  const idt = new Map(data.map((r) => {
    const id = String(r.printify_product_id ?? "");
    return [r.slug, String(siirrot.vanhaan.get(id)?.uusiId ?? id)];
  }));
  return rows.map((r) => (idt.get(r.slug) ? { ...r, printify_product_id: idt.get(r.slug) } : r));
}

/** Tilannekuvan rivit, jotka vain EU-reititys piilottaa, Product-muodossa (vajeen tarkistukseen). */
export function euPiilotetutTuotteet(rows: ProductRow[]): Product[] {
  return rows
    .filter((r) => r.is_active !== false && !!r.slug && !!r.name && onEuReititettySlug(r.slug) && !onPiilotettuTuotePerus(r))
    .map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category,
      humor_type: r.humor_type ?? "",
      price: Number(r.price),
      stock: typeof r.stock === "number" ? r.stock : 0,
      description: r.description ?? "",
      images: (r.images ?? []).filter(Boolean),
      variants: (r.variants as Record<string, unknown> | null) ?? {},
      is_featured: !!r.is_featured,
      is_new: false,
      is_gift_idea: false,
    }));
}
