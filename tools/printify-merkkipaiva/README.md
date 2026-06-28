# Merkkipäivätuotteet — Printify-generointiputki

Generoi merkkipäivä-/synttäri- ja eläkevitsit, renderöi niistä painokuvat (Anton-fontti,
läpinäkyvä PNG), luo niistä Printify-tuotteet (t-paita / huppari / muki) kopioiden asetukset
nykyisistä tuotteista, ja tuottaa oppaiden suositusdatan.

Tuotteet **eivät** mene suoraan Supabaseen — ne luodaan Printifyhin, ja olemassa oleva
`auto-sync-printify` vetää ne myymälään (`products`-tauluun) kategoriatagin perusteella
(`t-shirt` / `hoodie` / `mug`, koska sync ei tunnista sanaa "muki").

## Tiedostot

| Tiedosto | Tarkoitus |
|---|---|
| `gen-spec.mjs` | Vitsit → `products-manifest.json`, `docs/merkkipaiva-tuotteet-spec.md` (stdout) ja `guideRecommendations.ts`. Slugit lasketaan täsmälleen syncin `slugify()`-logiikalla. |
| `renderer/render.mjs` | satori + sharp + opentype.js. `node render.mjs batch anton` renderöi jokaiselle vitsille pysty- (paita/huppari) ja vaaka-PNG:n (muki) hakemistoon `renderer/designs/`. |
| `pipeline.mjs` | Lataa PNG:t Printify-uploadiin ja luo tuotteet. Idempotentti (`pipeline-results.json`). `node pipeline.mjs [N]` = luo enintään N tuotetta. |
| `fix-portraits.mjs` / `fix-mugs.mjs` | Päivittävät jo luotujen tuotteiden print-area-kuvan (käytetty designien hienosäätöön). |
| `*_template.json` | Nykyisistä tuotteista kopioidut blueprint/provider/variant/print-area-asetukset. |

## Ajo

```bash
cd tools/printify-merkkipaiva
printf '%s' '<PRINTIFY_PERSONAL_ACCESS_TOKEN>' > .printify_token   # ei committoida
node gen-spec.mjs > ../../docs/merkkipaiva-tuotteet-spec.md          # manifest + suositukset + spec
( cd renderer && npm i satori sharp opentype.js && node render.mjs batch anton )
node pipeline.mjs 1     # luo 1 testituote, tarkista Printifyssä
node pipeline.mjs       # luo loput
```

Token tarvitsee scopet: `products.read/write`, `uploads.read/write`, `shops.read`. Shop-id on
`pipeline.mjs`:ssä (`SHOP`).

## Hinnoittelu (Printify-taso → myymälä syncin override)

- T-paita 27,90 € → 24,90 € · Huppari 52,90 € → 49,90 € · Muki 19,90 € (ei overridea).
