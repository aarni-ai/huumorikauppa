import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RyhmaMockup } from "@/components/RyhmaMockup";
import { Hintataulukko } from "@/components/RyhmaSuunnittelija";
import { MittaTaulukko } from "@/components/SizeGuide";
import { mittataulukko } from "@/data/mittataulukot";
import { ryhmaKutsu, lueOma, tallennaOma, euro } from "@/lib/ryhmatilaus";
import { RYHMA_SAANNOT, ryhmaSivuTyypille, paivaTeksti, type RyhmaTyyppi } from "@/data/ryhmapaidat";
import { tarkistaJasen, SELKA_NIMI_MAX } from "../../api/_lib/ryhmatilaus.js";

type Ryhma = {
  tyyppi: RyhmaTyyppi; design: { nimi: string; vuosi: string | null; teksti: string | null; logo: string | null }; vari: string;
  tila: "avoin" | "lukittu" | "lahetetty" | "peruttu"; maksutapa: "vetaja" | "jasenet"; paikat: number; takaraja: string | null;
  vapaana: number; riveja: number; maksettuja: number; koot: string[];
};
type Nakyma = { ryhma: Ryhma; nimet: string[]; hinnat: { perus: Record<string, number> }; oma: { nimi: string; numero: string | null; koko: string; tila: string; hyvitetty: number; maksettu: number | null } | null };

const TILATEKSTI: Record<Ryhma["tila"], string> = {
  avoin: "Kokotaulukko on auki.",
  lukittu: "Vetäjä on lukinnut tilauksen, ja se lähtee painoon, kun vetäjän maksu on valmis.",
  lahetetty: "Tilaus on lähtenyt painoon. Paidat toimitetaan vetäjälle.",
  peruttu: "Vetäjä on perunut ryhmätilauksen. Maksetut paidat on palautettu maksukortille.",
};

