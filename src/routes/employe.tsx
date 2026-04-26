import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  AlertTriangle,
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
  FilePlus2,
  HeartPulse,
  Megaphone,
  HardHat,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Network,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  Warehouse,
  X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
type Onglet = "dashboard" | "projets" | "employes" | "chantiers" | "presences" | "annonces" | "calendrier" | "organigramme" | "demande_conge" | "bilan_sante" | "gestion_materiel" | "arrivage_materiel" | "incident_chantier" | "paiement";
type StatutPresence = "présent" | "absent" | "en retard" | "excusé";
type ModeEdition = { type: "projets" | "employes" | "chantiers"; id?: string } | null;
type Detail = { type: "projets" | "employes" | "chantiers" | "presences" | "annonces"; id: string } | null;

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
  genre?: string;
  date_admission?: string | null;
  date_naissance?: string | null;
  email?: string;
  numero_piece_identite?: string;
  contact_urgence?: string;
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

type Annonce = {
  id: string;
  titre: string;
  contenu: string;
  image_url: string;
  publiee: boolean;
  auteur_admin_id: string | null;
  created_at: string;
};

type AnnonceMasquee = { id: string; annonce_id: string; employe_id: string; created_at: string };
type JourNonTravaille = { id: string; date_jour: string; titre: string; description: string; type_jour: string; actif: boolean; created_at: string; updated_at: string };
type BlocOrganigramme = { id: string; titre: string; niveau: number; couleur: "bleu" | "vert" | "orange" | "violet" | "turquoise"; parentId?: string; position?: "bas" | "cote"; image_url?: string };
type OrganigrammeEntreprise = { id: string; titre: string; description: string; blocs: BlocOrganigramme[]; actif: boolean; created_at: string; updated_at: string };
type DemandeConge = { id: string; employe_id: string; employe_nom: string; raison: string; image_url: string; statut: string; created_at: string; updated_at: string };
type BilanSanteEmploye = { id: string; employe_id: string; employe_nom: string; semaine: string; etat_global: string; groupe_sanguin: string; allergies: string; blessure: boolean; details_blessure: string; created_at: string; updated_at: string };
type LigneMateriel = { nom: string; quantite: number };
type RapportMateriel = { id: string; chef_chantier_id: string; chef_chantier_nom: string; chantier_id: string | null; chantier_nom: string; semaine: string; materiel_prevu: LigneMateriel[]; materiel_utilise: LigneMateriel[]; materiel_recupere: LigneMateriel[]; materiel_perdu: LigneMateriel[]; notes: string; statut: string; created_at: string; updated_at: string };
type ArrivageMateriel = { id: string; chef_chantier_id: string; chef_chantier_nom: string; chantier_id: string | null; chantier_nom: string; date_livraison: string; nom_materiel: string; quantite: number; entreprise_partenaire: string; prix_total: number; informations_supplementaires: string; preuve_image_url: string; statut: string; created_at: string; updated_at: string };
type IncidentChantier = { id: string; chef_chantier_id: string; chef_chantier_nom: string; chantier_id: string | null; chantier_nom: string; type_evenement: string; date_evenement: string; explication: string; images: string[]; statut: string; created_at: string; updated_at: string };

type ProjetForm = Omit<Projet, "id" | "created_at" | "budget_estime"> & { budget_estime: string };
type EmployeForm = Omit<Employe, "id" | "created_at" | "salaire" | "salaire_total" | "salaire_recu" | "salaire_restant"> & { salaire_total: string; salaire_recu: string };
type ChantierForm = Omit<Chantier, "id" | "created_at" | "budget_global" | "images_chantier"> & { budget_global: string; images_chantier: string[]; salaires_employes?: Record<string, string> };
type RecuEmployePaiement = { id: string; numero: string; employe_id: string; employe_nom: string; matricule: string; chantier_id: string | null; chantier_nom: string; montant: number; motif: string; statut: "en_attente" | "confirme" | "refuse"; date_envoi: string; date_confirmation: string | null; pdf_base64: string; created_at: string };
type AnnonceForm = Pick<Annonce, "titre" | "contenu" | "image_url" | "publiee">;

const db = supabase as any;
const SESSION_KEY = "scm-session-token";
const statutsProjet = ["Planifié", "Actif", "En pause", "Terminé"];
const statutsEmploye = ["actif", "inactif"];
const statutsChantier = ["Planifié", "Actif", "En pause", "Terminé"];
const statutsPresence: StatutPresence[] = ["présent", "absent", "en retard", "excusé"];

const projetInitial: ProjetForm = { nom_projet: "", client: "", localisation: "", description: "", budget_estime: "", statut: "Planifié", date_debut: "", date_fin_prevue: "" };
const employeInitial: EmployeForm = { nom_complet: "", poste: "", matricule: "", telephone: "", adresse: "", salaire_total: "", salaire_recu: "0", role: "employe", statut: "actif", chantier_assigne: "", peut_voir_budget: false, photo_profil: "", genre: "", date_admission: "", date_naissance: "", email: "", numero_piece_identite: "", contact_urgence: "" };
const chantierInitial: ChantierForm = { nom_chantier: "", localisation: "", chef_chantier: "", projet_lie: "", employes_assignes: [], description: "", budget_global: "", images_chantier: [], autoriser_budget_chef: false, statut: "Planifié", date_debut: "", date_fin_prevue: "", salaires_employes: {} };
const annonceInitial: AnnonceForm = { titre: "", contenu: "", image_url: "", publiee: true };
const congeInitial = { raison: "", image_url: "" };
const bilanSanteInitial = { semaine: new Date().toISOString().slice(0, 10), etat_global: "", groupe_sanguin: "", allergies: "", blessure: false, details_blessure: "" };
const materielInitial = { semaine: new Date().toISOString().slice(0, 10), chantier_id: "", materiel_prevu: [{ nom: "", quantite: 1 }], materiel_utilise: [] as LigneMateriel[], materiel_recupere: [] as LigneMateriel[], materiel_perdu: [] as LigneMateriel[], notes: "" };
const arrivageInitial = { date_livraison: new Date().toISOString().slice(0, 10), chantier_id: "", nom_materiel: "", quantite: "", entreprise_partenaire: "", prix_total: "", informations_supplementaires: "", preuve_image_url: "" };
const incidentInitial = { type_evenement: "Incident", date_evenement: new Date().toISOString().slice(0, 10), chantier_id: "", explication: "", images: [] as string[] };

