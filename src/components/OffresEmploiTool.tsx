import { ArrowLeft, Briefcase, CheckCircle2, Eye, MapPin, Phone, Trash2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

type Candidature = {
  id: string;
  nom_complet: string;
  telephone: string;
  adresse: string;
  niveau_etude: string;
  poste_vise: string;
  poste_autre: string;
  motivation: string;
  statut: "en_attente" | "retenu" | "rejete";
  created_at: string;
};

type Filtre = "tous" | "en_attente" | "retenu" | "rejete";

function StatutBadge({ statut }: { statut: Candidature["statut"] }) {
  const map: Record<Candidature["statut"], string> = {
    en_attente: "bg-amber-100 text-amber-800 border-amber-200",
    retenu: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejete: "bg-rose-100 text-rose-800 border-rose-200",
  };
  const label = statut === "en_attente" ? "En attente" : statut === "retenu" ? "Retenu" : "Rejeté";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${map[statut]}`}>{label}</span>;
}

export function OffresEmploiTool({ retour }: { retour: () => void }) {
  const [items, setItems] = useState<Candidature[]>([]);
  const [filtre, setFiltre] = useState<Filtre>("en_attente");
  const [posteFiltre, setPosteFiltre] = useState<string>("tous");
  const [chargement, setChargement] = useState(true);
  const [detail, setDetail] = useState<Candidature | null>(null);

  async function recharger() {
    setChargement(true);
    try {
      const { data } = await db.from("candidatures_emploi").select("*").order("created_at", { ascending: false });
      setItems(data || []);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { recharger(); }, []);

  const postesDisponibles = useMemo(() => {
    const set = new Set<string>();
    items.forEach((c) => set.add(c.poste_vise === "Autre" && c.poste_autre ? c.poste_autre : c.poste_vise));
    return Array.from(set).filter(Boolean).sort();
  }, [items]);

  const visibles = useMemo(() => {
    return items.filter((c) => {
      if (filtre !== "tous" && c.statut !== filtre) return false;
      if (posteFiltre !== "tous") {
        const p = c.poste_vise === "Autre" && c.poste_autre ? c.poste_autre : c.poste_vise;
        if (p !== posteFiltre) return false;
      }
      return true;
    });
  }, [items, filtre, posteFiltre]);

  const compteurs = useMemo(() => ({
    en_attente: items.filter((c) => c.statut === "en_attente").length,
    retenu: items.filter((c) => c.statut === "retenu").length,
    rejete: items.filter((c) => c.statut === "rejete").length,
    tous: items.length,
  }), [items]);

  async function changerStatut(c: Candidature, statut: Candidature["statut"]) {
    const { error } = await db.from("candidatures_emploi").update({ statut }).eq("id", c.id);
    if (error) return alert(error.message);
    await recharger();
  }

  async function supprimer(c: Candidature) {
    if (!confirm(`Supprimer la candidature de ${c.nom_complet} ?`)) return;
    const { error } = await db.from("candidatures_emploi").delete().eq("id", c.id);
    if (error) return alert(error.message);
    await recharger();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-[1500px]">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Retour au tableau de bord
        </button>

        <div className="mb-6 rounded-3xl p-6 text-white shadow-tool lg:p-10" style={{ background: "linear-gradient(135deg, #1e40af, #0f172a)" }}>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <Briefcase className="size-3.5" /> SCM SARL · Recrutement
          </span>
          <h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Offres d’emploi</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Consultez les candidatures envoyées via le formulaire public, retenez ou rejetez les profils.</p>

          <div className="mt-5 grid gap-3 sm:max-w-2xl sm:grid-cols-4">
            {(["en_attente", "retenu", "rejete", "tous"] as Filtre[]).map((f) => (
              <button key={f} type="button" onClick={() => setFiltre(f)} className={`rounded-2xl px-4 py-3 text-left transition ${filtre === f ? "bg-white text-[#1e40af]" : "bg-white/10 hover:bg-white/20"}`}>
                <p className="text-[10px] uppercase opacity-80">{f === "en_attente" ? "En attente" : f === "retenu" ? "Retenus" : f === "rejete" ? "Rejetés" : "Tous"}</p>
                <p className="text-2xl font-black leading-none">{compteurs[f]}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a href="/emploi" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">
              Voir le formulaire public
            </a>
            <label className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">
              Poste :
              <select value={posteFiltre} onChange={(e) => setPosteFiltre(e.target.value)} className="rounded-md bg-white px-2 py-1 text-xs font-bold text-[#1e40af]">
                <option value="tous">Tous</option>
                {postesDisponibles.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-document lg:p-6">
          <h2 className="mb-4 text-lg font-black text-foreground">Candidatures reçues</h2>
          {chargement ? (
            <p className="rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">Chargement…</p>
          ) : visibles.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/60 p-6 text-center text-sm text-muted-foreground">Aucune candidature dans ce filtre.</p>
          ) : (
            <ul className="space-y-3">
              {visibles.map((c) => {
                const poste = c.poste_vise === "Autre" && c.poste_autre ? c.poste_autre : c.poste_vise;
                return (
                  <li key={c.id} className="rounded-xl border border-border bg-background p-3 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-black text-foreground">{c.nom_complet}</p>
                          <StatutBadge statut={c.statut} />
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{poste}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Phone className="size-3" />{c.telephone || "—"}</span>
                          {c.adresse && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{c.adresse}</span>}
                          <span>Niveau : {c.niveau_etude || "—"}</span>
                          <span>Reçue le {new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{c.motivation}</p>
                        <button type="button" onClick={() => setDetail(c)} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                          <Eye className="size-3.5" /> Voir le détail
                        </button>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {c.statut !== "retenu" && (
                          <button type="button" onClick={() => changerStatut(c, "retenu")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                            <CheckCircle2 className="size-3.5" /> Retenir
                          </button>
                        )}
                        {c.statut !== "rejete" && (
                          <button type="button" onClick={() => changerStatut(c, "rejete")} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">
                            <XCircle className="size-3.5" /> Rejeter
                          </button>
                        )}
                        <button type="button" onClick={() => supprimer(c)} className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground hover:border-rose-400 hover:text-rose-600" aria-label="Supprimer">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-tool" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-black text-foreground">{detail.nom_complet}</h3>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg border border-border p-1.5 hover:bg-muted"><XCircle className="size-4" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Poste visé :</strong> {detail.poste_vise === "Autre" && detail.poste_autre ? `Autre — ${detail.poste_autre}` : detail.poste_vise}</p>
              <p><strong>Téléphone :</strong> {detail.telephone || "—"}</p>
              <p><strong>Adresse :</strong> {detail.adresse || "—"}</p>
              <p><strong>Niveau d’études :</strong> {detail.niveau_etude || "—"}</p>
              <p><strong>Statut :</strong> {detail.statut}</p>
              <div>
                <p className="mb-1 font-bold">Motivation :</p>
                <p className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-foreground/90">{detail.motivation}</p>
              </div>
              <p className="text-xs text-muted-foreground">Candidature reçue le {new Date(detail.created_at).toLocaleString("fr-FR")}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
