import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { processCheckoutSession } from "../_shared/process-order.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Public lookup of order by Stripe session ID — used by /tilaus-vahvistettu page.
// SELF-HEALING: if the order is missing OR Printify/email steps are still pending,
// re-run the order processor (idempotent). This guarantees the customer ALWAYS
// gets the confirmation email and Printify ALWAYS gets the order, even when the
// Stripe webhook fails or hasn't fired yet.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let { data: order } = await supabase
      .from("orders")
      .select("id, items, total, status, created_at, customer_email, shipping_address, printify_status, email_confirmation_status")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    // Determine if we need to (re)process this session
    const needsProcessing =
      !order ||
      order.printify_status === "pending" ||
      order.printify_status === "failed" ||
      order.email_confirmation_status === "pending" ||
      order.email_confirmation_status === "failed";

    if (needsProcessing) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          // Only process paid sessions
          if (session.payment_status === "paid") {
            const result = await processCheckoutSession(supabase, stripe, session);
            console.log(`get-order-by-session self-heal for ${sessionId}:`, result);
            // Re-read the order after processing
            const { data: refreshed } = await supabase
              .from("orders")
              .select("id, items, total, status, created_at, customer_email, shipping_address, printify_status, email_confirmation_status")
              .eq("stripe_session_id", sessionId)
              .maybeSingle();
            order = refreshed;
          }
        } catch (procErr) {
          console.error("Self-heal in get-order-by-session failed:", procErr);
          // Don't fail the request — fall through and return whatever we have
        }
      }
    }

    if (!order) {
      return new Response(
        JSON.stringify({ found: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if customer email was sent successfully
    const { data: emailLog } = await supabase
      .from("email_logs")
      .select("status, created_at")
      .eq("order_id", order.id)
      .eq("email_type", "customer")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        found: true,
        order: {
          id: order.id,
          items: order.items,
          total: order.total,
          status: order.status,
          created_at: order.created_at,
          customer_email: order.customer_email,
          shipping_country:
            (order.shipping_address as Record<string, unknown> | null)?.country ?? "FI",
        },
        emailSent: emailLog?.status === "success",
        emailStatus: emailLog?.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
