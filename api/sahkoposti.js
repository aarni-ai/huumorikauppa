/**
 * /api/sahkoposti: uutiskirjeen tilaus, kassan muistutuspyyntö, peruutus, korin palautus ja arviot
 * (api/_lib/markkinointi.js). Yksi funktio kaikille, koska Vercel Hobby rajaa funktioiden määrän.
 *
 * POST { action: "tilaa", email, suostumus: true, lahde }          uutiskirje (+ ensitilauksen koodi, jos käytössä)
 * POST { action: "kori", email, items, suostumus: true|false }    kassan "Lähetä minulle muistutus" (false poistaa)
 * GET  ?peru=<tunniste>                                           peruutuslinkin tarkistus { valid, reason }
 * POST ?peru=<tunniste>                                           yhden klikkauksen peruutus (List-Unsubscribe-Post)
 * POST { action: "peru", token }                                  peruutus peruutussivulta
 * GET  ?kori=<tunniste>                                           muistutuksen kori { ok, items }
 * GET  ?arvostelu=<tunniste>                                      arviosivun tilaus { products, customerName, unsubscribed }
 * GET  ?tila=1                                                   { lahjakortit, sahkoposti }: lahjakortit myynnissä, oma sähköposti käytössä
 * GET  ?arviot=<slug>                                             tuotesivun julkaistut arviot { arviot: [{ nimi, tahdet, teksti, pvm }] }
 * POST { action: "review", token, productName, stars, text, customerName }   arvio (409 = jo arvioitu)
 * POST { action: "unsubscribe", token }                           arviosivulta: ei enää viestejä
 * POST { action: "tarjouspyynto", yritys, nimi, email, ... }      /yritykset: tallennus ja ilmoitus omistajalle
 * POST { action: "kumppaniklikki", koodi }                        kumppanilinkin avaus (laskuri, ei henkilötietoja)
 * GET  ?kumppaniraportti=<avain>                                  kumppanin oma raportti (api/_lib/kumppani.js kumppaniRaportti)
 * GET  ?tarjoukset=<avain>                                        /hallinta/tarjoukset: tarjouspyynnöt katteineen (avain: cron hallinta-linkki)
 * POST { action: "tarjoustila", avain, id, tila }                 tarjouspyynnön tila (uusi, vastattu, tilattu, hylatty)
 * POST { action: "kaynti", polku, viittaaja, utm, ref, gclid }      käyntilaskuri (api/_lib/kaynnit.js, ei tunnisteita)
 * GET  ?mittarit=<avain>                                          /hallinta/mittarit: tavoitemittari (api/_lib/mittarit.js)
 * POST { action: "yritysluvut", avain, paiva, viestit, vastaukset, tarjouspyynnot, tilaukset }  Coworkin yritysmyyntiluvut
 * POST { action: "mainoskulut", avain, paiva, kanava, kulut, klikit, konversiot, huom }  mainoskulut mittariin (api/_lib/mainoskulut.js)
 * POST { action: "suppilo", vaihe, ab }                          oma ostosuppilo (api/_lib/suppilo.js, ei tunnisteita)
 * POST { action: "aktivoi", koodi }                               kertakäyttöinen aktivointikoodi -> hallinnan evästeet 90 pv
 * GET  ?some=<avain>                                              /hallinta/some: somevideot ja Pinterest-kuvat (Blob)
 */
import { onTietokanta, sql } from "./_lib/db.js";
import { laheta, omaVahvistusKaytossa, halytys } from "./_lib/sahkoposti.js";
import { pgMarkkinointi } from "./_lib/markkinointi-db.js";
import { tilaaUutiskirje, tallennaKori, peruViestit, tarkistaTunniste, normalisoiEmail } from "./_lib/markkinointi.js";
import { kirjaaKlikki, kumppaniRaportti, kumppaniKoodinMuoto, RAPORTTI_TARKOITUS } from "./_lib/kumppani.js";
import { haeTilaus, onPrintify } from "./_lib/printify.js";
import { laskeTarjous, aikataulu, ytunnus as tarkistaYtunnus, MALLIT, KOOT } from "./_lib/yritysmyynti.js";
import { PRINTIFY_KULUKERROIN } from "./_lib/kate.js";
import { tarkistaLogopaita, logopaitaKuvaus, sallitutVarit } from "./_lib/logopaita.js";
import { kaynninLahde, sivunOsio, onBotti, kirjaaKaynti } from "./_lib/kaynnit.js";
import { lahjakortitMyynnissa } from "./_lib/lahjakortti-db.js";

