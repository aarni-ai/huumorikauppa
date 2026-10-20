/**
 * GET /api/products: myynnissä olevat tuotteet (sama rivimuoto kuin vanhan taustan products-taulu).
 *   ?slug=x  yksi tuote (myös piilotettu, jotta middleware ja ohjaukset tietävät sen)
 *   ?category=a,b&limit=20&fields=slug,name,images,price  kevyt lista (middleware)
 */
import { kaikkiTuotteet, naytettavatTuotteet, lahde } from "./_lib/tuotteet.js";

const valitse = (p, kentat) => (kentat ? Object.fromEntries(kentat.map((k) => [k, p[k]])) : p);

export default async function handler(req, res) {
  try {
    const kentat = typeof req.query.fields === "string" ? req.query.fields.split(",").filter(Boolean) : null;
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    res.setHeader("X-Tuotelahde", lahde());
    if (typeof req.query.slug === "string") {
      const p = (await kaikkiTuotteet()).find((x) => x.slug === req.query.slug);
      return res.status(p ? 200 : 404).json(p ? valitse(p, kentat) : null);
    }
    let rivit = await naytettavatTuotteet();
    if (typeof req.query.category === "string") {
      const k = new Set(req.query.category.split(","));
      rivit = rivit.filter((p) => k.has(p.category));
    }
    const raja = Number(req.query.limit);
    if (raja > 0) rivit = rivit.slice(0, raja);
    return res.status(200).json(rivit.map((p) => valitse(p, kentat)));
  } catch (e) {
    console.error("products:", e);
    return res.status(500).json({ error: "tuotteet" });
  }
}
