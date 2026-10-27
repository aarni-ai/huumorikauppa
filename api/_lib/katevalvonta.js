/**
 * Näkyvien tuotteiden katevalvonta (api/_lib/kate.js, heikoin variantti): alle myynnin rajan (20 %) ja tuntemattomat
 * kulut. Ajastus: Vercel Cron maanantaisin (/api/cron/tilaukset?tehtava=katetarkistus, vercel.json); käsiajo koneelta
 * scripts/katetarkistus.mjs.
 */
import { heikoinKate, KATE_RAJA } from "./kate.js";
import { onPiilotettu } from "./piilotetut.js";

export const pros = (x) => `${(x * 100).toFixed(1).replace(".", ",")} %`;

/** Näkyvien tuotteiden katevalvonta: { tarkistettu, alle, tuntematon } (puhdas, testattava). */
export function katevalvonta(tuotteet) {
  const naytettavat = tuotteet.filter((p) => p.is_active !== false && !onPiilotettu(p.category));
  const alle = [];
  const tuntematon = [];
  for (const p of naytettavat) {
    const k = heikoinKate(p);
    if (!k.tunnettu) tuntematon.push({ slug: p.slug, nimi: p.name, hinta: Number(p.price) });
    else if (!k.sallittu) alle.push({ slug: p.slug, nimi: p.name, hinta: Number(p.price), kate: k.kate, nettokate: k.nettokate });
  }
  alle.sort((a, b) => a.kate - b.kate);
  return { tarkistettu: naytettavat.length, alle, tuntematon };
}

export function yhteenveto(t, lahde) {
  return [
    `Katetarkistus (${lahde}): ${t.tarkistettu} näkyvää tuotetta, raja ${pros(KATE_RAJA)}.`,
    `Alle rajan: ${t.alle.length}. Kulut tuntemattomat (kassa ei ota maksua): ${t.tuntematon.length}.`,
    ...(t.alle.length ? ["", "Alle rajan:", ...t.alle.slice(0, 100).map((p) => `- ${p.nimi} (${p.slug}): ${pros(p.kate)}, nettokate ${p.nettokate} €, hinta ${p.hinta} €`)] : []),
    ...(t.tuntematon.length ? ["", "Kulut tuntemattomat (aja scripts/printify-tuonti.mjs --kulut):", ...t.tuntematon.slice(0, 50).map((p) => `- ${p.nimi} (${p.slug})`), ...(t.tuntematon.length > 50 ? [`... ja ${t.tuntematon.length - 50} muuta`] : [])] : []),
  ].join("\n");
}

/** Sähköpostin aihe yhteenvedolle. */
export const katetarkistusAihe = (t) => `[Huumorikauppa] Katetarkistus: ${t.alle.length} alle ${pros(KATE_RAJA)}, ${t.tuntematon.length} tuntematonta`;

export const htmlEsi = (teksti) =>
  `<pre style="font-family:monospace;white-space:pre-wrap">${teksti.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</pre>`;
