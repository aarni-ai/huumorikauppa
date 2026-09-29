// Daily cron: find orders stuck in Printify >5 days and alert admin.
// Triggered by pg_cron — no auth check needed (internal only via service_role).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "huumorikauppa@gmail.com";
const STUCK_DAYS = 5;

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

    const { data: stuck, error } = await supabase
      .from("orders")
      .select("id, created_at, printify_status, printify_error, customer_email, stripe_session_id")
      .in("printify_status", ["pending", "failed"])
      .lt("created_at", cutoff);

    if (error) throw error;

    const count = (stuck || []).length;
    console.log(`check-stuck-orders: ${count} stuck orders found (cutoff: ${cutoff})`);

    if (count > 0) {
      const lines = (stuck as any[]).map(
        (o) =>
          `- order ${o.id} | created: ${o.created_at} | status: ${o.printify_status} | error: ${o.printify_error || "none"} | customer: ${o.customer_email}`,
      );
      await sendAdminAlert(
        supabase,
        `HUUMORIKAUPPA: ${count} tilausta jumissa Printifyssä (yli ${STUCK_DAYS} pv)`,
        `Seuraavat tilaukset ovat olleet tilassa 'pending' tai 'failed' yli ${STUCK_DAYS} paivaa. Tarkista tilaukset Supabase-adminissa ja laheta ne Printifyyn kasityona tai aja recover-orders.`,
        lines.join("\n"),
      );
    }

    return new Response(JSON.stringify({ ok: true, stuck_count: count }), {
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
