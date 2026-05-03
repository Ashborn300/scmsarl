import { ArrowLeft, Eye, FileDown, Pencil, Plus, Save, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DocumentHistory } from "./DocumentHistory";
import {
  chargerDocumentComplet,
  creerPdfDevisEstimatif,
  enregistrerDevisEstimatif,
  genererNumero,
  telechargerPdf,
  voirPdf,
  type DocumentRecord,
  type EtapeDevisEstimatif,
  type LigneDevisEstimatif,
} from "@/lib/scmDocuments";

const aujourdhui = new Date().toISOString().slice(0, 10);

function lireImage(fichier?: File) {
  return new Promise<string | undefined>((resolve, reject) => {
    if (!fichier) return resolve(undefined);
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(fichier);
  });
}

function nouvelleLigne(): LigneDevisEstimatif {
  return { designation: "", unite: "Pièce", quantite: 1, prixUnitaire: 0 };
}

function nouvelleEtape(num: number): EtapeDevisEstimatif {
  return { titre: `Étape ${num}`, lignes: [nouvelleLigne()] };
}

export function DevisEstimatifTool({ retour }: { retour: () => void }) {
  const [titreDevis, setTitreDevis] = useState("SYNTHÈSE DU DEVIS ESTIMATIF");
  const [projet, setProjet] = useState("");
  const [client, setClient] = useState("");
  const [localisation, setLocalisation] = useState("R.D. CONGO / KINSHASA");
  const [duree, setDuree] = useState("1 MOIS");
  const [adresseChantier, setAdresseChantier] = useState("");
  const [telephone, setTelephone] = useState("");
  const [description, setDescription] = useState("");
  const [imprevuPourcentage, setImprevuPourcentage] = useState(0);
  const [dateDocument, setDateDocument] = useState(aujourdhui);
  const [etapes, setEtapes] = useState<EtapeDevisEstimatif[]>([nouvelleEtape(1)]);
  const [sceau, setSceau] = useState<File>();
  const [signature, setSignature] = useState<File>();
  const [nomImportateur, setNomImportateur] = useState("");
  const [fonctionImportateur, setFonctionImportateur] = useState("Secrétaire d'entreprise");
  const [chargement, setChargement] = useState(false);
  const [actualisation, setActualisation] = useState(0);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [editionNumero, setEditionNumero] = useState<string | null>(null);

  const sousTotaux = etapes.map((e) => e.lignes.reduce((s, l) => s + Number(l.quantite || 0) * Number(l.prixUnitaire || 0), 0));
  const totalGlobal = sousTotaux.reduce((a, b) => a + b, 0);
  const montantImprevu = Math.round(totalGlobal * Number(imprevuPourcentage || 0)) / 100;
  const coutGlobal = totalGlobal + montantImprevu;

  function reinitialiser() {
    setTitreDevis("SYNTHÈSE DU DEVIS ESTIMATIF");
    setProjet(""); setClient(""); setLocalisation("R.D. CONGO / KINSHASA");
    setDuree("1 MOIS"); setAdresseChantier(""); setTelephone(""); setDescription("");
    setImprevuPourcentage(0); setDateDocument(aujourdhui);
    setEtapes([nouvelleEtape(1)]); setSceau(undefined); setSignature(undefined);
    setNomImportateur(""); setFonctionImportateur("Secrétaire d'entreprise");
    setEditionId(null); setEditionNumero(null);
  }

  async function editer(doc: DocumentRecord) {
    try {
      const complet = await chargerDocumentComplet("devis_estimatif", doc.id);
      const d = (complet.donnees_formulaire || {}) as Record<string, unknown>;
      setTitreDevis(String(d.titreDevis || "SYNTHÈSE DU DEVIS ESTIMATIF"));
      setProjet(String(d.projet || "")); setClient(String(d.client || ""));
      setLocalisation(String(d.localisation || "")); setDuree(String(d.duree || ""));
      setAdresseChantier(String(d.adresseChantier || "")); setTelephone(String(d.telephone || ""));
      setDescription(String(d.description || "")); setImprevuPourcentage(Number(d.imprevuPourcentage || 0));
      setDateDocument(String(d.dateDocument || aujourdhui));
      setEtapes(Array.isArray(d.etapes) && d.etapes.length ? (d.etapes as EtapeDevisEstimatif[]) : [nouvelleEtape(1)]);
      setNomImportateur(String(d.nomImportateur || ""));
      setFonctionImportateur(String(d.fonctionImportateur || "Secrétaire d'entreprise"));
      setEditionId(complet.id); setEditionNumero(complet.numero);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur de chargement.");
    }
  }

  async function soumettre(ev: React.FormEvent) {
    ev.preventDefault();
    if (!client.trim() || !projet.trim()) return alert("Veuillez renseigner le projet et le client.");
    if (!etapes.length) return alert("Ajoutez au moins une étape de construction.");
    setChargement(true);
    try {
      const numero = editionNumero || (await genererNumero("devis_estimatif"));
      const sceauBase64 = await lireImage(sceau);
      const signatureBase64 = await lireImage(signature);
      const pdf = await creerPdfDevisEstimatif({
        numero, titreDevis, projet, client, localisation, duree, adresseChantier,
        telephone, description, dateDocument, imprevuPourcentage,
        etapes, sceau: sceauBase64, signature: signatureBase64,
        nomImportateur, fonctionImportateur,
      });
      await enregistrerDevisEstimatif({
        titreDevis, projet, client, localisation, duree, adresseChantier, telephone,
        description, dateDocument, imprevuPourcentage, etapes,
        nomImportateur, fonctionImportateur,
        sousTotaux, totalGlobal, montantImprevu, coutGlobal,
      }, pdf, numero, editionId || undefined);
      alert(editionId ? "Devis estimatif modifié avec succès." : "Devis estimatif généré et enregistré avec succès.");
      reinitialiser();
      setActualisation((n) => n + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally { setChargement(false); }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-10 xl:px-12 tool-yellow">
      <div className="mx-auto w-full max-w-[1600px]">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button>
        <div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span>
              <h1 className="max-w-3xl text-3xl font-black lg:text-5xl xl:text-6xl">Devis estimatif</h1>
              <p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Devis multi-étapes (étapes de construction) avec lignes détaillées, sous-totaux par étape et coût global du projet.</p>
            </div>
            <div className="hidden shrink-0 rounded-2xl bg-tool-foreground/10 p-4 backdrop-blur-sm lg:block lg:min-w-[260px]">
              <p className="text-xs font-bold uppercase tracking-wide opacity-80">Coût global</p>
              <p className="mt-1 text-3xl font-black tabular-nums">{coutGlobal.toLocaleString("fr-FR")} $</p>
              <p className="mt-2 text-xs opacity-90">Total étapes · <span className="font-bold tabular-nums">{totalGlobal.toLocaleString("fr-FR")} $</span></p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)] xl:gap-8">
          <form onSubmit={soumettre} className="rounded-2xl border border-border bg-card/95 p-4 shadow-document lg:p-6 xl:p-8">
            <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-lg font-black text-foreground xl:text-xl">Informations du projet</h2>
              <span className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:inline">{editionNumero ? `Modification · ${editionNumero}` : "Nouveau devis estimatif"}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
              <label className="sm:col-span-2 xl:col-span-3"><span className="mb-1 block text-sm font-semibold text-foreground">Titre du devis *</span><input value={titreDevis} onChange={(e) => setTitreDevis(e.target.value)} className="form-control" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Projet *</span><input value={projet} onChange={(e) => setProjet(e.target.value)} className="form-control" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Client *</span><input value={client} onChange={(e) => setClient(e.target.value)} className="form-control" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Localisation</span><input value={localisation} onChange={(e) => setLocalisation(e.target.value)} className="form-control" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Durée</span><input value={duree} onChange={(e) => setDuree(e.target.value)} className="form-control" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Adresse du chantier</span><input value={adresseChantier} onChange={(e) => setAdresseChantier(e.target.value)} className="form-control" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Téléphone</span><input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="form-control" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Date</span><input type="date" value={dateDocument} onChange={(e) => setDateDocument(e.target.value)} className="form-control" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Imprévu (%)</span><input type="number" min="0" step="0.1" value={imprevuPourcentage} onChange={(e) => setImprevuPourcentage(Number(e.target.value))} className="form-control" /></label>
              <label className="sm:col-span-2 xl:col-span-3"><span className="mb-1 block text-sm font-semibold text-foreground">Description</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="form-control min-h-20" /></label>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-foreground">Étapes de construction</h3>
                <button type="button" onClick={() => setEtapes([...etapes, nouvelleEtape(etapes.length + 1)])} className="mini-button"><Plus className="size-4" /> Ajouter une étape</button>
              </div>

              {etapes.map((etape, ei) => {
                const sousTotal = sousTotaux[ei];
                return (
                  <div key={ei} className="rounded-xl border border-border bg-muted/60 p-4 xl:p-5">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-1 items-center gap-2">
                        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-black uppercase text-primary">Étape {ei + 1}</span>
                        <input value={etape.titre} onChange={(e) => setEtapes(etapes.map((x, i) => i === ei ? { ...x, titre: e.target.value } : x))} placeholder="Titre de l'étape (ex: FERRAILLAGE, COULAGE...)" className="form-control" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setEtapes(etapes.map((x, i) => i === ei ? { ...x, lignes: [...x.lignes, nouvelleLigne()] } : x))} className="mini-button"><Plus className="size-4" /> Ligne</button>
                        {etapes.length > 1 && <button type="button" onClick={() => setEtapes(etapes.filter((_, i) => i !== ei))} className="tool-action danger"><Trash2 className="size-4" /></button>}
                      </div>
                    </div>

                    <div className="mb-2 hidden text-xs font-bold uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_90px_70px_120px_120px_40px] sm:gap-2 sm:px-3"><span>Désignation</span><span>Unité</span><span>Qté</span><span>Prix unitaire</span><span className="text-right">Total ligne</span><span></span></div>

                    <div className="space-y-2">
                      {etape.lignes.map((ligne, li) => {
                        const totalLigne = Number(ligne.quantite || 0) * Number(ligne.prixUnitaire || 0);
                        const updateLigne = (patch: Partial<LigneDevisEstimatif>) => setEtapes(etapes.map((x, i) => i === ei ? { ...x, lignes: x.lignes.map((l, j) => j === li ? { ...l, ...patch } : l) } : x));
                        return (
                          <div key={li} className="grid gap-2 rounded-lg border border-border/60 bg-card p-3 sm:grid-cols-[1fr_90px_70px_120px_120px_40px] sm:items-center">
                            <input placeholder="Désignation" value={ligne.designation} onChange={(e) => updateLigne({ designation: e.target.value })} className="form-control" />
                            <input placeholder="Pièce" value={ligne.unite} onChange={(e) => updateLigne({ unite: e.target.value })} className="form-control" />
                            <input type="number" min="0" value={ligne.quantite} onChange={(e) => updateLigne({ quantite: Number(e.target.value) })} className="form-control" />
                            <input type="number" min="0" step="0.01" value={ligne.prixUnitaire} onChange={(e) => updateLigne({ prixUnitaire: Number(e.target.value) })} className="form-control" />
                            <span className="hidden text-right text-sm font-bold tabular-nums text-foreground sm:block">{totalLigne.toLocaleString("fr-FR")} $</span>
                            <button type="button" onClick={() => setEtapes(etapes.map((x, i) => i === ei ? { ...x, lignes: x.lignes.filter((_, j) => j !== li) } : x))} className="tool-action danger justify-self-end" disabled={etape.lignes.length <= 1}><Trash2 className="size-4" /></button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-4 py-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-primary">Sous-total étape {ei + 1}</span>
                      <strong className="text-base font-black tabular-nums text-primary">{sousTotal.toLocaleString("fr-FR")} $</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-card p-3"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sous-total étapes</p><p className="mt-1 text-base font-black tabular-nums text-foreground">{totalGlobal.toLocaleString("fr-FR")} $</p></div>
              <div className="rounded-lg border border-border/60 bg-card p-3"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Imprévu ({imprevuPourcentage}%)</p><p className="mt-1 text-base font-black tabular-nums text-foreground">{montantImprevu.toLocaleString("fr-FR")} $</p></div>
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3"><p className="text-xs font-bold uppercase tracking-wide text-primary">Coût global du projet</p><p className="mt-1 text-base font-black tabular-nums text-primary">{coutGlobal.toLocaleString("fr-FR")} $</p></div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:gap-5">
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Nom de la personne signataire</span><input value={nomImportateur} onChange={(e) => setNomImportateur(e.target.value)} placeholder="Ex: IR-SOGUE MASOKA" className="form-control" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Fonction du signataire</span><input value={fonctionImportateur} onChange={(e) => setFonctionImportateur(e.target.value)} className="form-control" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Importer le sceau de l'entreprise</span><input type="file" accept="image/*" onChange={(e) => setSceau(e.target.files?.[0])} className="file-input" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Importer la signature</span><input type="file" accept="image/*" onChange={(e) => setSignature(e.target.files?.[0])} className="file-input" /></label>
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/15 p-4 shadow-document sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-lg text-foreground tabular-nums">Coût global : {coutGlobal.toLocaleString("fr-FR")} $</strong>
              <button disabled={chargement} className="primary-action"><Save className="size-4" /> {chargement ? "Génération…" : editionId ? "Réenregistrer le devis" : "Générer et enregistrer le devis"}</button>
            </div>
          </form>

          <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-document xl:p-6">
              <h2 className="text-xl font-bold text-foreground">Devis estimatif officiel</h2>
              <p className="mt-2 text-sm text-muted-foreground">Mise en page identique au modèle SCM SARL : étapes de construction, sous-totaux, récapitulatif général, imprévu et coût global du projet.</p>
            </div>
            <DocumentHistory type="devis_estimatif" actualisation={actualisation} onEdit={editer} />
          </div>
        </div>
      </div>
    </main>
  );
}
