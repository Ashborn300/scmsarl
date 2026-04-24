import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Building2, Cuboid, FileText, Hammer, HardHat, IdCard, Megaphone, ReceiptText, ShieldCheck, UsersRound, Warehouse } from "lucide-react";
import { useState, type CSSProperties } from "react";
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
  communiquer: Megaphone,
  certificat: Award,
  carte_service: IdCard,
  rendu_3d: Cuboid,
  realistic_sketchup: Warehouse,
};

type ToolVisual = {
  action: CSSProperties;
  badge: CSSProperties;
  banner: CSSProperties;
  card: CSSProperties;
  footer: CSSProperties;
  icon: CSSProperties;
};

const stylesOutils: Record<OutilType, ToolVisual> = {
  facture: {
    card: { background: "linear-gradient(180deg, rgba(34,125,255,0.14) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(34,125,255,0.24)" },
    banner: { background: "linear-gradient(135deg, #2563eb, #0891b2)", color: "white" },
    badge: { background: "rgba(255,255,255,0.16)", color: "white" },
    footer: { background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.14)" },
    action: { background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.16)" },
    icon: { background: "linear-gradient(135deg, #2563eb, #0891b2)", color: "white" },
  },
  devis: {
    card: { background: "linear-gradient(180deg, rgba(245,158,11,0.2) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(245,158,11,0.32)" },
    banner: { background: "linear-gradient(135deg, #f59e0b, #facc15)", color: "#172033" },
    badge: { background: "rgba(255,255,255,0.32)", color: "#172033" },
    footer: { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.18)" },
    action: { background: "rgba(250,204,21,0.18)", border: "1px solid rgba(245,158,11,0.22)" },
    icon: { background: "linear-gradient(135deg, #f59e0b, #facc15)", color: "#172033" },
  },
  recu: {
    card: { background: "linear-gradient(180deg, rgba(16,185,129,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(16,185,129,0.28)" },
    banner: { background: "linear-gradient(135deg, #10b981, #22c55e)", color: "white" },
    badge: { background: "rgba(255,255,255,0.16)", color: "white" },
    footer: { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.16)" },
    action: { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.18)" },
    icon: { background: "linear-gradient(135deg, #10b981, #22c55e)", color: "white" },
  },
  contrat_construction: {
    card: { background: "linear-gradient(180deg, rgba(168,85,247,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(168,85,247,0.28)" },
    banner: { background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "white" },
    badge: { background: "rgba(255,255,255,0.16)", color: "white" },
    footer: { background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.16)" },
    action: { background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.18)" },
    icon: { background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "white" },
  },
  contrat_employe: {
    card: { background: "linear-gradient(180deg, rgba(20,184,166,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(20,184,166,0.28)" },
    banner: { background: "linear-gradient(135deg, #14b8a6, #06b6d4)", color: "white" },
    badge: { background: "rgba(255,255,255,0.16)", color: "white" },
    footer: { background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.16)" },
    action: { background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.18)" },
    icon: { background: "linear-gradient(135deg, #14b8a6, #06b6d4)", color: "white" },
  },
  description_projet: {
    card: { background: "linear-gradient(180deg, rgba(239,68,68,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(239,68,68,0.28)" },
    banner: { background: "linear-gradient(135deg, #ef4444, #f97316)", color: "white" },
    badge: { background: "rgba(255,255,255,0.16)", color: "white" },
    footer: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.16)" },
    action: { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.18)" },
    icon: { background: "linear-gradient(135deg, #ef4444, #f97316)", color: "white" },
  },
  communiquer: {
    card: { background: "linear-gradient(180deg, rgba(236,72,153,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(236,72,153,0.28)" },
    banner: { background: "linear-gradient(135deg, #ec4899, #f97316)", color: "white" },
    badge: { background: "rgba(255,255,255,0.16)", color: "white" },
    footer: { background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.16)" },
    action: { background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.18)" },
    icon: { background: "linear-gradient(135deg, #ec4899, #f97316)", color: "white" },
  },
  certificat: {
    card: { background: "linear-gradient(180deg, rgba(3,76,120,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(245,181,72,0.36)" },
    banner: { background: "linear-gradient(135deg, #034c78, #f5b548)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(3,76,120,0.08)", border: "1px solid rgba(245,181,72,0.22)" },
    action: { background: "rgba(245,181,72,0.14)", border: "1px solid rgba(3,76,120,0.16)" },
    icon: { background: "linear-gradient(135deg, #034c78, #f5b548)", color: "white" },
  },
  carte_service: {
    card: { background: "linear-gradient(180deg, rgba(10,132,216,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(30,45,55,0.24)" },
    banner: { background: "linear-gradient(135deg, #0a84d8, #1e2d37)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(10,132,216,0.08)", border: "1px solid rgba(30,45,55,0.16)" },
    action: { background: "rgba(10,132,216,0.12)", border: "1px solid rgba(30,45,55,0.16)" },
    icon: { background: "linear-gradient(135deg, #0a84d8, #1e2d37)", color: "white" },
  },
  rendu_3d: {
    card: { background: "linear-gradient(180deg, rgba(85,107,47,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(196,126,66,0.28)" },
    banner: { background: "linear-gradient(135deg, #556b2f, #c47e42)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(85,107,47,0.08)", border: "1px solid rgba(196,126,66,0.18)" },
    action: { background: "rgba(196,126,66,0.12)", border: "1px solid rgba(85,107,47,0.16)" },
    icon: { background: "linear-gradient(135deg, #556b2f, #c47e42)", color: "white" },
  },
  realistic_sketchup: {
    card: { background: "linear-gradient(180deg, rgba(88,77,66,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(46,125,92,0.28)" },
    banner: { background: "linear-gradient(135deg, #584d42, #2e7d5c)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(88,77,66,0.08)", border: "1px solid rgba(46,125,92,0.18)" },
    action: { background: "rgba(46,125,92,0.12)", border: "1px solid rgba(88,77,66,0.16)" },
    icon: { background: "linear-gradient(135deg, #584d42, #2e7d5c)", color: "white" },
  },
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
                <div className="rounded-2xl bg-tool-foreground/12 p-3"><strong className="block text-2xl">8</strong><span className="text-xs">outils</span></div>
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
              const Icone = icones[config.type] ?? FileText;
              const visual = stylesOutils[config.type] ?? stylesOutils.communiquer;
              return (
                <button key={config.type} type="button" onClick={() => setOutilActif(config.type)} style={visual.card} className="tool-card group relative overflow-hidden rounded-3xl border p-5 text-left shadow-document transition hover:-translate-y-1 hover:shadow-tool">
                  <div style={visual.banner} className="tool-card-banner -mx-5 -mt-5 mb-5 flex items-center justify-between px-5 py-4">
                    <span style={visual.badge} className="flex size-14 items-center justify-center rounded-2xl transition group-hover:scale-105"><Icone className="size-7" /></span>
                    <span style={visual.badge} className="rounded-full px-3 py-1 text-xs font-black uppercase">SCM</span>
                  </div>
                  <h3 className="mt-6 text-xl font-black text-foreground">{config.titre.replace("Générateur de ", "")}</h3>
                  <p className="mt-2 min-h-14 text-sm leading-6 text-muted-foreground">{config.description}</p>
                  <div style={visual.footer} className="tool-card-soft mt-5 rounded-2xl p-3">
                    <div style={visual.action} className="tool-card-action flex items-center justify-between rounded-2xl p-2 pl-4">
                    <span className="text-xs font-black text-foreground">Ouvrir l’outil</span>
                    <span style={visual.icon} className="flex size-9 items-center justify-center rounded-xl shadow-tool">→</span>
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
