import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById('root')!;
const hasStaticHTML = rootElement.hasChildNodes();

if (hasStaticHTML) {
    ReactDOM.hydrateRoot(rootElement, <React.StrictMode><App /></React.StrictMode>);
} else {
    ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
}
