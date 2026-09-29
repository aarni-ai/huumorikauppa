// Daily cron: verifies that the site's key pages respond with HTTP 200.
// Alerts admin via email if any page is down.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "huumorikauppa@gmail.com";
const SITE = "https://huumorikauppa.fi";

const PAGES = [
  { path: "/", label: "Etusivu" },
  { path: "/kategoria/mukit", label: "Kategoria: mukit" },
  { path: "/kassa", label: "Kassa" },
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function checkPage(path: string): Promise<{ ok: boolean; status: number; ms: number }> {
  const t0 = Date.now();
  try {
    const res = await fetch(SITE + path, {
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    return { ok: res.ok, status: res.status, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - t0 };
  }
}

async function sendAdminAlert(subject: string, body: string, details: string) {
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
        idempotencyKey: `health-alert-${Date.now()}`,
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

  const results: Array<{ label: string; path: string; ok: boolean; status: number; ms: number }> = [];

  for (const page of PAGES) {
    const r = await checkPage(page.path);
    results.push({ label: page.label, path: page.path, ...r });
    console.log(`health-check ${page.path}: ${r.status} ${r.ms}ms`);
  }

  const failures = results.filter((r) => !r.ok);

  if (failures.length > 0) {
    const lines = failures.map(
      (r) => `- ${r.label} (${SITE + r.path}): HTTP ${r.status || "timeout"} (${r.ms}ms)`,
    );
    await sendAdminAlert(
      `HUUMORIKAUPPA: ${failures.length} sivu ei vastaa!`,
      `Seuraavat sivut eivat vastanneet HTTP 200:lla paivittaisessa terveystarkistuksessa. Tarkista Vercel-hallintapaneeli.`,
      lines.join("\n"),
    );
  }

  return new Response(
    JSON.stringify({ ok: failures.length === 0, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
