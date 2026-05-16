import { AlertCircle, ArrowLeft, Calendar, CheckCircle2, Download, FileText, Phone, Plus, Receipt, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  creerPdfDettes,
  enregistrerDette,
  listerDettes,
  supprimerDette,
  telechargerPdf,
  voirPdf,
  type Dette,
  type DonneesDette,
} from "@/lib/scmDocuments";

const aujourdhui = () => new Date().toISOString().slice(0, 10);

function formaterMontantAffiche(v: number) {
  const fixe = (Math.round(v * 100) / 100).toFixed(2);
  const [ent, dec] = fixe.split(".");
  return ent.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "," + dec;
}

function formaterDateFr(iso: string) {
  if (!iso) return "—";
  const [a, m, j] = iso.split("-");
  return `${j}/${m}/${a}`;
}

function joursRestants(datePaiement: string): number {
  const aujourd = new Date(aujourdhui()).getTime();
  const cible = new Date(datePaiement).getTime();
  return Math.round((cible - aujourd) / (1000 * 60 * 60 * 24));
}

export function GestionDettesTool({ retour }: { retour: () => void }) {
  const [dettes, setDettes] = useState<Dette[]>([]);
  const [chargement, setChargement] = useState(true);
  const [genererEnCours, setGenererEnCours] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [nomContractant, setNomContractant] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [montant, setMontant] = useState("");
  const [devise, setDevise] = useState("USD");
  const [dateDette, setDateDette] = useState(aujourdhui());
  const [datePaiement, setDatePaiement] = useState(aujourdhui());
  const [notes, setNotes] = useState("");
  const [statut, setStatut] = useState<"en_cours" | "paye">("en_cours");

  async function recharger() {
    setChargement(true);
    try {
      const data = await listerDettes();
      setDettes(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { recharger(); }, []);

  // Tri par date de paiement croissante (le plus proche en premier)
  const dettesTriees = useMemo(() => {
    return [...dettes].sort((a, b) => {
      if (a.statut === "paye" && b.statut !== "paye") return 1;
      if (b.statut === "paye" && a.statut !== "paye") return -1;
      return a.date_paiement.localeCompare(b.date_paiement);
    });
  }, [dettes]);

  const totalDu = dettes.filter((d) => d.statut !== "paye").reduce((s, d) => s + Number(d.montant || 0), 0);
  const nbEnRetard = dettes.filter((d) => d.statut !== "paye" && d.date_paiement < aujourdhui()).length;

  function reinit() {
    setEditId(null);
    setNomContractant("");
    setTelephone("");
    setAdresse("");
    setMontant("");
    setDateDette(aujourdhui());
    setDatePaiement(aujourdhui());
    setNotes("");
    setStatut("en_cours");
  }

  function editer(d: Dette) {
    setEditId(d.id);
    setNomContractant(d.nom_contractant);
    setTelephone(d.telephone);
    setAdresse(d.adresse);
    setMontant(String(d.montant));
    setDevise(d.devise || "USD");
    setDateDette(d.date_dette);
    setDatePaiement(d.date_paiement);
    setNotes(d.notes || "");
    setStatut((d.statut as "en_cours" | "paye") || "en_cours");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!nomContractant.trim()) return alert("Le nom du contractant est requis.");
    const m = Number(montant);
    if (!Number.isFinite(m) || m <= 0) return alert("Veuillez saisir un montant valide.");
    if (!datePaiement) return alert("Veuillez choisir la date de paiement.");
    try {
      const payload: DonneesDette = {
        nom_contractant: nomContractant.trim(),
        telephone: telephone.trim(),
        adresse: adresse.trim(),
        montant: m,
        devise: devise || "USD",
        date_dette: dateDette,
        date_paiement: datePaiement,
        notes: notes.trim(),
        statut,
      };
      await enregistrerDette(payload, editId || undefined);
      reinit();
      await recharger();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Enregistrement impossible.");
    }
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer définitivement cette dette ?")) return;
    try {
      await supprimerDette(id);
      await recharger();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Suppression impossible.");
    }
  }

  async function basculerStatut(d: Dette) {
    try {
      await enregistrerDette({
        nom_contractant: d.nom_contractant,
        telephone: d.telephone,
        adresse: d.adresse,
        montant: d.montant,
        devise: d.devise,
        date_dette: d.date_dette,
        date_paiement: d.date_paiement,
        notes: d.notes,
        statut: d.statut === "paye" ? "en_cours" : "paye",
      }, d.id);
      await recharger();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Mise à jour impossible.");
    }
  }

  async function genererPdf(action: "voir" | "telecharger") {
    if (dettes.length === 0) {
      if (!confirm("Aucune dette enregistrée. Générer quand même un rapport vide ?")) return;
    }
    setGenererEnCours(true);
    try {
      const pdf = await creerPdfDettes({ dettes: dettesTriees, devise });
      const nom = `dettes-${aujourdhui()}`;
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

        <div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-10" style={{ background: "linear-gradient(135deg, #881337, #d97706)" }}>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            <Receipt className="size-3.5" /> SCM SARL · Dettes
          </span>
          <h1 className="max-w-3xl text-3xl font-black text-white lg:text-5xl">Gestion de dettes</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90 text-white lg:text-base">Enregistrez vos dettes, classées automatiquement par échéance la plus proche, et exportez la liste en PDF officiel.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:max-w-2xl">
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              <p className="text-xs uppercase text-white/80">Total dû</p>
              <p className="text-2xl font-black leading-none text-white">{formaterMontantAffiche(totalDu)} {devise}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              <p className="text-xs uppercase text-white/80">En retard</p>
              <p className="text-2xl font-black leading-none text-white">{nbEnRetard}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] xl:gap-8">
          <form onSubmit={soumettre} className="rounded-2xl border border-border bg-card/95 p-5 shadow-document lg:p-6 lg:sticky lg:top-4 lg:self-start">
            <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-lg font-black text-foreground">{editId ? "Modifier la dette" : "Nouvelle dette"}</h2>
              {editId && (
                <button type="button" onClick={reinit} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" /> Annuler
                </button>
              )}
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Nom du contractant *</span>
                <input value={nomContractant} onChange={(e) => setNomContractant(e.target.value)} placeholder="Ex : Jean Mwamba" className="form-control" required />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Téléphone</span>
                <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+243 ..." className="form-control" />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Adresse</span>
                <textarea value={adresse} onChange={(e) => setAdresse(e.target.value)} rows={2} className="form-control min-h-16" placeholder="Quartier, commune, ville…" />
              </label>

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

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-foreground">Date de la dette *</span>
                  <input type="date" value={dateDette} onChange={(e) => setDateDette(e.target.value)} className="form-control" required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-foreground">Date de paiement *</span>
                  <input type="date" value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} className="form-control" required />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Notes</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="form-control min-h-16" placeholder="Détails complémentaires…" />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Statut</span>
                <select value={statut} onChange={(e) => setStatut(e.target.value as "en_cours" | "paye")} className="form-control">
                  <option value="en_cours">En cours</option>
                  <option value="paye">Payée</option>
                </select>
              </label>

              <button type="submit" className="primary-action mt-2">
                {editId ? <><Save className="size-4" /> Réenregistrer</> : <><Plus className="size-4" /> Enregistrer la dette</>}
              </button>
            </div>
          </form>

          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-card/95 p-5 shadow-document lg:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="size-5 text-primary" />
                  <h2 className="text-lg font-black text-foreground">Liste des dettes <span className="ml-1 text-sm font-semibold text-muted-foreground">· classées par échéance</span></h2>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={genererEnCours} onClick={() => genererPdf("voir")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50">
                    <FileText className="size-4" /> Aperçu PDF
                  </button>
                  <button type="button" disabled={genererEnCours} onClick={() => genererPdf("telecharger")} className="primary-action">
                    <Download className="size-4" /> {genererEnCours ? "…" : "Télécharger PDF"}
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/95 p-5 shadow-document lg:p-6">
              {chargement ? (
                <p className="rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">Chargement…</p>
              ) : dettesTriees.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-muted/60 p-6 text-center text-sm text-muted-foreground">Aucune dette enregistrée.</p>
              ) : (
                <ul className="space-y-2">
                  {dettesTriees.map((d) => {
                    const jours = joursRestants(d.date_paiement);
                    const estPaye = d.statut === "paye";
                    const enRetard = !estPaye && jours < 0;
                    const proche = !estPaye && jours >= 0 && jours <= 7;
                    return (
                      <li key={d.id} className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between ${estPaye ? "border-emerald-200 bg-emerald-50/50" : enRetard ? "border-rose-300 bg-rose-50/60" : proche ? "border-amber-300 bg-amber-50/60" : "border-border bg-background"}`}>
                        <div className="flex min-w-0 items-start gap-3">
                          <span className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${estPaye ? "bg-emerald-100 text-emerald-700" : enRetard ? "bg-rose-100 text-rose-700" : proche ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}>
                            {estPaye ? <CheckCircle2 className="size-5" /> : enRetard ? <AlertCircle className="size-5" /> : <Receipt className="size-5" />}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-black text-foreground">{d.nom_contractant}</p>
                              {estPaye && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Payée</span>}
                              {enRetard && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">En retard</span>}
                              {proche && <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Bientôt</span>}
                            </div>
                            <p className="text-base font-black text-primary">{formaterMontantAffiche(Number(d.montant || 0))} {d.devise}</p>
                            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                              Dette : {formaterDateFr(d.date_dette)} · Paiement : <span className={enRetard ? "text-rose-700" : ""}>{formaterDateFr(d.date_paiement)}</span>
                              {!estPaye && (jours >= 0 ? ` · dans ${jours}j` : ` · ${Math.abs(jours)}j de retard`)}
                            </p>
                            {d.telephone && <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" />{d.telephone}</p>}
                            {d.adresse && <p className="mt-0.5 text-xs text-muted-foreground">{d.adresse}</p>}
                            {d.notes && <p className="mt-1 text-sm text-foreground/90 line-clamp-2">{d.notes}</p>}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => basculerStatut(d)} className="tool-action" aria-label={estPaye ? "Marquer en cours" : "Marquer payée"} title={estPaye ? "Marquer en cours" : "Marquer payée"}>
                            <CheckCircle2 className="size-4" />
                          </button>
                          <button type="button" onClick={() => editer(d)} className="tool-action" aria-label="Modifier">
                            <Save className="size-4" />
                          </button>
                          <button type="button" onClick={() => supprimer(d.id)} className="tool-action danger" aria-label="Supprimer">
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