/**
 * Hallintasivujen pääsy (2.11.2026): allekirjoitettu avain pyynnöstä (?mittarit=, body.avain) tai evästeestä
 * hk_hallinta_<sivu>. Kelvollinen pyynnön avain tallennetaan evästeeseen 90 päiväksi (HttpOnly, Secure, SameSite=Lax),
 * joten Coworkin Chrome pysyy sisällä avaamatta avaimellista linkkiä uudelleen. Ilman kelvollista avainta 404.
 */
const HALLINTA_EVASTE_IKA = 90 * 24 * 60 * 60;
function lueEvaste(req, nimi) {
  const pari = String(req.headers?.cookie || "").split(/;\s*/).find((c) => c.startsWith(`${nimi}=`));
  try { return pari ? decodeURIComponent(pari.slice(nimi.length + 1)) : ""; } catch { return ""; }
}
function asetaHallintaEvaste(res, sivu, avain) {
  const vanhat = [].concat(res.getHeader?.("Set-Cookie") || []);
  res.setHeader("Set-Cookie", [...vanhat, `hk_hallinta_${sivu}=${encodeURIComponent(avain)}; Path=/; Max-Age=${HALLINTA_EVASTE_IKA}; HttpOnly; Secure; SameSite=Lax`]);
}
export function hallintaPaasy(req, res, sivu, annettu) {
  const nimi = `hk_hallinta_${sivu}`;
  res.setHeader("Cache-Control", "private, no-store");
  if (annettu && tarkistaTunniste(annettu, "hallinta") === sivu) {
    asetaHallintaEvaste(res, sivu, annettu);
    return true;
  }
  const evaste = lueEvaste(req, nimi);
  return !!evaste && tarkistaTunniste(evaste, "hallinta") === sivu;
}

const teksti = (x, max) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null);

