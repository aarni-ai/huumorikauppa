import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE = "https://huumorikauppa.fi";
const ML_BASE = "https://connect.mailerlite.com/api";

async function mlFetch(path: string, apiKey: string, init: RequestInit = {}) {
  const res = await fetch(`${ML_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

function buildProductPayload(p: any) {
  return {
    resource_id: String(p.id),
    name: p.name ?? "Tuote",
    description: (p.description ?? "").substring(0, 1000),
    url: `${SITE}/tuote/${p.slug}`,
    image: p.images?.[0] ?? undefined,
    price: Number(p.price ?? 0).toFixed(2),
    currency: "EUR",
    status: (Number(p.stock ?? 0) > 0) ? "in_stock" : "out_of_stock",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("MAILERLITE_ECOMMERCE_API_KEY") || Deno.env.get("MAILERLITE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "MAILERLITE_ECOMMERCE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let shopId = Deno.env.get("MAILERLITE_SHOP_ID") || "";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Auto-create shop if not provided
    if (!shopId) {
      const created = await mlFetch("/ecommerce/shops", apiKey, {
        method: "POST",
        body: JSON.stringify({
          name: "Huumorikauppa",
          url: SITE,
          currency: "EUR",
          platform: "custom",
        }),
      });
      if (!created.ok) {
        return new Response(JSON.stringify({
          error: "Failed to create MailerLite shop. Set MAILERLITE_SHOP_ID secret to an existing shop id.",
          details: created.data,
        }), { status: created.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      shopId = String(created.data?.data?.id ?? created.data?.id ?? "");
      console.log("Created MailerLite shop:", shopId, created.data);
    }

    // Fetch products
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const all = (products ?? []).map(buildProductPayload);
    const chunkSize = 50;
    let sent = 0;
    const errors: any[] = [];

    for (let i = 0; i < all.length; i += chunkSize) {
      const chunk = all.slice(i, i + chunkSize);
      // Try per-product POST (most compatible MailerLite e-commerce endpoint)
      for (const product of chunk) {
        const res = await mlFetch(`/ecommerce/shops/${shopId}/products`, apiKey, {
          method: "POST",
          body: JSON.stringify(product),
        });
        if (!res.ok) {
          // Try update if it already exists
          const upd = await mlFetch(`/ecommerce/shops/${shopId}/products/${encodeURIComponent(product.resource_id)}`, apiKey, {
            method: "PUT",
            body: JSON.stringify(product),
          });
          if (!upd.ok) {
            errors.push({ resource_id: product.resource_id, status: res.status, details: res.data, updateStatus: upd.status, updateDetails: upd.data });
            continue;
          }
        }
        sent++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      shop_id: shopId,
      total: all.length,
      synced: sent,
      failed: errors.length,
      errors: errors.slice(0, 10),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("sync-mailerlite-products error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
