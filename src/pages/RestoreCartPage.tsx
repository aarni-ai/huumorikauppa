import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProducts } from "@/hooks/use-products";
import { useCartContext } from "@/context/CartContext";
import { Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "@/hooks/use-toast";

const RestoreCartPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addItem, clearCart } = useCartContext();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  const { data: tuotteet = [], isLoading } = useProducts();

  // Muistutusviestin linkki (/api/sahkoposti?kori=): tallennettu kori palautetaan ajantasaisilla tuotetiedoilla.
  useEffect(() => {
    const token = params.get("token");
    if (!token) { setStatus("error"); return; }
    if (isLoading) return;
    (async () => {
      try {
        const vastaus = await fetch(`/api/sahkoposti?kori=${encodeURIComponent(token)}`);
        const data = await vastaus.json().catch(() => null);
        if (!vastaus.ok || !data?.ok) throw new Error("not found");
        const bySlug = new Map(tuotteet.map((p) => [p.slug, p]));
        const rivit = (Array.isArray(data.items) ? data.items : [])
          .map((it: { slug?: string; quantity?: number; size?: string; color?: string; customText?: string }) => ({ it, p: it?.slug ? bySlug.get(it.slug) : undefined }))
          .filter((x: { p?: unknown }) => x.p);
        if (rivit.length === 0) throw new Error("not found");
        clearCart();
        for (const { it, p } of rivit) addItem(p, Number(it.quantity) || 1, it.size, it.color, it.customText);
        toast({ title: "Ostoskori palautettu" });
        navigate("/kassa", { replace: true });
      } catch {
        setStatus("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <div className="container py-20 text-center space-y-4 min-h-[50vh]">
      <SEOHead title="Palauta ostoskori – Huumorikauppa" description="Palaa ostoskoriisi ja viimeistele tilauksesi." />
      {status === "loading" ? (
        <>
          <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
          <p className="text-foreground">Palautetaan ostoskoriasi…</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl text-foreground">Ostoskoria ei löytynyt</h1>
          <p className="text-muted-foreground">Linkki on saattanut vanhentua tai tilaus on jo tehty.</p>
        </>
      )}
    </div>
  );
};

export default RestoreCartPage;