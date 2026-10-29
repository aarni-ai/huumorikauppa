import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BarChart3, Copy, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

type Kuukausi = { kuukausi: string; klikit: number; tilauksia: number; tuotteet: number; provisio: number; odottaa: number };
type Tilaus = { pvm: string; tuotteet: number; provisio: number; tila: string };
type Raportti = {
  koodi: string; etunimi: string; linkki: string; saanto: string;
  kuukaudet: Kuukausi[]; tilaukset: Tilaus[];
  yhteensa: { klikit: number; tilauksia: number; tuotteet: number; provisio: number };
};

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;
const kk = (k: string) => { const [v, m] = k.split("-"); return `${Number(m)}/${v}`; };
const pvm = (p: string) => { const [v, m, d] = p.split("-"); return `${Number(d)}.${Number(m)}.${v}`; };
const TILA: Record<string, string> = {
  taysi: "10 %", rajattu: "rajattu (kauppaan jää 7 €)", ei: "ei provisiota (kate ei riitä)", "kate-tuntematon": "odottaa painotalon laskua",
};

/**
 * /kumppanit/raportti?koodi=...&avain=...: kumppanin oma raportti (api/sahkoposti.js ?kumppaniraportti=). Klikkaukset,
 * tilaukset ja provisio kuukausittain. Ei asiakkaiden henkilötietoja. Avain tulee cron-tehtävältä kumppani-lisaa.
 */
const PartnerReportPage = () => {
  const [params] = useSearchParams();
  const avain = params.get("avain") || "";
  const koodi = params.get("koodi") || "";
  const [tila, setTila] = useState<"lataa" | "valmis" | "virhe">("lataa");
  const [r, setR] = useState<Raportti | null>(null);
  const [kopioitu, setKopioitu] = useState(false);

  useEffect(() => {
    if (!avain) { setTila("virhe"); return; }
    fetch(`/api/sahkoposti?kumppaniraportti=${encodeURIComponent(avain)}&koodi=${encodeURIComponent(koodi)}`)
      .then((v) => (v.ok ? v.json() : null))
      .then((j) => { if (j?.ok) { setR(j); setTila("valmis"); } else setTila("virhe"); })
      .catch(() => setTila("virhe"));
  }, [avain, koodi]);

  const kopioi = () => {
    if (!r) return;
    navigator.clipboard?.writeText(r.linkki).then(() => setKopioitu(true)).catch(() => undefined);
  };

  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <SEOHead title="Kumppanin raportti – Huumorikauppa" description="Kumppanin klikkaukset, tilaukset ja provisio." noindex={true} />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4 flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary shrink-0" aria-hidden="true" /> Kumppanin raportti
      </h1>

      {tila === "lataa" && <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ladataan...</p>}
      {tila === "virhe" && (
        <p className="text-muted-foreground">
          Raporttia ei löytynyt. Tarkista, että avasit koko linkin sähköpostista. Apua saat osoitteesta huumorikauppa@gmail.com.
          {" "}<Link to="/kumppanit" className="text-primary underline">Kumppanuusohjelma</Link>
        </p>
      )}

      {tila === "valmis" && r && (
        <>
          <p className="text-muted-foreground mb-4">Hei {r.etunimi}! Tässä ovat koodin <span className="font-semibold text-foreground">{r.koodi}</span> luvut. Raportti päivittyy, kun tilauksia tulee.</p>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 mb-6">
            <span className="text-sm text-muted-foreground">Oma linkki:</span>
            <code className="text-sm text-foreground break-all">{r.linkki}</code>
            <Button type="button" size="sm" variant="outline" onClick={kopioi} className="ml-auto">
              <Copy className="h-4 w-4 mr-1" /> {kopioitu ? "Kopioitu" : "Kopioi"}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[["Klikkaukset", String(r.yhteensa.klikit)], ["Tilaukset", String(r.yhteensa.tilauksia)], ["Tuotteiden arvo", eur(r.yhteensa.tuotteet)], ["Provisio", eur(r.yhteensa.provisio)]].map(([n, v]) => (
              <div key={n} className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground">{n}</p>
                <p className="text-2xl font-bold text-primary">{v}</p>
              </div>
            ))}
          </div>

          <section className="mb-8">
            <h2 className="font-display text-xl text-foreground mb-3">Kuukausittain</h2>
            {r.kuukaudet.length === 0 ? <p className="text-sm text-muted-foreground">Ei vielä klikkauksia eikä tilauksia.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3 font-medium">Kuukausi</th><th className="py-2 pr-3 font-medium text-right">Klikkaukset</th>
                    <th className="py-2 pr-3 font-medium text-right">Tilaukset</th><th className="py-2 pr-3 font-medium text-right">Tuotteet</th>
                    <th className="py-2 font-medium text-right">Provisio</th>
                  </tr></thead>
                  <tbody>{r.kuukaudet.map((m) => (
                    <tr key={m.kuukausi} className="border-b border-border/60">
                      <td className="py-2 pr-3">{kk(m.kuukausi)}</td><td className="py-2 pr-3 text-right">{m.klikit}</td>
                      <td className="py-2 pr-3 text-right">{m.tilauksia}</td><td className="py-2 pr-3 text-right">{eur(m.tuotteet)}</td>
                      <td className="py-2 text-right font-semibold">{eur(m.provisio)}{m.odottaa > 0 ? ` (+${m.odottaa} odottaa)` : ""}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>

          {r.tilaukset.length > 0 && (
            <section className="mb-8">
              <h2 className="font-display text-xl text-foreground mb-3">Tilaukset</h2>
              <ul className="space-y-1.5 text-sm">
                {r.tilaukset.map((t, i) => (
                  <li key={`${t.pvm}-${i}`} className="flex justify-between gap-4 border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">{pvm(t.pvm)}, tuotteet {eur(t.tuotteet)}</span>
                    <span className="text-foreground">{eur(t.provisio)} <span className="text-xs text-muted-foreground">({TILA[t.tila] || t.tila})</span></span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="text-sm text-muted-foreground space-y-2">
            <h2 className="font-display text-xl text-foreground">Provisio</h2>
            <p>{r.saanto}</p>
            <p>Tuotteiden arvo on ilman toimitusta. Provisio maksetaan kerran kuussa edellisen kuukauden tilauksista, kun palautusaika on päättynyt. Raportissa ei näytetä ostajien tietoja.</p>
          </section>
        </>
      )}
    </div>
  );
};

export default PartnerReportPage;
