import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { poistaAvainOsoitteesta } from "@/lib/hallinta";

type Merkinta = { id: number; otsikko: string; muoto: string; rivit: number; luotu: string; koko: number; alku: string };
type Vastaus = { ok: boolean; virhe?: string; id?: number; muoto?: string; rivit?: number };

const aika = (s: string) => new Date(s).toLocaleString("fi-FI", { timeZone: "Europe/Helsinki", dateStyle: "short", timeStyle: "short" });
const muoto = (m: string) => (m.startsWith("csv:") ? `CSV (${m === "csv:\t" ? "sarkain" : m.slice(4)})` : "teksti");
const kentta = "rounded border border-border bg-muted px-3 text-sm";

/**
 * /hallinta/syote (5.11.2026): Cowork liittää tekstiä tai CSV:tä otsikolla (Search Console, Merchant, somen tilastot).
 * Tallennus api/sahkoposti.js POST "syote-tallenna" (api/_lib/hallintasyote.js); kone lukee scripts/syote-lue.mjs:llä.
 * Pääsy kuten muilla hallintasivuilla (yleinen hallintaeväste tai avain); noindex, robots Disallow /hallinta.
 */
const FeedAdminPage = () => {
  const [params] = useSearchParams();
  const avain = params.get("avain") || "";
  const [lista, setLista] = useState<Merkinta[] | null>(null);
  const [ehdotukset, setEhdotukset] = useState<string[]>([]);
  const [eiPaasya, setEiPaasya] = useState(false);
  const [otsikko, setOtsikko] = useState("");
  const [sisalto, setSisalto] = useState("");
  const [tulos, setTulos] = useState<Vastaus | null>(null);
  const [kaynnissa, setKaynnissa] = useState(false);

  const lataa = useCallback(() => {
    fetch(`/api/sahkoposti?syote=${encodeURIComponent(avain)}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.ok) { setLista(j.merkinnat); setEhdotukset(j.ehdotukset || []); poistaAvainOsoitteesta(); } else setEiPaasya(true); })
      .catch(() => setEiPaasya(true));
  }, [avain]);
  useEffect(() => { lataa(); }, [lataa]);

  const lueTiedosto = async (f: File | undefined) => {
    if (!f) return;
    setSisalto(await f.text());
    if (!otsikko) setOtsikko(f.name.replace(/\.[a-z0-9]+$/i, ""));
  };

  const tallenna = async (e: React.FormEvent) => {
    e.preventDefault();
    setKaynnissa(true);
    setTulos(null);
    try {
      const r = await fetch("/api/sahkoposti", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avain, action: "syote-tallenna", otsikko, sisalto }) });
      const v: Vastaus = r.status === 404 ? { ok: false, virhe: "Ei pääsyä. Avaa hallintalinkki uudelleen." } : await r.json().catch(() => ({ ok: false, virhe: "Tallennus epäonnistui." }));
      setTulos(v);
      if (v.ok) { setSisalto(""); lataa(); }
    } catch {
      setTulos({ ok: false, virhe: "Yhteys katkesi. Yritä uudelleen." });
    } finally {
      setKaynnissa(false);
    }
  };

  return (
    <div className="container py-8 max-w-5xl space-y-8">
      <SEOHead title="Syöte | Hallinta" description="Syöte" noindex={true} />
      <h1 className="font-display text-2xl text-foreground">Syöte Claudelle</h1>
      {eiPaasya && <p className="text-muted-foreground">Ei pääsyä. Avaa hallintalinkki päivän yhteenvetoviestistä tai aktivointilinkki.</p>}
      {!eiPaasya && (
        <>
          <form onSubmit={tallenna} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Liitä raportti tekstinä tai CSV:nä (kopioi taulukko tai vie CSV ja liitä sen sisältö). Otsikko kertoo, mistä data on, esim. "Search Console 28 pv".
              Sama otsikko joka viikko, jotta muutokset voi verrata.
            </p>
            <label className="block text-sm">
              Otsikko
              <input list="syote-ehdotukset" value={otsikko} onChange={(e) => setOtsikko(e.target.value)} maxLength={100} required
                className={`${kentta} mt-1 h-10 w-full`} aria-label="Otsikko" />
              <datalist id="syote-ehdotukset">{ehdotukset.map((x) => <option key={x} value={x} />)}</datalist>
            </label>
            <label className="block text-sm">
              Sisältö
              <textarea value={sisalto} onChange={(e) => setSisalto(e.target.value)} required rows={14}
                className={`${kentta} mt-1 w-full py-2 font-mono text-xs`} aria-label="Sisältö" />
            </label>
            <label className="block text-sm text-muted-foreground">
              Tai valitse tiedosto (CSV tai teksti): <input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" onChange={(e) => lueTiedosto(e.target.files?.[0])} className="ml-2 text-xs" />
            </label>
            <button type="submit" disabled={kaynnissa || !otsikko.trim() || !sisalto.trim()}
              className="inline-flex h-10 items-center gap-2 rounded bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50">
              {kaynnissa && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Tallenna
            </button>
            {tulos?.ok && <p className="text-sm text-green-700">Tallennettu (#{tulos.id}, {muoto(tulos.muoto || "teksti")}, {tulos.rivit} riviä).</p>}
            {tulos && !tulos.ok && <p className="text-sm text-red-700">{tulos.virhe}</p>}
          </form>

          <section className="space-y-2">
            <h2 className="font-display text-lg text-foreground">Uusimmat</h2>
            {!lista && <p className="text-sm text-muted-foreground">Ladataan...</p>}
            {lista?.length === 0 && <p className="text-sm text-muted-foreground">Ei vielä merkintöjä.</p>}
            {!!lista?.length && (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground"><th className="py-1">#</th><th>Otsikko</th><th>Tallennettu</th><th>Muoto</th><th>Rivit</th><th>Alku</th></tr></thead>
                <tbody>
                  {lista.map((m) => (
                    <tr key={m.id} className="border-t border-border align-top">
                      <td className="py-1 pr-2">{m.id}</td><td className="pr-2">{m.otsikko}</td><td className="pr-2 whitespace-nowrap">{aika(m.luotu)}</td>
                      <td className="pr-2">{muoto(m.muoto)}</td><td className="pr-2">{m.rivit}</td>
                      <td className="max-w-xs truncate font-mono text-xs text-muted-foreground" title={m.alku}>{m.alku.split(/\r?\n/)[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default FeedAdminPage;
