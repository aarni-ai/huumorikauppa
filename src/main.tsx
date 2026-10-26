import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { revealApp, setPreviewReveal, setProductSeed } from "./lib/prerenderPreview";

const rootElement = document.getElementById('root')!;
// Tuote- ja etusivun näkyvä esikatselu (data-prerender-visual, src/seo/prerender/renderPreview.tsx):
// siirretään #rootin viereen näkyviin ja React käynnistetään piilotettuun #rootiin. Vaihto
// (revealApp, src/lib/prerenderPreview.ts) tapahtuu sivun ensimmäisessä renderöinnissä, viimeistään
// pian Appin asennuksen jälkeen ja aina viimeistään PREVIEW_TIMEOUT_MS:n kuluttua.
const PREVIEW_TIMEOUT_MS = 4000;
const preview = rootElement.querySelector<HTMLElement>(':scope > [data-prerender-visual]');
if (preview) {
  const seed = preview.querySelector('script[data-product-seed]');
  if (seed) {
    try {
      setProductSeed(JSON.parse(seed.textContent || 'null'));
    } catch {
      // Virheellinen siemen: tuote haetaan tavalliseen tapaan.
    }
  }
  rootElement.before(preview);
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

if (hasStaticHTML) {
    ReactDOM.hydrateRoot(rootElement, <React.StrictMode><App /></React.StrictMode>);
} else {
    // Clear static fallback before mounting so it doesn't flash on screen.
    if (isStaticFallback) rootElement.innerHTML = '';
    ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
}
