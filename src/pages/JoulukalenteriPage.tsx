import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Gift, Lock, Check } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewsletterBoxLazy } from "@/components/NewsletterBoxLazy";
import { useCartContext } from "@/context/CartContext";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { toast } from "@/hooks/use-toast";
import { proxiedImage } from "@/lib/imageProxy";
import { sortSizes } from "@/lib/sortSizes";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { JOULUKALENTERI_OHJEET, JOULUKALENTERI_FAQS } from "@/data/joulukalenteriPage";
import { JOULU_TILAUSPAIVA_ISO, paivaLyhyt } from "@/data/campaignSchedule";
import {
  useJoulukalenteri, kirjaaJoulukalenteri, luukkuTuote, helsinginPaiva, kalenterinTila, luukunTila, luukunPvm,
  LUUKKUJA, JOULUKALENTERI_POLKU, JOULUKALENTERI_ALKU, type AvoinLuukku,
} from "@/lib/joulukalenteri";
import { sekuntejaKeskiyohon } from "../../api/_lib/joulukalenteri.js";

const URL_POHJA = "https://huumorikauppa.fi";
const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;
const ilmanVuotta = (iso: string) => paivaLyhyt(iso).replace(/\d{4}$/, "");

/** Nykyhetki, joka päivittyy keskiyöllä Suomen aikaa (luukku vaihtuu sivun ollessa auki). */
function useNyt(): number {
  const [nyt, setNyt] = useState(() => Date.now());
  useEffect(() => {
    const t = setTimeout(() => setNyt(Date.now()), (sekuntejaKeskiyohon(new Date(nyt)) + 1) * 1000);
    return () => clearTimeout(t);
  }, [nyt]);
  return nyt;
}

function Luukku({ n, nyt, avattu, onAvaa }: { n: number; nyt: number; avattu: boolean; onAvaa: () => void }) {
  const tila = luukunTila(n, nyt);
  const pohja = "aspect-square rounded-lg border flex flex-col items-center justify-center text-center p-2 transition-colors";
  if (tila === "auki") {
    return (
      <button
        type="button"
        onClick={onAvaa}
        aria-label={`Luukku ${n}: avaa tämän päivän luukku`}
        className={`${pohja} ${avattu ? "border-primary bg-primary text-primary-foreground" : "border-primary bg-primary/10 text-primary hover:bg-primary/20"} font-bold`}
      >
        <span className="font-display text-3xl">{n}</span>
        <span className="text-xs">{avattu ? "Avattu" : "Avaa luukku"}</span>
      </button>
    );
  }
  if (tila === "mennyt") {
    return (
      <div className={`${pohja} border-border bg-muted text-muted-foreground`} aria-label={`Luukku ${n}: luukku on mennyt`}>
        <span className="font-display text-2xl line-through">{n}</span>
        <span className="text-xs">Luukku on mennyt</span>
      </div>
    );
  }
  return (
    <div className={`${pohja} border-red-900/30 bg-red-900 text-white`} aria-label={`Luukku ${n}: aukeaa ${ilmanVuotta(luukunPvm(n))}`}>
      <span className="font-display text-2xl">{n}</span>
      <span className="text-[11px] flex items-center gap-1 opacity-90"><Lock className="h-3 w-3" aria-hidden="true" /> {ilmanVuotta(luukunPvm(n))}</span>
    </div>
  );
}

