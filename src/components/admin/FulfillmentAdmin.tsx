import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Line {
  orderId: string; date: string; email: string; shipping: unknown;
  name: string; size?: string; color?: string; quantity: number;
  aliexpressUrl?: string | null; lineKey: string; status: string;
}

const STATUSES = ["tilaamatta", "tilattu", "lähetetty"];

function fmtAddress(a: any): string {
  if (!a) return "—";
  if (typeof a === "string") return a;
  const parts = [
    a.name,
    a.line1 || a.address || a.street,
    [a.postal_code || a.zip, a.city].filter(Boolean).join(" "),
    a.country,
  ].filter(Boolean);
  return parts.join(", ") || JSON.stringify(a);
}

export function FulfillmentAdmin() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: orders }, { data: products }, { data: statuses }] = await Promise.all([
      supabase.from("orders")
        .select("id, created_at, customer_email, shipping_address, items, payment_status")
        .eq("payment_status", "paid").order("created_at", { ascending: false }).limit(200),
      supabase.from("products").select("name, supplier, aliexpress_url"),
      supabase.from("supplier_fulfillment").select("order_id, line_key, status"),
    ]);
    const supByName = new Map((products || []).map((p) => [p.name, p]));
    const statusMap = new Map((statuses || []).map((s) => [`${s.order_id}::${s.line_key}`, s.status]));
    const out: Line[] = [];
    for (const o of orders || []) {
      const items = Array.isArray(o.items) ? (o.items as any[]) : [];
      for (const it of items) {
        const meta = supByName.get(it.name);
        const supplier = it.supplier || meta?.supplier;
        if (supplier !== "aliexpress") continue;
        const lineKey = `${it.name}|${it.size || ""}|${it.color || ""}`;
        out.push({
          orderId: o.id, date: o.created_at, email: o.customer_email || "—",
          shipping: o.shipping_address, name: it.name, size: it.size, color: it.color,
          quantity: it.quantity || 1, aliexpressUrl: it.aliexpress_url || meta?.aliexpress_url,
          lineKey, status: statusMap.get(`${o.id}::${lineKey}`) || "tilaamatta",
        });
      }
    }
    setLines(out); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (line: Line, status: string) => {
    await supabase.from("supplier_fulfillment").upsert({
      order_id: line.orderId, line_key: line.lineKey, status, updated_at: new Date().toISOString(),
    });
    setLines((ls) => ls.map((l) => (l.orderId === line.orderId && l.lineKey === line.lineKey ? { ...l, status } : l)));
  };

  if (loading) return <p className="text-sm text-muted-foreground">Ladataan…</p>;
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">Ei AliExpress-rivejä maksetuissa tilauksissa.</p>;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 overflow-x-auto">
      <p className="text-sm font-medium mb-3">{lines.length} AliExpress-riviä maksetuissa tilauksissa</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-2 pr-3">Pvm</th><th className="py-2 pr-3">Tuote</th><th className="py-2 pr-3">Variantti</th>
            <th className="py-2 pr-3">Määrä</th><th className="py-2 pr-3">Asiakas</th><th className="py-2 pr-3">Osoite</th>
            <th className="py-2 pr-3">AliExpress</th><th className="py-2">Tila</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 whitespace-nowrap">{new Date(l.date).toLocaleDateString("fi-FI")}</td>
              <td className="py-2 pr-3 font-medium text-foreground">{l.name}</td>
              <td className="py-2 pr-3">{[l.color, l.size].filter(Boolean).join(" / ") || "—"}</td>
              <td className="py-2 pr-3">{l.quantity}</td>
              <td className="py-2 pr-3">{l.email}</td>
              <td className="py-2 pr-3 max-w-[220px]">{fmtAddress(l.shipping)}</td>
              <td className="py-2 pr-3">
                {l.aliexpressUrl
                  ? <a href={l.aliexpressUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Avaa →</a>
                  : "—"}
              </td>
              <td className="py-2">
                <select value={l.status} onChange={(e) => setStatus(l, e.target.value)}
                  className="border border-border rounded px-2 py-1 bg-background">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
