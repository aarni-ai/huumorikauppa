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
import { AUKOT_TUOTTEET } from "@/data/aukkomallisto2026";
import { AMMATTISIVU_SLUGIT } from "@/data/ammattisivut/polut";
import type { ProductRow } from "@/seo/prerender/pages";

export const EU_REITITYS_ALLE_MINIMIN: ReadonlySet<string> = new Set<string>();

/**
 * 2.11.2026: aihesivut, joiden tuotteista suurin osa on kilpailija-aukkojen mallistoa (src/data/aukkomallisto2026.ts).
 * Mallisto tuotiin kauppaan ja tilannekuvaan 2.11.2026, joten lista on tyhjä. landing.test.ts tarkistaa, että sivu täyttyy
 * malliston kanssa ja että poikkeus poistetaan, kun tilannekuvassa on jo vähintään LANDING_MIN_PRODUCTS tuotetta.
 */
export const UUSI_MALLISTO_ODOTTAA: ReadonlySet<string> = new Set<string>();

/**
 * 2.11.2026: ammatti- ja harrastussivut /paidat/<slug> (src/data/ammattisivut). Sivujen uudet mallit (200 mallia
 * t-paitana ja hupparina, data/uudet-tuotteet/ammattisivut-2026-11-02.json) luodaan Printifyyn ja tuodaan kauppaan
 * ohjaajan ajolla, joten tilannekuvassa niitä ei vielä ole. src/test/ammattisivut.test.ts tarkistaa, että jokaisella
 * sivulla on uusien mallien kanssa vähintään LANDING_MIN_PRODUCTS tuotetta, ja vaatii poistamaan sivun tältä listalta,
 * kun sen uudet mallit ovat tilannekuvassa.
 */
export const AMMATTISIVUT_ODOTTAA: ReadonlySet<string> = new Set<string>(AMMATTISIVU_SLUGIT.map((s) => `/paidat/${s}`));

/**
 * 3.11.2026: painolaadun takia piilotetut tuotteet (api/_lib/painolaatu.js, alle 90 DPI). /lahjat/pomolle menetti
 * Tässä talossa asuu yksi pomo -paidat; tuotannossa sivun täyttävät 2.11. tuodut Toimitusjohtaja. Myös siivooja -paidat,
 * joita testien tilannekuvassa ei vielä ole. landing.test.ts tarkistaa sivun tuotannon aineistolla
 * (src/test/fixtures/kate-kaikki-2026-11-03.json).
 */
export const PAINOLAATU_ODOTTAA: ReadonlySet<string> = new Set<string>(["/lahjat/pomolle"]);

export const landingMinimi = (path: string): number =>
  EU_REITITYS_ALLE_MINIMIN.has(path) || UUSI_MALLISTO_ODOTTAA.has(path) || AMMATTISIVUT_ODOTTAA.has(path) || PAINOLAATU_ODOTTAA.has(path) ? 0 : LANDING_MIN_PRODUCTS;

/** Kilpailija-aukkojen mallisto tuotteina (nimi ja slug kuten tuonnissa), uusi hinnasto. */
export function aukkoTuotteet(): Product[] {
  return AUKOT_TUOTTEET.map((t) => ({
    id: `aukko-${t.slug}`, name: t.name, slug: t.slug, category: t.category, humor_type: "", price: t.category === "hupparit" ? 52.9 : 27.9,
    stock: 99, description: "", images: [], variants: {}, is_featured: false, is_new: true, is_gift_idea: false,
  }));
}

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
