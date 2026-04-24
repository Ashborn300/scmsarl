import { ArrowLeft, Copy, Eye, FileDown, Link2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { creerFormulairePersonnalise, listerFormulairesPersonnalises, listerReponsesFormulaire, type ChampPersonnalise, type FormulairePersonnalise, type ReponseFormulaire, type TypeChampPersonnalise } from "@/lib/scmDocuments";

const champSchema = z.object({ id: z.string().min(1).max(80), label: z.string().trim().min(1).max(80), type: z.enum(["texte", "nombre", "image", "fichier"]), requis: z.boolean() });
const formulaireSchema = z.object({ titre: z.string().trim().min(1).max(120), description: z.string().trim().max(1000), champs: z.array(champSchema).min(1).max(30) });
const typesChamps: TypeChampPersonnalise[] = ["texte", "nombre", "image", "fichier"];

function nouveauChamp(): ChampPersonnalise {
  return { id: crypto.randomUUID(), label: "Nouveau champ", type: "texte", requis: false };
}

export function CustomFormTool({ retour }: { retour: () => void }) {
  const [titre, setTitre] = useState("Formulaire personnalisé SCM");
  const [description, setDescription] = useState("");
  const [champs, setChamps] = useState<ChampPersonnalise[]>([nouveauChamp()]);
  const [formulaires, setFormulaires] = useState<FormulairePersonnalise[]>([]);
  const [formulaireActif, setFormulaireActif] = useState<FormulairePersonnalise | null>(null);
  const [reponses, setReponses] = useState<ReponseFormulaire[]>([]);
  const [chargement, setChargement] = useState(false);

  useEffect(() => { listerFormulairesPersonnalises().then(setFormulaires).catch((e) => alert(e instanceof Error ? e.message : "Impossible de charger les formulaires.")); }, []);

  async function creer(event: React.FormEvent) {
    event.preventDefault();
    const donnees = formulaireSchema.parse({ titre, description, champs: champs.map((champ) => ({ ...champ, label: champ.label.trim() })) });
    setChargement(true);
    try {
      const formulaire = await creerFormulairePersonnalise(donnees.titre, donnees.description, donnees.champs);
      setFormulaires((liste) => [formulaire, ...liste]);
      setFormulaireActif(formulaire);
      setReponses([]);
      await navigator.clipboard?.writeText(formulaire.url_publique);
      alert("Formulaire créé. Le lien public externe a été copié.");
    } catch (erreur) {
      alert(erreur instanceof Error ? erreur.message : "Impossible de créer le formulaire.");
    } finally { setChargement(false); }
  }

  async function ouvrirReponses(formulaire: FormulairePersonnalise) {
    setFormulaireActif(formulaire);
    setReponses(await listerReponsesFormulaire(formulaire.id));
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-custom-form">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button>
        <div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8"><span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span><h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Créateur de formulaire personnalisable</h1><p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Créez un formulaire champ par champ, partagez un lien public externe et consultez les réponses.</p></div>
        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <form onSubmit={creer} className="rounded-2xl border border-border bg-card/95 p-4 shadow-document lg:p-6">
            <div className="grid gap-4"><label><span className="mb-1 block text-sm font-semibold text-foreground">Titre *</span><input value={titre} onChange={(e) => setTitre(e.target.value.slice(0, 120))} className="form-control" /></label><label><span className="mb-1 block text-sm font-semibold text-foreground">Description</span><textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 1000))} rows={3} className="form-control" /></label></div>
            <div className="mt-5 rounded-xl bg-muted p-3"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-bold text-foreground">Champs du formulaire</h2><button type="button" onClick={() => setChamps([...champs, nouveauChamp()])} className="mini-button"><Plus className="size-4" /> Ajouter</button></div><div className="space-y-3">{champs.map((champ, index) => <div key={champ.id} className="grid gap-2 rounded-lg bg-card p-3 sm:grid-cols-[1fr_130px_90px_40px]"><input value={champ.label} onChange={(e) => setChamps(champs.map((item) => item.id === champ.id ? { ...item, label: e.target.value.slice(0, 80) } : item))} className="form-control" /><select value={champ.type} onChange={(e) => setChamps(champs.map((item) => item.id === champ.id ? { ...item, type: e.target.value as TypeChampPersonnalise } : item))} className="form-control">{typesChamps.map((type) => <option key={type} value={type}>{type}</option>)}</select><label className="flex items-center gap-2 rounded-lg border border-border px-3 text-sm font-bold"><input type="checkbox" checked={champ.requis} onChange={(e) => setChamps(champs.map((item) => item.id === champ.id ? { ...item, requis: e.target.checked } : item))} /> Requis</label><button type="button" onClick={() => setChamps(champs.filter((_, i) => i !== index))} className="tool-action danger"><Trash2 className="size-4" /></button></div>)}</div></div>
            <div className="mt-6 flex justify-end"><button disabled={chargement} className="primary-action"><Save className="size-4" /> {chargement ? "Création…" : "Créer et copier le lien"}</button></div>
          </form>
          <section className="space-y-6"><div className="rounded-2xl border border-border bg-card p-5 shadow-document"><Link2 className="mb-3 size-8 text-primary" /><h2 className="text-xl font-bold text-foreground">Liens et réponses</h2><p className="mt-2 text-sm text-muted-foreground">Les liens générés utilisent le domaine public publié et restent accessibles aux personnes externes.</p></div><div className="rounded-2xl border border-border bg-card/95 p-4 shadow-document"><h2 className="mb-3 text-lg font-black text-foreground">Formulaires créés</h2><div className="space-y-3">{formulaires.length === 0 ? <p className="rounded-xl border border-dashed border-border bg-muted/60 p-5 text-sm text-muted-foreground">Aucun formulaire pour le moment.</p> : formulaires.map((formulaire) => <article key={formulaire.id} className="rounded-xl border border-border bg-background p-3"><h3 className="font-bold text-foreground">{formulaire.titre}</h3><p className="mt-1 break-all text-xs text-primary">{formulaire.url_publique}</p><div className="mt-3 grid grid-cols-3 gap-2"><button type="button" onClick={() => window.open(formulaire.url_publique, "_blank", "noopener,noreferrer")} className="tool-action"><Eye className="size-4" /></button><button type="button" onClick={() => navigator.clipboard?.writeText(formulaire.url_publique)} className="tool-action"><Copy className="size-4" /></button><button type="button" onClick={() => ouvrirReponses(formulaire)} className="tool-action"><FileDown className="size-4" /></button></div></article>)}</div></div>{formulaireActif && <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-document"><h2 className="text-lg font-black text-foreground">Réponses · {formulaireActif.titre}</h2><div className="mt-3 space-y-3">{reponses.length === 0 ? <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Aucune réponse reçue.</p> : reponses.map((reponse) => <article key={reponse.id} className="rounded-xl border border-border bg-background p-3"><p className="mb-2 text-xs font-bold text-muted-foreground">{new Date(reponse.created_at).toLocaleString("fr-FR")}</p>{Object.entries(reponse.reponses).map(([key, value]) => <p key={key} className="text-sm"><strong>{key} :</strong> {value || "—"}</p>)}{Object.entries(reponse.fichiers).map(([key, file]) => <a key={key} href={file.contenu} download={file.nom} className="mt-2 block text-sm font-bold text-primary">Télécharger {key} · {file.nom}</a>)}</article>)}</div></div>}</section>
        </div>
      </div>
    </main>
  );
}