import { Link } from "react-router-dom";
import { Mail, MapPin, Instagram, Truck, RotateCcw, Shield, Flag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/products";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { footerGiftLinks } from "@/config/internalLinks";

export function Footer() {
  const [footerEmail, setFooterEmail] = useState("");
  const [footerSubmitted, setFooterSubmitted] = useState(false);
  const { toast } = useToast();

  // Google Customer Reviews badge — load once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
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
  }, []);

  const handleFooterNewsletter = async () => {
    if (!footerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(footerEmail)) {
      toast({ title: "Tarkista sähköpostiosoite", variant: "destructive" });
      return;
    }
    try {
      const email = footerEmail.trim().toLowerCase();
      await supabase.functions.invoke("subscribe-mailerlite", { body: { email } });
      await supabase.from("newsletter_subscribers").insert({ email, is_active: true });
      await supabase.functions.invoke("notify-store", { body: { email, type: "newsletter" } });
    } catch {}
    setFooterSubmitted(true);
    toast({ title: "Kiitos tilauksesta!", description: "Alennuskoodisi: HUUMORI5 (-5%)" });
  };

  return (
    <footer className="border-t border-border bg-card mt-16">
      {/* Trust strip */}
      <div className="border-b border-border py-6">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck,    label: "Ilmainen toimitus",    sub: "Yli 60 € tilauksiin" },
            { icon: RotateCcw, label: "14 pv palautusoikeus", sub: "Vaivaton palautus" },
            { icon: Shield,   label: "Turvalliset maksut",   sub: "Stripe, Klarna, MobilePay" },
            { icon: Flag,     label: "Kotimainen kauppa",    sub: "Helsinki · Y: 3583677-2" },
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
            Suomen hauskin verkkokauppa – hauskoja t-paitoja, huppareita, mukeja ja tarroja koko perheelle.
          </p>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /> Helsinki, Suomi</span>
            <a href="mailto:huumorikauppa@gmail.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Mail className="h-3.5 w-3.5 shrink-0" /> huumorikauppa@gmail.com
            </a>
          </div>
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
            {categories.map(cat => (
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
          </div>
        </div>

        {/* Newsletter */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest">Uutiskirje</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">Tilaa ja saat 5 % alennuksen ensimmäisestä tilauksestasi.</p>
          {footerSubmitted ? (
            <p className="text-sm text-foreground font-semibold">Kiitos! Koodisi: HUUMORI5</p>
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
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Huumorikauppa (Inteller) · Y-tunnus: 3583677-2</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Visa */}
            <div className="bg-white border border-border rounded-md px-2 py-1.5 h-8 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className="h-5 w-auto"><rect width="48" height="32" rx="4" fill="#fff"/><path d="M19.5 21.5h-3.2l2-12.3h3.2l-2 12.3z" fill="#00579F"/><path d="M32.3 9.4c-.6-.3-1.6-.5-2.9-.5-3.2 0-5.4 1.7-5.4 4.1 0 1.8 1.6 2.8 2.8 3.4 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.2 0-1.9-.2-2.9-.6l-.4-.2-.4 2.6c.7.3 2.1.6 3.5.6 3.4 0 5.6-1.7 5.6-4.2 0-1.4-.8-2.5-2.7-3.4-1.1-.6-1.8-.9-1.8-1.5 0-.5.6-1 1.8-1 1 0 1.8.2 2.4.5l.3.1.4-2.6z" fill="#00579F"/><path d="M37.3 9.2h-2.5c-.8 0-1.3.2-1.7 1l-4.7 11.3h3.4l.7-1.9h4.1l.4 1.9H40l-2.7-12.3zm-3.9 7.9l1.7-4.6.9 4.6h-2.6z" fill="#00579F"/><path d="M15.4 9.2l-3.1 8.4-.3-1.7c-.6-2-2.4-4.1-4.4-5.2l2.9 10.8h3.4l5.1-12.3h-3.6z" fill="#00579F"/><path d="M9.6 9.2H4.5l-.1.3c4 1 6.7 3.5 7.8 6.5l-1.1-5.7c-.2-.8-.8-1-1.5-1.1z" fill="#FAA61A"/></svg>
            </div>
            {/* Mastercard */}
            <div className="bg-white border border-border rounded-md px-2 py-1.5 h-8 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className="h-5 w-auto"><rect width="48" height="32" rx="4" fill="#fff"/><circle cx="19" cy="16" r="9" fill="#EB001B"/><circle cx="29" cy="16" r="9" fill="#F79E1B"/><path d="M24 9.2a9 9 0 0 1 3.3 6.8A9 9 0 0 1 24 22.8a9 9 0 0 1-3.3-6.8A9 9 0 0 1 24 9.2z" fill="#FF5F00"/></svg>
            </div>
            {/* Apple Pay */}
            <div className="bg-white border border-border rounded-md px-2.5 py-1.5 h-8 flex items-center justify-center">
              <span className="text-black font-semibold text-xs tracking-tight">Apple Pay</span>
            </div>
            {/* G Pay */}
            <div className="bg-white border border-border rounded-md px-2.5 py-1.5 h-8 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-700">G Pay</span>
            </div>
            {/* Klarna */}
            <div className="bg-[#FFB3C7] rounded-md px-2.5 py-1.5 h-8 flex items-center justify-center">
              <span className="text-black font-bold text-xs">Klarna</span>
            </div>
            {/* MobilePay */}
            <div className="bg-[#5A78FF] rounded-md px-2.5 py-1.5 h-8 flex items-center justify-center">
              <span className="text-white font-bold text-xs">MobilePay</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
