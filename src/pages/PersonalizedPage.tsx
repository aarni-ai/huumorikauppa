import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MittaTaulukko } from "@/components/SizeGuide";
import { JouluTakarajaRivi } from "@/components/JouluTakaraja";
import { PersonoituMockup, TUOTEVARIT } from "@/components/PersonoituMockup";
import { useCartContext } from "@/context/CartContext";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { useToast } from "@/hooks/use-toast";
import { mittataulukko } from "@/data/mittataulukot";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { SITE_URL } from "@/seo/site";
import { TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI, ILMAINEN_RAJA_TEKSTI } from "@/config/toimitus";
import {
  AIHEET, MALLIT, NIMI_MAX, PERSONOIDUT_TUOTTEET, malli as haeMalli, mallinKentat, personointiTeksti, tarkistaPersonointi,
} from "../../api/_lib/personoitu.js";
import { rivinHinta } from "../../api/_lib/kokohinnat.js";
import type { Product } from "@/types/product";

const meta = STATIC_PAGE_META["/personoitu-paita"];
const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;
type Tuote = "t-paita" | "huppari";
type Kentta = "nimi" | "nimi2" | "vuosi" | "ika";
const KENTTA_NIMI: Record<Kentta, string> = { nimi: "Nimi", nimi2: "Toinen nimi", vuosi: "Vuosi", ika: "Ikä" };
/** Kokotaulukko saman pohjan tuotteelta (src/data/mittataulukot.ts: t-paita bp 145, huppari bp 77). */
const MITTASLUG: Record<Tuote, string> = { "t-paita": "amatimies-t-paita", huppari: "100-elakelainen-huppari" };

/**
 * /personoitu-paita?malli=<id>&tuote=huppari: personoidut lahjat (api/_lib/personoitu.js). Mallin kentät, merkkilaskuri,
 * esikatselu tuotteen päällä (sama painokuvaSvg kuin palvelimen PNG, api/painokuva.js) ja sama tarkistus kuin kassassa
 * (kirosanat, tavaramerkit, mahtuminen painoalueelle) ennen koriin lisäystä.
 */
