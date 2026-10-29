/**
 * Vanhan sivuston kuvaproxy (/api/image-proxy?url=...). Google indeksoi näitä osoitteita touko-syyskuussa 2026, ja ne
 * palauttivat 403:n: proxy haki kuvan Printifystä Googlebot-Image-tunnisteella, jonka Printify torjuu Vercelin
 * IP-osoitteesta (väärennetty botti), ja välitti 403:n eteenpäin (Search Console 179 sivua, KASVU-RAPORTTI.md
 * 29.10.2026). Nykyiset kuvat tarjoillaan /api/img:n kautta, joten vanhat osoitteet ohjataan sinne pysyvästi. Vain
 * Printifyn kuvapalvelimet kelpaavat, joten ohjaus ei ole avoin uudelleenohjaus.
 */
export const config = { runtime: "edge" };

const ALLOWED_HOSTS = new Set(["images-api.printify.com", "images.printify.com"]);

export default function handler(request: Request): Response {
  const imageUrl = new URL(request.url).searchParams.get("url");
  let target: URL | null = null;
  try {
    target = imageUrl ? new URL(imageUrl) : null;
  } catch {
    target = null;
  }
  if (!target || target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  }
  return new Response(null, {
    status: 301,
    headers: {
      Location: `/api/img?u=${encodeURIComponent(target.toString())}`,
      "Cache-Control": "public, max-age=86400, s-maxage=31536000",
    },
  });
}
