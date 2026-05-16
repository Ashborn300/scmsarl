import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, Calendar, Download, FileText, Plus, Save, Trash2, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  creerPdfMouvementsCaisse,
  enregistrerMouvementCaisse,
  listerMouvementsCaisse,
  supprimerMouvementCaisse,
  telechargerPdf,
  voirPdf,
  type DonneesMouvementCaisse,
  type MouvementCaisse,
} from "@/lib/scmDocuments";

const aujourdhui = () => new Date().toISOString().slice(0, 10);

function formaterMontantAffiche(v: number) {
  const fixe = (Math.round(v * 100) / 100).toFixed(2);
  const [ent, dec] = fixe.split(".");
  const signe = ent.startsWith("-") ? "-" : "";
  const entAbs = signe ? ent.slice(1) : ent;
  return signe + entAbs.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "," + dec;
}

function formaterDateFr(iso: string) {
  if (!iso) return "—";
  const [a, m, j] = iso.split("-");
  return `${j}/${m}/${a}`;
}

export function GestionCaisseTool({ retour }: { retour: () => void }) {
  const [mouvements, setMouvements] = useState<MouvementCaisse[]>([]);
  const [chargement, setChargement] = useState(true);
  const [genererEnCours, setGenererEnCours] = useState(false);

  // Formulaire
  const [editId, setEditId] = useState<string | null>(null);
  const [typeMouvement, setTypeMouvement] = useState<"depot" | "retrait">("depot");
  const [montant, setMontant] = useState("");
  const [devise, setDevise] = useState("USD");
  const [description, setDescription] = useState("");
  const [dateMouvement, setDateMouvement] = useState(aujourdhui());
  const [auteur, setAuteur] = useState("");

  // Filtres
  const [modeFiltre, setModeFiltre] = useState<"jour" | "plage" | "tous">("jour");
  const [filtreJour, setFiltreJour] = useState(aujourdhui());
  const [filtreDebut, setFiltreDebut] = useState(aujourdhui());
  const [filtreFin, setFiltreFin] = useState(aujourdhui());

  async function recharger() {
    setChargement(true);
    try {
      const data = await listerMouvementsCaisse();
      setMouvements(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { recharger(); }, []);

  const { dateDebutActif, dateFinActif } = useMemo(() => {
    if (modeFiltre === "jour") return { dateDebutActif: filtreJour, dateFinActif: filtreJour };
    if (modeFiltre === "plage") return { dateDebutActif: filtreDebut, dateFinActif: filtreFin };
    return { dateDebutActif: undefined as string | undefined, dateFinActif: undefined as string | undefined };
  }, [modeFiltre, filtreJour, filtreDebut, filtreFin]);

  const mouvementsFiltres = useMemo(() => {
    return mouvements.filter((m) => {
      if (!dateDebutActif && !dateFinActif) return true;
      if (dateDebutActif && m.date_mouvement < dateDebutActif) return false;
      if (dateFinActif && m.date_mouvement > dateFinActif) return false;
      return true;
    });
  }, [mouvements, dateDebutActif, dateFinActif]);

  const totalDepots = mouvementsFiltres.filter((m) => m.type_mouvement === "depot").reduce((s, m) => s + Number(m.montant || 0), 0);
  const totalRetraits = mouvementsFiltres.filter((m) => m.type_mouvement === "retrait").reduce((s, m) => s + Number(m.montant || 0), 0);
  const soldePeriode = totalDepots - totalRetraits;

  const soldeGlobal = useMemo(() => {
    return mouvements.reduce((s, m) => s + (m.type_mouvement === "depot" ? 1 : -1) * Number(m.montant || 0), 0);
  }, [mouvements]);

  function reinit() {
    setEditId(null);
    setTypeMouvement("depot");
    setMontant("");
    setDescription("");
    setDateMouvement(aujourdhui());
    setAuteur("");
  }

  function editer(m: MouvementCaisse) {
    setEditId(m.id);
    setTypeMouvement(m.type_mouvement);
    setMontant(String(m.montant));
    setDevise(m.devise || "USD");
    setDescription(m.description || "");
    setDateMouvement(m.date_mouvement);
    setAuteur(m.auteur || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const m = Number(montant);
    if (!Number.isFinite(m) || m <= 0) return alert("Veuillez saisir un montant valide.");
    if (!dateMouvement) return alert("Veuillez choisir une date.");
    try {
      const payload: DonneesMouvementCaisse = {
        type_mouvement: typeMouvement,
        montant: m,
        devise: devise || "USD",
        description: description.trim(),
        date_mouvement: dateMouvement,
        auteur: auteur.trim(),
      };
      await enregistrerMouvementCaisse(payload, editId || undefined);
      reinit();
      await recharger();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Enregistrement impossible.");
    }
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer définitivement ce mouvement ?")) return;
    try {
      await supprimerMouvementCaisse(id);
      await recharger();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Suppression impossible.");
    }
  }

  async function genererPdf(action: "voir" | "telecharger") {
    if (mouvementsFiltres.length === 0) {
      if (!confirm("Aucun mouvement sur cette période. Générer quand même un rapport vide ?")) return;
    }
    setGenererEnCours(true);
    try {
      const pdf = await creerPdfMouvementsCaisse({
        mouvements: mouvementsFiltres,
        dateDebut: dateDebutActif,
        dateFin: dateFinActif,
        devise,
      });
      const nom = `caisse-${dateDebutActif || "tous"}${dateFinActif && dateFinActif !== dateDebutActif ? `-${dateFinActif}` : ""}`;
      if (action === "voir") voirPdf(pdf);
      else telechargerPdf(pdf, nom);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Génération PDF impossible.");
    } finally {
      setGenererEnCours(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-10 xl:px-12 tool-blue">
      <div className="mx-auto w-full max-w-[1500px]">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-4" /> Retour au tableau de bord
        </button>

        <div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <Wallet className="size-3.5" /> SCM SARL · Caisse
          </span>
          <h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Gestion de caisse</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Enregistrez les dépôts et retraits, suivez le solde en temps réel et exportez un rapport PDF officiel par jour ou sur une période.</p>
          <div className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-tool-foreground/15 px-4 py-3">
            <Wallet className="size-6" />
            <div>
              <p className="text-xs uppercase opacity-80">Solde total actuel</p>
              <p className="text-2xl font-black leading-none">{formaterMontantAffiche(soldeGlobal)} {devise}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] xl:gap-8">
          {/* Formulaire */}
          <form onSubmit={soumettre} className="rounded-2xl border border-border bg-card/95 p-5 shadow-document lg:p-6 lg:sticky lg:top-4 lg:self-start">
            <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-lg font-black text-foreground">{editId ? "Modifier le mouvement" : "Nouveau mouvement"}</h2>
              {editId && (
                <button type="button" onClick={reinit} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" /> Annuler
                </button>
              )}
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setTypeMouvement("depot")} className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition ${typeMouvement === "depot" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border bg-muted/40 text-muted-foreground hover:border-emerald-300"}`}>
                <ArrowDownCircle className="size-5" /> Dépôt
              </button>
              <button type="button" onClick={() => setTypeMouvement("retrait")} className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition ${typeMouvement === "retrait" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-border bg-muted/40 text-muted-foreground hover:border-rose-300"}`}>
                <ArrowUpCircle className="size-5" /> Retrait
              </button>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Montant *</span>
                <div className="flex gap-2">
                  <input type="number" min="0" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="0.00" className="form-control flex-1" required />
                  <select value={devise} onChange={(e) => setDevise(e.target.value)} className="form-control w-24">
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Date du mouvement *</span>
                <input type="date" value={dateMouvement} onChange={(e) => setDateMouvement(e.target.value)} className="form-control" required />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Description / motif</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="form-control min-h-20" placeholder={typeMouvement === "depot" ? "Ex : Encaissement client Mwamba" : "Ex : Achat ciment chantier Lemba"} />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Auteur / responsable</span>
                <input value={auteur} onChange={(e) => setAuteur(e.target.value)} placeholder="Nom de la personne" className="form-control" />
              </label>

              <button type="submit" className="primary-action mt-2">
                {editId ? <><Save className="size-4" /> Réenregistrer</> : <><Plus className="size-4" /> Enregistrer le mouvement</>}
              </button>
            </div>
          </form>

          {/* Liste + filtres */}
          <div className="space-y-5">
            {/* Filtres */}
            <section className="rounded-2xl border border-border bg-card/95 p-5 shadow-document lg:p-6">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                <h2 className="text-lg font-black text-foreground">Visualisation & filtres</h2>
              </div>
              <div className="mb-4 inline-flex rounded-xl border border-border bg-muted/40 p-1 text-xs font-semibold">
                {(["jour", "plage", "tous"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setModeFiltre(m)} className={`rounded-lg px-3 py-1.5 transition ${modeFiltre === m ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
                    {m === "jour" ? "Un jour" : m === "plage" ? "Plage de dates" : "Tous"}
                  </button>
                ))}
              </div>

              {modeFiltre === "jour" && (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground">Date</span>
                  <input type="date" value={filtreJour} onChange={(e) => setFiltreJour(e.target.value)} className="form-control max-w-xs" />
                </label>
              )}
              {modeFiltre === "plage" && (
                <div className="grid gap-3 sm:grid-cols-2 sm:max-w-md">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-muted-foreground">Du</span>
                    <input type="date" value={filtreDebut} onChange={(e) => setFiltreDebut(e.target.value)} className="form-control" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-muted-foreground">Au</span>
                    <input type="date" value={filtreFin} onChange={(e) => setFiltreFin(e.target.value)} className="form-control" />
                  </label>
                </div>
              )}

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Dépôts</p>
                  <p className="text-base font-black text-emerald-700 sm:text-lg">+ {formaterMontantAffiche(totalDepots)}</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-rose-700">Retraits</p>
                  <p className="text-base font-black text-rose-700 sm:text-lg">- {formaterMontantAffiche(totalRetraits)}</p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Solde période</p>
                  <p className="text-base font-black text-primary sm:text-lg">{formaterMontantAffiche(soldePeriode)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={genererEnCours} onClick={() => genererPdf("voir")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50">
                  <FileText className="size-4" /> Aperçu PDF
                </button>
                <button type="button" disabled={genererEnCours} onClick={() => genererPdf("telecharger")} className="primary-action">
                  <Download className="size-4" /> {genererEnCours ? "Génération…" : "Télécharger PDF"}
                </button>
              </div>
            </section>

            {/* Liste mouvements */}
            <section className="rounded-2xl border border-border bg-card/95 p-5 shadow-document lg:p-6">
              <h2 className="mb-3 text-lg font-black text-foreground">
                Mouvements {mouvementsFiltres.length > 0 && <span className="text-sm font-semibold text-muted-foreground">· {mouvementsFiltres.length}</span>}
              </h2>
              {chargement ? (
                <p className="rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">Chargement…</p>
              ) : mouvementsFiltres.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-muted/60 p-6 text-center text-sm text-muted-foreground">Aucun mouvement sur la période sélectionnée.</p>
              ) : (
                <ul className="space-y-2">
                  {mouvementsFiltres.map((m) => {
                    const estDepot = m.type_mouvement === "depot";
                    return (
                      <li key={m.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${estDepot ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {estDepot ? <ArrowDownCircle className="size-5" /> : <ArrowUpCircle className="size-5" />}
                          </span>
                          <div className="min-w-0">
                            <p className={`text-base font-black ${estDepot ? "text-emerald-700" : "text-rose-700"}`}>
                              {estDepot ? "+" : "-"} {formaterMontantAffiche(Number(m.montant || 0))} {m.devise}
                            </p>
                            <p className="text-xs font-semibold text-muted-foreground">
                              {formaterDateFr(m.date_mouvement)} {m.auteur ? `· ${m.auteur}` : ""}
                            </p>
                            {m.description && <p className="mt-1 text-sm text-foreground/90 line-clamp-2">{m.description}</p>}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => editer(m)} className="tool-action" aria-label="Modifier">
                            <Save className="size-4" />
                          </button>
                          <button type="button" onClick={() => supprimer(m.id)} className="tool-action danger" aria-label="Supprimer">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
