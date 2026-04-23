import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit3,
  HardHat,
  LayoutDashboard,
  Loader2,
  MapPin,
  Menu,
  Plus,
  Search,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/employe")({
  head: () => ({
    meta: [
      { title: "Gestion SCM SARL — Projets, Employés et Chantiers" },
      { name: "description", content: "Dashboard SCM SARL pour gérer les projets, les employés et les chantiers avec Lovable Cloud." },
      { property: "og:title", content: "Gestion SCM SARL" },
      { property: "og:description", content: "Espace central de gestion des projets, employés et chantiers SCM SARL." },
    ],
  }),
  component: EmployePage,
});

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

type Chantier = {
  id: string;
  nom_chantier: string;
  localisation: string;
  chef_chantier: string;
  projet_lie: string | null;
  description: string;
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
  statut: string;
  chantier_assigne: string | null;
  created_at: string;
};

type Onglet = "dashboard" | "projets" | "employes" | "chantiers";
type ModeEdition = { type: Exclude<Onglet, "dashboard">; id?: string } | null;
type Detail = { type: Exclude<Onglet, "dashboard">; id: string } | null;

type ProjetForm = Omit<Projet, "id" | "created_at" | "budget_estime"> & { budget_estime: string };
type EmployeForm = Omit<Employe, "id" | "created_at" | "salaire"> & { salaire: string };
type ChantierForm = Omit<Chantier, "id" | "created_at">;

const statutsProjet = ["Planifié", "Actif", "En pause", "Terminé"];
const statutsEmploye = ["Actif", "En congé", "Suspendu", "Inactif"];
const statutsChantier = ["Planifié", "Actif", "En pause", "Terminé"];

const projetInitial: ProjetForm = {
  nom_projet: "",
  client: "",
  localisation: "",
  description: "",
  budget_estime: "",
  statut: "Planifié",
  date_debut: "",
  date_fin_prevue: "",
};

const employeInitial: EmployeForm = {
  nom_complet: "",
  poste: "",
  matricule: "",
  telephone: "",
  adresse: "",
  salaire: "",
  statut: "Actif",
  chantier_assigne: "",
};

const chantierInitial: ChantierForm = {
  nom_chantier: "",
  localisation: "",
  chef_chantier: "",
  projet_lie: "",
  description: "",
  statut: "Planifié",
  date_debut: "",
  date_fin_prevue: "",
};

const db = supabase as any;

