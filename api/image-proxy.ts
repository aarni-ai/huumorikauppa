export const config = { runtime: "edge" };

const ALLOWED_HOSTS = new Set(["images-api.printify.com", "images.printify.com"]);

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(imageUrl);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(targetUrl.hostname)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const imageResponse = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot-Image/1.0; +http://www.google.com/bot.html)",
        "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": "https://huumorikauppa.fi/",
      },
    });

    if (!imageResponse.ok) {
      return new Response("Image fetch failed", { status: imageResponse.status });
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const body = await imageResponse.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("Proxy error", { status: 502 });
  }
}
