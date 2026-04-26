// Admin-triggered Printify catalog sync.
// Logic itself lives in _shared/printify-sync.ts — this file is just an
// authenticated HTTP handler.

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 🔒 Admin-only: verify the caller is an authenticated admin.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await anonClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const adminCheckClient = createClient(supabaseUrl, supabaseKey);
    const { data: roleRow } = await adminCheckClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Body is optional; default to "replace" to preserve old admin behaviour.
    let mode: "replace" | "upsert" = "replace";
    try {
      const body = await req.json();
      if (body?.mode === "upsert" || body?.mode === "replace") mode = body.mode;
    } catch { /* no body or invalid JSON — default */ }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const result = await syncPrintifyCatalog(supabase, mode);

    return new Response(JSON.stringify({ success: true, mode, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