function nombre(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function devise(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

function dateFr(value?: string | null) {
  if (!value) return "Non définie";
  return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function normaliserDate(value: string | null) {
  return value && value.length > 0 ? value : null;
}

function EmployePage() {
  const [onglet, setOnglet] = useState<Onglet>("dashboard");
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [message, setMessage] = useState("");
  const [recherche, setRecherche] = useState("");
  const [edition, setEdition] = useState<ModeEdition>(null);
  const [detail, setDetail] = useState<Detail>(null);
  const [formProjet, setFormProjet] = useState<ProjetForm>(projetInitial);
  const [formEmploye, setFormEmploye] = useState<EmployeForm>(employeInitial);
  const [formChantier, setFormChantier] = useState<ChantierForm>(chantierInitial);

  const chargerDonnees = async () => {
    setChargement(true);
    setMessage("");
    const [projetsRes, employesRes, chantiersRes] = await Promise.all([
      db.from("projets").select("*").order("created_at", { ascending: false }),
      db.from("employes").select("*").order("created_at", { ascending: false }),
      db.from("chantiers").select("*").order("created_at", { ascending: false }),
    ]);

    if (projetsRes.error || employesRes.error || chantiersRes.error) {
      setMessage("Impossible de charger les données. Vérifiez la connexion Lovable Cloud.");
    } else {
      setProjets(projetsRes.data || []);
      setEmployes(employesRes.data || []);
      setChantiers(chantiersRes.data || []);
    }
    setChargement(false);
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const stats = useMemo(() => ({
    totalProjets: projets.length,
    totalEmployes: employes.length,
    totalChantiers: chantiers.length,
    projetsActifs: projets.filter((projet) => projet.statut === "Actif").length,
    chantiersActifs: chantiers.filter((chantier) => chantier.statut === "Actif").length,
  }), [projets, employes, chantiers]);

  const projetsFiltres = useMemo(() => filtrer(projets, recherche, ["nom_projet", "client", "localisation", "statut"]), [projets, recherche]);
  const employesFiltres = useMemo(() => filtrer(employes, recherche, ["nom_complet", "poste", "matricule", "telephone", "statut"]), [employes, recherche]);
  const chantiersFiltres = useMemo(() => filtrer(chantiers, recherche, ["nom_chantier", "localisation", "chef_chantier", "statut"]), [chantiers, recherche]);

  const ouvrirCreation = (type: Exclude<Onglet, "dashboard">) => {
    setEdition({ type });
    setDetail(null);
    setMessage("");
    if (type === "projets") setFormProjet(projetInitial);
    if (type === "employes") setFormEmploye(employeInitial);
    if (type === "chantiers") setFormChantier(chantierInitial);
  };

  const ouvrirEdition = (type: Exclude<Onglet, "dashboard">, id: string) => {
    setEdition({ type, id });
    setDetail(null);
    setMessage("");
    if (type === "projets") {
      const item = projets.find((projet) => projet.id === id);
      if (item) setFormProjet({ ...item, budget_estime: String(item.budget_estime || ""), date_debut: item.date_debut || "", date_fin_prevue: item.date_fin_prevue || "" });
    }
    if (type === "employes") {
      const item = employes.find((employe) => employe.id === id);
      if (item) setFormEmploye({ ...item, salaire: String(item.salaire || ""), chantier_assigne: item.chantier_assigne || "" });
    }
    if (type === "chantiers") {
      const item = chantiers.find((chantier) => chantier.id === id);
      if (item) setFormChantier({ ...item, projet_lie: item.projet_lie || "", date_debut: item.date_debut || "", date_fin_prevue: item.date_fin_prevue || "" });
    }
  };

  const enregistrerProjet = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formProjet.nom_projet.trim()) return setMessage("Le nom du projet est obligatoire.");
    setSauvegarde(true);
    const payload = {
      ...formProjet,
      budget_estime: Number(formProjet.budget_estime) || 0,
      date_debut: normaliserDate(formProjet.date_debut),
      date_fin_prevue: normaliserDate(formProjet.date_fin_prevue),
    };
    const requete = edition?.id ? db.from("projets").update(payload).eq("id", edition.id) : db.from("projets").insert(payload);
    const { error } = await requete;
    await finaliserSauvegarde(error, "Projet enregistré.");
  };

  const enregistrerEmploye = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formEmploye.nom_complet.trim()) return setMessage("Le nom complet est obligatoire.");
    if (!formEmploye.matricule.trim()) return setMessage("Le matricule est obligatoire.");
    setSauvegarde(true);
    const payload = {
      ...formEmploye,
      salaire: Number(formEmploye.salaire) || 0,
      chantier_assigne: formEmploye.chantier_assigne || null,
    };
    const requete = edition?.id ? db.from("employes").update(payload).eq("id", edition.id) : db.from("employes").insert(payload);
    const { error } = await requete;
    await finaliserSauvegarde(error, "Employé enregistré.");
  };

  const enregistrerChantier = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formChantier.nom_chantier.trim()) return setMessage("Le nom du chantier est obligatoire.");
    setSauvegarde(true);
    const payload = {
      ...formChantier,
      projet_lie: formChantier.projet_lie || null,
      date_debut: normaliserDate(formChantier.date_debut),
      date_fin_prevue: normaliserDate(formChantier.date_fin_prevue),
    };
    const requete = edition?.id ? db.from("chantiers").update(payload).eq("id", edition.id) : db.from("chantiers").insert(payload);
    const { error } = await requete;
    await finaliserSauvegarde(error, "Chantier enregistré.");
  };

  const finaliserSauvegarde = async (error: { message?: string } | null, succes: string) => {
    setSauvegarde(false);
    if (error) {
      setMessage(error.message || "Erreur lors de l’enregistrement.");
      return;
    }
    setMessage(succes);
    setEdition(null);
    await chargerDonnees();
  };

  const supprimer = async (type: Exclude<Onglet, "dashboard">, id: string) => {
    const libelle = type === "projets" ? "ce projet" : type === "employes" ? "cet employé" : "ce chantier";
    if (!confirm(`Voulez-vous vraiment supprimer ${libelle} ?`)) return;
    const table = type === "projets" ? "projets" : type === "employes" ? "employes" : "chantiers";
    const { error } = await db.from(table).delete().eq("id", id);
    if (error) setMessage(error.message || "Suppression impossible.");
    else {
      setMessage("Élément supprimé.");
      setDetail(null);
      await chargerDonnees();
    }
  };

  const titreOnglet = onglet === "dashboard" ? "Tableau de bord" : onglet === "projets" ? "Projets" : onglet === "employes" ? "Employés" : "Chantiers";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className={`${menuOuvert ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-card p-5 shadow-document transition-transform lg:sticky lg:translate-x-0`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">SCM SARL</p>
              <h1 className="mt-1 text-2xl font-black">Gestion</h1>
            </div>
            <button className="tool-action lg:hidden" onClick={() => setMenuOuvert(false)} aria-label="Fermer le menu"><X className="size-4" /></button>
          </div>
          <Link to="/" className="mini-button mt-6 w-full">
            <ArrowLeft className="size-4" /> Retour aux outils
          </Link>
          <nav className="mt-8 space-y-2">
            <BoutonNav actif={onglet === "dashboard"} icone={LayoutDashboard} label="Tableau de bord" onClick={() => changerOnglet("dashboard")} />
            <BoutonNav actif={onglet === "projets"} icone={BriefcaseBusiness} label="Projets" onClick={() => changerOnglet("projets")} />
            <BoutonNav actif={onglet === "employes"} icone={UsersRound} label="Employés" onClick={() => changerOnglet("employes")} />
            <BoutonNav actif={onglet === "chantiers"} icone={HardHat} label="Chantiers" onClick={() => changerOnglet("chantiers")} />
          </nav>
          <div className="mt-10 rounded-2xl border border-border bg-background p-4">
            <Building2 className="mb-3 size-8 text-primary" />
            <p className="text-sm font-bold">Structure centrale</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Gestion uniquement dédiée aux projets, employés et chantiers. Aucun générateur PDF n’est inclus ici.</p>
          </div>
        </aside>

        {menuOuvert && <button className="fixed inset-0 z-30 bg-foreground/25 lg:hidden" onClick={() => setMenuOuvert(false)} aria-label="Fermer le menu" />}

        <section className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8">
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-document sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button className="tool-action lg:hidden" onClick={() => setMenuOuvert(true)} aria-label="Ouvrir le menu"><Menu className="size-5" /></button>
              <div className="tool-blue inline-flex size-12 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool">
                <UserRound className="size-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Espace entreprise</p>
                <h2 className="text-2xl font-black sm:text-3xl">{titreOnglet}</h2>
              </div>
            </div>
            {onglet !== "dashboard" && (
              <button className="primary-action" onClick={() => ouvrirCreation(onglet)}>
                <Plus className="size-4" /> Nouveau
              </button>
            )}
          </header>

          {message && <div className="mb-5 rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-foreground shadow-document">{message}</div>}

          {chargement ? (
            <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-border bg-card">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : onglet === "dashboard" ? (
            <Dashboard stats={stats} projets={projets} chantiers={chantiers} employes={employes} setOnglet={setOnglet} />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-document sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input className="form-control pl-10" value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder={`Rechercher dans ${titreOnglet.toLowerCase()}...`} />
                </div>
                <p className="text-sm font-bold text-muted-foreground">{onglet === "projets" ? projetsFiltres.length : onglet === "employes" ? employesFiltres.length : chantiersFiltres.length} résultat(s)</p>
              </div>

              {onglet === "projets" && <ListeProjets projets={projetsFiltres} voir={(id) => setDetail({ type: "projets", id })} modifier={(id) => ouvrirEdition("projets", id)} supprimer={(id) => supprimer("projets", id)} />}
              {onglet === "employes" && <ListeEmployes employes={employesFiltres} chantiers={chantiers} voir={(id) => setDetail({ type: "employes", id })} modifier={(id) => ouvrirEdition("employes", id)} supprimer={(id) => supprimer("employes", id)} />}
              {onglet === "chantiers" && <ListeChantiers chantiers={chantiersFiltres} projets={projets} employes={employes} voir={(id) => setDetail({ type: "chantiers", id })} modifier={(id) => ouvrirEdition("chantiers", id)} supprimer={(id) => supprimer("chantiers", id)} />}
            </div>
          )}
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-card/95 p-2 shadow-document backdrop-blur lg:hidden">
        <BoutonMobile actif={onglet === "dashboard"} icone={LayoutDashboard} label="Accueil" onClick={() => changerOnglet("dashboard")} />
        <BoutonMobile actif={onglet === "projets"} icone={BriefcaseBusiness} label="Projets" onClick={() => changerOnglet("projets")} />
        <BoutonMobile actif={onglet === "employes"} icone={UsersRound} label="Employés" onClick={() => changerOnglet("employes")} />
        <BoutonMobile actif={onglet === "chantiers"} icone={HardHat} label="Chantiers" onClick={() => changerOnglet("chantiers")} />
      </nav>

      {edition && (
        <Modal titre={edition.id ? "Modifier" : "Créer"} fermer={() => setEdition(null)}>
          {edition.type === "projets" && <FormProjet form={formProjet} setForm={setFormProjet} onSubmit={enregistrerProjet} saving={sauvegarde} />}
          {edition.type === "employes" && <FormEmploye form={formEmploye} setForm={setFormEmploye} chantiers={chantiers} onSubmit={enregistrerEmploye} saving={sauvegarde} />}
          {edition.type === "chantiers" && <FormChantier form={formChantier} setForm={setFormChantier} projets={projets} employes={employes} onSubmit={enregistrerChantier} saving={sauvegarde} />}
        </Modal>
      )}

      {detail && (
        <Modal titre="Détails" fermer={() => setDetail(null)}>
          <Details detail={detail} projets={projets} employes={employes} chantiers={chantiers} modifier={() => ouvrirEdition(detail.type, detail.id)} supprimer={() => supprimer(detail.type, detail.id)} />
        </Modal>
      )}
    </main>
  );

  function changerOnglet(tab: Onglet) {
    setOnglet(tab);
    setRecherche("");
    setMenuOuvert(false);
  }
}

