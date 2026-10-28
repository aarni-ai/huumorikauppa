import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Download, Mail } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { useProducts } from "@/hooks/use-products";
import { getStaticPageMeta } from "@/seo/staticPageMeta";
import { SITE_URL, formatPriceFi } from "@/seo/site";
import { proxiedImage } from "@/lib/imageProxy";
import { mediaKuvat, valitseTuotteet } from "@/lib/mediaKit";
import {
  KAIKKI_ZIP_ID,
  KARKITUOTTEET,
  LAHJAVINKIT,
  MEDIA_EMAIL,
  MEDIA_ESIKATSELU_LEVEYS,
  MEDIA_INTRO,
  MEDIA_PATH,
  SARJAT,
  mediaKaupanTiedot,
  ryhmanZip,
  zipPolku,
  type MediaRyhma,
} from "@/data/mediaKit";
import type { Product } from "@/types/product";

const meta = getStaticPageMeta(MEDIA_PATH);

const linkClass = "inline-flex items-center gap-1.5 text-sm text-primary hover:underline";

function ProductMediaCard({ product }: { product: Product }) {
  const { tuote, toinen } = mediaKuvat(product);
  const kuvat = [tuote, toinen].filter((k): k is NonNullable<typeof k> => !!k);
  return (
    <li className="rounded-lg border border-border p-3 space-y-3 bg-card">
      <div className="grid grid-cols-2 gap-2">
        {kuvat.map((k) => (
          <img
            key={k.tunnus}
            src={proxiedImage(k.url, { width: MEDIA_ESIKATSELU_LEVEYS }) || k.url}
            alt={`${product.name}, ${k.nimi.toLowerCase()}`}
            loading="lazy"
            width={160}
            height={160}
            className="w-full h-auto aspect-square object-cover rounded bg-muted"
          />
        ))}
      </div>
      <div>
        <h3 className="font-semibold text-foreground leading-snug">
          <Link to={`/tuote/${product.slug}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">{formatPriceFi(product.price)}</p>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {kuvat.map((k) => (
          <li key={k.tunnus}>
            <a href={k.tulostusUrl} target="_blank" rel="noopener noreferrer" download className={linkClass}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {k.nimi} 2048 px
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}

function KuvaRyhma({ ryhma, products }: { ryhma: MediaRyhma; products: Product[] | null }) {
  const list = products ? valitseTuotteet(ryhma.slugs, products) : [];
  return (
    <section className="space-y-3" aria-labelledby={`ryhma-${ryhma.id}`}>
      <h2 id={`ryhma-${ryhma.id}`} className="font-display text-2xl text-foreground">
        {ryhma.heading}
      </h2>
      {ryhma.intro && <p>{ryhma.intro}</p>}
      <a href={ryhmanZip(ryhma)} download className={linkClass}>
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Lataa ryhmän kuvat (zip)
      </a>
      {products === null ? (
        <p className="text-sm">Ladataan tuotteita.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
          {list.map((p) => (
            <ProductMediaCard key={p.slug} product={p} />
          ))}
        </ul>
      )}
    </section>
  );
}

function VinkkiRyhma({ ryhma, products }: { ryhma: MediaRyhma; products: Product[] | null }) {
  const list = products ? valitseTuotteet(ryhma.slugs, products) : [];
  return (
    <section className="space-y-2" aria-labelledby={`vinkki-${ryhma.id}`}>
      <h3 id={`vinkki-${ryhma.id}`} className="font-semibold text-foreground">
        {ryhma.heading}
      </h3>
      <ul className="space-y-1">
        {list.map((p) => (
          <li key={p.slug}>
            <Link to={`/tuote/${p.slug}`} className="text-primary hover:underline">
              {p.name}
            </Link>
            <span className="text-sm"> {formatPriceFi(p.price)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** /media: kaupan tiedot, painokelpoiset kuvat ja lahjavinkit toimittajille (sisältö src/data/mediaKit.ts). */
const MediaPage = () => {
  const { data: allProducts, isError } = useProducts();
  usePrerenderReady(!!allProducts || isError);
  const canonical = `${SITE_URL}${MEDIA_PATH}`;
  const products = useMemo(() => allProducts ?? (isError ? [] : null), [allProducts, isError]);
  const tiedot = useMemo(() => mediaKaupanTiedot(), []);

  return (
    <div className="container py-8 md:py-12">
      <SEOHead
        title={meta.title}
        description={meta.description}
        canonical={canonical}
        breadcrumbs={[
          { name: "Etusivu", url: `${SITE_URL}/` },
          { name: meta.name, url: canonical },
        ]}
      />
      <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{meta.name}</span>
      </nav>

      <article className="max-w-5xl space-y-8 text-muted-foreground">
        <header className="space-y-4 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl text-foreground">{meta.h1}</h1>
          {[meta.intro, ...MEDIA_INTRO].map((p, i) => (
            <p key={i} className={i === 0 ? "text-lg text-foreground font-medium" : undefined}>{p}</p>
          ))}
        </header>

        <section className="space-y-3 max-w-3xl">
          <h2 className="font-display text-2xl text-foreground">Kauppa lyhyesti</h2>
          <ul className="space-y-2 ml-1">
            {tiedot.map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="text-primary mt-0.5 shrink-0" aria-hidden="true">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <a
            href={`mailto:${MEDIA_EMAIL}`}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            {MEDIA_EMAIL}
          </a>
        </section>

        <section className="space-y-3 max-w-3xl">
          <h2 className="font-display text-2xl text-foreground">Kuvat zip-paketteina</h2>
          <p>Kuvat ovat 2048 px:n kokoisia. Kärkituotteiden paketissa on tuotekuva ja tunnelmakuva, sarjojen paketeissa tuotekuvat. Jokaisessa paketissa on tuotetiedot.txt, jossa on nimi, hinta, värit, koot, linkki, toimitus ja joulun tilausaika.</p>
          <ul className="space-y-1">
            <li>
              <a href={zipPolku(KAIKKI_ZIP_ID)} download className={linkClass}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Myydyimmät ja joulun kärkituotteet (zip)
              </a>
            </li>
            {SARJAT.map((r) => (
              <li key={r.id}>
                <a href={zipPolku(r.id)} download className={linkClass}>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  {r.heading} (zip)
                </a>
              </li>
            ))}
          </ul>
        </section>

        <KuvaRyhma ryhma={KARKITUOTTEET} products={products} />

        <section className="space-y-4" aria-labelledby="lahjavinkit">
          <h2 id="lahjavinkit" className="font-display text-2xl text-foreground">Lahjavinkit teemoittain</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LAHJAVINKIT.map((t) => (
              <VinkkiRyhma key={t.id} ryhma={t} products={products} />
            ))}
          </div>
        </section>

        {SARJAT.map((s) => (
          <KuvaRyhma key={s.id} ryhma={s} products={products} />
        ))}
      </article>
    </div>
  );
};

export default MediaPage;
