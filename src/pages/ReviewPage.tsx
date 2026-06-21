import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Star, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type OrderProduct = { name: string; quantity: number; reviewed: boolean };

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export default function ReviewPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const wantsUnsub = params.get("unsubscribe") === "1";
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [unsubscribed, setUnsubscribed] = useState(false);

  const [name, setName] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { stars: number; text: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("Linkki ei ole kelvollinen."); setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`${FN_BASE}/get-order-for-review?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) { setError("Linkki on vanhentunut tai virheellinen."); setLoading(false); return; }
        setProducts(data.products || []);
        setCustomerName(data.customerName || "");
        setName(data.customerName || "");
        setUnsubscribed(!!data.unsubscribed);
      } catch {
        setError("Tilauksen lataus epäonnistui.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (wantsUnsub && token && !loading && !unsubscribed) {
      handleUnsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsUnsub, token, loading]);

  const handleUnsubscribe = async () => {
    try {
      const res = await fetch(`${FN_BASE}/submit-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsubscribe", token }),
      });
      if (res.ok) {
        setUnsubscribed(true);
        toast({ title: "Arviopyynnöt peruttu", description: "Et saa enää arviopyyntöjä tästä tilauksesta." });
      }
    } catch { /* silent */ }
  };

  const setDraft = (name: string, partial: Partial<{ stars: number; text: string }>) => {
    setDrafts(d => ({ ...d, [name]: { stars: d[name]?.stars || 0, text: d[name]?.text || "", ...partial } }));
  };

  const handleSubmit = async (productName: string) => {
    const draft = drafts[productName];
    if (!draft || !draft.stars) {
      toast({ title: "Valitse tähdet", variant: "destructive" });
      return;
    }
    setSubmitting(productName);
    try {
      const res = await fetch(`${FN_BASE}/submit-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review",
          token,
          productName,
          stars: draft.stars,
          text: draft.text,
          customerName: name,
        }),
      });
      if (res.ok) {
        toast({ title: "Kiitos arviostasi! ⭐", description: "Arvio menee tarkistukseen ja näkyy pian sivulla." });
        setProducts(prev => prev.map(p => p.name === productName ? { ...p, reviewed: true } : p));
      } else if (res.status === 409) {
        toast({ title: "Olet jo arvostellut tämän", variant: "destructive" });
        setProducts(prev => prev.map(p => p.name === productName ? { ...p, reviewed: true } : p));
      } else {
        toast({ title: "Tallennus epäonnistui", variant: "destructive" });
      }
    } catch {
      toast({ title: "Verkkovirhe", variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen container max-w-2xl py-10">
      <Helmet>
        <title>Arvostele ostoksesi | Huumorikauppa</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <h1 className="font-display text-3xl text-foreground mb-2">Arvostele ostoksesi ⭐</h1>
      <p className="text-muted-foreground mb-6">
        {customerName ? `Hei ${customerName}! ` : ""}Kerro lyhyesti mitä mieltä olit – arviosi auttaa muita asiakkaita.
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ladataan tilausta…</div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 flex gap-2 items-start">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-foreground">{error}</p>
            <Link to="/" className="text-primary underline text-sm">Takaisin etusivulle</Link>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-1 block">Nimesi (näkyy julkisesti)</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Esim. Anna K." className="bg-muted border-border" maxLength={80} />
          </div>

          <div className="space-y-5">
            {products.map(prod => {
              const draft = drafts[prod.name] || { stars: 0, text: "" };
              const done = prod.reviewed;
              return (
                <div key={prod.name} className="rounded-xl border border-border bg-card/50 p-5">
                  <p className="font-medium text-foreground mb-3">{prod.name}{prod.quantity > 1 ? ` × ${prod.quantity}` : ""}</p>

                  {done ? (
                    <div className="flex items-center gap-2 text-primary text-sm">
                      <Check className="h-4 w-4" /> Kiitos – tämä tuote on jo arvosteltu.
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-1 mb-3" role="radiogroup" aria-label="Tähdet">
                        {[1,2,3,4,5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setDraft(prod.name, { stars: n })}
                            aria-label={`${n} tähteä`}
                            className="p-1"
                          >
                            <Star className={`h-7 w-7 ${n <= draft.stars ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        value={draft.text}
                        onChange={e => setDraft(prod.name, { text: e.target.value })}
                        placeholder="Kerro lyhyesti kokemuksestasi (valinnainen)"
                        maxLength={1000}
                        rows={3}
                        className="bg-muted border-border mb-3"
                      />
                      <Button onClick={() => handleSubmit(prod.name)} disabled={submitting === prod.name} className="bg-primary text-primary-foreground font-bold">
                        {submitting === prod.name ? "Lähetetään…" : "Lähetä arvio"}
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 pt-6 border-t border-border text-sm text-muted-foreground">
            {unsubscribed ? (
              <p>✅ Et saa enää arviopyyntöjä tästä tilauksesta.</p>
            ) : (
              <button onClick={handleUnsubscribe} className="underline hover:text-foreground">
                En halua arviopyyntöjä jatkossa
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
