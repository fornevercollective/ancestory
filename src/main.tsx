import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "leaflet/dist/leaflet.css";
import "./styles.css";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {};
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, fontFamily: "system-ui", color: "#ddd", background: "#111" }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{String(this.state.error?.message || this.state.error)}</pre>
          <button onClick={() => location.reload()}>Reload page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker for PWA (offline shell + faster repeat visits).
// Use Vite base so it works on GitHub Pages subpaths (e.g. /ancestory/).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const base = import.meta.env.BASE_URL || "/";
    const swUrl = `${base.replace(/\/$/, "")}/sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        console.log("Ancestory SW registered", reg.scope);
      })
      .catch((err) => {
        console.warn("SW registration failed (PWA offline features limited):", err);
      });
  });
}
