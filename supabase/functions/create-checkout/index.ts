import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CartLineItem {
  name: string;
  price: number; // in euros
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

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const { items, customerEmail, customerName, shippingAddress, discountCode } =
      (await req.json()) as CheckoutRequest;

    // Validate discount code
    const discountPercent = discountCode
      ? DISCOUNT_CODES[discountCode] || DISCOUNT_CODES[discountCode?.toUpperCase()] || 0
      : 0;

    if (!items || items.length === 0) {
      throw new Error("No items in cart");
    }

    if (!customerEmail) {
      throw new Error("Customer email is required");
    }

    // Calculate shipping
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingFree = subtotal >= 60;
    const shippingCost = shippingFree ? 0 : 5.95;

    // Build line items with price_data for dynamic cart
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item) => {
        const description = [item.size && `Koko: ${item.size}`, item.color && `Väri: ${item.color}`]
          .filter(Boolean)
          .join(", ");

        return {
          price_data: {
            currency: "eur",
            product_data: {
              name: item.name,
              ...(description ? { description } : {}),
              ...(item.image ? { images: [item.image] } : {}),
            },
            unit_amount: Math.round(item.price * (1 - discountPercent / 100) * 100), // cents
          },
          quantity: item.quantity,
        };
      }
    );

    // Add shipping as line item if not free
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

    const origin = req.headers.get("origin") || "https://meemi-meisteri-kauppa.lovable.app";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: lineItems,
      mode: "payment",
      payment_method_types: ["card", "klarna", "mobilepay"],
      success_url: `${origin}/tilaus-vahvistettu?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/kassa`,
      metadata: {
        customer_name: customerName,
        shipping_address: JSON.stringify(shippingAddress),
      },
      locale: "fi",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
