import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { revealApp, setPreviewReveal } from "./lib/prerenderPreview";

const rootElement = document.getElementById('root')!;
// Tuotesivun näkyvä esikatselu (data-prerender-visual, src/seo/prerender/renderProductPreview.tsx):
// siirretään #rootin viereen näkyviin ja React käynnistetään piilotettuun #rootiin. ProductPage
// kutsuu revealApp()-funktiota, kun tuote on valmis; varmuuden vuoksi vaihto tehdään viimeistään
// aikakatkaisun jälkeen (esim. jos tuotehaku jumittuu).
const PREVIEW_TIMEOUT_MS = 10000;
const preview = rootElement.querySelector<HTMLElement>(':scope > [data-prerender-visual]');
if (preview) {
  rootElement.before(preview);
  rootElement.style.display = 'none';
  setPreviewReveal(() => {
    preview.remove();
    rootElement.style.display = '';
  });
  window.setTimeout(revealApp, PREVIEW_TIMEOUT_MS);
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