/** /ryhma/:tunnus: jäsenen näkymä jaetusta linkistä (oma rivi, koko, selkänimi ja maksu). */
const RyhmaJasenPage = () => {
  const { tunnus = "" } = useParams();
  const [haku, setHaku] = useSearchParams();
  const [n, setN] = useState<Nakyma | null>(null);
  const [virhe, setVirhe] = useState("");
  const [lomake, setLomake] = useState({ nimi: "", numero: "", koko: "M" });
  const [muokkaa, setMuokkaa] = useState(false);
  const [tyo, setTyo] = useState("");
  const [oma, setOma] = useState<string | null>(null);

  const lataa = useCallback(async (omaTunnus: string | null, maksu?: string | null) => {
    const r = await ryhmaKutsu<Nakyma>("ryhma-hae", { tunnus, oma: omaTunnus, maksu });
    if (!r.ok) { setVirhe(r.error); return; }
    setN(r);
    if (r.oma) setLomake({ nimi: r.oma.nimi, numero: r.oma.numero || "", koko: r.oma.koko });
  }, [tunnus]);

  useEffect(() => {
    const urlOma = haku.get("oma");
    if (urlOma) tallennaOma(tunnus, urlOma);
    const o = urlOma || lueOma(tunnus);
    setOma(o);
    const maksu = haku.get("maksu");
    lataa(o, maksu);
    if (urlOma || maksu) setHaku({}, { replace: true });
  }, [tunnus]); // eslint-disable-line react-hooks/exhaustive-deps

  if (virhe && !n) return <div className="container py-12 max-w-xl"><SEOHead title="Ryhmätilaus | Huumorikauppa" description="Ryhmätilaus" noindex /><p role="alert" className="text-destructive">{virhe}</p></div>;
  if (!n) return <div className="container py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" aria-label="Ladataan" /></div>;

  const { ryhma } = n;
  const sivu = ryhmaSivuTyypille(ryhma.tyyppi);
  const j = tarkistaJasen(lomake, ryhma.vari);
  const voiLisata = ryhma.tila === "avoin" && !n.oma && ryhma.vapaana > 0;
  // Sama pohja (Gildan 64000) kuin kaupan t-paidoilla (src/pages/PersonalizedPage.tsx MITTASLUG).
  const cm = mittataulukko("amatimies-t-paita", ryhma.koot);

  const tallenna = async () => {
    setVirhe("");
    if (!j.ok) { setVirhe(j.virhe); return; }
    setTyo("tallennetaan");
    const r = n.oma
      ? await ryhmaKutsu("ryhma-muokkaa", { tunnus, oma, ...lomake })
      : await ryhmaKutsu<{ oma: string }>("ryhma-liity", { tunnus, ...lomake });
    setTyo("");
    if (!r.ok) { setVirhe(r.error); return; }
    if ("oma" in r && typeof r.oma === "string") { tallennaOma(tunnus, r.oma); setOma(r.oma); await lataa(r.oma); } else await lataa(oma);
    setMuokkaa(false);
  };

  const maksa = async () => {
    setVirhe("");
    setTyo("maksu");
    const r = await ryhmaKutsu<{ url: string }>("ryhma-maksa", { tunnus, oma });
    if (!r.ok) { setTyo(""); setVirhe(r.error); return; }
    window.location.href = r.url;
  };

  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <SEOHead title={`${ryhma.design.nimi}: ryhmätilaus | Huumorikauppa`} description="Ryhmätilauksen kokotaulukko" noindex />
      <p className="text-sm text-muted-foreground mb-1">{sivu.name}</p>
      <h1 className="font-display text-3xl text-foreground mb-2">{ryhma.design.nimi}</h1>
      <p className="text-muted-foreground mb-6">{TILATEKSTI[ryhma.tila]} {ryhma.takaraja && ryhma.tila === "avoin" ? `Vetäjän tavoite lukitukselle: ${paivaTeksti(ryhma.takaraja)}.` : ""}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RyhmaMockup design={ryhma.design} selka={j.ok ? j : n.oma} vari={ryhma.vari} />

        <div className="space-y-4">
          {n.oma && !muokkaa ? (
            <section className="rounded-xl border border-border bg-card p-4 space-y-2" aria-label="Oma rivi">
              <h2 className="font-display text-xl text-foreground">Sinun paitasi</h2>
              <p>Selkään: <strong>{[n.oma.nimi, n.oma.numero].filter(Boolean).join(" ")}</strong>, koko <strong>{n.oma.koko}</strong></p>
              <p className="text-sm">
                {n.oma.tila === "maksettu" ? `Maksettu${n.oma.maksettu ? ` ${euro(n.oma.maksettu)}` : ""}.${n.oma.hyvitetty ? ` Palautettu kortille ${euro(n.oma.hyvitetty)}.` : ""}`
                  : n.oma.tila === "pois" ? "Rivi jäi pois tilauksesta, koska sitä ei ollut maksettu lukitukseen mennessä."
                    : ryhma.maksutapa === "vetaja" ? "Vetäjä maksaa paidat kerralla." : "Maksamatta."}
              </p>
              {ryhma.tila === "avoin" && ["tayttanyt", "maksettu"].includes(n.oma.tila) && <Button variant="outline" onClick={() => setMuokkaa(true)}>Muuta nimeä tai kokoa</Button>}
              {ryhma.tila === "avoin" && ryhma.maksutapa === "jasenet" && n.oma.tila === "tayttanyt" && (
                <Button className="w-full" onClick={maksa} disabled={tyo === "maksu"}>
                  {tyo === "maksu" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Maksa paitasi {euro(n.hinnat.perus[n.oma.koko])}
                </Button>
              )}
            </section>
          ) : (voiLisata || muokkaa) ? (
            <section className="rounded-xl border border-border bg-card p-4 space-y-3" aria-label="Täytä oma rivi">
              <h2 className="font-display text-xl text-foreground">{muokkaa ? "Muuta riviäsi" : "Täytä oma rivisi"}</h2>
              <div>
                <Label htmlFor="jasen-nimi">Nimi tai lempinimi selkään</Label>
                <Input id="jasen-nimi" value={lomake.nimi} maxLength={SELKA_NIMI_MAX} onChange={(e) => setLomake({ ...lomake, nimi: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="jasen-numero">Numero (valinnainen)</Label>
                  <Input id="jasen-numero" inputMode="numeric" maxLength={2} value={lomake.numero} onChange={(e) => setLomake({ ...lomake, numero: e.target.value.replace(/\D/g, "") })} />
                </div>
                <div>
                  <Label htmlFor="jasen-koko">Koko</Label>
                  <select id="jasen-koko" value={lomake.koko} onChange={(e) => setLomake({ ...lomake, koko: e.target.value })}
                    disabled={muokkaa && n.oma?.tila === "maksettu"} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {ryhma.koot.map((k) => <option key={k} value={k}>{k} ({euro(n.hinnat.perus[k])})</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Vertaa kokoa omaan hyvin istuvaan t-paitaan.</p>
              {cm && <details className="text-xs"><summary className="cursor-pointer text-primary">Mittataulukko (cm)</summary><MittaTaulukko taulukko={cm} className="mt-2" /></details>}
              <Button className="w-full" onClick={tallenna} disabled={tyo === "tallennetaan" || !j.ok}>{tyo === "tallennetaan" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Tallenna rivi</Button>
            </section>
          ) : ryhma.tila === "avoin" ? (
            <p className="rounded-xl border border-border bg-card p-4">Kokotaulukko on täynnä. Pyydä vetäjää lisäämään paikkoja.</p>
          ) : null}
          {virhe && <p className="text-sm text-destructive" role="alert">{virhe}</p>}

          <section className="space-y-2" aria-label="Kokotaulukko">
            <h2 className="font-display text-xl text-foreground">Mukana {ryhma.riveja}/{ryhma.paikat}</h2>
            {n.nimet.length > 0 && <p className="text-sm text-muted-foreground">{n.nimet.join(", ")}</p>}
            {ryhma.maksutapa === "jasenet" && <p className="text-sm text-muted-foreground">Maksettu {ryhma.maksettuja}/{ryhma.paikat}. Tilaus lähtee painoon, kun kaikki paikat on maksettu tai kun vetäjä lukitsee sen.</p>}
          </section>
        </div>
      </div>

      <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
        <div className="space-y-2">
          <h2 className="font-display text-xl text-foreground">Hinta</h2>
          <Hintataulukko />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-xl text-foreground">Maksu ja lukitus</h2>
          <ul className="space-y-1">{RYHMA_SAANNOT.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      </section>
    </div>
  );
};

export default RyhmaJasenPage;
