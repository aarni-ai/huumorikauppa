// Daily cron: alert admin about paid orders that (a) never reached Printify
// (pending/failed/skipped for >5 days) or (b) are in Printify but unshipped >10 days.
// Triggered by pg_cron — no auth check needed (internal only via service_role).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "huumorikauppa@gmail.com";
const STUCK_DAYS = 5;
const UNSHIPPED_DAYS = 10;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendAdminAlert(
  supabase: any,
  subject: string,
  body: string,
  details?: string,
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify({
        templateName: "admin-alert",
        recipientEmail: ADMIN_EMAIL,
        idempotencyKey: `admin-alert-${subject.slice(0, 40)}-${Date.now()}`,
        templateData: { subject, body, details },
      }),
    });
  } catch (e) {
    console.error("sendAdminAlert failed:", e);
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

  try {
    const cutoff = new Date(Date.now() - STUCK_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // (a) Paid orders that never reached Printify: pending / failed / skipped.
    //     "skipped" = submit never attempted (no printify_items or no address), which
    //     is exactly the case that used to fall through every check.
    const { data: stuck, error } = await supabase
      .from("orders")
      .select("id, created_at, printify_status, printify_error, customer_email, stripe_session_id")
      .eq("status", "paid")
      .in("printify_status", ["pending", "failed", "skipped"])
      .lt("created_at", cutoff);

    if (error) throw error;

    // (b) Submitted to Printify but no shipment recorded after UNSHIPPED_DAYS.
    const unshippedCutoff = new Date(Date.now() - UNSHIPPED_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: unshipped, error: unshippedError } = await supabase
      .from("orders")
      .select("id, created_at, printify_status, printify_order_id, customer_email")
      .eq("status", "paid")
      .eq("printify_status", "submitted")
      .is("shipped_at", null)
      .lt("created_at", unshippedCutoff);

    if (unshippedError) throw unshippedError;

    const count = (stuck || []).length;
    const unshippedCount = (unshipped || []).length;
    console.log(
      `check-stuck-orders: ${count} not in Printify (cutoff ${cutoff}), ${unshippedCount} unshipped >${UNSHIPPED_DAYS}d`,
    );

    if (count > 0 || unshippedCount > 0) {
      const lines: string[] = [];
      if (count > 0) {
        lines.push(`EI PRINTIFYSSA (yli ${STUCK_DAYS} pv):`);
        for (const o of stuck as any[]) {
          lines.push(
            `- order ${o.id} | created: ${o.created_at} | status: ${o.printify_status} | error: ${o.printify_error || "none"} | customer: ${o.customer_email}`,
          );
        }
      }
      if (unshippedCount > 0) {
        if (lines.length) lines.push("");
        lines.push(`PRINTIFYSSA MUTTA EI LAHETETTY (yli ${UNSHIPPED_DAYS} pv):`);
        for (const o of unshipped as any[]) {
          lines.push(
            `- order ${o.id} | created: ${o.created_at} | printify: ${o.printify_order_id || "?"} | customer: ${o.customer_email}`,
          );
        }
      }
      await sendAdminAlert(
        supabase,
        `HUUMORIKAUPPA: ${count + unshippedCount} tilausta jumissa (${count} ei Printifyssa, ${unshippedCount} ei lahetetty)`,
        `Tilaukset tilassa pending/failed/skipped yli ${STUCK_DAYS} paivaa, tai Printifyssa ilman lahetysta yli ${UNSHIPPED_DAYS} paivaa. Tarkista Supabase-adminissa ja Printifyssa; recover-orders yrittaa pending/failed/skipped-tilauksia uudelleen tunneittain.`,
        lines.join("\n"),
      );
    }

    return new Response(JSON.stringify({ ok: true, stuck_count: count, unshipped_count: unshippedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("check-stuck-orders error:", msg);
    await sendAdminAlert(
      supabase,
      "HUUMORIKAUPPA: check-stuck-orders kaatui",
      `Virhe stuck-order-tarkistuksessa: ${msg}`,
    );
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
