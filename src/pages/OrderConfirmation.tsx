import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { CheckCircle, ShoppingBag, Share2, Mail, Loader2, RefreshCw } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OrderInfo {
  id: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  created_at: string;
}

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCartContext();

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [polling, setPolling] = useState(true);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  // Clear cart once
  useEffect(() => {
    if (sessionId) clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Poll for order + email status
  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20; // ~60s of polling

    const poll = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-order-by-session", {
          body: undefined,
          method: "GET",
          headers: {},
        } as never);
        // Workaround: invoke with query string via fetch since invoke doesn't support GET easily
        // Use direct fetch instead:
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-order-by-session?session_id=${encodeURIComponent(sessionId)}`;
        const res = await fetch(url, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });
        const json = await res.json();
        if (cancelled) return;

        if (json?.found) {
          setOrder(json.order);
          setEmailSent(!!json.emailSent);
          // Stop polling once we have the order AND email sent OR we hit max
          if (json.emailSent || attempts >= maxAttempts) {
            setPolling(false);
            return;
          }
        }
      } catch (err) {
        console.warn("poll error", err);
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        setPolling(false);
        return;
      }
      setTimeout(poll, 3000);
    };

    poll();

    // Show resend option after 5 minutes regardless
    const t = setTimeout(() => setShowResend(true), 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [sessionId]);

  const handleResend = async () => {
    if (!sessionId) return;
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke("resend-order-confirmation", {
        body: { sessionId },
      });
      if (error) throw error;
      if (data?.customerEmailSent) {
        toast({ title: "Vahvistus lähetetty uudelleen! 📧" });
        setEmailSent(true);
      } else {
        toast({
          title: "Lähetys epäonnistui",
          description: data?.customerEmailError || "Ota yhteyttä: info@huumorikauppa.fi",
          variant: "destructive",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tuntematon virhe";
      toast({ title: "Lähetys epäonnistui", description: msg, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const handleShare = async () => {
    const text = "Tilasin just Huumorikaupasta! 😂🛒 Käy katsomassa: https://huumorikauppa.fi";
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: "Kopioitu leikepöydälle! 📋" });
    }
  };

  return (
    <div className="container py-16 md:py-24 text-center max-w-2xl mx-auto space-y-8">
      <SEOHead title="Tilaus vahvistettu! – Huumorikauppa" description="Kiitos tilauksestasi Huumorikaupassa!" />

      <div className="animate-bounce-once">
        <CheckCircle className="h-20 w-20 text-primary mx-auto" />
      </div>

      <h1 className="font-display text-4xl md:text-5xl text-foreground">
        Tilaus vahvistettu! 🎉
      </h1>

      <p className="text-lg text-muted-foreground leading-relaxed">
        Kiitos tilauksestasi! {order?.customer_email ? `Vahvistus on matkalla osoitteeseen ${order.customer_email}.` : "Saat vahvistusviestin sähköpostiisi hetken kuluttua."}
        Pakettisi lähtee matkaan 1–3 arkipäivän kuluessa. 📦
      </p>

      {/* Email status */}
      <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-center gap-2 text-sm">
        {polling && !emailSent ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Lähetetään vahvistusta sähköpostiin…</span>
          </>
        ) : emailSent ? (
          <>
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-foreground">Vahvistus lähetetty sähköpostiin ✓</span>
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Vahvistuksen lähetys voi kestää muutaman minuutin.
            </span>
          </>
        )}
      </div>

      {/* Order details if available */}
      {order && order.items?.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-2 text-left">
          <h3 className="font-display text-lg text-foreground mb-2">Tilauksesi</h3>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-muted-foreground">
              <span>{item.quantity}× {item.name}</span>
              <span>{(item.price * item.quantity).toFixed(2)} €</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border">
            <span>Yhteensä</span>
            <span className="text-primary">{Number(order.total).toFixed(2)} €</span>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-6 space-y-3 text-left">
        <h3 className="font-display text-lg text-foreground">Mitä seuraavaksi?</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>📧 Saat tilausvahvistuksen sähköpostiin</li>
          <li>📦 Toimitus 3–10 arkipäivää</li>
          <li>🔄 14 päivän vaihto- ja palautusoikeus</li>
        </ul>
      </div>

      {/* Resend button — show if email not yet confirmed sent OR after 5 min */}
      {(showResend || (!polling && !emailSent)) && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Etkö saanut vahvistusta? Tarkista myös roskapostikansio.
          </p>
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resending || !sessionId}
            className="border-border"
          >
            {resending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Lähetetään…</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Lähetä vahvistus uudelleen</>
            )}
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg" className="bg-primary text-primary-foreground font-bold">
          <Link to="/kaikki-tuotteet">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Jatka shoppailua
          </Link>
        </Button>
        <Button variant="outline" size="lg" onClick={handleShare} className="border-border">
          <Share2 className="h-4 w-4 mr-2" />
          Jaa kaverille 😂
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Ongelmia tilauksesi kanssa? Ota yhteyttä: info@huumorikauppa.fi
      </p>
    </div>
  );
};

export default OrderConfirmation;
