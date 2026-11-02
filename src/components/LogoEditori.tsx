import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProducts } from "@/hooks/use-products";
import {
  LOGODESIGNIT, LOGO_RAJAT, TEKSTI_MAX, logoDesign, sallitutVarit, tarkistaLogopaita,
} from "../../api/_lib/logopaita.js";

export type LogoValinta = {
  logo: { id: string; nimi: string; leveys: number; korkeus: number; huomio: string | null } | null;
  r1: string; r2: string; design: string; vari: string;
};
export const TYHJA_LOGO: LogoValinta = { logo: null, r1: "", r2: "", design: "", vari: "Valkoinen" };
export const VARIKOODIT: Record<string, string> = { Musta: "#1d1d1d", Valkoinen: "#f5f5f2", Vaaleanharmaa: "#b9bbbd", Tummansininen: "#1f2a44" };
const TALLENNUS = "hk-logopaita";

/** Valinta palvelimen muodossa (api/_lib/logopaita.js tarkistaLogopaita). */
export const logoTarkistus = (v: LogoValinta) => tarkistaLogopaita({ logo: v.logo?.id ?? null, rivit: [v.r1, v.r2], design: v.design || null });

/** /yritykset -> /yritykset/tilaus: valinta istunnon ajaksi (ei henkilötietoja). */
export function tallennaLogoValinta(v: LogoValinta) {
  try { sessionStorage.setItem(TALLENNUS, JSON.stringify(v)); } catch { /* yksityinen tila */ }
}
export function lueLogoValinta(): LogoValinta | null {
  try { const v = JSON.parse(sessionStorage.getItem(TALLENNUS) || "null"); return v && typeof v === "object" ? { ...TYHJA_LOGO, ...v } : null; } catch { return null; }
}

const base64 = (b: ArrayBuffer) => {
  let s = "";
  const u = new Uint8Array(b);
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};

/** Yli 3 Mt:n PNG pienennetään selaimessa 3000 px:iin (pidempi sivu), jotta lataus mahtuu rajaan. */
async function pienennaPng(tiedosto: File): Promise<ArrayBuffer> {
  const bitmap = await createImageBitmap(tiedosto);
  const k = Math.min(1, 3000 / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bitmap.width * k);
  c.height = Math.round(bitmap.height * k);
  c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/png"));
  if (!blob) throw new Error("png");
  return blob.arrayBuffer();
}

/**
 * Logotiedoston tarkistus ja lataus palvelimelle (api/painokuva.js action "logo"). Käytössä myös ryhmäpaitojen
 * suunnittelutyökalussa (src/components/RyhmaSuunnittelija.tsx).
 */
