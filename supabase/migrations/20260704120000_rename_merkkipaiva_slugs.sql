-- Rename slugs for 4 milestone product designs after improved painotekstit.
-- The upsert Printify sync preserves existing slugs, so update them explicitly here.
-- Idempotent: re-running matches 0 rows once applied.

UPDATE products SET slug = '30v-selka-alkaa-jo-rusahdella-t-paita' WHERE slug = 'level-30-selka-rusahtaa-nyt-t-paita';
UPDATE products SET slug = '30v-selka-alkaa-jo-rusahdella-huppari' WHERE slug = 'level-30-selka-rusahtaa-nyt-huppari';
UPDATE products SET slug = '30v-selka-alkaa-jo-rusahdella-muki' WHERE slug = 'level-30-selka-rusahtaa-nyt-muki';
UPDATE products SET slug = '40v-kunnossa-niinku-20v-t-paita' WHERE slug = '40v-kunto-kuin-20v-20-vuotta-sitten-t-paita';
UPDATE products SET slug = '40v-kunnossa-niinku-20v-huppari' WHERE slug = '40v-kunto-kuin-20v-20-vuotta-sitten-huppari';
UPDATE products SET slug = '40v-kunnossa-niinku-20v-muki' WHERE slug = '40v-kunto-kuin-20v-20-vuotta-sitten-muki';
UPDATE products SET slug = '30-nuori-villi-ja-jo-vasynyt-t-paita' WHERE slug = '30-ja-loistossaan-t-paita';
UPDATE products SET slug = '30-nuori-villi-ja-jo-vasynyt-huppari' WHERE slug = '30-ja-loistossaan-huppari';
UPDATE products SET slug = '30-nuori-villi-ja-jo-vasynyt-muki' WHERE slug = '30-ja-loistossaan-muki';
UPDATE products SET slug = '50-vuotta-nuori-t-paita' WHERE slug = '50v-klassikkomalli-t-paita';
UPDATE products SET slug = '50-vuotta-nuori-huppari' WHERE slug = '50v-klassikkomalli-huppari';
UPDATE products SET slug = '50-vuotta-nuori-muki' WHERE slug = '50v-klassikkomalli-muki';
