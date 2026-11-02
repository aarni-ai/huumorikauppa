/**
 * /api/painokuva?t=<allekirjoitettu tunniste>: personoidun tuotteen tilauskohtainen painokuva PNG:nä, läpinäkyvä tausta
 * (t-paita 3461 x 3955, huppari 3709 x 2472), jonka Printify hakee tilausta luodessa (api/_lib/printify.js
 * painokuvaUrl). Tunniste on allekirjoitettu (MARKKINOINTI_SALAISUUS), joten ulkopuolinen ei voi tilata omaa tekstiä
 * painettavaksi; teksti tarkistetaan lisäksi uudelleen (api/_lib/personoitu.js tarkistaPersonointi: merkit, kirosanat,
 * tavaramerkit ja mahtuminen painoalueelle). Tunnisteen data: { m: malli, a: { nimi, nimi2, vuosi, ika }, v: väri,
 * t: "t-paita" | "huppari" }; ennen 2.11.2026 luodut { m, n, i, v } (t-paita) toimivat yhä.
 *
 * Fontti Anton (SIL Open Font License) haetaan Google Fontsista ja pidetään muistissa funktion elinajan.
 * ?esikatselu=1 palauttaa 600 px leveän version.
 *
 * Oma logo -paita (api/_lib/logopaita.js, kuvat api/_lib/logopaita-kuva.js):
 *   POST { action: "logo", tyyppi: "png" | "svg", data: base64 }      logon tarkistus ja tallennus -> { ok, id, ... }
 *   GET  ?logopaita=1&logo=<id>&r1=..&r2=..&design=<slug>&vari=..      esikatselu 600 px (sama kuva kuin painossa)
 *   GET  ?t=<allekirjoitettu "logopainokuva">                          tilauskohtainen painokuva 3461 x 3955
 *
 * Ryhmäpaita (api/_lib/ryhmatilaus.js, tunnisteet api/_lib/printify.js ryhmaPainokuvat):
 *   GET  ?t=<allekirjoitettu "ryhmaetu">    etupuoli { d: { nimi, vuosi, teksti, logo }, v } 3461 x 3955 (logon kanssa logopaidan asettelu)
 *   GET  ?t=<allekirjoitettu "ryhmaselka">  selkä { s: { nimi, numero }, v } 3461 x 3955
 */
import { Resvg } from "@resvg/resvg-js";
import { tarkistaTunniste } from "./_lib/markkinointi.js";
import { painokuvaSvg, tarkistaPersonointi, PAINOALUE, PAINOALUEET } from "./_lib/personoitu.js";
import { tarkistaLogopaita } from "./_lib/logopaita.js";
import { haeFontti, logoPainokuva, tallennaLogo } from "./_lib/logopaita-kuva.js";
import { onTietokanta } from "./_lib/db.js";
import { tarkistaDesign, tarkistaJasen, etuSvg, selkaSvg, logoEtuRivit } from "./_lib/ryhmatilaus.js";

const VARIT = new Set(["Musta", "Valkoinen", "Vaaleanharmaa", "Tummansininen"]);

function lahetaPng(res, png, valimuisti) {
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", valimuisti);
  return res.status(200).send(png);
}

async function logopaita(req, res) {
  if (req.method === "POST") {
    let body = req.body || {};
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    if (body.action !== "logo") return res.status(400).json({ ok: false });
    if (!onTietokanta()) return res.status(503).json({ ok: false, virhe: "Logon lataus ei ole nyt käytössä." });
    const tulos = await tallennaLogo({ tyyppi: body.tyyppi, data: body.data }).catch((e) => {
      console.error("logo:", e?.message || e);
      return { ok: false, virhe: "Logon tallennus epäonnistui. Yritä uudelleen." };
    });
    return res.status(200).json(tulos);
  }
  const q = req.query || {};
  const allekirjoitettu = q.t ? tarkistaTunniste(String(q.t), "logopainokuva") : null;
  let data;
  if (allekirjoitettu) {
    try { data = JSON.parse(allekirjoitettu); } catch { return res.status(400).json({ ok: false }); }
  } else {
    data = { l: q.logo || null, r: [q.r1, q.r2].filter(Boolean), d: q.design || null, v: q.vari };
  }
  const valinta = tarkistaLogopaita({ logo: data.l, rivit: data.r, design: data.d });
  if (!valinta.ok) return res.status(400).json({ ok: false, virhe: valinta.virhe });
  const vari = VARIT.has(data.v) ? data.v : "Musta";
  try {
    const png = await logoPainokuva(valinta, vari, { leveys: allekirjoitettu ? PAINOALUE.leveys : 600 });
    return lahetaPng(res, png, allekirjoitettu ? "public, max-age=31536000, immutable" : "public, max-age=86400");
  } catch (e) {
    console.error("logopainokuva:", e?.message || e);
    return res.status(/puuttuu/.test(String(e?.message)) ? 404 : 500).json({ ok: false, virhe: "Esikatselua ei voitu muodostaa." });
  }
}

