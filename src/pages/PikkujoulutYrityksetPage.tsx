import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, PartyPopper } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { useProducts } from "@/hooks/use-products";
import { YritysJouluLaskuri } from "@/components/yritys/YritysOsat";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { buildFaqJsonLd } from "@/seo/structuredData";
import { SITE_URL } from "@/seo/site";
import { proxiedImage } from "@/lib/imageProxy";
import { kirjaaPikkujoulu } from "@/lib/pikkujouluSeuranta";
import { pikkujoulutYrityksetPage as page, PIKKUJOULU_OLETUSHINNAT } from "@/data/pikkujoulutYrityksetPage";
import {
  PIKKUJOULU_PAKETIT, PIKKUJOULU_KOOT, PIKKUJOULU_POLKU, PIKKUJOULU_SALLITUT, laskePikkujoulu, oletusValinta, designinNimi,
  sallitutKoot, korvaaPuuttuvat, tarkistaPikkujouluLomake,
} from "../../api/_lib/pikkujoulut.js";
import type { Product } from "@/types/product";

const meta = STATIC_PAGE_META[PIKKUJOULU_POLKU as "/pikkujoulut-yritykset"];
const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;
type Paketti = (typeof PIKKUJOULU_PAKETIT)[number];
type Valinta = { paketti: string; designit: string[]; koot: Record<string, number> };
type ArvioRivi = { nimi: string; kpl: number; yhteensa: number; perKpl: number; alennusProsentti: number; toimitus: number };

