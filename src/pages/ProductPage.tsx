import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { categories } from "@/data/products";
import { useProduct } from "@/hooks/use-products";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo, useCallback } from "react";
import { sortSizes } from "@/lib/sortSizes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Share2, Ruler, Truck, RotateCcw, Shield, Copy, MessageCircle, ChevronDown, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductCard } from "@/components/ProductCard";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

// Category-specific review pools with contextually relevant content
type Review = { name: string; text: string; stars: number; date: string };

const REVIEWS_BY_CATEGORY: Record<string, Review[]> = {
  "hupparit": [
    { name: "Mika L.", text: "Todella lämmin ja mukava huppari! Materiaali tuntuu laadukkaalta ja printtikin kestää pesua.", stars: 5, date: "12.1.2026" },
    { name: "Sanna K.", text: "Ostin tämän lahjaksi ja vastaanottaja oli ihan fiiliksissä. Istuvuus oli just sopiva.", stars: 5, date: "3.2.2026" },
    { name: "Heikki R.", text: "Hyvä huppari, mutta olisin voinut ottaa yhden koon isomman. Materiaali on kuitenkin todella pehmeä.", stars: 4, date: "22.1.2026" },
    { name: "Emilia J.", text: "Rakastan tätä hupparia! Käytän sitä kotona melkein joka päivä. Lämmin ja mukava. 😂", stars: 5, date: "28.12.2025" },
    { name: "Tomi S.", text: "Printti on tosi kestävä ja värit kirkkaat. Ei haalistu pesussa. Suosittelen!", stars: 5, date: "9.1.2026" },
    { name: "Päivi K.", text: "Mukava ja pehmeä materiaali, painatus on siisti. Olen tosi tyytyväinen tähän!", stars: 5, date: "11.2.2026" },
    { name: "Jenni S.", text: "Tämä huppari on niin hauska! Sai paljon kehuja kavereilta.", stars: 5, date: "25.2.2026" },
    { name: "Jarmo H.", text: "Tilasin itselleni ja vaimolle. Molemmat tyytyväisiä, laatu kohdillaan.", stars: 5, date: "15.8.2025" },
    { name: "Outi V.", text: "Todella kiva huppari arkikäyttöön. Sopii lenkkeilyyn ja kotiin.", stars: 5, date: "2.3.2026" },
    { name: "Riku M.", text: "Huppari on aivan mahtava! Pehmeä kangas ja hauska teksti.", stars: 5, date: "8.2.2026" },
  ],
  "t-paidat": [
    { name: "Jukka P.", text: "Paidan laatu yllätti positiivisesti! Printti on selkeä ja värikäs.", stars: 5, date: "18.11.2025" },
    { name: "Tiina V.", text: "Ostin itselleni ja olen tosi tyytyväinen. Istuvuus on täydellinen ja kangas miellyttävä.", stars: 5, date: "7.12.2025" },
    { name: "Antti K.", text: "Todella mukava materiaali ja hauska teksti. Paita kerää aina kehuja!", stars: 5, date: "19.10.2025" },
    { name: "Laura M.", text: "Mahtava lahja! Vastaanottaja ei voinut lopettaa nauramista. Paidan laatu on myös hyvä.", stars: 5, date: "5.3.2026" },
    { name: "Petri T.", text: "Ihan hauska paita, toimitus tuli nopeasti perille. Kangas voisi olla vähän paksumpi.", stars: 4, date: "14.2.2026" },
    { name: "Riikka H.", text: "Ostin polttareihin koko porukalle – täysosuma! Kaikki tykkäsi paidoistaan.", stars: 5, date: "1.6.2025" },
    { name: "Ville M.", text: "Hyvä paita hyvään hintaan. Tilasin jo toisen eri tekstillä!", stars: 5, date: "8.9.2025" },
    { name: "Kaisa P.", text: "Kaveri nauroi ääneen kun avasi paketin. Paita on hauska ja laadukas!", stars: 5, date: "30.1.2026" },
    { name: "Johanna R.", text: "Tämä paita on niin hauska! Työkaverit olivat kateellisia. 😄", stars: 5, date: "29.9.2025" },
    { name: "Matias L.", text: "Kolmas paitatilaus tästä kaupasta, aina yhtä tyytyväinen laatuun!", stars: 5, date: "17.2.2026" },
  ],
  "mukit": [
    { name: "Markku T.", text: "Loistava muki! Teksti on hauska ja laatu erinomainen. Kestää konepesun hyvin.", stars: 5, date: "16.11.2025" },
    { name: "Henna L.", text: "Ostin toimistoon ja kollegat olivat ihastuksissaan. Kahvi maistuu paremmalta tästä mukista 😄", stars: 5, date: "4.3.2026" },
    { name: "Tommi R.", text: "Tilasin joululahjaksi – osui ja upposi! Muki on tukeva ja painatus kestävä.", stars: 5, date: "20.12.2025" },
    { name: "Aki V.", text: "Nopea toimitus ja muki vastasi kuvaa. Hyvä laatu!", stars: 5, date: "27.1.2026" },
    { name: "Susanna M.", text: "Kiva muki, mutta toimituksessa kesti vähän normaalia pidempään.", stars: 4, date: "6.1.2026" },
    { name: "Noora S.", text: "Ostin tämän äitienpäivälahjaksi ja äiti käyttää sitä joka aamu!", stars: 5, date: "10.5.2025" },
    { name: "Samuli K.", text: "Lahjaksi ostettu ja oli täydellinen valinta. Muki on iso ja tukeva.", stars: 5, date: "13.12.2025" },
    { name: "Katja T.", text: "Hauska muki hyvään hintaan. Käytän itse joka päivä.", stars: 5, date: "21.1.2026" },
  ],
  "tarrat": [
    { name: "Kimmo P.", text: "Tarrat olivat laadukkaita ja kestäviä! Liimasin läppäriin ja kestää hyvin.", stars: 5, date: "23.11.2025" },
    { name: "Maija S.", text: "Kivat tarrat, laitoin vesipulloon. Yllättävän hyvä laatu hintaan nähden.", stars: 5, date: "24.10.2025" },
    { name: "Ville M.", text: "Ostin useamman eri tarran, kaikki olivat laadukkaita. Hyvä liimapinta!", stars: 5, date: "8.9.2025" },
    { name: "Jenni S.", text: "Hauska tarra! Sopii hyvin autoon ja läppäriin.", stars: 5, date: "25.2.2026" },
  ],
  "bodyt": [
    { name: "Laura M.", text: "Niin suloinen body! Kangas on pehmeää ja miellyttävää vauvan iholle.", stars: 5, date: "5.3.2026" },
    { name: "Noora S.", text: "Ostin tämän vauvalle lahjaksi – vanhemmat rakastivat sitä! Hauska teksti.", stars: 5, date: "10.5.2025" },
    { name: "Sanna K.", text: "Materiaali on laadukasta ja koko oli juuri oikea. Painatus kestävä!", stars: 5, date: "3.2.2026" },
    { name: "Päivi K.", text: "Söpö body! Toimitus oli nopea ja laatu hyvä. Suosittelen.", stars: 5, date: "11.2.2026" },
    { name: "Henna L.", text: "Todella kiva! Laitoin tämän vauvankuvauksiin. Sopii täydellisesti.", stars: 5, date: "4.3.2026" },
  ],
  "peitot": [
    { name: "Outi V.", text: "Pehmeä ja lämmin peitto! Kuvio on hauska ja laatu erinomainen.", stars: 5, date: "2.3.2026" },
    { name: "Tiina V.", text: "Ostin sohvapeitoksi ja on todella mukava. Kestää hyvin pesun.", stars: 5, date: "7.12.2025" },
    { name: "Jarmo H.", text: "Hyvä laatu ja hauska kuvio. Sopii täydellisesti olohuoneeseen.", stars: 5, date: "15.8.2025" },
    { name: "Emilia J.", text: "Rakastan tätä peittoa! Se on niin pehmeä ja lämmin. Kiva lahja!", stars: 5, date: "28.12.2025" },
  ],
  "pipot": [
    { name: "Antti K.", text: "Lämmin ja mukava pipo! Istuu hyvin päähän ja materiaali on laadukasta.", stars: 5, date: "19.10.2025" },
    { name: "Mika L.", text: "Hyvä pipo talveen. Brodeeraus näyttää siistiltä ja kestää hyvin.", stars: 5, date: "12.1.2026" },
    { name: "Heikki R.", text: "Ihan ok pipo, mutta hieman tiukka. Materiaali on kuitenkin pehmeä.", stars: 4, date: "22.1.2026" },
    { name: "Riku M.", text: "Mahtava pipo! Käytän joka päivä ja saa aina kehuja.", stars: 5, date: "8.2.2026" },
  ],
  "laukut": [
    { name: "Katja T.", text: "Kiva kassi! Mahtuu paljon tavaraa ja kankaan laatu on hyvä.", stars: 5, date: "21.1.2026" },
    { name: "Susanna M.", text: "Käytän tätä kauppakassina ja se on tosi kestävä. Hauska kuva!", stars: 5, date: "6.1.2026" },
    { name: "Kaisa P.", text: "Ostin lahjaksi ja tykkäsin niin paljon että tilasin itsellekin.", stars: 5, date: "30.1.2026" },
    { name: "Maija S.", text: "Kestävä kassi ja hauska teksti. Sopii arkeen ja reissuihin.", stars: 5, date: "24.10.2025" },
  ],
  "seinataulut": [
    { name: "Markku T.", text: "Printti on todella tarkka ja värit kirkkaat. Näyttää hienolta seinällä!", stars: 5, date: "16.11.2025" },
    { name: "Johanna R.", text: "Tilasin toimistoon ja kaikki tykkäävät siitä. Hyvä laatu!", stars: 5, date: "29.9.2025" },
    { name: "Tomi S.", text: "Hauska taulu! Sopii täydellisesti miehen luolaan. Värit ovat kirkkaat.", stars: 5, date: "9.1.2026" },
  ],
  "pitkahihaiset": [
    { name: "Jukka P.", text: "Laadukas pitkähihainen! Kangas on paksua ja mukavaa. Printti kestää.", stars: 5, date: "18.11.2025" },
    { name: "Tiina V.", text: "Todella mukava päällä ja sopii hyvin kerrospukeutumiseen.", stars: 5, date: "7.12.2025" },
    { name: "Antti K.", text: "Hauska teksti ja hyvä materiaali. Sopii syksyyn täydellisesti.", stars: 5, date: "19.10.2025" },
    { name: "Petri T.", text: "Ihan hyvä paita arkeen. Olisi voinut olla hieman pidempi.", stars: 4, date: "14.2.2026" },
    { name: "Ville M.", text: "Laadukas ja mukava pitkähihainen, painatus on selkeä ja kestävä.", stars: 5, date: "8.9.2025" },
  ],
  "koristeet": [
    { name: "Noora S.", text: "Söpö koriste! Sopii täydellisesti joulukuuseen. Laatu on hyvä.", stars: 5, date: "10.5.2025" },
    { name: "Samuli K.", text: "Hauska pieni koriste, toimii myös kivana lahjana. Painatus siisti!", stars: 5, date: "13.12.2025" },
    { name: "Laura M.", text: "Ostin useamman eri koristeen – kaikki olivat laadukkaita ja hauskoja!", stars: 5, date: "5.3.2026" },
  ],
};

