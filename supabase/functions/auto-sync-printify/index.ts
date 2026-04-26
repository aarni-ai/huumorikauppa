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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const authHeader = req.headers.get("Authorization") || "";
    const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!provided || provided !== serviceKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const result = await syncPrintifyCatalog(supabase, "upsert");

    console.log("auto-sync-printify result:", JSON.stringify(result));
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