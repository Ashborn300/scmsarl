import { ArrowLeft, CheckCircle2, Clock, FileDown, HandCoins, Search, Send, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  creerPdfRecuEmploye,
  enregistrerRecuEmploye,
  listerEmployes,
  listerRecusEmployes,
  supprimerRecuEmploye,
  telechargerPdf,
  voirPdf,
  type EmployeRecord,
  type RecuEmployeRecord,
} from "@/lib/scmDocuments";

type ChantierLigne = { id: string; nom_chantier: string; employes_assignes: string[] };

const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function RecuEmployeTool({ retour }: { retour: () => void }) {
  const [employes, setEmployes] = useState<EmployeRecord[]>([]);
  const [chantiers, setChantiers] = useState<ChantierLigne[]>([]);
  const [recus, setRecus] = useState<RecuEmployeRecord[]>([]);
  const [recherche, setRecherche] = useState("");
  const [chantierId, setChantierId] = useState("");
  const [date, setDate] = useState(aujourdhui());
  const [motif, setMotif] = useState("Versement de salaire");
  const [signataireNom, setSignataireNom] = useState("Direction des Ressources Humaines");
  const [signataireFonction, setSignataireFonction] = useState("DRH SCM SARL");
  const [modePaiement, setModePaiement] = useState("Virement bancaire");
  const [selection, setSelection] = useState<Record<string, { selectionne: boolean; montant: string }>>({});
  const [chargement, setChargement] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [filtreHistorique, setFiltreHistorique] = useState("");

  useEffect(() => { void charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      const [emps, chants, hist] = await Promise.all([
        listerEmployes(),
        supabase.from("chantiers").select("id, nom_chantier, employes_assignes").order("created_at", { ascending: false }),
        listerRecusEmployes(),
      ]);
      setEmployes(emps);
      setChantiers((chants.data ?? []) as ChantierLigne[]);
      setRecus(hist);
    } catch (erreur) {
      alert(erreur instanceof Error ? erreur.message : "Chargement impossible.");
    } finally {
      setChargement(false);
    }
  }

  const chantierActif = useMemo(() => chantiers.find((c) => c.id === chantierId) || null, [chantiers, chantierId]);
  const employesEligibles = useMemo(() => {
    if (!chantierActif) return [];
    const ids = new Set(chantierActif.employes_assignes || []);
    const liste = employes.filter((e) => ids.has(e.id));
    if (!recherche.trim()) return liste;
    const q = recherche.trim().toLowerCase();
    return liste.filter((e) => `${e.nom_complet} ${e.matricule} ${e.poste}`.toLowerCase().includes(q));
  }, [employes, chantierActif, recherche]);

  function basculer(id: string, valeur: boolean) {
    setSelection((s) => ({ ...s, [id]: { selectionne: valeur, montant: s[id]?.montant ?? "" } }));
  }
  function changerMontant(id: string, montant: string) {
    setSelection((s) => ({ ...s, [id]: { selectionne: s[id]?.selectionne ?? true, montant } }));
  }
  function toutSelectionner(valeur: boolean) {
    const next: typeof selection = {};
    employesEligibles.forEach((e) => { next[e.id] = { selectionne: valeur, montant: selection[e.id]?.montant ?? "" }; });
    setSelection((s) => ({ ...s, ...next }));
  }

  const totalEnvoi = useMemo(() => employesEligibles.reduce((sum, e) => sum + (selection[e.id]?.selectionne ? Number(selection[e.id]?.montant || 0) : 0), 0), [employesEligibles, selection]);
  const nbSelectionnes = useMemo(() => employesEligibles.filter((e) => selection[e.id]?.selectionne).length, [employesEligibles, selection]);

  async function envoyer() {
    if (!chantierActif) return alert("Sélectionnez un chantier (obligatoire).");
    const cibles = employesEligibles
      .filter((e) => selection[e.id]?.selectionne)
      .map((e) => ({ employe: e, montant: Number(selection[e.id]?.montant || 0) }))
      .filter((c) => c.montant > 0);
    if (!cibles.length) return alert("Sélectionnez au moins un employé avec un montant > 0.");
    if (!confirm(`Envoyer ${cibles.length} reçu(s) pour un total de ${totalEnvoi.toLocaleString("fr-FR")} $ ?`)) return;
    setEnvoi(true);
    const nouveaux: RecuEmployeRecord[] = [];
    const echecs: { nom: string; erreur: string }[] = [];
    try {
      for (const cible of cibles) {
        try {
          const pdf = await creerPdfRecuEmploye({
            numero: "",
            date,
            employe: { nom_complet: cible.employe.nom_complet, matricule: cible.employe.matricule, poste: cible.employe.poste },
            chantierNom: chantierActif.nom_chantier,
            montant: cible.montant,
            motif,
            modePaiement,
            signataireNom,
            signataireFonction,
          });
          // Retry léger sur "Failed to fetch" (réseau transitoire)
          let enregistre: RecuEmployeRecord | null = null;
          let derniereErreur: unknown = null;
          for (let tentative = 0; tentative < 3 && !enregistre; tentative++) {
            try {
              enregistre = await enregistrerRecuEmploye({
                employeId: cible.employe.id,
                employeNom: cible.employe.nom_complet,
                matricule: cible.employe.matricule,
                chantierId: chantierActif.id,
                chantierNom: chantierActif.nom_chantier,
                montant: cible.montant,
                motif,
                date,
                donneesFormulaire: { modePaiement, signataireNom, signataireFonction },
              }, pdf);
            } catch (e) {
              derniereErreur = e;
              await new Promise((r) => setTimeout(r, 600 * (tentative + 1)));
            }
          }
          if (!enregistre) throw derniereErreur instanceof Error ? derniereErreur : new Error("Envoi impossible (réseau).");
          nouveaux.push(enregistre);
        } catch (e) {
          echecs.push({ nom: cible.employe.nom_complet, erreur: e instanceof Error ? e.message : String(e) });
        }
      }
      if (nouveaux.length) setRecus((r) => [...nouveaux, ...r]);
      if (nouveaux.length) setSelection({});
      if (echecs.length) {
        alert(`${nouveaux.length} reçu(s) envoyé(s). ${echecs.length} échec(s) :\n` + echecs.map((f) => `• ${f.nom} : ${f.erreur}`).join("\n"));
      } else {
        alert(`${nouveaux.length} reçu(s) envoyé(s). En attente de confirmation par les employés.`);
      }
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(recu: RecuEmployeRecord) {
    if (recu.statut === "confirme") return alert("Un reçu confirmé ne peut pas être supprimé (le salaire a déjà été ajusté).");
    if (!confirm(`Supprimer le reçu ${recu.numero} ?`)) return;
    await supprimerRecuEmploye(recu.id);
    setRecus((r) => r.filter((item) => item.id !== recu.id));
  }

  const historiqueFiltre = useMemo(() => {
    const q = filtreHistorique.trim().toLowerCase();
    if (!q) return recus;
    return recus.filter((r) => `${r.numero} ${r.employe_nom} ${r.matricule} ${r.chantier_nom} ${r.motif}`.toLowerCase().includes(q));
  }, [recus, filtreHistorique]);

  const totalEnvoye = useMemo(() => recus.reduce((s, r) => s + Number(r.montant || 0), 0), [recus]);
  const totalConfirme = useMemo(() => recus.filter((r) => r.statut === "confirme").reduce((s, r) => s + Number(r.montant || 0), 0), [recus]);
  const totalAttente = useMemo(() => recus.filter((r) => r.statut === "en_attente").reduce((s, r) => s + Number(r.montant || 0), 0), [recus]);

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-employee-receipt">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button>
        <div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8">
          <span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span>
          <h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Reçu employés</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Envoyez des reçus de paiement personnalisables à un ou plusieurs employés d'un chantier. Le montant confirmé est déduit du salaire restant.</p>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <article className="dashboard-card tool-teal rounded-2xl p-4"><p className="text-xs font-black uppercase opacity-85">Total envoyé</p><p className="mt-2 text-2xl font-black">{totalEnvoye.toLocaleString("fr-FR")} $</p></article>
          <article className="dashboard-card tool-green rounded-2xl p-4"><p className="text-xs font-black uppercase opacity-85">Confirmés</p><p className="mt-2 text-2xl font-black">{totalConfirme.toLocaleString("fr-FR")} $</p></article>
          <article className="dashboard-card tool-orange rounded-2xl p-4"><p className="text-xs font-black uppercase opacity-85">En attente</p><p className="mt-2 text-2xl font-black">{totalAttente.toLocaleString("fr-FR")} $</p></article>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-2xl border border-border bg-card/95 p-5 shadow-document">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-tool-gradient text-tool-foreground"><HandCoins className="size-5" /></span>
              <div><h2 className="text-xl font-black text-foreground">Nouvel envoi</h2><p className="text-sm text-muted-foreground">Sélectionnez un chantier puis les employés à payer.</p></div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Chantier *</span>
                <select className="form-control" value={chantierId} onChange={(e) => { setChantierId(e.target.value); setSelection({}); }}>
                  <option value="">— Choisir un chantier —</option>
                  {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom_chantier} ({(c.employes_assignes || []).length} employé·s)</option>)}
                </select>
              </label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Date du paiement</span>
                <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Motif</span>
                <input className="form-control" value={motif} onChange={(e) => setMotif(e.target.value.slice(0, 200))} />
              </label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Mode de paiement</span>
                <input className="form-control" value={modePaiement} onChange={(e) => setModePaiement(e.target.value.slice(0, 100))} />
              </label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Signataire</span>
                <input className="form-control" value={signataireNom} onChange={(e) => setSignataireNom(e.target.value.slice(0, 100))} />
              </label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Fonction du signataire</span>
                <input className="form-control" value={signataireFonction} onChange={(e) => setSignataireFonction(e.target.value.slice(0, 100))} />
              </label>
            </div>

            {chantierActif && (
              <div className="mt-5 rounded-xl bg-muted p-3">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2"><Users className="size-4 text-primary" /><h3 className="font-bold text-foreground">Employés du chantier ({employesEligibles.length})</h3></div>
                  <div className="flex flex-wrap gap-2">
                    <label className="relative"><Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="form-control pl-8" placeholder="Rechercher" value={recherche} onChange={(e) => setRecherche(e.target.value)} /></label>
                    <button type="button" className="mini-button" onClick={() => toutSelectionner(true)}>Tout cocher</button>
                    <button type="button" className="mini-button" onClick={() => toutSelectionner(false)}>Tout décocher</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-auto pr-1">
                  {employesEligibles.length === 0 && <p className="rounded-lg bg-card p-3 text-sm text-muted-foreground">Aucun employé assigné à ce chantier.</p>}
                  {employesEligibles.map((e) => {
                    const sel = selection[e.id]?.selectionne ?? false;
                    return (
                      <div key={e.id} className={`grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-[24px_1fr_140px] ${sel ? "border-primary/60 bg-primary/5" : "border-border"}`}>
                        <input type="checkbox" className="mt-1 size-5" checked={sel} onChange={(ev) => basculer(e.id, ev.target.checked)} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">{e.nom_complet}</p>
                          <p className="truncate text-xs text-muted-foreground">{e.matricule} · {e.poste || "—"}</p>
                        </div>
                        <input type="number" min={0} step="0.01" placeholder="Montant ($)" className="form-control" value={selection[e.id]?.montant ?? ""} onChange={(ev) => changerMontant(e.id, ev.target.value)} disabled={!sel} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 rounded-xl bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{nbSelectionnes} employé·s sélectionné·s</p>
                <p className="text-lg font-black text-foreground">Total à envoyer : {totalEnvoi.toLocaleString("fr-FR")} $</p>
              </div>
              <button disabled={envoi || chargement || !chantierActif || nbSelectionnes === 0} onClick={envoyer} className="primary-action"><Send className="size-4" /> {envoi ? "Envoi…" : "Envoyer les reçus"}</button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-border bg-card/95 p-5 shadow-document">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-foreground">Historique des paiements</h2>
                <label className="relative w-44"><Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="form-control pl-8" placeholder="Filtrer" value={filtreHistorique} onChange={(e) => setFiltreHistorique(e.target.value)} /></label>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-auto pr-1">
                {chargement && <p className="rounded-xl bg-muted p-4 text-sm">Chargement…</p>}
                {!chargement && historiqueFiltre.length === 0 && <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Aucun paiement enregistré.</p>}
                {historiqueFiltre.map((r) => (
                  <article key={r.id} className="rounded-xl border border-border bg-background p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-muted-foreground">{r.numero}</p>
                        <p className="mt-1 truncate text-sm font-bold text-foreground">{r.employe_nom}</p>
                        <p className="text-xs text-muted-foreground">{r.matricule} · {r.chantier_nom || "—"}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase ${r.statut === "confirme" ? "bg-green-500/15 text-green-700" : "bg-orange-500/15 text-orange-700"}`}>
                        {r.statut === "confirme" ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                        {r.statut === "confirme" ? "Confirmé" : "En attente"}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-black text-primary">{Number(r.montant).toLocaleString("fr-FR")} $</p>
                    <p className="text-xs text-muted-foreground">Envoyé le {new Date(r.date_envoi).toLocaleDateString("fr-FR")}{r.date_confirmation ? ` · Confirmé le ${new Date(r.date_confirmation).toLocaleDateString("fr-FR")}` : ""}</p>
                    {r.motif && <p className="mt-1 text-xs text-foreground">{r.motif}</p>}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button type="button" className="tool-action" title="Voir le PDF" onClick={() => voirPdf(r.pdf_base64)}><FileDown className="size-4" /></button>
                      <button type="button" className="tool-action" title="Télécharger" onClick={() => telechargerPdf(r.pdf_base64, r.nom_fichier)}><HandCoins className="size-4" /></button>
                      <button type="button" className="tool-action danger" title="Supprimer" onClick={() => supprimer(r)} disabled={r.statut === "confirme"}><Trash2 className="size-4" /></button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
