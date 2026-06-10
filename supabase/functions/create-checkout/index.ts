import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { syncPrintifyProductByName } from "../_shared/printify-sync.ts";

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
  customText?: string;  // customer's personalisation wish (oma teksti/kuva)
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

// Discount codes are loaded dynamically from the discount_codes table.
type DiscountInfo = { type: 'percent' | 'fixed'; value: number };

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

    // Resolve discount from DB (case-insensitive)
    let discount: DiscountInfo | null = null;
    if (discountCode) {
      const supabaseLookup = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: dc } = await supabaseLookup
        .from("discount_codes")
        .select("discount_type, discount_value, is_active")
        .ilike("code", discountCode.trim())
        .maybeSingle();
      if (dc && (dc as any).is_active) {
        discount = {
          type: (dc as any).discount_type === 'fixed' ? 'fixed' : 'percent',
          value: Number((dc as any).discount_value),
        };
      }
    }
    const discountPercent = discount?.type === 'percent' ? discount.value : 0;
    const discountFixedEur = discount?.type === 'fixed' ? discount.value : 0;

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

    let dbQuery = supabaseAdmin.from("products").select("id, slug, name, price, printify_product_id, variants");
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

    const productById = new Map(dbProducts.map((p: any) => [p.id, p]));
    const productBySlug = new Map(dbProducts.map((p: any) => [p.slug, p]));

    // Resolve each cart item to its authoritative price
    type ResolvedItem = CartLineItem & {
      _serverPrice: number;
      _printifyProductId?: string | null;
      _printifyVariantId?: number | null;
    };
    const resolved: ResolvedItem[] = [];
    for (const item of items) {
      let dbProd: any = undefined;
      if (item.id && productById.has(item.id)) dbProd = productById.get(item.id);
      else if (item.slug && productBySlug.has(item.slug)) dbProd = productBySlug.get(item.slug);
      const serverPrice = dbProd ? Number(dbProd.price) : undefined;
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
      // Look up Printify variant_id from variants.variant_map ("Color|Size" -> id)
      let printifyVariantId: number | null = null;
      let variantMap = dbProd?.variants?.variant_map as Record<string, number> | undefined;
      let printifyProductId: string | null = dbProd?.printify_product_id || null;

      // 🔄 Lazy-sync from Printify if this product is missing the data we
      // need to fulfill it. Ensures every checkout carries valid Printify
      // metadata, even if the catalog wasn't pre-synced.
      if (dbProd && (!printifyProductId || !variantMap)) {
        try {
          const synced = await syncPrintifyProductByName(supabaseAdmin, dbProd.name);
          if (synced) {
            printifyProductId = synced.printify_product_id;
            variantMap = synced.variants?.variant_map as Record<string, number> | undefined;
          }
        } catch (err) {
          console.warn(`Lazy-sync at checkout failed for "${dbProd.name}":`, err);
        }
      }

      if (variantMap) {
        const key = `${item.color || ''}|${item.size || ''}`;
        if (typeof variantMap[key] === 'number') printifyVariantId = variantMap[key];
      }
      resolved.push({
        ...item,
        _serverPrice: serverPrice,
        _printifyProductId: printifyProductId,
        _printifyVariantId: printifyVariantId,
      });
    }

    const subtotal = resolved.reduce((sum, i) => sum + i._serverPrice * i.quantity, 0);
    // Distribute fixed discount proportionally per unit
    const discountedSubtotal = Math.max(0, subtotal - discountFixedEur);
    const fixedDiscountRatio = subtotal > 0 ? discountedSubtotal / subtotal : 1;
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
        const cleanCustomText = typeof item.customText === "string" ? item.customText.trim().slice(0, 200) : "";
        const fullDescription = [description, cleanCustomText ? `Oma teksti: "${cleanCustomText}"` : ""]
          .filter(Boolean)
          .join(" | ");

        const validImage = isValidImageUrl(item.image) ? item.image : undefined;

        const baseUnitCents = Math.round(item._serverPrice * 100);
        const percentAdjusted = baseUnitCents * (1 - discountPercent / 100);
        const finalUnitAmount = Math.max(
          0,
          Math.round(percentAdjusted * fixedDiscountRatio),
        );
        return {
          price_data: {
            currency: "eur",
            product_data: {
              name: item.name,
              ...(fullDescription ? { description: fullDescription } : {}),
              ...(validImage ? { images: [validImage] } : {}),
            },
            unit_amount: finalUnitAmount,
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

    // Build compact Printify line-items payload for the webhook to fulfill the order
    const printifyItems = resolved
      .filter((i) => i._printifyProductId && i._printifyVariantId)
      .map((i) => ({
        product_id: i._printifyProductId,
        variant_id: i._printifyVariantId,
        quantity: i.quantity,
      }));

    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/tilaus-vahvistettu?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/kassa`,
      metadata: {
        customer_name: customerName,
        shipping_address: JSON.stringify(shippingAddress),
        // Printify fulfillment payload (compact JSON, ≤500 chars per metadata value typical)
        printify_items: JSON.stringify(printifyItems),
        discount_code: discountCode || "",
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
