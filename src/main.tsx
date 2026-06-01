import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "leaflet/dist/leaflet.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA (offline shell + faster repeat visits)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Ancestory SW registered", reg.scope);
      })
      .catch((err) => {
        console.warn("SW registration failed (PWA offline features limited):", err);
      });
  });
}
