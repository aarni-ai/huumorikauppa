/**
 * Lahjaopas medialle PDF:nä (2.11.2026): sama sisältö kuin /lahjaopas-media (src/data/lahjaopasMedia.generated.ts),
 * A4-tulostusasettelu (2 x 2 ideaa sivulla) Chromen headless-tulostuksella, Vercel Blobiin. Päivittää
 * MEDIA_LAHJAOPAS_PDF-osoitteen datatiedostoon.
 *
 * Ajo: BLOB_READ_WRITE_TOKEN=... NODE_PATH=<kansio, jossa @vercel/blob> node scripts/lahjaopas-media-pdf.mjs
 */
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { tmpdir } from "node:os";

const require = createRequire(join(process.env.NODE_PATH || process.cwd(), "x.js"));
const { put } = require("@vercel/blob");
const JUURI = new URL("..", import.meta.url).pathname;
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DATA = join(JUURI, "src/data/lahjaopasMedia.generated.ts");
// Kuvien käyttölupa: sama lause kuin sivulla (src/data/lahjaopasMediaTeksti.ts).
const KUVIEN_KAYTTO = (await readFile(join(JUURI, "src/data/lahjaopasMediaTeksti.ts"), "utf8")).match(/KUVIEN_KAYTTO = "([^"]+)"/)[1];

const lahde = await readFile(DATA, "utf8");
const ideat = JSON.parse(lahde.slice(lahde.indexOf("MEDIA_LAHJAIDEAT: MediaLahjaidea[] = ") + 37, lahde.indexOf("];") + 1));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hinta = (x) => `${Number(x).toFixed(2).replace(".", ",")} €`;
const kortti = (i) => `<div class="k"><img src="${esc(i.pysty)}"><div><h3>${esc(i.nimi)}</h3><p class="h">${esc(i.tuote)} · ${hinta(i.hinta)}</p>
  <p>${esc(i.kuvaus)}</p><p class="l">Kuvat: huumorikauppa.fi/lahjaopas-media<br>${esc(i.linkki.split("?")[0].replace("https://", ""))}</p></div></div>`;
const html = `<!doctype html><html lang="fi"><head><meta charset="utf-8"><title>Huumorikauppa: lahjaopas medialle 2026</title><style>
@page { size: A4; margin: 14mm; } body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 10.5pt; }
h1 { font-size: 24pt; margin: 0 0 4mm; } h2 { font-size: 15pt; margin: 6mm 0 3mm; page-break-after: avoid; }
.intro { font-size: 11pt; line-height: 1.45; } .g { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.k { display: grid; grid-template-columns: 34mm 1fr; gap: 4mm; border: 1px solid #ddd; border-radius: 3mm; padding: 3mm; break-inside: avoid; }
.k img { width: 34mm; height: 51mm; object-fit: cover; border-radius: 2mm; } h3 { font-size: 11.5pt; margin: 0 0 1.5mm; }
.k p { margin: 0 0 1.5mm; line-height: 1.35; } .h { font-weight: bold; color: #2f6d2f; } .l { font-size: 8.5pt; color: #666; }
.yt { margin-top: 8mm; padding: 4mm; background: #f3f5f1; border-radius: 3mm; line-height: 1.5; }
</style></head><body>
<h1>Lahjaopas medialle 2026</h1>
<p class="intro">Huumorikauppa.fi myy suomalaisella huumorilla painettuja t-paitoja ja huppareita. Tässä 20 lahjaideaa: kymmenen klassikkoa ja
kymmenen joulumalliston 2026 mallia. Tuotteet painetaan tilauksesta EU:ssa ja toimitetaan Suomeen. Ladattavat pysty- ja vaakakuvat:
<b>huumorikauppa.fi/lahjaopas-media</b>.</p>
<p class="intro"><b>${esc(KUVIEN_KAYTTO)}</b></p>
${[...new Set(ideat.map((i) => i.ryhma))].map((r) => `<h2>${esc(r)}</h2><div class="g">${ideat.filter((i) => i.ryhma === r).map(kortti).join("")}</div>`).join("")}
<div class="yt"><b>Yhteystiedot</b><br>Huumorikauppa (Uusiku Oy), Y-tunnus 3653666-7, Capellan puistotie 21, 00580 Helsinki<br>
Medialle: huumorikauppa@gmail.com · huumorikauppa.fi/media<br>${esc(KUVIEN_KAYTTO)}</div>
</body></html>`;

const kansio = await mkdtemp(join(tmpdir(), "lahjaopas-"));
try {
  await writeFile(join(kansio, "opas.html"), html);
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${join(kansio, "profiili")}`, "--no-pdf-header-footer",
    "--virtual-time-budget=20000", `--print-to-pdf=${join(kansio, "opas.pdf")}`, `file://${join(kansio, "opas.html")}`], { stdio: "ignore", timeout: 120000 });
  const pdf = await readFile(join(kansio, "opas.pdf"));
  await writeFile(join(JUURI, "some/kuvat/lahjaopas-media-2026.pdf"), pdf);
  const url = (await put("media/huumorikauppa-lahjaopas-2026.pdf", pdf, { access: "public", addRandomSuffix: true, contentType: "application/pdf" })).url;
  await writeFile(DATA, lahde.replace(/MEDIA_LAHJAOPAS_PDF = "[^"]*"/, `MEDIA_LAHJAOPAS_PDF = ${JSON.stringify(url)}`));
  console.log(`PDF ${Math.round(pdf.length / 1024)} kt: ${url}`);
} finally {
  await rm(kansio, { recursive: true, force: true });
}
