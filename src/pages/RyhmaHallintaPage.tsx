import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, Trash2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RyhmaMockup } from "@/components/RyhmaMockup";
import { KopioiLinkki, Hintataulukko } from "@/components/RyhmaSuunnittelija";
import { ryhmaKutsu, euro, jasenPolku } from "@/lib/ryhmatilaus";
import { RYHMA_SAANNOT, ryhmaSivuTyypille, paivaTeksti, RYHMA_TOIMITUSAIKA, type RyhmaTyyppi } from "@/data/ryhmapaidat";
import { RYHMA_MIN_KPL, RYHMA_MAX_KPL } from "../../api/_lib/ryhmatilaus.js";

type Arvio = { ok: boolean; kpl?: number; vetajanSumma?: number; pois?: number; hinta?: number; virhe?: string } | null;
type Hallinta = {
  ryhma: {
    tyyppi: RyhmaTyyppi; design: { nimi: string; vuosi: string | null; teksti: string | null; logo: string | null }; vari: string;
    tila: "avoin" | "lukittu" | "lahetetty" | "peruttu"; maksutapa: "vetaja" | "jasenet"; paikat: number; takaraja: string | null;
    riveja: number; maksettuja: number; jasenTunnus: string; vetaja: { nimi: string; osoite: string; postinumero: string; kaupunki: string };
    lukittu: string | null; lahetetty: string | null; suunnitelma: { kpl: number; vetajanSumma: number; odottaaMaksua: boolean } | null;
  };
  jasenet: { id: string; nimi: string; numero: string | null; koko: string; tila: string; maksaja: string | null; maksettu: number | null; hyvitetty: number }[];
  koot: Record<string, number>;
  porrasNyt: { min: number; hinta: number };
  arvio: { vetaja?: Arvio; jataPois?: Arvio; maksaLoput?: Arvio };
  tilaus: { printify: string; seuranta: string | null } | null;
};

const JASEN_TILA: Record<string, string> = { tayttanyt: "Maksamatta", maksettu: "Maksettu", pois: "Jäi pois" };
const PRINTIFY_TILA: Record<string, string> = { ei_lahetetty: "Siirretään painoon", luotu: "Siirretään painoon", virhe: "Siirretään painoon", tuotannossa: "Painossa", lahetetty: "Lähetetty", pysaytetty: "Tarkistuksessa" };

