import { ArrowLeft, Building2, CheckCircle2, GraduationCap, Megaphone, Phone, Plus, Save, Send, Trash2, UserRound, X, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

type Stagiaire = {
  id: string;
  nom_complet: string;
  adresse: string;
  telephone: string;
  niveau_etude: string;
  ecole: string;
  motivation: string;
  statut: "en_attente" | "valide" | "rejete";
  matricule: string;
  chantier_id: string | null;
  created_at: string;
};
type Chantier = { id: string; nom_chantier: string; localisation: string };
type Annonce = { id: string; titre: string; contenu: string; destinataires: string[]; created_at: string };

type Filtre = "tous" | "en_attente" | "valide" | "rejete";

function genererMatricule() {
  const annee = new Date().getFullYear();
  const n = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `STG-${annee}-${n}`;
}

export function GestionStageTool({ retour }: { retour: () => void }) {
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState<Filtre>("en_attente");

  // Validation modal
  const [validation, setValidation] = useState<Stagiaire | null>(null);
  const [matriculeChoisi, setMatriculeChoisi] = useState("");
  const [chantierChoisi, setChantierChoisi] = useState("");

  // Detail
  const [detail, setDetail] = useState<Stagiaire | null>(null);

  // Annonce
  const [annonceOuverte, setAnnonceOuverte] = useState(false);
  const [aTitre, setATitre] = useState("");
  const [aContenu, setAContenu] = useState("");
  const [aDestinataires, setADestinataires] = useState<string[]>([]);

  async function recharger() {
    setChargement(true);
    try {
      const [{ data: s }, { data: c }, { data: a }] = await Promise.all([
        db.from("stagiaires").select("*").order("created_at", { ascending: false }),
        db.from("chantiers").select("id, nom_chantier, localisation").order("nom_chantier"),
        db.from("annonces_stagiaires").select("*").order("created_at", { ascending: false }),
      ]);
      setStagiaires(s || []);
      setChantiers(c || []);
      setAnnonces(a || []);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { recharger(); }, []);

  const visibles = useMemo(() => {
    if (filtre === "tous") return stagiaires;
    return stagiaires.filter((s) => s.statut === filtre);
  }, [stagiaires, filtre]);

  const stagiairesValides = useMemo(() => stagiaires.filter((s) => s.statut === "valide"), [stagiaires]);

  function ouvrirValidation(s: Stagiaire) {
    setValidation(s);
    setMatriculeChoisi(s.matricule || genererMatricule());
    setChantierChoisi(s.chantier_id || "");
  }

  async function confirmerValidation() {
    if (!validation) return;
    if (!matriculeChoisi.trim()) return alert("Matricule requis.");
    try {
      const { error } = await db.from("stagiaires").update({
        statut: "valide",
        matricule: matriculeChoisi.trim(),
        chantier_id: chantierChoisi || null,
      }).eq("id", validation.id);
      if (error) throw new Error(error.message);
      setValidation(null);
      await recharger();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Validation impossible.");
    }
  }

  async function rejeter(s: Stagiaire) {
    if (!confirm(`Rejeter la demande de ${s.nom_complet} ?`)) return;
    const { error } = await db.from("stagiaires").update({ statut: "rejete" }).eq("id", s.id);
    if (error) return alert(error.message);
    await recharger();
  }

  async function supprimer(s: Stagiaire) {
    if (!confirm(`Supprimer définitivement la demande de ${s.nom_complet} ?`)) return;
    const { error } = await db.from("stagiaires").delete().eq("id", s.id);
    if (error) return alert(error.message);
    await recharger();
  }

  function toggleDestinataire(id: string) {
    setADestinataires((d) => d.includes(id) ? d.filter((x) => x !== id) : [...d, id]);
  }

  async function envoyerAnnonce() {
    if (!aTitre.trim() || !aContenu.trim()) return alert("Titre et contenu requis.");
    if (aDestinataires.length === 0) return alert("Choisissez au moins un destinataire.");
    const { error } = await db.from("annonces_stagiaires").insert({
      titre: aTitre.trim(),
      contenu: aContenu.trim(),
      destinataires: aDestinataires,
    });
    if (error) return alert(error.message);
    setATitre(""); setAContenu(""); setADestinataires([]); setAnnonceOuverte(false);
    await recharger();
  }

  async function supprimerAnnonce(id: string) {
    if (!confirm("Supprimer cette annonce ?")) return;
    const { error } = await db.from("annonces_stagiaires").delete().eq("id", id);
    if (error) return alert(error.message);
    await recharger();
  }

  const nomChantier = (id: string | null) => chantiers.find((c) => c.id === id)?.nom_chantier || "—";

  const compteurs = useMemo(() => ({
    en_attente: stagiaires.filter((s) => s.statut === "en_attente").length,
    valide: stagiaires.filter((s) => s.statut === "valide").length,
    rejete: stagiaires.filter((s) => s.statut === "rejete").length,
    tous: stagiaires.length,
  }), [stagiaires]);

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-[1500px]">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Retour au tableau de bord
        </button>

        <div className="mb-6 rounded-3xl p-6 text-white shadow-tool lg:p-10" style={{ background: "linear-gradient(135deg, #0f3460, #16213e)" }}>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <GraduationCap className="size-3.5" /> SCM SARL · Stages
          </span>
          <h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Gestion des stages</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Validez ou rejetez les demandes de stage, attribuez matricule et chantier, et diffusez des annonces.</p>
          <div className="mt-5 grid gap-3 sm:max-w-2xl sm:grid-cols-4">
            {(["en_attente", "valide", "rejete", "tous"] as Filtre[]).map((f) => (
              <button key={f} type="button" onClick={() => setFiltre(f)} className={`rounded-2xl px-4 py-3 text-left transition ${filtre === f ? "bg-white text-[#0f3460]" : "bg-white/10 hover:bg-white/20"}`}>
                <p className="text-[10px] uppercase opacity-80">{f === "en_attente" ? "En attente" : f === "valide" ? "Validés" : f === "rejete" ? "Rejetés" : "Tous"}</p>
                <p className="text-2xl font-black leading-none">{compteurs[f]}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => setAnnonceOuverte(true)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#0f3460] hover:bg-white/90">
              <Megaphone className="size-4" /> Nouvelle annonce stagiaires
            </button>
            <a href="/stage" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">
              Voir le formulaire public
            </a>
          </div>
        </div>

        {/* Liste demandes */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-document lg:p-6">
          <h2 className="mb-4 text-lg font-black text-foreground">Demandes de stage</h2>
          {chargement ? (
            <p className="rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">Chargement…</p>
          ) : visibles.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/60 p-6 text-center text-sm text-muted-foreground">Aucune demande dans ce filtre.</p>
          ) : (
            <ul className="space-y-3">
              {visibles.map((s) => (
                <li key={s.id} className="rounded-xl border border-border bg-background p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black text-foreground">{s.nom_complet}</p>
                        <StatutBadge statut={s.statut} />
                        {s.matricule && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{s.matricule}</span>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Phone className="size-3" />{s.telephone || "—"}</span>
                        <span className="inline-flex items-center gap-1"><GraduationCap className="size-3" />{s.niveau_etude} · {s.ecole}</span>
                        {s.chantier_id && <span className="inline-flex items-center gap-1"><Building2 className="size-3" />{nomChantier(s.chantier_id)}</span>}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{s.motivation}</p>
                      <button type="button" onClick={() => setDetail(s)} className="mt-2 text-xs font-bold text-primary hover:underline">Voir le détail</button>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {s.statut !== "valide" && (
                        <button type="button" onClick={() => ouvrirValidation(s)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                          <CheckCircle2 className="size-3.5" /> Valider
                        </button>
                      )}
                      {s.statut === "valide" && (
                        <button type="button" onClick={() => ouvrirValidation(s)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:border-primary hover:text-primary">
                          <Save className="size-3.5" /> Modifier
                        </button>
                      )}
                      {s.statut !== "rejete" && (
                        <button type="button" onClick={() => rejeter(s)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">
                          <XCircle className="size-3.5" /> Rejeter
                        </button>
                      )}
                      <button type="button" onClick={() => supprimer(s)} className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground hover:border-rose-400 hover:text-rose-600" aria-label="Supprimer">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Historique annonces */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-document lg:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-foreground">
            <Megaphone className="size-5 text-primary" /> Annonces envoyées
          </h2>
          {annonces.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">Aucune annonce.</p>
          ) : (
            <ul className="space-y-2">
              {annonces.map((a) => (
                <li key={a.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-foreground">{a.titre}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-foreground/80">{a.contenu}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{a.destinataires.length} destinataire(s) · {new Date(a.created_at).toLocaleString("fr-FR")}</p>
                    </div>
                    <button type="button" onClick={() => supprimerAnnonce(a.id)} className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:border-rose-400 hover:text-rose-600" aria-label="Supprimer annonce">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* MODAL validation */}
      {validation && (
        <Modal titre={`Valider ${validation.nom_complet}`} onClose={() => setValidation(null)}>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Matricule</span>
              <div className="flex gap-2">
                <input value={matriculeChoisi} onChange={(e) => setMatriculeChoisi(e.target.value)} className="form-control flex-1" />
                <button type="button" onClick={() => setMatriculeChoisi(genererMatricule())} className="rounded-lg border border-border px-3 text-xs font-bold hover:border-primary hover:text-primary">Générer</button>
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Chantier assigné</span>
              <select value={chantierChoisi} onChange={(e) => setChantierChoisi(e.target.value)} className="form-control">
                <option value="">Aucun pour le moment</option>
                {chantiers.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom_chantier} {c.localisation ? `· ${c.localisation}` : ""}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={confirmerValidation} className="primary-action w-full">
              <CheckCircle2 className="size-4" /> Confirmer la validation
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL detail */}
      {detail && (
        <Modal titre={detail.nom_complet} onClose={() => setDetail(null)}>
          <div className="space-y-2 text-sm">
            <p><strong>Téléphone :</strong> {detail.telephone || "—"}</p>
            <p><strong>Adresse :</strong> {detail.adresse || "—"}</p>
            <p><strong>Niveau d’étude :</strong> {detail.niveau_etude || "—"}</p>
            <p><strong>École :</strong> {detail.ecole || "—"}</p>
            <p><strong>Statut :</strong> {detail.statut}</p>
            {detail.matricule && <p><strong>Matricule :</strong> {detail.matricule}</p>}
            {detail.chantier_id && <p><strong>Chantier :</strong> {nomChantier(detail.chantier_id)}</p>}
            <div>
              <p className="mb-1 font-bold">Motivation :</p>
              <p className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-foreground/90">{detail.motivation}</p>
            </div>
            <p className="text-xs text-muted-foreground">Demande reçue le {new Date(detail.created_at).toLocaleString("fr-FR")}</p>
          </div>
        </Modal>
      )}

      {/* MODAL annonce */}
      {annonceOuverte && (
        <Modal titre="Nouvelle annonce aux stagiaires" onClose={() => setAnnonceOuverte(false)}>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Titre</span>
              <input value={aTitre} onChange={(e) => setATitre(e.target.value)} className="form-control" placeholder="Ex : Réunion mensuelle" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Contenu</span>
              <textarea value={aContenu} onChange={(e) => setAContenu(e.target.value)} rows={5} className="form-control min-h-28" placeholder="Message à diffuser…" />
            </label>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Destinataires ({aDestinataires.length}/{stagiairesValides.length})</span>
                <button type="button" onClick={() => setADestinataires(aDestinataires.length === stagiairesValides.length ? [] : stagiairesValides.map((s) => s.id))} className="text-xs font-bold text-primary hover:underline">
                  {aDestinataires.length === stagiairesValides.length ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
              </div>
              {stagiairesValides.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">Aucun stagiaire validé.</p>
              ) : (
                <ul className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
                  {stagiairesValides.map((s) => (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
                        <input type="checkbox" checked={aDestinataires.includes(s.id)} onChange={() => toggleDestinataire(s.id)} />
                        <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-3.5" /></span>
                        <span className="text-sm font-semibold">{s.nom_complet}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{s.matricule}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" onClick={envoyerAnnonce} className="primary-action w-full">
              <Send className="size-4" /> Envoyer l’annonce
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    en_attente: { label: "En attente", cls: "bg-amber-100 text-amber-800" },
    valide: { label: "Validé", cls: "bg-emerald-100 text-emerald-800" },
    rejete: { label: "Rejeté", cls: "bg-rose-100 text-rose-800" },
  };
  const item = map[statut] || { label: statut, cls: "bg-muted text-foreground" };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.cls}`}>{item.label}</span>;
}

function Modal({ titre, onClose, children }: { titre: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground">{titre}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
