import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import {
  parseCSV, evaluateRow, parseVariants, slugify, buildFileMap,
  VALID_CATEGORIES, type RowResult, type ImageMatch,
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
    upsert: false,
    // Use the browser-reported MIME type so webp/avif are stored with the correct Content-Type
    contentType: file.type || "image/jpeg",
  });
  if (error) throw new Error(`kuvan lataus epäonnistui (${file.name}): ${error.message}`);
  return path;
}
const publicUrl = (path: string) => supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;

function StatusPill({ status, label }: { status: RowResult["status"]; label?: string }) {
  const cls = status === "error" ? "text-destructive" : status === "warning" ? "text-amber-600" : "text-green-600";
  return <span className={cls}>{label ?? status}</span>;
}

function ImageMatchCell({ matches }: { matches: ImageMatch[] }) {
  if (matches.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="space-y-0.5">
      {matches.map((m, i) => {
        const exact = m.resolved && m.resolved.toLowerCase() === m.csv.toLowerCase();
        const fuzzy = m.resolved && !exact;
        return (
          <div key={i} className="text-xs leading-snug">
            <span className="text-foreground">{m.csv}</span>
            {fuzzy && <span className="text-amber-600"> → {m.resolved}</span>}
            {exact && <span className="text-green-600"> ✓</span>}
            {!m.resolved && <span className="text-destructive"> ✗</span>}
          </div>
        );
      })}
    </div>
  );
}

