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

function stripHtml(s: string) {
  return (s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeImage(url: any): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  if (!/^https?:\/\//i.test(url)) return undefined;
  return url;
}

function buildProductPayload(p: any) {
  const price = Number(p.price ?? 0);
  const image = safeImage(p.images?.[0] ?? p.image ?? p.image_url);
  const slug = p.slug || p.id;
  const payload: Record<string, any> = {
    resource_id: String(p.id),
    name: (p.name ?? "Tuote").toString().slice(0, 255),
    description: stripHtml(p.description ?? "").slice(0, 1000),
    url: `${SITE}/tuote/${slug}`,
    price: price.toFixed(2),
    currency: "EUR",
    status: (Number(p.stock ?? 1) > 0) ? "in_stock" : "out_of_stock",
  };
  if (image) payload.image = image;
  return payload;
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1) Resolve shop id: prefer DB cache, then verify against MailerLite, else create.
    let shopId = "";
    const { data: settingRow } = await supabase
      .from("integration_settings")
      .select("value")
      .eq("key", "mailerlite_shop_id")
      .maybeSingle();
    if (settingRow?.value) shopId = String(settingRow.value);

    // Validate cached shop id exists in MailerLite
    if (shopId) {
      const check = await mlFetch(`/ecommerce/shops/${shopId}`, apiKey);
      if (!check.ok) {
        console.log("Cached shop id invalid, will recreate:", shopId, check.status, check.data);
        shopId = "";
      }
    }

    if (!shopId) {
      // Try to find an existing "Huumorikauppa" shop first
      const list = await mlFetch(`/ecommerce/shops`, apiKey);
      const shops: any[] = list.data?.data ?? list.data ?? [];
      const existing = Array.isArray(shops)
        ? shops.find((s) => (s?.name ?? "").toLowerCase() === "huumorikauppa")
        : null;
      if (existing?.id) {
        shopId = String(existing.id);
        console.log("Found existing MailerLite shop:", shopId);
      } else {
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
            error: "Failed to create MailerLite shop",
            status: created.status,
            details: created.data,
          }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        shopId = String(created.data?.data?.id ?? created.data?.id ?? "");
        console.log("Created MailerLite shop:", shopId);
      }

      // Persist shop id for future runs
      if (shopId) {
        await supabase
          .from("integration_settings")
          .upsert({ key: "mailerlite_shop_id", value: shopId, updated_at: new Date().toISOString() });
      }
    }

    if (!shopId) {
      return new Response(JSON.stringify({ error: "Could not resolve MailerLite shop id" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    let sent = 0;
    const errors: any[] = [];

    for (const product of all) {
      const res = await mlFetch(`/ecommerce/shops/${shopId}/products`, apiKey, {
        method: "POST",
        body: JSON.stringify(product),
      });
      if (res.ok || res.status === 201) {
        sent++;
        continue;
      }
      // If already exists, try PUT update
      if (res.status === 409 || res.status === 422) {
        const upd = await mlFetch(
          `/ecommerce/shops/${shopId}/products/${encodeURIComponent(product.resource_id)}`,
          apiKey,
          { method: "PUT", body: JSON.stringify(product) },
        );
        if (upd.ok) { sent++; continue; }
        errors.push({ resource_id: product.resource_id, postStatus: res.status, postDetails: res.data, putStatus: upd.status, putDetails: upd.data });
      } else {
        errors.push({ resource_id: product.resource_id, status: res.status, details: res.data });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      shop_id: shopId,
      total: all.length,
      synced: sent,
      failed: errors.length,
      errors: errors.slice(0, 5),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("sync-mailerlite-products error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