// Fallback for categories not listed above
const REVIEWS_GENERIC: Review[] = [
  { name: "Mika L.", text: "Hyvä tuote ja nopea toimitus! Suosittelen.", stars: 5, date: "12.1.2026" },
  { name: "Sanna K.", text: "Todella kiva tuote, sai paljon naurua aikaan!", stars: 5, date: "3.2.2026" },
  { name: "Aki V.", text: "Nopea toimitus ja tuote vastasi kuvaa. Kiitos!", stars: 5, date: "27.1.2026" },
  { name: "Katja T.", text: "Kiva tuote hyvään hintaan. Toimitus nopea.", stars: 5, date: "21.1.2026" },
];

// Theme-specific review additions based on product name keywords
const THEME_REVIEWS: Record<string, Review[]> = {
  "äiti": [
    { name: "Noora S.", text: "Ostin äitienpäivälahjaksi ja äiti oli aivan innoissaan! Paras lahja ikinä.", stars: 5, date: "10.5.2025" },
    { name: "Samuli K.", text: "Äiti rakasti tätä! Sanoi että on paras lahja mitä on saanut vuosiin.", stars: 5, date: "13.12.2025" },
  ],
  "isä": [
    { name: "Tommi R.", text: "Tilasin isänpäivälahjaksi – isä oli ihmeissään ja käyttää tätä ylpeänä!", stars: 5, date: "20.12.2025" },
    { name: "Laura M.", text: "Isä nauroi ääneen kun avasi paketin. Täydellinen lahja!", stars: 5, date: "5.3.2026" },
  ],
  "iskä": [
    { name: "Tommi R.", text: "Isälle joululahjaksi – tykkäsi ihan valtavasti ja käyttää kotona jatkuvasti!", stars: 5, date: "20.12.2025" },
    { name: "Laura M.", text: "Iskä nauroi ihan kippurassa kun avasi paketin. Paras lahja!", stars: 5, date: "5.3.2026" },
  ],
  "kalast": [
    { name: "Jarmo H.", text: "Kalakaveri tykkäsi ihan valtavasti! Tämä on nyt kalastusreissun vakiovaruste.", stars: 5, date: "15.8.2025" },
    { name: "Kimmo P.", text: "Paras lahja kalastajalle! Sai koko porukan nauramaan veneessä.", stars: 5, date: "23.11.2025" },
  ],
  "kalamies": [
    { name: "Jarmo H.", text: "Ostin kaverille joka kalastaa joka viikonloppu – sanoi että paras lahja ikinä!", stars: 5, date: "15.8.2025" },
    { name: "Riku M.", text: "Kalamies-teksti on niin osuva! Käytän tätä aina kun lähden kalaan.", stars: 5, date: "8.2.2026" },
  ],
  "girlfriend": [
    { name: "Ville M.", text: "Tyttöystävä tykkäsi tosi paljon! Käyttää tätä jatkuvasti. Söpö idea.", stars: 5, date: "8.9.2025" },
    { name: "Matias L.", text: "Ostin itselleni ja tyttöystävä oli otettu. Hauska ja romanttinen samaan aikaan!", stars: 5, date: "17.2.2026" },
  ],
  "boyfriend": [
    { name: "Jenni S.", text: "Poikaystävä tykkäsi! Käyttää tätä ylpeänä. Ihana lahja parisuhteeseen.", stars: 5, date: "25.2.2026" },
    { name: "Emilia J.", text: "Ostin itselleni ja poikaystävä oli tosi otettu kun näki. Söpö!", stars: 5, date: "28.12.2025" },
  ],
  "swedish": [
    { name: "Sanna K.", text: "Hauska paita! Sai paljon naurua ja kommentteja kavereilta.", stars: 5, date: "3.2.2026" },
    { name: "Antti K.", text: "Ostin vitsillä ja nyt käytän tätä ihan tosissaan. Hauska!", stars: 5, date: "19.10.2025" },
  ],
  "golf": [
    { name: "Markku T.", text: "Golfkaverit olivat kateellisia! Täydellinen tuote kentälle.", stars: 5, date: "16.11.2025" },
  ],
  "eläk": [
    { name: "Kaisa P.", text: "Ostin eläkkeelle siirtyvälle kollegalle – koko toimisto nauroi! Mahtava lahja.", stars: 5, date: "30.1.2026" },
    { name: "Matias L.", text: "Eläkejuhlien paras lahja! Juhlakalu oli todella otettu.", stars: 5, date: "17.2.2026" },
  ],
  "capybara": [
    { name: "Emilia J.", text: "Rakastan capybaroja ja tämä on aivan täydellinen! Söpöin tuote ikinä! 🥰", stars: 5, date: "28.12.2025" },
  ],
  "setä": [
    { name: "Tommi R.", text: "Sedälle joululahjaksi – piti itse niin hauskana että nauroi kippurassa!", stars: 5, date: "20.12.2025" },
  ],
  "polttari": [
    { name: "Riikka H.", text: "Tilattiin polttareihin koko porukalle – menivät kuumille kiville! Ehdoton suositus.", stars: 5, date: "1.6.2025" },
  ],
  "nörtti": [
    { name: "Jukka P.", text: "IT-porukkaan täydellinen! Kaikki ymmärtävät vitsin ja tykkäävät.", stars: 5, date: "18.11.2025" },
  ],
  "alkoholi": [
    { name: "Mika L.", text: "Kaveriporukka nauroi makeasti kun tuli tämä esiin baarissa. Loistava!", stars: 5, date: "12.1.2026" },
    { name: "Jukka P.", text: "Hauska teksti ja sopii täydellisesti illanistujaisiin. Aina saa naurut!", stars: 5, date: "18.11.2025" },
  ],
  "kaljaa": [
    { name: "Antti K.", text: "Paras paita bileisiin! Kaikki kysyy mistä tämän saa.", stars: 5, date: "19.10.2025" },
    { name: "Tomi S.", text: "Kaveriporukan suosikki! Aina tulee hymyä kun tämä on päällä.", stars: 5, date: "9.1.2026" },
  ],
  "kalju": [
    { name: "Heikki R.", text: "Itseironinen ja hauska! Työkaverit tykkäsi ja sai hyvät naurut.", stars: 5, date: "22.1.2026" },
    { name: "Jarmo H.", text: "Paras paita kaljulle miehelle! Huumori on parasta lääkettä.", stars: 5, date: "15.8.2025" },
  ],
  "mersu": [
    { name: "Markku T.", text: "Mercedes-fanille täydellinen! Käytän tätä aina autoharrastajien tapaamisissa.", stars: 5, date: "16.11.2025" },
    { name: "Kimmo P.", text: "Mersukuskit tietää! Tämä on nyt vakiovaruste autotapahtumissa.", stars: 5, date: "23.11.2025" },
  ],
  "audi": [
    { name: "Mika L.", text: "Audi-faneille pakollinen! Sai paljon kehuja automiitissä.", stars: 5, date: "12.1.2026" },
  ],
  "bemari": [
    { name: "Tomi S.", text: "BMW-kuskin paras muki! Kollegat on kateellisia.", stars: 5, date: "9.1.2026" },
  ],
  "museo": [
    { name: "Jarmo H.", text: "Hauska vitsi ja sopii täydellisesti autoharrastajalle!", stars: 5, date: "15.8.2025" },
    { name: "Riku M.", text: "Museokamaa-teksti on nerokas! Saa aina hymyn autopiireissä.", stars: 5, date: "8.2.2026" },
  ],
  "sähkömies": [
    { name: "Antti K.", text: "Sähkömiehelle paras lahja! Työkaverit nauroi makeasti.", stars: 5, date: "19.10.2025" },
    { name: "Kimmo P.", text: "Ostin sähköasentaja-kaverille – sanoi että paras paita ikinä!", stars: 5, date: "23.11.2025" },
  ],
  "tunari": [
    { name: "Mika L.", text: "Hauska teksti! Sopii moneen tilanteeseen ja saa aina naurut.", stars: 5, date: "12.1.2026" },
    { name: "Ville M.", text: "Ostin kaveriporukalle ja kaikki tykkäsi. Hauska ja laadukas!", stars: 5, date: "8.9.2025" },
  ],
  "tonnin": [
    { name: "Jukka P.", text: "Klassikkovitsi ja laadukas tuote! Saa aina hymyn.", stars: 5, date: "18.11.2025" },
    { name: "Heikki R.", text: "Jokainen suomalainen tunnistaa tämän – loistava!", stars: 5, date: "22.1.2026" },
  ],
  "ice": [
    { name: "Tomi S.", text: "Meemiklassikko! Sai paljon naurua ja kehuja kavereilta.", stars: 5, date: "9.1.2026" },
    { name: "Riku M.", text: "Paras meemipaita/huppari mitä oon nähny! Kaikki tunnistaa tän.", stars: 5, date: "8.2.2026" },
  ],
  "ukki": [
    { name: "Noora S.", text: "Ukille joululahjaksi ja oli tosi tyytyväinen! Käyttää ylpeänä.", stars: 5, date: "10.5.2025" },
    { name: "Laura M.", text: "Paras lahja ukille! Oli tosi otettu ja näyttää sitä kaikille.", stars: 5, date: "5.3.2026" },
  ],
  "pappa": [
    { name: "Samuli K.", text: "Papalle syntymäpäivälahjaksi – oli tosi iloinen ja käyttää jatkuvasti!", stars: 5, date: "13.12.2025" },
    { name: "Katja T.", text: "Pappa oli ihan fiiliksissä! Sanoi että on paras lahja.", stars: 5, date: "21.1.2026" },
  ],
  "isäntä": [
    { name: "Sanna K.", text: "Ostin miehelle ja tykkäsi ihan valtavasti! Sopii täydellisesti.", stars: 5, date: "3.2.2026" },
    { name: "Päivi K.", text: "Hauska ja osuva! Mies käyttää tätä ylpeänä.", stars: 5, date: "11.2.2026" },
  ],
};

