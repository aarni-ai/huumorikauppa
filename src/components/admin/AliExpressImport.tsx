import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import {
  parseCSV, evaluateRow, parseVariants, slugify, VALID_CATEGORIES, type RowResult,
} from "@/lib/aliexpressImport";

type ProductCategory = Database["public"]["Enums"]["product_category"];

interface ImportResult extends RowResult {
  createdId?: string;
  published?: boolean;
}

async function uploadImage(file: File, slug: string, idx: number): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `aliexpress/${slug}/${Date.now()}-${idx}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    upsert: false, contentType: file.type || "image/jpeg",
  });
  if (error) throw new Error(`kuvan lataus epäonnistui (${file.name}): ${error.message}`);
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export function AliExpressImport() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<ImportResult[]>([]);

  const runImport = async () => {
    if (!csvFile) return;
    setRunning(true); setResults([]); setProgress("Luetaan CSV…");
    try {
      const rows = parseCSV(await csvFile.text());
      const fileByName = new Map(imageFiles.map((f) => [f.name, f]));
      const uploaded = new Set(imageFiles.map((f) => f.name));
      const out: ImportResult[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const line = i + 2; // +1 header, +1 to 1-index
        setProgress(`Rivi ${i + 1}/${rows.length}…`);
        const evalResult = evaluateRow(row, line, uploaded);
        if (evalResult.status === "error") { out.push(evalResult); continue; }

        try {
          // Upload images (referenced files already validated as present).
          const names = row.image_files.split(",").map((f) => f.trim()).filter(Boolean);
          const urls: string[] = [];
          let baseSlug = slugify(row.name);
          for (let k = 0; k < names.length; k++) {
            urls.push(await uploadImage(fileByName.get(names[k])!, baseSlug || `tuote-${line}`, k));
          }

          const payload = {
            name: row.name.trim(),
            slug: baseSlug || `tuote-${line}`,
            description: (row.description || "").trim(),
            category: row.category.trim().toLowerCase() as ProductCategory,
            price: evalResult.price!,
            images: urls,
            variants: parseVariants(row.variants || ""),
            supplier: "aliexpress",
            origin_country: (row.origin_country || "CN").trim() || "CN",
            aliexpress_url: row.aliexpress_url.trim(),
            is_active: false, // draft until approved
            stock: 50,
            humor_type: "yleinen" as Database["public"]["Enums"]["humor_type"],
          };

          let ins = await supabase.from("products").insert(payload).select("id").single();
          if (ins.error && ins.error.code === "23505") {
            // slug collision → retry once with a short suffix
            payload.slug = `${payload.slug}-${Math.random().toString(36).slice(2, 6)}`;
            ins = await supabase.from("products").insert(payload).select("id").single();
          }
          if (ins.error) {
            out.push({ ...evalResult, status: "error", messages: [...evalResult.messages, `tallennus epäonnistui: ${ins.error.message}`] });
          } else {
            out.push({ ...evalResult, createdId: ins.data.id, published: false });
          }
        } catch (e) {
          out.push({ ...evalResult, status: "error", messages: [...evalResult.messages, e instanceof Error ? e.message : String(e)] });
        }
      }
      setResults(out);
      setProgress("");
    } catch (e) {
      setProgress(`Import epäonnistui: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  const togglePublish = async (idx: number) => {
    const r = results[idx];
    if (!r.createdId) return;
    const next = !r.published;
    const { error } = await supabase.from("products").update({ is_active: next }).eq("id", r.createdId);
    if (!error) setResults((rs) => rs.map((x, i) => (i === idx ? { ...x, published: next } : x)));
  };

  const ok = results.filter((r) => r.status === "ok").length;
  const warn = results.filter((r) => r.status === "warning").length;
  const err = results.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-foreground">AliExpress CSV-import</h3>
        <p className="text-sm text-muted-foreground">
          Tuotteet luodaan <strong>draftina</strong> (piilossa kaupasta). Kelvottomat rivit ohitetaan
          eivätkä kaada muiden tuontia. Sallitut kategoriat: {VALID_CATEGORIES.join(", ")}.
        </p>
        <div className="space-y-2 text-sm">
          <label className="block">
            <span className="text-muted-foreground">CSV-tiedosto</span>
            <input type="file" accept=".csv,text/csv" className="block mt-1"
              onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} />
          </label>
          <label className="block">
            <span className="text-muted-foreground">Kuvatiedostot (monta)</span>
            <input type="file" accept="image/*" multiple className="block mt-1"
              onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))} />
          </label>
          <p className="text-xs text-muted-foreground">
            {csvFile ? `CSV: ${csvFile.name}` : "Ei CSV:tä"} · {imageFiles.length} kuvatiedostoa
          </p>
        </div>
        <Button onClick={runImport} disabled={running || !csvFile}>
          {running ? (progress || "Tuodaan…") : "Aja import"}
        </Button>
        {progress && !running && <p className="text-sm text-destructive">{progress}</p>}
      </div>

      {results.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-3">
            Yhteensä {results.length} riviä — <span className="text-green-600">{ok} ok</span>,{" "}
            <span className="text-amber-600">{warn} varoitus</span>,{" "}
            <span className="text-destructive">{err} virhe</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Rivi</th><th className="py-2 pr-3">Tuote</th>
                  <th className="py-2 pr-3">Tila</th><th className="py-2 pr-3">Hinta</th>
                  <th className="py-2 pr-3">Viestit</th><th className="py-2">Julkaisu</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-3 text-muted-foreground">{r.line}</td>
                    <td className="py-2 pr-3 font-medium text-foreground">{r.name}</td>
                    <td className="py-2 pr-3">
                      <span className={r.status === "error" ? "text-destructive" : r.status === "warning" ? "text-amber-600" : "text-green-600"}>
                        {r.status === "error" ? "virhe" : r.createdId ? "luotu (draft)" : r.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{r.price != null ? `${r.price.toFixed(2)} €` : "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.messages.join("; ") || "—"}</td>
                    <td className="py-2">
                      {r.createdId ? (
                        <Button size="sm" variant={r.published ? "default" : "outline"} onClick={() => togglePublish(idx)}>
                          {r.published ? "Näkyvissä ✓" : "Julkaise"}
                        </Button>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