function nombre(value: number) { return new Intl.NumberFormat("fr-FR").format(value || 0); }
function devise(value: number) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0); }
function dateFr(value?: string | null) { return value ? new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "Non définie"; }
function normaliserDate(value: string | null) { return value && value.length > 0 ? value : null; }
async function sha256(value: string) { const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
function sessionRoleLabel(role: RoleSession) { return role === "admin" ? "Administrateur" : role === "chef_chantier" ? "Chef de chantier" : "Employé"; }
function cheminStockageDepuisUrl(url: string, bucket: string) { try { const parsed = new URL(url); const marker = `/object/public/${bucket}/`; const index = parsed.pathname.indexOf(marker); return index >= 0 ? decodeURIComponent(parsed.pathname.slice(index + marker.length)) : ""; } catch { return ""; } }
async function supprimerFichierStockage(bucket: string, url?: string) { const path = url ? cheminStockageDepuisUrl(url, bucket) : ""; if (path) await supabase.storage.from(bucket).remove([path]); }

function EmployePage() {
  const [session, setSession] = useState<Session | null>(null);
  
  const [identifiant, setIdentifiant] = useState("");
  const [onglet, setOnglet] = useState<Onglet>("dashboard");
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [annoncesMasquees, setAnnoncesMasquees] = useState<AnnonceMasquee[]>([]);
  const [joursNonTravailles, setJoursNonTravailles] = useState<JourNonTravaille[]>([]);
  const [organigrammes, setOrganigrammes] = useState<OrganigrammeEntreprise[]>([]);
  const [demandesConges, setDemandesConges] = useState<DemandeConge[]>([]);
  const [bilansSante, setBilansSante] = useState<BilanSanteEmploye[]>([]);
  const [rapportsMateriel, setRapportsMateriel] = useState<RapportMateriel[]>([]);
  const [arrivagesMateriel, setArrivagesMateriel] = useState<ArrivageMateriel[]>([]);
  const [incidentsChantier, setIncidentsChantier] = useState<IncidentChantier[]>([]);
  const [recusEmploye, setRecusEmploye] = useState<RecuEmployePaiement[]>([]);
  const [jourPopup, setJourPopup] = useState<JourNonTravaille | null>(null);
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [message, setMessage] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreDate, setFiltreDate] = useState("");
  const [filtreChantier, setFiltreChantier] = useState("");
  const [filtreEmploye, setFiltreEmploye] = useState("");
  const [filtreChef, setFiltreChef] = useState("");
  const [edition, setEdition] = useState<ModeEdition>(null);
  const [annonceModal, setAnnonceModal] = useState<"creation" | null>(null);
  const [detail, setDetail] = useState<Detail>(null);
  const [formProjet, setFormProjet] = useState<ProjetForm>(projetInitial);
  const [formEmploye, setFormEmploye] = useState<EmployeForm>(employeInitial);
  const [formChantier, setFormChantier] = useState<ChantierForm>(chantierInitial);
  const [formAnnonce, setFormAnnonce] = useState<AnnonceForm>(annonceInitial);
  const [formConge, setFormConge] = useState(congeInitial);
  const [formBilanSante, setFormBilanSante] = useState(bilanSanteInitial);
  const [formMateriel, setFormMateriel] = useState(materielInitial);
  const [formArrivage, setFormArrivage] = useState(arrivageInitial);
  const [formIncident, setFormIncident] = useState(incidentInitial);
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

  const annoncesVisibles = useMemo(() => {
    if (isAdmin) return annonces;
    const masquees = new Set(annoncesMasquees.filter((a) => a.employe_id === session?.employeId).map((a) => a.annonce_id));
    return annonces.filter((a) => a.publiee && !masquees.has(a.id));
  }, [annonces, annoncesMasquees, isAdmin, session]);

  const joursVisibles = useMemo(() => joursNonTravailles.filter((jour) => jour.actif), [joursNonTravailles]);
  const stats = useMemo(() => ({
    totalProjets: projetsVisibles.length,
    totalEmployes: employesVisibles.length,
    totalChantiers: chantiersVisibles.length,
    projetsActifs: projetsVisibles.filter((p) => p.statut === "Actif").length,
    chantiersActifs: chantiersVisibles.filter((c) => c.statut === "Actif").length,
    presences: presencesVisibles.length,
    annonces: annoncesVisibles.length,
    jours: joursVisibles.length,
  }), [projetsVisibles, employesVisibles, chantiersVisibles, presencesVisibles, annoncesVisibles, joursVisibles]);

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
    if (!saisie) { setIdentifiant(""); setMessage("Entrez votre identifiant de connexion."); return; }
    setSauvegarde(true);
    const token = crypto.randomUUID() + crypto.randomUUID();
    const tokenHash = await sha256(token);
    let data: any = null;
    let error: any = null;
    const adminRes = await db.rpc("scm_login_admin", { _username: saisie, _token_hash: tokenHash });
    if (adminRes.data?.success) { data = adminRes.data; } else {
      const empRes = await db.rpc("scm_login_employe", { _matricule: saisie, _token_hash: tokenHash });
      data = empRes.data; error = empRes.error || adminRes.error;
    }
    setSauvegarde(false);
    if (error || !data?.success) { setIdentifiant(""); setMessage(data?.message || "Identifiant invalide."); return; }
    localStorage.setItem(SESSION_KEY, token);
    setIdentifiant("");
    setSession({ token, role: data.role, nom: data.nom, employeId: data.employeId, adminId: data.adminId });
    setOnglet("dashboard");
  }

  async function deconnecter() {
    if (session?.token) await db.rpc("scm_logout", { _token_hash: await sha256(session.token) });
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setProjets([]); setEmployes([]); setChantiers([]); setPresences([]); setAnnonces([]); setAnnoncesMasquees([]); setDemandesConges([]); setBilansSante([]); setRapportsMateriel([]); setArrivagesMateriel([]); setIncidentsChantier([]); setMessage(""); setOnglet("dashboard");
  }

  async function chargerDonnees(currentSession = session) {
    if (!currentSession) return;
    setChargement(true);
    setMessage("");
    const tokenHash = await sha256(currentSession.token);
    const [projetsRes, employesRes, chantiersRes, presencesRes, annoncesRes, masqueesRes, joursRes, orgRes, congesRes, santeRes, materielRes, arrivagesRes, incidentsRes] = await Promise.all([
      db.from("projets").select("*").order("created_at", { ascending: false }),
      currentSession.role === "admin" ? db.from("employes").select("*").order("created_at", { ascending: false }) : db.rpc("scm_visible_employes", { _token_hash: tokenHash }),
      db.from("chantiers").select("*").order("created_at", { ascending: false }),
      db.from("presences").select("*").order("date", { ascending: false }),
      db.from("annonces").select("*").order("created_at", { ascending: false }),
      db.from("annonces_masquees").select("*").order("created_at", { ascending: false }),
      db.from("jours_non_travailles").select("*").order("date_jour", { ascending: false }),
      db.from("organigrammes_entreprise").select("*").eq("actif", true).order("created_at", { ascending: false }).limit(1),
      db.from("demandes_conges").select("*").order("created_at", { ascending: false }),
      db.from("bilans_sante_employes").select("*").order("semaine", { ascending: false }),
      db.from("rapports_materiel").select("*").order("semaine", { ascending: false }),
      db.from("arrivages_materiel").select("*").order("date_livraison", { ascending: false }),
      db.from("incidents_chantier").select("*").order("date_evenement", { ascending: false }),
    ]);
    if (projetsRes.error || employesRes.error || chantiersRes.error || presencesRes.error || annoncesRes.error || masqueesRes.error || joursRes.error || orgRes.error || congesRes.error || santeRes.error || materielRes.error || arrivagesRes.error || incidentsRes.error) setMessage("Impossible de charger les données Lovable Cloud.");
    setProjets(projetsRes.data || []);
    setEmployes(employesRes.error ? [] : (employesRes.data || []));
    setChantiers(chantiersRes.data || []);
    setPresences(presencesRes.data || []);
    setAnnonces(annoncesRes.data || []);
    setAnnoncesMasquees(masqueesRes.data || []);
    setJoursNonTravailles(joursRes.data || []);
    setOrganigrammes(orgRes.data || []);
    setDemandesConges(congesRes.data || []);
    setBilansSante(santeRes.data || []);
    setRapportsMateriel(materielRes.data || []);
    setArrivagesMateriel(arrivagesRes.data || []);
    setIncidentsChantier(incidentsRes.data || []);
    // Charger les reçus employé : tous pour admin, ses propres reçus pour employé/chef
    const recusReq = currentSession.role === "admin"
      ? db.from("recus_employes").select("*").order("created_at", { ascending: false })
      : db.from("recus_employes").select("*").eq("employe_id", currentSession.employeId || "").order("created_at", { ascending: false });
    const recusRes = await recusReq;
    setRecusEmploye(recusRes.error ? [] : (recusRes.data || []));
    if (currentSession.role !== "admin") {
      const today = new Date().toISOString().slice(0, 10);
      const jour = (joursRes.data || []).find((item: JourNonTravaille) => item.actif && item.date_jour === today);
      if (jour && localStorage.getItem(`scm-jour-popup-${jour.id}`) !== today) setJourPopup(jour);
    }
    setChargement(false);
  }

  const ouvrirCreation = (type: Exclude<ModeEdition, null>["type"] | "annonces") => {
    if (!isAdmin) return;
    if (type === "annonces") { setAnnonceModal("creation"); setFormAnnonce(annonceInitial); setDetail(null); setMessage(""); return; }
    setEdition({ type }); setDetail(null); setMessage("");
    if (type === "projets") setFormProjet(projetInitial);
    if (type === "employes") setFormEmploye(employeInitial);
    if (type === "chantiers") setFormChantier(chantierInitial);
  };

  const ouvrirEdition = async (type: Exclude<ModeEdition, null>["type"], id: string) => {
    if (!isAdmin) return;
    setEdition({ type, id }); setDetail(null); setMessage("");
    if (type === "projets") { const item = projets.find((p) => p.id === id); if (item) setFormProjet({ ...item, budget_estime: String(item.budget_estime || ""), date_debut: item.date_debut || "", date_fin_prevue: item.date_fin_prevue || "" }); }
    if (type === "employes") { const item = employes.find((e) => e.id === id); if (item) setFormEmploye({ ...item, salaire_total: String(item.salaire_total ?? item.salaire ?? ""), salaire_recu: String(item.salaire_recu || 0), chantier_assigne: item.chantier_assigne || "", role: item.role || "employe", peut_voir_budget: !!item.peut_voir_budget, photo_profil: item.photo_profil || "", genre: item.genre || "", date_admission: item.date_admission || "", date_naissance: item.date_naissance || "", email: item.email || "", numero_piece_identite: item.numero_piece_identite || "", contact_urgence: item.contact_urgence || "" }); }
    if (type === "chantiers") {
      const item = chantiers.find((c) => c.id === id);
      if (item) {
        const { data: salairesExistants } = await db.from("salaires_chantier").select("employe_id, montant").eq("chantier_id", id);
        const salairesMap: Record<string, string> = {};
        (salairesExistants || []).forEach((s: { employe_id: string; montant: number }) => { salairesMap[s.employe_id] = String(s.montant || ""); });
        setFormChantier({ ...item, projet_lie: item.projet_lie || "", chef_chantier: item.chef_chantier || "", employes_assignes: item.employes_assignes || [], budget_global: String(item.budget_global || ""), images_chantier: item.images_chantier || [], date_debut: item.date_debut || "", date_fin_prevue: item.date_fin_prevue || "", autoriser_budget_chef: !!item.autoriser_budget_chef, salaires_employes: salairesMap });
      }
    }
  };

  async function enregistrerAnnonce(event: React.FormEvent) {
    event.preventDefault();
    if (!isAdmin) return;
    if (!formAnnonce.titre.trim()) return setMessage("Le titre de l’annonce est obligatoire.");
    if (!formAnnonce.contenu.trim()) return setMessage("Le texte de l’annonce est obligatoire.");
    setSauvegarde(true);
    const payload = { ...formAnnonce, titre: formAnnonce.titre.trim(), contenu: formAnnonce.contenu.trim(), auteur_admin_id: session?.adminId || null };
    const { error } = await db.from("annonces").insert(payload);
    setSauvegarde(false);
    if (error) { setMessage(error.message || "Annonce non envoyée."); return; }
    setMessage("Annonce envoyée à tous les employés.");
    setAnnonceModal(null);
    setFormAnnonce(annonceInitial);
    await chargerDonnees();
  }

  async function televerserImageAnnonce(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setSauvegarde(true);
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    if (formAnnonce.image_url) await supprimerFichierStockage("annonce-images", formAnnonce.image_url);
    const { error } = await supabase.storage.from("annonce-images").upload(path, file, { upsert: false });
    if (error) { setMessage("Téléversement de l’image impossible."); setSauvegarde(false); return; }
    const { data } = supabase.storage.from("annonce-images").getPublicUrl(path);
    setFormAnnonce({ ...formAnnonce, image_url: data.publicUrl });
    setSauvegarde(false);
  }

  async function retirerImageAnnonce() { await supprimerFichierStockage("annonce-images", formAnnonce.image_url); setFormAnnonce({ ...formAnnonce, image_url: "" }); }

  async function masquerAnnonce(id: string) {
    if (!session?.employeId) return;
    const { error } = await db.from("annonces_masquees").insert({ annonce_id: id, employe_id: session.employeId });
    if (error) setMessage(error.message || "Annonce non retirée du tableau de bord."); else await chargerDonnees();
  }

  async function supprimerAnnonce(id: string) {
    if (!isAdmin) return;
    if (!confirm("Voulez-vous vraiment supprimer cette annonce pour tout le monde ?")) return;
    await supprimerFichierStockage("annonce-images", annonces.find((a) => a.id === id)?.image_url);
    const { error } = await db.from("annonces").delete().eq("id", id);
    if (error) setMessage(error.message || "Suppression impossible."); else { setMessage("Annonce supprimée."); setDetail(null); await chargerDonnees(); }
  }

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
    if (formEmploye.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmploye.email.trim())) return setMessage("Adresse email invalide.");
    const total = Number(formEmploye.salaire_total) || 0;
    const recu = Number(formEmploye.salaire_recu) || 0;
    const matriculeNettoye = formEmploye.matricule.trim();
    setSauvegarde(true);
    // Vérification préalable de l'unicité du matricule
    const { data: doublon } = await db.from("employes").select("id, nom_complet").eq("matricule", matriculeNettoye).maybeSingle();
    if (doublon && doublon.id !== edition?.id) {
      setSauvegarde(false);
      return setMessage(`Ce matricule « ${matriculeNettoye} » est déjà attribué à ${doublon.nom_complet || "un autre employé"}. Choisissez un matricule unique.`);
    }
    const payload = { ...formEmploye, nom_complet: formEmploye.nom_complet.trim(), matricule: matriculeNettoye, poste: formEmploye.poste.trim(), telephone: formEmploye.telephone.trim(), adresse: formEmploye.adresse.trim(), email: (formEmploye.email || "").trim(), numero_piece_identite: (formEmploye.numero_piece_identite || "").trim(), contact_urgence: (formEmploye.contact_urgence || "").trim(), salaire: total, salaire_total: total, salaire_recu: recu, salaire_restant: Math.max(total - recu, 0), chantier_assigne: formEmploye.chantier_assigne || null, date_admission: normaliserDate(formEmploye.date_admission || null), date_naissance: normaliserDate(formEmploye.date_naissance || null) };
    const { error } = edition?.id ? await db.from("employes").update(payload).eq("id", edition.id) : await db.from("employes").insert(payload);
    if (error && (error as { code?: string }).code === "23505") {
      setSauvegarde(false);
      return setMessage(`Ce matricule « ${matriculeNettoye} » est déjà utilisé par un autre employé. Veuillez en choisir un autre.`);
    }
    await finaliserSauvegarde(error, "Employé enregistré.");
  }

  async function enregistrerChantier(event: React.FormEvent) {
    event.preventDefault(); if (!formChantier.nom_chantier.trim()) return setMessage("Le nom du chantier est obligatoire.");
    setSauvegarde(true);
    const { salaires_employes, ...formSansSalaires } = formChantier;
    const payload = { ...formSansSalaires, projet_lie: formChantier.projet_lie || null, chef_chantier: formChantier.chef_chantier || "", budget_global: Number(formChantier.budget_global) || 0, date_debut: normaliserDate(formChantier.date_debut), date_fin_prevue: normaliserDate(formChantier.date_fin_prevue) };
    const { data: chantierSauvegarde, error } = edition?.id
      ? await db.from("chantiers").update(payload).eq("id", edition.id).select().single()
      : await db.from("chantiers").insert(payload).select().single();
    if (error || !chantierSauvegarde) { setSauvegarde(false); setMessage(error?.message || "Erreur lors de l’enregistrement du chantier."); return; }

    const chantierId = chantierSauvegarde.id;
    // Persister les salaires par employé pour ce chantier (uniquement employés affectés)
    const lignesSalaires = (formChantier.employes_assignes || [])
      .map((employeId) => ({ employe_id: employeId, montant: Number(salaires_employes?.[employeId] || 0) }))
      .filter((l) => Number.isFinite(l.montant));
    await db.from("salaires_chantier").delete().eq("chantier_id", chantierId);
    if (lignesSalaires.length) {
      await db.from("salaires_chantier").insert(lignesSalaires.map((l) => ({ chantier_id: chantierId, employe_id: l.employe_id, montant: l.montant })));
    }

    // Recalculer salaire_total et salaire_restant pour chaque employé impacté (anciens + nouveaux)
    const ancienChantier = chantiers.find((c) => c.id === chantierId);
    const idsImpactes = new Set<string>([...(ancienChantier?.employes_assignes || []), ...(formChantier.employes_assignes || [])]);
    for (const employeId of idsImpactes) {
      const { data: toutesLignes } = await db.from("salaires_chantier").select("montant").eq("employe_id", employeId);
      const totalCumule = (toutesLignes || []).reduce((sum: number, l: { montant: number }) => sum + Number(l.montant || 0), 0);
      const emp = employes.find((e) => e.id === employeId);
      const recu = Number(emp?.salaire_recu || 0);
      await db.from("employes").update({ salaire: totalCumule, salaire_total: totalCumule, salaire_restant: Math.max(totalCumule - recu, 0) }).eq("id", employeId);
    }

    // Synchroniser chantier_assigne sur la fiche employé pour cohérence
    const nouveauxIds = formChantier.employes_assignes || [];
    if (nouveauxIds.length) {
      await db.from("employes").update({ chantier_assigne: chantierId }).in("id", nouveauxIds);
    }
    const retires = (ancienChantier?.employes_assignes || []).filter((id) => !nouveauxIds.includes(id));
    if (retires.length) {
      // Ne nettoyer que ceux qui pointaient vers ce chantier
      const aNettoyer = retires.filter((id) => employes.find((e) => e.id === id)?.chantier_assigne === chantierId);
      if (aNettoyer.length) {
        await db.from("employes").update({ chantier_assigne: null }).in("id", aNettoyer);
      }
    }

    await finaliserSauvegarde(null, "Chantier enregistré.");
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
    if (type === "employes") await supprimerFichierStockage("employe-photos", employes.find((e) => e.id === id)?.photo_profil);
    if (type === "chantiers") await Promise.all((chantiers.find((c) => c.id === id)?.images_chantier || []).map((url) => supprimerFichierStockage("chantier-images", url)));
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

  async function retirerImage(url: string) { await supprimerFichierStockage("chantier-images", url); setFormChantier({ ...formChantier, images_chantier: formChantier.images_chantier.filter((img) => img !== url) }); }

  async function televerserPhotoEmploye(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setSauvegarde(true);
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    if (formEmploye.photo_profil) await supprimerFichierStockage("employe-photos", formEmploye.photo_profil);
    const { error } = await supabase.storage.from("employe-photos").upload(path, file, { upsert: false });
    if (error) { setMessage("Téléversement de la photo impossible."); setSauvegarde(false); return; }
    const { data } = supabase.storage.from("employe-photos").getPublicUrl(path);
    setFormEmploye({ ...formEmploye, photo_profil: data.publicUrl });
    setSauvegarde(false);
  }

  async function retirerPhotoEmploye() { await supprimerFichierStockage("employe-photos", formEmploye.photo_profil); setFormEmploye({ ...formEmploye, photo_profil: "" }); }

  async function televerserMaPhotoProfil(files: FileList | null) {
    const file = files?.[0];
    if (!file || !session?.token || !employeConnecte) return;
    setSauvegarde(true);
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("employe-photos").upload(path, file, { upsert: false });
    if (error) { setMessage("Téléversement de la photo impossible."); setSauvegarde(false); return; }
    const photoUrl = supabase.storage.from("employe-photos").getPublicUrl(path).data.publicUrl;
    const { data, error: updateError } = await db.rpc("scm_update_own_profile_photo", { _token_hash: await sha256(session.token), _photo_profil: photoUrl });
    if (updateError) { await supprimerFichierStockage("employe-photos", photoUrl); setMessage(updateError.message || "Photo non enregistrée."); setSauvegarde(false); return; }
    await supprimerFichierStockage("employe-photos", employeConnecte.photo_profil);
    setEmployes((liste) => liste.map((employe) => employe.id === data.id ? data : employe));
    setMessage("Photo de profil mise à jour.");
    setSauvegarde(false);
  }

  async function retirerMaPhotoProfil() {
    if (!session?.token || !employeConnecte) return;
    setSauvegarde(true);
    const anciennePhoto = employeConnecte.photo_profil;
    const { data, error } = await db.rpc("scm_update_own_profile_photo", { _token_hash: await sha256(session.token), _photo_profil: "" });
    if (error) { setMessage(error.message || "Photo non retirée."); setSauvegarde(false); return; }
    await supprimerFichierStockage("employe-photos", anciennePhoto);
    setEmployes((liste) => liste.map((employe) => employe.id === data.id ? data : employe));
    setMessage("Photo de profil retirée.");
    setSauvegarde(false);
  }

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

  async function televerserImageConge(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setSauvegarde(true);
    const path = `demandes-conges/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("scm-images").upload(path, file, { upsert: false });
    if (error) { setMessage("Téléversement de l’image impossible."); setSauvegarde(false); return; }
    const { data } = supabase.storage.from("scm-images").getPublicUrl(path);
    setFormConge({ ...formConge, image_url: data.publicUrl });
    setSauvegarde(false);
  }

  async function envoyerDemandeConge(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.employeId || !employeConnecte) return setMessage("Employé introuvable.");
    if (!formConge.raison.trim()) return setMessage("La raison de la demande est obligatoire.");
    setSauvegarde(true);
    const { error } = await db.from("demandes_conges").insert({ employe_id: session.employeId, employe_nom: employeConnecte.nom_complet, raison: formConge.raison.trim(), image_url: formConge.image_url, statut: "En attente" });
    setSauvegarde(false);
    if (error) setMessage(error.message || "Demande non envoyée."); else { setMessage("Demande de congé envoyée à l’admin."); setFormConge(congeInitial); await chargerDonnees(); }
  }

  async function envoyerBilanSante(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.employeId || !employeConnecte) return setMessage("Employé introuvable.");
    if (!formBilanSante.etat_global.trim()) return setMessage("L’état de santé global est obligatoire.");
    if (!formBilanSante.groupe_sanguin.trim()) return setMessage("Le groupe sanguin est obligatoire.");
    setSauvegarde(true);
    const payload = { ...formBilanSante, employe_id: session.employeId, employe_nom: employeConnecte.nom_complet, etat_global: formBilanSante.etat_global.trim(), groupe_sanguin: formBilanSante.groupe_sanguin.trim(), allergies: formBilanSante.allergies.trim(), details_blessure: formBilanSante.details_blessure.trim() };
    const { error } = await db.from("bilans_sante_employes").insert(payload);
    setSauvegarde(false);
    if (error) setMessage(error.message || "Bilan non envoyé."); else { setMessage("Bilan de santé hebdomadaire envoyé."); setFormBilanSante({ ...bilanSanteInitial, semaine: new Date().toISOString().slice(0, 10) }); await chargerDonnees(); }
  }

  async function envoyerRapportMateriel(event: React.FormEvent) {
    event.preventDefault();
    if (!isChef || !session?.employeId || !employeConnecte) return setMessage("Seul le chef de chantier peut envoyer un rapport matériel.");
    const chantier = chantiersVisibles.find((c) => c.id === formMateriel.chantier_id) || chantiersVisibles[0];
    if (!chantier) return setMessage("Aucun chantier disponible pour ce rapport.");
    const materiel_prevu = formMateriel.materiel_prevu.filter((m) => m.nom.trim()).map((m) => ({ nom: m.nom.trim(), quantite: Number(m.quantite) || 1 }));
    const materiel_utilise = formMateriel.materiel_utilise.filter((m) => m.nom.trim()).map((m) => ({ nom: m.nom.trim(), quantite: Number(m.quantite) || 1 }));
    const materiel_recupere = formMateriel.materiel_recupere.filter((m) => m.nom.trim()).map((m) => ({ nom: m.nom.trim(), quantite: Number(m.quantite) || 1 }));
    const materiel_perdu = formMateriel.materiel_perdu.filter((m) => m.nom.trim()).map((m) => ({ nom: m.nom.trim(), quantite: Number(m.quantite) || 1 }));
    if (!materiel_prevu.length) return setMessage("Ajoutez au moins un matériel prévu pour la semaine.");
    setSauvegarde(true);
    const { error } = await db.from("rapports_materiel").insert({ chef_chantier_id: session.employeId, chef_chantier_nom: employeConnecte.nom_complet, chantier_id: chantier.id, chantier_nom: chantier.nom_chantier, semaine: formMateriel.semaine, materiel_prevu, materiel_utilise, materiel_recupere, materiel_perdu, notes: formMateriel.notes.trim(), statut: "Rapport envoyé" });
    setSauvegarde(false);
    if (error) setMessage(error.message || "Rapport matériel non envoyé."); else { setMessage("Rapport matériel envoyé à l’admin."); setFormMateriel({ ...materielInitial, semaine: new Date().toISOString().slice(0, 10) }); await chargerDonnees(); }
  }

  async function televerserPreuveArrivage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setSauvegarde(true);
    const path = `arrivages-materiel/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("scm-images").upload(path, file, { upsert: false });
    if (error) { setMessage("Téléversement de la preuve impossible."); setSauvegarde(false); return; }
    setFormArrivage({ ...formArrivage, preuve_image_url: supabase.storage.from("scm-images").getPublicUrl(path).data.publicUrl });
    setSauvegarde(false);
  }

  async function envoyerArrivageMateriel(event: React.FormEvent) {
    event.preventDefault();
    if (!isChef || !session?.employeId || !employeConnecte) return setMessage("Seul le chef de chantier peut envoyer un rapport d’arrivage.");
    const chantier = chantiersVisibles.find((c) => c.id === formArrivage.chantier_id) || chantiersVisibles[0];
    if (!chantier) return setMessage("Aucun chantier disponible pour ce rapport.");
    if (!formArrivage.nom_materiel.trim()) return setMessage("Le nom du matériel livré est obligatoire.");
    setSauvegarde(true);
    const { error } = await db.from("arrivages_materiel").insert({ chef_chantier_id: session.employeId, chef_chantier_nom: employeConnecte.nom_complet, chantier_id: chantier.id, chantier_nom: chantier.nom_chantier, date_livraison: formArrivage.date_livraison, nom_materiel: formArrivage.nom_materiel.trim(), quantite: Number(formArrivage.quantite) || 0, entreprise_partenaire: formArrivage.entreprise_partenaire.trim(), prix_total: Number(formArrivage.prix_total) || 0, informations_supplementaires: formArrivage.informations_supplementaires.trim(), preuve_image_url: formArrivage.preuve_image_url, statut: "Rapport envoyé" });
    setSauvegarde(false);
    if (error) setMessage(error.message || "Rapport d’arrivage non envoyé."); else { setMessage("Rapport d’arrivage envoyé à l’admin."); setFormArrivage({ ...arrivageInitial, date_livraison: new Date().toISOString().slice(0, 10) }); await chargerDonnees(); }
  }

  async function televerserImagesIncident(files: FileList | null) {
    if (!files?.length) return;
    setSauvegarde(true);
    const images = [...formIncident.images];
    for (const file of [...files]) {
      const path = `incidents-chantiers/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error } = await supabase.storage.from("scm-images").upload(path, file, { upsert: false });
      if (error) { setMessage("Téléversement des images impossible."); setSauvegarde(false); return; }
      images.push(supabase.storage.from("scm-images").getPublicUrl(path).data.publicUrl);
    }
    setFormIncident({ ...formIncident, images });
    setSauvegarde(false);
  }

  async function envoyerIncidentChantier(event: React.FormEvent) {
    event.preventDefault();
    if (!isChef || !session?.employeId || !employeConnecte) return setMessage("Seul le chef de chantier peut envoyer une alerte.");
    const chantier = chantiersVisibles.find((c) => c.id === formIncident.chantier_id) || chantiersVisibles[0];
    if (!chantier) return setMessage("Aucun chantier disponible pour cette alerte.");
    if (!formIncident.explication.trim()) return setMessage("L’explication détaillée est obligatoire.");
    setSauvegarde(true);
    const { error } = await db.from("incidents_chantier").insert({ chef_chantier_id: session.employeId, chef_chantier_nom: employeConnecte.nom_complet, chantier_id: chantier.id, chantier_nom: chantier.nom_chantier, type_evenement: formIncident.type_evenement, date_evenement: formIncident.date_evenement, explication: formIncident.explication.trim(), images: formIncident.images, statut: "Alerte envoyée" });
    setSauvegarde(false);
    if (error) setMessage(error.message || "Alerte non envoyée."); else { setMessage("Alerte incident/accident envoyée à l’admin."); setFormIncident({ ...incidentInitial, date_evenement: new Date().toISOString().slice(0, 10) }); await chargerDonnees(); }
  }

  function changerOnglet(tab: Onglet) { setOnglet(tab); setRecherche(""); setMenuOuvert(false); }

  async function confirmerRecuPaiement(recuId: string) {
    if (!session?.employeId) return;
    if (!confirm("Confirmer la réception de ce paiement ? Le montant sera déduit de votre salaire restant.")) return;
    setSauvegarde(true);
    const { data, error } = await db.rpc("confirmer_recu_employe", { _recu_id: recuId, _employe_id: session.employeId });
    setSauvegarde(false);
    if (error || !data?.success) { setMessage(data?.message || error?.message || "Confirmation impossible."); return; }
    setMessage("Reçu confirmé. Salaire restant mis à jour.");
    await chargerDonnees();
  }

  function ouvrirPdfRecu(pdfBase64: string) {
    if (!pdfBase64) return alert("PDF indisponible.");
    const w = window.open();
    if (w) w.document.write(`<iframe src="${pdfBase64}" style="width:100%;height:100vh;border:0;"></iframe>`);
  }

  if (!session) return <LoginScreen identifiant={identifiant} setIdentifiant={setIdentifiant} connecter={connecter} saving={sauvegarde} message={message} chargement={chargement} />;

  const titreOnglet = onglet === "dashboard" ? "Tableau de bord" : onglet === "projets" ? "Projets" : onglet === "employes" ? "Employés" : onglet === "chantiers" ? "Chantiers" : onglet === "annonces" ? "Annonces" : onglet === "calendrier" ? "Jours fériés" : onglet === "organigramme" ? "Organigramme" : onglet === "demande_conge" ? "Demande de Congé" : onglet === "bilan_sante" ? "Bilan de santé" : onglet === "gestion_materiel" ? "Gestion de Matériel" : onglet === "arrivage_materiel" ? "Rapport arrivage de Matériel" : onglet === "incident_chantier" ? "Incident / Accident" : onglet === "paiement" ? "Paiement" : "Présences";
  const chefOptions = employes.filter((e) => e.role === "chef_chantier");
  const chantierPresence = chantiersVisibles.find((c) => c.id === presenceChantier) || chantiersVisibles[0];
  const employesPresence = chantierPresence ? employes.filter((e) => (chantierPresence.employes_assignes || []).includes(e.id)) : [];

  return (
    <main className="dashboard-shell min-h-screen text-foreground">
      <div className="flex min-h-screen">
        <aside className={`${menuOuvert ? "translate-x-0" : "-translate-x-full"} dashboard-sidebar fixed inset-y-0 left-0 z-40 w-72 border-r border-border p-5 shadow-document transition-transform lg:sticky lg:translate-x-0`}>
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">SCM SARL</p><h1 className="mt-1 text-2xl font-black">Gestion</h1><p className="mt-1 text-xs font-bold text-primary">{sessionRoleLabel(session.role)}</p></div><button className="tool-action lg:hidden" onClick={() => setMenuOuvert(false)} aria-label="Fermer"><X className="size-4" /></button></div>
          {isAdmin && <Link to="/" className="mini-button mt-6 w-full"><ArrowLeft className="size-4" /> Accès Outils</Link>}
          <nav className="mt-8 space-y-2">
            <BoutonNav actif={onglet === "dashboard"} icone={LayoutDashboard} label="Tableau de bord" onClick={() => changerOnglet("dashboard")} />
            {isAdmin && <BoutonNav actif={onglet === "projets"} icone={BriefcaseBusiness} label="Projets" onClick={() => changerOnglet("projets")} />}
            <BoutonNav actif={onglet === "employes"} icone={UsersRound} label={isAdmin ? "Employés" : "Mon profil"} onClick={() => changerOnglet("employes")} />
            <BoutonNav actif={onglet === "chantiers"} icone={HardHat} label="Chantiers" onClick={() => changerOnglet("chantiers")} />
            {(isAdmin || isChef) && <BoutonNav actif={onglet === "presences"} icone={ClipboardCheck} label="Présences" onClick={() => changerOnglet("presences")} />}
            <BoutonNav actif={onglet === "annonces"} icone={Megaphone} label="Annonces" onClick={() => changerOnglet("annonces")} />
            <BoutonNav actif={onglet === "calendrier"} icone={CalendarDays} label="Jours fériés" onClick={() => changerOnglet("calendrier")} />
            <BoutonNav actif={onglet === "organigramme"} icone={Network} label="Organigramme" onClick={() => changerOnglet("organigramme")} />
            {isChef && <BoutonNav actif={onglet === "gestion_materiel"} icone={PackageCheck} label="Gestion de Matériel" onClick={() => changerOnglet("gestion_materiel")} />}
            {isChef && <BoutonNav actif={onglet === "arrivage_materiel"} icone={Warehouse} label="Rapport arrivage" onClick={() => changerOnglet("arrivage_materiel")} />}
            {isChef && <BoutonNav actif={onglet === "incident_chantier"} icone={AlertTriangle} label="Incident / Accident" onClick={() => changerOnglet("incident_chantier")} />}
            {!isAdmin && <BoutonNav actif={onglet === "demande_conge"} icone={FilePlus2} label="Demande de Congé" onClick={() => changerOnglet("demande_conge")} />}
            {!isAdmin && <BoutonNav actif={onglet === "bilan_sante"} icone={HeartPulse} label="Bilan de santé" onClick={() => changerOnglet("bilan_sante")} />}
            {!isAdmin && <BoutonNav actif={onglet === "paiement"} icone={ClipboardList} label="Paiement" onClick={() => changerOnglet("paiement")} />}
          </nav>
          <div className="dashboard-hero mt-10 rounded-3xl p-4 shadow-tool"><Building2 className="mb-3 size-8" /><p className="text-sm font-black">{session.nom}</p><p className="mt-1 text-xs font-semibold leading-5 opacity-90">Accès filtré automatiquement selon le rôle connecté.</p><button className="mini-button mt-4 w-full bg-card/20 text-primary-foreground" onClick={deconnecter}><LogOut className="size-4" /> Déconnexion</button></div>
        </aside>
        {menuOuvert && <button className="fixed inset-0 z-30 bg-foreground/25 lg:hidden" onClick={() => setMenuOuvert(false)} aria-label="Fermer le menu" />}
        <section className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8">
          <header className="dashboard-card mb-6 flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><button className="tool-action lg:hidden" onClick={() => setMenuOuvert(true)} aria-label="Ouvrir"><Menu className="size-5" /></button><div className="tool-blue inline-flex size-12 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool"><UserRound className="size-6" /></div><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Espace entreprise</p><h2 className="text-2xl font-black sm:text-3xl">{titreOnglet}</h2></div></div>{isAdmin && ["projets", "employes", "chantiers", "annonces"].includes(onglet) && <button className="primary-action" onClick={() => ouvrirCreation(onglet as any)}><Plus className="size-4" /> Nouveau</button>}</header>
          {message && <div className="mb-5 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-document">{message}</div>}
          {chargement ? <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-border bg-card"><Loader2 className="size-8 animate-spin text-primary" /></div> : onglet === "dashboard" ? <Dashboard role={session.role} stats={stats} employe={employeConnecte} chantiers={chantiersVisibles} presences={presencesVisibles} annonces={annoncesVisibles} jours={joursVisibles} setOnglet={setOnglet} voirAnnonce={(id: string) => setDetail({ type: "annonces", id })} masquerAnnonce={masquerAnnonce} admin={isAdmin} /> : <div className="space-y-5">
            {!["organigramme", "demande_conge", "bilan_sante", "gestion_materiel", "arrivage_materiel", "incident_chantier", "paiement"].includes(onglet) && <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-document sm:flex-row sm:items-center sm:justify-between"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="form-control pl-10" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={`Rechercher dans ${titreOnglet.toLowerCase()}...`} /></div><p className="text-sm font-bold text-muted-foreground">{onglet === "projets" ? projetsFiltres.length : onglet === "employes" ? employesFiltres.length : onglet === "chantiers" ? chantiersFiltres.length : presencesFiltrees.length} résultat(s)</p></div>}
            {onglet === "projets" && <ListeProjets projets={projetsFiltres} admin={isAdmin} voir={(id: string) => setDetail({ type: "projets", id })} modifier={(id: string) => ouvrirEdition("projets", id)} supprimer={(id: string) => supprimer("projets", id)} />}
            {onglet === "employes" && <ListeEmployes employes={employesFiltres} chantiers={chantiersVisibles} admin={isAdmin} showSalary={isAdmin || (!isChef && employesFiltres.length === 1)} voir={(id: string) => setDetail({ type: "employes", id })} modifier={(id: string) => ouvrirEdition("employes", id)} supprimer={(id: string) => supprimer("employes", id)} />}
            {onglet === "chantiers" && <ListeChantiers chantiers={chantiersFiltres} projets={projets} employes={employes} admin={isAdmin} viewerRole={session.role} viewerId={session.employeId} voir={(id: string) => setDetail({ type: "chantiers", id })} modifier={(id: string) => ouvrirEdition("chantiers", id)} supprimer={(id: string) => supprimer("chantiers", id)} />}
            {onglet === "annonces" && <AnnoncesSection annonces={annoncesVisibles} admin={isAdmin} voir={(id: string) => setDetail({ type: "annonces", id })} masquer={masquerAnnonce} supprimer={supprimerAnnonce} />}
            {onglet === "calendrier" && <CalendrierEmployes jours={joursVisibles} />}
            {onglet === "organigramme" && <OrganigrammeEmployes organigramme={organigrammes[0]} />}
            {onglet === "demande_conge" && <DemandeCongeEmploye form={formConge} setForm={setFormConge} submit={envoyerDemandeConge} saving={sauvegarde} televerserImage={televerserImageConge} demandes={demandesConges.filter((d) => d.employe_id === session.employeId)} />}
            {onglet === "bilan_sante" && <BilanSanteEmployeForm form={formBilanSante} setForm={setFormBilanSante} submit={envoyerBilanSante} saving={sauvegarde} bilans={bilansSante.filter((b) => b.employe_id === session.employeId)} />}
            {onglet === "gestion_materiel" && isChef && <GestionMaterielChef form={formMateriel} setForm={setFormMateriel} submit={envoyerRapportMateriel} saving={sauvegarde} chantiers={chantiersVisibles} rapports={rapportsMateriel.filter((r) => r.chef_chantier_id === session.employeId)} />}
            {onglet === "arrivage_materiel" && isChef && <ArrivageMaterielChef form={formArrivage} setForm={setFormArrivage} submit={envoyerArrivageMateriel} saving={sauvegarde} chantiers={chantiersVisibles} arrivages={arrivagesMateriel.filter((a) => a.chef_chantier_id === session.employeId)} televerserPreuve={televerserPreuveArrivage} />}
            {onglet === "incident_chantier" && isChef && <IncidentChantierChef form={formIncident} setForm={setFormIncident} submit={envoyerIncidentChantier} saving={sauvegarde} chantiers={chantiersVisibles} incidents={incidentsChantier.filter((i) => i.chef_chantier_id === session.employeId)} televerserImages={televerserImagesIncident} />}
            {onglet === "paiement" && !isAdmin && <PaiementEmploye recus={recusEmploye} employe={employeConnecte} confirmer={confirmerRecuPaiement} ouvrirPdf={ouvrirPdfRecu} saving={sauvegarde} />}
            {onglet === "presences" && <PresencesSection admin={isAdmin} chef={isChef} presences={presencesFiltrees} chantiers={chantiers} employes={employes} chefs={chefOptions} filtreDate={filtreDate} setFiltreDate={setFiltreDate} filtreChantier={filtreChantier} setFiltreChantier={setFiltreChantier} filtreEmploye={filtreEmploye} setFiltreEmploye={setFiltreEmploye} filtreChef={filtreChef} setFiltreChef={setFiltreChef} voir={(id: string) => setDetail({ type: "presences", id })} presenceDate={presenceDate} setPresenceDate={setPresenceDate} presenceChantier={presenceChantier || chantierPresence?.id || ""} setPresenceChantier={setPresenceChantier} presenceNotes={presenceNotes} setPresenceNotes={setPresenceNotes} employesPresence={employesPresence} presenceStatuts={presenceStatuts} setPresenceStatuts={setPresenceStatuts} submit={enregistrerPresence} saving={sauvegarde} chantiersVisibles={chantiersVisibles} />}
          </div>}
        </section>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-card/95 p-2 shadow-document backdrop-blur lg:hidden"><BoutonMobile actif={onglet === "dashboard"} icone={LayoutDashboard} label="Accueil" onClick={() => changerOnglet("dashboard")} /><BoutonMobile actif={onglet === "annonces"} icone={Megaphone} label="Annonces" onClick={() => changerOnglet("annonces")} /><BoutonMobile actif={onglet === "employes"} icone={UsersRound} label="Profil" onClick={() => changerOnglet("employes")} /><BoutonMobile actif={onglet === "calendrier"} icone={CalendarDays} label="Fériés" onClick={() => changerOnglet("calendrier")} /><BoutonMobile actif={onglet === "bilan_sante"} icone={HeartPulse} label="Santé" onClick={() => changerOnglet("bilan_sante")} /></nav>
      {annonceModal && <Modal titre="Nouvelle annonce" fermer={() => setAnnonceModal(null)}><FormAnnonce form={formAnnonce} setForm={setFormAnnonce} onSubmit={enregistrerAnnonce} saving={sauvegarde} televerserImage={televerserImageAnnonce} retirerImage={retirerImageAnnonce} /></Modal>}
      {edition && <Modal titre={edition.id ? "Modifier" : "Créer"} fermer={() => setEdition(null)}>{edition.type === "projets" && <FormProjet form={formProjet} setForm={setFormProjet} onSubmit={enregistrerProjet} saving={sauvegarde} />}{edition.type === "employes" && <FormEmploye form={formEmploye} setForm={setFormEmploye} chantiers={chantiers} onSubmit={enregistrerEmploye} saving={sauvegarde} televerserPhoto={televerserPhotoEmploye} retirerPhoto={retirerPhotoEmploye} />}{edition.type === "chantiers" && <FormChantier form={formChantier} setForm={setFormChantier} projets={projets} employes={employes} onSubmit={enregistrerChantier} saving={sauvegarde} televerserImages={televerserImages} retirerImage={retirerImage} chantierId={edition.id} rechargerDonnees={chargerDonnees} setMessage={setMessage} />}</Modal>}
      {detail && <Modal titre="Détails" fermer={() => setDetail(null)}><Details detail={detail} projets={projetsVisibles} employes={employesVisibles} chantiers={chantiersVisibles} presences={presencesVisibles} annonces={annoncesVisibles} admin={isAdmin} role={session.role} viewerId={session.employeId} saving={sauvegarde} televerserPhotoProfil={televerserMaPhotoProfil} retirerPhotoProfil={retirerMaPhotoProfil} modifier={() => detail.type !== "presences" && detail.type !== "annonces" && ouvrirEdition(detail.type, detail.id)} supprimer={() => detail.type === "annonces" ? supprimerAnnonce(detail.id) : detail.type !== "presences" && supprimer(detail.type, detail.id)} /></Modal>}
      {jourPopup && <Modal titre="Jour férié / non travaillé" fermer={() => { localStorage.setItem(`scm-jour-popup-${jourPopup.id}`, new Date().toISOString().slice(0, 10)); setJourPopup(null); }}><div className="tool-holiday-calendar rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool"><CalendarDays className="mb-4 size-10" /><p className="text-sm font-black uppercase opacity-85">{dateFr(jourPopup.date_jour)}</p><h2 className="mt-2 text-3xl font-black">{jourPopup.titre}</h2><p className="mt-3 leading-7 opacity-90">{jourPopup.description || "Cette date a été déclarée jour férié ou jour non travaillé par l’administration."}</p></div></Modal>}
    </main>
  );
}

function LoginScreen({ identifiant, setIdentifiant, connecter, saving, message, chargement }: any) {
  return <main className="construction-grid flex min-h-screen items-center justify-center bg-background p-4"><section className="w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-document lg:grid lg:grid-cols-[.95fr_1.05fr]"><div className="tool-blue hidden bg-tool-gradient p-8 text-tool-foreground lg:flex lg:flex-col lg:justify-between"><div><img src={scmCompanyLogo} alt="Logo SCM SARL" className="h-28 w-28 rounded-3xl bg-card object-contain p-3 shadow-document" /><h1 className="mt-8 text-5xl font-black leading-none">SCM SARL</h1><p className="mt-4 max-w-sm text-sm font-semibold opacity-90">Espace moderne de gestion des employés, chantiers, projets et présences quotidiennes.</p></div><div className="grid grid-cols-3 gap-3 text-center text-xs font-black"><span className="rounded-2xl bg-tool-foreground/15 p-3">Admin</span><span className="rounded-2xl bg-tool-foreground/15 p-3">Employés</span><span className="rounded-2xl bg-tool-foreground/15 p-3">Chantiers</span></div></div><div className="p-6 sm:p-8"><div className="flex items-center gap-4 lg:hidden"><img src={scmCompanyLogo} alt="Logo SCM SARL" className="h-20 w-20 rounded-2xl border border-border bg-card object-contain p-2 shadow-document" /><div><h1 className="text-3xl font-black">SCM SARL</h1><p className="text-sm text-muted-foreground">Connexion entreprise</p></div></div><div className="hidden lg:block"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Connexion sécurisée</p><h2 className="mt-2 text-3xl font-black">Accéder au tableau de bord</h2></div><form className="mt-8 space-y-4" onSubmit={connecter}><Champ label="Identifiant de connexion"><input type="text" className="form-control" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} placeholder="Entrez votre identifiant" autoFocus /></Champ>{message && <p className="rounded-xl bg-muted p-3 text-sm font-bold text-foreground">{message}</p>}<button className="primary-action w-full" disabled={saving || chargement}>{saving || chargement ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Se connecter</button><a href="https://wa.me/243814644847?text=Bonjour%2C%20j%27ai%20oubli%C3%A9%20mon%20num%C3%A9ro%20matricule%20SCM%20SARL." target="_blank" rel="noopener noreferrer" className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-4 py-3 text-sm font-black text-foreground transition hover:border-primary hover:bg-muted">Numéro matricule oublié&nbsp;? Contacter sur WhatsApp</a></form></div></section></main>;
}

function filtrer<T extends Record<string, unknown>>(items: T[], recherche: string, champs: (keyof T)[]) { const q = recherche.trim().toLowerCase(); return q ? items.filter((item) => champs.some((champ) => String(item[champ] ?? "").toLowerCase().includes(q))) : items; }
function BoutonNav({ actif, icone: Icon, label, onClick }: { actif: boolean; icone: typeof LayoutDashboard; label: string; onClick: () => void }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${actif ? "bg-primary text-primary-foreground shadow-tool" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="size-5" />{label}</button>; }
function BoutonMobile({ actif, icone: Icon, label, onClick }: { actif: boolean; icone: typeof LayoutDashboard; label: string; onClick: () => void }) { return <button onClick={onClick} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-black ${actif ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Icon className="size-5" />{label}</button>; }
function CarteStat({ titre, valeur, icone: Icon, tone = "tool-blue" }: { titre: string; valeur: number | string; icone: typeof LayoutDashboard; tone?: string }) { return <article className={`${tone} dashboard-card rounded-3xl p-5`}><div className="flex items-center justify-between"><span className="flex size-14 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool"><Icon className="size-6" /></span><span className="text-2xl text-muted-foreground">•••</span></div><p className="mt-5 text-3xl font-black">{typeof valeur === "number" ? nombre(valeur) : valeur}</p><p className="mt-1 text-sm font-bold text-muted-foreground">{titre}</p></article>; }
function OrganigrammeEmployes({ organigramme }: { organigramme?: OrganigrammeEntreprise }) { const imageUrl = String(organigramme?.blocs?.[0]?.image_url || ""); return <section className="dashboard-card rounded-3xl p-4 sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="tool-organization-chart flex size-12 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool"><Network className="size-6" /></span><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">SCM SARL</p><h3 className="text-2xl font-black">{organigramme?.titre || "Organigramme de l’entreprise"}</h3></div></div>{imageUrl ? <><div className="org-chart org-image-chart"><img src={scmCompanyLogo} alt="Logo SCM SARL" className="org-logo" /><h2>ORGANIGRAMME</h2><div className="org-line" /><img src={imageUrl} alt="Organigramme SCM SARL" className="org-uploaded-image" loading="lazy" /></div><p className="mt-4 text-center text-sm font-black text-muted-foreground">{organigramme?.description}</p></> : <p className="rounded-2xl bg-muted p-5 text-sm font-bold text-muted-foreground">Aucun organigramme publié pour le moment.</p>}</section>; }
function Dashboard({ role, stats, employe, chantiers, presences, annonces, setOnglet, voirAnnonce, masquerAnnonce, admin }: any) { return <div className="space-y-6"><section className="dashboard-hero overflow-hidden rounded-3xl p-6 shadow-tool"><p className="text-sm font-black uppercase opacity-85">{role === "admin" ? "Vue direction" : "Espace personnel"}</p><h3 className="mt-2 text-3xl font-black sm:text-4xl">SCM SARL — Tableau de bord</h3><div className="mt-6 grid gap-3 sm:grid-cols-4"><div className="rounded-2xl bg-card/18 p-4"><p className="text-2xl font-black">{stats.totalChantiers}</p><p className="text-xs font-bold opacity-85">Chantiers suivis</p></div><div className="rounded-2xl bg-card/18 p-4"><p className="text-2xl font-black">{stats.chantiersActifs}</p><p className="text-xs font-bold opacity-85">Actifs</p></div><div className="rounded-2xl bg-card/18 p-4"><p className="text-2xl font-black">{stats.presences}</p><p className="text-xs font-bold opacity-85">Présences</p></div><div className="rounded-2xl bg-card/18 p-4"><p className="text-2xl font-black">{stats.annonces}</p><p className="text-xs font-bold opacity-85">Annonces</p></div></div></section><AnnoncesDashboard annonces={annonces} admin={admin} voir={voirAnnonce} masquer={masquerAnnonce} setOnglet={setOnglet} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><CarteStat tone="tool-blue" titre="Projets" valeur={stats.totalProjets} icone={BriefcaseBusiness} /><CarteStat tone="tool-purple" titre="Employés" valeur={stats.totalEmployes} icone={UsersRound} /><CarteStat tone="tool-orange" titre="Chantiers" valeur={stats.totalChantiers} icone={HardHat} /><CarteStat tone="tool-green" titre="Chantiers actifs" valeur={stats.chantiersActifs} icone={CheckCircle2} /><CarteStat tone="tool-coral" titre="Annonces" valeur={stats.annonces} icone={Megaphone} /></div>{role === "admin" && <AdminPresenceCharts presences={presences} chantiers={chantiers} />}{employe && <div className="grid gap-4 lg:grid-cols-3"><CarteStat tone="tool-teal" titre="Salaire total" valeur={devise(employe.salaire_total ?? employe.salaire)} icone={ClipboardList} /><CarteStat tone="tool-green" titre="Salaire reçu" valeur={devise(employe.salaire_recu || 0)} icone={CheckCircle2} /><CarteStat tone="tool-orange" titre="Salaire restant" valeur={devise(employe.salaire_restant ?? 0)} icone={CalendarDays} /></div>}<div className="grid gap-5 xl:grid-cols-2"><Apercu titre={role === "admin" ? "Chantiers récents" : "Mes chantiers"} action="Voir les chantiers" onClick={() => setOnglet("chantiers")} items={chantiers.slice(0, 4).map((c: Chantier) => ({ titre: c.nom_chantier, meta: `${c.localisation || "Localisation non définie"} • ${c.statut}` }))} /><Apercu titre="Présences récentes" action="Voir les présences" onClick={() => setOnglet("presences")} items={presences.slice(0, 4).map((p: Presence) => ({ titre: dateFr(p.date), meta: p.notes || "Rapport quotidien" }))} /></div></div>; }
function AdminPresenceCharts({ presences, chantiers }: { presences: Presence[]; chantiers: Chantier[] }) {
  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
  const statutData = statutsPresence.map((statut) => ({ statut, total: presences.reduce((sum, p) => sum + p.employes_presence.filter((e) => e.statut === statut).length, 0) }));
  const chantierData = chantiers.map((c) => ({ chantier: c.nom_chantier || "Chantier", total: presences.filter((p) => p.chantier_id === c.id).reduce((sum, p) => sum + p.employes_presence.length, 0) })).filter((item) => item.total > 0).slice(0, 6);
  const totalMarques = statutData.reduce((sum, item) => sum + item.total, 0);
  return <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><article className="dashboard-card rounded-3xl p-5"><div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Analyse des présences</p><h3 className="text-xl font-black">Volume par chantier</h3></div><p className="text-sm font-bold text-muted-foreground">{nombre(totalMarques)} pointage(s)</p></div><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chantierData} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="chantier" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={58} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><Tooltip cursor={{ fill: "color-mix(in oklab, var(--primary) 8%, transparent)" }} contentStyle={{ borderRadius: 16, borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)", fontWeight: 800 }} /><Bar dataKey="total" radius={[10, 10, 4, 4]}>{chantierData.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}</Bar></BarChart></ResponsiveContainer></div></article><article className="dashboard-card rounded-3xl p-5"><div className="mb-4"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Répartition</p><h3 className="text-xl font-black">Statuts employés</h3></div><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statutData.filter((item) => item.total > 0)} dataKey="total" nameKey="statut" innerRadius={58} outerRadius={92} paddingAngle={4}>{statutData.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 16, borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)", fontWeight: 800 }} /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-2">{statutData.map((item, index) => <div key={item.statut} className="rounded-2xl bg-background/70 p-3"><span className="mb-2 block h-2 w-8 rounded-full" style={{ background: palette[index % palette.length] }} /><p className="text-lg font-black">{nombre(item.total)}</p><p className="text-xs font-bold capitalize text-muted-foreground">{item.statut}</p></div>)}</div></article></section>;
}
function Apercu({ titre, action, items, onClick }: any) { return <article className="dashboard-card rounded-3xl p-5"><h3 className="text-lg font-black">{titre}</h3><div className="mt-4 space-y-3">{items.length ? items.map((item: any) => <div key={`${item.titre}-${item.meta}`} className="rounded-2xl border border-border bg-background/70 p-3"><p className="font-bold">{item.titre}</p><p className="mt-1 text-xs text-muted-foreground">{item.meta}</p></div>) : <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Aucune donnée.</p>}</div><button className="mini-button mt-4 w-full" onClick={onClick}>{action}</button></article>; }
function Actions({ voir, modifier, supprimer, admin }: { voir: () => void; modifier: () => void; supprimer: () => void; admin: boolean }) { return <div className="flex items-center gap-2"><button className="mini-button" onClick={voir}>Voir</button>{admin && <><button className="tool-action" onClick={modifier} aria-label="Modifier"><Edit3 className="size-4" /></button><button className="tool-action danger" onClick={supprimer} aria-label="Supprimer"><Trash2 className="size-4" /></button></>}</div>; }
function Info({ icone: Icon, label, valeur }: { icone: typeof LayoutDashboard; label: string; valeur: string }) { return <div className="rounded-xl border border-border bg-background p-3"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-muted-foreground"><Icon className="size-4" />{label}</div><p className="mt-2 text-sm font-bold text-foreground">{valeur}</p></div>; }
function Modal({ titre, fermer, children }: { titre: string; fermer: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-3 sm:items-center"><section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-document"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-black">{titre}</h2><button className="tool-action" onClick={fermer} aria-label="Fermer"><X className="size-4" /></button></div>{children}</section></div>; }
function Champ({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-black text-foreground">{label}</span>{children}</label>; }
function Select({ value, onChange, children }: any) { return <select className="form-control" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>; }
function ListeProjets({ projets, admin, voir, modifier, supprimer }: any) { return <div className="grid gap-4 xl:grid-cols-2">{projets.map((p: Projet) => <article key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex justify-between gap-4"><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{p.statut}</span><h3 className="mt-3 text-xl font-black">{p.nom_projet}</h3><p className="mt-1 text-sm text-muted-foreground">{p.client}</p></div><Actions admin={admin} voir={() => voir(p.id)} modifier={() => modifier(p.id)} supprimer={() => supprimer(p.id)} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info icone={MapPin} label="Localisation" valeur={p.localisation || "Non définie"} /><Info icone={ClipboardList} label="Budget estimé" valeur={devise(p.budget_estime)} /></div></article>)}</div>; }
function ListeEmployes({ employes, chantiers, admin, showSalary, voir, modifier, supprimer }: any) { return <div className="grid gap-4 xl:grid-cols-2">{employes.map((e: Employe) => <article key={e.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex justify-between gap-4"><div className="flex items-start gap-3">{e.photo_profil ? <img src={e.photo_profil} alt={`Photo de ${e.nom_complet}`} className="h-14 w-14 rounded-2xl object-cover" loading="lazy" /> : <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><UserRound className="size-6 text-muted-foreground" /></span>}<div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{e.role === "chef_chantier" ? "Chef de chantier" : "Employé"}</span><h3 className="mt-3 text-xl font-black">{e.nom_complet}</h3><p className="mt-1 text-sm text-muted-foreground">{e.poste} • {e.matricule}</p></div></div><Actions admin={admin} voir={() => voir(e.id)} modifier={() => modifier(e.id)} supprimer={() => supprimer(e.id)} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info icone={UserRound} label="Téléphone" valeur={e.telephone || "Non défini"} /><Info icone={CalendarDays} label="Admission" valeur={dateFr(e.date_admission)} />{showSalary && <Info icone={ClipboardList} label="Salaire restant" valeur={devise(e.salaire_restant ?? 0)} />}<Info icone={HardHat} label="Chantier" valeur={nomChantier(chantiers, e.chantier_assigne)} /><Info icone={MapPin} label="Adresse" valeur={e.adresse || "Non définie"} /></div></article>)}</div>; }
function ListeChantiers({ chantiers, projets, employes, admin, viewerRole, viewerId, voir, modifier, supprimer }: any) { return <div className="grid gap-4 xl:grid-cols-2">{chantiers.map((c: Chantier) => { const canSeeBudget = admin || (viewerRole === "chef_chantier" && c.chef_chantier === viewerId && c.autoriser_budget_chef); return <article key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex justify-between gap-4"><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{c.statut}</span><h3 className="mt-3 text-xl font-black">{c.nom_chantier}</h3><p className="mt-1 text-sm text-muted-foreground">{c.localisation}</p></div><Actions admin={admin} voir={() => voir(c.id)} modifier={() => modifier(c.id)} supprimer={() => supprimer(c.id)} /></div>{(c.images_chantier || []).length > 0 && <img src={(c.images_chantier || [])[0]} alt={`Image du chantier ${c.nom_chantier}`} className="mt-4 h-40 w-full rounded-2xl object-cover" loading="lazy" />}<div className="mt-4 grid gap-3 sm:grid-cols-2"><Info icone={BriefcaseBusiness} label="Projet lié" valeur={nomProjet(projets, c.projet_lie)} /><Info icone={HardHat} label="Chef" valeur={nomEmploye(employes, c.chef_chantier)} />{canSeeBudget ? <Info icone={Eye} label="Budget global" valeur={devise(c.budget_global || 0)} /> : <Info icone={EyeOff} label="Budget global" valeur="Masqué" />}<Info icone={UsersRound} label="Employés" valeur={String((c.employes_assignes || []).length)} /></div></article>; })}</div>; }
function AnnoncesDashboard({ annonces, admin, voir, masquer, setOnglet }: any) { return <section className="dashboard-card rounded-3xl p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Communications</p><h3 className="text-xl font-black">Annonces récentes</h3></div><button className="mini-button" onClick={() => setOnglet("annonces")}>Tout voir</button></div><div className="mt-4 grid gap-3 lg:grid-cols-3">{annonces.slice(0, 3).map((a: Annonce) => <article key={a.id} className="overflow-hidden rounded-2xl border border-border bg-background/70"><div className="tool-purple bg-tool-gradient p-4 text-tool-foreground"><Megaphone className="size-5" /><h4 className="mt-2 line-clamp-2 font-black">{a.titre}</h4></div>{a.image_url && <img src={a.image_url} alt={`Image annonce ${a.titre}`} className="h-28 w-full object-cover" loading="lazy" />}<div className="p-4"><p className="line-clamp-3 text-sm text-muted-foreground">{a.contenu}</p><div className="mt-3 flex flex-wrap gap-2"><button className="mini-button" onClick={() => voir(a.id)}>Lire</button>{!admin && <button className="tool-action danger" onClick={() => masquer(a.id)} aria-label="Retirer"><Trash2 className="size-4" /></button>}</div></div></article>)}{!annonces.length && <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground lg:col-span-3">Aucune annonce.</p>}</div></section>; }
function AnnoncesSection({ annonces, admin, voir, masquer, supprimer }: any) { return <div className="grid gap-4 xl:grid-cols-2">{annonces.map((a: Annonce) => <article key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-document">{a.image_url && <img src={a.image_url} alt={`Image annonce ${a.titre}`} className="h-52 w-full object-cover" loading="lazy" />}<div className="p-5"><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{dateFr(a.created_at)}</span><h3 className="mt-3 text-xl font-black">{a.titre}</h3></div><div className="flex gap-2"><button className="mini-button" onClick={() => voir(a.id)}>Lire</button>{admin ? <button className="tool-action danger" onClick={() => supprimer(a.id)} aria-label="Supprimer"><Trash2 className="size-4" /></button> : <button className="tool-action danger" onClick={() => masquer(a.id)} aria-label="Retirer"><Trash2 className="size-4" /></button>}</div></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{a.contenu}</p></div></article>)}{!annonces.length && <p className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">Aucune annonce disponible.</p>}</div>; }
function CalendrierEmployes({ jours }: { jours: JourNonTravaille[] }) { return <div className="grid gap-4 xl:grid-cols-2">{jours.map((jour) => <article key={jour.id} className="tool-holiday-calendar rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex items-start gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool"><CalendarDays className="size-6" /></span><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{jour.type_jour === "jour_ferie" ? "Jour férié" : "Jour non travaillé"}</span><h3 className="mt-3 text-xl font-black">{jour.titre}</h3><p className="mt-1 text-sm font-bold text-muted-foreground">{dateFr(jour.date_jour)}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{jour.description || "Aucune description."}</p></div></div></article>)}{!jours.length && <p className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">Aucun jour férié ou non travaillé n’est programmé.</p>}</div>; }
function DemandeCongeEmploye({ form, setForm, submit, saving, televerserImage, demandes }: any) { return <div className="space-y-5"><form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="mb-4 flex items-center gap-3"><span className="tool-leave-requests flex size-12 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool"><FilePlus2 className="size-6" /></span><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Employé</p><h3 className="text-xl font-black">Nouvelle demande de congé</h3></div></div><Champ label="Raison de la demande"><textarea className="form-control min-h-36" maxLength={2500} value={form.raison} onChange={(e) => setForm({ ...form, raison: e.target.value })} placeholder="Expliquez la raison de votre demande..." /></Champ><div className="mt-4 rounded-2xl border border-border bg-background p-4"><p className="mb-3 text-sm font-black">Image optionnelle</p>{form.image_url && <img src={form.image_url} alt="Image demande de congé" className="mb-3 max-h-64 w-full rounded-2xl object-contain bg-muted" />}<input type="file" accept="image/*" className="file-input" onChange={(e) => televerserImage(e.target.files)} /></div><button className="primary-action mt-4" disabled={saving}><FilePlus2 className="size-4" /> Envoyer à l’admin</button></form><section className="grid gap-4 xl:grid-cols-2">{demandes.map((d: DemandeConge) => <article key={d.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{d.statut}</span><p className="mt-3 text-sm font-bold text-muted-foreground">{dateFr(d.created_at)}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{d.raison}</p>{d.image_url && <img src={d.image_url} alt="Image demande" className="mt-4 max-h-56 w-full rounded-2xl object-contain bg-muted" loading="lazy" />}</article>)}{!demandes.length && <p className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">Aucune demande envoyée.</p>}</section></div>; }
function BilanSanteEmployeForm({ form, setForm, submit, saving, bilans }: any) { return <div className="space-y-5"><form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="mb-4 flex items-center gap-3"><span className="tool-health-report flex size-12 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool"><HeartPulse className="size-6" /></span><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Hebdomadaire</p><h3 className="text-xl font-black">Compléter le bilan de santé</h3></div></div><div className="grid gap-4 sm:grid-cols-2"><Champ label="Semaine"><input type="date" className="form-control" value={form.semaine} onChange={(e) => setForm({ ...form, semaine: e.target.value })} /></Champ><Champ label="Groupe sanguin"><input className="form-control" maxLength={12} value={form.groupe_sanguin} onChange={(e) => setForm({ ...form, groupe_sanguin: e.target.value })} placeholder="Ex : O+, A-" /></Champ></div><Champ label="État de santé global"><textarea className="form-control mt-4 min-h-28" maxLength={1200} value={form.etat_global} onChange={(e) => setForm({ ...form, etat_global: e.target.value })} /></Champ><Champ label="Alergie particulier,..."><textarea className="form-control mt-4 min-h-24" maxLength={1200} value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} /></Champ><label className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm font-bold"><input type="checkbox" checked={!!form.blessure} onChange={(e) => setForm({ ...form, blessure: e.target.checked })} /> Blessure</label>{form.blessure && <Champ label="Détails de la blessure"><textarea className="form-control mt-4 min-h-24" maxLength={1200} value={form.details_blessure} onChange={(e) => setForm({ ...form, details_blessure: e.target.value })} /></Champ>}<button className="primary-action mt-4" disabled={saving}><HeartPulse className="size-4" /> Envoyer le bilan</button></form><section className="grid gap-4 xl:grid-cols-2">{bilans.map((b: BilanSanteEmploye) => <article key={b.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{dateFr(b.semaine)}</span><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info icone={HeartPulse} label="État" valeur={b.etat_global} /><Info icone={ShieldCheck} label="Groupe" valeur={b.groupe_sanguin} /><Info icone={ClipboardList} label="Allergies" valeur={b.allergies || "Aucune"} /><Info icone={FilePlus2} label="Blessure" valeur={b.blessure ? "Oui" : "Non"} /></div>{b.details_blessure && <p className="mt-3 rounded-xl bg-muted p-3 text-sm font-semibold text-muted-foreground">{b.details_blessure}</p>}</article>)}{!bilans.length && <p className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">Aucun bilan envoyé.</p>}</section></div>; }

function IncidentChantierChef({ form, setForm, submit, saving, chantiers, incidents, televerserImages }: any) { return <div className="space-y-5"><form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="mb-4 flex items-center gap-3"><span className="tool-site-incident flex size-12 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool"><AlertTriangle className="size-6" /></span><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Chef de chantier</p><h3 className="text-xl font-black">Alerte incident / accident</h3></div></div><div className="grid gap-4 sm:grid-cols-2"><Champ label="Type"><Select value={form.type_evenement} onChange={(v: string) => setForm({ ...form, type_evenement: v })}><option>Incident</option><option>Accident</option></Select></Champ><Champ label="Date"><input type="date" className="form-control" value={form.date_evenement} onChange={(e) => setForm({ ...form, date_evenement: e.target.value })} /></Champ><Champ label="Chantier"><Select value={form.chantier_id || chantiers[0]?.id || ""} onChange={(v: string) => setForm({ ...form, chantier_id: v })}>{chantiers.map((c: Chantier) => <option key={c.id} value={c.id}>{c.nom_chantier}</option>)}</Select></Champ></div><Champ label="Explication détaillée"><textarea className="form-control mt-4 min-h-36" value={form.explication} onChange={(e) => setForm({ ...form, explication: e.target.value })} /></Champ><div className="mt-4 rounded-2xl border border-border bg-background p-4"><p className="mb-3 text-sm font-black">Images</p><input type="file" accept="image/*" multiple className="file-input" onChange={(e) => televerserImages(e.target.files)} />{!!form.images.length && <div className="mt-3 grid gap-3 sm:grid-cols-2">{form.images.map((image: string) => <img key={image} src={image} alt="Image incident" className="max-h-48 w-full rounded-2xl object-contain bg-muted" />)}</div>}</div><button className="primary-action mt-4" disabled={saving}><AlertTriangle className="size-4" /> Envoyer l’alerte</button></form><section className="grid gap-4 xl:grid-cols-2">{incidents.map((i: IncidentChantier) => <article key={i.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-black text-destructive">{i.type_evenement}</span><h3 className="mt-3 text-xl font-black">{i.chantier_nom}</h3><p className="text-sm font-bold text-muted-foreground">{dateFr(i.date_evenement)}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{i.explication}</p></article>)}{!incidents.length && <p className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">Aucune alerte envoyée.</p>}</section></div>; }

function GestionMaterielChef({ form, setForm, submit, saving, chantiers, rapports }: any) { const maj = (key: string, items: LigneMateriel[]) => setForm({ ...form, [key]: items }); return <div className="space-y-5"><form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="mb-4 flex items-center gap-3"><span className="tool-material-management flex size-12 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool"><PackageCheck className="size-6" /></span><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Chef de chantier</p><h3 className="text-xl font-black">Rapport hebdomadaire matériel</h3></div></div><div className="grid gap-4 sm:grid-cols-2"><Champ label="Semaine"><input type="date" className="form-control" value={form.semaine} onChange={(e) => setForm({ ...form, semaine: e.target.value })} /></Champ><Champ label="Chantier"><Select value={form.chantier_id || chantiers[0]?.id || ""} onChange={(v: string) => setForm({ ...form, chantier_id: v })}>{chantiers.map((c: Chantier) => <option key={c.id} value={c.id}>{c.nom_chantier}</option>)}</Select></Champ></div><MaterielEditor titre="Matériel prévu lundi" items={form.materiel_prevu} setItems={(items) => maj("materiel_prevu", items)} /><MaterielEditor titre="Matériel utilisé samedi" items={form.materiel_utilise} setItems={(items) => maj("materiel_utilise", items)} /><MaterielEditor titre="Matériel récupéré" items={form.materiel_recupere} setItems={(items) => maj("materiel_recupere", items)} /><MaterielEditor titre="Matériel perdu" items={form.materiel_perdu} setItems={(items) => maj("materiel_perdu", items)} /><Champ label="Notes"><textarea className="form-control mt-4 min-h-24" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Champ><button className="primary-action mt-4" disabled={saving}><PackageCheck className="size-4" /> Envoyer le rapport</button></form><section className="grid gap-4 xl:grid-cols-2">{rapports.map((r: RapportMateriel) => <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{dateFr(r.semaine)}</span><h3 className="mt-3 text-xl font-black">{r.chantier_nom}</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><MaterielResume titre="Récupéré" items={r.materiel_recupere} /><MaterielResume titre="Perdu" items={r.materiel_perdu} /></div>{r.notes && <p className="mt-3 rounded-xl bg-muted p-3 text-sm font-semibold text-muted-foreground">{r.notes}</p>}</article>)}{!rapports.length && <p className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">Aucun rapport envoyé.</p>}</section></div>; }
function ArrivageMaterielChef({ form, setForm, submit, saving, chantiers, arrivages, televerserPreuve }: any) { return <div className="space-y-5"><form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="mb-4 flex items-center gap-3"><span className="tool-material-management flex size-12 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool"><Warehouse className="size-6" /></span><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Chef de chantier</p><h3 className="text-xl font-black">Rapport arrivage de Matériel</h3></div></div><div className="grid gap-4 sm:grid-cols-2"><Champ label="Date de livraison"><input type="date" className="form-control" value={form.date_livraison} onChange={(e) => setForm({ ...form, date_livraison: e.target.value })} /></Champ><Champ label="Chantier"><Select value={form.chantier_id || chantiers[0]?.id || ""} onChange={(v: string) => setForm({ ...form, chantier_id: v })}>{chantiers.map((c: Chantier) => <option key={c.id} value={c.id}>{c.nom_chantier}</option>)}</Select></Champ><Champ label="Nom du matériel livré"><input className="form-control" value={form.nom_materiel} onChange={(e) => setForm({ ...form, nom_materiel: e.target.value })} /></Champ><Champ label="Quantité"><input type="number" min="0" className="form-control" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} /></Champ><Champ label="Entreprise partenaire"><input className="form-control" value={form.entreprise_partenaire} onChange={(e) => setForm({ ...form, entreprise_partenaire: e.target.value })} /></Champ><Champ label="Prix total"><input type="number" min="0" className="form-control" value={form.prix_total} onChange={(e) => setForm({ ...form, prix_total: e.target.value })} /></Champ></div><Champ label="Information supplémentaire"><textarea className="form-control mt-4 min-h-28" value={form.informations_supplementaires} onChange={(e) => setForm({ ...form, informations_supplementaires: e.target.value })} /></Champ><div className="mt-4 rounded-2xl border border-border bg-background p-4"><p className="mb-3 text-sm font-black">Preuve de livraison en image</p>{form.preuve_image_url && <img src={form.preuve_image_url} alt="Preuve de livraison" className="mb-3 max-h-56 w-full rounded-2xl bg-muted object-contain" />}<input type="file" accept="image/*" className="file-input" onChange={(e) => televerserPreuve(e.target.files)} /></div><button className="primary-action mt-4" disabled={saving}><Warehouse className="size-4" /> Envoyer le rapport</button></form><section className="grid gap-4 xl:grid-cols-2">{arrivages.map((a: ArrivageMateriel) => <article key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{dateFr(a.date_livraison)}</span><h3 className="mt-3 text-xl font-black">{a.nom_materiel}</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info icone={PackageCheck} label="Quantité" valeur={String(a.quantite || 0)} /><Info icone={Building2} label="Partenaire" valeur={a.entreprise_partenaire || "—"} /><Info icone={ClipboardList} label="Prix total" valeur={devise(a.prix_total || 0)} /><Info icone={HardHat} label="Chantier" valeur={a.chantier_nom || "—"} /></div>{a.preuve_image_url && <img src={a.preuve_image_url} alt="Preuve livraison" className="mt-4 max-h-56 w-full rounded-2xl bg-muted object-contain" loading="lazy" />}</article>)}{!arrivages.length && <p className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">Aucun arrivage envoyé.</p>}</section></div>; }
function MaterielEditor({ titre, items, setItems }: { titre: string; items: LigneMateriel[]; setItems: (items: LigneMateriel[]) => void }) { const liste = items.length ? items : [{ nom: "", quantite: 1 }]; return <div className="mt-4 rounded-2xl border border-border bg-background p-4"><div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-black">{titre}</p><button type="button" className="mini-button" onClick={() => setItems([...liste, { nom: "", quantite: 1 }])}><Plus className="size-4" /> Ajouter</button></div><div className="space-y-2">{liste.map((item, index) => <div key={`${titre}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_110px_42px]"><input className="form-control" value={item.nom} onChange={(e) => setItems(liste.map((m, i) => i === index ? { ...m, nom: e.target.value } : m))} placeholder="Nom du matériel" /><input type="number" min="1" className="form-control" value={item.quantite} onChange={(e) => setItems(liste.map((m, i) => i === index ? { ...m, quantite: Number(e.target.value) || 1 } : m))} /><button type="button" className="tool-action danger" onClick={() => setItems(liste.filter((_, i) => i !== index))}><Trash2 className="size-4" /></button></div>)}</div></div>; }
function MaterielResume({ titre, items }: { titre: string; items: LigneMateriel[] }) { return <div className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-black uppercase text-muted-foreground">{titre}</p>{items?.length ? items.map((m, i) => <p key={`${titre}-${i}`} className="mt-1 text-sm font-bold">{m.nom} × {m.quantite || 1}</p>) : <p className="mt-1 text-sm font-bold text-muted-foreground">—</p>}</div>; }

function FormAnnonce({ form, setForm, onSubmit, saving, televerserImage, retirerImage }: any) { return <form onSubmit={onSubmit} className="grid gap-4"><Champ label="Titre"><input className="form-control" maxLength={140} value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></Champ><Champ label="Texte de l’annonce"><textarea className="form-control min-h-40" maxLength={3000} value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} /></Champ><div className="rounded-2xl border border-border bg-background p-4"><p className="mb-3 text-sm font-black">Image optionnelle</p>{form.image_url && <img src={form.image_url} alt="Image de l’annonce" className="mb-3 h-48 w-full rounded-2xl object-cover" />}<input type="file" accept="image/*" className="file-input" onChange={(e) => televerserImage(e.target.files)} />{form.image_url && <button type="button" className="mini-button mt-3" onClick={retirerImage}>Retirer l’image</button>}</div><label className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm font-bold"><input type="checkbox" checked={!!form.publiee} onChange={(e) => setForm({ ...form, publiee: e.target.checked })} /> Publier immédiatement</label><button className="primary-action" disabled={saving}><Megaphone className="size-4" /> Envoyer l’annonce</button></form>; }
function PresencesSection(props: any) { return <div className="space-y-5">{props.chef && <form onSubmit={props.submit} className="rounded-2xl border border-border bg-card p-5 shadow-document"><h3 className="text-xl font-black">Nouvelle présence quotidienne</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><Champ label="Date"><input type="date" className="form-control" value={props.presenceDate} onChange={(e) => props.setPresenceDate(e.target.value)} /></Champ><Champ label="Chantier"><Select value={props.presenceChantier} onChange={props.setPresenceChantier}>{props.chantiersVisibles.map((c: Chantier) => <option key={c.id} value={c.id}>{c.nom_chantier}</option>)}</Select></Champ></div><div className="mt-4 space-y-3">{props.employesPresence.map((e: Employe) => <div key={e.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"><p className="font-bold">{e.nom_complet}</p><Select value={props.presenceStatuts[e.id] || "présent"} onChange={(v: StatutPresence) => props.setPresenceStatuts({ ...props.presenceStatuts, [e.id]: v })}>{statutsPresence.map((s) => <option key={s} value={s}>{s}</option>)}</Select></div>)}</div><Champ label="Notes"><textarea className="form-control mt-4 min-h-24" value={props.presenceNotes} onChange={(e) => props.setPresenceNotes(e.target.value)} /></Champ><button className="primary-action mt-4" disabled={props.saving}><ClipboardCheck className="size-4" /> Enregistrer la présence</button></form>}<div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-document md:grid-cols-4"><input type="date" className="form-control" value={props.filtreDate} onChange={(e) => props.setFiltreDate(e.target.value)} /><Select value={props.filtreChantier} onChange={props.setFiltreChantier}><option value="">Tous les chantiers</option>{props.chantiers.map((c: Chantier) => <option key={c.id} value={c.id}>{c.nom_chantier}</option>)}</Select><Select value={props.filtreEmploye} onChange={props.setFiltreEmploye}><option value="">Tous les employés</option>{props.employes.map((e: Employe) => <option key={e.id} value={e.id}>{e.nom_complet}</option>)}</Select><Select value={props.filtreChef} onChange={props.setFiltreChef}><option value="">Tous les chefs</option>{props.chefs.map((e: Employe) => <option key={e.id} value={e.id}>{e.nom_complet}</option>)}</Select></div><div className="grid gap-4 xl:grid-cols-2">{props.presences.map((p: Presence) => <article key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-black">{dateFr(p.date)}</h3><p className="text-sm text-muted-foreground">{nomChantier(props.chantiers, p.chantier_id)} • {nomEmploye(props.employes, p.chef_chantier_id)}</p></div><button className="mini-button" onClick={() => props.voir(p.id)}>Voir</button></div><p className="mt-3 text-sm font-bold">{p.employes_presence.length} employé(s)</p></article>)}</div></div>; }
function FormProjet({ form, setForm, onSubmit, saving }: any) { return <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><Champ label="Nom du projet"><input className="form-control" value={form.nom_projet} onChange={(e) => setForm({ ...form, nom_projet: e.target.value })} /></Champ><Champ label="Client"><input className="form-control" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} /></Champ><Champ label="Localisation"><input className="form-control" value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} /></Champ><Champ label="Budget estimé"><input type="number" className="form-control" value={form.budget_estime} onChange={(e) => setForm({ ...form, budget_estime: e.target.value })} /></Champ><Champ label="Statut"><Select value={form.statut} onChange={(v: string) => setForm({ ...form, statut: v })}>{statutsProjet.map((s) => <option key={s}>{s}</option>)}</Select></Champ><Champ label="Date début"><input type="date" className="form-control" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} /></Champ><Champ label="Date fin prévue"><input type="date" className="form-control" value={form.date_fin_prevue} onChange={(e) => setForm({ ...form, date_fin_prevue: e.target.value })} /></Champ><Champ label="Description"><textarea className="form-control min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Champ><button className="primary-action sm:col-span-2" disabled={saving}>Enregistrer</button></form>; }
function FormEmploye({ form, setForm, chantiers, onSubmit, saving, televerserPhoto, retirerPhoto }: any) { return <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-background p-4 sm:col-span-2"><p className="mb-3 text-sm font-black text-foreground">Photo de profil</p><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-muted">{form.photo_profil ? <img src={form.photo_profil} alt="Photo de profil employé" className="h-full w-full object-cover" /> : <UserRound className="size-10 text-muted-foreground" />}</div><div className="flex-1 space-y-2"><input type="file" accept="image/*" className="file-input" onChange={(e) => televerserPhoto(e.target.files)} />{form.photo_profil && <button type="button" className="mini-button" onClick={retirerPhoto}>Retirer la photo</button>}</div></div></div><Champ label="Nom complet"><input className="form-control" maxLength={120} value={form.nom_complet} onChange={(e) => setForm({ ...form, nom_complet: e.target.value })} /></Champ><Champ label="Matricule unique"><input className="form-control" maxLength={40} value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} /></Champ><Champ label="Genre"><Select value={form.genre || ""} onChange={(v: string) => setForm({ ...form, genre: v })}><option value="">Non précisé</option><option value="homme">Homme</option><option value="femme">Femme</option><option value="autre">Autre</option></Select></Champ><Champ label="Date d’admission"><input type="date" className="form-control" value={form.date_admission || ""} onChange={(e) => setForm({ ...form, date_admission: e.target.value })} /></Champ><Champ label="Date de naissance"><input type="date" className="form-control" value={form.date_naissance || ""} onChange={(e) => setForm({ ...form, date_naissance: e.target.value })} /></Champ><Champ label="Email"><input type="email" className="form-control" maxLength={160} value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Champ><Champ label="Poste"><input className="form-control" maxLength={100} value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} /></Champ><Champ label="Téléphone"><input className="form-control" maxLength={40} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></Champ><Champ label="Pièce d’identité"><input className="form-control" maxLength={80} value={form.numero_piece_identite || ""} onChange={(e) => setForm({ ...form, numero_piece_identite: e.target.value })} /></Champ><Champ label="Contact d’urgence"><input className="form-control" maxLength={120} value={form.contact_urgence || ""} onChange={(e) => setForm({ ...form, contact_urgence: e.target.value })} /></Champ><Champ label="Salaire total"><input type="number" className="form-control" value={form.salaire_total} onChange={(e) => setForm({ ...form, salaire_total: e.target.value })} /></Champ><Champ label="Salaire reçu"><input type="number" className="form-control" value={form.salaire_recu} onChange={(e) => setForm({ ...form, salaire_recu: e.target.value })} /></Champ><Champ label="Rôle"><Select value={form.role} onChange={(v: string) => setForm({ ...form, role: v })}><option value="employe">Employé</option><option value="chef_chantier">Chef de chantier</option></Select></Champ><Champ label="Statut"><Select value={form.statut} onChange={(v: string) => setForm({ ...form, statut: v })}>{statutsEmploye.map((s) => <option key={s}>{s}</option>)}</Select></Champ><Champ label="Chantier assigné"><Select value={form.chantier_assigne || ""} onChange={(v: string) => setForm({ ...form, chantier_assigne: v })}><option value="">Aucun</option>{chantiers.map((c: Chantier) => <option key={c.id} value={c.id}>{c.nom_chantier}</option>)}</Select></Champ><Champ label="Adresse"><input className="form-control" maxLength={180} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></Champ><label className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={!!form.peut_voir_budget} onChange={(e) => setForm({ ...form, peut_voir_budget: e.target.checked })} /> Autoriser cet employé à voir les budgets si nécessaire</label><button className="primary-action sm:col-span-2" disabled={saving}>Enregistrer</button></form>; }
function FormChantier({ form, setForm, projets, employes, onSubmit, saving, televerserImages, retirerImage, chantierId, rechargerDonnees, setMessage }: any) {
  const chefs = employes.filter((e: Employe) => e.role === "chef_chantier");
  const employesAssignes: string[] = form.employes_assignes || [];
  const salairesMap: Record<string, string> = form.salaires_employes || {};
  const totalSalaires = employesAssignes.reduce((sum, id) => sum + (Number(salairesMap[id]) || 0), 0);
  const instantane = !!chantierId;
  const [enCours, setEnCours] = useState<Record<string, boolean>>({});
  const [statutSauvegarde, setStatutSauvegarde] = useState<Record<string, "ok" | "err" | null>>({});

  async function recalculerSalaireEmploye(employeId: string) {
    const { data: lignes } = await db.from("salaires_chantier").select("montant").eq("employe_id", employeId);
    const totalCumule = (lignes || []).reduce((sum: number, l: { montant: number }) => sum + Number(l.montant || 0), 0);
    const emp = employes.find((e: Employe) => e.id === employeId);
    const recu = Number(emp?.salaire_recu || 0);
    await db.from("employes").update({ salaire: totalCumule, salaire_total: totalCumule, salaire_restant: Math.max(totalCumule - recu, 0) }).eq("id", employeId);
  }

  function flashStatut(employeId: string, statut: "ok" | "err") {
    setStatutSauvegarde((prev) => ({ ...prev, [employeId]: statut }));
    setTimeout(() => setStatutSauvegarde((prev) => ({ ...prev, [employeId]: null })), 1800);
  }

  async function basculerEmploye(employeId: string, ajoute: boolean) {
    const nouveauxAssignes = ajoute ? Array.from(new Set([...employesAssignes, employeId])) : employesAssignes.filter((id) => id !== employeId);
    const nouveauxSalaires = { ...salairesMap };
    if (ajoute && !nouveauxSalaires[employeId]) nouveauxSalaires[employeId] = "0";
    if (!ajoute) delete nouveauxSalaires[employeId];
    setForm({ ...form, employes_assignes: nouveauxAssignes, salaires_employes: nouveauxSalaires });

    if (!instantane) return;
    setEnCours((prev) => ({ ...prev, [employeId]: true }));
    try {
      const { error: errChantier } = await db.from("chantiers").update({ employes_assignes: nouveauxAssignes }).eq("id", chantierId);
      if (errChantier) throw errChantier;
      if (ajoute) {
        const montant = Number(nouveauxSalaires[employeId] || 0);
        const { error: errSal } = await db.from("salaires_chantier").upsert({ chantier_id: chantierId, employe_id: employeId, montant }, { onConflict: "chantier_id,employe_id" });
        if (errSal) throw errSal;
        // Synchroniser chantier_assigne sur la fiche employé pour cohérence d'affichage
        await db.from("employes").update({ chantier_assigne: chantierId }).eq("id", employeId);
      } else {
        await db.from("salaires_chantier").delete().eq("chantier_id", chantierId).eq("employe_id", employeId);
        // Si la fiche employé pointe vers ce chantier, la nettoyer
        const emp = employes.find((e: Employe) => e.id === employeId);
        if (emp?.chantier_assigne === chantierId) {
          await db.from("employes").update({ chantier_assigne: null }).eq("id", employeId);
        }
      }
      await recalculerSalaireEmploye(employeId);
      flashStatut(employeId, "ok");
      await rechargerDonnees?.();
    } catch (err: any) {
      flashStatut(employeId, "err");
      setMessage?.(err?.message || "Erreur lors de l'affectation.");
    } finally {
      setEnCours((prev) => ({ ...prev, [employeId]: false }));
    }
  }

  function changerSalaire(employeId: string, valeur: string) {
    setForm({ ...form, salaires_employes: { ...salairesMap, [employeId]: valeur } });
  }

  async function sauvegarderSalaire(employeId: string, valeur: string) {
    if (!instantane || !employesAssignes.includes(employeId)) return;
    const montant = Number(valeur || 0);
    setEnCours((prev) => ({ ...prev, [employeId]: true }));
    try {
      await db.from("salaires_chantier").upsert({ chantier_id: chantierId, employe_id: employeId, montant }, { onConflict: "chantier_id,employe_id" });
      await recalculerSalaireEmploye(employeId);
      flashStatut(employeId, "ok");
      await rechargerDonnees?.();
    } catch (err: any) {
      flashStatut(employeId, "err");
      setMessage?.(err?.message || "Erreur d'enregistrement du salaire.");
    } finally {
      setEnCours((prev) => ({ ...prev, [employeId]: false }));
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Champ label="Nom du chantier"><input className="form-control" value={form.nom_chantier} onChange={(e) => setForm({ ...form, nom_chantier: e.target.value })} /></Champ>
      <Champ label="Localisation"><input className="form-control" value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} /></Champ>
      <Champ label="Projet lié"><Select value={form.projet_lie || ""} onChange={(v: string) => setForm({ ...form, projet_lie: v })}><option value="">Aucun</option>{projets.map((p: Projet) => <option key={p.id} value={p.id}>{p.nom_projet}</option>)}</Select></Champ>
      <Champ label="Chef de chantier"><Select value={form.chef_chantier || ""} onChange={(v: string) => setForm({ ...form, chef_chantier: v })}><option value="">Aucun</option>{chefs.map((e: Employe) => <option key={e.id} value={e.id}>{e.nom_complet}</option>)}</Select></Champ>
      <Champ label="Budget global"><input type="number" className="form-control" value={form.budget_global} onChange={(e) => setForm({ ...form, budget_global: e.target.value })} /></Champ>
      <Champ label="Statut"><Select value={form.statut} onChange={(v: string) => setForm({ ...form, statut: v })}>{statutsChantier.map((s) => <option key={s}>{s}</option>)}</Select></Champ>
      <Champ label="Date début"><input type="date" className="form-control" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} /></Champ>
      <Champ label="Date fin prévue"><input type="date" className="form-control" value={form.date_fin_prevue} onChange={(e) => setForm({ ...form, date_fin_prevue: e.target.value })} /></Champ>

      <div className="sm:col-span-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-black">Employés assignés &amp; salaire pour ce chantier</p>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">Total: {devise(totalSalaires)}</span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{instantane ? "Cochez un employé pour l'affecter immédiatement à ce chantier. Les modifications de salaire sont enregistrées dès que vous quittez le champ." : "Sélectionnez les employés et indiquez le salaire fixe versé pour ce chantier. Les salaires seront enregistrés à la création du chantier."}</p>
        <div className="space-y-2">
          {employes.map((e: Employe) => {
            const coche = employesAssignes.includes(e.id);
            const busy = enCours[e.id];
            const stat = statutSauvegarde[e.id];
            return (
              <div key={e.id} className="grid gap-2 rounded-xl border border-border bg-background p-3 sm:grid-cols-[1fr_180px_24px]">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={coche} disabled={busy} onChange={(ev) => basculerEmploye(e.id, ev.target.checked)} />
                  <span>{e.nom_complet} <span className="text-xs font-normal text-muted-foreground">· {e.poste || "—"}</span></span>
                </label>
                {coche ? (
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" step="0.01" className="form-control" placeholder="Salaire ($)" value={salairesMap[e.id] || ""} disabled={busy} onChange={(ev) => changerSalaire(e.id, ev.target.value)} onBlur={(ev) => sauvegarderSalaire(e.id, ev.target.value)} />
                  </div>
                ) : <div />}
                <div className="flex items-center justify-center text-xs">
                  {busy && <span className="animate-pulse text-muted-foreground">…</span>}
                  {!busy && stat === "ok" && <span className="font-black text-primary" title="Enregistré">✓</span>}
                  {!busy && stat === "err" && <span className="font-black text-destructive" title="Erreur">!</span>}
                </div>
              </div>
            );
          })}
          {!employes.length && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Aucun employé enregistré.</p>}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={!!form.autoriser_budget_chef} onChange={(e) => setForm({ ...form, autoriser_budget_chef: e.target.checked })} /> Autoriser le chef de chantier à voir le budget global</label>
      <Champ label="Images chantier"><input type="file" multiple accept="image/*" className="file-input" onChange={(e) => televerserImages(e.target.files)} /></Champ>
      <div className="grid gap-2 sm:grid-cols-2">{(form.images_chantier || []).map((url: string) => <div key={url} className="relative"><img src={url} alt="Image chantier" className="h-28 w-full rounded-xl object-cover" /><button type="button" className="tool-action danger absolute right-2 top-2" onClick={() => retirerImage(url)}><Trash2 className="size-4" /></button></div>)}</div>
      <Champ label="Description"><textarea className="form-control min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Champ>
      <button className="primary-action sm:col-span-2" disabled={saving}><Upload className="size-4" /> Enregistrer{instantane ? " les autres modifications" : ""}</button>
    </form>
  );
}
function Details({ detail, projets, employes, chantiers, presences, annonces, admin, role, viewerId, saving, televerserPhotoProfil, retirerPhotoProfil, modifier, supprimer }: any) { const item = detail.type === "projets" ? projets.find((x: Projet) => x.id === detail.id) : detail.type === "employes" ? employes.find((x: Employe) => x.id === detail.id) : detail.type === "chantiers" ? chantiers.find((x: Chantier) => x.id === detail.id) : detail.type === "annonces" ? annonces.find((x: Annonce) => x.id === detail.id) : presences.find((x: Presence) => x.id === detail.id); if (!item) return <p>Donnée introuvable.</p>; const canEdit = admin && detail.type !== "presences"; if (detail.type === "annonces") { const a = item as Annonce; return <div className="space-y-4">{a.image_url && <img src={a.image_url} alt={`Image annonce ${a.titre}`} className="max-h-80 w-full rounded-2xl object-cover" loading="lazy" />}<div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{dateFr(a.created_at)}</p><h3 className="mt-1 text-2xl font-black">{a.titre}</h3></div><p className="whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm leading-6">{a.contenu}</p>{admin && <button className="tool-action danger" onClick={supprimer}><Trash2 className="size-4" /></button>}</div>; } if (detail.type === "presences") { const p = item as Presence; return <div className="space-y-4"><Info icone={CalendarDays} label="Date" valeur={dateFr(p.date)} /><Info icone={HardHat} label="Chantier" valeur={nomChantier(chantiers, p.chantier_id)} /><Info icone={UserRound} label="Chef" valeur={nomEmploye(employes, p.chef_chantier_id)} /><div className="space-y-2">{p.employes_presence.map((e) => <div key={e.employe_id} className="rounded-xl border border-border bg-background p-3 font-bold">{e.nom_complet} — {e.statut}</div>)}</div><p className="rounded-xl bg-muted p-4 text-sm">{p.notes || "Aucune note."}</p></div>; } if (detail.type === "chantiers") { const c = item as Chantier; const canSeeBudget = admin || (role === "chef_chantier" && c.chef_chantier === viewerId && c.autoriser_budget_chef); return <div className="space-y-4"><h3 className="text-2xl font-black">{c.nom_chantier}</h3><div className="grid gap-3 sm:grid-cols-2"><Info icone={MapPin} label="Localisation" valeur={c.localisation || "Non définie"} /><Info icone={HardHat} label="Chef" valeur={nomEmploye(employes, c.chef_chantier)} /><Info icone={BriefcaseBusiness} label="Projet" valeur={nomProjet(projets, c.projet_lie)} /><Info icone={canSeeBudget ? Eye : EyeOff} label="Budget global" valeur={canSeeBudget ? devise(c.budget_global || 0) : "Masqué"} /></div><p className="rounded-xl bg-muted p-4 text-sm">{c.description || "Aucune description."}</p><div className="grid gap-3 sm:grid-cols-2">{(c.images_chantier || []).map((url) => <img key={url} src={url} alt={`Image du chantier ${c.nom_chantier}`} className="h-48 w-full rounded-2xl object-cover" loading="lazy" />)}</div><EmployesAffectesChantier chantierId={c.id} employes={employes} />{canEdit && <div className="flex gap-2"><button className="mini-button" onClick={modifier}>Modifier</button><button className="tool-action danger" onClick={supprimer}><Trash2 className="size-4" /></button></div>}</div>; } if (detail.type === "employes") { const e = item as Employe; const canUpdateOwnPhoto = !admin && e.id === viewerId; return <div className="space-y-4">{e.photo_profil ? <img src={e.photo_profil} alt={`Photo de ${e.nom_complet}`} className="h-28 w-28 rounded-2xl object-cover" loading="lazy" /> : <span className="flex h-28 w-28 items-center justify-center rounded-2xl bg-muted"><UserRound className="size-10 text-muted-foreground" /></span>}{canUpdateOwnPhoto && <div className="rounded-2xl border border-border bg-background p-4"><p className="mb-3 text-sm font-black">Photo de profil</p><input type="file" accept="image/*" className="file-input" disabled={saving} onChange={(event) => televerserPhotoProfil(event.target.files)} />{e.photo_profil && <button type="button" className="mini-button mt-3" disabled={saving} onClick={retirerPhotoProfil}>Retirer la photo</button>}</div>}<h3 className="text-2xl font-black">{e.nom_complet}</h3><div className="grid gap-3 sm:grid-cols-2"><Info icone={UserRound} label="Matricule" valeur={e.matricule || "Non défini"} /><Info icone={BriefcaseBusiness} label="Poste" valeur={e.poste || "Non défini"} /><Info icone={UsersRound} label="Genre" valeur={e.genre || "Non précisé"} /><Info icone={CalendarDays} label="Admission" valeur={dateFr(e.date_admission)} /><Info icone={CalendarDays} label="Naissance" valeur={dateFr(e.date_naissance)} /><Info icone={UserRound} label="Email" valeur={e.email || "Non défini"} /><Info icone={UserRound} label="Téléphone" valeur={e.telephone || "Non défini"} /><Info icone={ClipboardList} label="Pièce d’identité" valeur={e.numero_piece_identite || "Non définie"} /><Info icone={ShieldCheck} label="Contact d’urgence" valeur={e.contact_urgence || "Non défini"} /><Info icone={HardHat} label="Chantier" valeur={nomChantier(chantiers, e.chantier_assigne)} /></div><p className="rounded-xl bg-muted p-4 text-sm">{e.adresse || "Adresse non définie."}</p>{canEdit && <div className="flex gap-2"><button className="mini-button" onClick={modifier}>Modifier</button><button className="tool-action danger" onClick={supprimer}><Trash2 className="size-4" /></button></div>}</div>; } return <div className="space-y-4"><h3 className="text-2xl font-black">{(item as any).nom_projet || (item as any).nom_complet}</h3><pre className="overflow-auto rounded-xl bg-muted p-4 text-xs">{JSON.stringify(item, null, 2)}</pre>{canEdit && <div className="flex gap-2"><button className="mini-button" onClick={modifier}>Modifier</button><button className="tool-action danger" onClick={supprimer}><Trash2 className="size-4" /></button></div>}</div>; }
function EmployesAffectesChantier({ chantierId, employes }: { chantierId: string; employes: Employe[] }) {
  const [salaires, setSalaires] = useState<Record<string, number>>({});
  const [idsAffectes, setIdsAffectes] = useState<string[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let actif = true;
    setChargement(true);
    (async () => {
      // Charger en parallèle : lignes salaires + chantier (pour employes_assignes)
      const [{ data: lignesSalaires }, { data: chantier }] = await Promise.all([
        db.from("salaires_chantier").select("employe_id, montant").eq("chantier_id", chantierId),
        db.from("chantiers").select("employes_assignes").eq("id", chantierId).maybeSingle(),
      ]);
      if (!actif) return;

      const map: Record<string, number> = {};
      (lignesSalaires || []).forEach((s: { employe_id: string; montant: number }) => { map[s.employe_id] = Number(s.montant || 0); });

      // Fusion des 3 sources : salaires_chantier + employes_assignes + employes.chantier_assigne
      const idsSalaires = Object.keys(map);
      const idsAssignes = (chantier?.employes_assignes || []) as string[];
      const idsParFiche = employes.filter((e) => e.chantier_assigne === chantierId).map((e) => e.id);
      const idsUnion = Array.from(new Set([...idsSalaires, ...idsAssignes, ...idsParFiche]));

      // Auto-réparation silencieuse : créer une ligne salaire à 0 pour les employés affectés sans salaire
      const aCreer = idsUnion.filter((id) => !(id in map));
      if (aCreer.length) {
        await db.from("salaires_chantier").upsert(
          aCreer.map((employe_id) => ({ chantier_id: chantierId, employe_id, montant: 0 })),
          { onConflict: "chantier_id,employe_id" },
        );
        aCreer.forEach((id) => { map[id] = 0; });
      }
      // Auto-réparation : ajouter dans employes_assignes ceux qui manquent
      const aAjouter = idsUnion.filter((id) => !idsAssignes.includes(id));
      if (aAjouter.length) {
        await db.from("chantiers").update({ employes_assignes: [...idsAssignes, ...aAjouter] }).eq("id", chantierId);
      }

      if (!actif) return;
      setSalaires(map);
      setIdsAffectes(idsUnion);
      setChargement(false);
    })();
    return () => { actif = false; };
  }, [chantierId, employes]);

  const lignes = idsAffectes
    .map((id) => ({ id, employe: employes.find((e) => e.id === id), montant: salaires[id] || 0 }))
    .filter((l) => l.employe);
  const total = lignes.reduce((sum, l) => sum + (l.montant || 0), 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-document">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UsersRound className="size-5 text-primary" />
          <h4 className="text-base font-black">Employés affectés ({lignes.length})</h4>
        </div>
        {!!lignes.length && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">Masse salariale : {devise(total)}</span>}
      </div>
      {chargement ? (
        <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Chargement…</p>
      ) : lignes.length ? (
        <ul className="space-y-2">
          {lignes.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
              <div className="flex items-center gap-3 min-w-0">
                {l.employe?.photo_profil ? (
                  <img src={l.employe.photo_profil} alt={`Photo ${l.employe.nom_complet}`} className="size-10 rounded-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted"><UserRound className="size-5 text-muted-foreground" /></span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{l.employe?.nom_complet}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.employe?.poste || "—"} · {l.employe?.matricule || "Sans matricule"}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1 text-sm font-black text-primary">{devise(l.montant)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Aucun employé affecté à ce chantier.</p>
      )}
    </section>
  );
}

function nomProjet(projets: Projet[], id?: string | null) { return projets.find((p) => p.id === id)?.nom_projet || "Non lié"; }
function nomChantier(chantiers: Chantier[], id?: string | null) { return chantiers.find((c) => c.id === id)?.nom_chantier || "Non assigné"; }
function nomEmploye(employes: Employe[], id?: string | null) { return employes.find((e) => e.id === id)?.nom_complet || "Non défini"; }

function PaiementEmploye({ recus, employe, confirmer, ouvrirPdf, saving }: { recus: RecuEmployePaiement[]; employe: Employe | null; confirmer: (id: string) => void; ouvrirPdf: (pdf: string) => void; saving: boolean }) {
  const enAttente = recus.filter((r) => r.statut === "en_attente");
  const confirmes = recus.filter((r) => r.statut === "confirme");
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="dashboard-card tool-teal rounded-3xl p-5"><p className="text-xs font-black uppercase tracking-wide opacity-85">Salaire total cumulé</p><p className="mt-3 text-3xl font-black">{devise(employe?.salaire_total ?? employe?.salaire ?? 0)}</p><p className="mt-1 text-xs opacity-85">Somme des salaires de tous vos chantiers.</p></article>
        <article className="dashboard-card tool-green rounded-3xl p-5"><p className="text-xs font-black uppercase tracking-wide opacity-85">Salaire reçu</p><p className="mt-3 text-3xl font-black">{devise(employe?.salaire_recu ?? 0)}</p><p className="mt-1 text-xs opacity-85">Mis à jour à chaque reçu confirmé.</p></article>
        <article className="dashboard-card tool-orange rounded-3xl p-5"><p className="text-xs font-black uppercase tracking-wide opacity-85">Salaire restant</p><p className="mt-3 text-3xl font-black">{devise(employe?.salaire_restant ?? 0)}</p><p className="mt-1 text-xs opacity-85">À recevoir.</p></article>
      </section>

      <section className="dashboard-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-3"><span className="tool-employee-receipt flex size-12 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool"><ClipboardList className="size-6" /></span><div><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Notifications</p><h3 className="text-xl font-black">Reçus à confirmer ({enAttente.length})</h3></div></div>
        <div className="space-y-3">
          {enAttente.length ? enAttente.map((r) => (
            <article key={r.id} className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-primary">{r.numero} · {dateFr(r.date_envoi)}</p>
                  <p className="mt-1 text-2xl font-black">{devise(r.montant)}</p>
                  <p className="mt-1 text-sm font-bold text-foreground">Chantier : {r.chantier_nom || "—"}</p>
                  {r.motif && <p className="mt-1 text-sm text-muted-foreground">{r.motif}</p>}
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <button type="button" className="mini-button" onClick={() => ouvrirPdf(r.pdf_base64)}>Voir le PDF</button>
                  <button type="button" className="primary-action" disabled={saving} onClick={() => confirmer(r.id)}><CheckCircle2 className="size-4" /> Confirmer la réception</button>
                </div>
              </div>
            </article>
          )) : <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Aucun reçu en attente de confirmation.</p>}
        </div>
      </section>

      <section className="dashboard-card rounded-3xl p-5">
        <h3 className="mb-4 text-xl font-black">Historique des paiements confirmés ({confirmes.length})</h3>
        <div className="space-y-3">
          {confirmes.length ? confirmes.map((r) => (
            <article key={r.id} className="grid gap-2 rounded-xl border border-border bg-background p-4 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-black uppercase text-muted-foreground">{r.numero}</p>
                <p className="mt-1 text-lg font-black">{devise(r.montant)} · {r.chantier_nom || "—"}</p>
                <p className="text-xs text-muted-foreground">Confirmé le {r.date_confirmation ? dateFr(r.date_confirmation.slice(0, 10)) : dateFr(r.date_envoi)}</p>
                {r.motif && <p className="mt-1 text-sm">{r.motif}</p>}
              </div>
              <button type="button" className="mini-button self-start" onClick={() => ouvrirPdf(r.pdf_base64)}>PDF</button>
            </article>
          )) : <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Aucun paiement confirmé pour le moment.</p>}
        </div>
      </section>
    </div>
  );
}
