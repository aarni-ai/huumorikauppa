/**
 * Hallintasivujen avain (2.11.2026): ensimmäinen avaus avaimellisella linkillä tallentaa avaimen palvelimen
 * HttpOnly-evästeeseen 90 päiväksi (api/sahkoposti.js hallintaPaasy). Onnistuneen haun jälkeen avain poistetaan
 * osoiteriviltä, jottei se jää selainhistoriaan tai kuvakaappauksiin; myöhemmät avaukset toimivat evästeellä.
 */
export function poistaAvainOsoitteesta() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("avain")) return;
  url.searchParams.delete("avain");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}
