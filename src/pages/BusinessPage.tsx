import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Check, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { BlogProductStrip } from "@/components/BlogProductStrip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { useProducts } from "@/hooks/use-products";
import { yrityksetPage as page } from "@/data/yrityksetPage";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { BLOG_END_COUNT, BLOG_PRODUCT_THEMES, selectBlogProducts } from "@/data/blogProducts";
import { buildFaqJsonLd } from "@/seo/structuredData";
import { SITE_URL } from "@/seo/site";

const meta = STATIC_PAGE_META["/yritykset"];
const theme = BLOG_PRODUCT_THEMES.ryhmatilaus;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Tarjouspyyntölomake: /api/sahkoposti action "tarjouspyynto" (tallennus kantaan ja ilmoitus omistajalle). */
function Tarjouspyynto() {
  const [lomake, setLomake] = useState({ yritys: "", nimi: "", email: "", puhelin: "", maara: "", viesti: "", kotisivu: "" });
  const [tila, setTila] = useState<"lomake" | "lahetetaan" | "valmis" | "virhe">("lomake");
  const [virhe, setVirhe] = useState("");
  const aseta = (k: keyof typeof lomake, v: string) => setLomake((l) => ({ ...l, [k]: v }));

  const laheta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lomake.yritys.trim() || !lomake.nimi.trim() || !EMAIL_RE.test(lomake.email.trim())) {
      setVirhe("Täytä yritys, nimi ja toimiva sähköpostiosoite.");
      return;
    }
    setVirhe("");
    setTila("lahetetaan");
    try {
      const r = await fetch("/api/sahkoposti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tarjouspyynto", ...lomake }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) setTila("valmis");
      else { setTila("virhe"); setVirhe(j?.error || "Lähetys epäonnistui. Lähetä pyyntö sähköpostilla huumorikauppa@gmail.com."); }
    } catch {
      setTila("virhe");
      setVirhe("Lähetys epäonnistui. Lähetä pyyntö sähköpostilla huumorikauppa@gmail.com.");
    }
  };

  if (tila === "valmis") {
    return (
      <p className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm text-foreground" role="status">
        <Check className="h-5 w-5 text-primary shrink-0" aria-hidden="true" /> Kiitos! Tarjouspyyntö on vastaanotettu, ja vastaamme sähköpostiin {lomake.email}.
      </p>
    );
  }

  return (
    <form onSubmit={laheta} className="space-y-3" autoComplete="on">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ty-yritys">Yritys *</Label>
          <Input id="ty-yritys" autoComplete="organization" value={lomake.yritys} onChange={(e) => aseta("yritys", e.target.value)} maxLength={120} className="bg-muted border-border mt-1" />
        </div>
        <div>
          <Label htmlFor="ty-nimi">Yhteyshenkilö *</Label>
          <Input id="ty-nimi" autoComplete="name" value={lomake.nimi} onChange={(e) => aseta("nimi", e.target.value)} maxLength={100} className="bg-muted border-border mt-1" />
        </div>
        <div>
          <Label htmlFor="ty-email">Sähköposti *</Label>
          <Input id="ty-email" type="email" inputMode="email" autoComplete="email" value={lomake.email} onChange={(e) => aseta("email", e.target.value)} maxLength={200} className="bg-muted border-border mt-1" />
        </div>
        <div>
          <Label htmlFor="ty-puhelin">Puhelin</Label>
          <Input id="ty-puhelin" type="tel" inputMode="tel" autoComplete="tel" value={lomake.puhelin} onChange={(e) => aseta("puhelin", e.target.value)} maxLength={40} className="bg-muted border-border mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="ty-maara">Arvioitu määrä (kpl)</Label>
        <Input id="ty-maara" inputMode="numeric" value={lomake.maara} onChange={(e) => aseta("maara", e.target.value.replace(/[^0-9]/g, ""))} maxLength={5} className="bg-muted border-border mt-1 max-w-[160px]" />
      </div>
      <div>
        <Label htmlFor="ty-viesti">Mitä tarvitsette?</Label>
        <Textarea id="ty-viesti" value={lomake.viesti} onChange={(e) => aseta("viesti", e.target.value)} maxLength={2000} rows={4} placeholder="Esimerkiksi tuotteet, koot, toivottu toimituspäivä ja laskutustiedot" className="bg-muted border-border mt-1" />
      </div>
      {/* Roskapostisuoja: ihmiset eivät näe kenttää. */}
      <input type="text" name="kotisivu" tabIndex={-1} autoComplete="off" value={lomake.kotisivu} onChange={(e) => aseta("kotisivu", e.target.value)} className="hidden" aria-hidden="true" />
      {virhe && <p className="text-sm text-destructive" role="alert">{virhe}</p>}
      <Button type="submit" disabled={tila === "lahetetaan"} className="bg-primary text-primary-foreground font-bold">
        {tila === "lahetetaan" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Lähetetään...</> : "Lähetä tarjouspyyntö"}
      </Button>
      <p className="text-xs text-muted-foreground">Tietoja käytetään vain tarjouspyyntöön vastaamiseen. <Link to="/tietosuojakaytanto" className="underline">Tietosuojakäytäntö</Link></p>
    </form>
  );
}

