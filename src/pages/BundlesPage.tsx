import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { Package, ArrowRight } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/use-products";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { useCartContext } from "@/context/CartContext";
import { proxiedImage } from "@/lib/imageProxy";
import { sortSizes } from "@/lib/sortSizes";
import { toast } from "@/hooks/use-toast";
import { PAKETTIMAARITYKSET, paketinTiedot } from "@/lib/ostoskori";
import type { Product } from "@/types/product";
import NotFound from "./NotFound";

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;
const URL_POHJA = "https://huumorikauppa.fi";

function useNaytettavatPaketit() {
  const { data: products = [], isLoading } = useProducts();
  const paketit = useMemo(
    () => PAKETTIMAARITYKSET.map((p) => paketinTiedot(p, products)).filter((x): x is NonNullable<typeof x> => !!x),
    [products],
  );
  return { paketit, isLoading };
}

function Hinta({ yhteensa, pakettihinta, alennusVoimassa, prosentti }: { yhteensa: number; pakettihinta: number; alennusVoimassa: boolean; prosentti: number }) {
  if (!alennusVoimassa) return <span className="font-bold text-primary">{eur(yhteensa)}</span>;
  return (
    <span className="flex items-baseline gap-2">
      <span className="font-bold text-primary">{eur(pakettihinta)}</span>
      <span className="text-xs text-muted-foreground">pakettialennus {prosentti} % kassalla</span>
    </span>
  );
}

