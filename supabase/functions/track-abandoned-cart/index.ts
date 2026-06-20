import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const cartItems = body.cartItems;
    const cartTotal = Number(body.cartTotal);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: "empty cart" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check if user is suppressed/unsubscribed → don't track
    const { data: suppressed } = await supabase
      .from("suppressed_emails").select("id").eq("email", email).maybeSingle();
    if (suppressed) {
      return new Response(JSON.stringify({ ok: true, skipped: "suppressed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find existing open cart for this email
    const { data: existing } = await supabase
      .from("abandoned_carts")
      .select("id")
      .eq("email", email)
      .eq("status", "avoin")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase.from("abandoned_carts")
        .update({ cart_items: cartItems, cart_total: cartTotal })
        .eq("id", existing.id);
      return new Response(JSON.stringify({ ok: true, id: existing.id, updated: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inserted, error } = await supabase
      .from("abandoned_carts")
      .insert({ email, cart_items: cartItems, cart_total: cartTotal })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, id: inserted.id, created: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("track-abandoned-cart error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});