import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, FileText, Hammer, HardHat, ReceiptText, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { configs, DocumentTool } from "@/components/DocumentTool";
import { type OutilType } from "@/lib/scmDocuments";
import scmLogo from "@/assets/scm-logo.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SCM SARL — Tableau de bord documents" },
      { name: "description", content: "Tableau de bord SCM SARL pour générer des factures, devis, reçus, contrats et fiches projets en PDF." },
      { property: "og:title", content: "SCM SARL — Tableau de bord documents" },
      { property: "og:description", content: "Outils PDF professionnels pour une entreprise de construction en République Démocratique du Congo." },
    ],
  }),
  component: Index,
});

const icones: Record<OutilType, React.ElementType> = {
  facture: FileText,
  devis: Hammer,
  recu: ReceiptText,
  contrat_construction: ShieldCheck,
  contrat_employe: UsersRound,
  description_projet: Building2,
};

function Index() {
  const [outilActif, setOutilActif] = useState<OutilType | null>(null);

  const configActive = configs.find((config) => config.type === outilActif);
  if (configActive) return <DocumentTool config={configActive} retour={() => setOutilActif(null)} />;

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <section className="construction-grid relative px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/85 p-3 shadow-document backdrop-blur">
            <div className="flex items-center gap-3">
              <img src={scmLogo} alt="Logo SCM SARL" className="h-14 w-24 rounded-lg object-contain sm:h-16 sm:w-32" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Construction · RDC</p>
                <h1 className="text-xl font-black text-foreground sm:text-2xl">SCM SARL</h1>
              </div>
            </div>
            <div className="hidden rounded-xl bg-primary px-4 py-3 text-primary-foreground sm:block">
              <p className="text-xs font-bold uppercase">Documents officiels</p>
              <p className="text-sm">PDF persistants</p>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch">
            <div className="signature-lift rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool tool-blue lg:p-9">
              <span className="mb-5 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-black uppercase tracking-wide">Tableau de bord principal</span>
              <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">Gestion documentaire professionnelle pour chantier.</h2>
              <p className="mt-4 max-w-2xl text-base opacity-90 sm:text-lg">Générez, archivez, consultez, téléchargez et supprimez vos factures, devis, reçus, contrats et descriptions de projets en français.</p>
              <div className="mt-7 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-tool-foreground/12 p-3"><strong className="block text-2xl">6</strong><span className="text-xs">outils</span></div>
                <div className="rounded-2xl bg-tool-foreground/12 p-3"><strong className="block text-2xl">PDF</strong><span className="text-xs">officiels</span></div>
                <div className="rounded-2xl bg-tool-foreground/12 p-3"><strong className="block text-2xl">Cloud</strong><span className="text-xs">persistant</span></div>
              </div>
            </div>
            <aside className="rounded-3xl border border-border bg-card/90 p-5 shadow-document backdrop-blur lg:p-6">
              <div className="flex h-full flex-col justify-center gap-4">
                <HardHat className="size-10 text-primary" />
                <h2 className="text-2xl font-black text-foreground">Archives par outil</h2>
                <p className="text-sm leading-6 text-muted-foreground">Les documents générés sont désormais visibles uniquement dans l’historique de leur outil correspondant.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground lg:text-3xl">Outils disponibles</h2>
              <p className="text-sm text-muted-foreground">Chaque carte ouvre un générateur complet avec PDF et historique dédié.</p>
            </div>
            <Link to="/employe" className="primary-action tool-green w-full sm:w-auto">
              <UsersRound className="size-4" /> Espace employés
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {configs.map((config) => {
              const Icone = icones[config.type];
              return (
                <button key={config.type} type="button" onClick={() => setOutilActif(config.type)} className={`tool-${config.theme} tool-card group relative overflow-hidden rounded-3xl border p-5 text-left shadow-document transition hover:-translate-y-1 hover:shadow-tool`}>
                  <div className="tool-card-banner -mx-5 -mt-5 mb-5 flex items-center justify-between px-5 py-4">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-card/15 text-tool-foreground transition group-hover:scale-105"><Icone className="size-7" /></span>
                    <span className="rounded-full bg-card/15 px-3 py-1 text-xs font-black uppercase text-tool-foreground">SCM</span>
                  </div>
                  <h3 className="mt-6 text-xl font-black text-foreground">{config.titre.replace("Générateur de ", "")}</h3>
                  <p className="mt-2 min-h-14 text-sm leading-6 text-muted-foreground">{config.description}</p>
                  <div className="tool-card-soft mt-5 rounded-2xl p-3">
                    <div className="tool-card-action flex items-center justify-between rounded-2xl p-2 pl-4">
                    <span className="text-xs font-black text-foreground">Ouvrir l’outil</span>
                    <span className="flex size-9 items-center justify-center rounded-xl bg-tool-gradient text-tool-foreground shadow-tool">→</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