const PersonalizedPage = () => {
  usePrerenderReady();
  const { addItem } = useCartContext();
  const { toast } = useToast();
  const [haku, setHaku] = useSearchParams();
  const malliId = haeMalli(haku.get("malli")) ? haku.get("malli")! : "paras-isa";
  const tuote: Tuote = haku.get("tuote") === "huppari" ? "huppari" : "t-paita";
  const asetaHaku = (muutos: Record<string, string | null>) => {
    const q = new URLSearchParams(haku);
    for (const [k, v] of Object.entries(muutos)) if (v) q.set(k, v); else q.delete(k);
    setHaku(q, { replace: true });
  };
  const [arvot, setArvot] = useState<Record<Kentta, string>>({ nimi: "", nimi2: "", vuosi: "", ika: "" });
  const [vari, setVari] = useState("Musta");
  const [koko, setKoko] = useState<string | undefined>();
  const valittu = haeMalli(malliId)!;
  const kentat = mallinKentat(valittu) as Kentta[];
  const tuoterivi = PERSONOIDUT_TUOTTEET[tuote];
  const variantit = tuoterivi.variants.variant_map as Record<string, number>;
  const koot = (tuoterivi.variants.sizes as string[]).filter((k) => `${vari}|${k}` in variantit);
  const kokoOk = koko && koot.includes(koko) ? koko : undefined;
  const hinta = Number(rivinHinta(tuoterivi, kokoOk ?? null));
  const kirjoitettu = kentat.some((k) => arvot[k].trim());
  const tarkistus = tarkistaPersonointi({ malli: malliId, ...arvot }, { tuote });

  // Esikatselu: kirjoitetut arvot, tyhjät kentät mallin esimerkistä. Kelvoton teksti näytetään esimerkkinä.
  const esikatselu = useMemo(() => {
    const yhdistetty = Object.fromEntries(kentat.map((k) => [k, arvot[k].trim() || String(valittu.esimerkki[k] ?? "")]));
    const t = tarkistaPersonointi({ malli: malliId, ...yhdistetty }, { tuote });
    return t.ok ? t : tarkistaPersonointi({ malli: malliId, ...valittu.esimerkki }, { tuote });
  }, [malliId, arvot, tuote, kentat, valittu]);
  const cm = mittataulukko(MITTASLUG[tuote], tuoterivi.variants.sizes as string[]);

  const lisaa = () => {
    if (!tarkistus.ok) { toast({ title: tarkistus.virhe, variant: "destructive" }); return; }
    if (!kokoOk) { toast({ title: "Valitse koko", variant: "destructive" }); return; }
    addItem(tuoterivi as unknown as Product, 1, kokoOk, vari, personointiTeksti(tarkistus));
  };

  const valintaNappi = (aktiivinen: boolean) => `px-3 h-9 rounded-md border text-sm ${aktiivinen ? "border-primary bg-primary text-primary-foreground" : "border-border"}`;

  return (
    <div className="container py-8 md:py-12 max-w-5xl">
      <SEOHead
        title={meta.title}
        description={meta.description}
        canonical={`${SITE_URL}/personoitu-paita`}
        breadcrumbs={[{ name: "Etusivu", url: `${SITE_URL}/` }, { name: "Personoidut lahjat", url: `${SITE_URL}/personoidut` }, { name: meta.name, url: `${SITE_URL}/personoitu-paita` }]}
      />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">{meta.h1}</h1>
      <p className="text-xl font-bold text-primary mb-1">{eur(hinta)}</p>
      <ul className="text-[13px] text-muted-foreground space-y-1 mb-6">
        <li>Painetaan tilauksesta EU:ssa, toimitus {TOIMITUSAIKA_TEKSTI} arkipäivää</li>
        <li>Ilmainen toimitus kahdesta tuotteesta tai {ILMAINEN_RAJA_TEKSTI} eurosta, muuten {TOIMITUSMAKSU_TEKSTI} €</li>
        <JouluTakarajaRivi as="li" categories={[tuote === "huppari" ? "hupparit" : "t-paidat"]} className="text-foreground" />
        <li>Personoidulla tuotteella ei ole 14 päivän palautusoikeutta, joten tarkista teksti ja koko. <Link to="/palautusehdot" className="underline">Palautusehdot</Link></li>
      </ul>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-muted/40 p-4" aria-label="Esikatselu">
          <PersonoituMockup pers={esikatselu.ok ? esikatselu : null} vari={vari} tuote={tuote} className="w-full h-auto" />
          <p className="text-center text-xs text-muted-foreground pt-2">Esikatselu painatuksesta ({tuote === "huppari" ? "hupparin" : "paidan"} etupuoli)</p>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-foreground block mb-2">Tuote</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tuote">
              {(["t-paita", "huppari"] as Tuote[]).map((t) => (
                <button key={t} type="button" role="radio" aria-checked={tuote === t} onClick={() => asetaHaku({ tuote: t === "huppari" ? "huppari" : null })} className={valintaNappi(tuote === t)}>
                  {t === "huppari" ? `Huppari ${eur(PERSONOIDUT_TUOTTEET.huppari.price)}` : `T-paita ${eur(PERSONOIDUT_TUOTTEET["t-paita"].price)}`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="p-malli">Malli</Label>
            <select id="p-malli" value={malliId} onChange={(e) => asetaHaku({ malli: e.target.value })}
              className="mt-1 w-full h-10 rounded-md border border-border bg-muted px-3 text-sm">
              {Object.entries(AIHEET).map(([aihe, otsikko]) => (
                <optgroup key={aihe} label={String(otsikko)}>
                  {MALLIT.filter((m) => m.aihe === aihe).map((m) => <option key={m.id} value={m.id}>{m.nimi}</option>)}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">{valittu.kuvaus}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {kentat.map((k) => {
              const nimiKentta = k === "nimi" || k === "nimi2";
              const raja = valittu.kentat[k] as [number, number] | true;
              return (
                <div key={k} className={nimiKentta ? "col-span-2 sm:col-span-1" : ""}>
                  <Label htmlFor={`p-${k}`}>
                    {KENTTA_NIMI[k]}{Array.isArray(raja) ? ` (${raja[0]}-${raja[1]})` : ""}
                  </Label>
                  <Input id={`p-${k}`} value={arvot[k]} autoComplete="off" className="bg-muted border-border mt-1"
                    placeholder={String(valittu.esimerkki[k] ?? "")}
                    {...(nimiKentta ? { maxLength: NIMI_MAX } : { inputMode: "numeric" as const, maxLength: 4 })}
                    aria-describedby={nimiKentta ? `p-${k}-laskuri` : undefined}
                    onChange={(e) => setArvot((a) => ({ ...a, [k]: nimiKentta ? e.target.value : e.target.value.replace(/[^0-9]/g, "") }))} />
                  {nimiKentta && (
                    <span id={`p-${k}-laskuri`} className={`block text-xs mt-1 ${arvot[k].length >= NIMI_MAX ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">
                      {arvot[k].length}/{NIMI_MAX} merkkiä
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {kirjoitettu && !tarkistus.ok && <p className="text-sm text-destructive" role="alert">{tarkistus.virhe}</p>}
          <div>
            <span className="text-sm font-medium text-foreground block mb-2">Väri: {vari}</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Väri">
              {Object.keys(TUOTEVARIT).map((v) => (
                <button key={v} type="button" role="radio" aria-checked={vari === v} onClick={() => setVari(v)} className={valintaNappi(vari === v)}>{v}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-foreground block mb-2">Koko{kokoOk ? `: ${kokoOk}` : ""}</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Koko">
              {koot.map((k) => (
                <button key={k} type="button" role="radio" aria-checked={kokoOk === k} onClick={() => setKoko(k)} className={`min-w-[44px] ${valintaNappi(kokoOk === k)}`}>{k}</button>
              ))}
            </div>
            {tuote === "huppari" && <p className="text-xs text-muted-foreground mt-1">Huppari 3XL-5XL {eur(Number(rivinHinta(tuoterivi, "3XL")))}. Koot 4XL ja 5XL mustana ja valkoisena.</p>}
          </div>
          <Button size="lg" onClick={lisaa} disabled={kirjoitettu && !tarkistus.ok} className="w-full h-12 bg-primary text-primary-foreground font-bold">
            <ShoppingCart className="h-5 w-5 mr-2" /> Lisää koriin, {eur(hinta)}
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
        <p>Valitse tuote ja malli ja kirjoita saajan nimi, vuosiluku tai ikä. Esikatselu näyttää painettavan tekstin. Tuote painetaan juuri tällä tekstillä tilauksen jälkeen, ja jokainen tuote tehdään yhdelle saajalle.</p>
        <p>T-paita on Gildan Softstyle 64000 ja huppari Gildan Heavy Blend 18500. Nimessä voi olla kirjaimia, välilyönti ja väliviiva. Kirosanoja, loukkaavia sanoja, tuotemerkkejä, hahmoja ja joukkueiden nimiä ei paineta, ja liian pitkä teksti pitää lyhentää, jotta se mahtuu painoalueelle.</p>
        <p>Kaikki mallit samalla sivulla: <Link to="/personoidut" className="text-primary underline">personoidut lahjat</Link>. Lisää ideoita: <Link to="/blogi/lahja-naiselle-30v-40v-50v-60v" className="text-primary underline">lahja naiselle 30v-60v</Link> ja <Link to="/blogi/lahja-miehelle-30v-40v-50v-60v" className="text-primary underline">lahja miehelle 30v-60v</Link>.</p>
      </section>
    </div>
  );
};

export default PersonalizedPage;
