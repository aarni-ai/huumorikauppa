/**
 * Ryhmätilausten selainpuoli: kutsut api/checkout.js:n ryhma-toimintoihin (api/_lib/ryhmatilaus-db.js) ja jäsenen
 * oman rivin tunnus selaimen muistissa (localStorage, avain ryhmän jäsenlinkin mukaan).
 */
/** Vastaus: ok true ja tiedot, tai ok false ja error (projektissa strictNullChecks pois, joten ei erottelevaa unionia). */
export type RyhmaVastaus<T = Record<string, unknown>> = { ok: boolean; error?: string } & T;

export async function ryhmaKutsu<T = Record<string, unknown>>(action: string, body: Record<string, unknown>): Promise<RyhmaVastaus<T>> {
  try {
    const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...body }) });
    const j = await r.json().catch(() => null);
    if (!j) return { ok: false, error: "Yhteys katkesi. Yritä uudelleen." } as RyhmaVastaus<T>;
    return j.ok ? j : ({ ok: false, error: j.error || "Toiminto epäonnistui. Yritä uudelleen." } as RyhmaVastaus<T>);
  } catch {
    return { ok: false, error: "Yhteys katkesi. Yritä uudelleen." } as RyhmaVastaus<T>;
  }
}

const avain = (tunnus: string) => `hk-ryhma-${tunnus}`;
export function lueOma(tunnus: string): string | null {
  try { return localStorage.getItem(avain(tunnus)); } catch { return null; }
}
export function tallennaOma(tunnus: string, oma: string) {
  try { localStorage.setItem(avain(tunnus), oma); } catch { /* yksityinen tila */ }
}
export function poistaOma(tunnus: string) {
  try { localStorage.removeItem(avain(tunnus)); } catch { /* yksityinen tila */ }
}

export const euro = (x: number | null | undefined) => (x === null || x === undefined ? "-" : `${Number(x).toFixed(2).replace(".", ",")} €`);
export const jasenPolku = (tunnus: string) => `/ryhma/${tunnus}`;
export const hallintaPolku = (tunnus: string) => `/ryhma/hallinta/${tunnus}`;
