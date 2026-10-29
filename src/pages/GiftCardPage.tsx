import { useState } from "react";
import { Link } from "react-router-dom";
import { Gift, Mail, Check } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCartContext } from "@/context/CartContext";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { useLahjakortitMyynnissa } from "@/hooks/use-lahjakortit";
import { toast } from "@/hooks/use-toast";
import { LAHJAKORTTI_ARVOT, LAHJAKORTTI_EHDOT, lahjakorttiTuote } from "../../api/_lib/lahjakortti.js";
import type { Product } from "@/types/product";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * /lahjakortti: digitaalinen lahjakortti 25, 50 tai 75 €, koodi sähköpostilla maksun jälkeen. Myynti avautuu itsestään,
 * kun oma sähköposti on käytössä (useLahjakortitMyynnissa, sama ehto kuin kassalla).
 */
const GiftCardPage = () => {
  usePrerenderReady();
  const { addGiftCard } = useCartContext();
  const [arvo, setArvo] = useState<number>(50);
  const [saajalle, setSaajalle] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [lisatty, setLisatty] = useState(false);
  const myynnissa = useLahjakortitMyynnissa();

  const lisaa = () => {
    if (saajalle && recipientEmail.trim() && !EMAIL_RE.test(recipientEmail.trim())) {
      toast({ title: "Tarkista saajan sähköpostiosoite", variant: "destructive" });
      return;
    }
    const tuote = lahjakorttiTuote(arvo) as Product;
    addGiftCard(tuote, saajalle ? { recipientName, recipientEmail, message } : {});
    setLisatty(true);
    toast({ title: `Lahjakortti ${arvo} € lisätty koriin` });
  };

  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <SEOHead
        title="Lahjakortti | Huumorikauppa.fi"
        description="Digitaalinen lahjakortti Huumorikauppaan: 25, 50 tai 75 €. Koodi sähköpostilla heti maksun jälkeen, voimassa 24 kuukautta. Sopii viime hetken joululahjaksi."
        canonical="https://huumorikauppa.fi/lahjakortti"
        breadcrumbs={[{ name: "Etusivu", url: "https://huumorikauppa.fi/" }, { name: "Lahjakortti", url: "https://huumorikauppa.fi/lahjakortti" }]}
      />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3 flex items-center gap-3">
        <Gift className="h-8 w-8 text-primary" /> Lahjakortti
      </h1>
      <p className="text-muted-foreground mb-8">
        Kun et tiedä, mikä paita naurattaa eniten, anna saajan valita itse. Lahjakortti on digitaalinen: koodi tulee
        sähköpostiin heti maksun jälkeen, ja voit lähettää sen suoraan saajalle. Se ehtii jouluksi myös joulun
        viimeisten tilauspäivien jälkeen.
      </p>
      {myynnissa === false && (
        <p className="mb-6 rounded-lg border border-border bg-muted/50 p-4 text-sm text-foreground">
          Lahjakortit eivät ole vielä myynnissä. <Link to="/kaikki-tuotteet" className="text-primary underline">Katso tuotteet</Link>
        </p>
      )}

      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Valitse arvo</p>
          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Lahjakortin arvo">
            {LAHJAKORTTI_ARVOT.map((a: number) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={arvo === a}
                onClick={() => setArvo(a)}
                className={`rounded-lg border px-4 py-4 text-xl font-bold transition-colors ${
                  arvo === a ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/50"
                }`}
              >
                {a} €
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
            <input type="checkbox" checked={saajalle} onChange={(e) => setSaajalle(e.target.checked)} className="accent-primary" />
            Lähetä koodi myös saajalle sähköpostilla
          </label>
          {saajalle && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="lk-nimi" className="text-foreground">Saajan nimi</Label>
                <Input id="lk-nimi" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="bg-muted border-border mt-1" maxLength={100} />
              </div>
              <div>
                <Label htmlFor="lk-email" className="text-foreground">Saajan sähköposti</Label>
                <Input id="lk-email" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} className="bg-muted border-border mt-1" maxLength={200} />
              </div>
              <div>
                <Label htmlFor="lk-viesti" className="text-foreground">Viesti saajalle</Label>
                <Textarea id="lk-viesti" value={message} onChange={(e) => setMessage(e.target.value)} className="bg-muted border-border mt-1" maxLength={500} rows={3} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" onClick={lisaa} disabled={myynnissa !== true} className="bg-primary text-primary-foreground font-bold">
            <Gift className="h-5 w-5 mr-2" /> Lisää koriin, {arvo} €
          </Button>
          {lisatty && (
            <Button asChild size="lg" variant="outline" className="border-border">
              <Link to="/ostoskori"><Check className="h-4 w-4 mr-2" /> Siirry ostoskoriin</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-5">
          <h2 className="font-display text-lg text-foreground mb-2 flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Näin se toimii</h2>
          <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
            <li>Valitse arvo ja maksa kassalla.</li>
            <li>Koodi tulee sähköpostiisi heti maksun jälkeen (ja saajalle, jos annoit osoitteen).</li>
            <li>Saaja kirjoittaa koodin kassalla kenttään "Lahjakortin koodi".</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-3">Lahjakortista ei peritä toimitusmaksua.</p>
        </div>
        <div className="rounded-lg border border-border p-5">
          <h2 className="font-display text-lg text-foreground mb-2">Ehdot</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {LAHJAKORTTI_EHDOT.map((e: string) => <li key={e}>{e}</li>)}
            <li>Lahjakortilla ei voi ostaa lahjakortteja.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GiftCardPage;
