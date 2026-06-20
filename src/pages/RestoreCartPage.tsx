import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCartContext } from "@/context/CartContext";
import { Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "@/hooks/use-toast";

const RestoreCartPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addItem, clearCart } = useCartContext();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setStatus("error"); return; }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("restore-cart", {
          body: { token },
        });
        if (error || !data?.ok) throw error || new Error("not found");
        clearCart();
        const items = Array.isArray(data.cartItems) ? data.cartItems : [];
        for (const it of items) {
          if (!it?.product) continue;
          addItem(it.product, Number(it.quantity) || 1, it.selectedSize, it.selectedColor, it.customText);
        }
        toast({ title: "Ostoskori palautettu 🛒" });
        const codeQuery = data.discountCode ? `?code=${data.discountCode}` : "";
        navigate(`/kassa${codeQuery}`, { replace: true });
      } catch {
        setStatus("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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