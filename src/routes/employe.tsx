import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Edit3,
  Eye,
  EyeOff,
  HardHat,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import scmCompanyLogo from "@/assets/scm-company-logo.jpeg";

export const Route = createFileRoute("/employe")({
  head: () => ({
    meta: [
      { title: "SCM SARL — Gestion employés et chantiers" },
      { name: "description", content: "Application SCM SARL en français pour gérer employés, projets, chantiers et présences quotidiennes." },
      { property: "og:title", content: "SCM SARL — Gestion entreprise" },
      { property: "og:description", content: "Espace sécurisé par rôle pour Admin, Employé et Chef de chantier." },
    ],
  }),
  component: EmployePage,
});

type RoleSession = "admin" | "employe" | "chef_chantier";
type Onglet = "dashboard" | "projets" | "employes" | "chantiers" | "presences";
type StatutPresence = "présent" | "absent" | "en retard" | "excusé";
type ModeEdition = { type: "projets" | "employes" | "chantiers"; id?: string } | null;
type Detail = { type: "projets" | "employes" | "chantiers" | "presences"; id: string } | null;

type Session = {
  token: string;
  role: RoleSession;
  nom: string;
  employeId: string | null;
  adminId: string | null;
};

type Projet = {
  id: string;
  nom_projet: string;
  client: string;
  localisation: string;
  description: string;
  budget_estime: number;
  statut: string;
  date_debut: string | null;
  date_fin_prevue: string | null;
  created_at: string;
};

type Employe = {
  id: string;
  nom_complet: string;
  poste: string;
  matricule: string;
  telephone: string;
  adresse: string;
  salaire: number;
  salaire_total?: number;
  salaire_recu?: number;
  salaire_restant?: number;
  role?: "employe" | "chef_chantier";
  statut: string;
  chantier_assigne: string | null;
  peut_voir_budget?: boolean;
  photo_profil?: string;
  created_at: string;
};

type Chantier = {
  id: string;
  nom_chantier: string;
  localisation: string;
  chef_chantier: string;
  projet_lie: string | null;
  employes_assignes?: string[];
  description: string;
  budget_global?: number;
  images_chantier?: string[];
  autoriser_budget_chef?: boolean;
  statut: string;
  date_debut: string | null;
  date_fin_prevue: string | null;
  created_at: string;
};

type Presence = {
  id: string;
  date: string;
  chantier_id: string;
  chef_chantier_id: string;
  employes_presence: { employe_id: string; nom_complet: string; statut: StatutPresence }[];
  notes: string;
  created_at: string;
};

type ProjetForm = Omit<Projet, "id" | "created_at" | "budget_estime"> & { budget_estime: string };
type EmployeForm = Omit<Employe, "id" | "created_at" | "salaire" | "salaire_total" | "salaire_recu" | "salaire_restant"> & { salaire_total: string; salaire_recu: string };
type ChantierForm = Omit<Chantier, "id" | "created_at" | "budget_global" | "images_chantier"> & { budget_global: string; images_chantier: string[] };

const db = supabase as any;
const SESSION_KEY = "scm-session-token";
const statutsProjet = ["Planifié", "Actif", "En pause", "Terminé"];
const statutsEmploye = ["actif", "inactif"];
const statutsChantier = ["Planifié", "Actif", "En pause", "Terminé"];
const statutsPresence: StatutPresence[] = ["présent", "absent", "en retard", "excusé"];

const projetInitial: ProjetForm = { nom_projet: "", client: "", localisation: "", description: "", budget_estime: "", statut: "Planifié", date_debut: "", date_fin_prevue: "" };
const employeInitial: EmployeForm = { nom_complet: "", poste: "", matricule: "", telephone: "", adresse: "", salaire_total: "", salaire_recu: "0", role: "employe", statut: "actif", chantier_assigne: "", peut_voir_budget: false, photo_profil: "" };
const chantierInitial: ChantierForm = { nom_chantier: "", localisation: "", chef_chantier: "", projet_lie: "", employes_assignes: [], description: "", budget_global: "", images_chantier: [], autoriser_budget_chef: false, statut: "Planifié", date_debut: "", date_fin_prevue: "" };

