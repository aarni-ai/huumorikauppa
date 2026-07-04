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
    // Pick 3 products for "Kuukauden suosikit". Priority:
    //   1) Novelty — products created this month or flagged is_new (newest first).
    //   2) If no new products this month → this month's best-sellers (from orders.items).
    //   3) Fallback → featured, then newest overall (so it's never empty).
    // Products share a design across types ("X | T-Paita" / "| Huppari" / "| Muki"),
    // so we dedupe by the joke/design — not the product type — and prefer distinct
    // categories/themes for variety.
    type Row = { name: string; slug: string; price: number; images: string[]; category: string };
    const SELECT = "name, slug, price, images, category";
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const designKey = (name: string) => String(name).split(" | ")[0].trim().toLowerCase();
    const dedupeBySlug = (rows: Row[]): Row[] => {
      const seen = new Set<string>(); const out: Row[] = [];
      for (const r of rows) { if (r?.slug && !seen.has(r.slug)) { seen.add(r.slug); out.push(r); } }
      return out;
    };

    // 1) Novelty products (created this month or is_new), newest first.
    const { data: createdThisMonth } = await supabase.from("products").select(SELECT)
      .gte("created_at", monthStart).order("created_at", { ascending: false }).limit(40);
    const { data: flaggedNew } = await supabase.from("products").select(SELECT)
      .eq("is_new", true).order("created_at", { ascending: false }).limit(40);
    let pool: Row[] = dedupeBySlug([...((createdThisMonth as Row[]) || []), ...((flaggedNew as Row[]) || [])]);
    let source = pool.length ? "new" : "none";

    // 2) No new products this month → this month's best-sellers.
    if (pool.length === 0) {
      try {
        const { data: monthOrders } = await supabase.from("orders")
          .select("items, payment_status").gte("created_at", monthStart);
        const qtyByName = new Map<string, number>();
        for (const o of ((monthOrders as Array<{ items: unknown; payment_status?: string }>) || [])) {
          const status = String(o?.payment_status || "").toLowerCase();
          if (["cancelled", "peruttu", "failed", "refunded"].includes(status)) continue;
          const items = Array.isArray(o?.items) ? o.items as Array<{ name?: string; quantity?: number }> : [];
          for (const it of items) {
            if (!it?.name) continue;
            qtyByName.set(it.name, (qtyByName.get(it.name) || 0) + (Number(it.quantity) || 1));
          }
        }
        const topNames = [...qtyByName.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n).slice(0, 30);
        if (topNames.length) {
          const { data: bsRows } = await supabase.from("products").select(SELECT).in("name", topNames);
          const byName = new Map<string, Row>(((bsRows as Row[]) || []).map((r) => [r.name, r]));
          pool = topNames.map((n) => byName.get(n)).filter(Boolean) as Row[];
          if (pool.length) source = "bestsellers";
        }
      } catch (e) {
        console.error("best-sellers lookup failed:", e instanceof Error ? e.message : String(e));
      }
    }

    // 3) Fallback → featured, then newest overall.
    if (pool.length === 0) {
      const { data: featured } = await supabase.from("products").select(SELECT).eq("is_featured", true).limit(20);
      const { data: newest } = await supabase.from("products").select(SELECT).order("created_at", { ascending: false }).limit(20);
      pool = dedupeBySlug([...((featured as Row[]) || []), ...((newest as Row[]) || [])]);
      if (pool.length) source = "fallback";
    }

    // Pick up to 3 distinct designs, preferring distinct categories/themes.
    const picked: Row[] = [];
    const seenDesign = new Set<string>();
    const seenCategory = new Set<string>();
    const addFrom = (rows: Row[], distinctCat: boolean) => {
      for (const p of rows) {
        if (picked.length >= 3) break;
        const dk = designKey(p.name);
        if (seenDesign.has(dk)) continue;
        if (distinctCat && seenCategory.has(p.category)) continue;
        picked.push(p); seenDesign.add(dk); seenCategory.add(p.category);
      }
    };
    addFrom(pool, true);
    addFrom(pool, false);
    if (picked.length < 3) {
      const { data: newestAll } = await supabase.from("products").select(SELECT).order("created_at", { ascending: false }).limit(40);
      addFrom((newestAll as Row[]) || [], false);
    }

    // SAFETY: never send an empty / broken newsletter.
    if (picked.length === 0) {
      console.error("send-monthly-newsletter: no products available — send aborted.");
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: "no_products" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }
    console.log(`Newsletter products: source=${source}, picked=${picked.length}`);

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