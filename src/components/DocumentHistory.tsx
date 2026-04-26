import { Download, Eye, FilePenLine, FileText, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { chargerDocumentComplet, listerDocuments, supprimerDocument, telechargerImage, telechargerPdf, voirImage, voirPdf, type DocumentRecord, type OutilType } from "@/lib/scmDocuments";

export function DocumentHistory({ type, actualisation, onEdit }: { type: OutilType; actualisation: number; onEdit: (document: DocumentRecord) => void }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const estImage = type === "rendu_3d" || type === "realistic_sketchup" || type === "code_qr" || type === "plan_architectural" || type === "version_nuit";

  useEffect(() => {
    setChargement(true);
    listerDocuments(type, recherche)
      .then(setDocuments)
      .catch((erreur) => alert(erreur instanceof Error ? erreur.message : "Impossible de charger l’historique."))
      .finally(() => setChargement(false));
  }, [type, actualisation, recherche]);

  async function supprimer(id: string) {
    if (!confirm(`Voulez-vous supprimer définitivement ce fichier ${estImage ? "image" : "PDF"} ?`)) return;
    await supprimerDocument(type, id);
    setDocuments((liste) => liste.filter((document) => document.id !== id));
  }

  async function executerAction(document: DocumentRecord, action: "voir" | "telecharger" | "editer") {
    setActionEnCours(document.id + action);
    try {
      const complet = await chargerDocumentComplet(type, document.id);
      if (action === "editer") return onEdit(complet);
      if (estImage) {
        const image = complet.qr_base64 || complet.image_base64 || "";
        if (action === "voir") voirImage(image);
        else telechargerImage(image, complet.nom_fichier);
      } else {
        if (action === "voir") voirPdf(complet.pdf_base64);
        else telechargerPdf(complet.pdf_base64, complet.nom_fichier);
      }
    } catch (erreur) {
      alert(erreur instanceof Error ? erreur.message : "Action impossible.");
    } finally {
      setActionEnCours(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card/90 p-4 shadow-document lg:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Historique des fichiers</h2>
          <p className="text-sm text-muted-foreground">Fichiers générés, consultables et téléchargeables.</p>
        </div>
        <label className="relative block sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Rechercher un fichier" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none ring-ring transition focus:ring-2" />
        </label>
      </div>
      <div className="space-y-3">
        {chargement ? (
          <div className="rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">Chargement de l’historique…</div>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/60 p-6 text-center text-sm text-muted-foreground">Aucun fichier généré pour le moment.</div>
        ) : (
          documents.map((document) => {
            const enCours = actionEnCours?.startsWith(document.id);
            return (
              <article key={document.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="size-5" /></span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">{document.nom_fichier}</h3>
                    <p className="text-xs text-muted-foreground">{document.numero} · {new Date(document.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:flex">
                  <button type="button" disabled={enCours} onClick={() => executerAction(document, "voir")} className="tool-action" aria-label="Voir le fichier"><Eye className="size-4" /></button>
                  <button type="button" disabled={enCours} onClick={() => executerAction(document, "telecharger")} className="tool-action" aria-label="Télécharger le fichier"><Download className="size-4" /></button>
                  <button type="button" disabled={enCours} onClick={() => executerAction(document, "editer")} className="tool-action" aria-label="Éditer le fichier"><FilePenLine className="size-4" /></button>
                  <button type="button" disabled={enCours} onClick={() => supprimer(document.id)} className="tool-action danger" aria-label="Supprimer le fichier"><Trash2 className="size-4" /></button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
