// Cron function: checks Printify for shipped orders and sends shipping
// notifications to customers. Runs hourly alongside recover-orders.
//
// Logic:
//   1. Find orders with printify_status='submitted', shipping_notification_sent=false
//   2. For each, call Printify API to get shipment info
//   3. If shipped (has tracking), save tracking and send email

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const PRINTIFY_API = "https://api.printify.com/v1";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "huumorikauppa@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendShippingEmail(
  supabaseUrl: string,
  serviceKey: string,
  params: {
    recipientEmail: string;
    orderId: string;
    customerName?: string;
    carrier?: string;
    trackingCode?: string;
    trackingUrl?: string;
  },
) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify({
        templateName: "order-shipped",
        recipientEmail: params.recipientEmail,
        idempotencyKey: `order-shipped-${params.orderId}`,
        templateData: {
          customerName: params.customerName,
          orderId: params.orderId,
          carrier: params.carrier,
          trackingCode: params.trackingCode,
          trackingUrl: params.trackingUrl,
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`sendShippingEmail failed ${res.status}: ${body}`);
    }
  } catch (e) {
    console.error("sendShippingEmail threw:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const printifyToken = Deno.env.get("PRINTIFY_API_KEY");
  const shopId = Deno.env.get("PRINTIFY_SHOP_ID");

  if (!printifyToken || !shopId) {
    return new Response(JSON.stringify({ ok: false, error: "Printify credentials missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const summary = { checked: 0, shipped: 0, notified: 0, errors: [] as string[] };

  try {
    // Find orders that were submitted to Printify but not yet notified
    const { data: orders, error: dbErr } = await supabase
      .from("orders")
      .select("id, customer_email, customer_name, printify_order_id")
      .eq("printify_status", "submitted")
      .eq("shipping_notification_sent", false)
      .not("printify_order_id", "is", null)
      .limit(50);

    if (dbErr) throw dbErr;

    for (const order of orders || []) {
      summary.checked++;
      try {
        // Fetch order from Printify
        const res = await fetch(
          `${PRINTIFY_API}/shops/${shopId}/orders/${order.printify_order_id}.json`,
          {
            headers: {
              Authorization: `Bearer ${printifyToken}`,
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(10000),
          },
        );

        if (!res.ok) {
          summary.errors.push(`order ${order.id}: Printify fetch ${res.status}`);
          continue;
        }

        const data = await res.json() as any;

        // Check if order has shipment info
        const shipments: any[] = data.shipments || [];
        if (shipments.length === 0) continue;

        const shipment = shipments[0];
        const trackingNumber = shipment.tracking_number || null;
        const carrier = shipment.carrier || null;

        // Build tracking URL based on carrier
        let trackingUrl: string | null = null;
        if (trackingNumber) {
          const c = (carrier || "").toLowerCase();
          if (c.includes("posti") || c.includes("fi") || c.includes("post")) {
            trackingUrl = `https://www.posti.fi/fi/seuranta#/lahetys/${trackingNumber}`;
          } else if (c.includes("dhl")) {
            trackingUrl = `https://www.dhl.com/fi-fi/home/seuranta/seuranta-express.html?AWB=${trackingNumber}`;
          } else if (c.includes("ups")) {
            trackingUrl = `https://www.ups.com/track?tracknum=${trackingNumber}`;
          } else {
            trackingUrl = null;
          }
        }

        summary.shipped++;

        // Save tracking info to DB
        await supabase.from("orders").update({
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          carrier,
          shipped_at: shipment.shipped_at || new Date().toISOString(),
          shipping_notification_sent: true,
        }).eq("id", order.id);

        // Send shipping email if we have customer email
        if (order.customer_email) {
          await sendShippingEmail(supabaseUrl, serviceKey, {
            recipientEmail: order.customer_email,
            orderId: order.id,
            customerName: order.customer_name || undefined,
            carrier: carrier || undefined,
            trackingCode: trackingNumber || undefined,
            trackingUrl: trackingUrl || undefined,
          });
          summary.notified++;
        }
      } catch (orderErr: any) {
        console.error(`Error processing order ${order.id}:`, orderErr);
        summary.errors.push(`order ${order.id}: ${orderErr?.message || String(orderErr)}`);
      }
    }

    console.log("check-printify-shipments:", JSON.stringify(summary));

    return new Response(JSON.stringify({ ok: true, ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("check-printify-shipments fatal:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