export async function kasittele(req, res, store) {
  const q = req.query || {};
  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body || "{}"); } catch { body = {}; }
  }

  // Peruutus (linkki ja yhden klikkauksen POST).
  if (typeof q.peru === "string") {
    const email = tarkistaTunniste(q.peru, "peru");
    if (!email) return res.status(400).json({ valid: false, reason: "invalid" });
    if (req.method === "POST") {
      await peruViestit(store, email, { lahde: "yksi-klikkaus" });
      return res.status(200).json({ success: true });
    }
    return res.status(200).json((await store.onKielto(email)) ? { valid: false, reason: "already_unsubscribed" } : { valid: true });
  }
  if (req.method === "GET" && typeof q.kori === "string") {
    const id = tarkistaTunniste(q.kori, "kori");
    const kori = id ? await store.haeKori(id) : null;
    if (!kori || kori.recovered_order_id) return res.status(404).json({ ok: false });
    return res.status(200).json({ ok: true, items: kori.items });
  }
  if (req.method === "GET" && typeof q.arvostelu === "string") {
    const id = tarkistaTunniste(q.arvostelu, "arvostelu");
    const tilaus = id ? await store.haeTilaus(id) : null;
    if (!tilaus) return res.status(404).json({ error: "invalid" });
    const arvioidut = new Set(await store.arvostellut(tilaus.id));
    const products = (tilaus.items || []).filter((i) => i.type !== "giftcard")
      .map((i) => ({ name: i.name, quantity: i.quantity, reviewed: arvioidut.has(i.name) }));
    return res.status(200).json({
      products, customerName: (tilaus.customer_name || "").split(/\s+/)[0] || "",
      unsubscribed: await store.onKielto(normalisoiEmail(tilaus.customer_email)),
    });
  }
  // Lahjakorttien myyntitila sivustolle: sama ehto kuin kassalla (api/checkout.js, lahjakortitMyynnissa).
  if (req.method === "GET" && q.tila === "1") {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ lahjakortit: lahjakortitMyynnissa(), sahkoposti: omaVahvistusKaytossa() });
  }
  if (req.method === "GET" && typeof q.arviot === "string") {
    const slug = teksti(q.arviot, 200);
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ arviot: [] });
    const rivit = await store.julkaistutArviot(slug);
    // Nimi muodossa "Etunimi S."; ilman nimeä "Asiakas".
    const nimi = (n) => {
      const osat = String(n || "").trim().split(/\s+/).filter(Boolean);
      return osat.length ? `${osat[0]}${osat[1] ? ` ${osat[1][0].toUpperCase()}.` : ""}` : "Asiakas";
    };
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
    return res.status(200).json({ arviot: rivit.map((r) => ({
      nimi: nimi(r.customer_name), tahdet: r.stars, teksti: r.body || "", pvm: new Date(r.created_at).toISOString().slice(0, 10),
    })) });
  }
  // Kumppanin raportti: allekirjoitettu avain (cron ?tehtava=kumppani-lisaa palauttaa linkin), ei asiakastietoja.
  if (req.method === "GET" && typeof q.kumppaniraportti === "string") {
    const koodi = kumppaniKoodinMuoto(tarkistaTunniste(q.kumppaniraportti, RAPORTTI_TARKOITUS));
    if (!koodi || (q.koodi && kumppaniKoodinMuoto(q.koodi) !== koodi)) return res.status(404).json({ ok: false });
    const raportti = await kumppaniRaportti(sql(), koodi, { haeTilaus: onPrintify() ? haeTilaus : null });
    if (!raportti) return res.status(404).json({ ok: false });
    return res.status(200).json({ ok: true, ...raportti });
  }
  // Hallinta: tarjouspyynnöt (allekirjoitettu avain, tarkoitus "hallinta"; linkki cron ?tehtava=hallinta-linkki).
  if (req.method === "GET" && typeof q.tarjoukset === "string") {
    if (!hallintaPaasy(req, res, "tarjoukset", q.tarjoukset)) return res.status(404).json({ ok: false });
    const rivit = await store.tarjouspyynnot().catch(() => []);
    return res.status(200).json({ ok: true, tarjoukset: rivit });
  }
  // Hallinta: tavoitemittari (allekirjoitettu avain "hallinta" / "mittarit", linkki cron ?tehtava=hallinta-linkki).
  if (req.method === "GET" && typeof q.mittarit === "string") {
    if (!hallintaPaasy(req, res, "mittarit", q.mittarit)) return res.status(404).json({ ok: false });
    const [{ keraaMittarit }, { pgValvonta }, { kaikkiTuotteet }] = await Promise.all([
      import("./_lib/mittarit.js"), import("./_lib/valvonta.js"), import("./_lib/tuotteet.js")]);
    const db = sql();
    const m = await keraaMittarit(db, pgValvonta(db, kaikkiTuotteet, onPrintify() ? { haeTilaus } : {}));
    return res.status(200).json({ ok: true, ...m });
  }
  // Hallinta: somevideot ja Pinterest-kuvat Coworkille (Vercel Blob some/manifest.json, scripts/some-blob.mjs).
  if (req.method === "GET" && typeof q.some === "string") {
    if (!hallintaPaasy(req, res, "some", q.some)) return res.status(404).json({ ok: false });
    const kauppa = (process.env.BLOB_READ_WRITE_TOKEN || "").split("_")[3];
    if (!kauppa) return res.status(503).json({ ok: false, error: "Blob-varasto puuttuu" });
    const r = await fetch(`https://${kauppa.toLowerCase()}.public.blob.vercel-storage.com/some/manifest.json`, { cache: "no-store" }).catch(() => null);
    if (!r?.ok) return res.status(502).json({ ok: false, error: "manifestia ei löytynyt" });
    return res.status(200).json({ ok: true, ...(await r.json()) });
  }
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST" });

  switch (body.action) {
    case "tilaa": {
      const r = await tilaaUutiskirje(store, { email: body.email, suostumus: body.suostumus, lahde: teksti(body.lahde, 40) || "lomake" }, { laheta });
      return res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true, koodiLahetetty: r.koodiLahetetty } : r);
    }
    case "kori": {
      const r = await tallennaKori(store, { email: body.email, items: body.items, suostumus: body.suostumus });
      return res.status(r.ok ? 200 : 400).json(r);
    }
    case "peru": {
      const email = tarkistaTunniste(body.token, "peru");
      if (!email) return res.status(400).json({ success: false, reason: "invalid" });
      const r = await peruViestit(store, email, { lahde: "peruutussivu" });
      return res.status(200).json(r.jo ? { success: false, reason: "already_unsubscribed" } : { success: true });
    }
    case "tarjouspyynto": {
      // Roskapostisuoja: piilokenttä täytetty -> hyväksytään hiljaa tallentamatta.
      if (teksti(body.kotisivu, 200)) return res.status(200).json({ ok: true });
      // Laskuri ja aikataulu lasketaan palvelimella uudelleen (selaimen arvoihin ei luoteta).
      const koot = Object.fromEntries(KOOT.map((k) => [k, Math.max(0, Math.min(999, Math.floor(Number(body.koot?.[k]) || 0)))]).filter(([, n]) => n > 0));
      const malli = MALLIT[body.malli] ? body.malli : null;
      const laskuri = malli && Object.keys(koot).length ? laskeTarjous({ malli, koot }, { kerroin: PRINTIFY_KULUKERROIN }) : null;
      const at = aikataulu(teksti(body.toimituspaiva, 10));
      // Oma logo tai teksti: sama tarkistus kuin kassalla; esikatselulinkki ilmoitukseen ja hallintaan.
      let logo = null;
      if (malli === "logopaita" && body.logo) {
        const v = tarkistaLogopaita({ logo: body.logo.id, rivit: body.logo.rivit, design: body.logo.design });
        if (!v.ok) return res.status(400).json({ ok: false, error: v.virhe });
        const vari = sallitutVarit(v.design).includes(body.logo.vari) ? body.logo.vari : sallitutVarit(v.design)[0];
        const q = new URLSearchParams({ logopaita: "1", vari, ...(v.logo ? { logo: v.logo } : {}), ...(v.design ? { design: v.design } : {}) });
        v.rivit.forEach((rr, i) => q.set(`r${i + 1}`, rr));
        logo = { id: v.logo, rivit: v.rivit, design: v.design, vari, kuvaus: logopaitaKuvaus(v), esikatselu: `${(process.env.KAUPPA_URL || "https://huumorikauppa.fi").replace(/\/$/, "")}/api/painokuva?${q}` };
      }
      const t = {
        yritys: teksti(body.yritys, 120), nimi: teksti(body.nimi, 100), email: normalisoiEmail(teksti(body.email, 200) || ""),
        puhelin: teksti(body.puhelin, 40), maara: laskuri?.kpl || Number.parseInt(String(body.maara ?? ""), 10) || null, viesti: teksti(body.viesti, 2000),
        paketti: teksti(body.paketti, 60), malli, koot: laskuri ? koot : null, hinta: laskuri?.yhteensa ?? null, kate: laskuri?.kate ?? null,
        toivottu_paiva: at.toivottu, ehtii: at.ehtii, jouluun: at.jouluun, ytunnus: tarkistaYtunnus(body.ytunnus), logo,
      };
      if (!t.yritys || !t.nimi || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email)) {
        return res.status(400).json({ ok: false, error: "Täytä yritys, nimi ja toimiva sähköpostiosoite." });
      }
      const id = await store.tallennaTarjouspyynto(t);
      // Ilmoitus omistajalle (OMISTAJA_EMAIL); tallennus riittää, vaikka viesti epäonnistuisi.
      const ilmoitus = await halytys(`Tarjouspyyntö: ${t.yritys}${t.maara ? `, ${t.maara} kpl` : ""}`, [
        `Yritys: ${t.yritys}`, `Yhteyshenkilö: ${t.nimi}`, `Sähköposti: ${t.email}`, `Puhelin: ${t.puhelin || "-"}`,
        `Määrä: ${t.maara ?? "-"}`, `Paketti: ${t.paketti || "-"}`, `Malli: ${t.malli || "-"}`, `Koot: ${t.koot ? JSON.stringify(t.koot) : "-"}`,
        `Hinta: ${t.hinta ?? "-"} €, kate (arvio): ${t.kate ?? "-"} €`, `Toivottu toimituspäivä: ${t.toivottu_paiva || "-"} (${t.ehtii === null ? "-" : t.ehtii ? "ehtii" : "ei ehdi"})`,
        ...(logo ? [`Oma logo tai teksti: ${logo.kuvaus}, paita ${logo.vari}`, `Esikatselu: ${logo.esikatselu}`] : []),
        `Viesti: ${t.viesti || "-"}`, `Tallennettu tarjouspyynnot.id ${id}`,
      ]).catch((e) => ({ ok: false, virhe: String(e?.message || e) }));
      // Ilmoituksen tila talteen (/hallinta/tarjoukset): epäonnistunut ilmoitus näkyy, eikä pyyntö jää huomaamatta.
      await store.merkitseTarjousIlmoitus?.(id, ilmoitus?.ok ? `lähetetty ${ilmoitus.vastaanottaja || ""}`.trim() : `virhe: ${String(ilmoitus?.virhe || "").slice(0, 200)}`).catch(() => null);
      return res.status(200).json({ ok: true, hinta: t.hinta, aikataulu: at });
    }
    case "tarjoustila": {
      if (!hallintaPaasy(req, res, "tarjoukset", body.avain)) return res.status(404).json({ ok: false });
      const tila = ["uusi", "vastattu", "tilattu", "hylatty"].includes(body.tila) ? body.tila : null;
      if (!tila || !Number.isInteger(Number(body.id))) return res.status(400).json({ ok: false });
      const r = await store.asetaTarjousTila(Number(body.id), tila);
      return res.status(200).json({ ok: r.length > 0 });
    }
    case "kaynti": {
      // Käyntilaskuri: vain koostemäärä päivä x lähde x osio, ei IP-osoitetta eikä tunnisteita (api/_lib/kaynnit.js).
      if (onBotti(String(req.headers["user-agent"] || ""))) return res.status(200).json({ ok: false });
      const lahde = kaynninLahde({ utm: teksti(body.utm, 40), ref: teksti(body.ref, 40), gclid: !!body.gclid, viittaaja: teksti(body.viittaaja, 120) });
      await kirjaaKaynti(sql(), { lahde, osio: sivunOsio(teksti(body.polku, 200)) });
      return res.status(200).json({ ok: true });
    }
    case "suppilo": {
      // Oma ostosuppilo: koostemäärä päivä x vaihe x A/B-versio (api/_lib/suppilo.js), ei tunnisteita.
      if (onBotti(String(req.headers["user-agent"] || ""))) return res.status(200).json({ ok: false });
      const { kirjaaVaihe } = await import("./_lib/suppilo.js");
      return res.status(200).json({ ok: await kirjaaVaihe(sql(), teksti(body.vaihe, 20), teksti(body.ab, 2) || "") });
    }
    case "yritysluvut": {
      // Coworkin päivän yritysmyyntiluvut (api/_lib/yritysluvut.js); avain = mittarisivun avain.
      if (!hallintaPaasy(req, res, "mittarit", body.avain)) return res.status(404).json({ ok: false });
      const { tarkistaYritysluvut, tallennaYritysluvut } = await import("./_lib/yritysluvut.js");
      const tanaan = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
      const t = tarkistaYritysluvut(body, tanaan);
      if (!t.ok) return res.status(400).json(t);
      await tallennaYritysluvut(sql(), t.rivi);
      return res.status(200).json({ ok: true, tallennettu: t.rivi });
    }
    case "aktivoi": {
      // Kertakäyttöinen aktivointikoodi (api/_lib/aktivointi.js): evästeet mittariin, someen ja tarjouspyyntöihin 90 pv.
      res.setHeader("Cache-Control", "private, no-store");
      const { kaytaAktivointikoodi } = await import("./_lib/aktivointi.js");
      const { allekirjoita } = await import("./_lib/markkinointi.js");
      const t = await kaytaAktivointikoodi(sql(), body.koodi);
      if (!t.ok) return res.status(t.syy === "lukittu" ? 429 : 400).json({ ok: false, virhe: t.syy === "lukittu" ? "Liian monta yritystä. Yritä tunnin päästä." : "Koodi on virheellinen, vanhentunut tai jo käytetty." });
      for (const sivu of ["mittarit", "some", "tarjoukset"]) asetaHallintaEvaste(res, sivu, allekirjoita("hallinta", sivu));
      return res.status(200).json({ ok: true, sivut: ["/hallinta/mittarit", "/hallinta/some", "/hallinta/tarjoukset"] });
    }
    case "mainoskulut": {
      // Mainoskulut mittariin (api/_lib/mainoskulut.js); avain = mittarisivun avain.
      if (!hallintaPaasy(req, res, "mittarit", body.avain)) return res.status(404).json({ ok: false });
      const { tarkistaMainoskulut, tallennaMainoskulut } = await import("./_lib/mainoskulut.js");
      const tanaan = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
      const t = tarkistaMainoskulut(body, tanaan);
      if (!t.ok) return res.status(400).json(t);
      await tallennaMainoskulut(sql(), t.rivi);
      return res.status(200).json({ ok: true, tallennettu: t.rivi });
    }
    case "kumppaniklikki": {
      const kirjattu = await kirjaaKlikki(sql(), body.koodi);
      return res.status(200).json({ ok: kirjattu });
    }
    case "review":
    case "unsubscribe": {
      const id = tarkistaTunniste(body.token, "arvostelu");
      const tilaus = id ? await store.haeTilaus(id) : null;
      if (!tilaus) return res.status(404).json({ error: "invalid" });
      if (body.action === "unsubscribe") {
        await peruViestit(store, tilaus.customer_email, { lahde: "arviosivu" });
        return res.status(200).json({ success: true });
      }
      const tuote = teksti(body.productName, 200);
      const tahdet = Number(body.stars);
      if (!tuote || !(tilaus.items || []).some((i) => i.name === tuote) || !Number.isInteger(tahdet) || tahdet < 1 || tahdet > 5) {
        return res.status(400).json({ error: "invalid" });
      }
      const uusi = await store.tallennaArvio({
        order_id: tilaus.id, product_name: tuote, stars: tahdet, body: teksti(body.text, 2000), customer_name: teksti(body.customerName, 100),
      });
      return res.status(uusi ? 200 : 409).json({ ok: uusi });
    }
    default:
      return res.status(400).json({ ok: false, error: "Tuntematon toiminto." });
  }
}

export default async function handler(req, res) {
  if (!onTietokanta()) return res.status(503).json({ ok: false, error: "Ei käytössä tässä ympäristössä." });
  res.setHeader("Cache-Control", "no-store");
  try {
    return await kasittele(req, res, pgMarkkinointi(sql()));
  } catch (e) {
    console.error("sahkoposti:", e?.message || e);
    return res.status(500).json({ ok: false, error: "Tallennus epäonnistui. Yritä hetken kuluttua uudelleen." });
  }
}