function nombre(value: number) { return new Intl.NumberFormat("fr-FR").format(value || 0); }
function devise(value: number) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0); }
function dateFr(value?: string | null) { return value ? new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "Non définie"; }
function normaliserDate(value: string | null) { return value && value.length > 0 ? value : null; }
async function sha256(value: string) { const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
function sessionRoleLabel(role: RoleSession) { return role === "admin" ? "Administrateur" : role === "chef_chantier" ? "Chef de chantier" : "Employé"; }

function EmployePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loginMode, setLoginMode] = useState<"admin" | "matricule">("matricule");
  const [identifiant, setIdentifiant] = useState("");
  const [onglet, setOnglet] = useState<Onglet>("dashboard");
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [message, setMessage] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreDate, setFiltreDate] = useState("");
  const [filtreChantier, setFiltreChantier] = useState("");
  const [filtreEmploye, setFiltreEmploye] = useState("");
  const [filtreChef, setFiltreChef] = useState("");
  const [edition, setEdition] = useState<ModeEdition>(null);
  const [detail, setDetail] = useState<Detail>(null);
  const [formProjet, setFormProjet] = useState<ProjetForm>(projetInitial);
  const [formEmploye, setFormEmploye] = useState<EmployeForm>(employeInitial);
  const [formChantier, setFormChantier] = useState<ChantierForm>(chantierInitial);
  const [presenceDate, setPresenceDate] = useState(new Date().toISOString().slice(0, 10));
  const [presenceChantier, setPresenceChantier] = useState("");
  const [presenceNotes, setPresenceNotes] = useState("");
  const [presenceStatuts, setPresenceStatuts] = useState<Record<string, StatutPresence>>({});

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
    if (!token) { setChargement(false); return; }
    restaurerSession(token);
  }, []);

  useEffect(() => {
    if (session) chargerDonnees(session);
  }, [session]);

  const employeConnecte = useMemo(() => employes.find((employe) => employe.id === session?.employeId) || null, [employes, session]);
  const isAdmin = session?.role === "admin";
  const isChef = session?.role === "chef_chantier";

  const chantiersVisibles = useMemo(() => {
    if (!session || isAdmin) return chantiers;
    const employeId = session.employeId;
    if (!employeId) return [];
    if (isChef) return chantiers.filter((c) => c.chef_chantier === employeId || (c.employes_assignes || []).includes(employeId));
    return chantiers.filter((c) => (c.employes_assignes || []).includes(employeId) || c.id === employeConnecte?.chantier_assigne);
  }, [chantiers, session, isAdmin, isChef, employeConnecte]);

  const employesVisibles = useMemo(() => {
    if (!session || isAdmin) return employes;
    if (isChef) {
      const ids = new Set(chantiersVisibles.flatMap((c) => c.employes_assignes || []));
      if (session.employeId) ids.add(session.employeId);
      return employes.filter((e) => ids.has(e.id));
    }
    return employes.filter((e) => e.id === session.employeId);
  }, [employes, session, isAdmin, isChef, chantiersVisibles]);

  const projetsVisibles = useMemo(() => isAdmin ? projets : projets.filter((p) => chantiersVisibles.some((c) => c.projet_lie === p.id)), [projets, isAdmin, chantiersVisibles]);
  const presencesVisibles = useMemo(() => {
    if (isAdmin) return presences;
    if (isChef && session?.employeId) return presences.filter((p) => p.chef_chantier_id === session.employeId);
    return presences.filter((p) => p.employes_presence.some((e) => e.employe_id === session?.employeId));
  }, [presences, isAdmin, isChef, session]);

  const stats = useMemo(() => ({
    totalProjets: projetsVisibles.length,
    totalEmployes: employesVisibles.length,
    totalChantiers: chantiersVisibles.length,
    projetsActifs: projetsVisibles.filter((p) => p.statut === "Actif").length,
    chantiersActifs: chantiersVisibles.filter((c) => c.statut === "Actif").length,
    presences: presencesVisibles.length,
  }), [projetsVisibles, employesVisibles, chantiersVisibles, presencesVisibles]);

  const projetsFiltres = useMemo(() => filtrer(projetsVisibles, recherche, ["nom_projet", "client", "localisation", "statut"]), [projetsVisibles, recherche]);
  const employesFiltres = useMemo(() => filtrer(employesVisibles, recherche, ["nom_complet", "poste", "matricule", "telephone", "statut"]), [employesVisibles, recherche]);
  const chantiersFiltres = useMemo(() => filtrer(chantiersVisibles, recherche, ["nom_chantier", "localisation", "statut", "description"]), [chantiersVisibles, recherche]);
  const presencesFiltrees = useMemo(() => presencesVisibles.filter((p) => {
    const matchRecherche = !recherche || `${nomChantier(chantiers, p.chantier_id)} ${nomEmploye(employes, p.chef_chantier_id)} ${p.notes}`.toLowerCase().includes(recherche.toLowerCase());
    const matchDate = !filtreDate || p.date === filtreDate;
    const matchChantier = !filtreChantier || p.chantier_id === filtreChantier;
    const matchEmploye = !filtreEmploye || p.employes_presence.some((e) => e.employe_id === filtreEmploye);
    const matchChef = !filtreChef || p.chef_chantier_id === filtreChef;
    return matchRecherche && matchDate && matchChantier && matchEmploye && matchChef;
  }), [presencesVisibles, recherche, filtreDate, filtreChantier, filtreEmploye, filtreChef, chantiers, employes]);

  async function restaurerSession(token: string) {
    setChargement(true);
    const tokenHash = await sha256(token);
    const { data } = await db.rpc("scm_get_session", { _token_hash: tokenHash });
    if (!data?.success) { localStorage.removeItem(SESSION_KEY); setChargement(false); return; }
    setSession({ token, role: data.role, nom: data.nom, employeId: data.employeId, adminId: data.adminId });
    setChargement(false);
  }

  async function connecter(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const saisie = identifiant.trim();
    if (!saisie) { setIdentifiant(""); setMessage(loginMode === "admin" ? "Entrez l’identifiant admin." : "Entrez le matricule employé."); return; }
    setSauvegarde(true);
    const token = crypto.randomUUID() + crypto.randomUUID();
    const tokenHash = await sha256(token);
    const { data, error } = loginMode === "admin"
      ? await db.rpc("scm_login_admin", { _username: saisie, _token_hash: tokenHash })
      : await db.rpc("scm_login_employe", { _matricule: saisie, _token_hash: tokenHash });
    setSauvegarde(false);
    if (error || !data?.success) { setIdentifiant(""); setMessage(data?.message || "Connexion impossible pour le moment."); return; }
    localStorage.setItem(SESSION_KEY, token);
    setIdentifiant("");
    setSession({ token, role: data.role, nom: data.nom, employeId: data.employeId, adminId: data.adminId });
    setOnglet("dashboard");
  }

  async function deconnecter() {
    if (session?.token) await db.rpc("scm_logout", { _token_hash: await sha256(session.token) });
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setProjets([]); setEmployes([]); setChantiers([]); setPresences([]); setMessage(""); setOnglet("dashboard");
  }

  async function chargerDonnees(currentSession = session) {
    if (!currentSession) return;
    setChargement(true);
    setMessage("");
    const [projetsRes, employesRes, chantiersRes, presencesRes] = await Promise.all([
      db.from("projets").select("*").order("created_at", { ascending: false }),
      db.from("employes").select("*").order("created_at", { ascending: false }),
      db.from("chantiers").select("*").order("created_at", { ascending: false }),
      db.from("presences").select("*").order("date", { ascending: false }),
    ]);
    if (projetsRes.error || employesRes.error || chantiersRes.error || presencesRes.error) setMessage("Impossible de charger les données Lovable Cloud.");
    setProjets(projetsRes.data || []);
    setEmployes(projetsRes.error ? [] : (employesRes.data || []));
    setChantiers(chantiersRes.data || []);
    setPresences(presencesRes.data || []);
    setChargement(false);
  }

  const ouvrirCreation = (type: Exclude<ModeEdition, null>["type"]) => {
    if (!isAdmin) return;
    setEdition({ type }); setDetail(null); setMessage("");
    if (type === "projets") setFormProjet(projetInitial);
    if (type === "employes") setFormEmploye(employeInitial);
    if (type === "chantiers") setFormChantier(chantierInitial);
  };

  const ouvrirEdition = (type: Exclude<ModeEdition, null>["type"], id: string) => {
    if (!isAdmin) return;
    setEdition({ type, id }); setDetail(null); setMessage("");
    if (type === "projets") { const item = projets.find((p) => p.id === id); if (item) setFormProjet({ ...item, budget_estime: String(item.budget_estime || ""), date_debut: item.date_debut || "", date_fin_prevue: item.date_fin_prevue || "" }); }
    if (type === "employes") { const item = employes.find((e) => e.id === id); if (item) setFormEmploye({ ...item, salaire_total: String(item.salaire_total ?? item.salaire ?? ""), salaire_recu: String(item.salaire_recu || 0), chantier_assigne: item.chantier_assigne || "", role: item.role || "employe", peut_voir_budget: !!item.peut_voir_budget, photo_profil: item.photo_profil || "" }); }
    if (type === "chantiers") { const item = chantiers.find((c) => c.id === id); if (item) setFormChantier({ ...item, projet_lie: item.projet_lie || "", chef_chantier: item.chef_chantier || "", employes_assignes: item.employes_assignes || [], budget_global: String(item.budget_global || ""), images_chantier: item.images_chantier || [], date_debut: item.date_debut || "", date_fin_prevue: item.date_fin_prevue || "", autoriser_budget_chef: !!item.autoriser_budget_chef }); }
  };

  async function enregistrerProjet(event: React.FormEvent) {
    event.preventDefault(); if (!formProjet.nom_projet.trim()) return setMessage("Le nom du projet est obligatoire.");
    setSauvegarde(true);
    const payload = { ...formProjet, budget_estime: Number(formProjet.budget_estime) || 0, date_debut: normaliserDate(formProjet.date_debut), date_fin_prevue: normaliserDate(formProjet.date_fin_prevue) };
    const { error } = edition?.id ? await db.from("projets").update(payload).eq("id", edition.id) : await db.from("projets").insert(payload);
    await finaliserSauvegarde(error, "Projet enregistré.");
  }

  async function enregistrerEmploye(event: React.FormEvent) {
    event.preventDefault();
    if (!formEmploye.nom_complet.trim()) return setMessage("Le nom complet est obligatoire.");
    if (!formEmploye.matricule.trim()) return setMessage("Le matricule est obligatoire.");
    const total = Number(formEmploye.salaire_total) || 0;
    const recu = Number(formEmploye.salaire_recu) || 0;
    setSauvegarde(true);
    const payload = { ...formEmploye, salaire: total, salaire_total: total, salaire_recu: recu, salaire_restant: Math.max(total - recu, 0), chantier_assigne: formEmploye.chantier_assigne || null };
    const { error } = edition?.id ? await db.from("employes").update(payload).eq("id", edition.id) : await db.from("employes").insert(payload);
    await finaliserSauvegarde(error, "Employé enregistré.");
  }

  async function enregistrerChantier(event: React.FormEvent) {
    event.preventDefault(); if (!formChantier.nom_chantier.trim()) return setMessage("Le nom du chantier est obligatoire.");
    setSauvegarde(true);
    const payload = { ...formChantier, projet_lie: formChantier.projet_lie || null, chef_chantier: formChantier.chef_chantier || "", budget_global: Number(formChantier.budget_global) || 0, date_debut: normaliserDate(formChantier.date_debut), date_fin_prevue: normaliserDate(formChantier.date_fin_prevue) };
    const { error } = edition?.id ? await db.from("chantiers").update(payload).eq("id", edition.id) : await db.from("chantiers").insert(payload);
    await finaliserSauvegarde(error, "Chantier enregistré.");
  }

  async function finaliserSauvegarde(error: { message?: string } | null, succes: string) {
    setSauvegarde(false);
    if (error) { setMessage(error.message || "Erreur lors de l’enregistrement."); return; }
    setMessage(succes); setEdition(null); await chargerDonnees();
  }

  async function supprimer(type: "projets" | "employes" | "chantiers", id: string) {
    if (!isAdmin) return;
    const libelle = type === "projets" ? "ce projet" : type === "employes" ? "cet employé" : "ce chantier";
    if (!confirm(`Voulez-vous vraiment supprimer ${libelle} ?`)) return;
    const { error } = await db.from(type).delete().eq("id", id);
    if (error) setMessage(error.message || "Suppression impossible."); else { setMessage("Élément supprimé."); setDetail(null); await chargerDonnees(); }
  }

  async function televerserImages(files: FileList | null) {
    if (!files?.length) return;
    setSauvegarde(true);
    const urls = [...files];
    const current = [...(formChantier.images_chantier || [])];
    for (const file of urls) {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error } = await supabase.storage.from("chantier-images").upload(path, file, { upsert: false });
      if (error) { setMessage("Téléversement image impossible."); setSauvegarde(false); return; }
      const { data } = supabase.storage.from("chantier-images").getPublicUrl(path);
      current.push(data.publicUrl);
    }
    setFormChantier({ ...formChantier, images_chantier: current });
    setSauvegarde(false);
  }

  function retirerImage(url: string) { setFormChantier({ ...formChantier, images_chantier: formChantier.images_chantier.filter((img) => img !== url) }); }

  async function televerserPhotoEmploye(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setSauvegarde(true);
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("employe-photos").upload(path, file, { upsert: false });
    if (error) { setMessage("Téléversement de la photo impossible."); setSauvegarde(false); return; }
    const { data } = supabase.storage.from("employe-photos").getPublicUrl(path);
    setFormEmploye({ ...formEmploye, photo_profil: data.publicUrl });
    setSauvegarde(false);
  }

  function retirerPhotoEmploye() { setFormEmploye({ ...formEmploye, photo_profil: "" }); }

  async function enregistrerPresence(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.employeId) return;
    const chantier = chantiersVisibles.find((c) => c.id === presenceChantier) || chantiersVisibles[0];
    if (!chantier) return setMessage("Aucun chantier disponible pour créer une présence.");
    const assigned = employes.filter((e) => (chantier.employes_assignes || []).includes(e.id));
    const employes_presence = assigned.map((e) => ({ employe_id: e.id, nom_complet: e.nom_complet, statut: presenceStatuts[e.id] || "présent" as StatutPresence }));
    setSauvegarde(true);
    const { error } = await db.from("presences").insert({ date: presenceDate, chantier_id: chantier.id, chef_chantier_id: session.employeId, employes_presence, notes: presenceNotes });
    setSauvegarde(false);
    if (error) setMessage(error.message || "Présence non enregistrée."); else { setMessage("Présence quotidienne enregistrée."); setPresenceNotes(""); await chargerDonnees(); }
  }

  function changerOnglet(tab: Onglet) { setOnglet(tab); setRecherche(""); setMenuOuvert(false); }

  if (!session) return <LoginScreen mode={loginMode} setMode={setLoginMode} identifiant={identifiant} setIdentifiant={setIdentifiant} connecter={connecter} saving={sauvegarde} message={message} chargement={chargement} />;

  const titreOnglet = onglet === "dashboard" ? "Tableau de bord" : onglet === "projets" ? "Projets" : onglet === "employes" ? "Employés" : onglet === "chantiers" ? "Chantiers" : "Présences";
  const chefOptions = employes.filter((e) => e.role === "chef_chantier");
  const chantierPresence = chantiersVisibles.find((c) => c.id === presenceChantier) || chantiersVisibles[0];
  const employesPresence = chantierPresence ? employes.filter((e) => (chantierPresence.employes_assignes || []).includes(e.id)) : [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className={`${menuOuvert ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-card p-5 shadow-document transition-transform lg:sticky lg:translate-x-0`}>
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">SCM SARL</p><h1 className="mt-1 text-2xl font-black">Gestion</h1><p className="mt-1 text-xs font-bold text-primary">{sessionRoleLabel(session.role)}</p></div><button className="tool-action lg:hidden" onClick={() => setMenuOuvert(false)} aria-label="Fermer"><X className="size-4" /></button></div>
          <Link to="/" className="mini-button mt-6 w-full"><ArrowLeft className="size-4" /> Retour aux outils</Link>
          <nav className="mt-8 space-y-2">
            <BoutonNav actif={onglet === "dashboard"} icone={LayoutDashboard} label="Tableau de bord" onClick={() => changerOnglet("dashboard")} />
            {isAdmin && <BoutonNav actif={onglet === "projets"} icone={BriefcaseBusiness} label="Projets" onClick={() => changerOnglet("projets")} />}
            <BoutonNav actif={onglet === "employes"} icone={UsersRound} label={isAdmin ? "Employés" : "Mon profil"} onClick={() => changerOnglet("employes")} />
            <BoutonNav actif={onglet === "chantiers"} icone={HardHat} label="Chantiers" onClick={() => changerOnglet("chantiers")} />
            {(isAdmin || isChef) && <BoutonNav actif={onglet === "presences"} icone={ClipboardCheck} label="Présences" onClick={() => changerOnglet("presences")} />}
          </nav>
          <div className="mt-10 rounded-2xl border border-border bg-background p-4"><Building2 className="mb-3 size-8 text-primary" /><p className="text-sm font-bold">{session.nom}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Accès filtré automatiquement selon le rôle connecté.</p><button className="mini-button mt-4 w-full" onClick={deconnecter}><LogOut className="size-4" /> Déconnexion</button></div>
        </aside>
        {menuOuvert && <button className="fixed inset-0 z-30 bg-foreground/25 lg:hidden" onClick={() => setMenuOuvert(false)} aria-label="Fermer le menu" />}
        <section className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8">
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-document sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><button className="tool-action lg:hidden" onClick={() => setMenuOuvert(true)} aria-label="Ouvrir"><Menu className="size-5" /></button><div className="tool-blue inline-flex size-12 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool"><UserRound className="size-6" /></div><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Espace entreprise</p><h2 className="text-2xl font-black sm:text-3xl">{titreOnglet}</h2></div></div>{isAdmin && ["projets", "employes", "chantiers"].includes(onglet) && <button className="primary-action" onClick={() => ouvrirCreation(onglet as any)}><Plus className="size-4" /> Nouveau</button>}</header>
          {message && <div className="mb-5 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-document">{message}</div>}
          {chargement ? <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-border bg-card"><Loader2 className="size-8 animate-spin text-primary" /></div> : onglet === "dashboard" ? <Dashboard role={session.role} stats={stats} employe={employeConnecte} chantiers={chantiersVisibles} presences={presencesVisibles} setOnglet={setOnglet} /> : <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-document sm:flex-row sm:items-center sm:justify-between"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="form-control pl-10" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={`Rechercher dans ${titreOnglet.toLowerCase()}...`} /></div><p className="text-sm font-bold text-muted-foreground">{onglet === "projets" ? projetsFiltres.length : onglet === "employes" ? employesFiltres.length : onglet === "chantiers" ? chantiersFiltres.length : presencesFiltrees.length} résultat(s)</p></div>
            {onglet === "projets" && <ListeProjets projets={projetsFiltres} admin={isAdmin} voir={(id: string) => setDetail({ type: "projets", id })} modifier={(id: string) => ouvrirEdition("projets", id)} supprimer={(id: string) => supprimer("projets", id)} />}
            {onglet === "employes" && <ListeEmployes employes={employesFiltres} chantiers={chantiers} admin={isAdmin} showSalary={isAdmin || !isChef} voir={(id: string) => setDetail({ type: "employes", id })} modifier={(id: string) => ouvrirEdition("employes", id)} supprimer={(id: string) => supprimer("employes", id)} />}
            {onglet === "chantiers" && <ListeChantiers chantiers={chantiersFiltres} projets={projets} employes={employes} admin={isAdmin} viewerRole={session.role} viewerId={session.employeId} voir={(id: string) => setDetail({ type: "chantiers", id })} modifier={(id: string) => ouvrirEdition("chantiers", id)} supprimer={(id: string) => supprimer("chantiers", id)} />}
            {onglet === "presences" && <PresencesSection admin={isAdmin} chef={isChef} presences={presencesFiltrees} chantiers={chantiers} employes={employes} chefs={chefOptions} filtreDate={filtreDate} setFiltreDate={setFiltreDate} filtreChantier={filtreChantier} setFiltreChantier={setFiltreChantier} filtreEmploye={filtreEmploye} setFiltreEmploye={setFiltreEmploye} filtreChef={filtreChef} setFiltreChef={setFiltreChef} voir={(id: string) => setDetail({ type: "presences", id })} presenceDate={presenceDate} setPresenceDate={setPresenceDate} presenceChantier={presenceChantier || chantierPresence?.id || ""} setPresenceChantier={setPresenceChantier} presenceNotes={presenceNotes} setPresenceNotes={setPresenceNotes} employesPresence={employesPresence} presenceStatuts={presenceStatuts} setPresenceStatuts={setPresenceStatuts} submit={enregistrerPresence} saving={sauvegarde} chantiersVisibles={chantiersVisibles} />}
          </div>}
        </section>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-card/95 p-2 shadow-document backdrop-blur lg:hidden"><BoutonMobile actif={onglet === "dashboard"} icone={LayoutDashboard} label="Accueil" onClick={() => changerOnglet("dashboard")} /><BoutonMobile actif={onglet === "employes"} icone={UsersRound} label="Profil" onClick={() => changerOnglet("employes")} /><BoutonMobile actif={onglet === "chantiers"} icone={HardHat} label="Chantiers" onClick={() => changerOnglet("chantiers")} /><BoutonMobile actif={onglet === "presences"} icone={ClipboardCheck} label="Présences" onClick={() => changerOnglet(isAdmin || isChef ? "presences" : "dashboard")} /></nav>
      {edition && <Modal titre={edition.id ? "Modifier" : "Créer"} fermer={() => setEdition(null)}>{edition.type === "projets" && <FormProjet form={formProjet} setForm={setFormProjet} onSubmit={enregistrerProjet} saving={sauvegarde} />}{edition.type === "employes" && <FormEmploye form={formEmploye} setForm={setFormEmploye} chantiers={chantiers} onSubmit={enregistrerEmploye} saving={sauvegarde} televerserPhoto={televerserPhotoEmploye} retirerPhoto={retirerPhotoEmploye} />}{edition.type === "chantiers" && <FormChantier form={formChantier} setForm={setFormChantier} projets={projets} employes={employes} onSubmit={enregistrerChantier} saving={sauvegarde} televerserImages={televerserImages} retirerImage={retirerImage} />}</Modal>}
      {detail && <Modal titre="Détails" fermer={() => setDetail(null)}><Details detail={detail} projets={projets} employes={employes} chantiers={chantiers} presences={presences} admin={isAdmin} role={session.role} viewerId={session.employeId} modifier={() => detail.type !== "presences" && ouvrirEdition(detail.type, detail.id)} supprimer={() => detail.type !== "presences" && supprimer(detail.type, detail.id)} /></Modal>}
    </main>
  );
}

