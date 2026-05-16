import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Archive, ArrowRight, Award, Building2, CalendarDays, ClipboardCheck, ClipboardList, Cuboid, GraduationCap, HandCoins, HeartPulse, FileClock, FileText, FilePlus2, FileX2, Hammer, HardHat, IdCard, LayoutGrid, Megaphone, Moon, Network, PackageCheck, PiggyBank, QrCode, ReceiptText, Receipt, Search, ShieldCheck, SquarePen, Truck, UsersRound, Wallet, Warehouse, X } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
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
  devis_estimatif: ClipboardList,
  recu: ReceiptText,
  contrat_construction: ShieldCheck,
  contrat_fournisseur: Truck,
  contrat_employe: UsersRound,
  description_projet: Building2,
  communiquer: Megaphone,
  certificat: Award,
  carte_service: IdCard,
  rendu_3d: Cuboid,
  realistic_sketchup: Warehouse,
  plan_architectural: LayoutGrid,
  fiche_employe: ClipboardList,
  code_qr: QrCode,
  formulaire_personnalise: SquarePen,
  historique_connexion: FileClock,
  calendrier_feries: CalendarDays,
  organigramme_entreprise: Network,
  demandes_conges: FilePlus2,
  bilans_sante: HeartPulse,
  gestion_materiel: PackageCheck,
  arrivages_materiel: Warehouse,
  incidents_chantier: AlertTriangle,
  archives_chantiers: Archive,
  lettre_licenciement: FileX2,
  demandes_paiement: Wallet,
  recu_employe: HandCoins,
  version_nuit: Moon,
  gestion_caisse: PiggyBank,
  gestion_dettes: Receipt,
  gestion_stage: GraduationCap,
  gestion_presence: ClipboardCheck,
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
  devis_estimatif: {
    card: { background: "linear-gradient(180deg, rgba(180,83,9,0.18) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(180,83,9,0.3)" },
    banner: { background: "linear-gradient(135deg, #b45309, #eab308)", color: "white" },
    badge: { background: "rgba(255,255,255,0.2)", color: "white" },
    footer: { background: "rgba(180,83,9,0.08)", border: "1px solid rgba(180,83,9,0.18)" },
    action: { background: "rgba(234,179,8,0.16)", border: "1px solid rgba(180,83,9,0.22)" },
    icon: { background: "linear-gradient(135deg, #b45309, #eab308)", color: "white" },
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
  contrat_fournisseur: {
    card: { background: "linear-gradient(180deg, rgba(30,64,175,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(14,165,233,0.28)" },
    banner: { background: "linear-gradient(135deg, #1e40af, #0ea5e9)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(30,64,175,0.08)", border: "1px solid rgba(14,165,233,0.16)" },
    action: { background: "rgba(14,165,233,0.12)", border: "1px solid rgba(30,64,175,0.18)" },
    icon: { background: "linear-gradient(135deg, #1e40af, #0ea5e9)", color: "white" },
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
  plan_architectural: {
    card: { background: "linear-gradient(180deg, rgba(30,64,175,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(99,102,241,0.28)" },
    banner: { background: "linear-gradient(135deg, #1e40af, #6366f1)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(30,64,175,0.08)", border: "1px solid rgba(99,102,241,0.18)" },
    action: { background: "rgba(99,102,241,0.12)", border: "1px solid rgba(30,64,175,0.16)" },
    icon: { background: "linear-gradient(135deg, #1e40af, #6366f1)", color: "white" },
  },
  fiche_employe: {
    card: { background: "linear-gradient(180deg, rgba(22,101,52,0.15) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(37,99,235,0.24)" },
    banner: { background: "linear-gradient(135deg, #166534, #2563eb)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(22,101,52,0.08)", border: "1px solid rgba(37,99,235,0.16)" },
    action: { background: "rgba(22,101,52,0.12)", border: "1px solid rgba(37,99,235,0.16)" },
    icon: { background: "linear-gradient(135deg, #166534, #2563eb)", color: "white" },
  },
  code_qr: {
    card: { background: "linear-gradient(180deg, rgba(15,23,42,0.13) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(20,184,166,0.26)" },
    banner: { background: "linear-gradient(135deg, #0f172a, #14b8a6)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(20,184,166,0.08)", border: "1px solid rgba(15,23,42,0.14)" },
    action: { background: "rgba(20,184,166,0.12)", border: "1px solid rgba(15,23,42,0.16)" },
    icon: { background: "linear-gradient(135deg, #0f172a, #14b8a6)", color: "white" },
  },
  formulaire_personnalise: {
    card: { background: "linear-gradient(180deg, rgba(80,70,229,0.13) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(13,148,136,0.26)" },
    banner: { background: "linear-gradient(135deg, #5046e5, #0d9488)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(80,70,229,0.08)", border: "1px solid rgba(13,148,136,0.16)" },
    action: { background: "rgba(13,148,136,0.12)", border: "1px solid rgba(80,70,229,0.16)" },
    icon: { background: "linear-gradient(135deg, #5046e5, #0d9488)", color: "white" },
  },
  historique_connexion: {
    card: { background: "linear-gradient(180deg, rgba(40,92,120,0.14) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(21,128,61,0.24)" },
    banner: { background: "linear-gradient(135deg, #285c78, #15803d)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(40,92,120,0.08)", border: "1px solid rgba(21,128,61,0.16)" },
    action: { background: "rgba(21,128,61,0.12)", border: "1px solid rgba(40,92,120,0.16)" },
    icon: { background: "linear-gradient(135deg, #285c78, #15803d)", color: "white" },
  },
  calendrier_feries: {
    card: { background: "linear-gradient(180deg, rgba(194,120,3,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(125,71,10,0.26)" },
    banner: { background: "linear-gradient(135deg, #7d470a, #c27803)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(194,120,3,0.08)", border: "1px solid rgba(125,71,10,0.16)" },
    action: { background: "rgba(194,120,3,0.12)", border: "1px solid rgba(125,71,10,0.16)" },
    icon: { background: "linear-gradient(135deg, #7d470a, #c27803)", color: "white" },
  },
  demandes_conges: {
    card: { background: "linear-gradient(180deg, rgba(14,116,144,0.15) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(34,197,94,0.26)" },
    banner: { background: "linear-gradient(135deg, #0e7490, #22c55e)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(14,116,144,0.08)", border: "1px solid rgba(34,197,94,0.16)" },
    action: { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(14,116,144,0.16)" },
    icon: { background: "linear-gradient(135deg, #0e7490, #22c55e)", color: "white" },
  },
  bilans_sante: {
    card: { background: "linear-gradient(180deg, rgba(190,18,60,0.13) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(245,158,11,0.28)" },
    banner: { background: "linear-gradient(135deg, #be123c, #f59e0b)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(190,18,60,0.08)", border: "1px solid rgba(245,158,11,0.16)" },
    action: { background: "rgba(245,158,11,0.12)", border: "1px solid rgba(190,18,60,0.16)" },
    icon: { background: "linear-gradient(135deg, #be123c, #f59e0b)", color: "white" },
  },
  gestion_materiel: {
    card: { background: "linear-gradient(180deg, rgba(71,85,105,0.14) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(202,138,4,0.28)" },
    banner: { background: "linear-gradient(135deg, #475569, #ca8a04)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(71,85,105,0.08)", border: "1px solid rgba(202,138,4,0.16)" },
    action: { background: "rgba(202,138,4,0.12)", border: "1px solid rgba(71,85,105,0.16)" },
    icon: { background: "linear-gradient(135deg, #475569, #ca8a04)", color: "white" },
  },
  arrivages_materiel: {
    card: { background: "linear-gradient(180deg, rgba(14,116,144,0.14) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(202,138,4,0.28)" },
    banner: { background: "linear-gradient(135deg, #0e7490, #ca8a04)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(14,116,144,0.08)", border: "1px solid rgba(202,138,4,0.16)" },
    action: { background: "rgba(202,138,4,0.12)", border: "1px solid rgba(14,116,144,0.16)" },
    icon: { background: "linear-gradient(135deg, #0e7490, #ca8a04)", color: "white" },
  },
  incidents_chantier: {
    card: { background: "linear-gradient(180deg, rgba(185,28,28,0.14) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(234,88,12,0.28)" },
    banner: { background: "linear-gradient(135deg, #b91c1c, #ea580c)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(185,28,28,0.08)", border: "1px solid rgba(234,88,12,0.16)" },
    action: { background: "rgba(234,88,12,0.12)", border: "1px solid rgba(185,28,28,0.16)" },
    icon: { background: "linear-gradient(135deg, #b91c1c, #ea580c)", color: "white" },
  },
  archives_chantiers: {
    card: { background: "linear-gradient(180deg, rgba(52,88,74,0.14) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(180,83,9,0.28)" },
    banner: { background: "linear-gradient(135deg, #34584a, #b45309)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(52,88,74,0.08)", border: "1px solid rgba(180,83,9,0.16)" },
    action: { background: "rgba(180,83,9,0.12)", border: "1px solid rgba(52,88,74,0.16)" },
    icon: { background: "linear-gradient(135deg, #34584a, #b45309)", color: "white" },
  },
  organigramme_entreprise: {
    card: { background: "linear-gradient(180deg, rgba(13,42,148,0.14) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(20,184,166,0.26)" },
    banner: { background: "linear-gradient(135deg, #0d2a94, #14b8a6)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(13,42,148,0.08)", border: "1px solid rgba(20,184,166,0.16)" },
    action: { background: "rgba(20,184,166,0.12)", border: "1px solid rgba(13,42,148,0.16)" },
    icon: { background: "linear-gradient(135deg, #0d2a94, #14b8a6)", color: "white" },
  },
  lettre_licenciement: {
    card: { background: "linear-gradient(180deg, rgba(127,29,29,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(180,83,9,0.28)" },
    banner: { background: "linear-gradient(135deg, #7f1d1d, #b45309)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(127,29,29,0.08)", border: "1px solid rgba(180,83,9,0.16)" },
    action: { background: "rgba(180,83,9,0.12)", border: "1px solid rgba(127,29,29,0.16)" },
    icon: { background: "linear-gradient(135deg, #7f1d1d, #b45309)", color: "white" },
  },
  demandes_paiement: {
    card: { background: "linear-gradient(180deg, rgba(21,94,117,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(202,138,4,0.28)" },
    banner: { background: "linear-gradient(135deg, #155e75, #ca8a04)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(21,94,117,0.08)", border: "1px solid rgba(202,138,4,0.16)" },
    action: { background: "rgba(202,138,4,0.12)", border: "1px solid rgba(21,94,117,0.16)" },
    icon: { background: "linear-gradient(135deg, #155e75, #ca8a04)", color: "white" },
  },
  recu_employe: {
    card: { background: "linear-gradient(180deg, rgba(13,148,136,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(22,163,74,0.28)" },
    banner: { background: "linear-gradient(135deg, #0d9488, #16a34a)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(13,148,136,0.08)", border: "1px solid rgba(22,163,74,0.16)" },
    action: { background: "rgba(22,163,74,0.12)", border: "1px solid rgba(13,148,136,0.16)" },
    icon: { background: "linear-gradient(135deg, #0d9488, #16a34a)", color: "white" },
  },
  version_nuit: {
    card: { background: "linear-gradient(180deg, rgba(15,23,42,0.18) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(99,102,241,0.32)" },
    banner: { background: "linear-gradient(135deg, #0f172a, #6366f1)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(15,23,42,0.08)", border: "1px solid rgba(99,102,241,0.18)" },
    action: { background: "rgba(99,102,241,0.14)", border: "1px solid rgba(15,23,42,0.16)" },
    icon: { background: "linear-gradient(135deg, #0f172a, #6366f1)", color: "white" },
  },
  gestion_caisse: {
    card: { background: "linear-gradient(180deg, rgba(21,94,117,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(202,138,4,0.32)" },
    banner: { background: "linear-gradient(135deg, #155e75, #ca8a04)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(21,94,117,0.08)", border: "1px solid rgba(202,138,4,0.16)" },
    action: { background: "rgba(202,138,4,0.14)", border: "1px solid rgba(21,94,117,0.18)" },
    icon: { background: "linear-gradient(135deg, #155e75, #ca8a04)", color: "white" },
  },
  gestion_dettes: {
    card: { background: "linear-gradient(180deg, rgba(136,19,55,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(217,119,6,0.32)" },
    banner: { background: "linear-gradient(135deg, #881337, #d97706)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(136,19,55,0.08)", border: "1px solid rgba(217,119,6,0.16)" },
    action: { background: "rgba(217,119,6,0.14)", border: "1px solid rgba(136,19,55,0.18)" },
    icon: { background: "linear-gradient(135deg, #881337, #d97706)", color: "white" },
  },
  gestion_stage: {
    card: { background: "linear-gradient(180deg, rgba(15,52,96,0.16) 0%, rgba(255,255,255,0.98) 34%)", borderColor: "rgba(22,33,62,0.32)" },
    banner: { background: "linear-gradient(135deg, #0f3460, #16213e)", color: "white" },
    badge: { background: "rgba(255,255,255,0.18)", color: "white" },
    footer: { background: "rgba(15,52,96,0.08)", border: "1px solid rgba(22,33,62,0.16)" },
    action: { background: "rgba(22,33,62,0.14)", border: "1px solid rgba(15,52,96,0.18)" },
    icon: { background: "linear-gradient(135deg, #0f3460, #16213e)", color: "white" },
  },
};

function normaliser(texte: string) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function Index() {
  const [outilActif, setOutilActif] = useState<OutilType | null>(null);
  const [recherche, setRecherche] = useState("");

  const requete = normaliser(recherche.trim());
  const outilsFiltres = useMemo(() => {
    if (!requete) return configs;
    return configs.filter((config) => {
      const haystack = normaliser(`${config.titre} ${config.description}`);
      return haystack.includes(requete);
    });
  }, [requete]);

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
            <Link to="/employe" className="primary-action tool-green hidden sm:inline-flex">
              <UsersRound className="size-4" /> Espace employés
            </Link>
          </header>

          <div className="signature-lift rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool tool-blue lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="mb-3 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-black uppercase tracking-wide">Tableau de bord</span>
                <h2 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Tous vos outils documentaires, en un seul endroit.</h2>
                <p className="mt-3 text-sm opacity-90 sm:text-base">Générez, archivez et téléchargez vos documents officiels SCM SARL en quelques clics.</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-tool-foreground/12 px-4 py-3">
                <HardHat className="size-7" />
                <div className="text-left">
                  <strong className="block text-2xl leading-none">{configs.length}</strong>
                  <span className="text-xs opacity-90">outils disponibles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground lg:text-3xl">Outils disponibles</h2>
              <p className="text-sm text-muted-foreground">Recherchez ou parcourez vos générateurs.</p>
            </div>
            <Link to="/employe" className="primary-action tool-green w-full sm:hidden">
              <UsersRound className="size-4" /> Espace employés
            </Link>
          </div>

          <div className="relative mb-6">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Rechercher un outil (facture, contrat, employé…)"
              className="w-full rounded-2xl border border-border bg-card/90 py-3.5 pl-12 pr-12 text-sm font-medium text-foreground shadow-document outline-none ring-0 transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Rechercher un outil"
            />
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche("")}
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {outilsFiltres.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
              <p className="text-sm font-semibold text-foreground">Aucun outil ne correspond à « {recherche} ».</p>
              <p className="mt-1 text-xs text-muted-foreground">Essayez un autre mot-clé.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              {outilsFiltres.map((config) => {
                const Icone = icones[config.type] ?? FileText;
                const visual = stylesOutils[config.type] ?? stylesOutils.communiquer;
                const titreCourt = config.titre.replace("Générateur de ", "").replace("Générateur d’", "");
                return (
                  <button
                    key={config.type}
                    type="button"
                    onClick={() => setOutilActif(config.type)}
                    className="group relative flex h-full flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-document sm:flex-row sm:items-center sm:gap-4 sm:p-5"
                  >
                    <span
                      style={visual.icon}
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl shadow-tool transition group-hover:scale-105 sm:size-16 sm:rounded-2xl"
                    >
                      <Icone className="size-5 sm:size-7" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-black leading-tight text-foreground sm:truncate sm:text-lg">{titreCourt}</h3>
                      <p className="mt-1 line-clamp-2 hidden text-xs leading-5 text-muted-foreground sm:block sm:text-sm">{config.description}</p>
                    </div>
                    <ArrowRight className="hidden size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary sm:block" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