// Deterministic hash
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getProductReviews(product: { id: string; name: string; category: string }): Review[] {
  const h = hashString(product.id);
  
  // Varying count: 2-5 reviews based on hash
  const counts = [2, 3, 3, 4, 4, 5, 2, 3, 5, 4];
  const count = counts[h % counts.length];
  
  // Get category-specific reviews
  const categoryReviews = REVIEWS_BY_CATEGORY[product.category] || REVIEWS_GENERIC;
  
  // Check for theme-specific reviews based on product name
  const nameLower = product.name.toLowerCase();
  let themeReview: Review | null = null;
  for (const [keyword, reviews] of Object.entries(THEME_REVIEWS)) {
    if (nameLower.includes(keyword)) {
      themeReview = reviews[h % reviews.length];
      break;
    }
  }
  
  // Pick category reviews deterministically
  const picked: Review[] = [];
  const usedNames = new Set<string>();
  
  // Add theme review first if available
  if (themeReview) {
    picked.push(themeReview);
    usedNames.add(themeReview.name);
  }
  
  // Fill remaining from category pool
  const startIdx = h % categoryReviews.length;
  for (let i = 0; picked.length < count; i++) {
    const review = categoryReviews[(startIdx + i) % categoryReviews.length];
    if (!usedNames.has(review.name)) {
      picked.push(review);
      usedNames.add(review.name);
    }
    if (i > categoryReviews.length + 5) break; // safety
  }
  
  return picked;
}