function filtrer<T extends Record<string, unknown>>(items: T[], recherche: string, champs: (keyof T)[]) {
  const requete = recherche.trim().toLowerCase();
  if (!requete) return items;
  return items.filter((item) => champs.some((champ) => String(item[champ] ?? "").toLowerCase().includes(requete)));
}

function BoutonNav({ actif, icone: Icon, label, onClick }: { actif: boolean; icone: typeof LayoutDashboard; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${actif ? "bg-primary text-primary-foreground shadow-tool" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="size-5" />{label}</button>;
}

function BoutonMobile({ actif, icone: Icon, label, onClick }: { actif: boolean; icone: typeof LayoutDashboard; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-black ${actif ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Icon className="size-5" />{label}</button>;
}

function Dashboard({ stats, projets, chantiers, employes, setOnglet }: { stats: { totalProjets: number; totalEmployes: number; totalChantiers: number; projetsActifs: number; chantiersActifs: number }; projets: Projet[]; chantiers: Chantier[]; employes: Employe[]; setOnglet: (onglet: Onglet) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <CarteStat titre="Total projets" valeur={stats.totalProjets} icone={BriefcaseBusiness} />
        <CarteStat titre="Total employés" valeur={stats.totalEmployes} icone={UsersRound} />
        <CarteStat titre="Total chantiers" valeur={stats.totalChantiers} icone={HardHat} />
        <CarteStat titre="Projets actifs" valeur={stats.projetsActifs} icone={CheckCircle2} />
        <CarteStat titre="Chantiers actifs" valeur={stats.chantiersActifs} icone={Building2} />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <ApercuModule titre="Projets récents" action="Gérer les projets" icone={BriefcaseBusiness} onClick={() => setOnglet("projets")} items={projets.slice(0, 4).map((item) => ({ titre: item.nom_projet, meta: `${item.client || "Client non défini"} • ${item.statut}` }))} />
        <ApercuModule titre="Employés récents" action="Gérer les employés" icone={UsersRound} onClick={() => setOnglet("employes")} items={employes.slice(0, 4).map((item) => ({ titre: item.nom_complet, meta: `${item.poste || "Poste non défini"} • ${item.statut}` }))} />
        <ApercuModule titre="Chantiers récents" action="Gérer les chantiers" icone={HardHat} onClick={() => setOnglet("chantiers")} items={chantiers.slice(0, 4).map((item) => ({ titre: item.nom_chantier, meta: `${item.localisation || "Localisation non définie"} • ${item.statut}` }))} />
      </div>
    </div>
  );
}

function CarteStat({ titre, valeur, icone: Icon }: { titre: string; valeur: number; icone: typeof LayoutDashboard }) {
  return <article className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{titre}</p><Icon className="size-5 text-primary" /></div><p className="mt-4 text-4xl font-black">{nombre(valeur)}</p></article>;
}

function ApercuModule({ titre, action, icone: Icon, items, onClick }: { titre: string; action: string; icone: typeof LayoutDashboard; items: { titre: string; meta: string }[]; onClick: () => void }) {
  return <article className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex items-center justify-between"><h3 className="text-lg font-black">{titre}</h3><Icon className="size-5 text-primary" /></div><div className="mt-4 space-y-3">{items.length ? items.map((item) => <div key={`${item.titre}-${item.meta}`} className="rounded-xl border border-border bg-background p-3"><p className="font-bold">{item.titre}</p><p className="mt-1 text-xs text-muted-foreground">{item.meta}</p></div>) : <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Aucune donnée pour le moment.</p>}</div><button className="mini-button mt-4 w-full" onClick={onClick}>{action}</button></article>;
}

function Actions({ voir, modifier, supprimer }: { voir: () => void; modifier: () => void; supprimer: () => void }) {
  return <div className="flex items-center gap-2"><button className="mini-button" onClick={voir}>Voir</button><button className="tool-action" onClick={modifier} aria-label="Modifier"><Edit3 className="size-4" /></button><button className="tool-action danger" onClick={supprimer} aria-label="Supprimer"><Trash2 className="size-4" /></button></div>;
}

function ListeProjets({ projets, voir, modifier, supprimer }: { projets: Projet[]; voir: (id: string) => void; modifier: (id: string) => void; supprimer: (id: string) => void }) {
  return <div className="grid gap-4 xl:grid-cols-2">{projets.map((projet) => <article key={projet.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{projet.statut}</span><h3 className="mt-3 text-xl font-black">{projet.nom_projet}</h3><p className="mt-1 text-sm text-muted-foreground">{projet.client || "Client non défini"}</p></div><Actions voir={() => voir(projet.id)} modifier={() => modifier(projet.id)} supprimer={() => supprimer(projet.id)} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info icone={MapPin} label="Localisation" valeur={projet.localisation || "Non définie"} /><Info icone={CalendarDays} label="Début" valeur={dateFr(projet.date_debut)} /><Info icone={ClipboardList} label="Budget" valeur={devise(projet.budget_estime)} /><Info icone={CalendarDays} label="Fin prévue" valeur={dateFr(projet.date_fin_prevue)} /></div></article>)}</div>;
}

function ListeEmployes({ employes, chantiers, voir, modifier, supprimer }: { employes: Employe[]; chantiers: Chantier[]; voir: (id: string) => void; modifier: (id: string) => void; supprimer: (id: string) => void }) {
  return <div className="grid gap-4 xl:grid-cols-2">{employes.map((employe) => <article key={employe.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{employe.statut}</span><h3 className="mt-3 text-xl font-black">{employe.nom_complet}</h3><p className="mt-1 text-sm text-muted-foreground">{employe.poste || "Poste non défini"} • {employe.matricule}</p></div><Actions voir={() => voir(employe.id)} modifier={() => modifier(employe.id)} supprimer={() => supprimer(employe.id)} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info icone={UserRound} label="Téléphone" valeur={employe.telephone || "Non défini"} /><Info icone={ClipboardList} label="Salaire" valeur={devise(employe.salaire)} /><Info icone={HardHat} label="Chantier assigné" valeur={nomChantier(chantiers, employe.chantier_assigne)} /><Info icone={MapPin} label="Adresse" valeur={employe.adresse || "Non définie"} /></div></article>)}</div>;
}

function ListeChantiers({ chantiers, projets, employes, voir, modifier, supprimer }: { chantiers: Chantier[]; projets: Projet[]; employes: Employe[]; voir: (id: string) => void; modifier: (id: string) => void; supprimer: (id: string) => void }) {
  return <div className="grid gap-4 xl:grid-cols-2">{chantiers.map((chantier) => <article key={chantier.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{chantier.statut}</span><h3 className="mt-3 text-xl font-black">{chantier.nom_chantier}</h3><p className="mt-1 text-sm text-muted-foreground">{chantier.localisation || "Localisation non définie"}</p></div><Actions voir={() => voir(chantier.id)} modifier={() => modifier(chantier.id)} supprimer={() => supprimer(chantier.id)} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info icone={BriefcaseBusiness} label="Projet lié" valeur={nomProjet(projets, chantier.projet_lie)} /><Info icone={HardHat} label="Chef de chantier" valeur={chantier.chef_chantier || nomChef(employes, chantier.chef_chantier)} /><Info icone={CalendarDays} label="Début" valeur={dateFr(chantier.date_debut)} /><Info icone={CalendarDays} label="Fin prévue" valeur={dateFr(chantier.date_fin_prevue)} /></div></article>)}</div>;
}

function Info({ icone: Icon, label, valeur }: { icone: typeof LayoutDashboard; label: string; valeur: string }) {
  return <div className="rounded-xl border border-border bg-background p-3"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-muted-foreground"><Icon className="size-4" />{label}</div><p className="mt-2 text-sm font-bold text-foreground">{valeur}</p></div>;
}

function Modal({ titre, fermer, children }: { titre: string; fermer: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-3 sm:items-center"><section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-document"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-black">{titre}</h2><button className="tool-action" onClick={fermer} aria-label="Fermer"><X className="size-4" /></button></div>{children}</section></div>;
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-foreground">{label}</span>{children}</label>;
}

function FormProjet({ form, setForm, onSubmit, saving }: { form: ProjetForm; setForm: (form: ProjetForm) => void; onSubmit: (event: React.FormEvent) => void; saving: boolean }) {
  return <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><Champ label="Titre du projet"><input className="form-control" value={form.nom_projet} onChange={(e) => setForm({ ...form, nom_projet: e.target.value })} /></Champ><Champ label="Nom du client"><input className="form-control" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} /></Champ><Champ label="Localisation"><input className="form-control" value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} /></Champ><Champ label="Budget estimé"><input className="form-control" type="number" value={form.budget_estime} onChange={(e) => setForm({ ...form, budget_estime: e.target.value })} /></Champ><Champ label="Statut"><select className="form-control" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>{statutsProjet.map((statut) => <option key={statut}>{statut}</option>)}</select></Champ><Champ label="Date de début"><input className="form-control" type="date" value={form.date_debut || ""} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} /></Champ><Champ label="Date de fin prévue"><input className="form-control" type="date" value={form.date_fin_prevue || ""} onChange={(e) => setForm({ ...form, date_fin_prevue: e.target.value })} /></Champ><Champ label="Description"><textarea className="form-control min-h-28" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Champ><button className="primary-action sm:col-span-2" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer le projet"}</button></form>;
}

function FormEmploye({ form, setForm, chantiers, onSubmit, saving }: { form: EmployeForm; setForm: (form: EmployeForm) => void; chantiers: Chantier[]; onSubmit: (event: React.FormEvent) => void; saving: boolean }) {
  return <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><Champ label="Nom complet"><input className="form-control" value={form.nom_complet} onChange={(e) => setForm({ ...form, nom_complet: e.target.value })} /></Champ><Champ label="Poste"><input className="form-control" value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} /></Champ><Champ label="Matricule"><input className="form-control" value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} /></Champ><Champ label="Téléphone"><input className="form-control" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></Champ><Champ label="Salaire"><input className="form-control" type="number" value={form.salaire} onChange={(e) => setForm({ ...form, salaire: e.target.value })} /></Champ><Champ label="Statut"><select className="form-control" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>{statutsEmploye.map((statut) => <option key={statut}>{statut}</option>)}</select></Champ><Champ label="Chantier assigné"><select className="form-control" value={form.chantier_assigne || ""} onChange={(e) => setForm({ ...form, chantier_assigne: e.target.value })}><option value="">Aucun chantier</option>{chantiers.map((chantier) => <option key={chantier.id} value={chantier.id}>{chantier.nom_chantier}</option>)}</select></Champ><Champ label="Adresse"><textarea className="form-control min-h-24" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></Champ><button className="primary-action sm:col-span-2" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer l’employé"}</button></form>;
}

function FormChantier({ form, setForm, projets, employes, onSubmit, saving }: { form: ChantierForm; setForm: (form: ChantierForm) => void; projets: Projet[]; employes: Employe[]; onSubmit: (event: React.FormEvent) => void; saving: boolean }) {
  return <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><Champ label="Nom du chantier"><input className="form-control" value={form.nom_chantier} onChange={(e) => setForm({ ...form, nom_chantier: e.target.value })} /></Champ><Champ label="Localisation"><input className="form-control" value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} /></Champ><Champ label="Projet lié"><select className="form-control" value={form.projet_lie || ""} onChange={(e) => setForm({ ...form, projet_lie: e.target.value })}><option value="">Aucun projet</option>{projets.map((projet) => <option key={projet.id} value={projet.id}>{projet.nom_projet}</option>)}</select></Champ><Champ label="Chef de chantier"><select className="form-control" value={form.chef_chantier} onChange={(e) => setForm({ ...form, chef_chantier: e.target.value })}><option value="">Non assigné</option>{employes.map((employe) => <option key={employe.id} value={employe.nom_complet}>{employe.nom_complet}</option>)}</select></Champ><Champ label="Statut"><select className="form-control" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>{statutsChantier.map((statut) => <option key={statut}>{statut}</option>)}</select></Champ><Champ label="Date de début"><input className="form-control" type="date" value={form.date_debut || ""} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} /></Champ><Champ label="Date de fin prévue"><input className="form-control" type="date" value={form.date_fin_prevue || ""} onChange={(e) => setForm({ ...form, date_fin_prevue: e.target.value })} /></Champ><Champ label="Description"><textarea className="form-control min-h-28" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Champ><button className="primary-action sm:col-span-2" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer le chantier"}</button></form>;
}

function Details({ detail, projets, employes, chantiers, modifier, supprimer }: { detail: Detail; projets: Projet[]; employes: Employe[]; chantiers: Chantier[]; modifier: () => void; supprimer: () => void }) {
  if (!detail) return null;
  const item = detail.type === "projets" ? projets.find((projet) => projet.id === detail.id) : detail.type === "employes" ? employes.find((employe) => employe.id === detail.id) : chantiers.find((chantier) => chantier.id === detail.id);
  if (!item) return <p className="text-muted-foreground">Élément introuvable.</p>;
  const lignes = detail.type === "projets" ? detailProjet(item as Projet) : detail.type === "employes" ? detailEmploye(item as Employe, chantiers) : detailChantier(item as Chantier, projets);
  return <div><div className="grid gap-3 sm:grid-cols-2">{lignes.map((ligne) => <div key={ligne.label} className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{ligne.label}</p><p className="mt-1 font-bold">{ligne.valeur}</p></div>)}</div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><button className="primary-action" onClick={modifier}><Edit3 className="size-4" /> Modifier</button><button className="mini-button tool-red" onClick={supprimer}><Trash2 className="size-4" /> Supprimer</button></div></div>;
}

function detailProjet(projet: Projet) { return [{ label: "Projet", valeur: projet.nom_projet }, { label: "Client", valeur: projet.client }, { label: "Localisation", valeur: projet.localisation }, { label: "Budget estimé", valeur: devise(projet.budget_estime) }, { label: "Statut", valeur: projet.statut }, { label: "Date de début", valeur: dateFr(projet.date_debut) }, { label: "Date de fin prévue", valeur: dateFr(projet.date_fin_prevue) }, { label: "Description", valeur: projet.description || "Aucune description" }]; }
function detailEmploye(employe: Employe, chantiers: Chantier[]) { return [{ label: "Nom complet", valeur: employe.nom_complet }, { label: "Poste", valeur: employe.poste }, { label: "Matricule", valeur: employe.matricule }, { label: "Téléphone", valeur: employe.telephone }, { label: "Adresse", valeur: employe.adresse }, { label: "Salaire", valeur: devise(employe.salaire) }, { label: "Statut", valeur: employe.statut }, { label: "Chantier assigné", valeur: nomChantier(chantiers, employe.chantier_assigne) }]; }
function detailChantier(chantier: Chantier, projets: Projet[]) { return [{ label: "Chantier", valeur: chantier.nom_chantier }, { label: "Localisation", valeur: chantier.localisation }, { label: "Chef de chantier", valeur: chantier.chef_chantier || "Non assigné" }, { label: "Projet lié", valeur: nomProjet(projets, chantier.projet_lie) }, { label: "Statut", valeur: chantier.statut }, { label: "Date de début", valeur: dateFr(chantier.date_debut) }, { label: "Date de fin prévue", valeur: dateFr(chantier.date_fin_prevue) }, { label: "Description", valeur: chantier.description || "Aucune description" }]; }
function nomProjet(projets: Projet[], id?: string | null) { return projets.find((projet) => projet.id === id)?.nom_projet || "Aucun projet"; }
function nomChantier(chantiers: Chantier[], id?: string | null) { return chantiers.find((chantier) => chantier.id === id)?.nom_chantier || "Aucun chantier"; }
function nomChef(employes: Employe[], nom?: string) { return employes.find((employe) => employe.nom_complet === nom)?.nom_complet || "Non assigné"; }
