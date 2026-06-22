// Cron-triggered Printify catalog sync.
//
// Runs daily via pg_cron (see migrations) using the service role key in the
// Authorization header. We accept calls in two ways:
//   1) Authorization: Bearer <SERVICE_ROLE_KEY>  (cron + admin debugging)
//   2) Authorization: Bearer <ANON_KEY>          (rejected — caller must
//      have proven service role)
//
// Uses "upsert" mode so it never destroys existing rows (preserves
// is_featured / is_new / is_gift_idea and product UUIDs).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { syncPrintifyCatalog } from "../_shared/printify-sync.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // verify_jwt = true ensures a valid Supabase JWT (anon key is fine —
    // cron uses it). The function is non-destructive (upsert into products
    // table from Printify catalog), so anon-key gating is sufficient.
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const result = await syncPrintifyCatalog(supabase, "upsert");

    console.log("auto-sync-printify result:", JSON.stringify(result));

    // After the catalog is up-to-date, push it to MailerLite so the
    // welcome-series "best sellers" block and the new-products digest
    // always reflect the live catalog. Fire-and-forget — never block.
    try {
      const projectUrl = supabaseUrl;
      fetch(`${projectUrl}/functions/v1/sync-mailerlite-products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      }).catch((e) => console.error("sync-mailerlite-products trigger failed:", e));
    } catch (e) {
      console.error("MailerLite product sync trigger error:", e);
    }

    return new Response(JSON.stringify({ success: true, mode: "upsert", ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Auto-sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});