import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { processCheckoutSession } from "../_shared/process-order.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Recovery cron: scans Stripe checkout sessions from the last 14 days and
// re-processes any paid session that:
//   - has no order row in DB, OR
//   - has printify_status in (pending, failed), OR
//   - has email_confirmation_status in (pending, failed)
//
// Idempotent — safe to run as often as needed. Designed for hourly cron.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  // Optional override: ?days=30 to extend the window (e.g. manual catch-up)
  const url = new URL(req.url);
  const days = Math.min(60, Math.max(1, Number(url.searchParams.get("days") || "14")));
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  const summary = {
    days_window: days,
    sessions_scanned: 0,
    paid_sessions: 0,
    processed: 0,
    skipped_already_done: 0,
    errors: [] as Array<{ session_id: string; message: string }>,
    results: [] as Array<{ session_id: string; orderId?: string; printify: string; email: string }>,
  };

  try {
    let starting_after: string | undefined = undefined;
    // Page through all sessions in window
    while (true) {
      const list: Stripe.ApiList<Stripe.Checkout.Session> = await stripe.checkout.sessions.list({
        created: { gte: since },
        limit: 100,
        ...(starting_after ? { starting_after } : {}),
      });

      for (const session of list.data) {
        summary.sessions_scanned++;
        if (session.payment_status !== "paid") continue;
        summary.paid_sessions++;

        // Quick pre-check: if order row is fully done, skip
        const { data: existing } = await supabase
          .from("orders")
          .select("id, printify_status, email_confirmation_status")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

        const fullyDone =
          existing &&
          (existing.printify_status === "submitted" || existing.printify_status === "skipped") &&
          (existing.email_confirmation_status === "sent" || existing.email_confirmation_status === "skipped");

        if (fullyDone) {
          summary.skipped_already_done++;
          continue;
        }

        try {
          const result = await processCheckoutSession(supabase, stripe, session);
          summary.processed++;
          summary.results.push({
            session_id: session.id,
            orderId: result.orderId,
            printify: result.printifyResult,
            email: result.emailResult,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          summary.errors.push({ session_id: session.id, message: msg });
        }
      }

      if (!list.has_more) break;
      starting_after = list.data[list.data.length - 1]?.id;
      if (!starting_after) break;
    }

    return new Response(JSON.stringify({ success: true, ...summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: msg, ...summary }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});