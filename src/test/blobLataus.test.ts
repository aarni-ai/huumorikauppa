// @vitest-environment node
/**
 * Somevideoiden lataustoken (api/_lib/blob-lataus.js, 3.11.2026): token vain somekansion tiedostoille, oikealle
 * tiedostotyypille ja rajatuksi ajaksi; manifesti ylikirjoitetaan samaan osoitteeseen.
 */
import { describe, expect, it } from "vitest";
import { latausEhdot, luoLatausToken, MAKS_TAVUA, VOIMASSA_MS } from "../../api/_lib/blob-lataus.js";

describe("Blob-lataustoken", () => {
  it("video, kansikuva, JULKAISUT.md ja manifesti sallitaan omilla ehdoillaan", () => {
    const nyt = 1_000_000;
    expect(latausEhdot("some/videot/22-sammuta-valot-v2.mp4", nyt)).toEqual({ maximumSizeInBytes: MAKS_TAVUA, validUntil: nyt + VOIMASSA_MS, allowedContentTypes: ["video/mp4"], addRandomSuffix: true, allowOverwrite: false });
    expect(latausEhdot("some/videot/22-sammuta-valot-v2.jpg", nyt)?.allowedContentTypes).toEqual(["image/jpeg"]);
    expect(latausEhdot("some/JULKAISUT.md", nyt)?.addRandomSuffix).toBe(true);
    expect(latausEhdot("some/manifest.json", nyt)).toMatchObject({ addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60, allowedContentTypes: ["application/json"] });
  });

  it("Pinterest- ja Shopping-lisäkuvat sallitaan jpg-kuvina", () => {
    expect(latausEhdot("some/pinterest/tonnin-seteli-t-paita.jpg")).toMatchObject({ allowedContentTypes: ["image/jpeg"], addRandomSuffix: true, allowOverwrite: false });
    expect(latausEhdot("some/shopping/kalju-huppari.jpg")?.allowedContentTypes).toEqual(["image/jpeg"]);
    expect(latausEhdot("some/shopping/kalju-huppari.mp4")).toBeNull();
  });

  it("lahjaoppaan vaakakuva ja PDF sallitaan omalla tyypillään", () => {
    expect(latausEhdot("media/lahjaopas/tonnin-seteli-t-paita-vaaka.jpg")).toMatchObject({ allowedContentTypes: ["image/jpeg"], addRandomSuffix: true, allowOverwrite: false });
    expect(latausEhdot("media/huumorikauppa-lahjaopas-2026.pdf")).toMatchObject({ allowedContentTypes: ["application/pdf"], addRandomSuffix: true, allowOverwrite: false });
  });

  it("muut polut hylätään", () => {
    for (const p of ["media/lahjaopas/x.pdf", "media/lahjaopas/a/b.jpg", "media/muu.pdf", "media/huumorikauppa-lahjaopas-2026.pdf.js", "some/../api/x.js", "tuotteet/kuva.jpg", "some/videot/x.exe", "some/videot/X.mp4", "some/videot/a/b.mp4", "some/manifest.json.bak", "", null]) {
      expect(latausEhdot(p as string)).toBeNull();
    }
  });

  it("vain tokenin luonti hyväksytään, ja polku tarkistetaan ennen tokenia", async () => {
    expect((await luoLatausToken({}, { type: "blob.upload-completed", payload: {} })).status).toBe(400);
    const vanha = process.env.BLOB_READ_WRITE_TOKEN;
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_testi123_abcdefghijklmnopqrstuvwxyz";
    try {
      const r = await luoLatausToken({}, { type: "blob.generate-client-token", payload: { pathname: "api/cron/tilaukset.js", clientPayload: null, multipart: false } });
      expect(r.status).toBe(400);
      expect(r.json.error).toMatch(/polku ei sallittu/);
      const ok = await luoLatausToken({}, { type: "blob.generate-client-token", payload: { pathname: "some/videot/a-v2.mp4", clientPayload: null, multipart: false } });
      expect(ok.status).toBe(200);
      expect(ok.json.clientToken).toMatch(/^vercel_blob_client_/);
    } finally {
      if (vanha === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
      else process.env.BLOB_READ_WRITE_TOKEN = vanha;
    }
  });
});
