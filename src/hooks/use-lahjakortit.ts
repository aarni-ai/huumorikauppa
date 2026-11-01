import { useEffect, useState } from "react";

/**
 * Ovatko lahjakortit myynnissä (/api/sahkoposti?tila=1, sama ehto kuin kassalla: tietokanta ja Stripe; koodi ja PDF
 * näytetään kiitossivulla). sahkoposti: oma sähköposti käytössä, jolloin koodin voi lähettää myös saajalle.
 * Haetaan kerran sivulatausta kohden. null = ei vielä tiedossa; virhe = ei myynnissä.
 */
let haku: Promise<boolean> | null = null;
let tulos: boolean | null = null;
let sahkoposti = false;

function haeTila(): Promise<boolean> {
  haku ??= fetch("/api/sahkoposti?tila=1")
    .then((r) => (r.ok ? r.json() : { lahjakortit: false }))
    .then((j: { lahjakortit?: boolean; sahkoposti?: boolean }) => {
      sahkoposti = j.sahkoposti === true;
      return (tulos = j.lahjakortit === true);
    })
    .catch(() => (tulos = false));
  return haku;
}

/** Lähteekö lahjakortti sähköpostilla (saajan osoite -kenttä näytetään vain silloin). */
export function useLahjakorttiSahkoposti(): boolean {
  const [v, setV] = useState(sahkoposti);
  useEffect(() => {
    let peruttu = false;
    haeTila().then(() => { if (!peruttu) setV(sahkoposti); });
    return () => { peruttu = true; };
  }, []);
  return v;
}

export function useLahjakortitMyynnissa(): boolean | null {
  const [myynnissa, setMyynnissa] = useState<boolean | null>(tulos);
  useEffect(() => {
    let peruttu = false;
    haeTila().then((v) => { if (!peruttu) setMyynnissa(v); });
    return () => { peruttu = true; };
  }, []);
  return myynnissa;
}
