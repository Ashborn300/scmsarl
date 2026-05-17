import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "scm-install-dismissed";
const INSTALLED_KEY = "scm-app-installed";

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
    if (standalone) {
      localStorage.setItem(INSTALLED_KEY, "1");
      return;
    }

    // If app is already installed but user opened in browser, try to launch the installed PWA.
    // Browsers don't allow forced redirect, but with manifest launch_handler:navigate-existing,
    // a protocol/intent or web_app launch will focus the installed window. We at least show a banner.
    const wasInstalled = localStorage.getItem(INSTALLED_KEY) === "1";
    const nav = navigator as any;
    if (nav.getInstalledRelatedApps) {
      nav.getInstalledRelatedApps().then((apps: unknown[]) => {
        if (apps && apps.length > 0) localStorage.setItem(INSTALLED_KEY, "1");
      }).catch(() => {});
    }

    // Auto-open after install: when the user accepts install, the appinstalled event fires.
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setVisible(false);
      // Best-effort: try to launch standalone via the manifest start_url in a new context.
      // Most browsers will simply mark the PWA installed; the next launch from the home icon opens it.
      try {
        window.location.href = "/?utm_source=pwa_installed";
      } catch {}
    };
    window.addEventListener("appinstalled", onInstalled);

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed === "1" && !wasInstalled) return;

    const ua = window.navigator.userAgent || "";
    const iOS = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isMobileUA = iOS || isAndroid || /Mobile|Mobi/i.test(ua);
    setIsIOS(iOS);

    // Installation autorisée uniquement sur mobile
    if (!isMobileUA) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS n'émet pas beforeinstallprompt : afficher les instructions manuelles
    if (iOS) setVisible(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
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
