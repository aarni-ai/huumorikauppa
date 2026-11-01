import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { kumppaniSelitys } from "@/lib/kumppani";

/**
 * Kassan Kumppanikoodi-kenttä ja näkyvä vahvistus (api/checkout.js action "kumppanikoodi"). Koodi täyttyy
 * kumppanilinkistä ?ref= (src/lib/kumppani.ts); kirjainkoolla ei ole väliä.
 */
type KoriRivi = { id?: string; slug?: string; quantity: number; size?: string; color?: string; type?: string };

/**
 * Kumppanimalli 2 (api/checkout.js "kumppanikoodi"): palvelin kertoo, montako prosenttia alennusta tälle korille
 * toteutuu (7 €:n kateehto); onTulos välittää sen kassan yhteenvetoon.
 */
export function KumppaniKentta({ arvo, setArvo, items, onTulos, alennus = true }: {
  arvo: string; setArvo: (v: string) => void; items?: KoriRivi[]; onTulos?: (t: { koodi: string; prosentti: number } | null) => void;
  /** false: ei kumppanialennusta tällä sivulla (yritystilaus laskulla), näytetään vain hyväksyntä. */
  alennus?: boolean;
}) {
  const [tila, setTila] = useState<"tyhja" | "tarkistetaan" | "ok" | "ei">("tyhja");
  const [prosentti, setProsentti] = useState(0);
  const [syy, setSyy] = useState<string | null>(null);
  const koriAvain = JSON.stringify(items || []);
  useEffect(() => {
    const koodi = arvo.trim();
    if (koodi.length < 2) { setTila("tyhja"); setProsentti(0); onTulos?.(null); return; }
    setTila("tarkistetaan");
    const ajastin = setTimeout(() => {
      fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "kumppanikoodi", code: koodi, items: JSON.parse(koriAvain) }) })
        .then((r) => r.json())
        .then((j) => {
          const p = j?.ok ? Number(j.prosentti) || 0 : 0;
          setTila(j?.ok ? "ok" : "ei");
          setProsentti(p);
          setSyy(j?.ok && !p ? j.syy ?? null : null);
          onTulos?.(j?.ok ? { koodi: koodi.toUpperCase(), prosentti: p } : null);
        })
        .catch(() => setTila("tyhja"));
    }, 400);
    return () => clearTimeout(ajastin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arvo, koriAvain]);
  return (
    <div>
      <Label htmlFor="kumppani" className="text-sm text-muted-foreground">Kumppanikoodi (valinnainen)</Label>
      <Input id="kumppani" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={40} value={arvo.toUpperCase()}
        onChange={(e) => setArvo(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
        className="bg-muted border-border mt-1 max-w-[240px]" placeholder="esim. ANNA-K" aria-describedby="kumppani-tila" />
      <p id="kumppani-tila" className="text-xs mt-1 min-h-[1rem]" role="status">
        {tila === "ok" && <span className="inline-flex items-center gap-1 text-primary font-medium"><Check className="h-3.5 w-3.5" /> {alennus && prosentti > 0 ? `Koodi ${arvo.toUpperCase()}: -${prosentti} %` : `Koodi ${arvo.toUpperCase()} hyväksytty`}</span>}
        {tila === "ok" && alennus && prosentti === 0 && syy && (
          <span className="block text-muted-foreground mt-0.5">{kumppaniSelitys(syy)}</span>
        )}
        {tila === "ei" && <span className="text-muted-foreground">Koodia {arvo.toUpperCase()} ei löytynyt. Tarkista kirjoitusasu.</span>}
      </p>
    </div>
  );
}