function parseDescription(description: string) {
  const sectionHeaders = [
    "TUOTTEEN OMINAISUUDET",
    "Tuotteen ominaisuudet",
    "Product features",
    "HOITO-OHJEET",
    "Hoito-ohjeet",
    "Care instructions",
    "MATERIAALI",
    "Materiaali",
  ];

  let text = description;

  // 1. Insert newlines BEFORE known section headers that are glued to preceding text
  for (const header of sectionHeaders) {
    // Match header glued to previous text (no newline before it)
    text = text.replace(new RegExp(`(?<![\\n])(?=${escapeRegex(header)})`, "gi"), "\n\n");
  }

  // 2. Insert newline AFTER section header if content is glued to it
  for (const header of sectionHeaders) {
    text = text.replace(new RegExp(`(${escapeRegex(header)})([A-Z0-9•\\-–])`, "gi"), "$1\n$2");
  }

  // 3. Split inline bullets: •text or • text → newline before •
  text = text.replace(/([^\n])(\s*•\s*)/g, "$1\n•");

  // 4. Split glued label:value pairs (e.g., "30 °C)Rumpukuivain:" or "keskilämpöSilitys")
  // Common care/feature labels that may be glued
  const careLabels = [
    "Pesukone", "Rumpukuivain", "Silitys", "Höyry", "Ei kemiallista",
    "Ei klooripohjaista", "PESUKONE", "RUMPUKUIVAIN", "SILITYS",
    "EI KEMIALLISTA", "EI KLOORIPOHJAISTA", "Konepesu", "Käsinpesu",
  ];
  for (const label of careLabels) {
    text = text.replace(new RegExp(`([^\\n])(?=${escapeRegex(label)})`, "gi"), "$1\n");
  }

  // 5. Split lines like "...viimeistelyKaksinkertainen" (lowercase/digit/paren followed by Uppercase start of new word)
  text = text.replace(/([a-zäöåü\)°])([A-ZÄÖÅ][a-zäöåü])/g, "$1\n$2");

  // 6. Standard bullet split for "- " or "– " after sentence-ending chars
  text = text.replace(/([.!?a-zäöå])(\s*[-–]\s+)/gi, "$1\n$2");

  // Split paragraphs
  const rawParagraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 0);

  type Section = { type: "heading"; text: string } | { type: "paragraph"; text: string } | { type: "bullets"; items: string[] };
  const sections: Section[] = [];

  for (const block of rawParagraphs) {
    const lines = block.split(/\n/).filter(l => l.trim().length > 0);
    const isHeader = sectionHeaders.some(h => block.trim().toLowerCase().startsWith(h.toLowerCase()));

    if (isHeader) {
      sections.push({ type: "heading", text: lines[0].trim() });
      const restLines = lines.slice(1);
      if (restLines.length > 0) {
        const bulletLines: string[] = [];
        const textLines: string[] = [];
        for (const l of restLines) {
          if (/^[\s]*[•\-–]/.test(l)) {
            bulletLines.push(l.replace(/^[\s]*[•\-–]\s*/, "").trim());
          } else {
            // Could be an ALLCAPS instruction line → treat as bullet
            if (/^[A-ZÄÖÅ\s:()°%\/,\-–0-9]+$/.test(l.trim()) && l.trim().length > 5) {
              bulletLines.push(l.trim());
            } else {
              textLines.push(l.trim());
            }
          }
        }
        if (bulletLines.length > 0) {
          sections.push({ type: "bullets", items: bulletLines });
        }
        for (const t of textLines) {
          sections.push({ type: "paragraph", text: t });
        }
      }
    } else {
      // Check if block has bullets
      const lines2 = block.split(/\n/).filter(l => l.trim().length > 0);
      const bulletItems: string[] = [];
      const paragraphTexts: string[] = [];

      for (const l of lines2) {
        if (/^[\s]*[•]/.test(l)) {
          bulletItems.push(l.replace(/^[\s]*[•]\s*/, "").trim());
        } else {
          paragraphTexts.push(l.trim());
        }
      }

      if (bulletItems.length > 0 && paragraphTexts.length > 0) {
        for (const t of paragraphTexts) sections.push({ type: "paragraph", text: t });
        sections.push({ type: "bullets", items: bulletItems });
      } else if (bulletItems.length > 0) {
        sections.push({ type: "bullets", items: bulletItems });
      } else {
        sections.push({ type: "paragraph", text: block.trim() });
      }
    }
  }

  return sections;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ProductDescription({ description, expanded, onToggle }: { description: string; expanded: boolean; onToggle: () => void }) {
  const isLong = description.length > 200;
  const sections = parseDescription(description);

  const renderSections = (secs: ReturnType<typeof parseDescription>) => (
    <div className="space-y-4">
      {secs.map((sec, i) => {
        if (sec.type === "heading") {
          return <h3 key={i} className="font-semibold text-foreground text-base mt-2">{sec.text}</h3>;
        }
        if (sec.type === "bullets") {
          return (
            <ul key={i} className="space-y-1.5 ml-1">
              {sec.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="text-sm leading-relaxed">{sec.text}</p>;
      })}
    </div>
  );

  if (!isLong) {
    return <div className="text-muted-foreground">{renderSections(sections)}</div>;
  }

  const shortText = description.slice(0, 200) + "…";

  return (
    <div className="text-muted-foreground">
      {expanded ? (
        <>
          {renderSections(sections)}
          <button onClick={onToggle} className="mt-3 text-primary font-medium text-sm hover:underline inline-flex items-center gap-1">
            Näytä vähemmän <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed">{shortText}</p>
          <button onClick={onToggle} className="mt-3 text-primary font-medium text-sm hover:underline inline-flex items-center gap-1">
            Lue lisää <ChevronDown className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

function ProductFaqSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.id = "product-faq-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a }
      }))
    });
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [faqs]);
  return null;
}

