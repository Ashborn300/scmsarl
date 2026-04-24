import { createFileRoute, Link } from "@tanstack/react-router";
import { SendHorizonal } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { envoyerReponseFormulaire, obtenirFormulairePublic, type FormulairePersonnalise, type ReponseFormulaire } from "@/lib/scmDocuments";
import scmLogo from "@/assets/scm-logo.jpeg";

const idSchema = z.string().uuid();

export const Route = createFileRoute("/formulaire/$formulaireId")({
  component: FormulairePublicPage,
});

function lireFichier(fichier?: File) {
  return new Promise<ReponseFormulaire["fichiers"][string] | undefined>((resolve, reject) => {
    if (!fichier) return resolve(undefined);
    if (fichier.size > 4_000_000) return reject(new Error("Le fichier dépasse 4 Mo."));
    const lecteur = new FileReader();
    lecteur.onload = () => resolve({ nom: fichier.name.slice(0, 120), type: fichier.type || "application/octet-stream", taille: fichier.size, contenu: String(lecteur.result) });
    lecteur.onerror = reject;
    lecteur.readAsDataURL(fichier);
  });
}

function FormulairePublicPage() {
  const { formulaireId } = Route.useParams();
  const [formulaire, setFormulaire] = useState<FormulairePersonnalise | null>(null);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [fichiers, setFichiers] = useState<Record<string, File | undefined>>({});
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  useEffect(() => { if (!idSchema.safeParse(formulaireId).success) { setChargement(false); return; } obtenirFormulairePublic(formulaireId).then(setFormulaire).finally(() => setChargement(false)); }, [formulaireId]);

  async function soumettre(event: React.FormEvent) {
    event.preventDefault();
    if (!formulaire) return;
    for (const champ of formulaire.champs) if (champ.requis && champ.type !== "image" && champ.type !== "fichier" && !valeurs[champ.label]?.trim()) return alert(`Veuillez renseigner : ${champ.label}`);
    for (const champ of formulaire.champs) if (champ.requis && (champ.type === "image" || champ.type === "fichier") && !fichiers[champ.label]) return alert(`Veuillez importer : ${champ.label}`);
    setEnvoi(true);
    try {
      const fichiersBase64: ReponseFormulaire["fichiers"] = {};
      for (const champ of formulaire.champs.filter((champ) => champ.type === "image" || champ.type === "fichier")) {
        const fichier = await lireFichier(fichiers[champ.label]);
        if (fichier) fichiersBase64[champ.label] = fichier;
      }
      await envoyerReponseFormulaire(formulaire.id, valeurs, fichiersBase64);
      setEnvoye(true);
    } catch (erreur) {
      alert(erreur instanceof Error ? erreur.message : "Impossible d’envoyer la réponse.");
    } finally { setEnvoi(false); }
  }

  if (chargement) return <main className="min-h-screen bg-background p-5 text-foreground">Chargement…</main>;
  if (!formulaire) return <main className="min-h-screen bg-background p-5 text-foreground"><Link to="/" className="text-primary">Retour</Link><h1 className="mt-6 text-2xl font-black">Formulaire introuvable</h1></main>;

  return <main className="min-h-screen bg-background px-4 py-6 text-foreground tool-custom-form"><section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-document"><div className="bg-tool-gradient p-6 text-tool-foreground"><img src={scmLogo} alt="Logo SCM SARL" className="h-16 w-32 rounded-xl bg-card object-contain p-2" /><h1 className="mt-6 text-3xl font-black">{formulaire.titre}</h1>{formulaire.description && <p className="mt-2 text-sm font-semibold opacity-90">{formulaire.description}</p>}</div>{envoye ? <div className="p-6"><h2 className="text-2xl font-black text-foreground">Réponse envoyée</h2><p className="mt-2 text-muted-foreground">Merci, vos informations ont été transmises avec succès.</p></div> : <form onSubmit={soumettre} className="grid gap-4 p-5 sm:p-7">{formulaire.champs.map((champ) => <label key={champ.id}><span className="mb-1 block text-sm font-semibold text-foreground">{champ.label}{champ.requis ? " *" : ""}</span>{champ.type === "image" || champ.type === "fichier" ? <input type="file" accept={champ.type === "image" ? "image/*" : undefined} onChange={(e) => setFichiers((actuel) => ({ ...actuel, [champ.label]: e.target.files?.[0] }))} className="file-input" /> : <input type={champ.type === "nombre" ? "number" : "text"} value={valeurs[champ.label] || ""} onChange={(e) => setValeurs((actuel) => ({ ...actuel, [champ.label]: e.target.value.slice(0, 1000) }))} className="form-control" />}</label>)}<button disabled={envoi} className="primary-action mt-2"><SendHorizonal className="size-4" /> {envoi ? "Envoi…" : "Envoyer"}</button></form>}</section></main>;
}