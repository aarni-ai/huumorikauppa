import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SITE = "https://huumorikauppa.fi";

const CATEGORY_MAP: Record<string, string> = {
  "t-paidat": "Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts",
  "hupparit": "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets",
  "pitkahihaiset": "Apparel & Accessories > Clothing > Shirts & Tops",
  "bodyt": "Apparel & Accessories > Clothing > Underwear & Socks > Undershirts",
  "mukit": "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Mugs",
  "tarrat": "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Craft Kits > Sticker Kits",
  "seinataulut": "Home & Garden > Decor > Artwork > Posters, Prints & Visual Artwork",
  "peitot": "Home & Garden > Linens & Bedding > Bedding > Blankets",
  "pipot": "Apparel & Accessories > Clothing Accessories > Hats",
  "laukut": "Apparel & Accessories > Handbags, Wallets & Cases",
  "koristeet": "Home & Garden > Decor > Ornaments",
  "housut": "Apparel & Accessories > Clothing > Pants",
};

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .gt("stock", 0)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }

  const items = (products || []).map((p: any) => {
    const price = Number(p.price).toFixed(2);
    const image = p.images?.[0] || "";
    const link = `${SITE}/tuote/${p.slug}`;
    const category = CATEGORY_MAP[p.category] || "Apparel & Accessories";
    const availability = p.stock > 0 ? "in_stock" : "out_of_stock";
    const condition = "new";

    let additionalImages = "";
    if (p.images && p.images.length > 1) {
      additionalImages = p.images.slice(1, 11).map((img: string) =>
        `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`
      ).join("\n");
    }

    return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml((p.description || "").substring(0, 5000))}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
${additionalImages}
      <g:availability>${availability}</g:availability>
      <g:price>${price} EUR</g:price>
      <g:brand>Huumorikauppa</g:brand>
      <g:condition>${condition}</g:condition>
      <g:google_product_category>${escapeXml(category)}</g:google_product_category>
      <g:shipping>
        <g:country>FI</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Huumorikauppa.fi</title>
    <link>${SITE}</link>
    <description>Suomen hauskin verkkokauppa – Hauskat t-paidat, hupparit, mukit ja lahjat</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
