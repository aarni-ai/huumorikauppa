import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById('root')!;
// Only hydrate when the markup looks like real prerendered content,
// not our SEO-only fallback (which is marked aria-hidden).
const firstChild = rootElement.firstElementChild as HTMLElement | null;
const isFallback = !!firstChild && firstChild.getAttribute('aria-hidden') === 'true';
const hasStaticHTML = rootElement.hasChildNodes() && !isFallback;

if (hasStaticHTML) {
    ReactDOM.hydrateRoot(rootElement, <React.StrictMode><App /></React.StrictMode>);
} else {
    // Clear SEO fallback before mounting so it doesn't flash on screen.
    if (isFallback) rootElement.innerHTML = '';
    ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
}
