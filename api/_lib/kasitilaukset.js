/**
 * Printifyn käsitilausten vahti (3.11.2026, Tiinan korvausmuki -10,07 €). Kauppa tilaa aina tavallisella toimituksella
 * (api/_lib/printify.js shipping_method 1) ja kassan katevahdin läpi. Printifyn käyttöliittymässä tehty käsitilaus
 * (metadata.order_type "manual", esim. korvaustuote) ohittaa molemmat: Tiinan korvausmuki tilattiin Priority-toimituksella
 * (shipping_method 2), ja toimitus maksoi 17,00 € (tavallinen 9,99 €). Päivän yhteenveto listaa edellisen vuorokauden
 * käsitilaukset, joissa toimitus on muu kuin tavallinen tai painotalo on EU:n ulkopuolella.
 */
const EU_MAAT = new Set(["Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Czechia", "Denmark", "Estonia", "Finland",
  "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland",
  "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"]);
const TOIMITUSTAVAT = { 1: "tavallinen", 2: "Priority", 3: "Express", 4: "Economy" };

/**
 * tilaukset: Printifyn orders.json-rivit. alku, loppu: Date (tarkasteluväli created_at). Palauttaa huomiot:
 * [{ id, luotu, syyt: string[], kulu (€ ilman alv:tä: tuotteet + toimitus) }].
 */
export function kasitilausHuomiot(tilaukset, alku, loppu) {
  const huomiot = [];
  for (const o of tilaukset || []) {
    if (o?.metadata?.order_type !== "manual" || o.status === "canceled") continue;
    const luotu = new Date(String(o.created_at || "").replace(" ", "T"));
    if (!(luotu >= alku && luotu < loppu)) continue;
    const syyt = [];
    if (o.shipping_method !== 1 && o.shipping_method !== 4) syyt.push(`toimitus ${TOIMITUSTAVAT[o.shipping_method] || o.shipping_method} (kauppa käyttää tavallista)`);
    const ulkona = [...new Set((o.line_items || []).map((l) => l.metadata?.country).filter((m) => m && !EU_MAAT.has(m)))];
    if (ulkona.length) syyt.push(`painetaan EU:n ulkopuolella (${ulkona.join(", ")})`);
    if (!syyt.length) continue;
    huomiot.push({ id: o.id, luotu: luotu.toISOString().slice(0, 10), syyt, kulu: (Number(o.total_price || 0) + Number(o.total_shipping || 0)) / 100 });
  }
  return huomiot;
}

/** Yhteenvedon rivit (tyhjä, kun huomioita ei ole). */
export function kasitilausRivit(huomiot) {
  if (!huomiot.length) return [];
  return ["", "Printifyn käsitilaukset ilman kassan katevahtia:",
    ...huomiot.map((h) => `- ${h.luotu} ${h.id}: ${h.syyt.join("; ")}, kulu ${h.kulu.toFixed(2).replace(".", ",")} € ilman alv:tä. Peru ja tilaa uudelleen tavallisella toimituksella, jos tilaus ei ole vielä tuotannossa.`)];
}
