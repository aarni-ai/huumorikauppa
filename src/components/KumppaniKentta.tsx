import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Kassan Kumppanikoodi-kenttä ja näkyvä vahvistus (api/checkout.js action "kumppanikoodi"). Koodi täyttyy
 * kumppanilinkistä ?ref= (src/lib/kumppani.ts); kirjainkoolla ei ole väliä.
 */
export function KumppaniKentta({ arvo, setArvo }: { arvo: string; setArvo: (v: string) => void }) {
  const [tila, setTila] = useState<"tyhja" | "tarkistetaan" | "ok" | "ei">("tyhja");
  useEffect(() => {
    const koodi = arvo.trim();
    if (koodi.length < 2) { setTila("tyhja"); return; }
    setTila("tarkistetaan");
    const ajastin = setTimeout(() => {
      fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "kumppanikoodi", code: koodi }) })
        .then((r) => r.json())
        .then((j) => setTila(j?.ok ? "ok" : "ei"))
        .catch(() => setTila("tyhja"));
    }, 400);
    return () => clearTimeout(ajastin);
  }, [arvo]);
  return (
    <div>
      <Label htmlFor="kumppani" className="text-sm text-muted-foreground">Kumppanikoodi (valinnainen)</Label>
      <Input id="kumppani" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={40} value={arvo.toUpperCase()}
        onChange={(e) => setArvo(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
        className="bg-muted border-border mt-1 max-w-[240px]" placeholder="esim. ANNA-K" aria-describedby="kumppani-tila" />
      <p id="kumppani-tila" className="text-xs mt-1 min-h-[1rem]" role="status">
        {tila === "ok" && <span className="inline-flex items-center gap-1 text-primary font-medium"><Check className="h-3.5 w-3.5" /> Koodi {arvo.toUpperCase()} hyväksytty</span>}
        {tila === "ei" && <span className="text-muted-foreground">Koodia {arvo.toUpperCase()} ei löytynyt. Tarkista kirjoitusasu.</span>}
      </p>
    </div>
  );
}
