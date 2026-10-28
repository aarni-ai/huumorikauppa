import { Link } from "react-router-dom";
import { Ruler } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { parseSizeTable } from "@/lib/sizeChart";
import { mittataulukko, type Mittataulukko } from "@/data/mittataulukot";
import { ORGANIZATION } from "@/seo/site";

/** Vaatteen nimi ohjetekstiin: perusmuoto ja inessiivi. */
const GARMENT: Record<string, { noun: string; inessive: string }> = {
  hupparit: { noun: "huppari", inessive: "hupparissa" },
  bodyt: { noun: "body", inessive: "bodyssa" },
};
const DEFAULT_GARMENT = { noun: "paita", inessive: "paidassa" };

/** Senttimittataulukko pohjatuotteen mukaan (src/data/mittataulukot.ts). Tuotesivulla ja kokotaulukkoikkunassa. */
export function MittaTaulukko({ taulukko, className = "" }: { taulukko: Mittataulukko; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <caption className="text-left text-xs text-muted-foreground pb-2">
          Vaatteen mitat senttimetreinä, {taulukko.malli} (Gildanin mittalomake).
        </caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 pr-2 text-left font-medium">cm</th>
            {taulukko.koot.map((k) => (
              <th key={k} className="py-2 px-1.5 text-left font-medium">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {taulukko.rivit.map((r) => (
            <tr key={r.nimi} className="border-b border-border/50">
              <td className="py-2 pr-2 text-foreground">{r.nimi}</td>
              {r.cm.map((v, i) => (
                <td key={i} className="py-2 px-1.5 text-muted-foreground">{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        {taulukko.rivit.map((r) => (
          <li key={r.nimi}>{r.nimi}: {r.selite}.</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Kokotaulukko vaatteille. Senttimitat pohjatuotteen mukaan (src/data/mittataulukot.ts); jos pohjaa ei tunneta,
 * tuotteen oman kuvauksen mittataulukko (src/lib/sizeChart.ts), muuten saatavilla olevat koot ja ohje ilman lukuja.
 */
export function SizeGuide({
  slug,
  category,
  sizes,
  description,
  isCustom,
}: {
  slug?: string;
  category: string;
  sizes: string[];
  description: string;
  isCustom: boolean;
}) {
  const cm = mittataulukko(slug, sizes);
  const table = cm ? null : parseSizeTable(description);
  const { noun, inessive } = GARMENT[category] ?? DEFAULT_GARMENT;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="text-xs text-primary underline underline-offset-2 flex items-center gap-1 min-h-[32px]">
          <Ruler className="h-3.5 w-3.5" /> {cm ? "Kokotaulukko (cm)" : "Kokoapu"}
        </button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">{cm ? "Kokotaulukko" : "Kokoapu"}</DialogTitle>
          <DialogDescription>Saatavilla olevat koot: {sizes.join(", ")}</DialogDescription>
        </DialogHeader>
        {cm ? (
          <div className="space-y-3">
            <MittaTaulukko taulukko={cm} />
            <p className="text-sm text-muted-foreground">Vertaa leveyttä ja pituutta vaatteeseen, joka istuu hyvin sinulle tai lahjan saajalle.</p>
          </div>
        ) : table ? (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <caption className="text-left text-xs text-muted-foreground pb-2">
                Mitat tuotteen valmistajan kuvauksesta{table.unit ? ` (${table.unit === "cm" ? "cm" : "tuumaa"})` : ""}.
              </caption>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-2 text-left font-medium">Mitta</th>
                  {table.sizes.map((s) => (
                    <th key={s} className="py-2 px-1 text-left font-medium">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.label} className="border-b border-border/50">
                    <td className="py-2 pr-2 text-foreground">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="py-2 px-1 text-muted-foreground">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="text-foreground font-medium">Näin valitset koon</p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Ota {noun}, joka istuu hyvin sinulle tai lahjan saajalle.</li>
              <li>Mittaa sen leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan.</li>
              <li>
                Kysy tämän tuotteen mitat sähköpostilla{" "}
                <a href={`mailto:${ORGANIZATION.email}`} className="text-primary underline">{ORGANIZATION.email}</a>. Vastaamme 1-2 arkipäivässä.
              </li>
            </ol>
            <p>Jos tiedät vain kokomerkinnän, valitse sama koko kuin saajan omassa hyvin istuvassa {inessive}. Eri valmistajien koot eroavat, joten mittaaminen on tarkempi tapa.</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {isCustom ? (
            <>Personoidulla tuotteella ei ole 14 päivän palautusoikeutta, joten tarkista koko ennen tilausta. </>
          ) : (
            <>Jos koko ei sovi, tuotteella on 14 päivän palautusoikeus. </>
          )}
          <Link to="/palautusehdot" className="text-primary underline">Palautusehdot</Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
