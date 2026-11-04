/**
 * GET /api/products: myynnissä olevat tuotteet (sama rivimuoto kuin vanhan taustan products-taulu).
 *   ?slug=x  yksi tuote (myös piilotettu, jotta middleware ja ohjaukset tietävät sen)
 *   ?category=a,b&limit=20&fields=slug,name,images,price  kevyt lista (middleware)
 *   ?suositukset=x[&maara=4]  "Usein ostetaan yhdessä" tuotteelle x (api/_lib/suositukset.js):
 *                              [{ product, suoraan, samaTeema }], tuntematon tuote 404
 *   ?joulukalenteri=1  joulukalenterin tila (api/_lib/joulukalenteri-seuranta.js kalenterinJulkinenTila): menneet luukut
 *                      ja tämän päivän luukun tuote ja hinta Suomen ajan mukaan, ei koskaan tulevia luukkuja
 * Rivien variants ilman saatavuudettomia yhdistelmiä (api/_lib/saatavuus.js karsiVariantit), lista unavailable_variants.
 */
import { kaikkiTuotteet, naytettavatTuotteet, lahde } from "./_lib/tuotteet.js";
import { karsiVariantit } from "./_lib/saatavuus.js";
import { ostetaanYhdessa } from "./_lib/suositukset.js";

// Saatavuudettomat väri/koko-yhdistelmät pois (variants.variant_map, colors, sizes); lista kentässä unavailable_variants.
const valitse = (p, kentat) => {
  const k = karsiVariantit(p);
  return kentat ? Object.fromEntries(kentat.map((x) => [x, k[x]])) : k;
};

/**
 * Joulukalenteri: välimuisti enintään 5 min ja aina ennen keskiyötä Suomen aikaa (ei stale-while-revalidatea), jotta
 * eilisen luukun hinta ei näy uuden päivän puolella.
 */
async function joulukalenteri(res) {
  const { default: JOULUKALENTERI } = await import("./_lib/joulukalenteri-data.js");
  const { kalenterinJulkinenTila, hintahistoria30 } = await import("./_lib/joulukalenteri-seuranta.js");
  const { sekuntejaKeskiyohon, helsinginPaiva } = await import("./_lib/joulukalenteri.js");
  const { onTietokanta, sql } = await import("./_lib/db.js");
  const nyt = new Date();
  const tanaan = helsinginPaiva(nyt);
  const tila = await kalenterinJulkinenTila({
    luukut: JOULUKALENTERI, tuotteet: await kaikkiTuotteet(), nyt,
    historia: async (slug) => (onTietokanta() ? hintahistoria30(sql(), slug, tanaan) : []),
  });
  const ika = Math.max(0, Math.min(300, sekuntejaKeskiyohon(nyt) - 5));
  res.setHeader("Cache-Control", `public, max-age=${Math.min(60, ika)}, s-maxage=${ika}`);
  return res.status(200).json(tila);
}

export default async function handler(req, res) {
  try {
    const kentat = typeof req.query.fields === "string" ? req.query.fields.split(",").filter(Boolean) : null;
    if (typeof req.query.joulukalenteri === "string") return await joulukalenteri(res);
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    res.setHeader("X-Tuotelahde", lahde());
    if (typeof req.query.suositukset === "string") {
      const rivit = (await naytettavatTuotteet()).map((p) => karsiVariantit(p));
      const p = rivit.find((x) => x.slug === req.query.suositukset);
      if (!p) return res.status(404).json([]);
      const maara = Math.min(8, Math.max(1, Number(req.query.maara) || 4));
      return res.status(200).json(ostetaanYhdessa(p, rivit, maara).map((s) => ({ ...s, product: valitse(s.product, kentat) })));
    }
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
