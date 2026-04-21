import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CartLineItem {
  id?: string;        // product UUID (preferred — used for server-side price lookup)
  slug?: string;      // fallback identifier
  name: string;
  price?: number;     // ❌ ignored — server fetches authoritative price from DB
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
}

interface CheckoutRequest {
  items: CartLineItem[];
  customerEmail: string;
  customerName: string;
  shippingAddress: {
    address: string;
    zip: string;
    city: string;
  };
  discountCode?: string;
}

const DISCOUNT_CODES: Record<string, number> = {
  "HUUMORI10": 10,
  "huumori10": 10,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const respond = (ok: boolean, payload: Record<string, unknown>) =>
    new Response(JSON.stringify({ ok, ...payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return respond(false, {
        error: "Maksupalvelun avain puuttuu.",
        diagnostics: { error_stage: "missing_secret", processing_time_ms: Date.now() - startTime },
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const { items, customerEmail, customerName, shippingAddress, discountCode } =
      (await req.json()) as CheckoutRequest;

    const discountPercent = discountCode
      ? DISCOUNT_CODES[discountCode] || DISCOUNT_CODES[discountCode?.toUpperCase()] || 0
      : 0;

    if (!items || items.length === 0) {
      return respond(false, {
        error: "Ostoskori on tyhjä.",
        diagnostics: { error_stage: "missing_items", processing_time_ms: Date.now() - startTime },
      });
    }

    if (!customerEmail) {
      return respond(false, {
        error: "Sähköpostiosoite puuttuu.",
        diagnostics: { error_stage: "missing_email", processing_time_ms: Date.now() - startTime },
      });
    }

    // 🔒 SECURITY: fetch authoritative prices from DB. Never trust client-supplied prices.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const ids = items.map((i) => i.id).filter(Boolean) as string[];
    const slugs = items.map((i) => i.slug).filter(Boolean) as string[];

    if (ids.length === 0 && slugs.length === 0) {
      return respond(false, {
        error: "Tuotetiedot puuttuvat.",
        diagnostics: { error_stage: "missing_product_ids", processing_time_ms: Date.now() - startTime },
      });
    }

    let dbQuery = supabaseAdmin.from("products").select("id, slug, name, price");
    if (ids.length > 0 && slugs.length > 0) {
      dbQuery = dbQuery.or(`id.in.(${ids.join(",")}),slug.in.(${slugs.join(",")})`);
    } else if (ids.length > 0) {
      dbQuery = dbQuery.in("id", ids);
    } else {
      dbQuery = dbQuery.in("slug", slugs);
    }
    const { data: dbProducts, error: dbErr } = await dbQuery;
    if (dbErr || !dbProducts) {
      return respond(false, {
        error: "Tuotteiden hinnan tarkistus epäonnistui.",
        diagnostics: { error_stage: "db_price_lookup", processing_time_ms: Date.now() - startTime },
      });
    }

    const priceById = new Map(dbProducts.map((p) => [p.id, Number(p.price)]));
    const priceBySlug = new Map(dbProducts.map((p) => [p.slug, Number(p.price)]));

    // Resolve each cart item to its authoritative price
    type ResolvedItem = CartLineItem & { _serverPrice: number };
    const resolved: ResolvedItem[] = [];
    for (const item of items) {
      let serverPrice: number | undefined;
      if (item.id && priceById.has(item.id)) serverPrice = priceById.get(item.id);
      else if (item.slug && priceBySlug.has(item.slug)) serverPrice = priceBySlug.get(item.slug);
      if (typeof serverPrice !== "number" || !Number.isFinite(serverPrice) || serverPrice <= 0) {
        return respond(false, {
          error: `Tuotteen hintaa ei voitu vahvistaa: ${item.name}`,
          diagnostics: { error_stage: "unknown_product_price", processing_time_ms: Date.now() - startTime },
        });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        return respond(false, {
          error: "Virheellinen määrä.",
          diagnostics: { error_stage: "invalid_quantity", processing_time_ms: Date.now() - startTime },
        });
      }
      resolved.push({ ...item, _serverPrice: serverPrice });
    }

    const subtotal = resolved.reduce((sum, i) => sum + i._serverPrice * i.quantity, 0);
    const shippingFree = subtotal >= 60;
    const shippingCost = shippingFree ? 0 : 5.95;

    const isValidImageUrl = (url?: string): boolean => {
      if (!url) return false;
      try {
        const u = new URL(url);
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    };

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = resolved.map(
      (item) => {
        const description = [item.size && `Koko: ${item.size}`, item.color && `Väri: ${item.color}`]
          .filter(Boolean)
          .join(", ");

        const validImage = isValidImageUrl(item.image) ? item.image : undefined;

        return {
          price_data: {
            currency: "eur",
            product_data: {
              name: item.name,
              ...(description ? { description } : {}),
              ...(validImage ? { images: [validImage] } : {}),
            },
            unit_amount: Math.round(item._serverPrice * (1 - discountPercent / 100) * 100),
          },
          quantity: item.quantity,
        };
      }
    );

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Toimitus – Posti kotiinkuljetus",
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get("origin") || "https://huumorikauppa.fi";

    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/tilaus-vahvistettu?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/kassa`,
      metadata: {
        customer_name: customerName,
        shipping_address: JSON.stringify(shippingAddress),
      },
      locale: "fi",
    });

    return respond(true, {
      url: session.url,
      diagnostics: { error_stage: "none", processing_time_ms: Date.now() - startTime },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return respond(false, {
      error: error instanceof Error ? error.message : "Tuntematon virhe maksun aloituksessa.",
      diagnostics: { error_stage: "stripe_checkout_create", processing_time_ms: Date.now() - startTime },
    });
  }
});
