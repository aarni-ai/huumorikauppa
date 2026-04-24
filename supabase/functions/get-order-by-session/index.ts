import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Public lookup of order by Stripe session ID — used by /tilaus-vahvistettu page
// Returns sanitized order info (no admin/internal fields)
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

    const { data: order } = await supabase
      .from("orders")
      .select("id, items, total, status, created_at, customer_email, shipping_address")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (!order) {
      // Order not yet inserted (webhook may still be processing)
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
