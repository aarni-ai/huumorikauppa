#!/usr/bin/env node
/**
 * IndexNow-ping (24.11.2026): julkaisun jälkeen kaikki sivukartan osoitteet Bingille ja muille IndexNow-hakukoneille
 * (Bing, ChatGPT-haun Bing-indeksi, Copilot, Yandex). Maksuton, ei tiliä. Avain on julkinen tiedosto
 * public/b1487b3a5992f938e01e3aa973052e5f.txt (IndexNow vaatii sen domainin juureen). Ajetaan scripts/julkaise-uusi.sh:n lopussa; virhe ei kaada julkaisua.
 * Bingin vanha nimetön sitemap-ping (bing.com/ping?sitemap=) on poistettu käytöstä, joten sitemapin lähetys Bingiin
 * ilman Webmaster Tools -tiliä tapahtuu IndexNow'n kautta.
 */
const AVAIN = "b1487b3a5992f938e01e3aa973052e5f";
const ISANTA = "huumorikauppa.fi";
const LAHDE = process.env.KAUPPA_URL || "https://huumorikauppa-five.vercel.app";

const xml = await (await fetch(`${LAHDE}/sitemap.xml`, { signal: AbortSignal.timeout(120000) })).text();
const urlit = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter((u) => u.startsWith(`https://${ISANTA}/`));
if (!urlit.length) { console.log("IndexNow: sivukartasta ei löytynyt osoitteita"); process.exit(0); }
const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: ISANTA, key: AVAIN, keyLocation: `https://${ISANTA}/${AVAIN}.txt`, urlList: urlit.slice(0, 10000) }),
  signal: AbortSignal.timeout(60000),
}).catch((e) => ({ status: 0, statusText: String(e?.message || e) }));
console.log(`IndexNow: ${urlit.length} osoitetta, vastaus ${r.status} ${r.statusText || ""}`.trim());
