/**
 * 27.10.2026: EU-reititys (api/_lib/eu-reititys.js) piilotti Printify Choicen (US) ja muiden EU:n ulkopuolisten
 * painotalojen tuotteet, mm. 30-60v-ikäpaidat (EU-kopio on Printifyssä, mutta kaupparivi osoittaa vielä vanhaan
 * tuotteeseen) sekä Super äiskä-, Slay queen- ja Maailman paras äiti -tuotteet (ei EU-kopiota). Nämä sivut jäävät
 * siksi alle LANDING_MIN_PRODUCTS:n.
 *
 * Poikkeus on tiukka: landing.test.ts tarkistaa, että vaje johtuu vain EU-reitityksestä (piilotetut mukaan
 * laskettuna sivulla on vähintään 8 tuotetta) ja että poikkeus poistetaan, kun sivu on taas täynnä. Pysyvä korjaus:
 * kaupparivit EU-kopioihin (Lovable) tai uudet EU-kopiot, sitten scripts/eu-reititys.mjs uudelleen.
 */
import { LANDING_MIN_PRODUCTS } from "@/data/landingPages";
import { onEuReititettySlug } from "../../api/_lib/eu-reititys.js";
import { onPiilotettuTuotePerus } from "@/lib/hiddenCategories";
import type { Product } from "@/types/product";
import type { ProductRow } from "@/seo/prerender/pages";

export const EU_REITITYS_ALLE_MINIMIN: ReadonlySet<string> = new Set([
  "/joululahja-aidille",
  "/joululahja-vaimolle",
  "/lahjat/40-vuotiaalle-miehelle",
  "/lahjat/50-vuotiaalle-miehelle",
  "/lahjat/60-vuotiaalle-miehelle",
  "/lahjat/50-vuotiaalle-naiselle",
  "/lahjat/60-vuotiaalle-naiselle",
]);

/** Poikkeussivuilla sallitaan vähintään näin monta tuotetta. */
export const EU_REITITYS_MINIMI = 4;

export const landingMinimi = (path: string): number => (EU_REITITYS_ALLE_MINIMIN.has(path) ? EU_REITITYS_MINIMI : LANDING_MIN_PRODUCTS);

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
