import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Mail, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ENSITILAUS_ALENNUS_PROSENTTI, SUOSTUMUS_UUTISKIRJE } from "../../api/_lib/vakiot.js";

const STORAGE_KEY = "huumorikauppa-newsletter-dismissed";
const DELAY_MS = 20000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const lue = (k: string) => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const kirjoita = (k: string, v: string) => {
  try { localStorage.setItem(k, v); } catch { /* yksityinen tila */ }
};

/**
 * Uutiskirjeen tilaus (oma tausta, /api/sahkoposti). Suostumus annetaan erillisellä valintaruudulla, jota ei ole
 * valittu valmiiksi; sama teksti tallentuu suostumuksen kanssa. Ensitilauksen koodi luvataan vain, kun se on käytössä
 * (api/_lib/vakiot.js ENSITILAUS_ALENNUS_PROSENTTI), ja se lähetetään sähköpostilla.
 */
export function NewsletterPopup({ viive = DELAY_MS }: { viive?: number }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [suostumus, setSuostumus] = useState(false);
  const [lahettaa, setLahettaa] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const alennus = ENSITILAUS_ALENNUS_PROSENTTI > 0;

  useEffect(() => {
    if (lue(STORAGE_KEY)) return;
    const timer = setTimeout(() => setOpen(true), viive);
    return () => clearTimeout(timer);
  }, [viive]);

  const handleDismiss = () => {
    setOpen(false);
    kirjoita(STORAGE_KEY, "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const osoite = email.trim().toLowerCase();
    if (!EMAIL_RE.test(osoite)) {
      toast({ title: "Tarkista sähköpostiosoite", variant: "destructive" });
      return;
    }
    if (!suostumus) {
      toast({ title: "Hyväksy uutiskirjeen tilaus valintaruudulla", variant: "destructive" });
      return;
    }
    setLahettaa(true);
    try {
      const vastaus = await fetch("/api/sahkoposti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tilaa", email: osoite, suostumus: true, lahde: "popup" }),
      });
      const data = await vastaus.json().catch(() => null);
      if (!vastaus.ok || !data?.ok) throw new Error(data?.error || "Tilaus epäonnistui");
      setSubmitted(true);
      kirjoita(STORAGE_KEY, "true");
      setTimeout(() => setOpen(false), 4000);
    } catch (err) {
      toast({ title: "Tilaus epäonnistui", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setLahettaa(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)] sm:max-w-sm p-0 overflow-hidden gap-0 [&>button]:hidden rounded-xl">
        <button
          onClick={handleDismiss}
          aria-label="Sulje"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-6 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            {alennus ? <Gift className="h-8 w-8 text-primary" /> : <Mail className="h-8 w-8 text-primary" />}
          </div>
          <DialogTitle className="font-display text-2xl text-foreground">
            {alennus ? `${ENSITILAUS_ALENNUS_PROSENTTI} % alennus ensimmäisestä tilauksesta` : "Tilaa Huumorikaupan uutiskirje"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            {alennus
              ? "Tilaa uutiskirje, niin lähetämme alennuskoodin sähköpostiisi."
              : "Kerromme sähköpostilla uusista tuotteista ja tarjouksista."}
          </DialogDescription>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center space-y-2" role="status">
              <Mail className="h-10 w-10 text-primary mx-auto" />
              <p className="font-bold text-foreground">Kiitos!</p>
              <p className="text-sm text-muted-foreground">
                {alennus ? "Alennuskoodi on matkalla sähköpostiisi." : "Tilaus on vastaanotettu. Lähetimme vahvistuksen sähköpostiisi."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                aria-label="Sähköpostiosoite"
                placeholder="anna@sahkoposti.fi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-muted border-border"
              />
              <div className="flex items-start gap-2">
                <Checkbox id="uutiskirje-suostumus" checked={suostumus} onCheckedChange={(v) => setSuostumus(v === true)} className="mt-0.5" />
                <label htmlFor="uutiskirje-suostumus" className="text-xs text-muted-foreground leading-snug">
                  {SUOSTUMUS_UUTISKIRJE}{" "}
                  <Link to="/tietosuojakaytanto" className="underline underline-offset-2 hover:text-foreground" onClick={handleDismiss}>
                    Tietosuojakäytäntö
                  </Link>
                </label>
              </div>
              <Button type="submit" disabled={!suostumus || lahettaa} className="w-full bg-primary text-primary-foreground font-bold h-11">
                {alennus ? "Tilaa ja saat koodin" : "Tilaa uutiskirje"}
              </Button>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors py-2"
              >
                Ei kiitos
              </button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
