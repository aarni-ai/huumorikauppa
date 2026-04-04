import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function sendOrderConfirmationEmail(
  supabase: ReturnType<typeof createClient>,
  email: string,
  name: string | null,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  sessionId: string,
) {
  try {
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "order-confirmation",
        recipientEmail: email,
        idempotencyKey: `order-confirm-${sessionId}`,
        templateData: {
          customerName: name || undefined,
          orderTotal: total.toFixed(2),
          items,
        },
      },
    });
    console.log(`Order confirmation email queued for ${email}`);
  } catch (err) {
    console.error("Failed to queue order confirmation email:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Fallback: parse without signature verification (dev mode)
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log(`Stripe event: ${event.type}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Save order to database
      const metadata = session.metadata || {};
      const shippingAddress = metadata.shipping_address
        ? JSON.parse(metadata.shipping_address)
        : null;

      // Check if order already exists
      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (existing) {
        const { data: existingOrder } = await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("stripe_session_id", session.id)
          .select("status")
          .maybeSingle();

        // Send confirmation email
        const customerEmail = session.customer_email || session.customer_details?.email;
        if (customerEmail) {
          await sendOrderConfirmationEmail(
            supabase,
            customerEmail,
            metadata.customer_name || session.customer_details?.name || null,
            [],
            (session.amount_total || 0) / 100,
            session.id,
          );
        }
      } else {
        // Retrieve line items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const items = lineItems.data.map((li) => ({
          name: li.description,
          quantity: li.quantity,
          price: (li.amount_total || 0) / 100,
        }));

        await supabase.from("orders").insert({
          stripe_session_id: session.id,
          customer_email: session.customer_email || session.customer_details?.email,
          customer_name: metadata.customer_name || session.customer_details?.name,
          shipping_address: shippingAddress,
          items,
          total: (session.amount_total || 0) / 100,
          status: "paid",
        });

        // Send confirmation email
        const customerEmail = session.customer_email || session.customer_details?.email;
        if (customerEmail) {
          await sendOrderConfirmationEmail(
            supabase,
            customerEmail,
            metadata.customer_name || session.customer_details?.name || null,
            items,
            (session.amount_total || 0) / 100,
            session.id,
          );
        }
      }
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      if (charge.payment_intent) {
        // Find sessions by payment intent
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: charge.payment_intent as string,
          limit: 1,
        });
        if (sessions.data.length > 0) {
          await supabase
            .from("orders")
            .update({ status: "cancelled" })
            .eq("stripe_session_id", sessions.data[0].id);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