/** Ryhmäpaidan etu- tai selkäkuva allekirjoitetusta tunnisteesta. */
async function ryhmaKuva(req, res, data, paikka) {
  const vari = VARIT.has(data?.v) ? data.v : "Musta";
  const leveys = req.query?.esikatselu === "1" ? 600 : PAINOALUE.leveys;
  try {
    let svg;
    if (paikka === "etu") {
      const d = tarkistaDesign(data?.d || {});
      if (!d.ok) return res.status(400).json({ ok: false, virhe: d.virhe });
      if (d.logo) return lahetaPng(res, await logoPainokuva({ logo: d.logo, rivit: logoEtuRivit(d), design: null }, vari, { leveys }), "public, max-age=31536000, immutable");
      svg = etuSvg(d, vari);
    } else {
      // Koko ei vaikuta selkäkuvaan: tarkistetaan nimi ja numero mustan paidan koolla M.
      const j = tarkistaJasen({ ...(data?.s || {}), koko: "M" }, "Musta");
      if (!j.ok) return res.status(400).json({ ok: false, virhe: j.virhe });
      svg = selkaSvg(j, vari);
    }
    const png = new Resvg(svg, { fitTo: { mode: "width", value: leveys }, font: { fontFiles: [await haeFontti()], loadSystemFonts: false, defaultFontFamily: "Anton" },
      background: "rgba(0,0,0,0)" }).render().asPng();
    return lahetaPng(res, png, "public, max-age=31536000, immutable");
  } catch (e) {
    console.error("ryhmäpainokuva:", e?.message || e);
    return res.status(/puuttuu/.test(String(e?.message)) ? 404 : 500).json({ ok: false });
  }
}

export default async function handler(req, res) {
  for (const [tarkoitus, paikka] of [["ryhmaetu", "etu"], ["ryhmaselka", "selka"]]) {
    const arvo = req.method === "GET" ? tarkistaTunniste(String(req.query?.t || ""), tarkoitus) : null;
    if (!arvo) continue;
    let data;
    try { data = JSON.parse(arvo); } catch { return res.status(400).json({ ok: false }); }
    return ryhmaKuva(req, res, data, paikka);
  }
  if (req.method === "POST" || req.query?.logopaita === "1" || tarkistaTunniste(String(req.query?.t || ""), "logopainokuva")) return logopaita(req, res);
  const arvo = tarkistaTunniste(String(req.query?.t || ""), "painokuva");
  if (!arvo) return res.status(404).json({ ok: false });
  let data;
  try { data = JSON.parse(arvo); } catch { return res.status(400).json({ ok: false }); }
  const tuote = data.t === "huppari" ? "huppari" : "t-paita";
  const pers = tarkistaPersonointi({ malli: data.m, ...(data.a || { nimi: data.n, ika: data.i }) }, { tuote });
  if (!pers.ok) return res.status(400).json({ ok: false, error: pers.virhe });
  try {
    const svg = painokuvaSvg(pers, VARIT.has(data.v) ? data.v : "Musta", { tuote });
    const leveys = req.query?.esikatselu === "1" ? 600 : PAINOALUEET[tuote].leveys;
    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: leveys },
      font: { fontFiles: [await haeFontti()], loadSystemFonts: false, defaultFontFamily: "Anton" },
      background: "rgba(0,0,0,0)",
    }).render().asPng();
    return lahetaPng(res, png, "public, max-age=31536000, immutable");
  } catch (e) {
    console.error("painokuva:", e?.message || e);
    return res.status(500).json({ ok: false });
  }
}
