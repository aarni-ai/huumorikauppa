/**
 * Microsoft Clarity (2.11.2026, ilmainen istuntotallenne ja lämpökartat): POIS PÄÄLTÄ, kunnes projektin tunniste on
 * asetettu. Tunniste: Vercelin ympäristömuuttuja VITE_CLARITY_ID (Production, vaatii uuden julkaisun) tai tämän
 * vakion arvo. Ohje: KAYTTOONOTTO.md kohta 19. Lataus vain analytiikkasuostumuksella (src/lib/clarity.ts).
 */
export const CLARITY_PROJEKTI = "";
export const clarityTunniste = (): string => {
  const env = (import.meta.env?.VITE_CLARITY_ID as string | undefined) || "";
  const id = (env || CLARITY_PROJEKTI).trim();
  return /^[a-z0-9]{6,20}$/i.test(id) ? id : "";
};
