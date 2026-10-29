import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MittaTaulukko } from "@/components/SizeGuide";
import { JouluTakarajaRivi } from "@/components/JouluTakaraja";
import { useCartContext } from "@/context/CartContext";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { useToast } from "@/hooks/use-toast";
import { mittataulukko } from "@/data/mittataulukot";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { SITE_URL } from "@/seo/site";
import { TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI, ILMAINEN_RAJA_TEKSTI } from "@/config/toimitus";
import {
  MALLIT, NIMI_MAX, PERSONOITU_HINTA, PERSONOITU_TUOTE, painokuvaSvg, personointiTeksti, tarkistaPersonointi,
} from "../../api/_lib/personoitu.js";
import type { Product } from "@/types/product";

const meta = STATIC_PAGE_META["/personoitu-paita"];
const VARIT: Record<string, string> = { Musta: "#1d1d1d", Valkoinen: "#f5f5f2", Vaaleanharmaa: "#b9bbbd", Tummansininen: "#1f2a44" };
const KOOT = PERSONOITU_TUOTE.variants.sizes as string[];
const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;

/** /personoitu-paita: nimi ja ikä paitaan, esikatselu ja koriin (api/_lib/personoitu.js, painokuva api/painokuva.js). */
const PersonalizedPage = () => {
  usePrerenderReady();
  const { addItem } = useCartContext();
  const { toast } = useToast();
  const [malli, setMalli] = useState("kokenut");
  const [nimi, setNimi] = useState("");
  const [ika, setIka] = useState("50");
  const [vari, setVari] = useState("Musta");
  const [koko, setKoko] = useState<string | undefined>();
  const valittu = MALLIT.find((m) => m.id === malli)!;
  const tarkistus = tarkistaPersonointi({ malli, nimi, ika });
  // Esikatselu: kirjoitettu nimi, tai esimerkkinimi kun kenttä on tyhjä.
  const esikatselu = useMemo(() => {
    const esim = tarkistaPersonointi({ malli, nimi: nimi.trim() || "Marja", ika: ika || "50" });
    return esim.ok ? painokuvaSvg(esim, vari, { fontti: "Anton, Impact, sans-serif" }) : null;
  }, [malli, nimi, ika, vari]);
  const cm = mittataulukko("amatimies-t-paita", KOOT);

  const lisaa = () => {
    if (!tarkistus.ok) { toast({ title: tarkistus.virhe, variant: "destructive" }); return; }
    if (!koko) { toast({ title: "Valitse koko", variant: "destructive" }); return; }
    addItem(PERSONOITU_TUOTE as unknown as Product, 1, koko, vari, personointiTeksti(tarkistus));
  };

  return (
    <div className="container py-8 md:py-12 max-w-5xl">
      <SEOHead
        title={meta.title}
        description={meta.description}
        canonical={`${SITE_URL}/personoitu-paita`}
        breadcrumbs={[{ name: "Etusivu", url: `${SITE_URL}/` }, { name: meta.name, url: `${SITE_URL}/personoitu-paita` }]}
      />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">{meta.h1}</h1>
      <p className="text-xl font-bold text-primary mb-1">{eur(PERSONOITU_HINTA)}</p>
      <ul className="text-[13px] text-muted-foreground space-y-1 mb-6">
        <li>Painetaan tilauksesta EU:ssa, toimitus {TOIMITUSAIKA_TEKSTI} arkipäivää</li>
        <li>Toimitus {TOIMITUSMAKSU_TEKSTI} €, ilmainen {ILMAINEN_RAJA_TEKSTI} eurosta</li>
        <JouluTakarajaRivi as="li" categories={["t-paidat"]} className="text-foreground" />
        <li>Personoidulla tuotteella ei ole 14 päivän palautusoikeutta, joten tarkista teksti ja koko. <Link to="/palautusehdot" className="underline">Palautusehdot</Link></li>
      </ul>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl overflow-hidden border border-border" style={{ background: VARIT[vari] }} aria-label="Esikatselu">
          {esikatselu && (
            <div className="aspect-[3461/3955] w-3/4 mx-auto my-6" dangerouslySetInnerHTML={{ __html: esikatselu.replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"') }} />
          )}
          <p className={`text-center text-xs pb-3 ${vari === "Musta" || vari === "Tummansininen" ? "text-white/70" : "text-black/60"}`}>Esikatselu painatuksesta (paidan etupuoli)</p>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-foreground block mb-2">Malli</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Malli">
              {MALLIT.map((m) => (
                <button key={m.id} type="button" role="radio" aria-checked={malli === m.id} onClick={() => setMalli(m.id)}
                  className={`px-3 h-9 rounded-md border text-sm ${malli === m.id ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {m.nimi}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label htmlFor="p-nimi">Nimi (enintään {NIMI_MAX} merkkiä)</Label>
              <Input id="p-nimi" value={nimi} maxLength={NIMI_MAX} onChange={(e) => setNimi(e.target.value)} placeholder="Marja" className="bg-muted border-border mt-1" autoComplete="off" />
            </div>
            {valittu.ika && (
              <div>
                <Label htmlFor="p-ika">Ikä</Label>
                <Input id="p-ika" value={ika} inputMode="numeric" maxLength={3} onChange={(e) => setIka(e.target.value.replace(/[^0-9]/g, ""))} className="bg-muted border-border mt-1" />
              </div>
            )}
          </div>
          {nimi && !tarkistus.ok && <p className="text-sm text-destructive" role="alert">{tarkistus.virhe}</p>}
          <div>
            <span className="text-sm font-medium text-foreground block mb-2">Väri: {vari}</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Väri">
              {Object.keys(VARIT).map((v) => (
                <button key={v} type="button" role="radio" aria-checked={vari === v} onClick={() => setVari(v)}
                  className={`px-3 h-9 rounded-md border text-sm ${vari === v ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{v}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-foreground block mb-2">Koko{koko ? `: ${koko}` : ""}</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Koko">
              {KOOT.map((k) => (
                <button key={k} type="button" role="radio" aria-checked={koko === k} onClick={() => setKoko(k)}
                  className={`min-w-[44px] px-3 h-9 rounded-md border text-sm ${koko === k ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{k}</button>
              ))}
            </div>
          </div>
          <Button size="lg" onClick={lisaa} className="w-full h-12 bg-primary text-primary-foreground font-bold">
            <ShoppingCart className="h-5 w-5 mr-2" /> Lisää koriin, {eur(PERSONOITU_HINTA)}
          </Button>
          {cm && (
            <section className="rounded-xl border border-border bg-card/50 p-4">
              <h2 className="font-display text-lg text-foreground mb-2">Kokotaulukko</h2>
              <MittaTaulukko taulukko={cm} />
            </section>
          )}
        </div>
      </div>

      <section className="mt-10 max-w-3xl space-y-3 text-muted-foreground">
        <h2 className="font-display text-xl text-foreground">Näin personointi toimii</h2>
        <p>Valitse malli ja kirjoita saajan nimi ja ikä. Esikatselu näyttää painettavan tekstin. Paita painetaan juuri tällä tekstillä tilauksen jälkeen, ja jokainen paita on tehty yhdelle saajalle.</p>
        <p>Paita on Gildan Softstyle 64000 -t-paita. Nimessä voi olla kirjaimia, välilyönti ja väliviiva, ja kirosanoja tai loukkaavia sanoja ei paineta.</p>
        <p>Lisää ideoita: <Link to="/blogi/lahja-naiselle-30v-40v-50v-60v" className="text-primary underline">lahja naiselle 30v-60v</Link> ja <Link to="/blogi/lahja-miehelle-30v-40v-50v-60v" className="text-primary underline">lahja miehelle 30v-60v</Link>.</p>
      </section>
    </div>
  );
};

export default PersonalizedPage;
