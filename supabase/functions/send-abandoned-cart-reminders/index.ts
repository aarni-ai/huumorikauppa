import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Stage = "1h" | "24h" | "72h";

const STAGES: { key: Stage; col: string; template: string; minAgeMs: number; maxAgeMs: number }[] = [
  { key: "1h",  col: "reminder_1h_sent_at",  template: "abandoned-cart-1h",  minAgeMs: 60 * 60 * 1000,         maxAgeMs: 24 * 60 * 60 * 1000 },
  { key: "24h", col: "reminder_24h_sent_at", template: "abandoned-cart-24h", minAgeMs: 24 * 60 * 60 * 1000,    maxAgeMs: 72 * 60 * 60 * 1000 },
  { key: "72h", col: "reminder_72h_sent_at", template: "abandoned-cart-72h", minAgeMs: 72 * 60 * 60 * 1000,    maxAgeMs: 7 * 24 * 60 * 60 * 1000 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = Date.now();
  const results: Record<string, number> = { sent: 0, skipped: 0, errors: 0 };

  for (const stage of STAGES) {
    const maxCreated = new Date(now - stage.minAgeMs).toISOString();
    const minCreated = new Date(now - stage.maxAgeMs).toISOString();

    const { data: rows, error } = await supabase
      .from("abandoned_carts")
      .select("id, email, cart_items, cart_total, recovery_token, created_at")
      .eq("status", "avoin")
      .is("unsubscribed_at", null)
      .is(stage.col, null)
      .lte("created_at", maxCreated)
      .gte("created_at", minCreated)
      .limit(50);

    if (error) {
      console.error(`fetch ${stage.key} failed:`, error.message);
      continue;
    }
    if (!rows || rows.length === 0) continue;

    for (const row of rows) {
      try {
        const email = String(row.email).toLowerCase();

        // Skip if suppressed
        const { data: supp } = await supabase
          .from("suppressed_emails").select("id").eq("email", email).maybeSingle();
        if (supp) {
          await supabase.from("abandoned_carts")
            .update({ unsubscribed_at: new Date().toISOString() })
            .eq("id", row.id);
          results.skipped++;
          continue;
        }

        // Skip if same email has a paid order in last 24h
        const since = new Date(now - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentOrder } = await supabase
          .from("orders")
          .select("id")
          .ilike("customer_email", email)
          .eq("status", "paid")
          .gte("created_at", since)
          .limit(1)
          .maybeSingle();
        if (recentOrder) {
          await supabase.from("abandoned_carts")
            .update({ status: "ostettu" })
            .eq("id", row.id);
          results.skipped++;
          continue;
        }

        // Build template payload
        const items = Array.isArray(row.cart_items) ? row.cart_items : [];
        const restoreUrl = `https://huumorikauppa.fi/palauta-kori?token=${row.recovery_token}`;
        const templateData: Record<string, unknown> = {
          items: items.map((i: any) => ({
            name: i?.product?.name || i?.name || "Tuote",
            quantity: Number(i?.quantity || 1),
            price: Number(i?.product?.price ?? i?.price ?? 0),
            image: i?.product?.images?.[0] || i?.image || null,
          })),
          cartTotal: Number(row.cart_total).toFixed(2),
          restoreUrl,
        };
        if (stage.key === "72h") templateData.discountCode = "PALAA10";

        // Invoke shared sender (queues via Mailgun infrastructure)
        const sendRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              templateName: stage.template,
              recipientEmail: email,
              idempotencyKey: `abandoned-${row.id}-${stage.key}`,
              templateData,
            }),
          },
        );

        if (!sendRes.ok) {
          const txt = await sendRes.text();
          console.error(`send ${stage.key} failed for ${row.id}:`, txt);
          results.errors++;
          continue;
        }

        await supabase.from("abandoned_carts")
          .update({ [stage.col]: new Date().toISOString() })
          .eq("id", row.id);
        results.sent++;
      } catch (e) {
        console.error(`row ${row.id} failed:`, e);
        results.errors++;
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, ...results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});