/** /paketit: teemaparit (t-paita ja huppari samalla tekstillä). */
export const BundlesPage = () => {
  usePrerenderReady();
  const { paketit, isLoading } = useNaytettavatPaketit();
  return (
    <div className="container py-8 md:py-12">
      <SEOHead
        title="Paketit: t-paita ja huppari | Huumorikauppa.fi"
        description="Saman tekstin t-paita ja huppari yhdessä paketissa. Valitse koot ja värit, ja lisää molemmat koriin kerralla."
        canonical={`${URL_POHJA}/paketit`}
        breadcrumbs={[{ name: "Etusivu", url: `${URL_POHJA}/` }, { name: "Paketit", url: `${URL_POHJA}/paketit` }]}
      />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3 flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" /> Paketit
      </h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Sama teksti paitana ja huppariin: toinen arkeen, toinen viileisiin iltoihin. Kun paketin molemmat tuotteet ovat
        korissa, mahdollinen pakettialennus vähennetään kassalla automaattisesti.
      </p>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paketit.map((t) => (
            <Link
              key={t.paketti.slug}
              to={`/paketit/${t.paketti.slug}`}
              className="group rounded-lg border border-border bg-card hover:border-primary/50 transition-colors overflow-hidden"
            >
              <div className="grid grid-cols-2">
                {t.tuotteet.map((p) => (
                  <img key={p.id} src={proxiedImage(p.images[0]) || "/placeholder.svg"} alt={p.name} className="w-full aspect-square object-cover bg-muted" loading="lazy" width={200} height={200} />
                ))}
              </div>
              <div className="p-4 space-y-2">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">{t.paketti.nimi}</p>
                <Hinta yhteensa={t.yhteensa} pakettihinta={t.pakettihinta} alennusVoimassa={t.alennusVoimassa} prosentti={t.paketti.alennus_prosentti} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

function Valinnat({ product, koko, vari, setKoko, setVari }: { product: Product; koko?: string; vari?: string; setKoko: (s: string) => void; setVari: (s: string) => void }) {
  const koot: string[] = sortSizes(product.variants?.sizes || []);
  const varit: string[] = product.variants?.colors || [];
  return (
    <div className="space-y-3">
      {varit.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-foreground mb-1">Väri</p>
          <div className="flex flex-wrap gap-2">
            {varit.map((v) => (
              <button key={v} type="button" onClick={() => setVari(v)} className={`rounded border px-2 py-1 text-xs ${vari === v ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"}`}>{v}</button>
            ))}
          </div>
        </div>
      )}
      {koot.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-foreground mb-1">Koko</p>
          <div className="flex flex-wrap gap-2">
            {koot.map((k) => (
              <button key={k} type="button" onClick={() => setKoko(k)} className={`rounded border px-2 py-1 text-xs min-w-[2.5rem] ${koko === k ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"}`}>{k}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Variantti löytyy tuotteen variant_map-kartasta (sama avain kuin kassalla "Väri|Koko"). */
function onSaatavilla(product: Product, vari?: string, koko?: string) {
  const kartta = product.variants?.variant_map || {};
  return Object.keys(kartta).some((avain) => {
    const [v, k] = avain.split("|");
    return (!vari || v === vari) && (!koko || k === koko);
  });
}

/** /paketit/:slug: paketin tuotteet, koon ja värin valinta, molemmat koriin kerralla. */
export const BundlePage = () => {
  usePrerenderReady();
  const { slug } = useParams();
  const { paketit, isLoading } = useNaytettavatPaketit();
  const { addItem } = useCartContext();
  const t = paketit.find((p) => p.paketti.slug === slug);
  const [valinnat, setValinnat] = useState<Record<string, { koko?: string; vari?: string }>>({});

  if (isLoading) return <div className="container py-12"><Skeleton className="h-96" /></div>;
  if (!t) return <NotFound />;

  const valinta = (p: Product) => {
    const v = valinnat[p.id] || {};
    const koot: string[] = p.variants?.sizes || [];
    const varit: string[] = p.variants?.colors || [];
    return {
      koko: v.koko ?? (koot.length === 1 ? koot[0] : undefined),
      vari: v.vari ?? (varit.length === 1 ? varit[0] : p.variants?.default_color),
    };
  };
  const aseta = (id: string, muutos: { koko?: string; vari?: string }) => setValinnat((s) => ({ ...s, [id]: { ...s[id], ...muutos } }));

  const lisaa = () => {
    for (const p of t.tuotteet) {
      const { koko, vari } = valinta(p);
      if ((p.variants?.sizes || []).length > 1 && !koko) {
        toast({ title: `Valitse koko: ${p.name}`, variant: "destructive" });
        return;
      }
      if (!onSaatavilla(p, vari, koko)) {
        toast({ title: `Tätä koko ja väri -yhdistelmää ei ole: ${p.name}`, variant: "destructive" });
        return;
      }
    }
    for (const p of t.tuotteet) {
      const { koko, vari } = valinta(p);
      addItem(p, 1, koko, vari);
    }
  };

  return (
    <div className="container py-8 md:py-12 max-w-5xl">
      <SEOHead
        title={`${t.paketti.nimi} | Huumorikauppa.fi`}
        description={`${t.paketti.nimi}: sama teksti paitana ja huppariin. Valitse koot ja lisää molemmat koriin kerralla.`}
        canonical={`${URL_POHJA}/paketit/${t.paketti.slug}`}
        noindex={true}
        breadcrumbs={[
          { name: "Etusivu", url: `${URL_POHJA}/` },
          { name: "Paketit", url: `${URL_POHJA}/paketit` },
          { name: t.paketti.nimi, url: `${URL_POHJA}/paketit/${t.paketti.slug}` },
        ]}
      />
      <Link to="/paketit" className="text-sm text-muted-foreground hover:text-primary">Kaikki paketit</Link>
      <h1 className="font-display text-3xl md:text-4xl text-foreground mt-2 mb-6">{t.paketti.nimi}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {t.tuotteet.map((p) => {
          const v = valinta(p);
          return (
            <div key={p.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <Link to={`/tuote/${p.slug}`}>
                <img src={proxiedImage(p.images[0]) || "/placeholder.svg"} alt={p.name} className="w-full aspect-square object-cover bg-muted" width={500} height={500} />
              </Link>
              <div className="p-4 space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <Link to={`/tuote/${p.slug}`} className="font-medium text-foreground hover:text-primary">{p.name}</Link>
                  <span className="font-bold text-primary whitespace-nowrap">{eur(p.price)}</span>
                </div>
                <Valinnat product={p} koko={v.koko} vari={v.vari} setKoko={(k) => aseta(p.id, { koko: k })} setVari={(c) => aseta(p.id, { vari: c })} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 rounded-lg border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Yhteensä</p>
          {t.alennusVoimassa ? (
            <p className="text-2xl font-bold text-primary">
              {eur(t.pakettihinta)} <span className="text-sm font-normal text-muted-foreground ml-1">(erikseen {eur(t.yhteensa)})</span>
            </p>
          ) : (
            <p className="text-2xl font-bold text-primary">{eur(t.yhteensa)}</p>
          )}
          {t.alennusVoimassa && (
            <p className="text-xs text-muted-foreground">Pakettialennus {t.paketti.alennus_prosentti} % vähennetään kassalla, kun molemmat tuotteet ovat korissa. Ei yhdistetä alennuskoodeihin.</p>
          )}
        </div>
        <Button size="lg" onClick={lisaa} className="bg-primary text-primary-foreground font-bold">
          Lisää molemmat koriin <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default BundlesPage;
