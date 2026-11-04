import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";

/**
 * /hallinta/aktivoi: kertakäyttöinen aktivointikoodi (api/sahkoposti.js action "aktivoi"). Onnistunut koodi antaa
 * tälle selaimelle 90 päivän pääsyn kaikille hallintasivuille (api/_lib/hallinta.js HALLINTASIVUT).
 * Taikalinkki /hallinta/aktivoi?t=<tunniste> (2.11.2026): aktivoi heti sivun avautuessa ilman koodia. Tunniste
 * poistetaan osoiteriviltä, ja se lähetetään vain JavaScriptillä (linkkiskannerit eivät kuluta linkkiä).
 */
const AdminActivatePage = () => {
  const [koodi, setKoodi] = useState("");
  const [tila, setTila] = useState<"" | "lahetetaan" | "ok" | string>("");
  const [haku] = useSearchParams();
  const linkki = useRef(haku.get("t"));
  useEffect(() => {
    const t = linkki.current;
    if (!t) return;
    linkki.current = null;
    window.history.replaceState(null, "", "/hallinta/aktivoi");
    setTila("lahetetaan");
    fetch("/api/sahkoposti", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "aktivoi", linkki: t }) })
      .then((r) => r.json()).catch(() => null)
      .then((j) => setTila(j?.ok ? "ok" : j?.virhe || "Aktivointi epäonnistui."));
  }, []);
  const laheta = async (e: React.FormEvent) => {
    e.preventDefault();
    setTila("lahetetaan");
    const j = await fetch("/api/sahkoposti", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "aktivoi", koodi }) })
      .then((r) => r.json()).catch(() => null);
    setTila(j?.ok ? "ok" : j?.virhe || "Aktivointi epäonnistui.");
  };
  return (
    <div className="container py-10 max-w-md">
      <SEOHead title="Hallinnan aktivointi" description="Hallinnan aktivointi" noindex={true} />
      <h1 className="font-display text-2xl text-foreground mb-3">Hallinnan aktivointi</h1>
      {tila === "ok" ? (
        <div className="space-y-3" role="status">
          <p>Aktivoitu. Tämä selain pääsee hallintasivuille 90 päivän ajan.</p>
          <ul className="list-disc pl-5 text-primary underline">
            <li><Link to="/hallinta/mittarit">Tavoitemittari</Link></li>
            <li><Link to="/hallinta/some">Somevideot ja Pinterest-kuvat</Link></li>
            <li><Link to="/hallinta/tarjoukset">Tarjouspyynnöt</Link></li>
            <li><Link to="/hallinta/kumppanit">Kumppanikoodit</Link></li>
          </ul>
        </div>
      ) : (
        <form onSubmit={laheta} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">Aktivointikoodi
            <input value={koodi} onChange={(e) => setKoodi(e.target.value)} autoComplete="one-time-code" placeholder="XXXX-XXXX"
              className="h-11 rounded border border-border bg-muted px-3 font-mono text-lg tracking-widest uppercase" />
          </label>
          <button type="submit" disabled={tila === "lahetetaan" || koodi.replace(/[^a-z0-9]/gi, "").length < 8} className="h-11 w-full rounded bg-primary font-medium text-primary-foreground disabled:opacity-50">Aktivoi</button>
          {tila && tila !== "lahetetaan" && <p className="text-sm text-destructive" role="alert">{tila}</p>}
        </form>
      )}
    </div>
  );
};

export default AdminActivatePage;
