import { ArrowLeft, CalendarDays, ClipboardCheck, Clock, Download, FileText, Filter, HardHat, Loader2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  creerPdfArrivees,
  creerPdfPresences,
  formaterHeure,
  listerArriveesChantier,
  listerChantiersBasique,
  listerPresences,
  telechargerPdf,
  voirPdf,
  type ArriveeChantier,
  type ChantierBasique,
  type PresenceRecord,
} from "@/lib/scmDocuments";

const aujourdhui = () => new Date().toISOString().slice(0, 10);

function formaterDateFr(iso: string) {
  if (!iso) return "—";
  const [a, m, j] = iso.split("-");
  return `${j}/${m}/${a}`;
}

type ModeFiltre = "tous" | "jour" | "plage";
type Vue = "presences" | "arrivees";

export function GestionPresenceTool({ retour }: { retour: () => void }) {
  const [vue, setVue] = useState<Vue>("presences");
  const [presences, setPresences] = useState<PresenceRecord[]>([]);
  const [arrivees, setArrivees] = useState<ArriveeChantier[]>([]);
  const [chantiers, setChantiers] = useState<ChantierBasique[]>([]);
  const [chargement, setChargement] = useState(true);
  const [genererEnCours, setGenererEnCours] = useState(false);

  const [mode, setMode] = useState<ModeFiltre>("tous");
  const [jour, setJour] = useState(aujourdhui());
  const [dateDebut, setDateDebut] = useState(aujourdhui());
  const [dateFin, setDateFin] = useState(aujourdhui());
  const [chantierId, setChantierId] = useState<string>("");

  async function recharger() {
    setChargement(true);
    try {
      const filtres: { dateDebut?: string; dateFin?: string; chantierId?: string } = {};
      if (mode === "jour") { filtres.dateDebut = jour; filtres.dateFin = jour; }
      else if (mode === "plage") { filtres.dateDebut = dateDebut; filtres.dateFin = dateFin; }
      if (chantierId) filtres.chantierId = chantierId;
      const [ps, ar, ch] = await Promise.all([
        listerPresences(filtres),
        listerArriveesChantier(filtres),
        chantiers.length ? Promise.resolve(chantiers) : listerChantiersBasique(),
      ]);
      setPresences(ps);
      setArrivees(ar);
      if (!chantiers.length) setChantiers(ch);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { recharger(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [mode, jour, dateDebut, dateFin, chantierId]);

  const nomChantier = (id: string) => chantiers.find((c) => c.id === id)?.nom_chantier || "Chantier inconnu";

  const stats = useMemo(() => {
    let presents = 0, absents = 0, retards = 0, excuses = 0, total = 0;
    for (const p of presences) {
      for (const e of p.employes_presence) {
        total++;
        if (e.statut === "présent") presents++;
        else if (e.statut === "absent") absents++;
        else if (e.statut === "en retard") retards++;
        else if (e.statut === "excusé") excuses++;
      }
    }
    return { presents, absents, retards, excuses, total, rapports: presences.length, arrivees: arrivees.length };
  }, [presences, arrivees]);

  async function genererPdf(action: "voir" | "telecharger") {
    setGenererEnCours(true);
    try {
      const opts = {
        dateDebut: mode === "jour" ? jour : mode === "plage" ? dateDebut : undefined,
        dateFin: mode === "jour" ? jour : mode === "plage" ? dateFin : undefined,
        chantierNom: chantierId ? nomChantier(chantierId) : undefined,
      };
      const pdf = vue === "presences"
        ? await creerPdfPresences({ presences, chantiers, ...opts })
        : await creerPdfArrivees({ arrivees, ...opts });
      const prefixe = vue === "presences" ? "presences" : "arrivees";
      const nom = `${prefixe}-${mode === "jour" ? jour : mode === "plage" ? `${dateDebut}_${dateFin}` : "global"}${chantierId ? "-" + nomChantier(chantierId).replace(/\s+/g, "_") : ""}`;
      if (action === "voir") voirPdf(pdf);
      else telechargerPdf(pdf, nom);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Génération PDF impossible.");
    } finally {
      setGenererEnCours(false);
    }
  }

  function couleurStatut(statut: string) {
    if (statut === "présent") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (statut === "absent") return "bg-rose-100 text-rose-800 border-rose-200";
    if (statut === "en retard") return "bg-amber-100 text-amber-800 border-amber-200";
    if (statut === "excusé") return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-muted text-foreground border-border";
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-10 xl:px-12 tool-blue">
      <div className="mx-auto w-full max-w-[1500px]">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-4" /> Retour au tableau de bord
        </button>

        <div className="mb-6 rounded-3xl p-6 text-white shadow-tool lg:p-10" style={{ background: "linear-gradient(135deg, #1e40af, #10b981)" }}>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <ClipboardCheck className="size-3.5" /> SCM SARL · Présences & Arrivées
          </span>
          <h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Gestion de présence</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Consultez les rapports de présence des chefs de chantier ainsi que les pointages d'arrivée des employés, et exportez en PDF selon la date et le chantier.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-5 sm:max-w-4xl">
            <div className="rounded-2xl bg-white/15 px-4 py-3"><p className="text-xs uppercase opacity-80">Présents</p><p className="text-2xl font-black leading-none">{stats.presents}</p></div>
            <div className="rounded-2xl bg-white/15 px-4 py-3"><p className="text-xs uppercase opacity-80">Absents</p><p className="text-2xl font-black leading-none">{stats.absents}</p></div>
            <div className="rounded-2xl bg-white/15 px-4 py-3"><p className="text-xs uppercase opacity-80">Retards</p><p className="text-2xl font-black leading-none">{stats.retards}</p></div>
            <div className="rounded-2xl bg-white/15 px-4 py-3"><p className="text-xs uppercase opacity-80">Rapports</p><p className="text-2xl font-black leading-none">{stats.rapports}</p></div>
            <div className="rounded-2xl bg-white/15 px-4 py-3"><p className="text-xs uppercase opacity-80">Pointages</p><p className="text-2xl font-black leading-none">{stats.arrivees}</p></div>
          </div>
        </div>

        <div className="mb-5 inline-flex rounded-2xl border border-border bg-card p-1 shadow-document">
          <button type="button" onClick={() => setVue("presences")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${vue === "presences" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <ClipboardCheck className="size-4" /> Rapports chef de chantier
          </button>
          <button type="button" onClick={() => setVue("arrivees")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${vue === "arrivees" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Clock className="size-4" /> Pointages d'arrivée
          </button>
        </div>

        <section className="mb-5 rounded-2xl border border-border bg-card/95 p-5 shadow-document lg:p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
            <Filter className="size-5 text-primary" />
            <h2 className="text-lg font-black text-foreground">Filtres</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
            <div className="flex flex-wrap gap-2">
              {(["tous", "jour", "plage"] as ModeFiltre[]).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary"}`}>
                  {m === "tous" ? "Tout l'historique" : m === "jour" ? "Un jour" : "Plage de dates"}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {mode === "jour" && (
                <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Date</span><input type="date" value={jour} onChange={(e) => setJour(e.target.value)} className="form-control" /></label>
              )}
              {mode === "plage" && (
                <>
                  <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Du</span><input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="form-control" /></label>
                  <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Au</span><input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="form-control" /></label>
                </>
              )}
              <label className={`block ${mode === "tous" ? "sm:col-span-3" : ""}`}>
                <span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Chantier</span>
                <select value={chantierId} onChange={(e) => setChantierId(e.target.value)} className="form-control">
                  <option value="">Tous les chantiers</option>
                  {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom_chantier}</option>)}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <button type="button" disabled={genererEnCours || chargement} onClick={() => genererPdf("voir")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50">
                <FileText className="size-4" /> Aperçu PDF
              </button>
              <button type="button" disabled={genererEnCours || chargement} onClick={() => genererPdf("telecharger")} className="primary-action">
                <Download className="size-4" /> {genererEnCours ? "…" : "Télécharger PDF"}
              </button>
            </div>
          </div>
        </section>

        {vue === "presences" ? (
          <section className="rounded-2xl border border-border bg-card/95 p-5 shadow-document lg:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                <h2 className="text-lg font-black text-foreground">Rapports de présence <span className="ml-1 text-sm font-semibold text-muted-foreground">· {presences.length} rapport(s)</span></h2>
              </div>
              <p className="text-sm text-muted-foreground">{stats.total} pointage(s)</p>
            </div>

            {chargement ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
            ) : presences.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/60 p-6 text-center text-sm text-muted-foreground">Aucune présence pour cette sélection.</p>
            ) : (
              <ul className="space-y-3">
                {presences.map((p) => (
                  <li key={p.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-black text-primary"><CalendarDays className="size-3.5" />{formaterDateFr(p.date)}</span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground"><HardHat className="size-3.5 text-muted-foreground" />{nomChantier(p.chantier_id)}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"><Users className="size-3.5" />{p.employes_presence.length} employé(s)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p.employes_presence.map((e) => (
                        <span key={e.employe_id || e.nom_complet} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${couleurStatut(e.statut)}`}>
                          <span>{e.nom_complet}</span>
                          <span className="opacity-70">·</span>
                          <span className="font-bold uppercase">{e.statut}</span>
                        </span>
                      ))}
                    </div>
                    {p.notes && p.notes.trim() && <p className="mt-3 rounded-lg bg-muted/60 p-2 text-xs italic text-muted-foreground">Note : {p.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="rounded-2xl border border-border bg-card/95 p-5 shadow-document lg:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-primary" />
                <h2 className="text-lg font-black text-foreground">Pointages d'arrivée <span className="ml-1 text-sm font-semibold text-muted-foreground">· {arrivees.length} pointage(s)</span></h2>
              </div>
              <p className="text-sm text-muted-foreground">Heures exactes signalées par les employés</p>
            </div>

            {chargement ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
            ) : arrivees.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/60 p-6 text-center text-sm text-muted-foreground">Aucun pointage d'arrivée pour cette sélection.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-bold uppercase text-muted-foreground">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Heure</th>
                      <th className="px-3 py-2">Employé</th>
                      <th className="px-3 py-2">Matricule</th>
                      <th className="px-3 py-2">Poste</th>
                      <th className="px-3 py-2">Chantier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arrivees.map((a) => (
                      <tr key={a.id} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="px-3 py-2 font-semibold">{formaterDateFr(a.date)}</td>
                        <td className="px-3 py-2"><span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-800"><Clock className="size-3" />{formaterHeure(a.heure_arrivee)}</span></td>
                        <td className="px-3 py-2 font-bold">{a.employe_nom}</td>
                        <td className="px-3 py-2 font-mono text-xs">{a.matricule || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{a.poste || "—"}</td>
                        <td className="px-3 py-2">{a.chantier_nom || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