/** /yritykset: yritysten joululahjat ja tiimipaidat (sisältö src/data/yrityksetPage.ts). */
const BusinessPage = () => {
  usePrerenderReady();
  const canonical = `${SITE_URL}${page.path}`;
  const { data: allProducts, isError } = useProducts();
  const products = useMemo(
    () => (allProducts ? selectBlogProducts(theme, allProducts, BLOG_END_COUNT) : isError ? [] : null),
    [allProducts, isError],
  );

  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <SEOHead
        title={meta.title}
        description={meta.description}
        canonical={canonical}
        breadcrumbs={[{ name: "Etusivu", url: `${SITE_URL}/` }, { name: meta.name, url: canonical }]}
        jsonLd={buildFaqJsonLd(page.faqs)}
      />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4 flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary shrink-0" aria-hidden="true" /> {meta.h1}
      </h1>
      <div className="space-y-3 text-muted-foreground mb-6">
        {page.intro.map((p) => <p key={p}>{p}</p>)}
      </div>

      <section aria-labelledby="portaat" className="mb-8">
        <h2 id="portaat" className="font-display text-xl text-foreground mb-3">Määräalennus t-paidoista</h2>
        <div className="grid grid-cols-3 gap-3">
          {page.portaat.map((p) => (
            <div key={p.teksti} className="rounded-xl border border-primary/40 bg-primary/5 p-4 text-center">
              <p className="text-sm text-muted-foreground">{p.teksti}</p>
              <p className="text-2xl font-bold text-primary">-{p.prosentti} %</p>
            </div>
          ))}
        </div>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {page.esimerkit.map((e) => (
            <li key={e.kpl}>{e.kpl} t-paitaa: {e.ennen}, määräalennus -{e.prosentti} % = <span className="font-semibold text-foreground">{e.jalkeen}</span>, toimitus ilmainen</li>
          ))}
        </ul>
      </section>

      {page.sections.map((s) => (
        <section key={s.heading} className="mb-6">
          <h2 className="font-display text-xl text-foreground mb-2">{s.heading}</h2>
          {"items" in s && s.items && (
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
          )}
          {"paragraphs" in s && s.paragraphs?.map((p) => <p key={p} className="text-muted-foreground mb-2">{p}</p>)}
          {"links" in s && s.links?.map((l) => <Link key={l.href} to={l.href} className="text-primary underline text-sm">{l.label}</Link>)}
        </section>
      ))}

      <BlogProductStrip theme={theme} products={products} count={BLOG_END_COUNT} variant="end" />

      <section id="tarjouspyynto" aria-labelledby="tarjouspyynto-otsikko" className="mt-10 rounded-xl border border-border bg-card p-5 md:p-6 scroll-mt-24">
        <h2 id="tarjouspyynto-otsikko" className="font-display text-xl text-foreground mb-3">Tarjouspyyntö</h2>
        <Tarjouspyynto />
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

export default BusinessPage;