const sizeGuide = [
  { size: "S", chest: "88–92", waist: "72–76", hip: "88–92" },
  { size: "M", chest: "96–100", waist: "80–84", hip: "96–100" },
  { size: "L", chest: "104–108", waist: "88–92", hip: "104–108" },
  { size: "XL", chest: "112–116", waist: "96–100", hip: "112–116" },
  { size: "XXL", chest: "120–124", waist: "104–108", hip: "120–124" },
];

const NO_SIZE_CATEGORIES = ["mukit", "tarrat", "seinataulut", "peitot", "koristeet"];

// Build a same-origin proxied URL for a Printify image so Googlebot
// (which is blocked by Printify CDN) can fetch it via our domain.
// Only used in JSON-LD + og:image; <img> tags keep the original CDN URL.
function toProxiedImage(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url, "https://huumorikauppa.fi");
    if (u.hostname === "images-api.printify.com" || u.hostname === "images.printify.com") {
      return `https://huumorikauppa.fi/api/image-proxy?url=${encodeURIComponent(u.toString())}`;
    }
    if (u.origin === "https://huumorikauppa.fi") return u.toString();
    return url;
  } catch {
    return url.startsWith("http") ? url : `https://huumorikauppa.fi${url}`;
  }
}

function isCustomTextProduct(product: { name: string; description: string }): boolean {
  const t = (product.name + ' ' + product.description).toLowerCase();
  return t.includes('oma teksti') || t.includes('oma kuva') || t.includes('custom text') || t.includes('personoi');
}

