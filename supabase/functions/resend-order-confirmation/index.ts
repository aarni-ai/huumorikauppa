import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "info@huumorikauppa.fi";

interface RequestBody {
  sessionId?: string;
  orderId?: string;
  // If true, also resend admin notification (default false — customer-only)
  resendAdmin?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = (await req.json()) as RequestBody;
    if (!body.sessionId && !body.orderId) {
      return new Response(
        JSON.stringify({ error: "Provide sessionId or orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Find order
    const query = supabase.from("orders").select("*").maybeSingle();
    const { data: order, error: orderErr } = body.orderId
      ? await supabase.from("orders").select("*").eq("id", body.orderId).maybeSingle()
      : await supabase.from("orders").select("*").eq("stripe_session_id", body.sessionId!).maybeSingle();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!order.customer_email) {
      return new Response(
        JSON.stringify({ error: "Order has no customer email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const total = Number(order.total).toFixed(2);
    // Use unique idempotency key per resend so it actually goes out
    const resendKey = crypto.randomUUID().slice(0, 8);

    // Customer email
    const customerRes = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "order-confirmation",
        recipientEmail: order.customer_email,
        idempotencyKey: `order-confirm-resend-${order.id}-${resendKey}`,
        templateData: {
          customerName: order.customer_name || undefined,
          orderTotal: total,
          items,
        },
      },
    });

    await supabase.from("email_logs").insert({
      order_id: order.id,
      to_email: order.customer_email,
      subject: "Tilausvahvistus (uudelleenlähetys)",
      status: customerRes.error ? "failed" : "success",
      error_message: customerRes.error?.message,
      email_type: "customer",
    });

    let adminResult: { sent: boolean; error?: string } = { sent: false };
    if (body.resendAdmin) {
      const adminRes = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "new-order-admin",
          recipientEmail: ADMIN_EMAIL,
          idempotencyKey: `order-admin-resend-${order.id}-${resendKey}`,
          templateData: {
            customerName: order.customer_name || undefined,
            customerEmail: order.customer_email,
            orderTotal: total,
            orderId: order.id,
            stripeSessionId: order.stripe_session_id,
            shippingAddress: order.shipping_address || undefined,
            items,
          },
        },
      });
      adminResult = { sent: !adminRes.error, error: adminRes.error?.message };
      await supabase.from("email_logs").insert({
        order_id: order.id,
        to_email: ADMIN_EMAIL,
        subject: "Admin: uusi tilaus (uudelleenlähetys)",
        status: adminRes.error ? "failed" : "success",
        error_message: adminRes.error?.message,
        email_type: "admin",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        customerEmailSent: !customerRes.error,
        customerEmailError: customerRes.error?.message,
        adminEmailSent: adminResult.sent,
        adminEmailError: adminResult.error,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("resend-order-confirmation error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