export async function lataaLogo(f: File): Promise<{ ok: boolean; logo?: NonNullable<LogoValinta["logo"]>; virhe?: string }> {
  const svg = f.type === "image/svg+xml" || /\.svg$/i.test(f.name);
  const png = f.type === "image/png" || /\.png$/i.test(f.name);
  if (!svg && !png) return { ok: false, virhe: "Logon pitää olla PNG- tai SVG-tiedosto." };
  if (svg && f.size > LOGO_RAJAT.svgTavua) return { ok: false, virhe: "SVG-tiedosto on yli 1 Mt." };
  try {
    const data = png && f.size > LOGO_RAJAT.pngTavua ? await pienennaPng(f) : await f.arrayBuffer();
    const r = await fetch("/api/painokuva", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logo", tyyppi: svg ? "svg" : "png", data: base64(data) }) });
    const j = await r.json().catch(() => null);
    if (!j?.ok) return { ok: false, virhe: j?.virhe || "Logon lataus epäonnistui. Yritä uudelleen." };
    return { ok: true, logo: { id: j.id, nimi: f.name, leveys: j.leveys, korkeus: j.korkeus, huomio: j.huomio } };
  } catch {
    return { ok: false, virhe: "Logon lataus epäonnistui. Yritä uudelleen." };
  }
}

function useViive<T>(arvo: T, ms: number) {
  const [v, setV] = useState(arvo);
  useEffect(() => { const t = setTimeout(() => setV(arvo), ms); return () => clearTimeout(t); }, [arvo, ms]);
  return v;
}

/**
 * Oma logo tai teksti: logon lataus (PNG tai SVG, tarkkuus tarkistetaan palvelimella), kaksi tekstiriviä,
 * huumoridesign halutessa ja paidan väri. Esikatselu on sama kuva, joka painetaan (api/painokuva.js).
 */
export function LogoEditori({ arvo, setArvo, tunniste = "logo" }: { arvo: LogoValinta; setArvo: (v: LogoValinta) => void; tunniste?: string }) {
  const { data: tuotteet = [] } = useProducts();
  const kuvat = useMemo(() => new Map(tuotteet.map((p) => [p.slug, p.images?.[0]])), [tuotteet]);
  const [lataus, setLataus] = useState<"" | "ladataan" | string>("");
  const [haku, setHaku] = useState("");
  const [kuvaTila, setKuvaTila] = useState<"lataa" | "ok" | "virhe">("lataa");
  const tiedosto = useRef<HTMLInputElement>(null);
  const aseta = (muutos: Partial<LogoValinta>) => setArvo({ ...arvo, ...muutos });
  const tarkistus = logoTarkistus(arvo);
  const varit = sallitutVarit(arvo.design || null) as string[];

  // Design rajaa värit: vaihdetaan sallittuun, jos valittu ei käy.
  useEffect(() => { if (!varit.includes(arvo.vari)) setArvo({ ...arvo, vari: varit[0] }); }, [arvo, varit, setArvo]);

  const osoite = useMemo(() => {
    if (!tarkistus.ok) return null;
    const q = new URLSearchParams({ logopaita: "1", vari: arvo.vari });
    if (tarkistus.logo) q.set("logo", tarkistus.logo);
    tarkistus.rivit.forEach((r: string, i: number) => q.set(`r${i + 1}`, r));
    if (tarkistus.design) q.set("design", tarkistus.design);
    return `/api/painokuva?${q}`;
  }, [tarkistus.ok, tarkistus.logo, tarkistus.rivit?.join("|"), tarkistus.design, arvo.vari]); // eslint-disable-line react-hooks/exhaustive-deps
  const esikatselu = useViive(osoite, 600);
  useEffect(() => setKuvaTila("lataa"), [esikatselu]);

  const valitseTiedosto = async (f: File | undefined) => {
    if (!f) return;
    setLataus("ladataan");
    const r = await lataaLogo(f);
    if (tiedosto.current) tiedosto.current.value = "";
    if (!r.ok) { setLataus(r.virhe); return; }
    setLataus("");
    aseta({ logo: r.logo });
  };

  const osumat = useMemo(() => {
    const h = haku.trim().toLowerCase();
    return (h.length < 2 ? LOGODESIGNIT.slice(0, 8) : LOGODESIGNIT.filter((d: { nimi: string }) => d.nimi.toLowerCase().includes(h)).slice(0, 12)) as { slug: string; nimi: string }[];
  }, [haku]);
  const design = arvo.design ? logoDesign(arvo.design) : null;
  const tumma = arvo.vari === "Musta" || arvo.vari === "Tummansininen";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl overflow-hidden border border-border relative" style={{ background: VARIKOODIT[arvo.vari] }}>
        <div className="aspect-[3461/3955] w-3/4 mx-auto my-5 relative">
          {esikatselu ? (
            <img key={esikatselu} src={esikatselu} alt="Esikatselu painatuksesta" className="w-full h-full object-contain"
              onLoad={() => setKuvaTila("ok")} onError={() => setKuvaTila("virhe")} />
          ) : (
            <p className={`absolute inset-0 flex items-center justify-center text-center text-sm px-6 ${tumma ? "text-white/70" : "text-black/60"}`}>
              Lataa logo tai kirjoita teksti, niin esikatselu näkyy tässä.
            </p>
          )}
          {esikatselu && kuvaTila === "lataa" && <Loader2 className={`absolute top-2 right-2 h-5 w-5 animate-spin ${tumma ? "text-white/70" : "text-black/50"}`} aria-hidden="true" />}
        </div>
        <p className={`text-center text-xs pb-3 ${tumma ? "text-white/70" : "text-black/60"}`} role="status">
          {kuvaTila === "virhe" ? "Esikatselua ei voitu muodostaa. Lataa logo uudelleen." : "Esikatselu painatuksesta (paidan etupuoli)"}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-sm font-medium text-foreground block mb-1">Logo (PNG tai SVG)</span>
          {arvo.logo ? (
            <div className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm">
              <span className="min-w-0 break-words">{arvo.logo.nimi} <span className="text-muted-foreground">({arvo.logo.leveys} x {arvo.logo.korkeus} px)</span></span>
              <button type="button" onClick={() => aseta({ logo: null })} className="text-muted-foreground hover:text-destructive p-0.5" aria-label="Poista logo"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <label htmlFor={`${tunniste}-tiedosto`} className="flex items-center justify-center gap-2 h-11 rounded-md border border-dashed border-border bg-muted text-sm cursor-pointer hover:border-primary">
              {lataus === "ladataan" ? <><Loader2 className="h-4 w-4 animate-spin" /> Tarkistetaan logoa...</> : <><Upload className="h-4 w-4" /> Valitse logotiedosto</>}
            </label>
          )}
          <input id={`${tunniste}-tiedosto`} ref={tiedosto} type="file" accept=".png,.svg,image/png,image/svg+xml" className="sr-only" onChange={(e) => valitseTiedosto(e.target.files?.[0])} />
          {lataus && lataus !== "ladataan" && <p className="text-sm text-destructive mt-1" role="alert">{lataus}</p>}
          {arvo.logo?.huomio && <p className="text-xs text-muted-foreground mt-1">{arvo.logo.huomio}</p>}
          <p className="text-xs text-muted-foreground mt-1">PNG vähintään {LOGO_RAJAT.minPx} px leveä (suositus {LOGO_RAJAT.suositusPx} px), läpinäkyvä tausta. SVG sopii aina.</p>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground block">Teksti (vapaaehtoinen, enintään {TEKSTI_MAX} merkkiä riville)</span>
          <Input value={arvo.r1} maxLength={TEKSTI_MAX} onChange={(e) => aseta({ r1: e.target.value })} placeholder="esim. Yritys Oy" aria-label="Tekstirivi 1" className="bg-muted border-border" autoComplete="off" />
          <Input value={arvo.r2} maxLength={TEKSTI_MAX} onChange={(e) => aseta({ r2: e.target.value })} placeholder="esim. Pikkujoulut 2026" aria-label="Tekstirivi 2" className="bg-muted border-border" autoComplete="off" />
          {(arvo.logo || arvo.r1 || arvo.r2) && !tarkistus.ok && <p className="text-sm text-destructive" role="alert">{tarkistus.virhe}</p>}
        </div>

        <div>
          <span className="text-sm font-medium text-foreground block mb-1">Huumoridesign mukaan?</span>
          <div className="flex gap-2" role="radiogroup" aria-label="Huumoridesign mukaan">
            {[["", "Ei, vain logo tai teksti"], [design ? arvo.design : LOGODESIGNIT[0].slug, "Kyllä"]].map(([v, t]) => (
              <button key={t} type="button" role="radio" aria-checked={!!arvo.design === !!v} onClick={() => aseta({ design: v })}
                className={`px-3 h-9 rounded-md border text-sm ${!!arvo.design === !!v ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{t}</button>
            ))}
          </div>
          {arvo.design && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-foreground">Valittu: <span className="font-medium">{design?.nimi}</span></p>
              <Label htmlFor={`${tunniste}-haku`} className="sr-only">Hae designia</Label>
              <Input id={`${tunniste}-haku`} value={haku} onChange={(e) => setHaku(e.target.value)} placeholder="Hae designia, esim. eläke tai 50" className="bg-muted border-border" autoComplete="off" />
              <ul className="grid grid-cols-2 gap-2 max-h-64 overflow-auto">
                {osumat.map((d) => (
                  <li key={d.slug}>
                    <button type="button" onClick={() => aseta({ design: d.slug })}
                      className={`w-full flex items-center gap-2 rounded-md border p-1.5 text-left text-xs ${arvo.design === d.slug ? "border-primary bg-primary/5" : "border-border"}`}>
                      {kuvat.get(d.slug) && <img src={kuvat.get(d.slug)} alt="" className="h-10 w-10 rounded object-cover shrink-0" loading="lazy" />}
                      <span className="line-clamp-2">{d.nimi}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Design painetaan ylös ja logo tai teksti sen alle.</p>
            </div>
          )}
        </div>

        <div>
          <span className="text-sm font-medium text-foreground block mb-1">Paidan väri: {arvo.vari}</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Paidan väri">
            {varit.map((v) => (
              <button key={v} type="button" role="radio" aria-checked={arvo.vari === v} onClick={() => aseta({ vari: v })}
                className={`px-3 h-9 rounded-md border text-sm ${arvo.vari === v ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{v}</button>
            ))}
          </div>
          {arvo.design && <p className="text-xs text-muted-foreground mt-1">Huumoridesignit on tehty vaaleille paidoille.</p>}
        </div>
      </div>
    </div>
  );
}