/** Paketin valinta: kolme korttia oletushinnoilla. */
function PakettiKortit({ valittu, valitse }: { valittu: string; valitse: (p: Paketti) => void }) {
  return (
    <section aria-labelledby="paketit" className="mb-8">
      <h2 id="paketit" className="font-display text-xl text-foreground mb-3">Valitse paketti</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PIKKUJOULU_PAKETIT.map((p) => {
          const h = PIKKUJOULU_OLETUSHINNAT.find((x) => x.id === p.id)!;
          const on = valittu === p.id;
          return (
            <div key={p.id} className={`rounded-xl border bg-card p-4 flex flex-col ${on ? "border-primary ring-1 ring-primary" : "border-border"}`}>
              <h3 className="font-display text-lg text-foreground">{p.nimi}</h3>
              <p className="text-sm text-muted-foreground mt-1">{p.kuvaus}</p>
              <p className="mt-3 text-sm text-foreground">
                <span className="text-2xl font-bold text-primary">{eur(h.perKpl)}</span>/paita
              </p>
              <p className="text-xs text-muted-foreground">
                {p.kpl} paitaa yhteensä {eur(h.yhteensa)}{h.alennusProsentti ? `, määräalennus -${h.alennusProsentti} %` : ""}, toimitus {h.toimitus ? eur(h.toimitus) : "ilmainen"}
              </p>
              <div className="mt-auto pt-3">
                <Button type="button" onClick={() => valitse(p)} variant={on ? "default" : "outline"} aria-pressed={on} className={on ? "bg-primary text-primary-foreground font-bold" : ""}>
                  {on ? <><Check className="h-4 w-4 mr-1" aria-hidden="true" /> Valittu</> : "Valitse paketti"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-2">{page.hintaehto}</p>
    </section>
  );
}

/** Designit: jokaisen paikalle voi vaihtaa toisen sallitun designin. */
function Designit({ valinta, setDesignit, tuotteet, saatavilla }: {
  valinta: Valinta; setDesignit: (d: string[]) => void; tuotteet: Map<string, Product>; saatavilla: (s: string) => boolean;
}) {
  return (
    <fieldset className="rounded-lg border border-border p-3">
      <legend className="px-1 text-sm font-medium text-foreground">Designit ({valinta.designit.length})</legend>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {valinta.designit.map((slug, i) => {
          const tuote = tuotteet.get(slug);
          const kuva = tuote?.images?.[0];
          const vaihtoehdot = PIKKUJOULU_SALLITUT.filter((s) => s === slug || (!valinta.designit.includes(s) && saatavilla(s)));
          return (
            <li key={`${i}-${slug}`} className="flex items-center gap-3 rounded-md border border-border p-2">
              {kuva ? <img src={proxiedImage(kuva, { width: 320 })} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 rounded object-cover bg-muted shrink-0" /> : <div className="h-14 w-14 rounded bg-muted shrink-0" aria-hidden="true" />}
              <div className="min-w-0 flex-1">
                <Link to={`/tuote/${slug}`} className="block text-sm font-medium text-foreground hover:text-primary truncate" target="_blank" rel="noopener">{designinNimi(slug)}</Link>
                <label className="sr-only" htmlFor={`pj-design-${i}`}>Vaihda design {i + 1}</label>
                <select id={`pj-design-${i}`} value={slug} onChange={(e) => { const d = [...valinta.designit]; d[i] = e.target.value; setDesignit(d); }}
                  className="mt-1 h-8 w-full rounded-md border border-border bg-muted px-1 text-xs">
                  {vaihtoehdot.map((s) => <option key={s} value={s}>{s === slug ? `${designinNimi(s)} (valittu)` : `Vaihda: ${designinNimi(s)}`}</option>)}
                </select>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground mt-2">{page.jako}</p>
    </fieldset>
  );
}

/** Kokojakauma S-3XL; koko on valittavissa, kun se löytyy vähintään yhdestä valitusta designista. */
function Koot({ valinta, kpl, setKoot }: { valinta: Valinta; kpl: number; setKoot: (k: Record<string, number>) => void }) {
  const saatavilla = sallitutKoot(valinta.designit);
  const summa = PIKKUJOULU_KOOT.reduce((s, k) => s + (valinta.koot[k] || 0), 0);
  return (
    <fieldset className="rounded-lg border border-border p-3">
      <legend className="px-1 text-sm font-medium text-foreground">Kokojakauma</legend>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {PIKKUJOULU_KOOT.map((k) => {
          const ok = saatavilla.includes(k);
          return (
            <label key={k} className={`text-xs ${ok ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
              {k}
              <Input inputMode="numeric" disabled={!ok && !valinta.koot[k]} value={valinta.koot[k] ? String(valinta.koot[k]) : ""} aria-label={`Koko ${k} kpl`}
                onChange={(e) => setKoot({ ...valinta.koot, [k]: Number(e.target.value.replace(/[^0-9]/g, "").slice(0, 3)) || 0 })}
                className="bg-muted border-border mt-0.5 h-9 px-2" />
            </label>
          );
        })}
      </div>
      <p className={`text-xs mt-2 ${summa === kpl ? "text-primary font-medium" : "text-destructive"}`} role="status">
        Yhteensä {summa} / {kpl} paitaa{summa === kpl ? "" : summa < kpl ? `: lisää vielä ${kpl - summa}` : `: poista ${summa - kpl}`}
      </p>
      {!saatavilla.includes("3XL") && <p className="text-xs text-muted-foreground mt-1">3XL: valitse design, jossa koko on saatavilla (esimerkiksi {designinNimi("huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-t-paita")}).</p>}
    </fieldset>
  );
}

const TYHJA = { yritys: "", ytunnus: "", nimi: "", email: "", puhelin: "", postinumero: "", kaupunki: "", logoToive: "", viesti: "", kotisivu: "" };

/** /pikkujoulut-yritykset: valmiit pikkujoulupaketit yrityksille (api/_lib/pikkujoulut.js). */
const PikkujoulutYrityksetPage = () => {
  usePrerenderReady();
  const canonical = `${SITE_URL}${PIKKUJOULU_POLKU}`;
  const [valinta, setValinta] = useState<Valinta>(() => oletusValinta(PIKKUJOULU_PAKETIT[1]));
  const [lomake, setLomake] = useState(TYHJA);
  const [tila, setTila] = useState<"lomake" | "lahetetaan" | "valmis">("lomake");
  const [virheet, setVirheet] = useState<string[]>([]);
  const [arvio, setArvio] = useState<ArvioRivi[]>([]);
  const aloitettu = useRef(Date.now());
  const lomakeRef = useRef<HTMLElement>(null);
  const paketti = PIKKUJOULU_PAKETIT.find((p) => p.id === valinta.paketti)!;

  // Myytävät designit: tuotelista (/api/products) ei sisällä piilotettuja eikä myynnistä poistettuja.
  const { data: tuotteet } = useProducts();
  const bySlug = useMemo(() => new Map((tuotteet || []).filter((p) => p.category === "t-paidat").map((p) => [p.slug, p])), [tuotteet]);
  const saatavilla = useMemo(() => (tuotteet ? (s: string) => bySlug.has(s) : () => true), [tuotteet, bySlug]);
  useEffect(() => {
    if (!tuotteet) return;
    setValinta((v) => { const d = korvaaPuuttuvat(v.designit, saatavilla); return d.join() === v.designit.join() ? v : { ...v, designit: d }; });
  }, [tuotteet, saatavilla]);

  useEffect(() => { kirjaaPikkujoulu("sivu"); }, []);

  const hinta = useMemo(() => laskePikkujoulu(valinta), [valinta]);
  const valitse = (p: Paketti) => {
    setValinta({ ...oletusValinta(p), designit: korvaaPuuttuvat([...p.designit], saatavilla) });
    kirjaaPikkujoulu("paketti", p.id);
  };
  const aseta = (k: keyof typeof TYHJA, v: string) => setLomake((l) => ({ ...l, [k]: v }));

  const laheta = async (e: React.FormEvent) => {
    e.preventDefault();
    const l = tarkistaPikkujouluLomake(lomake);
    const kaikki = [...(hinta.ok ? [] : hinta.virheet), ...l.virheet];
    if (kaikki.length) { setVirheet(kaikki); return; }
    setVirheet([]);
    setTila("lahetetaan");
    try {
      const r = await fetch("/api/sahkoposti", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tarjouspyynto", ...lomake, pikkujoulu: valinta, kesto: Date.now() - aloitettu.current }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) {
        setArvio(Array.isArray(j.arvio) ? j.arvio : []);
        setTila("valmis");
        kirjaaPikkujoulu("tarjous", valinta.paketti);
      } else {
        setTila("lomake");
        setVirheet([j?.error || "Lähetys epäonnistui. Lähetä pyyntö sähköpostilla huumorikauppa@gmail.com."]);
      }
    } catch {
      setTila("lomake");
      setVirheet(["Lähetys epäonnistui. Lähetä pyyntö sähköpostilla huumorikauppa@gmail.com."]);
    }
  };

  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <SEOHead
        title={meta.title}
        description={meta.description}
        canonical={canonical}
        breadcrumbs={[{ name: "Etusivu", url: `${SITE_URL}/` }, { name: "Yritykset", url: `${SITE_URL}/yritykset` }, { name: meta.name, url: canonical }]}
        jsonLd={buildFaqJsonLd(page.faqs)}
      />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4 flex items-center gap-3">
        <PartyPopper className="h-8 w-8 text-primary shrink-0" aria-hidden="true" /> {meta.h1}
      </h1>
      <YritysJouluLaskuri className="mb-4" />
      <div className="space-y-3 text-muted-foreground mb-6">
        {page.intro.map((p) => <p key={p}>{p}</p>)}
      </div>

      <PakettiKortit valittu={valinta.paketti} valitse={valitse} />

      <section ref={lomakeRef} id="tarjouspyynto" aria-labelledby="tarjouspyynto-otsikko" className="rounded-xl border border-border bg-card p-5 md:p-6 scroll-mt-24">
        <h2 id="tarjouspyynto-otsikko" className="font-display text-xl text-foreground mb-3">{paketti.nimi}: designit, koot ja tarjouspyyntö</h2>
        {tila === "valmis" ? (
          <div className="space-y-3" role="status">
            <p className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm text-foreground">
              <Check className="h-5 w-5 text-primary shrink-0" aria-hidden="true" /> Kiitos! Tarjouspyyntö on vastaanotettu, ja vastaamme sähköpostiin {lomake.email}.
            </p>
            {arvio.map((a) => (
              <p key={a.nimi} className="rounded-lg border border-border p-4 text-sm text-foreground" data-pikkujoulu-arvio>
                Hinta-arvio, {a.nimi}: <span className="font-bold text-primary">{eur(a.yhteensa)}</span> ({eur(a.perKpl)}/paita
                {a.alennusProsentti ? `, määräalennus -${a.alennusProsentti} %` : ""}, toimitus {a.toimitus ? eur(a.toimitus) : "ilmainen"}). Hinta sisältää ALV:n. Lopullinen hinta vahvistetaan tarjouksessa.
              </p>
            ))}
          </div>
        ) : (
          <form onSubmit={laheta} className="space-y-4" autoComplete="on" noValidate>
            <Designit valinta={valinta} setDesignit={(d) => setValinta((v) => ({ ...v, designit: d }))} tuotteet={bySlug} saatavilla={saatavilla} />
            <Koot valinta={valinta} kpl={paketti.kpl} setKoot={(k) => setValinta((v) => ({ ...v, koot: k }))} />

            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm text-foreground" role="status" aria-live="polite" data-pikkujoulu-hinta>
              {hinta.ok ? (
                <>
                  <p>
                    {paketti.kpl} paitaa: <span className="text-xl font-bold text-primary">{eur(hinta.yhteensa)}</span> ({eur(hinta.perKpl)}/paita
                    {hinta.alennusProsentti ? `, määräalennus -${hinta.alennusProsentti} %` : ""}).
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Sisältää ALV:n 25,5 % ja toimituksen ({hinta.toimitus ? eur(hinta.toimitus) : "ilmainen"}) yhteen osoitteeseen Suomessa. {page.maksu}</p>
                </>
              ) : (
                <ul className="text-destructive text-sm list-disc pl-5">{hinta.virheet.map((v) => <li key={v}>{v}</li>)}</ul>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pj-yritys">Yritys *</Label>
                <Input id="pj-yritys" autoComplete="organization" value={lomake.yritys} onChange={(e) => aseta("yritys", e.target.value)} maxLength={120} className="bg-muted border-border mt-1" />
              </div>
              <div>
                <Label htmlFor="pj-ytunnus">Y-tunnus (laskua varten)</Label>
                <Input id="pj-ytunnus" value={lomake.ytunnus} onChange={(e) => aseta("ytunnus", e.target.value)} maxLength={12} placeholder="1234567-8" className="bg-muted border-border mt-1" />
              </div>
              <div>
                <Label htmlFor="pj-nimi">Yhteyshenkilö *</Label>
                <Input id="pj-nimi" autoComplete="name" value={lomake.nimi} onChange={(e) => aseta("nimi", e.target.value)} maxLength={100} className="bg-muted border-border mt-1" />
              </div>
              <div>
                <Label htmlFor="pj-email">Sähköposti *</Label>
                <Input id="pj-email" type="email" inputMode="email" autoComplete="email" value={lomake.email} onChange={(e) => aseta("email", e.target.value)} maxLength={200} className="bg-muted border-border mt-1" />
              </div>
              <div>
                <Label htmlFor="pj-puhelin">Puhelin</Label>
                <Input id="pj-puhelin" type="tel" inputMode="tel" autoComplete="tel" value={lomake.puhelin} onChange={(e) => aseta("puhelin", e.target.value)} maxLength={40} className="bg-muted border-border mt-1" />
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-2">
                <div>
                  <Label htmlFor="pj-postinumero">Postinumero *</Label>
                  <Input id="pj-postinumero" inputMode="numeric" autoComplete="postal-code" value={lomake.postinumero} onChange={(e) => aseta("postinumero", e.target.value)} maxLength={5} className="bg-muted border-border mt-1" />
                </div>
                <div>
                  <Label htmlFor="pj-kaupunki">Paikkakunta *</Label>
                  <Input id="pj-kaupunki" autoComplete="address-level2" value={lomake.kaupunki} onChange={(e) => aseta("kaupunki", e.target.value)} maxLength={60} className="bg-muted border-border mt-1" />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="pj-logo">Logo- tai tekstitoive</Label>
              <Input id="pj-logo" value={lomake.logoToive} onChange={(e) => aseta("logoToive", e.target.value)} maxLength={500} placeholder="esim. yrityksen logo selkään tai teksti Pikkujoulut 2026" className="bg-muted border-border mt-1" />
            </div>
            <div>
              <Label htmlFor="pj-viesti">Viesti</Label>
              <Textarea id="pj-viesti" value={lomake.viesti} onChange={(e) => aseta("viesti", e.target.value)} maxLength={2000} rows={3} placeholder="esim. värit, designien jako tai toivottu toimituspäivä" className="bg-muted border-border mt-1" />
            </div>
            {/* Roskapostisuoja: ihmiset eivät näe kenttää. */}
            <input type="text" name="kotisivu" tabIndex={-1} autoComplete="off" value={lomake.kotisivu} onChange={(e) => aseta("kotisivu", e.target.value)} className="hidden" aria-hidden="true" />
            {virheet.length > 0 && <ul className="text-sm text-destructive list-disc pl-5" role="alert">{virheet.map((v) => <li key={v}>{v}</li>)}</ul>}
            <Button type="submit" disabled={tila === "lahetetaan"} className="bg-primary text-primary-foreground font-bold">
              {tila === "lahetetaan" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Lähetetään...</> : "Lähetä tarjouspyyntö"}
            </Button>
            <p className="text-xs text-muted-foreground">Tietoja käytetään vain tarjouspyyntöön vastaamiseen. <Link to="/tietosuojakaytanto" className="underline">Tietosuojakäytäntö</Link></p>
          </form>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-foreground mb-3">Usein kysyttyä</h2>
        <div className="space-y-4">
          {page.faqs.map((f) => (
            <div key={f.q}>
              <h3 className="font-medium text-foreground text-sm">{f.q}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <nav aria-label="Liittyvät sivut" className="mt-8 flex flex-wrap gap-2">
        {page.links.map((l) => (
          <Link key={l.href} to={l.href} className="inline-flex items-center px-3 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground hover:text-primary">{l.label}</Link>
        ))}
      </nav>
    </div>
  );
};

export default PikkujoulutYrityksetPage;
