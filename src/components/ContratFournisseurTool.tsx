import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { DocumentHistory } from "./DocumentHistory";
import {
  chargerDocumentComplet,
  creerPdfContratFournisseur,
  enregistrerContratFournisseur,
  genererNumero,
  type DocumentRecord,
  type LigneFourniture,
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

function nouvelleLigne(): LigneFourniture {
  return { description: "", quantite: "" };
}

export function ContratFournisseurTool({ retour }: { retour: () => void }) {
  const [dateDocument, setDateDocument] = useState(aujourdhui);
  const [lieu, setLieu] = useState("Kinshasa");
  const [fournisseurNom, setFournisseurNom] = useState("");
  const [fournisseurTelephone, setFournisseurTelephone] = useState("");
  const [objet, setObjet] = useState("la fourniture de sable destiné aux travaux de construction");
  const [lignes, setLignes] = useState<LigneFourniture[]>([nouvelleLigne()]);
  const [conditionsLivraison, setConditionsLivraison] = useState("Les livraisons s'effectuent aux chantiers indiqués par l'Acheteur, aux dates convenues entre les parties. Tout retard de livraison doit être notifié par écrit dans un délai de 48h.");
  const [modalitesPaiement, setModalitesPaiement] = useState("Le paiement s'effectue par virement bancaire ou Mobile Money, selon les modalités convenues entre les parties, après réception et vérification de la marchandise.");
  const [duree, setDuree] = useState("Le présent contrat prend effet à la date de sa signature et reste valable jusqu'à l'exécution complète des livraisons prévues.");
  const [clauses, setClauses] = useState("Les parties s'engagent à respecter les dispositions légales en vigueur en République Démocratique du Congo. Tout litige sera réglé à l'amiable avant tout recours juridictionnel.");
  const [signataireScmNom, setSignataireScmNom] = useState("");
  const [signataireScmFonction, setSignataireScmFonction] = useState("Directeur Général");
  const [sceauScm, setSceauScm] = useState<File>();
  // signature SCM et sceau fournisseur retirés sur demande

  const [signatureFournisseur, setSignatureFournisseur] = useState<File>();
  const [chargement, setChargement] = useState(false);
  const [actualisation, setActualisation] = useState(0);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [editionNumero, setEditionNumero] = useState<string | null>(null);

  function reinitialiser() {
    setDateDocument(aujourdhui); setLieu("Kinshasa");
    setFournisseurNom(""); setFournisseurTelephone("");
    setLignes([nouvelleLigne()]);
    setSceauScm(undefined);
    setSignatureFournisseur(undefined);
    setSignataireScmNom(""); setEditionId(null); setEditionNumero(null);
  }

  async function editer(doc: DocumentRecord) {
    try {
      const complet = await chargerDocumentComplet("contrat_fournisseur", doc.id);
      const d = (complet.donnees_formulaire || {}) as Record<string, unknown>;
      setDateDocument(String(d.dateDocument || aujourdhui));
      setLieu(String(d.lieu || "Kinshasa"));
      setFournisseurNom(String(d.fournisseurNom || ""));
      setFournisseurTelephone(String(d.fournisseurTelephone || ""));
      setObjet(String(d.objet || ""));
      setLignes(Array.isArray(d.lignes) && d.lignes.length ? (d.lignes as LigneFourniture[]) : [nouvelleLigne()]);
      setConditionsLivraison(String(d.conditionsLivraison || ""));
      setModalitesPaiement(String(d.modalitesPaiement || ""));
      setDuree(String(d.duree || ""));
      setClauses(String(d.clauses || ""));
      setSignataireScmNom(String(d.signataireScmNom || ""));
      setSignataireScmFonction(String(d.signataireScmFonction || "Directeur Général"));
      setEditionId(complet.id); setEditionNumero(complet.numero);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur de chargement.");
    }
  }

  async function soumettre(ev: React.FormEvent) {
    ev.preventDefault();
    if (!fournisseurNom.trim()) return alert("Veuillez renseigner le nom du fournisseur.");
    const lignesValides = lignes.filter((l) => l.description.trim());
    if (!lignesValides.length) return alert("Ajoutez au moins une fourniture à livrer.");
    setChargement(true);
    try {
      const numero = editionNumero || (await genererNumero("contrat_fournisseur"));
      const [sceauScmB64, signatureFB64] = await Promise.all([
        lireImage(sceauScm), lireImage(signatureFournisseur),
      ]);
      const donnees = {
        numero, dateDocument, lieu,
        fournisseurNom, fournisseurRepresentant: "", fournisseurAdresse: "", fournisseurTelephone,
        fournisseurEmail: "", fournisseurRccm: "", fournisseurIdnat: "",
        objet, lignes: lignesValides,
        conditionsLivraison, modalitesPaiement, duree, clauses,
        signataireScmNom, signataireScmFonction,
        sceauScm: sceauScmB64, signatureScm: undefined,
        sceauFournisseur: undefined, signatureFournisseur: signatureFB64,
      };
      const pdf = await creerPdfContratFournisseur(donnees);
      await enregistrerContratFournisseur(donnees, pdf, numero, editionId || undefined);
      alert(editionId ? "Contrat modifié avec succès." : "Contrat avec fournisseur généré et enregistré avec succès.");
      reinitialiser();
      setActualisation((n) => n + 1);
    } catch (e) {
      console.error("[ContratFournisseur] Erreur génération:", e);
      alert(e instanceof Error ? `Erreur : ${e.message}` : "Une erreur est survenue lors de la génération du PDF.");
    } finally { setChargement(false); }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-10 xl:px-12 tool-blue">
      <div className="mx-auto w-full max-w-[1600px]">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-4" /> Retour au tableau de bord
        </button>
        <div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-10">
          <span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span>
          <h1 className="max-w-3xl text-3xl font-black lg:text-5xl xl:text-6xl">Contrat avec fournisseur</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Générez un contrat de fourniture officiel SCM SARL avec liste détaillée des éléments à livrer, conditions et signatures.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)] xl:gap-8">
          <form onSubmit={soumettre} className="rounded-2xl border border-border bg-card/95 p-4 shadow-document lg:p-6 xl:p-8">
            <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-lg font-black text-foreground xl:text-xl">Identité du fournisseur</h2>
              <span className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:inline">{editionNumero ? `Modification · ${editionNumero}` : "Nouveau contrat"}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:gap-5">
              <label className="sm:col-span-2"><span className="mb-1 block text-sm font-semibold text-foreground">Nom du fournisseur / société *</span><input value={fournisseurNom} onChange={(e) => setFournisseurNom(e.target.value)} className="form-control" /></label>
              <label className="sm:col-span-2"><span className="mb-1 block text-sm font-semibold text-foreground">Numéro de téléphone</span><input value={fournisseurTelephone} onChange={(e) => setFournisseurTelephone(e.target.value)} className="form-control" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Date du contrat</span><input type="date" value={dateDocument} onChange={(e) => setDateDocument(e.target.value)} className="form-control" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Lieu de signature</span><input value={lieu} onChange={(e) => setLieu(e.target.value)} className="form-control" /></label>
            </div>

            <div className="mt-6 border-t border-border/60 pt-5">
              <h2 className="mb-3 text-lg font-black text-foreground xl:text-xl">Objet du contrat</h2>
              <label className="block"><span className="mb-1 block text-sm font-semibold text-foreground">Le présent contrat a pour objet…</span>
                <textarea value={objet} onChange={(e) => setObjet(e.target.value)} rows={2} className="form-control min-h-16" placeholder="la fourniture de sable destiné aux travaux de construction" />
              </label>
              <p className="mt-2 text-xs italic text-muted-foreground">Sera rendu : « Le présent contrat a pour objet <strong>{objet || "…"}</strong> réalisés par l'Acheteur. »</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-foreground">Le Fournisseur s'engage à livrer</h3>
                <button type="button" onClick={() => setLignes([...lignes, nouvelleLigne()])} className="mini-button"><Plus className="size-4" /> Ajouter</button>
              </div>
              <div className="mb-1 hidden text-xs font-bold uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_200px_40px] sm:gap-2 sm:px-3"><span>Description</span><span>Quantité</span><span></span></div>
              <div className="space-y-2">
                {lignes.map((ligne, i) => (
                  <div key={i} className="grid gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 sm:grid-cols-[1fr_200px_40px] sm:items-start">
                    <textarea rows={2} placeholder="Description (ex: Sable fin de rivière)" value={ligne.description} onChange={(e) => setLignes(lignes.map((l, j) => j === i ? { ...l, description: e.target.value } : l))} className="form-control min-h-16" />
                    <input placeholder="Ex: 10 m³" value={ligne.quantite} onChange={(e) => setLignes(lignes.map((l, j) => j === i ? { ...l, quantite: e.target.value } : l))} className="form-control" />
                    <button type="button" onClick={() => setLignes(lignes.filter((_, j) => j !== i))} className="tool-action danger justify-self-end" disabled={lignes.length <= 1}><Trash2 className="size-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:gap-5">
              <label className="sm:col-span-2"><span className="mb-1 block text-sm font-semibold text-foreground">Conditions de livraison</span><textarea value={conditionsLivraison} onChange={(e) => setConditionsLivraison(e.target.value)} rows={3} className="form-control min-h-20" /></label>
              <label className="sm:col-span-2"><span className="mb-1 block text-sm font-semibold text-foreground">Modalités de paiement</span><textarea value={modalitesPaiement} onChange={(e) => setModalitesPaiement(e.target.value)} rows={3} className="form-control min-h-20" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Durée du contrat</span><textarea value={duree} onChange={(e) => setDuree(e.target.value)} rows={3} className="form-control min-h-20" /></label>
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Clauses générales</span><textarea value={clauses} onChange={(e) => setClauses(e.target.value)} rows={3} className="form-control min-h-20" /></label>
            </div>

            <div className="mt-6 border-t border-border/60 pt-5">
              <h2 className="mb-3 text-lg font-black text-foreground xl:text-xl">Signatures</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:gap-5">
                <fieldset className="rounded-xl border border-border/60 bg-muted/40 p-4">
                  <legend className="px-2 text-sm font-bold uppercase tracking-wide text-foreground">SCM SARL (Acheteur)</legend>
                  <label className="mt-2 block"><span className="mb-1 block text-sm font-semibold text-foreground">Nom du signataire SCM</span><input value={signataireScmNom} onChange={(e) => setSignataireScmNom(e.target.value)} className="form-control" /></label>
                  <label className="mt-3 block"><span className="mb-1 block text-sm font-semibold text-foreground">Fonction</span><input value={signataireScmFonction} onChange={(e) => setSignataireScmFonction(e.target.value)} className="form-control" /></label>
                  <label className="mt-3 block"><span className="mb-1 block text-sm font-semibold text-foreground">Sceau SCM</span><input type="file" accept="image/*" onChange={(e) => setSceauScm(e.target.files?.[0])} className="file-input" /></label>
                  <label className="mt-3 block"><span className="mb-1 block text-sm font-semibold text-foreground">Signature SCM</span><input type="file" accept="image/*" onChange={(e) => setSignatureScm(e.target.files?.[0])} className="file-input" /></label>
                </fieldset>
                <fieldset className="rounded-xl border border-border/60 bg-muted/40 p-4">
                  <legend className="px-2 text-sm font-bold uppercase tracking-wide text-foreground">Fournisseur</legend>
                  <label className="block"><span className="mb-1 block text-sm font-semibold text-foreground">Sceau du fournisseur</span><input type="file" accept="image/*" onChange={(e) => setSceauFournisseur(e.target.files?.[0])} className="file-input" /></label>
                  <label className="mt-3 block"><span className="mb-1 block text-sm font-semibold text-foreground">Signature du fournisseur</span><input type="file" accept="image/*" onChange={(e) => setSignatureFournisseur(e.target.files?.[0])} className="file-input" /></label>
                </fieldset>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/15 p-4 shadow-document sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-base text-foreground">Contrat prêt à être généré et archivé</strong>
              <button disabled={chargement} className="primary-action"><Save className="size-4" /> {chargement ? "Génération…" : editionId ? "Réenregistrer le contrat" : "Générer et enregistrer le contrat"}</button>
            </div>
          </form>

          <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-document xl:p-6">
              <h2 className="text-xl font-bold text-foreground">Contrat de fourniture officiel</h2>
              <p className="mt-2 text-sm text-muted-foreground">Le PDF inclut l'identité complète de SCM SARL, le détail des fournitures à livrer (description et quantité), les conditions, les signatures et sceaux des deux parties.</p>
            </div>
            <DocumentHistory type="contrat_fournisseur" actualisation={actualisation} onEdit={editer} />
          </div>
        </div>
      </div>
    </main>
  );
}
