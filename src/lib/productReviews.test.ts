import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getProductRating, getProductReviews, isPublishableReview, parseReviewDate } from "./productReviews";
import { buildProductJsonLd } from "@/seo/structuredData";
import fixture from "@/test/fixtures/products-snapshot.json";

const ROOT = path.resolve(__dirname, "../..");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(ts|tsx|js|mjs)$/.test(e.name) ? [p] : [];
  });
}

describe("asiakasarviot: vain todennettavat", () => {
  it("julkaistava arvio on päivätty aikaisintaan 25.3.2026", () => {
    expect(isPublishableReview({ date: "25.3.2026" })).toBe(true);
    expect(isPublishableReview({ date: "24.3.2026" })).toBe(false);
    expect(isPublishableReview({ date: "5.3.2026" })).toBe(false);
    expect(isPublishableReview({ date: "" })).toBe(false);
    expect(isPublishableReview({})).toBe(false);
    expect(parseReviewDate("31.2.2026")).toBeNull();
  });

  it("tuotesivut eivät näytä yhtään todentamatonta arviota", () => {
    const products = (fixture as Array<{ id: string; name: string; category: string }>).slice(0, 200);
    for (const p of products) {
      for (const r of getProductReviews(p)) expect(isPublishableReview(r), `${p.name}: ${r.name} ${r.date}`).toBe(true);
      const { count } = getProductRating(p);
      expect(count).toBe(getProductReviews(p).length);
    }
  });

  it("sovellus ei tuo arvosteluarkistoa", () => {
    const importers = [...walk(path.join(ROOT, "src")), path.join(ROOT, "middleware.ts"), ...walk(path.join(ROOT, "scripts"))]
      .filter((f) => !/\.test\.[jt]sx?$/.test(f) && !f.endsWith("arvostelut-arkisto.ts"))
      .filter((f) => /(from|import\()\s*["'][^"']*arvostelut-arkisto/.test(fs.readFileSync(f, "utf8")));
    expect(importers.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  it("rakenteisessa datassa ei ole aggregateRatingia eikä Reviewta", () => {
    const p = (fixture as Array<{ id: string; slug: string; name: string; price: number }>)[0];
    const jsonLd = JSON.stringify(buildProductJsonLd({ id: p.id, slug: p.slug, name: p.name, description: "", images: [], price: p.price }));
    expect(jsonLd).not.toMatch(/aggregateRating|"Review"|reviewRating/);
    const sources = [...walk(path.join(ROOT, "src")), path.join(ROOT, "middleware.ts"), ...walk(path.join(ROOT, "scripts")), ...walk(path.join(ROOT, "api"))]
      .filter((f) => !/\.test\.[jt]sx?$/.test(f) && !f.endsWith("arvostelut-arkisto.ts"))
      .filter((f) => /["']?aggregateRating["']?\s*:|["']@type["']\s*:\s*["'](Review|AggregateRating)["']|reviewRating["']?\s*:/.test(fs.readFileSync(f, "utf8")));
    expect(sources.map((f) => path.relative(ROOT, f))).toEqual([]);
  });
});
