import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Building2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { BlogProductStrip } from "@/components/BlogProductStrip";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { useProducts } from "@/hooks/use-products";
import { YRITYS_JOULU_TEKSTI } from "@/data/yrityksetPage";
import { YRITYS_ALAT, YRITYS_ALA_POLKU, yritysAla, type YritysAla } from "@/data/yritysAlat";
import { yritysAlaFaqs, yritysAlaTeema, valitseAlanTuotteet } from "@/data/yritysAlaSivu";
import { TYHJA_LOGO, type LogoValinta } from "@/components/LogoEditori";
import { Maaraalennus, OmaLogo, Tarjouspyynto, type Malli } from "@/components/yritys/YritysOsat";
import { buildFaqJsonLd } from "@/seo/structuredData";
import { SITE_URL } from "@/seo/site";
import NotFound from "./NotFound";

/**
 * /yritykset/<ala> (2.11.2026): alakohtainen yritysmyyntisivu (data src/data/yritysAlat.ts). Alan paidat, oma logo
 * tai teksti, määräalennus, joulutakaraja ja tarjouspyyntö, jonka Ala-kenttä on esitäytetty.
 */
function AlaSivu({ ala }: { ala: YritysAla }) {
  usePrerenderReady();
  const polku = YRITYS_ALA_POLKU(ala.slug);
  const canonical = `${SITE_URL}${polku}`;
  const theme = useMemo(() => yritysAlaTeema(ala), [ala]);
  const faqs = useMemo(() => yritysAlaFaqs(ala), [ala]);
  const [malli, setMalli] = useState<Malli>("tpaita");
  const [paketti, setPaketti] = useState(`ala-${ala.slug}`);
  const [logo, setLogo] = useState<LogoValinta>(TYHJA_LOGO);
  const lomakeRef = useRef<HTMLElement>(null);
  const { data: allProducts, isError } = useProducts();
  const products = useMemo(
    () => (allProducts ? valitseAlanTuotteet(ala, allProducts) : isError ? [] : null),
    [ala, allProducts, isError],
  );
  const pyydaLogoTarjous = () => {
    setPaketti(`ala-${ala.slug}-oma-logo`);
    setMalli("logopaita");
    lomakeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <SEOHead
        title={ala.metaTitle}
        description={ala.description}
        canonical={canonical}
        breadcrumbs={[{ name: "Etusivu", url: `${SITE_URL}/` }, { name: "Yritykset", url: `${SITE_URL}/yritykset` }, { name: ala.nimi, url: canonical }]}
        jsonLd={buildFaqJsonLd(faqs)}
      />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4 flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary shrink-0" aria-hidden="true" /> {ala.h1}
      </h1>
      <div className="space-y-3 text-muted-foreground mb-6">
        {ala.intro.map((p) => <p key={p}>{p}</p>)}
      </div>

      <p className="mb-6 rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm text-foreground">
        <span className="font-semibold">Joulun yritystilaukset:</span> tilaa ja maksa viimeistään {YRITYS_JOULU_TEKSTI}, niin paidat ovat perillä ennen joulua.{" "}
        <a href="#tarjouspyynto" className="text-primary underline">Pyydä tarjous</a>
      </p>

      <BlogProductStrip theme={theme} products={products} count={ala.tuotteet.length} variant="mid" />

      <OmaLogo logo={logo} setLogo={setLogo} pyydaTarjous={pyydaLogoTarjous} />

      <section aria-labelledby="ideat" className="mb-8">
        <h2 id="ideat" className="font-display text-xl text-foreground mb-2">Ideoita omaan paitaan</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">{ala.ideat.map((i) => <li key={i}>{i}</li>)}</ul>
      </section>

      <Maaraalennus />

      <section ref={lomakeRef} id="tarjouspyynto" aria-labelledby="tarjouspyynto-otsikko" className="mt-10 rounded-xl border border-border bg-card p-5 md:p-6 scroll-mt-24">
        <h2 id="tarjouspyynto-otsikko" className="font-display text-xl text-foreground mb-3">Tarjouspyyntö: {ala.nimi}</h2>
        <Tarjouspyynto key={ala.slug} paketti={paketti} malli={malli} setMalli={setMalli} logo={logo} setLogo={setLogo} ala={ala.nimi} />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-foreground mb-3">Usein kysyttyä</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="font-medium text-foreground text-sm">{f.q}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <nav aria-label="Muut alat" className="mt-8">
        <p className="text-sm font-semibold text-foreground mb-2">Paidat muille aloille:</p>
        <ul className="flex flex-wrap gap-2">
          <li><Link to="/yritykset" className="inline-flex items-center px-3 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground hover:text-primary">Kaikki yrityksille</Link></li>
          {YRITYS_ALAT.filter((a) => a.slug !== ala.slug).map((a) => (
            <li key={a.slug}>
              <Link to={YRITYS_ALA_POLKU(a.slug)} className="inline-flex items-center px-3 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground hover:text-primary">{a.nimi}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

const BusinessVerticalPage = () => {
  const { ala: slug } = useParams();
  const ala = yritysAla(slug);
  return ala ? <AlaSivu key={ala.slug} ala={ala} /> : <NotFound />;
};

export default BusinessVerticalPage;