function LoginScreen({ mode, setMode, identifiant, setIdentifiant, connecter, saving, message, chargement }: any) {
  return <main className="construction-grid flex min-h-screen items-center justify-center bg-background p-4"><section className="w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-document lg:grid lg:grid-cols-[.95fr_1.05fr]"><div className="tool-blue hidden bg-tool-gradient p-8 text-tool-foreground lg:flex lg:flex-col lg:justify-between"><div><img src={scmCompanyLogo} alt="Logo SCM SARL" className="h-28 w-28 rounded-3xl bg-card object-contain p-3 shadow-document" /><h1 className="mt-8 text-5xl font-black leading-none">SCM SARL</h1><p className="mt-4 max-w-sm text-sm font-semibold opacity-90">Espace moderne de gestion des employés, chantiers, projets et présences quotidiennes.</p></div><div className="grid grid-cols-3 gap-3 text-center text-xs font-black"><span className="rounded-2xl bg-tool-foreground/15 p-3">Admin</span><span className="rounded-2xl bg-tool-foreground/15 p-3">Employés</span><span className="rounded-2xl bg-tool-foreground/15 p-3">Chantiers</span></div></div><div className="p-6 sm:p-8"><div className="flex items-center gap-4 lg:hidden"><img src={scmCompanyLogo} alt="Logo SCM SARL" className="h-20 w-20 rounded-2xl border border-border bg-card object-contain p-2 shadow-document" /><div><h1 className="text-3xl font-black">SCM SARL</h1><p className="text-sm text-muted-foreground">Connexion entreprise</p></div></div><div className="hidden lg:block"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Connexion sécurisée</p><h2 className="mt-2 text-3xl font-black">Accéder au tableau de bord</h2></div><div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1"><button type="button" className={`rounded-xl px-3 py-3 text-sm font-black ${mode === "matricule" ? "bg-card shadow-document" : "text-muted-foreground"}`} onClick={() => setMode("matricule")}>Employés</button><button type="button" className={`rounded-xl px-3 py-3 text-sm font-black ${mode === "admin" ? "bg-card shadow-document" : "text-muted-foreground"}`} onClick={() => setMode("admin")}>Admin</button></div><form className="mt-6 space-y-4" onSubmit={connecter}><Champ label={mode === "admin" ? "Identifiant admin" : "Matricule employé"}><input className="form-control" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} placeholder={mode === "admin" ? "SCM00123" : "Ex: SCM-001"} /></Champ>{message && <p className="rounded-xl bg-muted p-3 text-sm font-bold text-foreground">{message}</p>}<button className="primary-action w-full" disabled={saving || chargement}>{saving || chargement ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Se connecter</button></form></div></section></main>;
}

