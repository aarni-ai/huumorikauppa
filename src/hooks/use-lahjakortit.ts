import { useEffect, useState } from "react";

/**
 * Ovatko lahjakortit myynnissä (/api/sahkoposti?tila=1, sama ehto kuin kassalla: oma sähköposti käytössä, koska koodi
 * toimitetaan sähköpostilla). Haetaan kerran sivulatausta kohden. null = ei vielä tiedossa; virhe = ei myynnissä.
 */
let haku: Promise<boolean> | null = null;
let tulos: boolean | null = null;

function haeTila(): Promise<boolean> {
  haku ??= fetch("/api/sahkoposti?tila=1")
    .then((r) => (r.ok ? r.json() : { lahjakortit: false }))
    .then((j: { lahjakortit?: boolean }) => (tulos = j.lahjakortit === true))
    .catch(() => (tulos = false));
  return haku;
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
