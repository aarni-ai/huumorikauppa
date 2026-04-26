import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { processCheckoutSession } from "../_shared/process-order.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Loose-typed to avoid PostgrestVersion generic friction across SDK minor versions
// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

// Log to webhook_logs table — never throws
async function logWebhook(
  supabase: SupabaseClient,
  params: {
    event_type: string;
    event_id?: string;
    stripe_session_id?: string;
    success: boolean;
    error_message?: string;
    raw_data?: Record<string, unknown>;
  },
) {
  try {
    await supabase.from("webhook_logs").insert(params);
  } catch (err) {
    console.error("Failed to write webhook_log:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let event: Stripe.Event | null = null;
  let rawBody = "";

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (webhookSecret && sig) {
      try {
        event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
      } catch (verifyErr) {
        const msg = verifyErr instanceof Error ? verifyErr.message : String(verifyErr);
        console.error("Signature verification failed:", msg);
        await logWebhook(supabase, {
          event_type: "signature_verification_failed",
          success: false,
          error_message: msg,
        });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      // Dev fallback
      event = JSON.parse(rawBody) as Stripe.Event;
      console.warn("Webhook signature not verified (dev mode)");
    }

    console.log(`Stripe event: ${event.type} (${event.id})`);

    // Process checkout completion (primary path)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      try {
        const result = await processCheckoutSession(supabase, stripe, session);
        await logWebhook(supabase, {
          event_type: event.type,
          event_id: event.id,
          stripe_session_id: session.id,
          success: true,
          raw_data: { orderId: result.orderId, customerEmail: result.customerEmail },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("processCheckoutSession failed:", msg);
        await logWebhook(supabase, {
          event_type: event.type,
          event_id: event.id,
          stripe_session_id: session.id,
          success: false,
          error_message: msg,
          raw_data: { sessionId: session.id },
        });
        // Re-throw so Stripe retries
        throw err;
      }
    }

    // Backup path: payment_intent.succeeded — find session and process if not already
    else if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      try {
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: pi.id,
          limit: 1,
        });
        if (sessions.data.length > 0) {
          const session = sessions.data[0];
          // Only process if no order yet
          const { data: existing } = await supabase
            .from("orders")
            .select("id, status")
            .eq("stripe_session_id", session.id)
            .maybeSingle();

          if (!existing || existing.status !== "paid") {
            const result = await processCheckoutSession(supabase, stripe, session);
            await logWebhook(supabase, {
              event_type: event.type,
              event_id: event.id,
              stripe_session_id: session.id,
              success: true,
              raw_data: { backup_path: true, orderId: result.orderId },
            });
          } else {
            await logWebhook(supabase, {
              event_type: event.type,
              event_id: event.id,
              stripe_session_id: session.id,
              success: true,
              raw_data: { skipped: "already processed" },
            });
          }
        } else {
          await logWebhook(supabase, {
            event_type: event.type,
            event_id: event.id,
            success: true,
            raw_data: { skipped: "no checkout session for payment_intent", payment_intent: pi.id },
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("payment_intent.succeeded handler failed:", msg);
        await logWebhook(supabase, {
          event_type: event.type,
          event_id: event.id,
          success: false,
          error_message: msg,
        });
      }
    }

    // Refund handling
    else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      try {
        if (charge.payment_intent) {
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
        await logWebhook(supabase, {
          event_type: event.type,
          event_id: event.id,
          success: true,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await logWebhook(supabase, {
          event_type: event.type,
          event_id: event.id,
          success: false,
          error_message: msg,
        });
      }
    }

    // Other events — just log
    else {
      await logWebhook(supabase, {
        event_type: event.type,
        event_id: event.id,
        success: true,
        raw_data: { handled: false },
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webhook fatal error:", msg);
    await logWebhook(supabase, {
      event_type: event?.type || "unknown",
      event_id: event?.id,
      success: false,
      error_message: msg,
    });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
