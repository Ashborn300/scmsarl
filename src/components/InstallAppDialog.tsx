import { useEffect, useState } from "react";
import { Download, Smartphone, X, Share } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "scm-install-dialog-dismissed";

export function InstallAppDialog() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const ua = window.navigator.userAgent || "";
    const iOS = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
    setIsIOS(iOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Affiche le pop-up après un court délai (pour iOS ou si l'événement tarde)
    const timer = window.setTimeout(() => setOpen(true), 1200);

    const onInstalled = () => {
      setOpen(false);
      localStorage.setItem(DISMISS_KEY, "1");
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const installer = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
    setDeferred(null);
    setOpen(false);
  };

  const fermer = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-foreground/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={fermer}
          aria-label="Fermer"
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Smartphone className="size-8" />
          </div>
          <h3 className="text-lg font-black text-foreground">Installer SCM SARL</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajoutez l'application sur votre appareil pour un accès rapide, hors-ligne et plein écran.
          </p>

          {isIOS ? (
            <div className="mt-5 w-full rounded-2xl border border-border bg-muted/40 p-4 text-left text-xs text-foreground">
              <p className="font-bold">Sur iPhone / iPad :</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li className="flex items-center gap-2">Touchez l'icône <Share className="inline size-4" /> Partager</li>
                <li>Choisissez « Sur l'écran d'accueil »</li>
                <li>Validez avec « Ajouter »</li>
              </ol>
            </div>
          ) : (
            <button
              onClick={installer}
              disabled={!deferred}
              className="primary-action mt-5 w-full justify-center disabled:opacity-50"
            >
              <Download className="size-4" />
              {deferred ? "Installer l'application" : "Installation indisponible"}
            </button>
          )}

          <button
            onClick={fermer}
            className="mt-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
