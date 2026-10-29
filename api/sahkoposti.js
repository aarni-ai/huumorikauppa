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
 * GET  ?tila=1                                                   { lahjakortit }: lahjakortit myynnissä (oma sähköposti käytössä)
 * GET  ?arviot=<slug>                                             tuotesivun julkaistut arviot { arviot: [{ nimi, tahdet, teksti, pvm }] }
 * POST { action: "review", token, productName, stars, text, customerName }   arvio (409 = jo arvioitu)
 * POST { action: "unsubscribe", token }                           arviosivulta: ei enää viestejä
 * POST { action: "tarjouspyynto", yritys, nimi, email, ... }      /yritykset: tallennus ja ilmoitus omistajalle
 */
import { onTietokanta, sql } from "./_lib/db.js";
import { laheta, omaVahvistusKaytossa, halytys } from "./_lib/sahkoposti.js";
import { pgMarkkinointi } from "./_lib/markkinointi-db.js";
import { tilaaUutiskirje, tallennaKori, peruViestit, tarkistaTunniste, normalisoiEmail } from "./_lib/markkinointi.js";

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
  // Lahjakorttien myyntitila sivustolle: sama ehto kuin kassalla (api/checkout.js), joten sivu avautuu itsestään,
  // kun SAHKOPOSTI_VAHVISTETTU=1 asetetaan (Resend-domain vahvistettu).
  if (req.method === "GET" && q.tila === "1") {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ lahjakortit: omaVahvistusKaytossa() });
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
      const t = {
        yritys: teksti(body.yritys, 120), nimi: teksti(body.nimi, 100), email: normalisoiEmail(teksti(body.email, 200) || ""),
        puhelin: teksti(body.puhelin, 40), maara: Number.parseInt(String(body.maara ?? ""), 10) || null, viesti: teksti(body.viesti, 2000),
      };
      if (!t.yritys || !t.nimi || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email)) {
        return res.status(400).json({ ok: false, error: "Täytä yritys, nimi ja toimiva sähköpostiosoite." });
      }
      const id = await store.tallennaTarjouspyynto(t);
      // Ilmoitus omistajalle (OMISTAJA_EMAIL); tallennus riittää, vaikka viesti epäonnistuisi.
      await halytys(`Tarjouspyyntö: ${t.yritys}${t.maara ? `, ${t.maara} kpl` : ""}`, [
        `Yritys: ${t.yritys}`, `Yhteyshenkilö: ${t.nimi}`, `Sähköposti: ${t.email}`, `Puhelin: ${t.puhelin || "-"}`,
        `Määrä: ${t.maara ?? "-"}`, `Viesti: ${t.viesti || "-"}`, `Tallennettu tarjouspyynnot.id ${id}`,
      ]).catch(() => null);
      return res.status(200).json({ ok: true });
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
