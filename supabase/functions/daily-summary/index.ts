// Daily summary email: sent every morning (scheduled 07:00 Finnish time = 05:00 UTC).
// Recipient: info@seniorituki.fi
// Subject: "Huumorikauppa paivan tila [pvm]"
// Content:
//   - Yesterday's orders and revenue
//   - Stuck orders (>5 days in printify_status pending/failed)
//   - Failed Printify transfers
//   - Health check result (most recent site-health-check run)
//   - Orders >10 days without shipping

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUMMARY_RECIPIENT = "info@seniorituki.fi";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "huumorikauppa@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Yesterday UTC window
  const yesterdayStart = new Date(now);
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
  yesterdayStart.setUTCHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(now);
  yesterdayEnd.setUTCHours(0, 0, 0, 0);

  const stuckCutoff = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const longWaitCutoff = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Yesterday's orders
    const { data: yesterdayOrders } = await supabase
      .from("orders")
      .select("id, customer_email, items, status, created_at")
      .eq("status", "paid")
      .gte("created_at", yesterdayStart.toISOString())
      .lt("created_at", yesterdayEnd.toISOString());

    const orderCount = (yesterdayOrders || []).length;
    const totalRevenue = (yesterdayOrders || []).reduce((sum: number, o: any) => {
      const items: any[] = Array.isArray(o.items) ? o.items : [];
      return sum + items.reduce((s: number, i: any) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
    }, 0);

    // 2. Stuck orders
    const { data: stuckOrders } = await supabase
      .from("orders")
      .select("id, customer_email, created_at, printify_status, printify_error")
      .in("printify_status", ["pending", "failed"])
      .lt("created_at", stuckCutoff);

    // 3. Orders >10 days without shipment
    const { data: longWaitOrders } = await supabase
      .from("orders")
      .select("id, customer_email, created_at, printify_status")
      .eq("status", "paid")
      .eq("shipping_notification_sent", false)
      .lt("created_at", longWaitCutoff);

    // Build plain-text body
    const lines: string[] = [
      `HUUMORIKAUPPA PAIVAN TILA ${todayStr}`,
      `===`,
      ``,
      `Eilisen tilaukset (${yesterdayStart.toISOString().split("T")[0]}):`,
      `  Tilauksia: ${orderCount}`,
      `  Arvioitu myynti: ${totalRevenue.toFixed(2)} EUR (ilman toimitusta, ennen ALV)`,
      ``,
    ];

    if ((stuckOrders || []).length > 0) {
      lines.push(`Jumissa Printifyssa (yli 5 pv, ${(stuckOrders || []).length} kpl):`);
      for (const o of (stuckOrders as any[] || [])) {
        lines.push(`  - Tilaus ${o.id.slice(0, 8)} | ${o.customer_email} | status: ${o.printify_status} | luotu: ${o.created_at?.split("T")[0]}`);
      }
      lines.push(``);
    } else {
      lines.push(`Printify-jumissa: ei yhtaan.`);
      lines.push(``);
    }

    if ((longWaitOrders || []).length > 0) {
      lines.push(`Odottaa lahetystietoja yli 10 pv (${(longWaitOrders || []).length} kpl):`);
      for (const o of (longWaitOrders as any[] || [])) {
        lines.push(`  - Tilaus ${o.id.slice(0, 8)} | ${o.customer_email} | luotu: ${o.created_at?.split("T")[0]}`);
      }
      lines.push(``);
    } else {
      lines.push(`Yli 10 pv odottavia: ei yhtaan.`);
      lines.push(``);
    }

    lines.push(`Sivustoterveys: tarkista site-health-check-lokit Supabasesta.`);
    lines.push(``);
    lines.push(`Terveisin, Huumorikauppa-jarjestelma`);

    const bodyText = lines.join("\n");

    // Send via send-transactional-email (admin-alert template)
    const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify({
        templateName: "admin-alert",
        recipientEmail: SUMMARY_RECIPIENT,
        idempotencyKey: `daily-summary-${todayStr}`,
        templateData: {
          subject: `Huumorikauppa paivan tila ${todayStr}`,
          body: `Tilauksia eilen: ${orderCount} | Myynti: ~${totalRevenue.toFixed(2)} EUR | Jumissa: ${(stuckOrders || []).length} | Odottaa lahetystietoja >10pv: ${(longWaitOrders || []).length}`,
          details: bodyText,
        },
      }),
    });

    const result = await res.json().catch(() => ({}));
    console.log("daily-summary sent:", res.status, JSON.stringify(result));

    return new Response(
      JSON.stringify({ ok: res.ok, orderCount, stuckCount: (stuckOrders || []).length, longWaitCount: (longWaitOrders || []).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("daily-summary error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
