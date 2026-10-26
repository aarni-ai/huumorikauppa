import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { blogPosts } from "@/data/blog";

/** Sivukartan käsin ylläpidetty BLOG_SLUGS (api/sitemap.js) kattaa jokaisen blogiartikkelin. */
describe("sivukartta: blogiartikkelit", () => {
  it("jokainen blogiartikkeli on sivukartassa", () => {
    const s = fs.readFileSync(path.resolve(__dirname, "../../api/sitemap.js"), "utf8");
    const lista = s.match(/const BLOG_SLUGS = \[([\s\S]*?)\];/)?.[1] ?? "";
    const sitemap = new Set([...lista.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]));
    const puuttuu = blogPosts.map((p) => p.slug).filter((slug) => !sitemap.has(slug));
    expect(puuttuu).toEqual([]);
  });
});