export function AliExpressImport() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [preview, setPreview] = useState<RowResult[] | null>(null);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");

  // ---- Phase 1: dry-run preview (no writes) ----
  const runPreview = async () => {
    setResults(null); setProgress("");
    if (!csvFile) return;
    const parsed = parseCSV(await csvFile.text());
    const fileMap = buildFileMap(imageFiles);
    setRows(parsed);
    setPreview(parsed.map((row, i) => evaluateRow(row, i + 2, fileMap)));
  };

  const errorCount = preview?.filter((r) => r.status === "error").length ?? 0;
  const warnCount = preview?.filter((r) => r.status === "warning").length ?? 0;
  const okCount = preview?.filter((r) => r.status === "ok").length ?? 0;
  const canConfirm = !!preview && preview.length > 0 && errorCount === 0;

  // ---- Phase 2: confirm (uploads + inserts; only when preview is clean) ----
  const confirmImport = async () => {
    if (!canConfirm) return;
    setRunning(true); setProgress(""); const out: ImportResult[] = [];
    // Index files by their actual name for O(1) lookup after fuzzy resolution
    const fileByActualName = new Map(imageFiles.map((f) => [f.name, f]));
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const line = i + 2;
      const base = preview![i];
      setProgress(`Luodaan ${i + 1}/${rows.length}…`);
      const uploadedPaths: string[] = [];
      try {
        const baseSlug = slugify(row.name) || `tuote-${line}`;
        // Use resolved filenames from preview — already fuzzy-matched
        for (let k = 0; k < base.imageMatches.length; k++) {
          const { resolved } = base.imageMatches[k];
          if (!resolved) throw new Error(`kuva ei löydy: ${base.imageMatches[k].csv}`);
          const file = fileByActualName.get(resolved);
          if (!file) throw new Error(`tiedostoa ei löydy muistissa: ${resolved}`);
          uploadedPaths.push(await uploadImage(file, baseSlug, k));
        }
        const payload = {
          name: row.name.trim(),
          slug: baseSlug,
          description: (row.description || "").trim(),
          category: row.category.trim().toLowerCase() as ProductCategory,
          price: base.price!,
          images: uploadedPaths.map(publicUrl),
          variants: parseVariants(row.variants || ""),
          supplier: "aliexpress",
          origin_country: (row.origin_country || "CN").trim() || "CN",
          aliexpress_url: row.aliexpress_url.trim(),
          is_active: false,
          stock: 50,
          humor_type: "yleinen" as Database["public"]["Enums"]["humor_type"],
        };
        let ins = await (supabase.from("products") as any).insert(payload).select("id").single();
        if (ins.error && ins.error.code === "23505") {
          payload.slug = `${payload.slug}-${Math.random().toString(36).slice(2, 6)}`;
          ins = await (supabase.from("products") as any).insert(payload).select("id").single();
        }
        if (ins.error) {
          if (uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
          out.push({ ...base, status: "error", messages: [`tallennus epäonnistui: ${ins.error.message}`] });
        } else {
          out.push({ ...base, createdId: ins.data.id, published: false });
        }
      } catch (e) {
        if (uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
        out.push({ ...base, status: "error", messages: [e instanceof Error ? e.message : String(e)] });
      }
    }
    setResults(out); setPreview(null); setProgress(""); setRunning(false);
  };

  const togglePublish = async (idx: number) => {
    const r = results![idx];
    if (!r.createdId) return;
    const next = !r.published;
    const { error } = await (supabase.from("products") as any).update({ is_active: next }).eq("id", r.createdId);
    if (!error) setResults((rs) => rs!.map((x, i) => (i === idx ? { ...x, published: next } : x)));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-foreground">AliExpress CSV-import</h3>
        <p className="text-sm text-muted-foreground">
          <strong>Esikatsele</strong> ensin — mitään ei tallenneta eikä kuvia ladata ennen kuin painat{" "}
          <strong>Vahvista</strong>. Tuotteet luodaan draftina. Sallitut kategoriat: {VALID_CATEGORIES.join(", ")}.
        </p>
        <div className="space-y-2 text-sm">
          <label className="block">
            <span className="text-muted-foreground">CSV-tiedosto</span>
            <input type="file" accept=".csv,text/csv" className="block mt-1"
              onChange={(e) => { setCsvFile(e.target.files?.[0] ?? null); setPreview(null); setResults(null); }} />
          </label>
          <label className="block">
            <span className="text-muted-foreground">Kuvatiedostot (monta)</span>
            <input type="file" accept="image/*" multiple className="block mt-1"
              onChange={(e) => { setImageFiles(Array.from(e.target.files ?? [])); setPreview(null); setResults(null); }} />
            <p className="text-xs text-muted-foreground mt-1">
              Hyväksytyt muodot: jpg, png, webp, avif. Nimimätsäys on kirjainkoon/päätteen suhteen joustava
              — kissatarrat-1.webp mätsää kissatarrat-1.jpg CSV:ssä.
            </p>
          </label>
          <p className="text-xs text-muted-foreground">
            {csvFile ? `CSV: ${csvFile.name}` : "Ei CSV:tä"} · {imageFiles.length} kuvatiedostoa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runPreview} disabled={!csvFile || running}>Esikatsele</Button>
          <Button onClick={confirmImport} disabled={!canConfirm || running}>
            {running ? (progress || "Luodaan…") : `Vahvista ja luo ${preview ? okCount + warnCount : 0} tuotetta`}
          </Button>
        </div>
      </div>

      {/* Dry-run preview */}
      {preview && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-1">
            Esikatselu: {preview.length} riviä —{" "}
            <span className="text-green-600">{okCount} ok</span>,{" "}
            <span className="text-amber-600">{warnCount} varoitus</span>,{" "}
            <span className="text-destructive">{errorCount} virhe</span>
          </p>
          {errorCount > 0
            ? <p className="text-sm text-destructive mb-3">
                Korjaa {errorCount} virheellistä riviä CSV:ssä ja esikatsele uudelleen.
                Mitään ei luoda ennen kuin kaikki on virheetön.
              </p>
            : <p className="text-sm text-green-600 mb-3">Kaikki rivit kelpaavat — paina "Vahvista".</p>}
          <PreviewTable rows={preview} />
        </div>
      )}

      {/* Post-confirm results */}
      {results && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-3">
            Luotu {results.filter((r) => r.createdId).length}/{results.length} tuotetta (draft).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-3">Rivi</th><th className="py-2 pr-3">Tuote</th>
                <th className="py-2 pr-3">Tila</th><th className="py-2 pr-3">Hinta</th>
                <th className="py-2 pr-3">Viestit</th><th className="py-2">Julkaisu</th>
              </tr></thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-3 text-muted-foreground">{r.line}</td>
                    <td className="py-2 pr-3 font-medium text-foreground">{r.name}</td>
                    <td className="py-2 pr-3">
                      <StatusPill status={r.status}
                        label={r.status === "error" ? "virhe" : r.createdId ? "luotu (draft)" : r.status} />
                    </td>
                    <td className="py-2 pr-3">{r.price != null ? `${r.price.toFixed(2)} €` : "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.messages.join("; ") || "—"}</td>
                    <td className="py-2">
                      {r.createdId
                        ? <Button size="sm" variant={r.published ? "default" : "outline"} onClick={() => togglePublish(idx)}>
                            {r.published ? "Näkyvissä ✓" : "Julkaise"}
                          </Button>
                        : "—"}
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

function PreviewTable({ rows }: { rows: RowResult[] }) {
  const hasImages = rows.some((r) => r.imageMatches.length > 0);
  const hasFuzzyMatches = rows.some((r) =>
    r.imageMatches.some((m) => m.resolved && m.resolved.toLowerCase() !== m.csv.toLowerCase())
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-2 pr-3">Rivi</th>
            <th className="py-2 pr-3">Tuote</th>
            <th className="py-2 pr-3">Tila</th>
            <th className="py-2 pr-3">Myyntihinta</th>
            {hasImages && (
              <th className="py-2 pr-3">
                Kuvat
                {hasFuzzyMatches && <span className="text-amber-600 text-xs font-normal ml-1">(oranssi = joustava mätsäys)</span>}
              </th>
            )}
            <th className="py-2">Virheet / varoitukset</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 text-muted-foreground">{r.line}</td>
              <td className="py-2 pr-3 font-medium text-foreground">{r.name}</td>
              <td className="py-2 pr-3"><StatusPill status={r.status} /></td>
              <td className="py-2 pr-3">{r.price != null ? `${r.price.toFixed(2)} €` : "—"}</td>
              {hasImages && (
                <td className="py-2 pr-3"><ImageMatchCell matches={r.imageMatches} /></td>
              )}
              <td className="py-2 text-muted-foreground">{r.messages.join("; ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
