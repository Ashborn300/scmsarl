import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";

const INSTALLED_KEY = "scm-app-installed";
const DISMISS_KEY = "scm-install-dismissed";

type Platform = "android" | "ios" | "desktop" | "unknown";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function UninstallPwaButton() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPlatform(detectPlatform());

    let cancelled = false;

    const evaluate = async () => {
      const standalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      if (standalone) {
        localStorage.setItem(INSTALLED_KEY, "1");
        if (!cancelled) setCanShow(true);
        return;
      }

      const nav = navigator as any;
      if (typeof nav.getInstalledRelatedApps === "function") {
        try {
          const apps = await nav.getInstalledRelatedApps();
          const installed = Array.isArray(apps) && apps.length > 0;
          if (installed) {
            localStorage.setItem(INSTALLED_KEY, "1");
            if (!cancelled) setCanShow(true);
          } else {
            localStorage.removeItem(INSTALLED_KEY);
            if (!cancelled) setCanShow(false);
          }
          return;
        } catch {}
      }

      const flag = localStorage.getItem(INSTALLED_KEY) === "1";
      if (!cancelled) setCanShow(flag);
    };

    evaluate();

    const onInstalled = () => evaluate();
    const onBeforeInstall = () => {
      localStorage.removeItem(INSTALLED_KEY);
      if (!cancelled) setCanShow(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    return () => {
      cancelled = true;
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  if (!canShow) return null;

  const forgetInstallState = () => {
    try {
      localStorage.removeItem(INSTALLED_KEY);
      localStorage.removeItem(DISMISS_KEY);
    } catch {}
  };

  const instructions: Record<Platform, string[]> = {
    android: [
      "Ouvrez l'écran d'accueil de votre téléphone.",
      "Appuyez longuement sur l'icône « SCM SARL ».",
      "Faites-la glisser sur « Désinstaller » ou appuyez sur « Désinstaller ».",
      "Confirmez la suppression.",
    ],
    ios: [
      "Allez sur l'écran d'accueil.",
      "Appuyez longuement sur l'icône « SCM SARL ».",
      "Touchez « Supprimer l'app » puis « Supprimer ».",
    ],
    desktop: [
      "Ouvrez l'application SCM SARL installée.",
      "Cliquez sur le menu ⋮ en haut à droite de la fenêtre de l'app.",
      "Choisissez « Désinstaller SCM SARL… » puis confirmez.",
      "Sur Chrome/Edge, vous pouvez aussi aller à chrome://apps, clic droit sur SCM SARL → Supprimer.",
    ],
    unknown: [
      "Trouvez l'icône SCM SARL sur votre appareil.",
      "Utilisez l'option « Désinstaller » ou « Supprimer » de votre système.",
    ],
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Désinstaller l'application
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-4 md:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-2 text-red-700">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Désinstaller SCM SARL
                  </h3>
                  <p className="text-xs text-slate-500">
                    Suivez ces étapes sur votre appareil
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ol className="mt-4 space-y-2 text-sm text-slate-700">
              {instructions[platform].map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-blue-700 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Pour des raisons de sécurité, les navigateurs n'autorisent pas la
              désinstallation automatique. Vous devez le faire depuis votre système.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  forgetInstallState();
                  setOpen(false);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                J'ai désinstallé
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
