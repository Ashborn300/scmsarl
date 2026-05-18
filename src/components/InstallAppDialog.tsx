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

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ne rien afficher si déjà installé
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

    const timer = window.setTimeout(() => setOpen(true), 1000);

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
    if (outcome === "accepted") localStorage.setItem(DISMISS_KEY, "1");
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
            disabled={!deferred}
            className="primary-action mt-5 w-full justify-center disabled:opacity-50"
          >
            <Download className="size-4" />
            Installer
          </button>
        )}
      </div>
    </div>
  );
}
