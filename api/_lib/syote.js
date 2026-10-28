/** Google Merchant -syöte omasta tuotelähteestä (siirretty Supabasen merchant-feed-funktiosta 21.10.2026, sama muoto). */
const SITE = "https://huumorikauppa.fi";
const PRINTIFY_HOST = "images-api.printify.com";

function proxiedImage(url) {
  if (!url) return "";
  if (url.includes("/api/img?u=")) return url;
  let host = "";
  try { host = new URL(url).host; } catch { return url; }
  if (host !== PRINTIFY_HOST) return url;
  return `${SITE}/api/img?u=${encodeURIComponent(url)}`;
}

export const CATEGORY_MAP = {
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

const escapeXml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** @param tuotteet myynnissä olevat tuoterivit (uusin ensin) */
export function merchantSyote(tuotteet) {
  const items = tuotteet.filter((p) => Number(p.stock) > 0).map((p) => {
    const image = proxiedImage(p.images?.[0] || "");
    const additionalImages = p.images && p.images.length > 1
      ? p.images.slice(1, 11).map((img) => `      <g:additional_image_link>${escapeXml(proxiedImage(img))}</g:additional_image_link>`).join("\n")
      : "";
    return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml((p.description || "").substring(0, 5000))}</g:description>
      <g:link>${escapeXml(`${SITE}/tuote/${p.slug}`)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
${additionalImages}
      <g:availability>${Number(p.stock) > 0 ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${Number(p.price).toFixed(2)} EUR</g:price>
      <g:brand>Huumorikauppa</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${escapeXml(CATEGORY_MAP[p.category] || "Apparel & Accessories")}</g:google_product_category>
      <g:shipping>
        <g:country>FI</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
    </item>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Huumorikauppa.fi</title>
    <link>${SITE}</link>
    <description>Hauskat t-paidat, hupparit, julisteet ja lahjat suomeksi</description>
${items.join("\n")}
  </channel>
</rss>`;
}