function filtrer<T extends Record<string, unknown>>(items: T[], recherche: string, champs: (keyof T)[]) { const q = recherche.trim().toLowerCase(); return q ? items.filter((item) => champs.some((champ) => String(item[champ] ?? "").toLowerCase().includes(q))) : items; }
function BoutonNav({ actif, icone: Icon, label, onClick }: { actif: boolean; icone: typeof LayoutDashboard; label: string; onClick: () => void }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${actif ? "bg-primary text-primary-foreground shadow-tool" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="size-5" />{label}</button>; }
function BoutonMobile({ actif, icone: Icon, label, onClick }: { actif: boolean; icone: typeof LayoutDashboard; label: string; onClick: () => void }) { return <button onClick={onClick} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-black ${actif ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Icon className="size-5" />{label}</button>; }
function CarteStat({ titre, valeur, icone: Icon }: { titre: string; valeur: number | string; icone: typeof LayoutDashboard }) { return <article className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{titre}</p><Icon className="size-5 text-primary" /></div><p className="mt-4 text-3xl font-black">{typeof valeur === "number" ? nombre(valeur) : valeur}</p></article>; }
function Dashboard({ role, stats, employe, chantiers, presences, setOnglet }: any) { return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><CarteStat titre="Projets" valeur={stats.totalProjets} icone={BriefcaseBusiness} /><CarteStat titre="Employés" valeur={stats.totalEmployes} icone={UsersRound} /><CarteStat titre="Chantiers" valeur={stats.totalChantiers} icone={HardHat} /><CarteStat titre="Chantiers actifs" valeur={stats.chantiersActifs} icone={CheckCircle2} /><CarteStat titre="Présences" valeur={stats.presences} icone={ClipboardCheck} /></div>{employe && <div className="grid gap-4 lg:grid-cols-3"><CarteStat titre="Salaire total" valeur={devise(employe.salaire_total ?? employe.salaire)} icone={ClipboardList} /><CarteStat titre="Salaire reçu" valeur={devise(employe.salaire_recu || 0)} icone={CheckCircle2} /><CarteStat titre="Salaire restant" valeur={devise(employe.salaire_restant ?? 0)} icone={CalendarDays} /></div>}<div className="grid gap-5 xl:grid-cols-2"><Apercu titre={role === "admin" ? "Chantiers récents" : "Mes chantiers"} action="Voir les chantiers" onClick={() => setOnglet("chantiers")} items={chantiers.slice(0, 4).map((c: Chantier) => ({ titre: c.nom_chantier, meta: `${c.localisation || "Localisation non définie"} • ${c.statut}` }))} /><Apercu titre="Présences récentes" action="Voir les présences" onClick={() => setOnglet("presences")} items={presences.slice(0, 4).map((p: Presence) => ({ titre: dateFr(p.date), meta: p.notes || "Rapport quotidien" }))} /></div></div>; }
function Apercu({ titre, action, items, onClick }: any) { return <article className="rounded-2xl border border-border bg-card p-5 shadow-document"><h3 className="text-lg font-black">{titre}</h3><div className="mt-4 space-y-3">{items.length ? items.map((item: any) => <div key={`${item.titre}-${item.meta}`} className="rounded-xl border border-border bg-background p-3"><p className="font-bold">{item.titre}</p><p className="mt-1 text-xs text-muted-foreground">{item.meta}</p></div>) : <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Aucune donnée.</p>}</div><button className="mini-button mt-4 w-full" onClick={onClick}>{action}</button></article>; }
function Actions({ voir, modifier, supprimer, admin }: { voir: () => void; modifier: () => void; supprimer: () => void; admin: boolean }) { return <div className="flex items-center gap-2"><button className="mini-button" onClick={voir}>Voir</button>{admin && <><button className="tool-action" onClick={modifier} aria-label="Modifier"><Edit3 className="size-4" /></button><button className="tool-action danger" onClick={supprimer} aria-label="Supprimer"><Trash2 className="size-4" /></button></>}</div>; }
function Info({ icone: Icon, label, valeur }: { icone: typeof LayoutDashboard; label: string; valeur: string }) { return <div className="rounded-xl border border-border bg-background p-3"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-muted-foreground"><Icon className="size-4" />{label}</div><p className="mt-2 text-sm font-bold text-foreground">{valeur}</p></div>; }
function Modal({ titre, fermer, children }: { titre: string; fermer: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-3 sm:items-center"><section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-document"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-black">{titre}</h2><button className="tool-action" onClick={fermer} aria-label="Fermer"><X className="size-4" /></button></div>{children}</section></div>; }
function Champ({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-black text-foreground">{label}</span>{children}</label>; }
function Select({ value, onChange, children }: any) { return <select className="form-control" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>; }
function ListeProjets({ projets, admin, voir, modifier, supprimer }: any) { return <div className="grid gap-4 xl:grid-cols-2">{projets.map((p: Projet) => <article key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex justify-between gap-4"><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{p.statut}</span><h3 className="mt-3 text-xl font-black">{p.nom_projet}</h3><p className="mt-1 text-sm text-muted-foreground">{p.client}</p></div><Actions admin={admin} voir={() => voir(p.id)} modifier={() => modifier(p.id)} supprimer={() => supprimer(p.id)} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info icone={MapPin} label="Localisation" valeur={p.localisation || "Non définie"} /><Info icone={ClipboardList} label="Budget estimé" valeur={devise(p.budget_estime)} /></div></article>)}</div>; }
function ListeEmployes({ employes, chantiers, admin, showSalary, voir, modifier, supprimer }: any) { return <div className="grid gap-4 xl:grid-cols-2">{employes.map((e: Employe) => <article key={e.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex justify-between gap-4"><div className="flex items-start gap-3">{e.photo_profil ? <img src={e.photo_profil} alt={`Photo de ${e.nom_complet}`} className="h-14 w-14 rounded-2xl object-cover" loading="lazy" /> : <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><UserRound className="size-6 text-muted-foreground" /></span>}<div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{e.role === "chef_chantier" ? "Chef de chantier" : "Employé"}</span><h3 className="mt-3 text-xl font-black">{e.nom_complet}</h3><p className="mt-1 text-sm text-muted-foreground">{e.poste} • {e.matricule}</p></div></div><Actions admin={admin} voir={() => voir(e.id)} modifier={() => modifier(e.id)} supprimer={() => supprimer(e.id)} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info icone={UserRound} label="Téléphone" valeur={e.telephone || "Non défini"} />{showSalary && <Info icone={ClipboardList} label="Salaire restant" valeur={devise(e.salaire_restant ?? 0)} />}<Info icone={HardHat} label="Chantier" valeur={nomChantier(chantiers, e.chantier_assigne)} /><Info icone={MapPin} label="Adresse" valeur={e.adresse || "Non définie"} /></div></article>)}</div>; }
function ListeChantiers({ chantiers, projets, employes, admin, viewerRole, viewerId, voir, modifier, supprimer }: any) { return <div className="grid gap-4 xl:grid-cols-2">{chantiers.map((c: Chantier) => { const canSeeBudget = admin || (viewerRole === "chef_chantier" && c.chef_chantier === viewerId && c.autoriser_budget_chef); return <article key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex justify-between gap-4"><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{c.statut}</span><h3 className="mt-3 text-xl font-black">{c.nom_chantier}</h3><p className="mt-1 text-sm text-muted-foreground">{c.localisation}</p></div><Actions admin={admin} voir={() => voir(c.id)} modifier={() => modifier(c.id)} supprimer={() => supprimer(c.id)} /></div>{(c.images_chantier || []).length > 0 && <img src={(c.images_chantier || [])[0]} alt={`Image du chantier ${c.nom_chantier}`} className="mt-4 h-40 w-full rounded-2xl object-cover" loading="lazy" />}<div className="mt-4 grid gap-3 sm:grid-cols-2"><Info icone={BriefcaseBusiness} label="Projet lié" valeur={nomProjet(projets, c.projet_lie)} /><Info icone={HardHat} label="Chef" valeur={nomEmploye(employes, c.chef_chantier)} />{canSeeBudget ? <Info icone={Eye} label="Budget global" valeur={devise(c.budget_global || 0)} /> : <Info icone={EyeOff} label="Budget global" valeur="Masqué" />}<Info icone={UsersRound} label="Employés" valeur={String((c.employes_assignes || []).length)} /></div></article>; })}</div>; }
function PresencesSection(props: any) { return <div className="space-y-5">{props.chef && <form onSubmit={props.submit} className="rounded-2xl border border-border bg-card p-5 shadow-document"><h3 className="text-xl font-black">Nouvelle présence quotidienne</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><Champ label="Date"><input type="date" className="form-control" value={props.presenceDate} onChange={(e) => props.setPresenceDate(e.target.value)} /></Champ><Champ label="Chantier"><Select value={props.presenceChantier} onChange={props.setPresenceChantier}>{props.chantiersVisibles.map((c: Chantier) => <option key={c.id} value={c.id}>{c.nom_chantier}</option>)}</Select></Champ></div><div className="mt-4 space-y-3">{props.employesPresence.map((e: Employe) => <div key={e.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"><p className="font-bold">{e.nom_complet}</p><Select value={props.presenceStatuts[e.id] || "présent"} onChange={(v: StatutPresence) => props.setPresenceStatuts({ ...props.presenceStatuts, [e.id]: v })}>{statutsPresence.map((s) => <option key={s} value={s}>{s}</option>)}</Select></div>)}</div><Champ label="Notes"><textarea className="form-control mt-4 min-h-24" value={props.presenceNotes} onChange={(e) => props.setPresenceNotes(e.target.value)} /></Champ><button className="primary-action mt-4" disabled={props.saving}><ClipboardCheck className="size-4" /> Enregistrer la présence</button></form>}<div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-document md:grid-cols-4"><input type="date" className="form-control" value={props.filtreDate} onChange={(e) => props.setFiltreDate(e.target.value)} /><Select value={props.filtreChantier} onChange={props.setFiltreChantier}><option value="">Tous les chantiers</option>{props.chantiers.map((c: Chantier) => <option key={c.id} value={c.id}>{c.nom_chantier}</option>)}</Select><Select value={props.filtreEmploye} onChange={props.setFiltreEmploye}><option value="">Tous les employés</option>{props.employes.map((e: Employe) => <option key={e.id} value={e.id}>{e.nom_complet}</option>)}</Select><Select value={props.filtreChef} onChange={props.setFiltreChef}><option value="">Tous les chefs</option>{props.chefs.map((e: Employe) => <option key={e.id} value={e.id}>{e.nom_complet}</option>)}</Select></div><div className="grid gap-4 xl:grid-cols-2">{props.presences.map((p: Presence) => <article key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-black">{dateFr(p.date)}</h3><p className="text-sm text-muted-foreground">{nomChantier(props.chantiers, p.chantier_id)} • {nomEmploye(props.employes, p.chef_chantier_id)}</p></div><button className="mini-button" onClick={() => props.voir(p.id)}>Voir</button></div><p className="mt-3 text-sm font-bold">{p.employes_presence.length} employé(s)</p></article>)}</div></div>; }
function FormProjet({ form, setForm, onSubmit, saving }: any) { return <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><Champ label="Nom du projet"><input className="form-control" value={form.nom_projet} onChange={(e) => setForm({ ...form, nom_projet: e.target.value })} /></Champ><Champ label="Client"><input className="form-control" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} /></Champ><Champ label="Localisation"><input className="form-control" value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} /></Champ><Champ label="Budget estimé"><input type="number" className="form-control" value={form.budget_estime} onChange={(e) => setForm({ ...form, budget_estime: e.target.value })} /></Champ><Champ label="Statut"><Select value={form.statut} onChange={(v: string) => setForm({ ...form, statut: v })}>{statutsProjet.map((s) => <option key={s}>{s}</option>)}</Select></Champ><Champ label="Date début"><input type="date" className="form-control" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} /></Champ><Champ label="Date fin prévue"><input type="date" className="form-control" value={form.date_fin_prevue} onChange={(e) => setForm({ ...form, date_fin_prevue: e.target.value })} /></Champ><Champ label="Description"><textarea className="form-control min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Champ><button className="primary-action sm:col-span-2" disabled={saving}>Enregistrer</button></form>; }
function FormEmploye({ form, setForm, chantiers, onSubmit, saving, televerserPhoto, retirerPhoto }: any) { return <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-background p-4 sm:col-span-2"><p className="mb-3 text-sm font-black text-foreground">Photo de profil</p><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-muted">{form.photo_profil ? <img src={form.photo_profil} alt="Photo de profil employé" className="h-full w-full object-cover" /> : <UserRound className="size-10 text-muted-foreground" />}</div><div className="flex-1 space-y-2"><input type="file" accept="image/*" className="file-input" onChange={(e) => televerserPhoto(e.target.files)} />{form.photo_profil && <button type="button" className="mini-button" onClick={retirerPhoto}>Retirer la photo</button>}</div></div></div><Champ label="Nom complet"><input className="form-control" value={form.nom_complet} onChange={(e) => setForm({ ...form, nom_complet: e.target.value })} /></Champ><Champ label="Matricule unique"><input className="form-control" value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} /></Champ><Champ label="Poste"><input className="form-control" value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} /></Champ><Champ label="Téléphone"><input className="form-control" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></Champ><Champ label="Salaire total"><input type="number" className="form-control" value={form.salaire_total} onChange={(e) => setForm({ ...form, salaire_total: e.target.value })} /></Champ><Champ label="Salaire reçu"><input type="number" className="form-control" value={form.salaire_recu} onChange={(e) => setForm({ ...form, salaire_recu: e.target.value })} /></Champ><Champ label="Rôle"><Select value={form.role} onChange={(v: string) => setForm({ ...form, role: v })}><option value="employe">Employé</option><option value="chef_chantier">Chef de chantier</option></Select></Champ><Champ label="Statut"><Select value={form.statut} onChange={(v: string) => setForm({ ...form, statut: v })}>{statutsEmploye.map((s) => <option key={s}>{s}</option>)}</Select></Champ><Champ label="Chantier assigné"><Select value={form.chantier_assigne || ""} onChange={(v: string) => setForm({ ...form, chantier_assigne: v })}><option value="">Aucun</option>{chantiers.map((c: Chantier) => <option key={c.id} value={c.id}>{c.nom_chantier}</option>)}</Select></Champ><Champ label="Adresse"><input className="form-control" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></Champ><label className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={!!form.peut_voir_budget} onChange={(e) => setForm({ ...form, peut_voir_budget: e.target.checked })} /> Autoriser cet employé à voir les budgets si nécessaire</label><button className="primary-action sm:col-span-2" disabled={saving}>Enregistrer</button></form>; }
function FormChantier({ form, setForm, projets, employes, onSubmit, saving, televerserImages, retirerImage }: any) { const chefs = employes.filter((e: Employe) => e.role === "chef_chantier"); return <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><Champ label="Nom du chantier"><input className="form-control" value={form.nom_chantier} onChange={(e) => setForm({ ...form, nom_chantier: e.target.value })} /></Champ><Champ label="Localisation"><input className="form-control" value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} /></Champ><Champ label="Projet lié"><Select value={form.projet_lie || ""} onChange={(v: string) => setForm({ ...form, projet_lie: v })}><option value="">Aucun</option>{projets.map((p: Projet) => <option key={p.id} value={p.id}>{p.nom_projet}</option>)}</Select></Champ><Champ label="Chef de chantier"><Select value={form.chef_chantier || ""} onChange={(v: string) => setForm({ ...form, chef_chantier: v })}><option value="">Aucun</option>{chefs.map((e: Employe) => <option key={e.id} value={e.id}>{e.nom_complet}</option>)}</Select></Champ><Champ label="Budget global"><input type="number" className="form-control" value={form.budget_global} onChange={(e) => setForm({ ...form, budget_global: e.target.value })} /></Champ><Champ label="Statut"><Select value={form.statut} onChange={(v: string) => setForm({ ...form, statut: v })}>{statutsChantier.map((s) => <option key={s}>{s}</option>)}</Select></Champ><Champ label="Date début"><input type="date" className="form-control" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} /></Champ><Champ label="Date fin prévue"><input type="date" className="form-control" value={form.date_fin_prevue} onChange={(e) => setForm({ ...form, date_fin_prevue: e.target.value })} /></Champ><div className="sm:col-span-2"><p className="mb-2 text-sm font-black">Employés assignés</p><div className="grid gap-2 sm:grid-cols-2">{employes.map((e: Employe) => <label key={e.id} className="flex items-center gap-2 rounded-xl border border-border bg-background p-3 text-sm font-bold"><input type="checkbox" checked={(form.employes_assignes || []).includes(e.id)} onChange={(ev) => setForm({ ...form, employes_assignes: ev.target.checked ? [...(form.employes_assignes || []), e.id] : (form.employes_assignes || []).filter((id: string) => id !== e.id) })} /> {e.nom_complet}</label>)}</div></div><label className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={!!form.autoriser_budget_chef} onChange={(e) => setForm({ ...form, autoriser_budget_chef: e.target.checked })} /> Autoriser le chef de chantier à voir le budget global</label><Champ label="Images chantier"><input type="file" multiple accept="image/*" className="file-input" onChange={(e) => televerserImages(e.target.files)} /></Champ><div className="grid gap-2 sm:grid-cols-2">{(form.images_chantier || []).map((url: string) => <div key={url} className="relative"><img src={url} alt="Image chantier" className="h-28 w-full rounded-xl object-cover" /><button type="button" className="tool-action danger absolute right-2 top-2" onClick={() => retirerImage(url)}><Trash2 className="size-4" /></button></div>)}</div><Champ label="Description"><textarea className="form-control min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Champ><button className="primary-action sm:col-span-2" disabled={saving}><Upload className="size-4" /> Enregistrer</button></form>; }
function Details({ detail, projets, employes, chantiers, presences, admin, role, viewerId, modifier, supprimer }: any) { const item = detail.type === "projets" ? projets.find((x: Projet) => x.id === detail.id) : detail.type === "employes" ? employes.find((x: Employe) => x.id === detail.id) : detail.type === "chantiers" ? chantiers.find((x: Chantier) => x.id === detail.id) : presences.find((x: Presence) => x.id === detail.id); if (!item) return <p>Donnée introuvable.</p>; const canEdit = admin && detail.type !== "presences"; if (detail.type === "presences") { const p = item as Presence; return <div className="space-y-4"><Info icone={CalendarDays} label="Date" valeur={dateFr(p.date)} /><Info icone={HardHat} label="Chantier" valeur={nomChantier(chantiers, p.chantier_id)} /><Info icone={UserRound} label="Chef" valeur={nomEmploye(employes, p.chef_chantier_id)} /><div className="space-y-2">{p.employes_presence.map((e) => <div key={e.employe_id} className="rounded-xl border border-border bg-background p-3 font-bold">{e.nom_complet} — {e.statut}</div>)}</div><p className="rounded-xl bg-muted p-4 text-sm">{p.notes || "Aucune note."}</p></div>; } if (detail.type === "chantiers") { const c = item as Chantier; const canSeeBudget = admin || (role === "chef_chantier" && c.chef_chantier === viewerId && c.autoriser_budget_chef); return <div className="space-y-4"><h3 className="text-2xl font-black">{c.nom_chantier}</h3><div className="grid gap-3 sm:grid-cols-2"><Info icone={MapPin} label="Localisation" valeur={c.localisation || "Non définie"} /><Info icone={HardHat} label="Chef" valeur={nomEmploye(employes, c.chef_chantier)} /><Info icone={BriefcaseBusiness} label="Projet" valeur={nomProjet(projets, c.projet_lie)} /><Info icone={canSeeBudget ? Eye : EyeOff} label="Budget global" valeur={canSeeBudget ? devise(c.budget_global || 0) : "Masqué"} /></div><p className="rounded-xl bg-muted p-4 text-sm">{c.description || "Aucune description."}</p><div className="grid gap-3 sm:grid-cols-2">{(c.images_chantier || []).map((url) => <img key={url} src={url} alt={`Image du chantier ${c.nom_chantier}`} className="h-48 w-full rounded-2xl object-cover" loading="lazy" />)}</div>{canEdit && <div className="flex gap-2"><button className="mini-button" onClick={modifier}>Modifier</button><button className="tool-action danger" onClick={supprimer}><Trash2 className="size-4" /></button></div>}</div>; } return <div className="space-y-4"><h3 className="text-2xl font-black">{(item as any).nom_projet || (item as any).nom_complet}</h3><pre className="overflow-auto rounded-xl bg-muted p-4 text-xs">{JSON.stringify(item, null, 2)}</pre>{canEdit && <div className="flex gap-2"><button className="mini-button" onClick={modifier}>Modifier</button><button className="tool-action danger" onClick={supprimer}><Trash2 className="size-4" /></button></div>}</div>; }
function nomProjet(projets: Projet[], id?: string | null) { return projets.find((p) => p.id === id)?.nom_projet || "Non lié"; }
function nomChantier(chantiers: Chantier[], id?: string | null) { return chantiers.find((c) => c.id === id)?.nom_chantier || "Non assigné"; }
function nomEmploye(employes: Employe[], id?: string | null) { return employes.find((e) => e.id === id)?.nom_complet || "Non défini"; }
