import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

const ReturnsPolicy = () => {
  usePrerenderReady();
  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <SEOHead
        title="Palautus- ja peruutusehdot | Huumorikauppa.fi"
        description="Huumorikaupan palautus- ja peruutusehdot: 14 päivän peruutusoikeus, palautusprosessi, hyvitykset ja reklamaatiot. Kuluttajansuojalain mukainen palveluohjeistus."
        canonical="https://huumorikauppa.fi/palautusehdot"
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Palautusehdot", url: "https://huumorikauppa.fi/palautusehdot" },
        ]}
      />

      <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Palautusehdot</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-8">Palautus- ja peruutusehdot</h1>

      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="font-display text-xl text-foreground">1. Peruutusoikeus</h2>
          <p>Kuluttajansuojalain (6 luku 14 §) mukaisesti sinulla on oikeus peruuttaa tilauksesi 14 päivän kuluessa tuotteen vastaanottamisesta ilman erillistä syytä. Peruutusoikeus koskee kaikkia Huumorikaupan verkkokaupasta ostettuja tuotteita.</p>
          <p>Peruutusilmoitus tulee tehdä kirjallisesti sähköpostitse osoitteeseen <a href="mailto:info@huumorikauppa.fi" className="text-primary hover:underline">info@huumorikauppa.fi</a> ennen 14 päivän määräajan umpeutumista. Ilmoitukseen tulee sisällyttää tilausnumero, palautettavat tuotteet sekä yhteystietosi.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">2. Palautettavan tuotteen kunto</h2>
          <p>Palautettava tuote tulee olla käyttämättömässä ja myyntikuntoisessa kunnossa alkuperäispakkauksessaan. Tuotetta saa tarkastella samalla tavalla kuin myymälässä, mutta sitä ei saa ottaa käyttöön. Jos tuotteen arvo on alentunut käytön tai muun kuin tuotteen tarkastamiseksi välttämättömän käsittelyn seurauksena, palautuksen arvo voidaan vähentää vastaavasti.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">3. Palautuksen tekeminen</h2>
          <p>Palautusprosessi etenee seuraavasti:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Lähetä peruutusilmoitus sähköpostitse osoitteeseen <a href="mailto:info@huumorikauppa.fi" className="text-primary hover:underline">info@huumorikauppa.fi</a>.</li>
            <li>Saat sähköpostitse palautusohjeet ja palautusosoitteen.</li>
            <li>Pakkaa tuote huolellisesti alkuperäispakkaukseen ja lähetä se ohjeiden mukaisesti.</li>
            <li>Palautus tulee lähettää 14 päivän kuluessa peruutusilmoituksen tekemisestä.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">4. Palautuskustannukset</h2>
          <p>Asiakas vastaa palautuksen postikuluista, ellei tuote ole virheellinen tai väärin toimitettu. Virheellisen tuotteen palautuskustannukset korvataan kokonaisuudessaan.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">5. Hyvitykset</h2>
          <p>Palautetun tuotteen hyvitys maksetaan alkuperäisellä maksutavalla 14 päivän kuluessa siitä, kun olemme vastaanottaneet palautetun tuotteen tai todisteen sen lähettämisestä. Hyvitys sisältää tuotteen hinnan sekä alkuperäiset toimituskulut (edullisimman toimitustavan mukaisesti).</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">6. Virheelliset tai vaurioituneet tuotteet</h2>
          <p>Jos vastaanottamasi tuote on virheellinen, vaurioitunut tai väärä, ota yhteyttä asiakaspalveluumme mahdollisimman pian. Liitä viestiisi:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Tilausnumero</li>
            <li>Kuvaus virheestä tai vauriosta</li>
            <li>Valokuva tuotteesta ja pakkauksesta</li>
          </ul>
          <p className="mt-2">Virheellisen tuotteen tapauksessa korvaamme tuotteen uudella tai hyvitämme kauppahinnan kokonaisuudessaan, mukaan lukien palautuksen postikulut.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">7. Poikkeukset peruutusoikeuteen</h2>
          <p>Peruutusoikeus ei koske mittatilaustuotteita tai tuotteita, jotka on valmistettu asiakkaan henkilökohtaisten vaatimusten mukaisesti (kuluttajansuojalaki 6 luku 16 § 1 kohta).</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">8. Kuluttajaneuvonta</h2>
          <p>Mahdollisissa riitatilanteissa voit ottaa yhteyttä kuluttajaneuvontaan (<a href="https://www.kkv.fi/kuluttajaneuvonta" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.kkv.fi/kuluttajaneuvonta</a>) tai kuluttajariitalautakuntaan (<a href="https://www.kuluttajariita.fi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.kuluttajariita.fi</a>).</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">9. Yhteystiedot</h2>
          <p>Huumorikauppa<br />Helsinki, Suomi<br /><a href="mailto:info@huumorikauppa.fi" className="text-primary hover:underline">info@huumorikauppa.fi</a></p>
          <p className="text-sm mt-2">Vastaamme kaikkiin tiedusteluihin 1–2 arkipäivän kuluessa.</p>
        </section>
      </div>
    </div>
  );
};

export default ReturnsPolicy;
