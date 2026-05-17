import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "scm-install-dismissed";

export function InstallPwaPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register service worker (needed for installability), but skip in iframes/preview
    const isInIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    const host = window.location.hostname;
    const isPreviewHost =
      host.includes("id-preview--") || host.includes("lovableproject.com");

    if ("serviceWorker" in navigator) {
      if (isInIframe || isPreviewHost) {
        navigator.serviceWorker.getRegistrations().then((regs) =>
          regs.forEach((r) => r.unregister())
        );
      } else {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
    }

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed === "1") return;

    const ua = window.navigator.userAgent || "";
    const iOS = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
    setIsIOS(iOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // For iOS (no beforeinstallprompt), still show manual instructions on mobile
    if (iOS) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferred(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 md:hidden">
      <div className="mx-auto max-w-md rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <img src="/icon-192.png" alt="SCM SARL" className="h-12 w-12 rounded-lg" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900">Installer SCM SARL</h3>
            <p className="mt-1 text-xs text-slate-600">
              {isIOS
                ? "Appuyez sur Partager puis « Sur l'écran d'accueil » pour installer."
                : "Ajoutez l'application sur votre téléphone pour un accès rapide."}
            </p>
            <div className="mt-3 flex gap-2">
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  <Download className="h-4 w-4" />
                  Installer
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
