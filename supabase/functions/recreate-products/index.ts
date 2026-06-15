import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Minimal RFC4180 CSV parser — handles quoted fields, embedded commas,
// newlines inside quotes, and "" escapes. Returns string[][] (header + rows).
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  // Strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  // Flush last field/row if file does not end with newline
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v && v.length > 0));
}

type ProductPatch = {
  name?: string;
  description?: string;
  sizes: Set<string>;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // --- Auth: require admin ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } =
    await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) {
    return json({ error: "Unauthorized" }, 401);
  }
  const userId = claimsData.claims.sub as string;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: roleRow, error: roleErr } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (roleErr || !roleRow) {
    return json({ error: "Admin role required" }, 403);
  }

  // --- Parse body ---
  let body: { csv?: string; dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.csv || typeof body.csv !== "string") {
    return json({ error: "Missing 'csv' (string) in body" }, 400);
  }
  const dryRun = !!body.dryRun;

  const rows = parseCSV(body.csv);
  if (rows.length < 2) {
    return json({ error: "CSV has no data rows" }, 400);
  }

  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) =>
    header.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  const iHandle = idx("Handle");
  const iTitle = idx("Title");
  const iBody = idx("Body (HTML)");
  const iOpt1 = idx("Option1 Value");
  const iOpt2 = idx("Option2 Value");
  const iOpt3 = idx("Option3 Value");
  const iSeoTitle = idx("SEO Title");
  const iSeoDesc = idx("SEO Description");

  if (iHandle === -1) {
    return json({ error: "CSV is missing required 'Handle' column" }, 400);
  }

  // --- Aggregate rows per Handle ---
  const patches = new Map<string, ProductPatch>();
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const handle = (cells[iHandle] || "").trim();
    if (!handle) continue;
    let p = patches.get(handle);
    if (!p) {
      p = { sizes: new Set<string>() };
      patches.set(handle, p);
    }
    // Title and Body usually appear on the first row of a Handle group only.
    if (iTitle !== -1) {
      const t = (cells[iTitle] || "").trim();
      if (t && !p.name) p.name = t;
    }
    if (iBody !== -1) {
      const b = cells[iBody] ?? "";
      if (b && !p.description) p.description = b;
    }
    for (const i of [iOpt1, iOpt2, iOpt3]) {
      if (i === -1) continue;
      const v = (cells[i] || "").trim();
      if (v && v.toLowerCase() !== "default title") p.sizes.add(v);
    }
  }

  // --- Apply updates ---
  const updated: string[] = [];
  const notFound: string[] = [];
  const errors: { handle: string; error: string }[] = [];
  const skippedSeo =
    iSeoTitle !== -1 || iSeoDesc !== -1
      ? "SEO Title / SEO Description ohitettiin: products-taulussa ei ole vastaavia sarakkeita."
      : null;

  for (const [handle, p] of patches) {
    try {
      const { data: existing, error: fetchErr } = await admin
        .from("products")
        .select("id, variants")
        .eq("slug", handle)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!existing) {
        notFound.push(handle);
        continue;
      }

      const patch: Record<string, unknown> = {};
      if (p.name) patch.name = p.name;
      if (p.description) patch.description = p.description;

      if (p.sizes.size > 0) {
        const currentVariants =
          (existing.variants as Record<string, unknown> | null) ?? {};
        patch.variants = {
          ...currentVariants,
          sizes: Array.from(p.sizes),
        };
      }

      if (Object.keys(patch).length === 0) continue;

      if (!dryRun) {
        const { error: updErr } = await admin
          .from("products")
          .update(patch)
          .eq("id", existing.id);
        if (updErr) throw updErr;
      }
      updated.push(handle);
    } catch (e) {
      errors.push({ handle, error: (e as Error).message });
    }
  }

  return json({
    ok: true,
    dryRun,
    totalHandles: patches.size,
    updated: updated.length,
    notFound: notFound.length,
    errors: errors.length,
    notFoundHandles: notFound.slice(0, 20),
    sampleErrors: errors.slice(0, 10),
    note: skippedSeo,
  });
});