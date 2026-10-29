import { Link } from "react-router-dom";
import { Mail, MapPin, Instagram, Truck, RotateCcw, Shield, Flag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/products";
import { onKategoriasivu } from "@/lib/hiddenCategories";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { footerGiftLinks } from "@/config/internalLinks";
import { PaymentIcons } from "@/components/PaymentIcons";
import { useLahjakortitMyynnissa } from "@/hooks/use-lahjakortit";
import { PAYMENT_METHODS_TEXT } from "@/config/maksutavat";
import { ORGANIZATION } from "@/seo/site";
import { ILMAINEN_RAJA_TEKSTI } from "@/config/toimitus";
import { onMarketingConsent, openConsentSettings } from "@/lib/consent";

export function Footer() {
  const lahjakortit = useLahjakortitMyynnissa();
  const [footerEmail, setFooterEmail] = useState("");
  const [footerSubmitted, setFooterSubmitted] = useState(false);
  const { toast } = useToast();

  // Google Customer Reviews -merkki. Ladataan vain markkinointisuostumuksella (src/lib/consent.ts) ja vasta
  // sivun latauduttua selaimen ollessa joutilas (n. 250 kt skriptejä), jotta se ei kilpaile tuotekuvan ja
  // ostopainikkeen kanssa.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        const w = window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void };
        if (w.requestIdleCallback) w.requestIdleCallback(loadWidget, { timeout: 4000 });
        else loadWidget();
      }, 3000);
    };
    const stopWaiting = onMarketingConsent(() => {
      if (document.readyState === "complete") start();
      else window.addEventListener("load", start, { once: true });
    });
    return () => {
      cancelled = true;
      stopWaiting?.();
      if (timer) clearTimeout(timer);
      window.removeEventListener("load", start);
    };
  }, []);

  function loadWidget() {
    if (document.getElementById("merchantWidgetScript")) return;

    const script = document.createElement("script");
    script.id = "merchantWidgetScript";
    script.src = "https://www.gstatic.com/shopping/merchant/merchantwidget.js";
    script.defer = true;
    script.addEventListener("load", () => {
      const w = window as unknown as {
        merchantwidget?: { start: (opts: Record<string, unknown>) => void };
      };
      w.merchantwidget?.start({
        merchant_id: 5759809345,
        position: "BOTTOM_RIGHT",
        region: "FI",
      });
    });
    document.body.appendChild(script);
  }

  const handleFooterNewsletter = async () => {
    if (!footerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(footerEmail)) {
      toast({ title: "Tarkista sähköpostiosoite", variant: "destructive" });
      return;
    }
    try {
      const email = footerEmail.trim().toLowerCase();
      // Oma tausta: uutiskirje omaan tauluun (api/sahkoposti.js), ei Lovable Cloudiin. Lomakkeen lähetys on tilaus.
      await fetch("/api/sahkoposti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tilaa", email, suostumus: true, lahde: "alatunniste" }),
      });
    } catch {
      // Tilaus näytetään onnistuneena myös verkkovirheessä (sama kuin ennen).
    }
    setFooterSubmitted(true);
    toast({ title: "Kiitos tilauksesta!", description: "Saat uutiskirjeen sähköpostiisi." });
  };

  return (
    <footer className="border-t border-border bg-card mt-16">
      {/* Trust strip */}
      <div className="border-b border-border py-6">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck,    label: "Ilmainen toimitus",    sub: `Vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin` },
            { icon: RotateCcw, label: "14 pv palautusoikeus", sub: "Ei koske personoituja tuotteita" },
            { icon: Shield,   label: "Turvallinen maksu",    sub: PAYMENT_METHODS_TEXT },
            { icon: Flag,     label: "Kotimainen kauppa",    sub: `${ORGANIZATION.addressLocality} · Y-tunnus ${ORGANIZATION.legalId}` },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 text-muted-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-4">
          <div>
            <span className="font-display text-xl text-primary">HUUMORI</span>
            <span className="font-display text-xl text-secondary">KAUPPA</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hauskoja t-paitoja, huppareita ja muita lahjoja suomalaisella huumorilla koko perheelle.
          </p>
          {/* Kauppiaan tiedot: src/config/yritys.ts (ORGANIZATION, src/seo/site.ts). */}
          <address className="not-italic flex flex-col gap-1.5 text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{ORGANIZATION.name} ({ORGANIZATION.legalName})</span>
            <span>Y-tunnus {ORGANIZATION.legalId} · ALV-numero {ORGANIZATION.vatID}</span>
            <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /> {ORGANIZATION.postalAddress}, Suomi</span>
            <a href={`mailto:${ORGANIZATION.email}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Mail className="h-3.5 w-3.5 shrink-0" /> {ORGANIZATION.email}
            </a>
          </address>
          <div className="flex items-center gap-4 pt-1">
            <a href="https://instagram.com/huumorikauppa_fi" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Instagram className="h-4 w-4" /> Instagram
            </a>
            <a href="https://www.facebook.com/profile.php?id=61584153329326" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </a>
          </div>
        </div>

        {/* Shop links */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest">Kauppa</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/kaikki-tuotteet" className="hover:text-foreground transition-colors">Kaikki tuotteet</Link>
            <Link to="/paketit" className="hover:text-foreground transition-colors">Paketit</Link>
            {lahjakortit && <Link to="/lahjakortti" className="hover:text-foreground transition-colors">Lahjakortti</Link>}
            <Link to="/ryhmatilaukset" className="hover:text-foreground transition-colors">Ryhmätilaukset</Link>
            <Link to="/yritykset" className="hover:text-foreground transition-colors">Yrityksille</Link>
            {categories.filter(cat => onKategoriasivu(cat.slug)).map(cat => (
              <Link key={cat.slug} to={`/kategoria/${cat.slug}`} className="hover:text-foreground transition-colors">
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest">Tietoa</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/usein-kysytyt-kysymykset" className="hover:text-foreground transition-colors">Usein kysytyt kysymykset</Link>
            <Link to="/tietoa-meista" className="hover:text-foreground transition-colors">Tietoa meistä</Link>
            <Link to="/yhteystiedot" className="hover:text-foreground transition-colors">Ota yhteyttä</Link>
            <Link to="/blogi" className="hover:text-foreground transition-colors">Blogi</Link>
            <Link to="/toimitusehdot" className="hover:text-foreground transition-colors">Toimitusehdot</Link>
            <Link to="/palautusehdot" className="hover:text-foreground transition-colors">Palautusehdot</Link>
            <Link to="/tietosuojakaytanto" className="hover:text-foreground transition-colors">Tietosuojakäytäntö</Link>
            <Link to="/saavutettavuusseloste" className="hover:text-foreground transition-colors">Saavutettavuusseloste</Link>
            <Link to="/media" className="hover:text-foreground transition-colors">Medialle</Link>
          </div>
        </div>

        {/* Newsletter */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest">Uutiskirje</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Uudet tuotteet ja sesongin lahjaideat sähköpostiisi.</p>
          {footerSubmitted ? (
            <p className="text-sm text-foreground font-semibold">Kiitos tilauksesta!</p>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="anna@email.fi"
                className="h-9 bg-muted border-border text-sm rounded-lg"
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFooterNewsletter()}
              />
              <Button size="sm" onClick={handleFooterNewsletter} className="shrink-0 rounded-lg">
                Tilaa
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Voit peruuttaa milloin vain.</p>
        </div>
      </div>

      {/* Gift hub links */}
      <nav aria-label="Lahjaideat" className="border-t border-border pt-6 pb-2 container">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Lahjaideat</p>
        <div className="flex flex-wrap gap-2">
          {footerGiftLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Payment icons + copyright */}
      <div className="border-t border-border py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {ORGANIZATION.name} ({ORGANIZATION.legalName}) · Y-tunnus {ORGANIZATION.legalId} · {ORGANIZATION.email}</p>
            <nav aria-label="Ehdot" className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <Link to="/toimitusehdot" className="underline hover:text-foreground">Toimitusehdot</Link>
              <Link to="/palautusehdot" className="underline hover:text-foreground">Palautusehdot</Link>
              <Link to="/tietosuojakaytanto" className="underline hover:text-foreground">Tietosuojakäytäntö</Link>
              <button type="button" onClick={openConsentSettings} className="underline hover:text-foreground">Evästeasetukset</button>
            </nav>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Maksutavat:</span>
            <PaymentIcons iconClassName="h-5 w-auto" />
          </div>
        </div>
      </div>
    </footer>
  );
}
