import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById('root')!;
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
