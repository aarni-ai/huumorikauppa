/**
 * Abipaitojen kaupunkisivut /abipaidat/<slug> (3.11.2026): sisällön muoto. Sisältö on tiedostoissa osaA.ts ja osaB.ts,
 * kokoaminen sivuiksi index.ts:ssä. Malli sama kuin /paidat/<slug>-ammattisivuilla (src/data/ammattisivut/).
 *
 * Tekstisäännöt (testi src/test/abikaupungit.test.ts): oma teksti (intro + osiot) 200-350 sanaa, 5 sanan jaksoista
 * alle 15 % yhteisiä minkä tahansa kahden kaupunkisivun välillä, ei ajatusviivoja (– tai —), ei jossittelua eikä
 * todistamattomia väitteitä. Päivät, hinnat ja toimitusajat tulevat vakioista (src/data/ryhmapaidat.ts), ei käsin.
 * Lukioita ei nimetä; paikalliset asiat ovat yleisesti tunnettuja maamerkkejä.
 */
export interface AbiKaupunkiSisalto {
  /** ASCII-slug: sivu on /abipaidat/<slug>. */
  slug: string;
  /** Kaupungin nimi perusmuodossa, esim. "Jyväskylä". */
  kaupunki: string;
  /** Inessiivi UKK:n kysymykseen, esim. "Jyväskylässä". */
  inessiivi: string;
  /** Hakutulosotsikko ilman brändiä (" | Huumorikauppa" lisätään, yhteensä alle 60 merkkiä). */
  otsikko: string;
  /** Metakuvaus, alle 155 merkkiä. */
  kuvaus: string;
  h1: string;
  /** 2 kappaletta: ensimmäinen kertoo, mitä sivulla tehdään, toinen penkkaripäivän ja takarajan. */
  intro: string[];
  /** 3 otsikoitua osiota kaupungin näkökulmasta. */
  osiot: { otsikko: string; teksti: string[] }[];
  /** Sivun oma kysymys (aikataulu-, hinta- ja kokotaulukkovastaus lisätään yhteisinä). */
  ukk: { q: string; a: string }[];
  /** 2-3 lähikaupunkia (slugit polut.ts:n listasta). */
  lahella: string[];
  /** Suunnittelutyökalun oletukset: ryhmän nimi (enintään 24 merkkiä), tekstirivi (28) ja selkänimet (14). */
  esimerkki: { nimi: string; teksti: string; jasenet: string[] };
}
