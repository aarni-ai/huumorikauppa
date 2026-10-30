import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

type Tarjous = {
  id: number; yritys: string; nimi: string; email: string; puhelin: string | null; maara: number | null; viesti: string | null;
  paketti: string | null; malli: string | null; koot: Record<string, number> | null; hinta: string | null; kate: string | null;
  toivottu_paiva: string | null; ehtii: boolean | null; jouluun: boolean | null; ytunnus: string | null; tila: string; created_at: string;
};
const TILAT = ["uusi", "vastattu", "tilattu", "hylatty"] as const;
const eur = (x: string | null) => (x == null ? "-" : `${Number(x).toFixed(2).replace(".", ",")} €`);
const pvm = (s: string | null) => (s ? new Date(s).toLocaleDateString("fi-FI", { timeZone: "Europe/Helsinki" }) : "-");

/**
 * /hallinta/tarjoukset?avain=...: tarjouspyynnöt katteineen (api/sahkoposti.js ?tarjoukset=). Avain on allekirjoitettu
 * (cron ?tehtava=hallinta-linkki); sivu on noindex ja robots.txt:ssä Disallow /hallinta.
 */
const QuoteAdminPage = () => {
  const [params] = useSearchParams();
  const avain = params.get("avain") || "";
  const [rivit, setRivit] = useState<Tarjous[] | null>(null);
  const [virhe, setVirhe] = useState(false);

  const lataa = useCallback(() => {
    fetch(`/api/sahkoposti?tarjoukset=${encodeURIComponent(avain)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j?.ok ? setRivit(j.tarjoukset) : setVirhe(true)))
      .catch(() => setVirhe(true));
  }, [avain]);
  useEffect(() => { if (avain) lataa(); else setVirhe(true); }, [avain, lataa]);

  const asetaTila = async (id: number, tila: string) => {
    await fetch("/api/sahkoposti", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "tarjoustila", avain, id, tila }) });
    lataa();
  };

  return (
    <div className="container py-8 max-w-6xl">
      <SEOHead title="Tarjouspyynnöt – Hallinta" description="Tarjouspyynnöt" noindex={true} />
      <h1 className="font-display text-2xl text-foreground mb-4">Tarjouspyynnöt</h1>
      {virhe && <p className="text-muted-foreground">Ei pääsyä. Avaa koko hallintalinkki.</p>}
      {!virhe && !rivit && <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ladataan...</p>}
      {rivit && rivit.length === 0 && <p className="text-muted-foreground">Ei tarjouspyyntöjä.</p>}
      {rivit && rivit.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              {["Saapui", "Yritys", "Yhteyshenkilö", "Paketti / malli", "Kpl ja koot", "Hinta", "Kate (arvio)", "Toivottu päivä", "Viesti", "Tila"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {rivit.map((t) => (
                <tr key={t.id} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{pvm(t.created_at)}</td>
                  <td className="py-2 pr-3">{t.yritys}{t.ytunnus ? <div className="text-xs text-muted-foreground">{t.ytunnus}</div> : null}</td>
                  <td className="py-2 pr-3">{t.nimi}<div className="text-xs"><a href={`mailto:${t.email}`} className="text-primary underline">{t.email}</a></div>{t.puhelin && <div className="text-xs">{t.puhelin}</div>}</td>
                  <td className="py-2 pr-3">{t.paketti || "-"}<div className="text-xs text-muted-foreground">{t.malli || ""}</div></td>
                  <td className="py-2 pr-3">{t.maara ?? "-"}<div className="text-xs text-muted-foreground">{t.koot ? Object.entries(t.koot).map(([k, n]) => `${k} ${n}`).join(", ") : ""}</div></td>
                  <td className="py-2 pr-3 whitespace-nowrap">{eur(t.hinta)}</td>
                  <td className="py-2 pr-3 whitespace-nowrap font-semibold">{eur(t.kate)}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{t.toivottu_paiva ? pvm(t.toivottu_paiva) : "-"}{t.ehtii === false ? <div className="text-xs text-destructive">ei ehdi</div> : t.ehtii ? <div className="text-xs text-primary">ehtii</div> : null}</td>
                  <td className="py-2 pr-3 max-w-[260px] whitespace-pre-wrap">{t.viesti || "-"}</td>
                  <td className="py-2">
                    <select value={t.tila} onChange={(e) => asetaTila(t.id, e.target.value)} className="h-8 rounded border border-border bg-muted px-1 text-xs" aria-label={`Tila ${t.yritys}`}>
                      {TILAT.map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QuoteAdminPage;
