import React from "react";
import ReactDOM from "react-dom/client";
import App, { preloadRoute } from "./App.tsx";
import "./index.css";
import { revealApp, setPreviewReveal, setProductSeed } from "./lib/prerenderPreview";
import { tallennaKumppaniUrlista } from "./lib/kumppani";

// Sovelluksen moduulit latautuivat: esirenderöidyn HTML:n käynnistysvahti (BOOT_GUARD_SCRIPT,
// src/seo/prerender/html.ts) ei enää lataa sivua uudelleen eikä näytä varasisältöä.
(window as Window & { __hkMain?: boolean }).__hkMain = true;

const rootElement = document.getElementById('root')!;
// Kumppanilinkki ?ref= (pois päältä, src/lib/kumppani.ts).
tallennaKumppaniUrlista(window.location.search);
// Tuote- ja etusivun näkyvä esikatselu (data-prerender-visual, src/seo/prerender/renderPreview.tsx):
// siirretään #rootin viereen näkyviin ja React käynnistetään piilotettuun #rootiin. Vaihto
// (revealApp, src/lib/prerenderPreview.ts) tapahtuu sivun ensimmäisessä renderöinnissä, viimeistään
// pian Appin asennuksen jälkeen ja aina viimeistään PREVIEW_TIMEOUT_MS:n kuluttua.
const PREVIEW_TIMEOUT_MS = 2000;
// Esikatselu on #rootin edellinen sisar (src/seo/prerender/html.ts injectRoot); vanhemmissa välimuistin sivuissa
// #rootin ensimmäinen lapsi, jolloin se siirretään #rootin eteen.
const previous = rootElement.previousElementSibling as HTMLElement | null;
const preview = previous?.hasAttribute('data-prerender-visual')
  ? previous
  : rootElement.querySelector<HTMLElement>(':scope > [data-prerender-visual]');
if (preview) {
  const seed = preview.querySelector('script[data-product-seed]');
  if (seed) {
    try {
      setProductSeed(JSON.parse(seed.textContent || 'null'));
    } catch {
      // Virheellinen siemen: tuote haetaan tavalliseen tapaan.
    }
  }
  if (preview.parentElement === rootElement) rootElement.before(preview);
  rootElement.style.display = 'none';
  setPreviewReveal(() => {
    preview.remove();
    rootElement.style.display = '';
  });
  window.setTimeout(revealApp, PREVIEW_TIMEOUT_MS);
}
// Tuotesivun komponentti ladataan rinnakkain sovelluksen käynnistyksen kanssa (sama chunk kuin App.tsx:n lazy).
if (window.location.pathname.startsWith('/tuote/')) {
  import('./pages/ProductPage').catch(() => {});
}

// Build-vaiheen esirenderöity staattinen runko (scripts/prerender.mjs, data-prerender) ja vanha
// SEO-fallback (aria-hidden) eivät ole Reactin tuottamaa markupia: tyhjennetään ja renderöidään
// createRootilla. Hydratoidaan vain, jos juuressa on oikeaa React-markupia.
const firstChild = rootElement.firstElementChild as HTMLElement | null;
const isStaticFallback =
  !!firstChild &&
  (firstChild.hasAttribute('data-prerender') || firstChild.getAttribute('aria-hidden') === 'true');
const hasStaticHTML = rootElement.hasChildNodes() && !isStaticFallback;

function render() {
  if (hasStaticHTML) {
    // Esirenderöinti (renderToString) jättää lazy-osat (uutiskirje, ponnahdusikkunat) selaimen renderöitäviksi:
    // React raportoi niistä palautuvan virheen #419, joka ei ole vika. Muut palautuvat virheet konsoliin.
    ReactDOM.hydrateRoot(rootElement, <React.StrictMode><App /></React.StrictMode>, {
      onRecoverableError: (error) => {
        const viesti = String((error as Error)?.message ?? error);
        if (/#419|did not finish this Suspense boundary/.test(viesti)) return;
        console.error(error);
      },
    });
  } else {
    // Clear static fallback before mounting so it doesn't flash on screen.
    if (isStaticFallback) rootElement.innerHTML = '';
    ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
  }
}

// Etusivun, ostoskorin ja kassan chunk on jo latautumassa (modulepreload HTML:ssä, scripts/prerender.mjs):
// renderöidään vasta sen jälkeen, jolloin sivu näkyy heti ilman Suspense-varanäkymää (ei CLS:ää). Enintään
// ROUTE_PRELOAD_MAX_MS odotus, ettei hidas chunk pidä sivua tyhjänä.
const ROUTE_PRELOAD_MAX_MS = 1500;
let rendered = false;
const renderOnce = () => {
  if (rendered) return;
  rendered = true;
  render();
};
preloadRoute(window.location.pathname).then(renderOnce);
window.setTimeout(renderOnce, ROUTE_PRELOAD_MAX_MS);
