import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "scm-install-dialog-dismissed";

export function InstallAppDialog() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    // Contextes où l'installation n'est pas possible (preview Lovable / iframe)
    const inIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    const host = window.location.hostname;
    const isPreview = host.includes("lovable.app") && host.includes("preview");

    const ua = window.navigator.userAgent || "";
    const iOS = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
    setIsIOS(iOS);

    // Enregistre le service worker — condition requise pour que Chrome/Android
    // déclenche `beforeinstallprompt`.
    if (!inIframe && !isPreview && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS n'émet pas `beforeinstallprompt` : on affiche les instructions manuelles.
    const timer = iOS ? window.setTimeout(() => setOpen(true), 1000) : 0;

    const onInstalled = () => {
      setOpen(false);
      localStorage.setItem(DISMISS_KEY, "1");
      // Tente de rouvrir l'app installée immédiatement après l'installation.
      try {
        const url = `${window.location.origin}/?pwa=1`;
        window.location.replace(url);
      } catch {}
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const installer = async () => {
    if (!deferred) return;
    try {
      setInstalling(true);
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(DISMISS_KEY, "1");
      }
    } finally {
      setInstalling(false);
      setDeferred(null);
      setOpen(false);
    }
  };

  const fermer = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-foreground/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={fermer}
          aria-label="Fermer"
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>

        <h3 className="pr-6 text-center text-base font-black text-foreground">
          Installer l'application SCM SARL
        </h3>

        {isIOS ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-semibold text-muted-foreground">
            Touchez <Share className="inline size-4" /> puis « Sur l'écran d'accueil »
          </p>
        ) : (
          <button
            onClick={installer}
            disabled={!deferred || installing}
            className="primary-action mt-5 w-full justify-center disabled:opacity-50"
          >
            <Download className="size-4" />
            {installing ? "Installation…" : "Installer"}
          </button>
        )}
      </div>
    </div>
  );
}