function Tarjous({ luukku, tanaan }: { luukku: AvoinLuukku; tanaan: string }) {
  const { addItem } = useCartContext();
  const p = luukku.product;
  const kartta = (p.variants?.variant_map || {}) as Record<string, number>;
  const koot = useMemo(() => sortSizes(Object.keys(luukku.koot)), [luukku.koot]);
  const varit = useMemo(() => {
    const kaikki: string[] = p.variants?.colors || [...new Set(Object.keys(kartta).map((a) => a.split("|")[0]))];
    return luukku.varit?.length ? kaikki.filter((v) => luukku.varit!.includes(v)) : kaikki;
  }, [p, kartta, luukku.varit]);
  const [koko, setKoko] = useState<string | undefined>(koot.length === 1 ? koot[0] : undefined);
  const [vari, setVari] = useState<string | undefined>(varit.length === 1 ? varit[0] : p.variants?.default_color);
  const [lisatty, setLisatty] = useState(false);
  const hinnat = [...new Set(Object.values(luukku.koot))].sort((a, b) => a - b);
  const kokoHinta = koko ? luukku.koot[koko] : null;
  const ehtiiJouluksi = tanaan <= JOULU_TILAUSPAIVA_ISO;

  const lisaa = () => {
    if (!koko) { toast({ title: "Valitse koko", variant: "destructive" }); return; }
    if (typeof kartta[`${vari ?? ""}|${koko}`] !== "number") { toast({ title: "Tätä koon ja värin yhdistelmää ei ole. Valitse toinen väri.", variant: "destructive" }); return; }
    const { product, merkki } = luukkuTuote(p, luukku, koko);
    addItem(product, luukku.kpl, koko, vari, undefined, merkki);
    kirjaaJoulukalenteri("kori");
    setLisatty(true);
  };

  return (
    <section aria-labelledby="luukku-otsikko" className="rounded-xl border border-primary/40 bg-card p-4 md:p-6 grid gap-6 md:grid-cols-2">
      <Link to={`/tuote/${p.slug}`} className="block">
        <img src={proxiedImage(p.images?.[0], { width: 640 }) || p.images?.[0]} alt={p.name} className="w-full aspect-square object-cover rounded-lg bg-muted" width={640} height={640} />
      </Link>
      <div className="space-y-4">
        <p className="text-sm font-semibold text-primary">Luukku {luukku.paiva}, voimassa tänään klo 23.59 asti</p>
        <h2 id="luukku-otsikko" className="font-display text-2xl text-foreground">{p.name}</h2>
        <div>
          <p className="text-3xl font-bold text-primary">
            {luukku.kpl > 1 ? `${luukku.kpl} kpl yhteensä ${eur(luukku.hinta)}` : eur(kokoHinta ?? luukku.hinta)}
          </p>
          <p className="text-sm text-muted-foreground">Normaalihinta {eur(luukku.normaali)}{hinnat.length > 1 && luukku.kpl === 1 ? `. Luukun hinnat koon mukaan ${hinnat.map(eur).join(" ja ")}.` : "."}</p>
          {luukku.alin30 !== null && (
            <p className="text-xs text-muted-foreground">Alin hinta 30 päivän aikana ennen tarjousta: {eur(luukku.alin30)}</p>
          )}
        </div>
        {varit.length > 1 && (
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">Väri</p>
            <div className="flex flex-wrap gap-2">
              {varit.map((v) => (
                <button key={v} type="button" onClick={() => setVari(v)} aria-pressed={vari === v} className={`rounded border px-2 py-1 text-xs ${vari === v ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"}`}>{v}</button>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-foreground mb-1">Koko</p>
          <div className="flex flex-wrap gap-2">
            {koot.map((k) => (
              <button key={k} type="button" onClick={() => setKoko(k)} aria-pressed={koko === k} className={`rounded border px-2 py-1 text-xs min-w-[2.5rem] ${koko === k ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"}`}>{k}</button>
            ))}
          </div>
        </div>
        {lisatty ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Check className="h-4 w-4" aria-hidden="true" /> Lisätty koriin luukun hinnalla</p>
            <Button asChild size="sm"><Link to="/ostoskori">Siirry ostoskoriin</Link></Button>
          </div>
        ) : (
          <Button onClick={lisaa} className="bg-primary text-primary-foreground font-bold">Lisää koriin luukun hinnalla</Button>
        )}
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>Hinta lasketaan kassalla ilman koodia, eikä se yhdisty muihin alennuksiin.</li>
          <li>
            {ehtiiJouluksi
              ? `Ehtii jouluksi, kun tilaat viimeistään ${ilmanVuotta(JOULU_TILAUSPAIVA_ISO)}`
              : `Joulun viimeinen tilauspäivä oli ${ilmanVuotta(JOULU_TILAUSPAIVA_ISO)} Tänään tilattu tuote on perillä joulun jälkeen.`}
          </li>
        </ul>
      </div>
    </section>
  );
}

/**
 * /joulukalenteri: 24 luukkua 1.-24.12.2026. Tulevat luukut ovat lukossa, mennyt luukku ei anna tarjousta, ja tämän
 * päivän luukun tuote ja hinta haetaan palvelimelta (src/lib/joulukalenteri.ts). Ennen joulukuuta suljetut luukut ja
 * uutiskirjeen tilaus.
 */
const JoulukalenteriPage = () => {
  usePrerenderReady();
  const meta = STATIC_PAGE_META["/joulukalenteri"];
  const nyt = useNyt();
  const tanaan = helsinginPaiva(nyt);
  const tila = kalenterinTila(nyt);
  const { data, isLoading, isError } = useJoulukalenteri(tanaan, tila === "auki");
  const [avattu, setAvattu] = useState(false);
  const tarjous = useRef<HTMLDivElement>(null);

  useEffect(() => { kirjaaJoulukalenteri("kaynti"); }, []);
  useEffect(() => { setAvattu(false); }, [tanaan]);

  const avaa = () => {
    setAvattu(true);
    kirjaaJoulukalenteri("luukku");
    requestAnimationFrame(() => tarjous.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const avoin = data?.avoin && data.avoin.pvm === tanaan ? data.avoin : null;

  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <SEOHead
        title={meta.title}
        description={meta.description}
        canonical={`${URL_POHJA}${JOULUKALENTERI_POLKU}`}
        breadcrumbs={[{ name: "Etusivu", url: `${URL_POHJA}/` }, { name: meta.name, url: `${URL_POHJA}${JOULUKALENTERI_POLKU}` }]}
      />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3 flex items-center gap-3">
        <Gift className="h-8 w-8 text-primary" aria-hidden="true" /> {meta.h1}
      </h1>
      <p className="text-muted-foreground mb-6">{meta.intro}</p>

      {tila === "tulossa" && (
        <p className="mb-6 rounded-lg bg-red-900 text-white px-4 py-3 text-sm font-semibold">
          Ensimmäinen luukku aukeaa {ilmanVuotta(JOULUKALENTERI_ALKU)} keskiyöllä. Tilaa uutiskirje, niin saat päivän luukun sähköpostiisi joka aamu.
        </p>
      )}
      {tila === "paattynyt" && (
        <p className="mb-6 rounded-lg bg-muted px-4 py-3 text-sm">Joulukalenteri 2026 on päättynyt. Kiitos, kun kävit avaamassa luukkuja.</p>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 md:gap-3 mb-8" role="list" aria-label="Joulukalenterin luukut">
        {Array.from({ length: LUUKKUJA }, (_, i) => (
          <div role="listitem" key={i + 1}>
            <Luukku n={i + 1} nyt={nyt} avattu={avattu} onAvaa={avaa} />
          </div>
        ))}
      </div>

      <div ref={tarjous} className="scroll-mt-24">
        {tila === "auki" && avattu && (
          isLoading ? <Skeleton className="h-80 rounded-xl" />
            : avoin ? <Tarjous luukku={avoin} tanaan={tanaan} />
              : (
                <p className="rounded-lg bg-muted px-4 py-3 text-sm">
                  {isError ? "Luukun avaaminen ei onnistunut. Päivitä sivu hetken kuluttua." : "Tämän päivän luukun tuote ei ole juuri nyt tilattavissa. Katso huomenna uusi luukku."}
                </p>
              )
        )}
        {tila === "auki" && !avattu && (
          <p className="text-sm text-muted-foreground">Avaa yllä tämän päivän luukku {Number(tanaan.slice(8, 10))}.</p>
        )}
      </div>

      <section className="mt-10 space-y-3" aria-labelledby="ohjeet-otsikko">
        <h2 id="ohjeet-otsikko" className="font-display text-xl text-foreground">Näin kalenteri toimii</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
          {JOULUKALENTERI_OHJEET.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </section>

      <section className="mt-8 space-y-3" aria-labelledby="ukk-otsikko">
        <h2 id="ukk-otsikko" className="font-display text-xl text-foreground">Usein kysyttyä</h2>
        {JOULUKALENTERI_FAQS.map((f) => (
          <details key={f.q} className="rounded border border-border p-3">
            <summary className="font-semibold text-sm cursor-pointer">{f.q}</summary>
            <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
          </details>
        ))}
      </section>

      <div className="mt-10">
        <NewsletterBoxLazy lahde="joulukalenteri" />
      </div>
    </div>
  );
};

export default JoulukalenteriPage;
