import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KumppaniKentta } from "@/components/KumppaniKentta";
import { useProducts } from "@/hooks/use-products";
import { useCartContext } from "@/context/CartContext";
import { availableColors, availableSizes } from "@/lib/variantAvailability";
import { sortSizes } from "@/lib/sortSizes";
import { kumppani } from "@/lib/kumppani";
import { SITE_URL } from "@/seo/site";
import { ILMAINEN_RAJA_TEKSTI } from "@/config/toimitus";
import { YRITYS_JOULU_TEKSTI } from "@/data/yrityksetPage";
import { rivinHinta } from "../../api/_lib/kokohinnat.js";
import { MAARAALENNUS } from "../../api/_lib/vakiot.js";
import { YRITYS_MIN_KPL, LASKU_MAKSUAIKA_PV } from "../../api/_lib/yritysmyynti.js";
import type { Product } from "@/types/product";

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Rivi = { slug: string; vari: string; koot: Record<string, string> };

/** Yksi design: värin valinta ja kappalemäärät kokotaulukkona. */
function RiviEditori({ rivi, tuote, kaikki, muuta, poista }: {
  rivi: Rivi; tuote: Product | undefined; kaikki: Product[]; muuta: (r: Rivi) => void; poista: () => void;
}) {
  const [haku, setHaku] = useState("");
  const osumat = useMemo(() => {
    const h = haku.trim().toLowerCase();
    return h.length < 2 ? [] : kaikki.filter((p) => p.name.toLowerCase().includes(h)).slice(0, 12);
  }, [haku, kaikki]);
  const varit = tuote ? availableColors(tuote, (tuote.variants?.colors || []) as string[], (tuote.variants?.sizes || []) as string[]) : [];
  const koot = tuote ? availableSizes(tuote, rivi.vari, sortSizes((tuote.variants?.sizes || []) as string[])) : [];
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {!tuote ? (
        <div>
          <Label htmlFor={`haku-${rivi.slug}`}>Hae design (t-paidat ja hupparit)</Label>
          <Input id={`haku-${rivi.slug}`} value={haku} onChange={(e) => setHaku(e.target.value)} placeholder="esim. Saatanan tunarit" className="bg-muted border-border mt-1" />
          {osumat.length > 0 && (
            <ul className="mt-2 max-h-64 overflow-auto rounded-md border border-border divide-y divide-border">
              {osumat.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => muuta({ slug: p.slug, vari: "", koot: {} })} className="w-full text-left px-3 py-2 text-sm hover:bg-muted">
                    {p.name} <span className="text-muted-foreground">{eur(p.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link to={`/tuote/${tuote.slug}`} className="font-medium text-foreground hover:text-primary">{tuote.name}</Link>
              <p className="text-sm text-muted-foreground">{eur(tuote.price)}/kpl</p>
            </div>
            <button type="button" onClick={poista} className="text-muted-foreground hover:text-destructive p-1" aria-label={`Poista ${tuote.name}`}><Trash2 className="h-4 w-4" /></button>
          </div>
          <div>
            <Label htmlFor={`vari-${rivi.slug}`}>Väri</Label>
            <select id={`vari-${rivi.slug}`} value={rivi.vari} onChange={(e) => muuta({ ...rivi, vari: e.target.value })} className="mt-1 h-10 w-full max-w-xs rounded-md border border-border bg-muted px-2 text-sm">
              <option value="">Valitse väri</option>
              {varit.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          {rivi.vari && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {koot.map((k) => (
                <label key={k} className="text-xs text-muted-foreground">
                  {k}{rivinHinta(tuote, k) !== tuote.price ? ` (${eur(rivinHinta(tuote, k))})` : ""}
                  <Input inputMode="numeric" value={rivi.koot[k] || ""} aria-label={`${tuote.name} ${k} kpl`}
                    onChange={(e) => muuta({ ...rivi, koot: { ...rivi.koot, [k]: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) } })}
                    className="bg-muted border-border mt-0.5 h-9 px-2" />
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * /yritykset/tilaus: iso tilaus (10+) taulukkona. Kortilla: rivit ostoskoriin ja tavalliselle kassalle (määräalennus
 * lasketaan siellä). Laskulla: api/checkout.js action "lasku" (Y-tunnus, Stripe-lasku 14 pv, painoon maksun jälkeen).
 */
const BusinessOrderPage = () => {
  const { data: kaikki = [] } = useProducts();
  const { addItem } = useCartContext();
  const navigate = useNavigate();
  const valikoima = useMemo(() => kaikki.filter((p) => p.category === "t-paidat" || p.category === "hupparit"), [kaikki]);
  const [rivit, setRivit] = useState<Rivi[]>([{ slug: "", vari: "", koot: {} }]);
  const [maksu, setMaksu] = useState<"kortti" | "lasku">("lasku");
  const [y, setY] = useState({ yritys: "", ytunnus: "", nimi: "", email: "", puhelin: "", osoite: "", postinumero: "", kaupunki: "", viite: "" });
  const [kumppaniKoodi, setKumppaniKoodi] = useState(() => kumppani() ?? "");
  const [tila, setTila] = useState<"lomake" | "lahetetaan" | "valmis">("lomake");
  const [virhe, setVirhe] = useState("");
  const [lasku, setLasku] = useState<{ url: string; summa: number } | null>(null);
  const aseta = (k: keyof typeof y, v: string) => setY((x) => ({ ...x, [k]: v }));

  const bySlug = useMemo(() => new Map(valikoima.map((p) => [p.slug, p])), [valikoima]);
  const kappaleet = useMemo(() => rivit.flatMap((r) => {
    const t = bySlug.get(r.slug);
    if (!t || !r.vari) return [];
    return Object.entries(r.koot).map(([koko, n]) => ({ tuote: t, koko, vari: r.vari, maara: Number(n) || 0 })).filter((x) => x.maara > 0);
  }), [rivit, bySlug]);
  const kpl = kappaleet.reduce((s, x) => s + x.maara, 0);
  const summa = kappaleet.reduce((s, x) => s + x.maara * rivinHinta(x.tuote, x.koko), 0);
  const tpaitoja = kappaleet.filter((x) => x.tuote.category === MAARAALENNUS.kategoria).reduce((s, x) => s + x.maara, 0);
  const porras = [...MAARAALENNUS.portaat].sort((a, b) => b.min - a.min).find((p) => tpaitoja >= p.min);

  const tilaa = async () => {
    setVirhe("");
    if (kpl < YRITYS_MIN_KPL && maksu === "lasku") { setVirhe(`Laskulla voi tilata vähintään ${YRITYS_MIN_KPL} tuotetta.`); return; }
    if (!kpl) { setVirhe("Lisää vähintään yksi tuote, väri ja määrä."); return; }
    if (maksu === "kortti") {
      for (const x of kappaleet) addItem(x.tuote, x.maara, x.koko, x.vari);
      navigate("/kassa");
      return;
    }
    if (!y.yritys.trim() || !y.ytunnus.trim() || !y.nimi.trim() || !EMAIL_RE.test(y.email.trim()) || !y.osoite.trim() || !/^\d{5}$/.test(y.postinumero) || !y.kaupunki.trim()) {
      setVirhe("Täytä yritys, Y-tunnus, yhteyshenkilö, sähköposti ja laskutusosoite.");
      return;
    }
    setTila("lahetetaan");
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lasku", yritys: y, kumppani: kumppaniKoodi.trim() || undefined,
          items: kappaleet.map((x) => ({ id: x.tuote.id, slug: x.tuote.slug, name: x.tuote.name, quantity: x.maara, size: x.koko, color: x.vari })),
        }),
      });
      const j = await r.json().catch(() => null);
      if (j?.ok) { setLasku({ url: j.lasku, summa: j.summa }); setTila("valmis"); }
      else { setVirhe(j?.error || "Laskun luonti epäonnistui. Yritä hetken kuluttua uudelleen."); setTila("lomake"); }
    } catch {
      setVirhe("Laskun luonti epäonnistui. Yritä hetken kuluttua uudelleen.");
      setTila("lomake");
    }
  };

  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <SEOHead title="Yritystilaus – Huumorikauppa" description="Iso tilaus yritykselle: koot taulukkona, maksu kortilla tai laskulla." canonical={`${SITE_URL}/yritykset/tilaus`} noindex={true} />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3 flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary shrink-0" aria-hidden="true" /> Yritystilaus
      </h1>
      <p className="text-muted-foreground mb-2">Valitse designit ja värit ja kirjoita määrät koon mukaan. Määräalennus lasketaan vähintään {MAARAALENNUS.portaat.map((p) => p.min).sort((a, b) => a - b)[0]} t-paidan tilauksesta automaattisesti.</p>
      <p className="text-sm text-foreground mb-6">Jouluksi: tilaa ja maksa viimeistään {YRITYS_JOULU_TEKSTI} <Link to="/yritykset" className="text-primary underline">Valmiit paketit ja tarjouspyyntö</Link></p>

      {tila === "valmis" && lasku ? (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-5 space-y-2" role="status">
          <p className="flex items-center gap-2 font-semibold text-foreground"><Check className="h-5 w-5 text-primary" /> Kiitos tilauksesta! Lasku {eur(lasku.summa)} on lähetetty osoitteeseen {y.email}.</p>
          <p className="text-sm text-muted-foreground">Maksuaika on {LASKU_MAKSUAIKA_PV} päivää. Paidat lähtevät painoon, kun lasku on maksettu, ja saatte tilausvahvistuksen sähköpostiin.</p>
          {lasku.url && <a href={lasku.url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">Avaa lasku</a>}
        </div>
      ) : (
        <div className="space-y-4">
          {rivit.map((r, i) => (
            <RiviEditori key={i} rivi={r} tuote={bySlug.get(r.slug)} kaikki={valikoima}
              muuta={(uusi) => setRivit((x) => x.map((v, j) => (j === i ? uusi : v)))}
              poista={() => setRivit((x) => (x.length > 1 ? x.filter((_, j) => j !== i) : [{ slug: "", vari: "", koot: {} }]))} />
          ))}
          <Button type="button" variant="outline" onClick={() => setRivit((x) => [...x, { slug: "", vari: "", koot: {} }])}><Plus className="h-4 w-4 mr-1" /> Lisää design</Button>

          <div className="rounded-xl border border-border bg-card p-4" role="status">
            <p className="text-foreground"><span className="font-semibold">{kpl} kpl</span>, tuotteet {eur(summa)}{porras ? `, määräalennus t-paidoista -${porras.prosentti} %` : ""}.</p>
            <p className="text-xs text-muted-foreground">Lopullinen hinta lasketaan kassalla tai laskulle. Toimitus on ilmainen {ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen.</p>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground mb-1">Maksutapa</legend>
            <label className="flex items-start gap-2 text-sm"><input type="radio" name="maksu" checked={maksu === "lasku"} onChange={() => setMaksu("lasku")} className="mt-1" />
              <span><span className="font-medium text-foreground">Lasku, maksuaika {LASKU_MAKSUAIKA_PV} päivää</span> <span className="text-muted-foreground">(yrityksille, joilla on Y-tunnus, vähintään {YRITYS_MIN_KPL} tuotetta; paidat painetaan maksun jälkeen)</span></span></label>
            <label className="flex items-start gap-2 text-sm"><input type="radio" name="maksu" checked={maksu === "kortti"} onChange={() => setMaksu("kortti")} className="mt-1" />
              <span><span className="font-medium text-foreground">Kortti, Apple Pay, Google Pay, Klarna tai MobilePay</span> <span className="text-muted-foreground">(tuotteet ostoskoriin ja kassalle)</span></span></label>
          </fieldset>

          {maksu === "lasku" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                ["yritys", "Yritys *", "organization"], ["ytunnus", "Y-tunnus *", "off"], ["nimi", "Yhteyshenkilö *", "name"], ["email", "Sähköposti laskulle *", "email"],
                ["puhelin", "Puhelin", "tel"], ["viite", "Viite tai tilausnumero", "off"], ["osoite", "Laskutus- ja toimitusosoite *", "street-address"],
                ["postinumero", "Postinumero *", "postal-code"], ["kaupunki", "Kaupunki *", "address-level2"],
              ] as const).map(([k, nimi, ac]) => (
                <div key={k}>
                  <Label htmlFor={`y-${k}`}>{nimi}</Label>
                  <Input id={`y-${k}`} autoComplete={ac} value={y[k]} onChange={(e) => aseta(k, e.target.value)} maxLength={k === "postinumero" ? 5 : 200}
                    inputMode={k === "postinumero" ? "numeric" : k === "email" ? "email" : undefined} className="bg-muted border-border mt-1" />
                </div>
              ))}
            </div>
          )}

          <KumppaniKentta arvo={kumppaniKoodi} setArvo={setKumppaniKoodi} />

          {virhe && <p className="text-sm text-destructive" role="alert">{virhe}</p>}
          <Button type="button" size="lg" onClick={tilaa} disabled={tila === "lahetetaan"} className="bg-primary text-primary-foreground font-bold">
            {tila === "lahetetaan" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Luodaan laskua...</> : maksu === "lasku" ? "Tilaa laskulla" : "Siirry kassalle"}
          </Button>
          <p className="text-xs text-muted-foreground">Myyjä Uusiku Oy, Y-tunnus 3653666-7. <Link to="/toimitusehdot" className="underline">Toimitusehdot</Link></p>
        </div>
      )}
    </div>
  );
};

export default BusinessOrderPage;
