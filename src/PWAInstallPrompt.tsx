import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler as any);

    // Also show a hint on iOS Safari if not in standalone
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandalone = (window.navigator as any).standalone === true;
    if (isIOS && !isInStandalone) {
      // Show a gentle reminder for iOS users after a delay
      const t = setTimeout(() => setVisible(true), 8000);
      return () => clearTimeout(t);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // iOS fallback instruction
      alert(
        "To install on iOS:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add'"
      );
      setVisible(false);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted the PWA install prompt");
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="pwa-install-banner panel" style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <span>📱 Install Ancestory for faster access and offline use</span>
        <button className="btn btn-small" onClick={handleInstall}>
          Add to Home Screen
        </button>
        <button className="btn btn-small btn-muted" onClick={() => setVisible(false)}>
          Later
        </button>
      </div>
      <div className="muted" style={{ fontSize: "0.7rem", marginTop: 4 }}>
        Works great as a mobile app. Research proposals and place ledger work offline after first load.
      </div>
    </div>
  );
}
