import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { BlogProductStrip } from "@/components/BlogProductStrip";
import { Button } from "@/components/ui/button";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { useProducts } from "@/hooks/use-products";
import { yrityksetPage as page, YRITYS_PAKETIT, YRITYS_JOULU_TEKSTI } from "@/data/yrityksetPage";
import { YRITYS_ALAT, YRITYS_ALA_POLKU } from "@/data/yritysAlat";
import { TYHJA_LOGO, type LogoValinta } from "@/components/LogoEditori";
import { Maaraalennus, OmaLogo, PikkujouluNosto, Tarjouspyynto, type Malli, YritysJouluLaskuri } from "@/components/yritys/YritysOsat";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { BLOG_END_COUNT, BLOG_PRODUCT_THEMES, selectBlogProducts } from "@/data/blogProducts";
import { buildFaqJsonLd } from "@/seo/structuredData";
import { SITE_URL } from "@/seo/site";

const meta = STATIC_PAGE_META["/yritykset"];
const theme = BLOG_PRODUCT_THEMES.ryhmatilaus;
const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;

/** Pakettitarjoukset: kolme tilannetta, esimerkkihinnat 10, 25 ja 50 paidalle, Pyydä tarjous -painike. */
function Paketit({ valitse }: { valitse: (id: string, malli: Malli) => void }) {
  return (
    <section aria-labelledby="paketit" className="mb-8">
      <h2 id="paketit" className="font-display text-xl text-foreground mb-3">Valmiit paketit</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {YRITYS_PAKETIT.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-4 flex flex-col">
            <h3 className="font-display text-lg text-foreground">{p.otsikko}</h3>
            <p className="text-sm text-muted-foreground mt-1">{p.kuvaus}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {p.esimerkit.map((e) => (
                <li key={e.kpl} className="flex justify-between gap-2"><span className="text-muted-foreground">{e.kpl} paitaa</span><span className="font-semibold text-foreground">{eur(e.yhteensa)} <span className="text-xs font-normal text-muted-foreground">({eur(e.perKpl)}/kpl)</span></span></li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-1">Määräalennus sisältyy, toimitus ilmainen. <Link to={p.linkki.href} className="text-primary underline">{p.linkki.label}</Link></p>
            <div className="mt-auto pt-3 flex flex-wrap gap-2">
              <Button type="button" onClick={() => valitse(p.id, p.malli)} className="bg-primary text-primary-foreground font-bold">Pyydä tarjous</Button>
              <Button asChild variant="outline"><Link to="/yritykset/tilaus">Tilaa heti</Link></Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** /yritykset: yritysten joululahjat ja tiimipaidat (sisältö src/data/yrityksetPage.ts). */
const BusinessPage = () => {
  usePrerenderReady();
  const canonical = `${SITE_URL}${page.path}`;
  const [paketti, setPaketti] = useState("");
  const [malli, setMalli] = useState<Malli>("tpaita");
  const [logo, setLogo] = useState<LogoValinta>(TYHJA_LOGO);
  const lomakeRef = useRef<HTMLElement>(null);
  const valitse = (id: string, m: Malli) => {
    setPaketti(id);
    setMalli(m);
    lomakeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
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
      <YritysJouluLaskuri className="mb-4" />
      <div className="space-y-3 text-muted-foreground mb-6">
        {page.intro.map((p) => <p key={p}>{p}</p>)}
      </div>

      <p className="mb-6 rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm text-foreground">
        <span className="font-semibold">Yritysten joululahjat:</span> tilaa ja maksa viimeistään {YRITYS_JOULU_TEKSTI}, niin paidat ovat perillä ennen joulua.{" "}
        <Link to="/yritykset/tilaus" className="text-primary underline">Tilaa koko tiimille</Link>
      </p>

      <PikkujouluNosto className="mb-6" />

      <Paketit valitse={valitse} />

      <OmaLogo logo={logo} setLogo={setLogo} pyydaTarjous={() => valitse("oma-logo", "logopaita")} />

      <Maaraalennus />

      <nav aria-labelledby="alat" className="mb-8">
        <h2 id="alat" className="font-display text-xl text-foreground mb-3">Paidat alasi mukaan</h2>
        <ul className="flex flex-wrap gap-2">
          {YRITYS_ALAT.map((a) => (
            <li key={a.slug}>
              <Link to={YRITYS_ALA_POLKU(a.slug)} className="inline-flex items-center px-3 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground hover:text-primary">{a.nimi}</Link>
            </li>
          ))}
        </ul>
      </nav>

      {page.sections.map((s) => (
        <section key={s.heading} className="mb-6">
          <h2 className="font-display text-xl text-foreground mb-2">{s.heading}</h2>
          {"items" in s && s.items && (
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
          )}
          {"paragraphs" in s && s.paragraphs?.map((p) => <p key={p} className="text-muted-foreground mb-2">{p}</p>)}
          {"links" in s && s.links && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">{s.links.map((l) => <Link key={l.href} to={l.href} className="text-primary underline text-sm">{l.label}</Link>)}</div>
          )}
        </section>
      ))}

      <BlogProductStrip theme={theme} products={products} count={BLOG_END_COUNT} variant="end" />

      <section ref={lomakeRef} id="tarjouspyynto" aria-labelledby="tarjouspyynto-otsikko" className="mt-10 rounded-xl border border-border bg-card p-5 md:p-6 scroll-mt-24">
        <h2 id="tarjouspyynto-otsikko" className="font-display text-xl text-foreground mb-3">Tarjouspyyntö{paketti === "oma-logo" ? ": oma logo tai teksti" : paketti ? `: ${YRITYS_PAKETIT.find((p) => p.id === paketti)?.otsikko}` : ""}</h2>
        <Tarjouspyynto paketti={paketti} malli={malli} setMalli={setMalli} logo={logo} setLogo={setLogo} />
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