const ProductPage = () => {
  const { slug } = useParams();
  const { product, products: allProducts = [], isLoading } = useProduct(slug);
  const { addItem } = useCartContext();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [customText, setCustomText] = useState("");

  const variantImages = useMemo(() => {
    return (product?.variants?.variant_images as Record<string, string[]>) || {};
  }, [product]);

  useEffect(() => {
    if (product && !isLoading) {
      // Delay prerenderReady so react-helmet-async Helmet has time to flush title + JSON-LD into <head>
      const raf = requestAnimationFrame(() => {
        window.prerenderReady = true;
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [product, isLoading]);

  useEffect(() => {
    if (product && !selectedColor) {
      const defaultColor = product.variants.default_color as string | undefined;
      if (defaultColor && product.variants.colors?.includes(defaultColor)) {
        setSelectedColor(defaultColor);
      } else if (product.variants.colors?.[0]) {
        setSelectedColor(product.variants.colors[0]);
      }
    }
  }, [product, selectedColor]);

  const currentImages = useMemo(() => {
    if (selectedColor && variantImages[selectedColor]?.length > 0) {
      return variantImages[selectedColor];
    }
    return product?.images || [];
  }, [selectedColor, variantImages, product]);

  useEffect(() => {
    setActiveImage(0);
  }, [selectedColor]);

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl text-foreground mb-4">Tuotetta ei löydy 😅</h1>
        <Link to="/" className="text-primary hover:underline">Takaisin etusivulle →</Link>
      </div>
    );
  }

  const category = categories.find(c => c.slug === product.category);
  const hideSize = NO_SIZE_CATEGORIES.includes(product.category);
  const hasSizes = !hideSize && product.variants.sizes && product.variants.sizes.length > 1;
  const hasColors = product.variants.colors && product.variants.colors.length > 0;
  const uniqueColors = [...new Set((product.variants.colors || []) as string[])];
  const needsSize = hasSizes && !selectedSize;
  const needsColor = hasColors && !selectedColor;
  const isCustom = isCustomTextProduct(product);
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  const categoryName = category?.name || product.category;

  const handleAddToCart = () => {
    if (needsSize) {
      toast({ title: "Valitse koko ensin! 📏", variant: "destructive" });
      return;
    }
    if (needsColor) {
      toast({ title: "Valitse väri ensin! 🎨", variant: "destructive" });
      return;
    }
    const size = hideSize ? product.variants.sizes?.[0] : selectedSize;
    addItem(product, quantity, size, selectedColor);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Linkki kopioitu! 📋" });
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  // Cross-category: same theme products
  const themeProducts = (() => {
    const skipWords = new Set(['paita', 'paidat', 'huppari', 'muki', 'mukit', 'tarra', 'hauska', 'hauskat', 'kahvikuppi', 'maailman', 'paras', 'body', 'peitto', 'pipo', 'laukku', 'taulu', 'koriste']);
    const nameWords = product.name.toLowerCase()
      .split(/[\s\-–,!?()]+/)
      .filter(w => w.length > 3 && !skipWords.has(w));
    
    if (nameWords.length === 0) return [];
    
    return allProducts
      .filter(p =>
        p.id !== product.id &&
        p.category !== product.category &&
        nameWords.some(w => p.name.toLowerCase().includes(w))
      )
      .slice(0, 4);
  })();

  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const allProductImages = currentImages.length > 0 ? currentImages : (product.images.length > 0 ? product.images : ["/placeholder.svg"]);

  // Generate deterministic rating based on product ID hash
  const reviewsList = getProductReviews(product);
  const avgRating = reviewsList.length > 0 
    ? (reviewsList.reduce((sum, r) => sum + r.stars, 0) / reviewsList.length).toFixed(1) 
    : "4.8";
  const reviewCount = reviewsList.length || 3;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description.slice(0, 500),
    "image": allProductImages.map(img => {
      const abs = img.startsWith("http") ? img : `https://huumorikauppa.fi${img}`;
      return toProxiedImage(abs);
    }),
    "url": `https://huumorikauppa.fi/tuote/${product.slug}`,
    "sku": product.slug,
    "mpn": product.id,
    "brand": { "@type": "Brand", "name": "Huumorikauppa" },
    "category": categoryName,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": avgRating,
      "reviewCount": String(reviewCount),
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": reviewsList.slice(0, 3).map(r => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": r.name },
      "reviewRating": { "@type": "Rating", "ratingValue": String(r.stars), "bestRating": "5" },
      "datePublished": (() => {
        const parts = r.date.split('.');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const rawYear = parts[2];
        // Year in source data is already 4 digits — do not prepend "20"
        const year = rawYear.length === 4 ? rawYear : `20${rawYear}`;
        return `${year}-${month}-${day}`;
      })(),
      "reviewBody": r.text,
    })),
    "offers": {
      "@type": "Offer",
      "price": product.price.toFixed(2),
      "priceCurrency": "EUR",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": { "@type": "Organization", "name": "Huumorikauppa", "url": "https://huumorikauppa.fi" },
      "url": `https://huumorikauppa.fi/tuote/${product.slug}`,
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      ...(hasDiscount && product.original_price ? {
        "priceSpecification": {
          "@type": "PriceSpecification",
          "price": product.price.toFixed(2),
          "priceCurrency": "EUR",
          "valueAddedTaxIncluded": true
        }
      } : {}),
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "EUR"
        },
        "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "FI" },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2, "unitCode": "DAY" },
          "transitTime": { "@type": "QuantitativeValue", "minValue": 2, "maxValue": 4, "unitCode": "DAY" }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "FI",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 14,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility"
      }
    }
  };

  const productFaqs = [
    { q: "Onko tämä hyvä lahja?", a: `${product.name} on erinomainen lahja syntymäpäiviin, jouluksi tai ihan vaan piristykseksi. Hauskuus taattu!` },
    { q: "Kuinka nopeasti saan tilauksen?", a: "Toimitamme 3–7 arkipäivässä koko Suomeen. Yli 60 € tilaukset toimitetaan ilmaiseksi." },
    { q: "Voinko palauttaa tuotteen?", a: "Kyllä! Sinulla on 14 päivän palautusoikeus." },
  ];

  // GEO/AI: heuristinen "Kenelle sopii / Miksi hauska / Mihin tilanteeseen"
  const _t = (product.name + " " + product.description).toLowerCase();
  const audience = (() => {
    if (_t.includes("äiti") || _t.includes("mamma") || _t.includes("mummi")) return "äidille, mummille tai anopille — kenelle tahansa elämäsi tärkeälle naiselle";
    if (_t.includes("isä") || _t.includes("iskä") || _t.includes("ukki")) return "isälle, ukille tai sedälle — miehelle joka rakastaa sopivan ronskia huumoria";
    if (_t.includes("kala")) return "kalastusta harrastavalle isälle, sedälle tai kaverille";
    if (_t.includes("eläke") || _t.includes("museo")) return "eläkkeelle jäävälle työkaverille tai juuri eläköityneelle läheiselle";
    if (_t.includes("polttari") || _t.includes("morsian") || _t.includes("sulhanen")) return "polttariporukalle, morsiamelle tai sulhaselle";
    if (_t.includes("vauva") || product.category === "bodyt") return "vauvalle ja vanhemmille — turvallinen ja söpö lahja";
    if (product.category === "mukit") return "kahvinjuojalle, työkaverille tai itsellesi aamukahvia varten";
    return "kaverille, perheenjäsenelle tai työkaverille — tai vaikka itsellesi";
  })();
  const occasion = (() => {
    if (_t.includes("äiti")) return "äitienpäivään, äidin syntymäpäiviin ja ihan vaan kiitokseksi";
    if (_t.includes("isä")) return "isänpäivään, isän syntymäpäiviin ja jouluksi";
    if (_t.includes("eläke")) return "eläkejuhliin ja läksiäisiin";
    if (_t.includes("polttari")) return "polttareihin ja häihin";
    if (_t.includes("joulu")) return "jouluksi, pikkujouluihin ja kalenterin täytteeksi";
    if (product.category === "bodyt") return "vauvanristiäisiin, ristiäislahjaksi ja vauvanpäiville";
    return "syntymäpäiviin, jouluun, pikkujouluihin ja yllätyslahjaksi";
  })();
  const whyFunny = `${product.name} on hauska, koska se yhdistää tutun arkitilanteen ja yllättävän tekstin — juuri sellaisen lahjan, joka jää muistiin pidemmäksi aikaa kuin tavallinen lahja.`;

  // Kasvatetaan FAQ:t AI-vastauksia varten
  const productFaqsExtended = [
    ...productFaqs,
    { q: "Kenelle tämä tuote sopii?", a: `Tämä ${categoryName.toLowerCase().replace(/t$/, "")} sopii ${audience}.` },
    { q: "Mihin tilanteeseen tämä on hyvä lahja?", a: `${product.name} sopii ${occasion}.` },
    { q: "Miksi tämä on hauska lahja?", a: whyFunny },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": productFaqsExtended.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  const combinedProductJsonLd = {
    "@context": "https://schema.org",
    "@graph": [productJsonLd, faqJsonLd],
  };

  const productFaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": productFaqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };

  const breadcrumbs = [
    { name: "Etusivu", url: "https://huumorikauppa.fi/" },
    { name: category?.name || product.category, url: `https://huumorikauppa.fi/kategoria/${product.category}` },
    { name: product.name, url: `https://huumorikauppa.fi/tuote/${product.slug}` },
  ];

  // categoryName already declared above

  const shortDesc = product.description.length > 200
    ? product.description.slice(0, 200) + "…"
    : product.description;

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{`${product.name} | Huumorikauppa`}</title>
        <meta name="description" content={`${product.name} – ${product.description.slice(0, 120)}. Ilmainen toimitus yli 60 €. 14 pv palautusoikeus.`} />
        <link rel="canonical" href={`https://huumorikauppa.fi/tuote/${product.slug}`} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta property="og:title" content={`${product.name} | Huumorikauppa`} />
        <meta property="og:description" content={product.description.slice(0, 150)} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://huumorikauppa.fi/tuote/${product.slug}`} />
        <meta property="og:image" content={toProxiedImage(allProductImages[0]?.startsWith("http") ? allProductImages[0] : `https://huumorikauppa.fi${allProductImages[0]}`)} />
        <meta property="og:site_name" content="Huumorikauppa.fi" />
        <meta property="og:locale" content="fi_FI" />
        <meta property="product:price:amount" content={product.price.toFixed(2)} />
        <meta property="product:price:currency" content="EUR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} | Huumorikauppa`} />
        <meta name="twitter:description" content={product.description.slice(0, 150)} />
        <meta name="twitter:image" content={toProxiedImage(allProductImages[0]?.startsWith("http") ? allProductImages[0] : `https://huumorikauppa.fi${allProductImages[0]}`)} />
        <link rel="alternate" hrefLang="fi" href={`https://huumorikauppa.fi/tuote/${product.slug}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://huumorikauppa.fi/tuote/${product.slug}`} />
        {/* JSON-LD (Product + Breadcrumb) is emitted exclusively by SEOHead below to avoid duplicates. FAQPage is emitted by ProductFaqSchema. */}
      </Helmet>
      <SEOHead
        title={`${product.name} | Huumorikauppa`}
        description={`${product.name} – ${product.description.slice(0, 120)}. Ilmainen toimitus yli 60 €. 14 pv palautusoikeus.`}
        canonical={`https://huumorikauppa.fi/tuote/${product.slug}`}
        jsonLd={combinedProductJsonLd}
        breadcrumbs={breadcrumbs}
        ogImage={toProxiedImage(currentImages[0]?.startsWith("http") ? currentImages[0] : `https://huumorikauppa.fi${currentImages[0] || ""}`)}
        ogType="product"
        productPrice={product.price.toFixed(2)}
      />
      <ProductFaqSchema faqs={productFaqs} />

      <div className="container py-6 md:py-10">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <Link to={`/kategoria/${product.category}`} className="hover:text-foreground">
            {category?.emoji} {category?.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={currentImages[activeImage] || currentImages[0] || "/placeholder.svg"}
                alt={`${product.name}${selectedColor ? ' – ' + selectedColor : ''} – Osta ${categoryName} Huumorikaupasta`}
                className="w-full h-full object-cover"
                width={600}
                height={600}
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {product.is_gift_idea && <Badge className="bg-secondary text-secondary-foreground font-bold">LAHJAIDEA 🎁</Badge>}
                {hasDiscount && (
                  <Badge className="bg-destructive text-destructive-foreground font-bold">-{discountPercent}%</Badge>
                )}
              </div>
            </div>
            {currentImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {currentImages.map((img, i) => (
                  <button
                    key={`${selectedColor}-${i}`}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                      activeImage === i ? "border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name}${selectedColor ? ' ' + selectedColor : ''} – ${categoryName} kuva ${i + 1} | Huumorikauppa`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">{product.name}</h1>
              <div className="flex items-center gap-3">
                {hasDiscount && (
                  <span className="text-xl text-muted-foreground line-through">
                    {product.original_price!.toFixed(2)} €
                  </span>
                )}
                <span className={`text-2xl md:text-3xl font-bold ${hasDiscount ? "text-destructive" : "text-primary"}`}>
                  {product.price.toFixed(2)} €
                </span>
                {hasDiscount && (
                  <Badge className="bg-destructive text-destructive-foreground font-bold text-sm">-{discountPercent}%</Badge>
                )}
              </div>
            </div>

            {product.is_featured && (
              <Badge className="bg-accent text-accent-foreground font-bold w-fit">🔥 Suosittu tuote</Badge>
            )}
            {product.stock <= 10 && product.stock > 0 && (
              <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-md px-3 py-2">
                <span className="text-sm font-bold">🔥 Vain {product.stock} kpl jäljellä – tilaa ennen kuin loppuu!</span>
              </div>
            )}

            {/* Color selector */}
            {hasColors && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Väri{selectedColor ? `: ${selectedColor}` : ""}
                </label>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                        selectedColor === color
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector with modal size chart */}
            {hasSizes && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Koko</label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Ruler className="h-3 w-3" /> Kokotaulukko
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="font-display text-foreground">Kokotaulukko (cm)</DialogTitle>
                      </DialogHeader>
                      <div className="overflow-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground">
                              <th className="py-2 text-left">Koko</th>
                              <th className="py-2 text-left">Rinta</th>
                              <th className="py-2 text-left">Vyötärö</th>
                              <th className="py-2 text-left">Lantio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sizeGuide.map(row => (
                              <tr key={row.size} className="border-b border-border/50">
                                <td className="py-2 font-medium text-foreground">{row.size}</td>
                                <td className="py-2 text-muted-foreground">{row.chest}</td>
                                <td className="py-2 text-muted-foreground">{row.waist}</td>
                                <td className="py-2 text-muted-foreground">{row.hip}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sortSizes(product.variants.sizes!).map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom text input */}
            {isCustom && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Minkä tekstin haluat tuotteeseen? ✍️
                </label>
                <Textarea
                  placeholder="Kirjoita haluamasi teksti tähän..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="bg-muted border-border resize-none"
                  maxLength={200}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">{customText.length}/200 merkkiä</p>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Määrä</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-md border border-border text-foreground hover:bg-muted flex items-center justify-center font-bold">−</button>
                <span className="text-lg font-bold text-foreground w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-10 rounded-md border border-border text-foreground hover:bg-muted flex items-center justify-center font-bold">+</button>
              </div>
            </div>

            {/* Add to cart */}
            <Button onClick={handleAddToCart} size="lg" className="w-full bg-primary text-primary-foreground font-bold text-lg shadow-glow-lime hover:scale-[1.02] transition-transform">
              <ShoppingCart className="h-5 w-5 mr-2" /> Lisää koriin
            </Button>

            {/* Share */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Share2 className="h-4 w-4" /> Jaa:</span>
              <a href={`https://wa.me/?text=${encodeURIComponent(product.name + " – " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Facebook</a>
              <button onClick={handleCopyLink} className="text-sm text-primary hover:underline flex items-center gap-1"><Copy className="h-4 w-4" /> Kopioi</button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Truck className="h-4 w-4 text-primary shrink-0" /> Ilmainen toimitus yli 60 €</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4 text-primary shrink-0" /> 14 pv palautusoikeus</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="h-4 w-4 text-primary shrink-0" /> Turvallinen maksu</div>
            </div>
          </div>
        </div>

        {/* Product description */}
        <section className="mt-12">
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8 max-w-3xl">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Tuotekuvaus 📝</h2>
            <ProductDescription description={product.description} expanded={descExpanded} onToggle={() => setDescExpanded(prev => !prev)} />
          </div>
        </section>

        {/* GEO/AI: Kenelle / Miksi / Mihin tilanteeseen */}
        <section className="mt-8 max-w-3xl">
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Lahjavinkki 💡</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Kenelle sopii</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{audience.charAt(0).toUpperCase() + audience.slice(1)}.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Miksi tämä on hauska lahja</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{whyFunny}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Mihin tilanteeseen</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{occasion.charAt(0).toUpperCase() + occasion.slice(1)}.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Reviews */}
        <section className="mt-8 max-w-3xl">
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Asiakasarviot ⭐</h2>
            {(() => {
              const reviews = getProductReviews(product);
              const avgStars = reviews.reduce((s, r) => s + r.stars, 0) / reviews.length;
              return (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < Math.round(avgStars) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{avgStars.toFixed(1)} / 5 ({reviews.length} arvostelua)</span>
                  </div>
                  {/* Individual reviews */}
                  {reviews.map((review, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: review.stars }).map((_, s) => (
                              <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" />
                            ))}
                            {Array.from({ length: 5 - review.stars }).map((_, s) => (
                              <Star key={`e-${s}`} className="h-3.5 w-3.5 text-muted-foreground/30" />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-foreground">{review.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">"{review.text}"</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>

        {/* Product FAQ */}
        <section className="mt-8 max-w-3xl">
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Usein kysyttyä ❓</h2>
            <div className="space-y-4">
              {productFaqsExtended.map((faq, i) => (
                <div key={i}>
                  <h3 className="font-medium text-foreground text-sm">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Lisää kysymyksiä? Katso <Link to="/usein-kysytyt-kysymykset" className="text-primary hover:underline">UKK-sivumme</Link> tai ota yhteyttä huumorikauppa@gmail.com
            </p>
          </div>
        </section>

        {/* Category link */}
        {category && (
          <section className="mt-6">
            <Link to={`/kategoria/${product.category}`} className="text-sm text-primary hover:underline">
              ← Takaisin kategoriaan: {category.emoji} {category.name}
            </Link>
          </section>
        )}

        {/* Same theme cross-sell */}
        {themeProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">Samalla teemalla eri tuotteina 🎯</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {themeProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">Saatat myös tykätä 😍</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
