import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const ALLOWED_HOSTS = new Set([
  "images-api.printify.com",
  "images.printify.com",
]);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const reqUrl = new URL(req.url);
    const target = reqUrl.searchParams.get("url");

    if (!target) {
      return new Response("Missing url parameter", {
        status: 400,
        headers: corsHeaders,
      });
    }

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return new Response("Invalid url", { status: 400, headers: corsHeaders });
    }

    if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
      return new Response("Host not allowed", {
        status: 403,
        headers: corsHeaders,
      });
    }

    const upstream = await fetch(parsed.toString(), {
      headers: {
        // Friendly UA so Printify CDN doesn't block us
        "User-Agent":
          "Mozilla/5.0 (compatible; HuumorikauppaImageProxy/1.0; +https://huumorikauppa.fi)",
        Accept: "image/*,*/*;q=0.8",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response(`Upstream error: ${upstream.status}`, {
        status: 502,
        headers: corsHeaders,
      });
    }

    const contentType =
      upstream.headers.get("content-type") || "image/jpeg";

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        // 24h cache (browsers + CDN), 7d stale-while-revalidate
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (e) {
    return new Response(`Proxy error: ${(e as Error).message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
