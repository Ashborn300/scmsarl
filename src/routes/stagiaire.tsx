import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, GraduationCap, ImageIcon, LogOut, MapPin, Megaphone, UserRound, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import scmLogo from "@/assets/scm-logo.jpeg";

export const Route = createFileRoute("/stagiaire")({
  head: () => ({
    meta: [
      { title: "SCM SARL — Espace stagiaire" },
      { name: "description", content: "Espace personnel des stagiaires SCM SARL : infos, chantier assigné et annonces." },
    ],
  }),
  component: StagiairePage,
});

const db = supabase as any;
const KEY = "scm-stagiaire-matricule";

type Stagiaire = {
  id: string;
  nom_complet: string;
  adresse: string;
  telephone: string;
  niveau_etude: string;
  ecole: string;
  motivation: string;
  statut: string;
  matricule: string;
  chantier_id: string | null;
  photo_profil: string;
  created_at: string;
};

type Chantier = {
  id: string;
  nom_chantier: string;
  localisation: string;
  description: string;
  statut: string;
  images_chantier: string[];
  employes_assignes: string[];
};

type Employe = { id: string; nom_complet: string; poste: string; photo_profil: string };
type Annonce = { id: string; titre: string; contenu: string; destinataires: string[]; created_at: string };

function StagiairePage() {
  const [matricule, setMatricule] = useState("");
  const [stagiaire, setStagiaire] = useState<Stagiaire | null>(null);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [equipe, setEquipe] = useState<Employe[]>([]);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const m = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (m) connecter(m, true);
  }, []);

  async function connecter(mat: string, silencieux = false) {
    setErreur("");
    setChargement(true);
    try {
      const { data, error } = await db.from("stagiaires").select("*").eq("matricule", mat.trim()).eq("statut", "valide").maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) {
        if (!silencieux) setErreur("Matricule invalide ou demande non encore validée.");
        if (silencieux) localStorage.removeItem(KEY);
        return;
      }
      setStagiaire(data);
      localStorage.setItem(KEY, mat.trim());
      await chargerContexte(data);
    } catch (err) {
      if (!silencieux) setErreur(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setChargement(false);
    }
  }

  async function chargerContexte(s: Stagiaire) {
    if (s.chantier_id) {
      const { data: c } = await db.from("chantiers").select("id, nom_chantier, localisation, description, statut, images_chantier, employes_assignes").eq("id", s.chantier_id).maybeSingle();
      setChantier(c || null);
      if (c?.employes_assignes?.length) {
        const { data: emps } = await db.from("employes").select("id, nom_complet, poste, photo_profil").in("id", c.employes_assignes);
        setEquipe(emps || []);
      } else {
        setEquipe([]);
      }
    } else {
      setChantier(null);
      setEquipe([]);
    }
    const { data: anns } = await db.from("annonces_stagiaires").select("*").contains("destinataires", [s.id]).order("created_at", { ascending: false });
    setAnnonces(anns || []);
  }

  function deconnecter() {
    localStorage.removeItem(KEY);
    setStagiaire(null);
    setChantier(null);
    setEquipe([]);
    setAnnonces([]);
    setMatricule("");
  }

  if (!stagiaire) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] px-4 py-10 text-white">
        <div className="mx-auto max-w-md">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
            <ArrowLeft className="size-4" /> Accueil
          </Link>
          <div className="rounded-3xl border border-white/15 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center gap-3">
              <img src={scmLogo} alt="SCM" className="h-12 w-20 rounded-lg bg-white/10 object-contain p-1" />
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  <GraduationCap className="size-3" /> Stagiaire
                </span>
                <h1 className="text-xl font-black">Espace stagiaire</h1>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); connecter(matricule); }} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/80">Matricule</span>
                <input value={matricule} onChange={(e) => setMatricule(e.target.value)} placeholder="Ex : STG-2026-00001" className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40" required />
              </label>
              {erreur && <p className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100">{erreur}</p>}
              <button type="submit" disabled={chargement} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-black text-[#0f3460] transition hover:bg-white/90 disabled:opacity-60">
                {chargement ? "Connexion…" : "Se connecter"}
              </button>
            </form>
            <p className="mt-5 text-center text-xs text-white/70">
              Pas encore stagiaire ?{" "}
              <Link to="/stage" className="font-bold text-white underline">Faire une demande</Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95 px-4 py-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={scmLogo} alt="SCM" className="h-10 w-16 rounded-md object-contain" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Espace stagiaire</p>
              <h1 className="text-base font-black text-foreground sm:text-lg">{stagiaire.nom_complet}</h1>
            </div>
          </div>
          <button type="button" onClick={deconnecter} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold text-foreground hover:border-rose-400 hover:text-rose-600">
            <LogOut className="size-4" /> <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        {/* Identité */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-document sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-foreground">
            <UserRound className="size-5 text-primary" /> Mes informations personnelles
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Matricule" value={stagiaire.matricule} accent />
            <Info label="Nom complet" value={stagiaire.nom_complet} />
            <Info label="Téléphone" value={stagiaire.telephone || "—"} />
            <Info label="Adresse" value={stagiaire.adresse || "—"} />
            <Info label="Niveau d’étude" value={stagiaire.niveau_etude || "—"} />
            <Info label="École / université" value={stagiaire.ecole || "—"} />
          </div>
        </section>

        {/* Annonces */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-document sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-foreground">
            <Megaphone className="size-5 text-primary" /> Annonces
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{annonces.length}</span>
          </h2>
          {annonces.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">Aucune annonce pour le moment.</p>
          ) : (
            <ul className="space-y-3">
              {annonces.map((a) => (
                <li key={a.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-black text-foreground">{a.titre}</h3>
                    <span className="shrink-0 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{a.contenu}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Chantier */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-document sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-foreground">
            <Building2 className="size-5 text-primary" /> Mon chantier assigné
          </h2>
          {!chantier ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">Aucun chantier ne vous est encore assigné.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-black text-foreground">{chantier.nom_chantier}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {chantier.localisation && (<span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {chantier.localisation}</span>)}
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{chantier.statut}</span>
                </div>
                {chantier.description && <p className="mt-3 text-sm text-foreground/90">{chantier.description}</p>}
              </div>

              {/* Photos / étapes de construction */}
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                  <ImageIcon className="size-4" /> Étapes de construction
                </h4>
                {chantier.images_chantier?.length ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {chantier.images_chantier.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="group relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                        <img src={url} alt={`Étape ${i + 1}`} loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">Aucune photo disponible.</p>
                )}
              </div>

              {/* Équipe */}
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                  <UsersRound className="size-4" /> Équipe du chantier
                </h4>
                {equipe.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">Aucun employé assigné.</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {equipe.map((e) => (
                      <li key={e.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-2.5">
                        {e.photo_profil ? (
                          <img src={e.photo_profil} alt={e.nom_complet} className="size-10 rounded-full object-cover" />
                        ) : (
                          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-5" /></span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">{e.nom_complet}</p>
                          <p className="truncate text-xs text-muted-foreground">{e.poste || "—"}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Info({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
