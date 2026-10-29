/**
 * /api/painokuva?t=<allekirjoitettu tunniste>: personoidun t-paidan tilauskohtainen painokuva PNG:nä (3461 x 3955,
 * läpinäkyvä tausta), jonka Printify hakee tilausta luodessa (api/_lib/printify.js painokuvaUrl). Tunniste on
 * allekirjoitettu (MARKKINOINTI_SALAISUUS), joten ulkopuolinen ei voi tilata omaa tekstiä painettavaksi; teksti
 * tarkistetaan lisäksi uudelleen (api/_lib/personoitu.js tarkistaPersonointi).
 *
 * Fontti Anton (SIL Open Font License) haetaan Google Fontsista ja pidetään muistissa funktion elinajan.
 * ?esikatselu=1 palauttaa 600 px leveän version.
 */
import { Resvg } from "@resvg/resvg-js";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { tarkistaTunniste } from "./_lib/markkinointi.js";
import { painokuvaSvg, tarkistaPersonointi, PAINOALUE } from "./_lib/personoitu.js";

const ANTON_TTF = "https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm0K0.ttf";
let fontti = null;

/** Fonttitiedoston polku (resvg-js lukee fontit Nodessa tiedostosta; /tmp on kirjoitettava Vercelissä). */
async function haeFontti() {
  if (fontti) return fontti;
  const r = await fetch(ANTON_TTF);
  if (!r.ok) throw new Error(`fontti ${r.status}`);
  const polku = join(tmpdir(), "anton-v27.ttf");
  await writeFile(polku, Buffer.from(await r.arrayBuffer()));
  fontti = polku;
  return fontti;
}

export default async function handler(req, res) {
  const arvo = tarkistaTunniste(String(req.query?.t || ""), "painokuva");
  if (!arvo) return res.status(404).json({ ok: false });
  let data;
  try { data = JSON.parse(arvo); } catch { return res.status(400).json({ ok: false }); }
  const pers = tarkistaPersonointi({ malli: data.m, nimi: data.n, ika: data.i });
  if (!pers.ok) return res.status(400).json({ ok: false, error: pers.virhe });
  try {
    const svg = painokuvaSvg(pers, data.v);
    const leveys = req.query?.esikatselu === "1" ? 600 : PAINOALUE.leveys;
    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: leveys },
      font: { fontFiles: [await haeFontti()], loadSystemFonts: false, defaultFontFamily: "Anton" },
      background: "rgba(0,0,0,0)",
    }).render().asPng();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.status(200).send(png);
  } catch (e) {
    console.error("painokuva:", e?.message || e);
    return res.status(500).json({ ok: false });
  }
}