/** /ryhma/hallinta/:tunnus: vetäjän näkymä (kokotaulukko, maksut, paikkamäärä, lukitus, peruutus). */
const RyhmaHallintaPage = () => {
  const { tunnus = "" } = useParams();
  const [haku, setHaku] = useSearchParams();
  const [h, setH] = useState<Hallinta | null>(null);
  const [virhe, setVirhe] = useState("");
  const [tyo, setTyo] = useState("");
  const [paikat, setPaikat] = useState("");

  const aseta = (r: Hallinta) => { setH(r); setPaikat(String(r.ryhma.paikat)); };
  const lataa = useCallback(async (maksu?: string | null) => {
    const r = await ryhmaKutsu<Hallinta>("ryhma-hallinta", { hallinta: tunnus, maksu });
    if (!r.ok) { setVirhe(r.error); return; }
    aseta(r);
  }, [tunnus]);

  useEffect(() => {
    const maksu = haku.get("maksu");
    lataa(maksu);
    if (maksu) setHaku({}, { replace: true });
  }, [tunnus]); // eslint-disable-line react-hooks/exhaustive-deps

  const toiminto = async (action: string, body: Record<string, unknown> = {}, vahvistus?: string) => {
    if (vahvistus && !window.confirm(vahvistus)) return;
    setVirhe("");
    setTyo(action);
    const r = await ryhmaKutsu<Hallinta & { url?: string }>(action, { hallinta: tunnus, ...body });
    if (!r.ok) { setTyo(""); setVirhe(r.error); return; }
    if (r.url) { window.location.href = r.url; return; }
    setTyo("");
    if ("ryhma" in r && r.ryhma) aseta(r); else await lataa();
  };

  if (virhe && !h) return <div className="container py-12 max-w-xl"><SEOHead title="Ryhmätilauksen hallinta | Huumorikauppa" description="Ryhmätilaus" noindex /><p role="alert" className="text-destructive">{virhe}</p></div>;
  if (!h) return <div className="container py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" aria-label="Ladataan" /></div>;

  const { ryhma } = h;
  const sivu = ryhmaSivuTyypille(ryhma.tyyppi);
  const origin = window.location.origin;
  const aktiiviset = h.jasenet.filter((j) => j.tila === "tayttanyt" || j.tila === "maksettu");
  const nappi = (action: string, teksti: string, body: Record<string, unknown> = {}, vahvistus?: string, variant: "default" | "outline" | "destructive" = "default", disabled = false) => (
    <Button variant={variant} onClick={() => toiminto(action, body, vahvistus)} disabled={!!tyo || disabled} className="w-full justify-center">
      {tyo === action ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{teksti}
    </Button>
  );

  return (
    <div className="container py-8 md:py-12 max-w-5xl space-y-8">
      <SEOHead title="Ryhmätilauksen hallinta | Huumorikauppa" description="Ryhmätilauksen hallinta" noindex />
      <div>
        <p className="text-sm text-muted-foreground">{sivu.name}, vetäjän hallintasivu</p>
        <h1 className="font-display text-3xl text-foreground">{ryhma.design.nimi}</h1>
        <p className="text-muted-foreground">
          {ryhma.tila === "avoin" && `Kokotaulukossa ${ryhma.riveja}/${ryhma.paikat} riviä${ryhma.maksutapa === "jasenet" ? `, maksettu ${ryhma.maksettuja}` : ""}. Nyt ${h.porrasNyt.hinta.toFixed(2).replace(".", ",")} € paidalta (S-2XL).`}
          {ryhma.tila === "lukittu" && (ryhma.suunnitelma?.odottaaMaksua ? `Lukittu ${ryhma.suunnitelma.kpl} paidalla. Tilaus lähtee painoon, kun maksat ${euro(ryhma.suunnitelma.vetajanSumma)}.` : "Lukittu. Tilaus siirtyy painoon.")}
          {ryhma.tila === "lahetetty" && `Tilaus lähti painoon ${ryhma.lahetetty ? paivaTeksti(ryhma.lahetetty) : ""}. Paidat ovat perillä ${RYHMA_TOIMITUSAIKA} arkipäivässä osoitteessa ${ryhma.vetaja.osoite}, ${ryhma.vetaja.postinumero} ${ryhma.vetaja.kaupunki}.`}
          {ryhma.tila === "peruttu" && "Ryhmätilaus on peruttu, ja itse maksaneiden maksut on palautettu."}
          {ryhma.takaraja && ryhma.tila === "avoin" ? ` Lukitkaa viimeistään ${paivaTeksti(ryhma.takaraja)}.` : ""}
        </p>
        {h.tilaus && <p className="text-sm">Toimitus: {PRINTIFY_TILA[h.tilaus.printify] || h.tilaus.printify}{h.tilaus.seuranta && <> (<a href={h.tilaus.seuranta} className="underline" target="_blank" rel="noreferrer">seuranta</a>)</>}</p>}
      </div>

      {ryhma.tila === "avoin" && (
        <section className="space-y-2" aria-label="Jäsenlinkki">
          <h2 className="font-display text-xl text-foreground">Jäsenlinkki</h2>
          <p className="text-sm text-muted-foreground">Jaa tämä linkki ryhmälle. Jokainen täyttää oman rivinsä{ryhma.maksutapa === "jasenet" ? " ja maksaa paitansa" : ""}.</p>
          <KopioiLinkki url={`${origin}${jasenPolku(ryhma.jasenTunnus)}`} nimi="jäsenlinkki" />
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RyhmaMockup design={ryhma.design} selka={aktiiviset[0] ?? { nimi: "Nimi" }} vari={ryhma.vari} />
        <section className="space-y-3" aria-label="Yhteenveto">
          <h2 className="font-display text-xl text-foreground">Koot</h2>
          {Object.keys(h.koot).length ? (
            <p>{Object.entries(h.koot).map(([k, n]) => `${k}: ${n}`).join(", ")} (yhteensä {aktiiviset.length})</p>
          ) : <p className="text-muted-foreground">Kukaan ei ole vielä täyttänyt riviä.</p>}
          {ryhma.tila === "avoin" && (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="hallinta-paikat">Paikkoja kokotaulukossa ({RYHMA_MIN_KPL}-{RYHMA_MAX_KPL})</Label>
                <Input id="hallinta-paikat" inputMode="numeric" value={paikat} onChange={(e) => setPaikat(e.target.value.replace(/\D/g, ""))} />
              </div>
              <Button variant="outline" onClick={() => toiminto("ryhma-paivita", { paikat: Number(paikat) })} disabled={!!tyo || Number(paikat) === ryhma.paikat}>Tallenna</Button>
            </div>
          )}
          <Hintataulukko />
        </section>
      </div>

      <section className="space-y-2" aria-label="Kokotaulukko">
        <h2 className="font-display text-xl text-foreground">Kokotaulukko</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-left"><th className="py-2 pr-2">Selkään</th><th className="py-2 pr-2">Koko</th><th className="py-2 pr-2">Tila</th><th className="py-2" /></tr></thead>
            <tbody>
              {h.jasenet.map((j) => (
                <tr key={j.id} className="border-b border-border/50">
                  <td className="py-2 pr-2 text-foreground">{[j.nimi, j.numero].filter(Boolean).join(" ")}</td>
                  <td className="py-2 pr-2">{j.koko}</td>
                  <td className="py-2 pr-2">{JASEN_TILA[j.tila] || j.tila}{j.maksaja === "vetaja" ? " (vetäjä)" : ""}{j.hyvitetty ? `, palautettu ${euro(j.hyvitetty)}` : ""}</td>
                  <td className="py-2 text-right">
                    {ryhma.tila === "avoin" && ["tayttanyt", "maksettu"].includes(j.tila) && (
                      <button type="button" className="text-muted-foreground hover:text-destructive p-1" aria-label={`Poista ${j.nimi}`} disabled={!!tyo}
                        onClick={() => toiminto("ryhma-poista", { jasen: j.id }, j.tila === "maksettu" && j.maksaja === "jasen" ? `Poistetaanko ${j.nimi}? Maksu palautetaan hänen kortilleen.` : `Poistetaanko ${j.nimi}?`)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {virhe && <p className="text-sm text-destructive" role="alert">{virhe}</p>}

      {ryhma.tila === "avoin" && (
        <section className="space-y-3 rounded-xl border border-border bg-card p-4" aria-label="Lukitus">
          <h2 className="font-display text-xl text-foreground">Lukitse ja lähetä painoon</h2>
          {ryhma.maksutapa === "vetaja" ? (
            h.arvio.vetaja?.ok
              ? nappi("ryhma-lukitse", `Lukitse ${h.arvio.vetaja.kpl} paitaa ja maksa ${euro(h.arvio.vetaja.vetajanSumma)}`, {}, `Lukitaanko tilaus ${h.arvio.vetaja.kpl} paidalla? Lukituksen jälkeen rivejä ei voi muuttaa.`)
              : <p className="text-sm text-muted-foreground">{h.arvio.vetaja?.virhe}</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{RYHMA_SAANNOT[1]}</p>
              {h.arvio.jataPois?.ok
                ? nappi("ryhma-lukitse", `Lukitse nyt: ${h.arvio.jataPois.kpl} maksettua paitaa, ${h.arvio.jataPois.pois} maksamatonta jää pois`, { tapa: "jata-pois" }, `Lukitaanko tilaus ${h.arvio.jataPois.kpl} maksetulla paidalla? Maksamattomat rivit jäävät pois.`, "outline")
                : <p className="text-sm text-muted-foreground">Lukitus ilman maksamattomia: {h.arvio.jataPois?.virhe}</p>}
              {h.arvio.maksaLoput?.ok && h.arvio.maksaLoput.vetajanSumma > 0 &&
                nappi("ryhma-lukitse", `Lukitse ${h.arvio.maksaLoput.kpl} paitaa ja maksa maksamattomat ${euro(h.arvio.maksaLoput.vetajanSumma)}`, { tapa: "maksa-loput" }, "Lukitaanko tilaus ja maksatko maksamattomien paidat?", "outline")}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Lukituksen jälkeen paitamäärä ratkaisee hinnan, ja itse maksaneille palautetaan erotus. {RYHMA_SAANNOT[4]}</p>
        </section>
      )}

      {ryhma.tila === "lukittu" && ryhma.suunnitelma?.odottaaMaksua && (
        <section className="space-y-2" aria-label="Maksu">
          {nappi("ryhma-avaa", "Avaa kokotaulukko uudelleen", {}, undefined, "outline")}
        </section>
      )}

      {["avoin", "lukittu"].includes(ryhma.tila) && !(ryhma.tila === "lukittu" && !ryhma.suunnitelma?.odottaaMaksua) && (
        <section aria-label="Peruutus" className="max-w-sm">
          {nappi("ryhma-peru", "Peru ryhmätilaus", {}, "Perutaanko koko ryhmätilaus? Itse maksaneiden maksut palautetaan heidän korteilleen.", "destructive")}
        </section>
      )}
    </div>
  );
};

export default RyhmaHallintaPage;
