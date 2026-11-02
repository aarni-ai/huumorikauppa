import { lisaaArkipaivia, tanaanSuomessa } from "@/lib/toimitusarvio";
import { TOIMITUSAIKA_MAX_ARKIPAIVAA } from "@/config/toimitus";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { CheckCircle, ShoppingBag, Share2, Mail, Loader2, RefreshCw, Gift, Download, Copy } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildPurchaseParams, trackPurchaseOnce } from "@/lib/analytics";
import { hasMarketingConsent } from "@/lib/consent";
import { TOIMITUSAIKA_TEKSTI } from "@/config/toimitus";
import { naytettavaTeksti } from "../../api/_lib/logopaita.js";

interface OrderInfo {
  id: string;
  items: Array<{ name: string; quantity: number; price: number; customText?: string; product_id?: string; slug?: string; id?: string }>;
  total: number;
  shipping?: number;
  amount_paid?: number | null;
  status: string;
  created_at: string;
  customer_email?: string;
  shipping_country?: string;
}

/** Ostettu lahjakortti (api/order.js lahjakortit): koodi ja tulostettava PDF heti maksun jälkeen. */
interface Lahjakortti {
  code: string;
  value: number;
  expires_at: string;
  recipient_name?: string | null;
  recipient_email?: string | null;
}

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  // Stripe-maksu: ?session_id=cs_..., kokonaan lahjakortilla maksettu tilaus: ?tilaus=<tilauksen id>.
  const sessionId = searchParams.get("session_id") || searchParams.get("tilaus");
  const tunnisteParametri = searchParams.get("session_id") ? "session_id" : "order_id";
  const { clearCart } = useCartContext();

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [polling, setPolling] = useState(true);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [optInRendered, setOptInRendered] = useState(false);
  const [lahjakortit, setLahjakortit] = useState<Lahjakortti[]>([]);
  const [koodit, setKoodit] = useState<{ kiitos: { koodi: string; prosentti: number; voimassa: string } | null; ystava: { koodi: string; linkki: string } | null } | null>(null);

  // Clear cart once
  useEffect(() => {
    if (sessionId) clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // 🔒 Strip session_id from the URL after capturing it so it doesn't leak
  // through browser history, referrers, or sharing.
  useEffect(() => {
    if (sessionId && typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [sessionId]);

  // GA4 purchase omassa efektissään: tilaus voi olla aluksi odottamassa maksua ja päivittyä maksetuksi pollauksessa.
  // trackPurchaseOnce estää tuplalähetyksen (StrictMode, uudelleenrenderöinti, localStorage-merkintä).
  useEffect(() => {
    const purchase = buildPurchaseParams(order);
    if (purchase) trackPurchaseOnce(purchase);
  }, [order]);

  // Google Customer Reviews opt-in — render once order data is available
  useEffect(() => {
    if (!order || optInRendered) return;
    if (typeof window === "undefined") return;

    // Arvioitu toimituspäivä: tilauspäivä + kaupan pisin toimitusaika arkipäivinä (src/config/toimitus.ts).
    const created = order.created_at ? new Date(order.created_at) : new Date();
    const estimatedDeliveryDate = lisaaArkipaivia(tanaanSuomessa(created), TOIMITUSAIKA_MAX_ARKIPAIVAA);

    const country = (order.shipping_country || "FI").toUpperCase();
    const email = order.customer_email || "";

    // Define the global render callback Google's script will call
    (window as unknown as { renderOptIn?: () => void }).renderOptIn = function () {
      const w = window as unknown as {
        gapi?: {
          load: (name: string, cb: () => void) => void;
          surveyoptin: {
            render: (opts: Record<string, unknown>) => void;
          };
        };
      };
      w.gapi?.load("surveyoptin", function () {
        w.gapi?.surveyoptin.render({
          merchant_id: 5759809345,
          order_id: order.id,
          email,
          delivery_country: country,
          estimated_delivery_date: estimatedDeliveryDate,
          opt_in_style: "CENTER_DIALOG",
        });
      });
    };

    // Google-asiakasarvostelujen kysely ladataan vain markkinointisuostumuksella (src/lib/consent.ts).
    if (!hasMarketingConsent()) {
      setOptInRendered(true);
      return;
    }

    // Inject Google platform script if not already present
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://apis.google.com/js/platform.js"]',
    );
    if (existing) {
      // Script already loaded — invoke directly
      (window as unknown as { renderOptIn?: () => void }).renderOptIn?.();
    } else {
      const s = document.createElement("script");
      s.src = "https://apis.google.com/js/platform.js?onload=renderOptIn";
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    }
    setOptInRendered(true);
  }, [order, optInRendered]);

  // Poll for order + email status
  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20; // ~60s of polling

    const poll = async () => {
      try {
        // Oma tausta (21.10.2026): tilaus sivuston omasta /api/order-funktiosta.
        const res = await fetch(`/api/order?${tunnisteParametri}=${encodeURIComponent(sessionId)}`);
        const json = await res.json();
        if (cancelled) return;

        if (json?.found) {
          setOrder(json.order);
          setEmailSent(!!json.emailSent);
          if (Array.isArray(json.lahjakortit) && json.lahjakortit.length) setLahjakortit(json.lahjakortit);
          if (json.koodit?.kiitos || json.koodit?.ystava) setKoodit(json.koodit);
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
      const vastaus = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "resend" }),
      });
      const data = await vastaus.json().catch(() => null);
      if (data?.customerEmailSent) {
        toast({ title: "Vahvistus lähetetty uudelleen! 📧" });
        setEmailSent(true);
      } else {
        toast({
          title: "Lähetys epäonnistui",
          description: data?.customerEmailError || "Ota yhteyttä: huumorikauppa@gmail.com",
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

  const vainLahjakortteja = !!order?.items?.length && order.items.every((i) => /^lahjakortti-\d+$/.test(String(i.slug || i.product_id || "")));

  return (
    <div className="container py-16 md:py-24 text-center max-w-2xl mx-auto space-y-8">
      <SEOHead title="Tilaus vahvistettu! – Huumorikauppa" description="Kiitos tilauksestasi Huumorikaupassa!" noindex={true} />

      <div className="animate-bounce-once">
        <CheckCircle className="h-20 w-20 text-primary mx-auto" />
      </div>

      <h1 className="font-display text-4xl md:text-5xl text-foreground">
        Tilaus vahvistettu! 🎉
      </h1>

      <p className="text-lg text-muted-foreground leading-relaxed">
        {vainLahjakortteja
          ? "Kiitos tilauksestasi! Lahjakorttisi on valmis alla: voit tulostaa sen tai lähettää koodin saajalle heti."
          : "Kiitos tilauksestasi! Saat vahvistusviestin sähköpostiisi hetken kuluttua. Pakettisi lähtee matkaan 1–3 arkipäivän kuluessa. 📦"}
      </p>

      {lahjakortit.length > 0 && (
        <section aria-label="Lahjakortit" className="bg-card border-2 border-primary rounded-lg p-6 space-y-4 text-left">
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" /> Lahjakorttisi
          </h2>
          {lahjakortit.map((k) => (
            <div key={k.code} className="rounded-lg bg-muted/50 p-4 space-y-2" data-lahjakortti={k.code}>
              <p className="text-sm text-muted-foreground">
                Lahjakortti {k.value.toFixed(2).replace(".", ",")} €{k.recipient_name ? `, saajalle ${k.recipient_name}` : ""}
              </p>
              <p className="font-mono text-2xl font-bold tracking-wider text-foreground break-all">{k.code}</p>
              <p className="text-xs text-muted-foreground">
                Voimassa {new Date(k.expires_at).toLocaleDateString("fi-FI", { timeZone: "Europe/Helsinki" })} asti. Koodi kirjoitetaan kassalla kenttään "Lahjakortin koodi".
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm" className="bg-primary text-primary-foreground">
                  <a href={`/api/order?${tunnisteParametri}=${encodeURIComponent(sessionId || "")}&lahjakortti=${encodeURIComponent(k.code)}`} download>
                    <Download className="h-4 w-4 mr-2" /> Lataa tulostettava PDF
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard?.writeText(k.code).then(() => toast({ title: "Koodi kopioitu" })).catch(() => undefined)}
                >
                  <Copy className="h-4 w-4 mr-2" /> Kopioi koodi
                </Button>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Tallenna PDF tai koodi talteen.{emailSent ? " Lahjakortti on myös sähköpostissasi." : ""}
          </p>
        </section>
      )}

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

      {/* Uudelleenostot (api/_lib/uusintaosto.js): kiitoskoodi ja ystävälinkki. */}
      {koodit && (
        <section aria-label="Seuraava tilaus" className="bg-card border border-border rounded-lg p-6 space-y-3 text-left">
          {koodit.kiitos && (
            <div>
              <h2 className="font-display text-lg text-foreground">{koodit.kiitos.prosentti} % seuraavaan tilaukseen</h2>
              <p className="font-mono text-xl font-bold tracking-wider text-foreground">{koodit.kiitos.koodi}</p>
              <p className="text-xs text-muted-foreground">
                Voimassa {new Date(koodit.kiitos.voimassa).toLocaleDateString("fi-FI", { timeZone: "Europe/Helsinki" })} asti samalla sähköpostiosoitteella. Kirjoita koodi kassalla kenttään Alennuskoodi.
              </p>
            </div>
          )}
          {koodit.ystava && (
            <div className="pt-2 border-t border-border">
              <h2 className="font-display text-lg text-foreground">Jaa ystävälle: hän saa 5 %, sinä saat 5 %</h2>
              <p className="text-sm text-muted-foreground break-all">{koodit.ystava.linkki}</p>
              <Button size="sm" variant="outline" className="mt-2"
                onClick={() => navigator.clipboard?.writeText(koodit.ystava!.linkki).then(() => toast({ title: "Linkki kopioitu" })).catch(() => undefined)}>
                <Copy className="h-4 w-4 mr-2" /> Kopioi ystävälinkki
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Order details if available */}
      {order && order.items?.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-2 text-left">
          <h3 className="font-display text-lg text-foreground mb-2">Tilauksesi</h3>
          {order.items.map((item, i) => (
            <div key={i} className="text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>{item.quantity}× {item.name}</span>
                <span>{(item.price * item.quantity).toFixed(2)} €</span>
              </div>
              {item.customText && (
                <p className="text-xs text-primary break-words">✍️ Oma teksti: ”{naytettavaTeksti(item.customText)}”</p>
              )}
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
          <li>📦 Toimitus {TOIMITUSAIKA_TEKSTI} arkipäivää</li>
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
        Ongelmia tilauksesi kanssa? Ota yhteyttä: huumorikauppa@gmail.com
      </p>

      {/* Google Customer Reviews opt-in container (Google injects content here) */}
      <div id="goog-survey-optin-container" />
    </div>
  );
};

export default OrderConfirmation;
