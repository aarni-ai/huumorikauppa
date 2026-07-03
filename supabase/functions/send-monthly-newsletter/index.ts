import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

async function sendOne(
  supabase: SupabaseClient,
  email: string,
  monthKey: string,
  products: Array<{ name: string; price: number; url: string; image?: string }>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "monthly-newsletter",
        recipientEmail: email,
        idempotencyKey: `monthly-newsletter-${monthKey}-${email}`,
        templateData: { products },
      },
    });
    if (error) return { ok: false, error: error.message || "unknown" };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
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
    // Build a candidate pool (featured first, then newest) and pick 3 DISTINCT
    // designs. Products share a design across types (e.g. "X | T-Paita", "X | Huppari",
    // "X | Muki"), so we dedupe by the joke/design — not the product type — and prefer
    // different categories/themes for variety.
    type Row = { name: string; slug: string; price: number; images: string[]; category: string };
    const { data: featured } = await supabase
      .from("products")
      .select("name, slug, price, images, category")
      .eq("is_featured", true)
      .limit(20);
    const { data: newest } = await supabase
      .from("products")
      .select("name, slug, price, images, category")
      .order("created_at", { ascending: false })
      .limit(30);
    const pool: Row[] = [...((featured as Row[]) || []), ...((newest as Row[]) || [])];

    const designKey = (name: string) => String(name).split(" | ")[0].trim().toLowerCase();
    const picked: Row[] = [];
    const seenDesign = new Set<string>();
    const seenCategory = new Set<string>();
    // Pass 1: distinct design AND distinct category → maximum theme variety.
    for (const p of pool) {
      if (picked.length >= 3) break;
      const dk = designKey(p.name);
      if (seenDesign.has(dk) || seenCategory.has(p.category)) continue;
      picked.push(p);
      seenDesign.add(dk);
      seenCategory.add(p.category);
    }
    // Pass 2: fill any remaining slots with still-distinct designs.
    if (picked.length < 3) {
      for (const p of pool) {
        if (picked.length >= 3) break;
        const dk = designKey(p.name);
        if (seenDesign.has(dk)) continue;
        picked.push(p);
        seenDesign.add(dk);
      }
    }

    const products = picked.slice(0, 3).map((p) => ({
      name: p.name,
      price: Number(p.price),
      url: `https://huumorikauppa.fi/tuote/${p.slug}`,
      image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : undefined,
    }));

    // Fetch all active subscribers
    const { data: subs, error: subsErr } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", true);

    if (subsErr) throw subsErr;

    const emails: string[] = (subs || [])
      .map((s: { email: string }) => s.email)
      .filter((e: string) => !!e);

    // Filter out suppressed emails
    const { data: suppressed } = await supabase
      .from("suppressed_emails")
      .select("email");
    const suppressedSet = new Set(
      (suppressed || []).map((s: { email: string }) => s.email.toLowerCase()),
    );
    const recipients = emails.filter((e) => !suppressedSet.has(e.toLowerCase()));

    const now = new Date();
    const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send sequentially with small delay to avoid rate limits
    for (const email of recipients) {
      const res = await sendOne(supabase, email, monthKey, products);
      if (res.ok) sent++;
      else {
        failed++;
        if (errors.length < 10) errors.push(`${email}: ${res.error}`);
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    console.log(`Monthly newsletter ${monthKey}: sent=${sent} failed=${failed} total=${recipients.length}`);

    return new Response(
      JSON.stringify({ success: true, monthKey, total: recipients.length, sent, failed, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("send-monthly-newsletter failed:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});