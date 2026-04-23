import { createFileRoute } from "@tanstack/react-router";
import { Building2, Clock3, FileText, Hammer, HardHat, ReceiptText, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { configs, DocumentTool } from "@/components/DocumentTool";
import { listerDocumentsRecents, telechargerPdf, voirPdf, type DocumentRecord, type OutilType } from "@/lib/scmDocuments";
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

const libelles: Record<OutilType, string> = {
  facture: "Facture",
  devis: "Devis",
  recu: "Reçu",
  contrat_construction: "Contrat construction",
  contrat_employe: "Contrat employé",
  description_projet: "Description projet",
};

type RecentDocument = DocumentRecord & { type: OutilType };

function Index() {
  const [outilActif, setOutilActif] = useState<OutilType | null>(null);
  const [recents, setRecents] = useState<RecentDocument[]>([]);

  useEffect(() => { listerDocumentsRecents().then((data) => setRecents(data as RecentDocument[])); }, [outilActif]);

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
              <div className="mb-4 flex items-center gap-2"><Clock3 className="size-5 text-primary" /><h2 className="text-xl font-black text-foreground">Fichiers récents générés</h2></div>
              <div className="space-y-3">
                {recents.length === 0 ? <p className="rounded-xl border border-dashed border-border bg-muted p-5 text-sm text-muted-foreground">Aucun document récent. Sélectionnez un outil pour générer votre premier PDF.</p> : recents.map((document) => (
                  <article key={`${document.type}-${document.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{document.nom_fichier}</p><p className="text-xs text-muted-foreground">{libelles[document.type]} · {new Date(document.created_at).toLocaleDateString("fr-FR")}</p></div>
                    <div className="flex gap-1"><button type="button" onClick={() => voirPdf(document.pdf_base64)} className="tool-action" aria-label="Voir">Voir</button><button type="button" onClick={() => telechargerPdf(document.pdf_base64, document.nom_fichier)} className="tool-action" aria-label="Télécharger">PDF</button></div>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 mt-2"><h2 className="text-2xl font-black text-foreground lg:text-3xl">Outils disponibles</h2><p className="text-sm text-muted-foreground">Chaque carte ouvre un générateur complet avec PDF et historique dédié.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {configs.map((config) => {
              const Icone = icones[config.type];
              return (
                <button key={config.type} type="button" onClick={() => setOutilActif(config.type)} className={`tool-${config.theme} group rounded-2xl border border-border bg-card p-5 text-left shadow-document transition hover:-translate-y-1 hover:shadow-tool`}>
                  <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-tool-gradient text-tool-foreground shadow-tool"><Icone className="size-6" /></span>
                  <h3 className="text-xl font-black text-foreground">{config.titre.replace("Générateur de ", "")}</h3>
                  <p className="mt-2 min-h-12 text-sm text-muted-foreground">{config.description}</p>
                  <span className="mt-5 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground group-hover:bg-tool-gradient group-hover:text-tool-foreground">Ouvrir l’outil</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
