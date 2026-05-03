import { AlertTriangle, Archive, ArrowLeft, CalendarDays, ClipboardList, Copy, Eye, FileCheck2, FileDown, HeartPulse, Link2, PackageCheck, Pencil, Plus, Save, Search, Trash2, Wallet } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { DocumentHistory } from "./DocumentHistory";
import { RecuEmployeTool } from "./RecuEmployeTool";
import { DevisEstimatifTool } from "./DevisEstimatifTool";
import { creerFormulairePersonnalise, creerPdf, creerPdfArchiveChantier, creerPdfFactureEmploye, creerPdfFicheEmploye, enregistrerArchiveChantier, enregistrerCarteService, enregistrerCodeQR, enregistrerDocument, enregistrerFactureEmploye, enregistrerFicheEmploye, enregistrerJourNonTravaille, enregistrerOrganigrammeEntreprise, enregistrerPlanArchitectural, enregistrerRealisticSketchup, enregistrerRendu3D, enregistrerVersionNuit, listerArchivesChantiers, listerArrivagesMateriel, listerConnexionsScm, listerEmployes, listerFacturesEmployes, listerFormulairesPersonnalises, listerBilansSanteEmployes, listerDemandesConges, listerIncidentsChantier, listerJoursNonTravailles, listerOrganigrammesEntreprise, listerRapportsMateriel, listerReponsesFormulaire, modifierFormulairePersonnalise, supprimerDocument, supprimerFormulairePersonnalise, supprimerJourNonTravaille, supprimerOrganigrammeEntreprise, telechargerPdf, televerserImageArchiveChantier, televerserImageOrganigramme, voirPdf, type ArchiveChantier, type ArrivageMateriel, type BilanSanteEmploye, type ChampPersonnalise, type ConnexionScm, type DemandeConge, type DocumentRecord, type EmployeRecord, type FactureEmployeRecord, type FormulairePersonnalise, type IncidentChantier, type JourNonTravaille, type LigneDeduction, type LignePrestation, type OrganigrammeEntreprise, type OutilType, type RapportMateriel, type ReponseFormulaire, type TypeChampPersonnalise } from "@/lib/scmDocuments";
import { genererImageOpenRouter } from "@/lib/openrouterImage.functions";
import scmLogo from "@/assets/scm-logo.jpeg";

type Field = { name: string; label: string; type?: "text" | "number" | "date" | "textarea" | "image"; required?: boolean; defaultValue?: string };
type Config = { type: OutilType; titre: string; theme: string; description: string; fields: Field[]; hasLines?: boolean; showTotal?: boolean; totalLabel?: string };

const aujourdhui = new Date().toISOString().slice(0, 10);
const originePubliqueQr = "https://scmdarabase.lovable.app";

export const configs: Config[] = [
  { type: "facture", titre: "Générateur de facture professionnelle", theme: "blue", description: "Factures numérotées avec prestations, calcul automatique et modalités de paiement.", hasLines: true, fields: [
    { name: "client", label: "Informations client", type: "textarea", required: true }, { name: "date", label: "Date", type: "date", defaultValue: aujourdhui }, { name: "modalites", label: "Modalités de paiement", type: "textarea", defaultValue: "Paiement à la réception de la facture, sauf accord écrit contraire." },
  ]},
  { type: "devis", titre: "Générateur de devis professionnel", theme: "yellow", description: "Devis détaillé avec projet, achats à faire, quantités, coûts et total automatique.", hasLines: true, fields: [
    { name: "client", label: "Informations client", type: "textarea", required: true }, { name: "projet", label: "Description du projet", type: "textarea", required: true }, { name: "validite", label: "Date de validité", type: "date" }, { name: "notes", label: "Notes", type: "textarea" },
  ]},
  { type: "devis_estimatif", titre: "Devis estimatif", theme: "yellow", description: "Devis estimatif multi-étapes (étapes de construction) avec sous-totaux et coût global du projet.", showTotal: false, fields: [] },
  { type: "recu", titre: "Générateur de reçu", theme: "green", description: "Reçu de paiement formel pour règlement client.", totalLabel: "Montant final", fields: [
    { name: "client", label: "Nom du client", required: true }, { name: "montant", label: "Montant payé ($)", type: "number", required: true }, { name: "modePaiement", label: "Mode de paiement", required: true }, { name: "date", label: "Date", type: "date", defaultValue: aujourdhui }, { name: "description", label: "Description", type: "textarea", required: true },
  ]},
  { type: "contrat_construction", titre: "Générateur de contrat de construction", theme: "purple", description: "Contrat officiel avec travaux, délais, paiement et clauses éditables.", fields: [
    { name: "client", label: "Informations client", type: "textarea", required: true }, { name: "projet", label: "Détails du projet", type: "textarea", required: true }, { name: "travaux", label: "Étendue des travaux", type: "textarea", required: true }, { name: "delais", label: "Délais", type: "textarea" }, { name: "paiement", label: "Modalités de paiement", type: "textarea" }, { name: "clauses", label: "Clauses légales", type: "textarea", defaultValue: "Les parties s’engagent à respecter les dispositions légales applicables en République Démocratique du Congo et les normes professionnelles du secteur de la construction." },
  ]},
  { type: "contrat_employe", titre: "Générateur de contrat d’employé", theme: "teal", description: "Contrat d’employé avec poste, salaire, durée et responsabilités.", fields: [
    { name: "employe", label: "Nom de l’employé", required: true }, { name: "poste", label: "Poste", required: true }, { name: "salaire", label: "Salaire ($)", type: "number", required: true }, { name: "duree", label: "Durée du contrat", required: true }, { name: "responsabilites", label: "Responsabilités", type: "textarea" }, { name: "conditions", label: "Conditions", type: "textarea" },
  ]},
  { type: "description_projet", titre: "Générateur de description de projet", theme: "red", description: "Fiche officielle structurée avec aperçu, coordonnées, parcelle, niveaux et signatures.", showTotal: false, fields: [
    { name: "projet", label: "Titre du projet", required: true }, { name: "client", label: "Nom du client", required: true }, { name: "nomEntreprise", label: "Nom de l’entreprise", defaultValue: "SCM SARL" }, { name: "typeEntreprise", label: "Type d’entreprise", defaultValue: "SARL" }, { name: "date", label: "Date", type: "date", defaultValue: aujourdhui }, { name: "contactNom", label: "Nom du point de contact" }, { name: "email", label: "Adresse courriel" }, { name: "telephone", label: "Téléphone" }, { name: "adressePostale", label: "Adresse postale", type: "textarea" }, { name: "apercu", label: "Aperçu du projet", type: "textarea", required: true }, { name: "emplacement", label: "Emplacement / adresse de la propriété", type: "textarea", required: true }, { name: "dimensionsParcelle", label: "Dim. parcelle : Ly x LX en mètres" }, { name: "superficie", label: "Superficie en m²" }, { name: "nombreNiveaux", label: "Nombre de niveaux" }, { name: "porteeProjet", label: "Portée du projet", type: "textarea" }, { name: "etatTerrain", label: "État de la zone du terrain", type: "textarea" },
  ]},
  { type: "communiquer", titre: "Communiquer", theme: "coral", description: "Annonces, communications internes et diffusion d’informations officielles.", showTotal: false, fields: [
    { name: "titre", label: "Titre de la communication", required: true }, { name: "destinataires", label: "Destinataires", defaultValue: "Tous les employés et chefs de chantier" }, { name: "date", label: "Date", type: "date", defaultValue: aujourdhui }, { name: "objet", label: "Objet", required: true }, { name: "message", label: "Annonce ou communication", type: "textarea", required: true },
  ]},
  { type: "certificat", titre: "Générateur de certificat", theme: "certificate", description: "Certificat A4 personnalisable avec logo, sceau et deux signatures importées.", showTotal: false, fields: [
    { name: "titreCertificat", label: "Titre du certificat", defaultValue: "CERTIFICAT", required: true }, { name: "sousTitre", label: "Sous-titre", defaultValue: "DE RECONNAISSANCE" }, { name: "beneficiaire", label: "Nom du bénéficiaire", required: true }, { name: "date", label: "Date", type: "date", defaultValue: aujourdhui }, { name: "texte", label: "Texte du certificat", type: "textarea", defaultValue: "Ce certificat est décerné en reconnaissance de l’excellence, de l’engagement et du professionnalisme démontrés." }, { name: "logoPersonnalise", label: "Logo personnalisé", type: "image" }, { name: "signatureGauche", label: "Image signature gauche", type: "image" },
  ]},
  { type: "carte_service", titre: "Génération Carte de service", theme: "service-card", description: "Carte de service professionnelle PDF (recto/verso, format paysage CR80) avec logo SCM, drapeau RDC, photo et code QR.", showTotal: false, fields: [
    { name: "profileImage", label: "Photo de profil", type: "image", required: true }, { name: "qrCodeImage", label: "Image du code QR", type: "image", required: true }, { name: "signatureDirection", label: "Signature de la Direction SCM SARL (image, fond transparent recommandé)", type: "image" }, { name: "nomComplet", label: "Nom complet", required: true }, { name: "matricule", label: "Matricule", required: true }, { name: "genre", label: "Genre", required: true }, { name: "telephone", label: "Téléphone", required: true }, { name: "adresse", label: "Adresse", required: true }, { name: "poste", label: "Poste", required: true },
  ]},
  { type: "rendu_3d", titre: "Génération de rendu 3D", theme: "render-3d", description: "Transformation IA d’un plan 2D en rendu architectural isométrique 3D.", showTotal: false, fields: [
    { name: "planImage", label: "Image du plan", type: "image", required: true }, { name: "titre", label: "Titre du rendu", defaultValue: "Rendu 3D architectural" }, { name: "correctionPrompt", label: "Correction à appliquer au résultat", type: "textarea" },
  ]},
  { type: "realistic_sketchup", titre: "Realistic SketchUp", theme: "realistic-sketchup", description: "Transformation IA d’un modèle SketchUp en rendu architectural hyperréaliste.", showTotal: false, fields: [
    { name: "sketchupImage", label: "Image du modèle SketchUp", type: "image", required: true }, { name: "titre", label: "Titre du rendu", defaultValue: "Realistic SketchUp" }, { name: "correctionPrompt", label: "Correction à appliquer au résultat", type: "textarea" },
  ]},
  { type: "plan_architectural", titre: "Génération de plan architectural", theme: "plan-architectural", description: "Génération IA d’un plan d’architecture 2D fidèle à partir d’une description textuelle complète.", showTotal: false, fields: [
    { name: "titre", label: "Titre du plan", defaultValue: "Plan architectural" },
    { name: "typeBatiment", label: "Type de bâtiment (maison, villa, immeuble, bureau...)", required: true },
    { name: "nombreNiveaux", label: "Nombre de niveaux (RDC, R+1, R+2...)", defaultValue: "RDC" },
    { name: "dimensions", label: "Dimensions globales (ex: 12m x 10m)" },
    { name: "superficie", label: "Superficie totale en m²" },
    { name: "pieces", label: "Liste des pièces avec dimensions (ex: 3 chambres 4x4m, salon 6x5m, cuisine 3x4m, 2 salles de bain, terrasse...)", type: "textarea", required: true },
    { name: "orientation", label: "Orientation et entrée principale (ex: entrée au sud, salon orienté nord)" },
    { name: "exigencesSpeciales", label: "Exigences spéciales (garage, piscine, escalier, balcon, mobilier indicatif...)", type: "textarea" },
    { name: "styleTrait", label: "Style du plan (technique noir et blanc, coloré, blueprint, top-down...)", defaultValue: "Plan d’architecte technique noir et blanc, top-down 2D, cotes et annotations" },
    { name: "correctionPrompt", label: "Correction à appliquer au résultat", type: "textarea" },
  ]},
  { type: "fiche_employe", titre: "Générateur de fiche d’employé", theme: "employee-sheet", description: "Fiche individuelle complète ou fiche collective avec photo, nom, matricule et genre.", showTotal: false, fields: [] },
  { type: "code_qr", titre: "Générateur Code QR", theme: "qr-code", description: "Code QR public menant vers une fiche web accessible avec les informations personnelles d’un employé.", showTotal: false, fields: [] },
  { type: "formulaire_personnalise", titre: "Créateur de formulaire personnalisable", theme: "custom-form", description: "Formulaire champ par champ avec lien public externe et consultation des réponses.", showTotal: false, fields: [] },
  { type: "historique_connexion", titre: "Historique de connexion", theme: "login-history", description: "Consultez les connexions par date et téléchargez le rapport journalier en PDF.", showTotal: false, fields: [] },
  { type: "calendrier_feries", titre: "Calendrier des jours fériés", theme: "holiday-calendar", description: "Définissez les jours fériés et non travaillés visibles sur les dashboards employés.", showTotal: false, fields: [] },
  { type: "organigramme_entreprise", titre: "Organigramme de l’entreprise", theme: "organization-chart", description: "Créez et publiez l’organigramme SCM SARL visible sur tous les dashboards employés.", showTotal: false, fields: [] },
  { type: "demandes_conges", titre: "Demandes de Congés", theme: "leave-requests", description: "Consultez toutes les demandes de congé envoyées par les employés.", showTotal: false, fields: [] },
  { type: "bilans_sante", titre: "Bilan de santé des employé", theme: "health-report", description: "Consultez les états de santé hebdomadaires complétés par les employés.", showTotal: false, fields: [] },
  { type: "gestion_materiel", titre: "Gestion de Matériel", theme: "material-management", description: "Consultez les rapports hebdomadaires des chefs de chantier avec matériel récupéré et perdu.", showTotal: false, fields: [] },
  { type: "arrivages_materiel", titre: "Suive D'arrivage de Matériel", theme: "material-management", description: "Consultez les livraisons de matériel reçues sur les chantiers.", showTotal: false, fields: [] },
  { type: "incidents_chantier", titre: "Incident et Accident du chantier", theme: "site-incident", description: "Consultez les alertes d’incident ou accident envoyées par les chefs de chantier.", showTotal: false, fields: [] },
  { type: "archives_chantiers", titre: "Archive des chantier", theme: "site-archive", description: "Créez les fiches PDF professionnelles des chantiers déjà finalisés.", showTotal: false, fields: [] },
  { type: "lettre_licenciement", titre: "Générateur de lettre de licenciement", theme: "termination-letter", description: "Lettre officielle de licenciement avec logo, drapeau RDC, motifs détaillés, sceau de l’entreprise et signature de l’employé.", showTotal: false, fields: [
    { name: "employe", label: "Nom de l’employé", required: true }, { name: "poste", label: "Poste occupé", required: true }, { name: "matricule", label: "Matricule" }, { name: "lieu", label: "Lieu de signature", defaultValue: "Kinshasa" }, { name: "dateLettre", label: "Date de la lettre", type: "date", defaultValue: aujourdhui }, { name: "dateEffet", label: "Date d’effet du licenciement", type: "date", required: true }, { name: "motif", label: "Motif du licenciement", type: "textarea", required: true }, { name: "detailsFaits", label: "Détails et faits reprochés", type: "textarea" }, { name: "preavis", label: "Préavis et indemnités", type: "textarea", defaultValue: "Conformément à la législation en vigueur, le préavis et les indemnités de fin de contrat seront calculés selon votre ancienneté et votre dernier salaire." }, { name: "obligationsSortie", label: "Obligations de sortie", type: "textarea", defaultValue: "Restitution du matériel, badge, EPI et documents appartenant à l’entreprise. Solde de tout compte remis à la sortie." }, { name: "signataireNom", label: "Nom du signataire" }, { name: "signataireFonction", label: "Fonction du signataire", defaultValue: "Directeur des Ressources Humaines" },
  ]},
  { type: "facture_employe", titre: "Facture employé", theme: "employee-invoice", description: "Facture de salaire professionnelle générée pour un employé sélectionné, avec déductions paramétrables (frais d’entreprise, etc.) et calcul automatique du salaire net.", showTotal: false, fields: [] },
  { type: "recu_employe", titre: "Reçu employés", theme: "employee-receipt", description: "Envoyez un reçu de paiement à un ou plusieurs employés pour un chantier donné. L'employé confirme dans son espace, le montant est déduit du salaire restant.", showTotal: false, fields: [] },
  { type: "version_nuit", titre: "Version Nuit", theme: "night-version", description: "Transformation IA d’une image de maison ou rendu 3D en version nuit ultra-réaliste, avec lampes intérieures et extérieures.", showTotal: false, fields: [
    { name: "imageMaison", label: "Image de la maison ou du rendu 3D", type: "image", required: true },
    { name: "titre", label: "Titre du rendu nuit", defaultValue: "Version nuit du rendu" },
    { name: "correctionPrompt", label: "Correction à appliquer au résultat", type: "textarea" },
  ]},
];

function lireImage(fichier?: File) {
  return new Promise<string | undefined>((resolve, reject) => {
    if (!fichier) return resolve(undefined);
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(String(lecteur.result));
    lecteur.onerror = reject;
    lecteur.readAsDataURL(fichier);
  });
}

function optimiserImagePourIA(source?: string, tailleMax = 1024, qualite = 0.82) {
  return new Promise<string | undefined>((resolve, reject) => {
    if (!source) return resolve(undefined);
    const image = new Image();
    image.onload = () => {
      const ratio = Math.min(1, tailleMax / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", qualite));
    };
    image.onerror = reject;
    image.src = source;
  });
}

async function imageAssetEnDataUrl(source: string) {
  const reponse = await fetch(source);
  const blob = await reponse.blob();
  return await new Promise<string>((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(String(lecteur.result));
    lecteur.onerror = reject;
    lecteur.readAsDataURL(blob);
  });
}

const champPersonnaliseSchema = z.object({ id: z.string().min(1).max(80), label: z.string().trim().min(1).max(80), type: z.enum(["texte", "nombre", "image", "fichier"]), requis: z.boolean() });
const formulairePersonnaliseSchema = z.object({ titre: z.string().trim().min(1).max(120), description: z.string().trim().max(1000), champs: z.array(champPersonnaliseSchema).min(1).max(30) });
const typesChampsPersonnalises: TypeChampPersonnalise[] = ["texte", "nombre", "image", "fichier"];

function nouveauChampPersonnalise(): ChampPersonnalise {
  return { id: crypto.randomUUID(), label: "Nouveau champ", type: "texte", requis: false };
}

function CustomFormTool({ retour }: { retour: () => void }) {
  const [titre, setTitre] = useState("Formulaire personnalisé SCM");
  const [description, setDescription] = useState("");
  const [champs, setChamps] = useState<ChampPersonnalise[]>([nouveauChampPersonnalise()]);
  const [formulaires, setFormulaires] = useState<FormulairePersonnalise[]>([]);
  const [formulaireActif, setFormulaireActif] = useState<FormulairePersonnalise | null>(null);
  const [reponses, setReponses] = useState<ReponseFormulaire[]>([]);
  const [chargement, setChargement] = useState(false);
  const [editionId, setEditionId] = useState<string | null>(null);

  useEffect(() => { listerFormulairesPersonnalises().then(setFormulaires).catch((e) => alert(e instanceof Error ? e.message : "Impossible de charger les formulaires.")); }, []);

  async function creer(event: React.FormEvent) {
    event.preventDefault();
    const donnees = formulairePersonnaliseSchema.parse({ titre, description, champs: champs.map((champ) => ({ ...champ, label: champ.label.trim() })) });
    setChargement(true);
    try {
      const formulaire = editionId ? await modifierFormulairePersonnalise(editionId, donnees.titre, donnees.description, donnees.champs) : await creerFormulairePersonnalise(donnees.titre, donnees.description, donnees.champs);
      setFormulaires((liste) => editionId ? liste.map((item) => item.id === formulaire.id ? formulaire : item) : [formulaire, ...liste]);
      setFormulaireActif(formulaire);
      setReponses([]);
      if (!editionId) await navigator.clipboard?.writeText(formulaire.url_publique);
      setEditionId(null);
      alert(editionId ? "Formulaire modifié avec succès." : "Formulaire créé. Le lien public externe a été copié.");
    } catch (erreur) {
      alert(erreur instanceof Error ? erreur.message : "Impossible de créer le formulaire.");
    } finally { setChargement(false); }
  }

  async function ouvrirReponses(formulaire: FormulairePersonnalise) {
    setFormulaireActif(formulaire);
    setReponses(await listerReponsesFormulaire(formulaire.id));
  }

  function editerFormulaire(formulaire: FormulairePersonnalise) {
    setEditionId(formulaire.id);
    setTitre(formulaire.titre);
    setDescription(formulaire.description || "");
    setChamps(formulaire.champs?.length ? formulaire.champs : [nouveauChampPersonnalise()]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function supprimerFormulaire(id: string) {
    if (!confirm("Supprimer ce formulaire personnalisé ?")) return;
    await supprimerFormulairePersonnalise(id);
    setFormulaires((liste) => liste.filter((item) => item.id !== id));
    if (formulaireActif?.id === id) { setFormulaireActif(null); setReponses([]); }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-custom-form">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button>
        <div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8"><span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span><h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Créateur de formulaire personnalisable</h1><p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Créez un formulaire champ par champ, partagez un lien public externe et consultez les réponses.</p></div>
        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <form onSubmit={creer} className="rounded-2xl border border-border bg-card/95 p-4 shadow-document lg:p-6">
            <div className="grid gap-4"><label><span className="mb-1 block text-sm font-semibold text-foreground">Titre *</span><input value={titre} onChange={(e) => setTitre(e.target.value.slice(0, 120))} className="form-control" /></label><label><span className="mb-1 block text-sm font-semibold text-foreground">Description</span><textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 1000))} rows={3} className="form-control" /></label></div>
            <div className="mt-5 rounded-xl bg-muted p-3"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-bold text-foreground">Champs du formulaire</h2><button type="button" onClick={() => setChamps([...champs, nouveauChampPersonnalise()])} className="mini-button"><Plus className="size-4" /> Ajouter</button></div><div className="space-y-3">{champs.map((champ, index) => <div key={champ.id} className="grid gap-2 rounded-lg bg-card p-3 sm:grid-cols-[1fr_130px_90px_40px]"><input value={champ.label} onChange={(e) => setChamps(champs.map((item) => item.id === champ.id ? { ...item, label: e.target.value.slice(0, 80) } : item))} className="form-control" /><select value={champ.type} onChange={(e) => setChamps(champs.map((item) => item.id === champ.id ? { ...item, type: e.target.value as TypeChampPersonnalise } : item))} className="form-control">{typesChampsPersonnalises.map((type) => <option key={type} value={type}>{type}</option>)}</select><label className="flex items-center gap-2 rounded-lg border border-border px-3 text-sm font-bold"><input type="checkbox" checked={champ.requis} onChange={(e) => setChamps(champs.map((item) => item.id === champ.id ? { ...item, requis: e.target.checked } : item))} /> Requis</label><button type="button" onClick={() => setChamps(champs.filter((_, i) => i !== index))} className="tool-action danger"><Trash2 className="size-4" /></button></div>)}</div></div>
            <div className="mt-6 flex justify-end"><button disabled={chargement} className="primary-action"><Save className="size-4" /> {chargement ? "Enregistrement…" : editionId ? "Modifier le formulaire" : "Créer et copier le lien"}</button></div>
          </form>
          <section className="space-y-6"><div className="rounded-2xl border border-border bg-card p-5 shadow-document"><Link2 className="mb-3 size-8 text-primary" /><h2 className="text-xl font-bold text-foreground">Liens et réponses</h2><p className="mt-2 text-sm text-muted-foreground">Les liens générés utilisent le domaine public publié et restent accessibles aux personnes externes.</p></div><div className="rounded-2xl border border-border bg-card/95 p-4 shadow-document"><h2 className="mb-3 text-lg font-black text-foreground">Formulaires créés</h2><div className="space-y-3">{formulaires.length === 0 ? <p className="rounded-xl border border-dashed border-border bg-muted/60 p-5 text-sm text-muted-foreground">Aucun formulaire pour le moment.</p> : formulaires.map((formulaire) => <article key={formulaire.id} className="rounded-xl border border-border bg-background p-3"><h3 className="font-bold text-foreground">{formulaire.titre}</h3><p className="mt-1 break-all text-xs text-primary">{formulaire.url_publique}</p><div className="mt-3 grid grid-cols-5 gap-2"><button type="button" onClick={() => window.open(formulaire.url_publique, "_blank", "noopener,noreferrer")} className="tool-action"><Eye className="size-4" /></button><button type="button" onClick={() => navigator.clipboard?.writeText(formulaire.url_publique)} className="tool-action"><Copy className="size-4" /></button><button type="button" onClick={() => ouvrirReponses(formulaire)} className="tool-action"><FileDown className="size-4" /></button><button type="button" onClick={() => editerFormulaire(formulaire)} className="tool-action"><Pencil className="size-4" /></button><button type="button" onClick={() => supprimerFormulaire(formulaire.id)} className="tool-action danger"><Trash2 className="size-4" /></button></div></article>)}</div></div>{formulaireActif && <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-document"><h2 className="text-lg font-black text-foreground">Réponses · {formulaireActif.titre}</h2><div className="mt-3 space-y-3">{reponses.length === 0 ? <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Aucune réponse reçue.</p> : reponses.map((reponse) => <article key={reponse.id} className="rounded-xl border border-border bg-background p-3"><p className="mb-2 text-xs font-bold text-muted-foreground">{new Date(reponse.created_at).toLocaleString("fr-FR")}</p>{Object.entries(reponse.reponses).map(([key, value]) => <p key={key} className="text-sm"><strong>{key} :</strong> {String(value || "—")}</p>)}{Object.entries(reponse.fichiers).map(([key, file]) => <a key={key} href={file.contenu} download={file.nom} className="mt-2 block text-sm font-bold text-primary">Télécharger {key} · {file.nom}</a>)}</article>)}</div></div>}</section>
        </div>
      </div>
    </main>
  );
}

function HistoriqueConnexionTool({ retour }: { retour: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [connexions, setConnexions] = useState<ConnexionScm[]>([]);
  const [chargement, setChargement] = useState(false);
  useEffect(() => { charger(); }, [date]);
  async function charger() { setChargement(true); try { setConnexions(await listerConnexionsScm(date)); } catch (e) { alert(e instanceof Error ? e.message : "Chargement impossible."); } finally { setChargement(false); } }
  async function telechargerPdf() {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageLargeur = pdf.internal.pageSize.getWidth();
    const pageHauteur = pdf.internal.pageSize.getHeight();
    const marge = 14;
    const logo = await imageAssetEnDataUrl(scmLogo);
    const dateLisible = new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const dessinerEntete = () => { pdf.setFillColor(18, 83, 105); pdf.rect(0, 0, pageLargeur, 45, "F"); pdf.setFillColor(239, 184, 56); pdf.rect(0, 41, pageLargeur, 4, "F"); pdf.addImage(logo, "JPEG", marge, 10, 31, 20); pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(19); pdf.text("Rapport journalier de connexion", 52, 18); pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.text(`SCM SARL · ${dateLisible}`, 52, 27); pdf.setFillColor(255, 255, 255); pdf.roundedRect(pageLargeur - 48, 11, 34, 18, 3, 3, "F"); pdf.setTextColor(18, 83, 105); pdf.setFont("helvetica", "bold"); pdf.setFontSize(13); pdf.text(String(connexions.length).padStart(2, "0"), pageLargeur - 39, 21); pdf.setFontSize(6.8); pdf.text("CONNEXIONS", pageLargeur - 43, 27); };
    const dessinerPied = (page: number) => { pdf.setDrawColor(226, 232, 240); pdf.line(marge, pageHauteur - 14, pageLargeur - marge, pageHauteur - 14); pdf.setTextColor(100, 116, 139); pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.text(`Généré le ${new Date().toLocaleString("fr-FR")}`, marge, pageHauteur - 8); pdf.text(`Page ${page}`, pageLargeur - marge - 12, pageHauteur - 8); };
    let page = 1; let y = 68;
    dessinerEntete(); dessinerPied(page);
    pdf.setFillColor(241, 245, 249); pdf.roundedRect(marge, 54, pageLargeur - marge * 2, 10, 2, 2, "F"); pdf.setTextColor(18, 83, 105); pdf.setFont("helvetica", "bold"); pdf.setFontSize(8.5); pdf.text("HEURE", 18, 60.5); pdf.text("NOM", 48, 60.5); pdf.text("RÔLE", 121, 60.5); pdf.text("MATRICULE", 157, 60.5);
    if (!connexions.length) { pdf.setTextColor(71, 85, 105); pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.text("Aucune connexion enregistrée pour cette date.", marge, 78); }
    connexions.forEach((c, index) => { if (y > 266) { pdf.addPage(); page += 1; dessinerEntete(); dessinerPied(page); y = 58; } pdf.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252); pdf.roundedRect(marge, y - 5, pageLargeur - marge * 2, 9, 1.5, 1.5, "F"); pdf.setTextColor(15, 23, 42); pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.text(new Date(c.connected_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), 18, y); pdf.setFont("helvetica", "normal"); pdf.text(pdf.splitTextToSize(c.nom_utilisateur || "—", 66), 48, y); pdf.setTextColor(21, 128, 61); pdf.setFont("helvetica", "bold"); pdf.text(c.role || "—", 121, y); pdf.setTextColor(15, 23, 42); pdf.setFont("helvetica", "normal"); pdf.text(c.matricule || "—", 157, y); y += 10; });
    pdf.save(`rapport-connexions-${date}.pdf`);
  }
  return <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-login-history"><div className="mx-auto max-w-7xl"><button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button><div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8"><span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span><h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Historique de connexion</h1><p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Voyez qui s’est connecté, à quelle heure, et téléchargez le rapport journalier.</p></div><section className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><label className="w-full sm:max-w-xs"><span className="mb-1 block text-sm font-semibold text-foreground">Date</span><input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} /></label><button className="primary-action" onClick={telechargerPdf}><FileDown className="size-4" /> Télécharger PDF</button></div><div className="mt-5 space-y-3">{chargement ? <p className="rounded-xl bg-muted p-4 text-sm font-bold">Chargement…</p> : connexions.length ? connexions.map((c) => <article key={c.id} className="grid gap-2 rounded-xl border border-border bg-background p-4 sm:grid-cols-[110px_1fr_130px_120px]"><strong>{new Date(c.connected_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</strong><span>{c.nom_utilisateur || "—"}</span><span className="font-bold text-primary">{c.role}</span><span>{c.matricule || "—"}</span></article>) : <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Aucune connexion pour cette date.</p>}</div></section></div></main>;
}

function CalendrierFeriesTool({ retour }: { retour: () => void }) {
  const [jours, setJours] = useState<JourNonTravaille[]>([]);
  const [form, setForm] = useState({ date_jour: new Date().toISOString().slice(0, 10), titre: "", description: "", type_jour: "jour_ferie", actif: true });
  const [editionId, setEditionId] = useState<string | undefined>();

  useEffect(() => { charger(); }, []);

  async function charger() {
    try { setJours(await listerJoursNonTravailles()); } catch (e) { alert(e instanceof Error ? e.message : "Chargement impossible."); }
  }

  async function enregistrer(event: React.FormEvent) {
    event.preventDefault();
    if (!form.titre.trim()) return alert("Le titre est obligatoire.");
    await enregistrerJourNonTravaille({ ...form, titre: form.titre.trim(), description: form.description.trim() }, editionId);
    setForm({ date_jour: new Date().toISOString().slice(0, 10), titre: "", description: "", type_jour: "jour_ferie", actif: true });
    setEditionId(undefined);
    await charger();
  }

  async function retirer(id: string) {
    if (!confirm("Supprimer ce jour ?")) return;
    await supprimerJourNonTravaille(id);
    await charger();
  }

  function modifier(jour: JourNonTravaille) {
    setEditionId(jour.id);
    setForm({ date_jour: jour.date_jour, titre: jour.titre, description: jour.description, type_jour: jour.type_jour, actif: jour.actif });
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-holiday-calendar">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button>
        <div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8">
          <span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span>
          <h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Calendrier des jours fériés</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Les jours actifs apparaissent automatiquement chez les employés et chefs de chantier.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={enregistrer} className="rounded-2xl border border-border bg-card p-5 shadow-document">
            <div className="grid gap-4">
              <label><span className="mb-1 block text-sm font-semibold">Date</span><input type="date" className="form-control" value={form.date_jour} onChange={(e) => setForm({ ...form, date_jour: e.target.value })} /></label>
              <label><span className="mb-1 block text-sm font-semibold">Titre</span><input className="form-control" maxLength={120} value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></label>
              <label><span className="mb-1 block text-sm font-semibold">Type</span><select className="form-control" value={form.type_jour} onChange={(e) => setForm({ ...form, type_jour: e.target.value })}><option value="jour_ferie">Jour férié</option><option value="jour_non_travaille">Jour non travaillé</option></select></label>
              <label><span className="mb-1 block text-sm font-semibold">Description</span><textarea className="form-control" rows={4} maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
              <label className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm font-bold"><input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} /> Actif</label>
              <button className="primary-action"><Save className="size-4" /> {editionId ? "Modifier" : "Ajouter"}</button>
            </div>
          </form>
          <section className="rounded-2xl border border-border bg-card p-5 shadow-document">
            <h2 className="text-xl font-black">Jours configurés</h2>
            <div className="mt-4 space-y-3">
              {jours.map((jour) => (
                <article key={jour.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-primary">{new Date(jour.date_jour).toLocaleDateString("fr-FR")} · {jour.type_jour === "jour_ferie" ? "Jour férié" : "Jour non travaillé"}</p>
                      <h3 className="mt-1 text-lg font-black">{jour.titre}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{jour.description || "—"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="tool-action" onClick={() => modifier(jour)}><CalendarDays className="size-4" /></button>
                      <button type="button" className="tool-action danger" onClick={() => retirer(jour.id)}><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                </article>
              ))}
              {!jours.length && <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Aucun jour configuré.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function DemandesCongesTool({ retour }: { retour: () => void }) {
  const [demandes, setDemandes] = useState<DemandeConge[]>([]);
  const [chargement, setChargement] = useState(false);
  useEffect(() => { charger(); }, []);
  async function charger() { setChargement(true); try { setDemandes(await listerDemandesConges()); } catch (e) { alert(e instanceof Error ? e.message : "Chargement impossible."); } finally { setChargement(false); } }
  return <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-leave-requests"><div className="mx-auto max-w-7xl"><button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button><div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8"><span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span><h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Demandes de Congés</h1><p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Toutes les demandes envoyées depuis les dashboards employés.</p></div><section className="grid gap-4 xl:grid-cols-2">{chargement ? <p className="rounded-2xl bg-card p-5 font-bold shadow-document">Chargement…</p> : demandes.length ? demandes.map((d) => <article key={d.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{d.statut}</span><h2 className="mt-3 text-xl font-black">{d.employe_nom || "Employé"}</h2><p className="text-xs font-bold text-muted-foreground">{new Date(d.created_at).toLocaleString("fr-FR")}</p></div><ClipboardList className="size-7 text-primary" /></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{d.raison || "—"}</p>{d.image_url && <img src={d.image_url} alt={`Justificatif congé ${d.employe_nom}`} className="mt-4 max-h-80 w-full rounded-2xl object-contain bg-muted" loading="lazy" />}</article>) : <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-document">Aucune demande de congé reçue.</p>}</section></div></main>;
}

function BilansSanteTool({ retour }: { retour: () => void }) {
  const [bilans, setBilans] = useState<BilanSanteEmploye[]>([]);
  const [chargement, setChargement] = useState(false);
  useEffect(() => { charger(); }, []);
  async function charger() { setChargement(true); try { setBilans(await listerBilansSanteEmployes()); } catch (e) { alert(e instanceof Error ? e.message : "Chargement impossible."); } finally { setChargement(false); } }
  return <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-health-report"><div className="mx-auto max-w-7xl"><button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button><div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8"><span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span><h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Bilan de santé des employé</h1><p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Rapports hebdomadaires complétés par les employés.</p></div><section className="grid gap-4 xl:grid-cols-2">{chargement ? <p className="rounded-2xl bg-card p-5 font-bold shadow-document">Chargement…</p> : bilans.length ? bilans.map((b) => <article key={b.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">Semaine du {new Date(b.semaine).toLocaleDateString("fr-FR")}</span><h2 className="mt-3 text-xl font-black">{b.employe_nom || "Employé"}</h2></div><HeartPulse className="size-7 text-primary" /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><InfoMini label="État global" value={b.etat_global} /><InfoMini label="Groupe sanguin" value={b.groupe_sanguin} /><InfoMini label="Allergies" value={b.allergies || "Aucune"} /><InfoMini label="Blessure" value={b.blessure ? "Oui" : "Non"} /></div>{b.details_blessure && <p className="mt-4 rounded-xl bg-muted p-3 text-sm font-semibold text-muted-foreground">{b.details_blessure}</p>}</article>) : <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-document">Aucun bilan de santé reçu.</p>}</section></div></main>;
}

function GestionMaterielTool({ retour }: { retour: () => void }) {
  const [rapports, setRapports] = useState<RapportMateriel[]>([]);
  const [chargement, setChargement] = useState(false);
  useEffect(() => { charger(); }, []);
  async function charger() { setChargement(true); try { setRapports(await listerRapportsMateriel()); } catch (e) { alert(e instanceof Error ? e.message : "Chargement impossible."); } finally { setChargement(false); } }
  return <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-material-management"><div className="mx-auto max-w-7xl"><button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button><div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8"><span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span><h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Gestion de Matériel</h1><p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Rapports envoyés par les chefs de chantier chaque samedi.</p></div><section className="grid gap-4 xl:grid-cols-2">{chargement ? <p className="rounded-2xl bg-card p-5 font-bold shadow-document">Chargement…</p> : rapports.length ? rapports.map((r) => <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">Semaine du {new Date(r.semaine).toLocaleDateString("fr-FR")}</span><h2 className="mt-3 text-xl font-black">{r.chantier_nom || "Chantier"}</h2><p className="text-sm font-bold text-muted-foreground">{r.chef_chantier_nom || "Chef de chantier"}</p></div><ClipboardList className="size-7 text-primary" /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><ListeMateriel titre="Utilisé" items={r.materiel_utilise} /><ListeMateriel titre="Récupéré" items={r.materiel_recupere} /><ListeMateriel titre="Perdu" items={r.materiel_perdu} /><ListeMateriel titre="Prévu" items={r.materiel_prevu} /></div>{r.notes && <p className="mt-4 rounded-xl bg-muted p-3 text-sm font-semibold text-muted-foreground">{r.notes}</p>}</article>) : <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-document">Aucun rapport matériel reçu.</p>}</section></div></main>;
}

function ArrivagesMaterielTool({ retour }: { retour: () => void }) {
  const [arrivages, setArrivages] = useState<ArrivageMateriel[]>([]);
  const [chargement, setChargement] = useState(false);
  useEffect(() => { setChargement(true); listerArrivagesMateriel().then(setArrivages).catch((e) => alert(e instanceof Error ? e.message : "Chargement impossible.")).finally(() => setChargement(false)); }, []);
  return <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-material-management"><div className="mx-auto max-w-7xl"><button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button><div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8"><span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span><h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Suive D'arrivage de Matériel</h1><p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Rapports de livraisons reçues sur les chantiers.</p></div><section className="grid gap-4 xl:grid-cols-2">{chargement ? <p className="rounded-2xl bg-card p-5 font-bold shadow-document">Chargement…</p> : arrivages.length ? arrivages.map((a) => <article key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{new Date(a.date_livraison).toLocaleDateString("fr-FR")}</span><h2 className="mt-3 text-xl font-black">{a.nom_materiel}</h2><p className="text-sm font-bold text-muted-foreground">{a.chantier_nom || "Chantier"} · {a.chef_chantier_nom}</p></div><PackageCheck className="size-7 text-primary" /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><InfoMini label="Quantité" value={String(a.quantite || 0)} /><InfoMini label="Partenaire" value={a.entreprise_partenaire} /><InfoMini label="Prix total" value={`${Number(a.prix_total || 0).toLocaleString("fr-FR")} $`} /><InfoMini label="Statut" value={a.statut} /></div>{a.informations_supplementaires && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-muted p-3 text-sm font-semibold text-muted-foreground">{a.informations_supplementaires}</p>}{a.preuve_image_url && <img src={a.preuve_image_url} alt={`Preuve livraison ${a.nom_materiel}`} className="mt-4 max-h-80 w-full rounded-2xl bg-muted object-contain" loading="lazy" />}</article>) : <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-document">Aucun arrivage de matériel reçu.</p>}</section></div></main>;
}

function IncidentsChantierTool({ retour }: { retour: () => void }) {
  const [incidents, setIncidents] = useState<IncidentChantier[]>([]); const [chargement, setChargement] = useState(false);
  useEffect(() => { setChargement(true); listerIncidentsChantier().then(setIncidents).catch((e) => alert(e instanceof Error ? e.message : "Chargement impossible.")).finally(() => setChargement(false)); }, []);
  return <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-site-incident"><div className="mx-auto max-w-7xl"><button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button><div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8"><span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span><h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Incident et Accident du chantier</h1><p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Alertes envoyées depuis les dashboards des chefs de chantier.</p></div><section className="grid gap-4 xl:grid-cols-2">{chargement ? <p className="rounded-2xl bg-card p-5 font-bold shadow-document">Chargement…</p> : incidents.length ? incidents.map((i) => <article key={i.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-black text-destructive">{i.type_evenement}</span><h2 className="mt-3 text-xl font-black">{i.chantier_nom || "Chantier"}</h2><p className="text-sm font-bold text-muted-foreground">{i.chef_chantier_nom} · {new Date(i.date_evenement).toLocaleDateString("fr-FR")}</p></div><AlertTriangle className="size-7 text-destructive" /></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{i.explication || "—"}</p>{!!i.images?.length && <div className="mt-4 grid gap-3 sm:grid-cols-2">{i.images.map((image, index) => <img key={image} src={image} alt={`Incident chantier ${index + 1}`} className="max-h-64 w-full rounded-2xl bg-muted object-contain" loading="lazy" />)}</div>}</article>) : <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-document">Aucune alerte reçue.</p>}</section></div></main>;
}

function ArchivesChantiersTool({ retour }: { retour: () => void }) {
  const [archives, setArchives] = useState<ArchiveChantier[]>([]); const [employes, setEmployes] = useState<EmployeRecord[]>([]); const [selection, setSelection] = useState<string[]>([]); const [imagesChantier, setImagesChantier] = useState<string[]>([]); const [chargement, setChargement] = useState(false); const [form, setForm] = useState({ nom_chantier: "", nom_client: "", date_debut_construction: "", date_finalisation_construction: "", budget_estime_debut: "", budget_final: "", adresse_projet: "" });
  useEffect(() => { Promise.all([listerArchivesChantiers(), listerEmployes()]).then(([a, e]) => { setArchives(a); setEmployes(e); }).catch((e) => alert(e instanceof Error ? e.message : "Chargement impossible.")); }, []);
  async function enregistrer(event: React.FormEvent) { event.preventDefault(); if (!form.nom_chantier.trim() || !form.nom_client.trim()) return alert("Le chantier et le client sont obligatoires."); setChargement(true); try { const employes_participants = employes.filter((e) => selection.includes(e.id)); const base = { nom_chantier: form.nom_chantier.trim(), nom_client: form.nom_client.trim(), date_debut_construction: form.date_debut_construction || null, date_finalisation_construction: form.date_finalisation_construction || null, budget_estime_debut: Number(form.budget_estime_debut) || 0, budget_final: Number(form.budget_final) || 0, adresse_projet: form.adresse_projet.trim(), employes_participants, images_chantier: imagesChantier }; const pdf_base64 = await creerPdfArchiveChantier(base); const archive = await enregistrerArchiveChantier({ ...base, pdf_base64, nom_fichier: `Archive-${base.nom_chantier.replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.pdf` }); setArchives((liste) => [archive, ...liste]); setSelection([]); setImagesChantier([]); alert("Fiche chantier archivée en PDF."); } catch (e) { alert(e instanceof Error ? e.message : "Archive impossible."); } finally { setChargement(false); } }
  async function televerserImagesArchive(files: FileList | null) { if (!files?.length) return; setChargement(true); try { const urls = await Promise.all([...files].map((file) => televerserImageArchiveChantier(file))); setImagesChantier((liste) => [...liste, ...urls]); } catch (e) { alert(e instanceof Error ? e.message : "Images impossibles à importer."); } finally { setChargement(false); } }
  return <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-site-archive"><div className="mx-auto max-w-7xl"><button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button><div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8"><span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span><h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Archive des chantier</h1><p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Créez et téléchargez les fiches PDF des chantiers finalisés.</p></div><div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]"><form onSubmit={enregistrer} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="grid gap-4 sm:grid-cols-2">{Object.entries({ nom_chantier: "Nom du chantier", nom_client: "Nom du client", date_debut_construction: "Date du début", date_finalisation_construction: "Date finalisation", budget_estime_debut: "Budget estimé", budget_final: "Budget final", adresse_projet: "Adresse du projet" }).map(([key, label]) => <label key={key} className={key === "adresse_projet" ? "sm:col-span-2" : ""}><span className="mb-1 block text-sm font-semibold">{label}</span><input className="form-control" type={key.includes("date") ? "date" : key.includes("budget") ? "number" : "text"} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}</div><div className="mt-4 rounded-xl bg-muted p-3"><span className="mb-2 block text-sm font-semibold">Images du chantier</span><input type="file" accept="image/*" multiple className="file-input" onChange={(e) => televerserImagesArchive(e.target.files)} />{!!imagesChantier.length && <div className="mt-3 grid grid-cols-3 gap-2">{imagesChantier.map((image) => <img key={image} src={image} alt="Image chantier archivé" className="h-20 w-full rounded-lg bg-card object-cover" loading="lazy" />)}</div>}</div><div className="mt-4 rounded-xl bg-muted p-3"><span className="mb-2 block text-sm font-semibold">Employés participants</span><div className="grid max-h-56 gap-2 overflow-auto">{employes.map((e) => <label key={e.id} className="flex gap-2 rounded-lg bg-card p-2 text-sm font-bold"><input type="checkbox" checked={selection.includes(e.id)} onChange={(event) => setSelection(event.target.checked ? [...selection, e.id] : selection.filter((id) => id !== e.id))} />{e.nom_complet}</label>)}</div></div><button disabled={chargement} className="primary-action mt-5 w-full"><Save className="size-4" /> {chargement ? "Génération…" : "Créer la fiche PDF"}</button></form><section className="grid gap-4">{archives.map((a) => <article key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">{a.nom_chantier}</h2><p className="text-sm font-bold text-muted-foreground">{a.nom_client} · {a.adresse_projet}</p></div><Archive className="size-7 text-primary" /></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><InfoMini label="Budget début" value={`${Number(a.budget_estime_debut).toLocaleString("fr-FR")} $`} /><InfoMini label="Budget final" value={`${Number(a.budget_final).toLocaleString("fr-FR")} $`} /><InfoMini label="Participants" value={String(a.employes_participants?.length || 0)} /></div>{!!a.images_chantier?.length && <div className="mt-4 grid grid-cols-3 gap-2">{a.images_chantier.slice(0, 6).map((image) => <img key={image} src={image} alt={`Archive chantier ${a.nom_chantier}`} className="h-24 w-full rounded-xl bg-muted object-cover" loading="lazy" />)}</div>}<button type="button" onClick={() => telechargerPdf(a.pdf_base64, a.nom_fichier)} className="primary-action mt-4"><FileDown className="size-4" /> Télécharger le PDF</button></article>)}</section></div></div></main>;
}
function InfoMini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-black uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold">{value || "—"}</p></div>; }
function ListeMateriel({ titre, items }: { titre: string; items: { nom: string; quantite: number }[] }) { return <div className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-black uppercase text-muted-foreground">{titre}</p><div className="mt-2 space-y-1">{items?.length ? items.map((item, index) => <p key={`${titre}-${item.nom}-${index}`} className="text-sm font-bold">{item.nom} × {item.quantite || 1}</p>) : <p className="text-sm font-bold text-muted-foreground">—</p>}</div></div>; }

function OrganigrammeTool({ retour }: { retour: () => void }) {
  const [organigrammes, setOrganigrammes] = useState<OrganigrammeEntreprise[]>([]);
  const [editionId, setEditionId] = useState<string | undefined>();
  const [titre, setTitre] = useState("Organigramme SCM SARL");
  const [description, setDescription] = useState("Compétence · Engagement · Performance");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFichier, setImageFichier] = useState<File>();
  const [chargement, setChargement] = useState(false);
  useEffect(() => { listerOrganigrammesEntreprise().then(setOrganigrammes).catch((e) => alert(e instanceof Error ? e.message : "Chargement impossible.")); }, []);
  const imagePreview = imageFichier ? URL.createObjectURL(imageFichier) : imageUrl;
  async function enregistrer(event: React.FormEvent) { event.preventDefault(); if (!imageFichier && !imageUrl) return alert("Veuillez importer une image d’organigramme."); setChargement(true); try { const url = imageFichier ? await televerserImageOrganigramme(imageFichier) : imageUrl; const item = await enregistrerOrganigrammeEntreprise({ titre, description, blocs: [{ id: "image-organigramme", titre, niveau: 0, couleur: "bleu", image_url: url }], actif: true }, editionId); setOrganigrammes((liste) => editionId ? liste.map((o) => o.id === item.id ? item : o) : [item, ...liste]); setEditionId(item.id); setImageUrl(url); setImageFichier(undefined); alert("Image d’organigramme publiée sur les dashboards employés."); } catch (erreur) { alert(erreur instanceof Error ? erreur.message : "Publication impossible."); } finally { setChargement(false); } }
  async function retirer(id: string) { if (!confirm("Supprimer cet organigramme ?")) return; await supprimerOrganigrammeEntreprise(id); setOrganigrammes((liste) => liste.filter((item) => item.id !== id)); }
  function modifier(item: OrganigrammeEntreprise) { setEditionId(item.id); setTitre(item.titre); setDescription(item.description); setImageUrl(String(item.blocs?.[0]?.image_url || "")); setImageFichier(undefined); window.scrollTo({ top: 0, behavior: "smooth" }); }
  return <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-organization-chart"><div className="mx-auto max-w-7xl"><button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button><div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8"><span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span><h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Organigramme de l’entreprise</h1><p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Importez l’image officielle de l’organigramme visible par tous les employés.</p></div><div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]"><form onSubmit={enregistrer} className="rounded-2xl border border-border bg-card p-5 shadow-document"><div className="grid gap-4"><label><span className="mb-1 block text-sm font-semibold">Titre</span><input className="form-control" value={titre} onChange={(e) => setTitre(e.target.value)} /></label><label><span className="mb-1 block text-sm font-semibold">Signature</span><input className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} /></label><label><span className="mb-1 block text-sm font-semibold">Image de l’organigramme *</span><input type="file" accept="image/*" className="file-input" onChange={(e) => setImageFichier(e.target.files?.[0])} /></label></div><button disabled={chargement} className="primary-action mt-5 w-full"><Save className="size-4" /> {chargement ? "Publication…" : editionId ? "Modifier l’image" : "Publier l’image"}</button><div className="mt-5 space-y-3">{organigrammes.map((item) => <article key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"><strong className="text-sm">{item.titre}</strong><div className="flex gap-2"><button type="button" className="tool-action" onClick={() => modifier(item)}><Pencil className="size-4" /></button><button type="button" className="tool-action danger" onClick={() => retirer(item.id)}><Trash2 className="size-4" /></button></div></article>)}</div></form><section className="rounded-2xl border border-border bg-card p-4 shadow-document"><div className="org-chart org-image-chart"><img src={scmLogo} alt="Logo SCM SARL" className="org-logo" /><h2>ORGANIGRAMME</h2><div className="org-line" />{imagePreview ? <img src={imagePreview} alt="Organigramme SCM SARL" className="org-uploaded-image" /> : <div className="rounded-2xl border border-dashed border-border bg-muted p-8 text-center text-sm font-bold text-muted-foreground">Aucune image sélectionnée.</div>}</div><p className="mt-4 text-center text-sm font-black text-muted-foreground">{description}</p></section></div></div></main>;
}

function FactureEmployeTool({ retour }: { retour: () => void }) {
  const [employes, setEmployes] = useState<EmployeRecord[]>([]);
  const [employeId, setEmployeId] = useState<string>("");
  const [salaireBrut, setSalaireBrut] = useState<number>(0);
  const [salaireBrutPersonnalise, setSalaireBrutPersonnalise] = useState<boolean>(false);
  const [periode, setPeriode] = useState<string>(() => new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }));
  const [date, setDate] = useState<string>(aujourdhui);
  const [modePaiement, setModePaiement] = useState<string>("Virement bancaire");
  const [notes, setNotes] = useState<string>("");
  const [signataireNom, setSignataireNom] = useState<string>("");
  const [signataireFonction, setSignataireFonction] = useState<string>("Directeur des Ressources Humaines");
  const [deductions, setDeductions] = useState<LigneDeduction[]>([{ libelle: "Frais entreprise", pourcentage: 1.2 }]);
  const [sceau, setSceau] = useState<File>();
  const [signature, setSignature] = useState<File>();
  const [chargement, setChargement] = useState(false);
  const [factures, setFactures] = useState<FactureEmployeRecord[]>([]);
  const [recherche, setRecherche] = useState("");
  const [editionId, setEditionId] = useState<string | null>(null);

  useEffect(() => { listerEmployes().then(setEmployes).catch((e) => alert(e instanceof Error ? e.message : "Impossible de charger les employés.")); }, []);
  useEffect(() => { listerFacturesEmployes(recherche).then(setFactures).catch((e) => alert(e instanceof Error ? e.message : "Chargement impossible.")); }, [recherche]);

  const employeSelectionne = useMemo(() => employes.find((e) => e.id === employeId), [employes, employeId]);

  useEffect(() => {
    if (employeSelectionne && !salaireBrutPersonnalise) {
      setSalaireBrut(Number((employeSelectionne as any).salaire || (employeSelectionne as any).salaire_total || 0));
    }
  }, [employeSelectionne, salaireBrutPersonnalise]);

  const totalDeductions = useMemo(() => deductions.reduce((s, d) => s + Number(salaireBrut || 0) * Number(d.pourcentage || 0) / 100, 0), [deductions, salaireBrut]);
  const salaireNet = Math.max(0, Number(salaireBrut || 0) - totalDeductions);

  function lireFichier(file?: File): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(undefined);
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function genererFacture(event: React.FormEvent) {
    event.preventDefault();
    if (!employeSelectionne) return alert("Veuillez sélectionner un employé.");
    if (!salaireBrut || salaireBrut <= 0) return alert("Le salaire brut doit être supérieur à 0.");
    if (!periode.trim()) return alert("Veuillez renseigner la période de paie.");
    setChargement(true);
    try {
      const sceauBase64 = await lireFichier(sceau);
      const signatureBase64 = await lireFichier(signature);
      const deductionsActives = deductions.filter((d) => d.libelle.trim() && Number(d.pourcentage || 0) > 0);
      const numero = factures.find((f) => f.id === editionId)?.numero;
      const pdf = await creerPdfFactureEmploye({
        employe: employeSelectionne,
        numero: numero || `FAE-${Date.now()}`,
        date,
        periode: periode.trim(),
        salaireBrut: Number(salaireBrut),
        deductions: deductionsActives,
        notes: notes.trim(),
        modePaiement: modePaiement.trim(),
        signataireNom: signataireNom.trim(),
        signataireFonction: signataireFonction.trim(),
        sceau: sceauBase64,
        signature: signatureBase64,
      });
      const payload: Record<string, unknown> = {
        employeId: employeSelectionne.id, date, periode: periode.trim(), salaireBrut: Number(salaireBrut),
        deductions: deductionsActives, totalDeductions, salaireNet, modePaiement: modePaiement.trim(),
        notes: notes.trim(), signataireNom: signataireNom.trim(), signataireFonction: signataireFonction.trim(),
      };
      await enregistrerFactureEmploye(payload, pdf, {
        employeId: employeSelectionne.id, employeNom: employeSelectionne.nom_complet || "",
        matricule: employeSelectionne.matricule || "", poste: employeSelectionne.poste || "",
        salaireBrut: Number(salaireBrut), totalDeductions, salaireNet,
      }, numero, editionId || undefined);
      setEditionId(null);
      setFactures(await listerFacturesEmployes(recherche));
      alert(editionId ? "Facture employé modifiée et réenregistrée." : "Facture employé générée et enregistrée avec succès.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Génération impossible.");
    } finally { setChargement(false); }
  }

  function editerFacture(facture: FactureEmployeRecord) {
    const donnees = facture.donnees_formulaire || {};
    setEditionId(facture.id);
    setEmployeId(String((donnees as any).employeId || facture.employe_id || ""));
    setSalaireBrut(Number(facture.salaire_brut || 0));
    setSalaireBrutPersonnalise(true);
    setPeriode(String((donnees as any).periode || ""));
    setDate(facture.date_document || aujourdhui);
    setModePaiement(String((donnees as any).modePaiement || "Virement bancaire"));
    setNotes(String((donnees as any).notes || ""));
    setSignataireNom(String((donnees as any).signataireNom || ""));
    setSignataireFonction(String((donnees as any).signataireFonction || "Directeur des Ressources Humaines"));
    setDeductions(Array.isArray((donnees as any).deductions) && (donnees as any).deductions.length ? (donnees as any).deductions as LigneDeduction[] : [{ libelle: "Frais entreprise", pourcentage: 1.2 }]);
    setSceau(undefined); setSignature(undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function supprimerFacture(id: string) {
    if (!confirm("Supprimer définitivement cette facture employé ?")) return;
    await supprimerDocument("facture_employe", id);
    setFactures(await listerFacturesEmployes(recherche));
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-employee-invoice">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button>
        <div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8">
          <span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span>
          <h1 className="max-w-3xl text-3xl font-black lg:text-5xl">Facture employé</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">Générez une facture de salaire professionnelle, avec déductions paramétrables et calcul automatique du salaire net.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <form onSubmit={genererFacture} className="rounded-2xl border border-border bg-card/95 p-4 shadow-document lg:p-6">
            <div className="grid gap-4">
              <label>
                <span className="mb-1 block text-sm font-semibold text-foreground">Employé *</span>
                <select className="form-control" value={employeId} onChange={(e) => { setEmployeId(e.target.value); setSalaireBrutPersonnalise(false); }}>
                  <option value="">— Sélectionner un employé —</option>
                  {employes.map((e) => <option key={e.id} value={e.id}>{e.nom_complet} · {e.matricule || "—"} · {e.poste || "—"}</option>)}
                </select>
              </label>

              {employeSelectionne && (
                <div className="rounded-xl border border-border bg-muted/60 p-3 text-sm">
                  <p className="font-bold text-foreground">{employeSelectionne.nom_complet}</p>
                  <p className="text-xs text-muted-foreground">Matricule : {employeSelectionne.matricule || "—"} · Poste : {employeSelectionne.poste || "—"}</p>
                  <p className="text-xs text-muted-foreground">Téléphone : {employeSelectionne.telephone || "—"} · Pièce : {employeSelectionne.numero_piece_identite || "—"}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-1 block text-sm font-semibold text-foreground">Période de paie *</span><input className="form-control" value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="Avril 2026" /></label>
                <label><span className="mb-1 block text-sm font-semibold text-foreground">Date d'émission</span><input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                <label><span className="mb-1 block text-sm font-semibold text-foreground">Salaire brut ($) *</span><input type="number" min={0} step="0.01" className="form-control" value={salaireBrut} onChange={(e) => { setSalaireBrut(Number(e.target.value)); setSalaireBrutPersonnalise(true); }} /><span className="mt-1 block text-xs text-muted-foreground">Pré-rempli depuis la fiche employé.</span></label>
                <label><span className="mb-1 block text-sm font-semibold text-foreground">Mode de paiement</span><input className="form-control" value={modePaiement} onChange={(e) => setModePaiement(e.target.value)} /></label>
              </div>

              <div className="rounded-xl bg-muted p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Déductions</h3>
                  <button type="button" onClick={() => setDeductions([...deductions, { libelle: "Nouvelle déduction", pourcentage: 1 }])} className="mini-button"><Plus className="size-4" /> Ajouter</button>
                </div>
                <div className="space-y-3">
                  {deductions.map((deduction, index) => (
                    <div key={index} className="grid gap-2 rounded-lg bg-card p-3 sm:grid-cols-[1fr_120px_40px]">
                      <input placeholder="Libellé (ex: Frais entreprise)" value={deduction.libelle} onChange={(e) => setDeductions(deductions.map((d, i) => i === index ? { ...d, libelle: e.target.value } : d))} className="form-control" />
                      <input type="number" min="0" step="0.01" value={deduction.pourcentage} onChange={(e) => setDeductions(deductions.map((d, i) => i === index ? { ...d, pourcentage: Number(e.target.value) } : d))} placeholder="%" className="form-control" />
                      <button type="button" onClick={() => setDeductions(deductions.filter((_, i) => i !== index))} className="tool-action danger"><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                  {!deductions.length && <p className="rounded-lg bg-card p-3 text-sm text-muted-foreground">Aucune déduction. Cliquez sur « Ajouter » pour en créer une.</p>}
                </div>
                <div className="mt-3 grid gap-2 text-sm font-bold text-foreground sm:grid-cols-3">
                  <span>Brut : {Number(salaireBrut).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $</span>
                  <span>Déductions : {totalDeductions.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $</span>
                  <span className="text-primary">Net : {salaireNet.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $</span>
                </div>
              </div>

              <label><span className="mb-1 block text-sm font-semibold text-foreground">Notes (optionnel)</span><textarea rows={3} className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Primes, retenues exceptionnelles, observations…" /></label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-1 block text-sm font-semibold text-foreground">Nom du signataire</span><input className="form-control" value={signataireNom} onChange={(e) => setSignataireNom(e.target.value)} placeholder="Direction SCM SARL" /></label>
                <label><span className="mb-1 block text-sm font-semibold text-foreground">Fonction du signataire</span><input className="form-control" value={signataireFonction} onChange={(e) => setSignataireFonction(e.target.value)} /></label>
                <label><span className="mb-1 block text-sm font-semibold text-foreground">Sceau de l'entreprise</span><input type="file" accept="image/*" onChange={(e) => setSceau(e.target.files?.[0])} className="file-input" /></label>
                <label><span className="mb-1 block text-sm font-semibold text-foreground">Signature de l'employé</span><input type="file" accept="image/*" onChange={(e) => setSignature(e.target.files?.[0])} className="file-input" /></label>
              </div>

              <div className="mt-2 flex flex-col gap-3 rounded-xl bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <strong className="text-lg text-foreground">Net à payer : {salaireNet.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $</strong>
                <button disabled={chargement} className="primary-action"><Save className="size-4" /> {chargement ? "Génération…" : editionId ? "Réenregistrer la facture" : "Générer et enregistrer la facture"}</button>
              </div>
            </div>
          </form>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-document">
              <Wallet className="mb-3 size-8 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Facture professionnelle</h2>
              <p className="mt-2 text-sm text-muted-foreground">Logo SCM SARL, drapeau de la RDC, mise en page élégante, déductions détaillées et calcul automatique du salaire net.</p>
            </div>

            <section className="rounded-2xl border border-border bg-card/90 p-4 shadow-document lg:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Historique</h2>
                  <p className="text-sm text-muted-foreground">Factures employés générées, téléchargeables.</p>
                </div>
                <label className="relative block sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none ring-ring transition focus:ring-2" />
                </label>
              </div>
              <div className="space-y-3">
                {factures.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/60 p-6 text-center text-sm text-muted-foreground">Aucune facture employé pour le moment.</div>
                ) : factures.map((facture) => (
                  <article key={facture.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-foreground">{facture.employe_nom || facture.nom_fichier}</h3>
                      <p className="text-xs text-muted-foreground">{facture.numero} · {facture.matricule || "—"} · Net : {Number(facture.salaire_net).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} $</p>
                      <p className="text-xs text-muted-foreground">{new Date(facture.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 sm:flex">
                      <button type="button" onClick={() => voirPdf(facture.pdf_base64)} className="tool-action" aria-label="Voir"><Eye className="size-4" /></button>
                      <button type="button" onClick={() => telechargerPdf(facture.pdf_base64, facture.nom_fichier)} className="tool-action" aria-label="Télécharger"><FileDown className="size-4" /></button>
                      <button type="button" onClick={() => editerFacture(facture)} className="tool-action" aria-label="Éditer"><Pencil className="size-4" /></button>
                      <button type="button" onClick={() => supprimerFacture(facture.id)} className="tool-action danger" aria-label="Supprimer"><Trash2 className="size-4" /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export function DocumentTool({ config, retour }: { config: Config; retour: () => void }) {
  if (config.type === "formulaire_personnalise") return <CustomFormTool retour={retour} />;
  if (config.type === "historique_connexion") return <HistoriqueConnexionTool retour={retour} />;
  if (config.type === "calendrier_feries") return <CalendrierFeriesTool retour={retour} />;
  if (config.type === "demandes_conges") return <DemandesCongesTool retour={retour} />;
  if (config.type === "bilans_sante") return <BilansSanteTool retour={retour} />;
  if (config.type === "gestion_materiel") return <GestionMaterielTool retour={retour} />;
  if (config.type === "arrivages_materiel") return <ArrivagesMaterielTool retour={retour} />;
  if (config.type === "incidents_chantier") return <IncidentsChantierTool retour={retour} />;
  if (config.type === "archives_chantiers") return <ArchivesChantiersTool retour={retour} />;
  if (config.type === "organigramme_entreprise") return <OrganigrammeTool retour={retour} />;
  if (config.type === "facture_employe") return <FactureEmployeTool retour={retour} />;
  if (config.type === "recu_employe") return <RecuEmployeTool retour={retour} />;
  if (config.type === "devis_estimatif") return <DevisEstimatifTool retour={retour} />;
  return <DocumentToolStandard config={config} retour={retour} />;
}

function DocumentToolStandard({ config, retour }: { config: Config; retour: () => void }) {

  const estCommunication = config.type === "communiquer";
  const avecDeductions = config.type === "facture" || config.type === "devis" || config.type === "recu";
  const [formulaire, setFormulaire] = useState<Record<string, string>>(() => Object.fromEntries(config.fields.map((field) => [field.name, field.defaultValue || ""])));
  const [lignes, setLignes] = useState<LignePrestation[]>([{ description: "", quantite: 1, prix: 0 }]);
  const [deductions, setDeductions] = useState<LigneDeduction[]>([]);
  const [imagesFormulaire, setImagesFormulaire] = useState<Record<string, File | undefined>>({});
  const [sceau, setSceau] = useState<File>();
  const [signature, setSignature] = useState<File>();
  const [libelleSceau, setLibelleSceau] = useState(estCommunication ? "Nom / fonction de celui qui impose le sceau" : "Sceau de l’entreprise");
  const [libelleSignature, setLibelleSignature] = useState("Signature du client");
  const [chargement, setChargement] = useState(false);
  const [actualisation, setActualisation] = useState(0);
  const [documentEdite, setDocumentEdite] = useState<DocumentRecord | null>(null);
  const [employes, setEmployes] = useState<EmployeRecord[]>([]);
  const [employesSelectionnes, setEmployesSelectionnes] = useState<string[]>([]);
  const estFacturePro = config.type === "facture";
  const [chantiers, setChantiers] = useState<Array<{ id: string; nom_chantier: string; budget_global: number }>>([]);
  const [chantierId, setChantierId] = useState<string>("");
  const [budgetTotalChantier, setBudgetTotalChantier] = useState<string>("");

  const totalAvantDeduction = useMemo(() => config.hasLines ? lignes.reduce((somme, ligne) => somme + Number(ligne.quantite || 0) * Number(ligne.prix || 0), 0) : Number(formulaire.total || formulaire.montant || formulaire.salaire || formulaire.budget || 0), [config.hasLines, formulaire, lignes]);
  const totalDeductions = useMemo(() => avecDeductions ? deductions.reduce((somme, deduction) => {
    const montantFixe = Number(deduction.montant ?? NaN);
    if (Number.isFinite(montantFixe)) return somme + montantFixe;
    return somme + totalAvantDeduction * Number(deduction.pourcentage || 0) / 100;
  }, 0) : 0, [avecDeductions, deductions, totalAvantDeduction]);
  // Les frais supplémentaires sont AJOUTÉS au total avant frais pour obtenir le montant final
  const total = totalAvantDeduction + totalDeductions;

  // Calculs auto budget chantier (facture pro uniquement)
  // Le budget payé correspond au montant final (qui inclut déjà les frais supplémentaires)
  const budgetTotalNum = Number(budgetTotalChantier || 0);
  const budgetPaye = estFacturePro ? total : 0;
  const budgetRestant = estFacturePro ? Math.max(0, budgetTotalNum - budgetPaye) : 0;
  // Si aucun chantier existant n'est sélectionné, on traite comme un nouveau chantier basé sur les infos client
  const estNouveauChantier = estFacturePro && !chantierId;
  const nomChantierEffectif = estFacturePro
    ? (chantiers.find((c) => c.id === chantierId)?.nom_chantier
        || (estNouveauChantier ? `Nouveau chantier — ${(formulaire.client || "").split("\n")[0].trim() || "Client non précisé"}` : ""))
    : "";

  useEffect(() => { if (config.type === "fiche_employe" || config.type === "code_qr") listerEmployes().then(setEmployes).catch((erreur) => alert(erreur instanceof Error ? erreur.message : "Impossible de charger les employés.")); }, [config.type]);

  useEffect(() => {
    if (!estFacturePro) return;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error } = await supabase.from("chantiers").select("id, nom_chantier, budget_global").order("nom_chantier", { ascending: true });
        if (error) throw error;
        setChantiers((data || []).map((c) => ({ id: c.id, nom_chantier: c.nom_chantier, budget_global: Number(c.budget_global || 0) })));
      } catch { /* silencieux : la saisie libre du budget reste possible */ }
    })();
  }, [estFacturePro]);

  function selectionnerChantier(id: string) {
    setChantierId(id);
    const chantier = chantiers.find((c) => c.id === id);
    if (chantier) setBudgetTotalChantier(String(chantier.budget_global || ""));
  }

  function changer(name: string, value: string) { setFormulaire((actuel) => ({ ...actuel, [name]: value })); }
  function changerImage(name: string, file?: File) { setImagesFormulaire((actuel) => ({ ...actuel, [name]: file })); }

  async function soumettre(event: React.FormEvent) {
    event.preventDefault();
    const manquant = config.fields.find((field) => field.required && !formulaire[field.name]?.trim());
    const imageManquante = config.fields.find((field) => field.required && field.type === "image" && !imagesFormulaire[field.name] && !(documentEdite?.donnees_formulaire || {})[field.name]);
    if (manquant && manquant.type !== "image") return alert(`Veuillez renseigner le champ : ${manquant.label}`);
    if (imageManquante) return alert(`Veuillez importer : ${imageManquante.label}`);
    if (config.hasLines && lignes.some((ligne) => !ligne.description.trim())) return alert("Veuillez renseigner toutes les descriptions de prestations.");
    setChargement(true);
    try {
      const numero = documentEdite?.numero || await (await import("@/lib/scmDocuments")).genererNumero(config.type);
      const ancienPayload = (documentEdite?.donnees_formulaire || {}) as Record<string, unknown>;
      const imagesChamps = Object.fromEntries(await Promise.all(config.fields.filter((field) => field.type === "image").map(async (field) => [field.name, await lireImage(imagesFormulaire[field.name]) || String(ancienPayload[field.name] || "")]))) as Record<string, string>;
      if (config.type === "carte_service") {
        const { creerPdfCarteService } = await import("@/lib/scmDocuments");
        const pdf = await creerPdfCarteService({
          nomComplet: formulaire.nomComplet || "",
          matricule: formulaire.matricule || "",
          genre: formulaire.genre || "",
          poste: formulaire.poste || "",
          telephone: formulaire.telephone || "",
          adresse: formulaire.adresse || "",
          photoProfil: imagesChamps.profileImage || "",
          qrCode: imagesChamps.qrCodeImage || "",
          signatureDirection: imagesChamps.signatureDirection || "",
          numero,
          dateEmission: new Date().toISOString().slice(0, 10),
        });
        await enregistrerCarteService({ ...formulaire, ...imagesChamps, titreCourt: config.titre }, pdf, numero, documentEdite?.id);
        setDocumentEdite(null); setActualisation((valeur) => valeur + 1); alert(documentEdite ? "Carte de service modifiée avec succès." : "Carte de service générée et enregistrée avec succès."); return;
      }
      if (config.type === "rendu_3d") {
        const correction = formulaire.correctionPrompt?.trim();
        const prompt = `Produced a high-quality architectural visualization, maintaining all details from the line drawing, including rooms, furniture, and labels. The textures, lighting, and shadows were rendered effectively, mirroring the source plan's layout.${correction ? ` Correction request: ${correction}` : ""}`;
        const planOptimise = await optimiserImagePourIA(imagesChamps.planImage, 896, 0.78);
        const image = await genererImageOpenRouter({ data: { prompt, images: [planOptimise].filter(Boolean), model: "google/gemini-2.5-flash-image" } });
        await enregistrerRendu3D({ ...formulaire, ...imagesChamps, titreCourt: config.titre }, image.imageUrl, numero, documentEdite?.id);
        setDocumentEdite(null); setActualisation((valeur) => valeur + 1); alert(documentEdite ? "Rendu 3D corrigé et enregistré avec succès." : "Rendu 3D généré et enregistré avec succès."); return;
      }
      if (config.type === "version_nuit") {
        const correction = formulaire.correctionPrompt?.trim();
        const prompt = `Donne la version nuit ultra réaliste et fidèle au détail de ce rendu. En ajoutant des lampes a l'extérieur et a l'intérieur. Rend le résultat réaliste comme une vrai image de maison. Preserve exactly the same building geometry, architecture, materials, framing, camera angle and composition as the source image. Apply realistic night lighting: dark blue night sky with subtle stars or moonlight, warm interior lights glowing through every window, exterior lamps along the path, garden spotlights uplighting facades and trees, porch lights, accent lights on the architecture, soft reflections on surfaces. Keep all original details, textures and surroundings intact, only change the time of day to a photorealistic night scene.${correction ? ` Correction request: ${correction}` : ""}`;
        const imageOptimisee = await optimiserImagePourIA(imagesChamps.imageMaison, 896, 0.78);
        const image = await genererImageOpenRouter({ data: { prompt, images: [imageOptimisee].filter(Boolean), model: "google/gemini-2.5-flash-image" } });
        await enregistrerVersionNuit({ ...formulaire, ...imagesChamps, titreCourt: config.titre }, image.imageUrl, numero, documentEdite?.id);
        setDocumentEdite(null); setActualisation((valeur) => valeur + 1); alert(documentEdite ? "Version nuit corrigée et enregistrée avec succès." : "Version nuit générée et enregistrée avec succès."); return;
      }
      if (config.type === "realistic_sketchup") {
        const correction = formulaire.correctionPrompt?.trim();
        const prompt = `Hyperrealistic architectural render using the original SketchUp geometry exactly as provided. Do not modify, redesign, or reinterpret the building form, massing, proportions, structure, or facade layout. Ultra-realistic materials applied precisely to existing surfaces: realistic concrete, brick, glass, metal, and wood with accurate scale and texture. Physically based lighting, natural daylight, realistic shadows and reflections. High-resolution details, sharp edges, correct material roughness. Realistic urban context, trees, people, and vehicles scaled correctly. Professional architectural visualization quality, true-to-life appearance.${correction ? ` Correction request: ${correction}` : ""}`;
        const sketchupOptimise = await optimiserImagePourIA(imagesChamps.sketchupImage, 896, 0.78);
        const image = await genererImageOpenRouter({ data: { prompt, images: [sketchupOptimise].filter(Boolean), model: "google/gemini-2.5-flash-image" } });
        await enregistrerRealisticSketchup({ ...formulaire, ...imagesChamps, titreCourt: config.titre }, image.imageUrl, numero, documentEdite?.id);
        setDocumentEdite(null); setActualisation((valeur) => valeur + 1); alert(documentEdite ? "Rendu Realistic SketchUp corrigé et enregistré avec succès." : "Rendu Realistic SketchUp généré et enregistré avec succès."); return;
      }
      if (config.type === "plan_architectural") {
        const correction = formulaire.correctionPrompt?.trim();
        const descriptionParts = [
          formulaire.typeBatiment && `Building type: ${formulaire.typeBatiment}`,
          formulaire.nombreNiveaux && `Levels: ${formulaire.nombreNiveaux}`,
          formulaire.dimensions && `Overall dimensions: ${formulaire.dimensions}`,
          formulaire.superficie && `Total area: ${formulaire.superficie} m²`,
          formulaire.pieces && `Rooms layout (must respect every room and dimension): ${formulaire.pieces}`,
          formulaire.orientation && `Orientation and main entrance: ${formulaire.orientation}`,
          formulaire.exigencesSpeciales && `Special requirements: ${formulaire.exigencesSpeciales}`,
          formulaire.styleTrait && `Drawing style: ${formulaire.styleTrait}`,
        ].filter(Boolean).join(". ");
        const prompt = `Generate a professional 2D architectural floor plan, top-down orthographic view, as faithfully as possible to the description. Strictly respect all room counts, dimensions, proportions, and adjacencies. Include clear wall thickness, doors with swing arcs, windows, stairs, fixtures (toilets, sinks, kitchen counters, beds indicated by furniture symbols), dimension lines with measurements in meters, room name labels in French, scale bar, and a north arrow. Clean technical line drawing on white background, precise geometry, architectural standard symbols. ${descriptionParts}. Output a single high-resolution square architectural plan image, sharp lines, legible labels.${correction ? ` Correction request: ${correction}` : ""}`;
        const image = await genererImageOpenRouter({ data: { prompt, images: [], model: "google/gemini-3.1-flash-image-preview" } });
        await enregistrerPlanArchitectural({ ...formulaire, titreCourt: config.titre }, image.imageUrl, numero, documentEdite?.id);
        setDocumentEdite(null); setActualisation((valeur) => valeur + 1); alert(documentEdite ? "Plan architectural corrigé et enregistré avec succès." : "Plan architectural généré et enregistré avec succès."); return;
      }
      if (config.type === "fiche_employe") {
        const typeFiche = formulaire.typeFiche || "individuelle";
        if (!employesSelectionnes.length) return alert("Veuillez sélectionner au moins un employé.");
        if (typeFiche === "individuelle" && employesSelectionnes.length !== 1) return alert("La fiche individuelle nécessite un seul employé.");
        const sceauBase64 = await lireImage(sceau) || String(ancienPayload.sceauBase64 || "") || undefined;
        const selection = employes.filter((employe) => employesSelectionnes.includes(employe.id));
        if (!selection.length) return alert("Les employés sélectionnés sont introuvables.");
        const pdf = await creerPdfFicheEmploye(typeFiche, selection, numero, sceauBase64);
        // Payload léger : pas de photos base64 pour éviter les timeouts DB
        const employesResume = selection.map((e) => ({ id: e.id, nom_complet: e.nom_complet, matricule: e.matricule, genre: e.genre, telephone: e.telephone, poste: e.poste, email: e.email }));
        await enregistrerFicheEmploye({ typeFiche, titre: typeFiche === "collective" ? "Fiche collective employés" : selection[0]?.nom_complet || "Fiche employé", employeIds: employesSelectionnes, employesResume, sceauBase64 }, pdf, numero, documentEdite?.id);
        setDocumentEdite(null); setActualisation((valeur) => valeur + 1); alert(documentEdite ? "Fiche employé modifiée avec succès." : "Fiche employé générée et enregistrée avec succès."); return;
      }
      if (config.type === "code_qr") {
        if (employesSelectionnes.length !== 1) return alert("Veuillez sélectionner un seul employé pour générer son code QR.");
        const employe = employes.find((item) => item.id === employesSelectionnes[0]);
        if (!employe) return alert("Employé introuvable.");
        const urlPublique = `${originePubliqueQr}/qr-employe/${employe.id}`;
        const qrBase64 = await QRCode.toDataURL(urlPublique, { width: 1200, margin: 2, errorCorrectionLevel: "H", color: { dark: "#0f172a", light: "#ffffff" } });
        // Payload léger : on garde uniquement les identifiants (pas la photo base64 ni l'objet complet) pour éviter les timeouts DB.
        await enregistrerCodeQR({ employeId: employe.id, employeNom: employe.nom_complet, matricule: employe.matricule, poste: employe.poste, telephone: employe.telephone, urlPublique }, qrBase64, urlPublique, numero, documentEdite?.id);
        setDocumentEdite(null); setActualisation((valeur) => valeur + 1); alert("Code QR généré et enregistré avec succès. Le lien public est fonctionnel."); return;
      }
      const sceauBase64 = await lireImage(sceau) || String(ancienPayload.sceauBase64 || "") || undefined;
      const signatureBase64 = estCommunication ? undefined : await lireImage(signature) || String(ancienPayload.signatureBase64 || "") || undefined;
      const champs: Array<[string, string]> = config.fields.map((field) => [field.label, field.type === "image" ? imagesChamps[field.name] || "—" : formulaire[field.name] || "—"]);
      if (config.type === "facture") {
        champs.unshift(["Informations entreprise", "SCM SARL\nRCCM : CD/KNM/RCCM/24-B-01256\nIDNAT : 01-F4200-N55523N\nN° Impôt : A2442 173S"]);
        if (nomChantierEffectif) champs.push(["Chantier concerné", estNouveauChantier ? `${nomChantierEffectif} (nouveau chantier)` : nomChantierEffectif]);
        const formaterMontantPdf = (n: number) => {
          const [ent, dec] = String(n).split(".");
          const signe = ent.startsWith("-") ? "-" : "";
          const abs = signe ? ent.slice(1) : ent;
          return signe + abs.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (dec ? "," + dec : "");
        };
        if (budgetTotalNum > 0) {
          champs.push(["Budget total du chantier", `${formaterMontantPdf(budgetTotalNum)} $`]);
          champs.push(["Budget payé (cette facture, frais supplémentaires inclus)", `${formaterMontantPdf(budgetPaye)} $`]);
          if (totalDeductions > 0) champs.push(["dont frais supplémentaires", `${formaterMontantPdf(totalDeductions)} $`]);
        }
        // Budget restant : toujours affiché sur le PDF, identique au champ "Restant" du formulaire
        champs.push(["Budget restant", `${formaterMontantPdf(budgetRestant)} $`]);
      }
      const deductionsActives = avecDeductions ? deductions.filter((deduction) => deduction.libelle.trim() && (Number(deduction.montant || 0) > 0 || Number(deduction.pourcentage || 0) > 0)) : [];
      const pdf = await creerPdf(config.type, config.titre.replace("Générateur de ", ""), numero, champs, { sceau: sceauBase64, signature: signatureBase64, libelleSceau, libelleSignature, lignes: config.hasLines ? lignes : undefined, deductions: deductionsActives, total, totalAvantDeduction });
      // Payload léger : on n'enregistre PAS sceauBase64/signatureBase64 dans donnees_formulaire (déjà rendus dans le PDF) — évite les timeouts DB sur gros fichiers.
      const payloadFacture = estFacturePro ? { chantierId, chantierNom: nomChantierEffectif, estNouveauChantier, budgetTotalChantier: budgetTotalNum, budgetPaye, budgetRestant, fraisDeduits: totalDeductions } : {};
      await enregistrerDocument(config.type, { ...formulaire, ...imagesChamps, lignes, deductions: deductionsActives, totalAvantDeduction, totalDeductions, totalFinal: total, total, titreCourt: config.titre, libelleSceau, libelleSignature, ...payloadFacture }, pdf, numero, documentEdite?.id);
      setDocumentEdite(null);
      setActualisation((valeur) => valeur + 1);
      alert(documentEdite ? "Document PDF modifié et réenregistré avec succès." : "Document PDF généré et enregistré avec succès.");
    } catch (erreur) {
      alert(erreur instanceof Error ? erreur.message : "Une erreur est survenue.");
    } finally { setChargement(false); }
  }

  function editerDocument(document: DocumentRecord) {
    const donnees = document.donnees_formulaire || {};
    setDocumentEdite(document);
    setFormulaire(Object.fromEntries(config.fields.map((field) => [field.name, String(donnees[field.name] ?? field.defaultValue ?? "")])));
    setLignes(Array.isArray(donnees.lignes) && donnees.lignes.length ? donnees.lignes as LignePrestation[] : [{ description: "", quantite: 1, prix: 0 }]);
    setDeductions(Array.isArray(donnees.deductions) ? donnees.deductions as LigneDeduction[] : []);
    setLibelleSceau(String(donnees.libelleSceau || (estCommunication ? "Nom / fonction de celui qui impose le sceau" : "Sceau de l’entreprise")));
    setLibelleSignature(String(donnees.libelleSignature || "Signature du client"));
    setImagesFormulaire({});
    setSceau(undefined);
    setSignature(undefined);
    setEmployesSelectionnes(Array.isArray(donnees.employeIds) ? donnees.employeIds as string[] : []);
    if (estFacturePro) {
      setChantierId(String(donnees.chantierId || ""));
      setBudgetTotalChantier(donnees.budgetTotalChantier !== undefined ? String(donnees.budgetTotalChantier) : "");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className={`min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-10 xl:px-12 tool-${config.theme}`}>
      <div className="mx-auto w-full max-w-[1600px]">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button>
        <div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span>
              <h1 className="max-w-3xl text-3xl font-black lg:text-5xl xl:text-6xl">{config.titre}</h1>
              <p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">{config.description}</p>
            </div>
            {estFacturePro && (
              <div className="hidden shrink-0 rounded-2xl bg-tool-foreground/10 p-4 backdrop-blur-sm lg:block lg:min-w-[260px]">
                <p className="text-xs font-bold uppercase tracking-wide opacity-80">Aperçu du total</p>
                <p className="mt-1 text-3xl font-black tabular-nums">{total.toLocaleString("fr-FR")} $</p>
                {budgetTotalNum > 0 && <p className="mt-2 text-xs opacity-90">Budget restant · <span className="font-bold tabular-nums">{budgetRestant.toLocaleString("fr-FR")} $</span></p>}
              </div>
            )}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)] xl:gap-8">
          <form onSubmit={soumettre} className="rounded-2xl border border-border bg-card/95 p-4 shadow-document lg:p-6 xl:p-8">
            <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-lg font-black text-foreground xl:text-xl">Informations du document</h2>
              <span className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:inline">{documentEdite ? `Modification · ${documentEdite.numero}` : "Nouveau document"}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
              {(config.type === "fiche_employe" || config.type === "code_qr") && <>
                {config.type === "fiche_employe" && <label><span className="mb-1 block text-sm font-semibold text-foreground">Type de fiche</span><select value={formulaire.typeFiche || "individuelle"} onChange={(e) => { changer("typeFiche", e.target.value); setEmployesSelectionnes([]); }} className="form-control"><option value="individuelle">Fiche individuelle</option><option value="collective">Fiche collective</option></select></label>}
                <div className="sm:col-span-2 xl:col-span-3 rounded-xl border border-border bg-muted/60 p-3"><span className="mb-3 block text-sm font-semibold text-foreground">Sélectionner les employés</span><div className="grid max-h-72 gap-2 overflow-auto sm:grid-cols-2 xl:grid-cols-3">{employes.map((employe) => <label key={employe.id} className="flex items-center gap-3 rounded-lg bg-card p-3 text-sm font-semibold text-foreground"><input type={formulaire.typeFiche === "collective" ? "checkbox" : "radio"} checked={employesSelectionnes.includes(employe.id)} onChange={(e) => setEmployesSelectionnes(formulaire.typeFiche === "collective" ? (e.target.checked ? [...employesSelectionnes, employe.id] : employesSelectionnes.filter((id) => id !== employe.id)) : [employe.id])} /> <span className="min-w-0"><span className="block truncate">{employe.nom_complet || "Employé sans nom"}</span><span className="block text-xs text-muted-foreground">{employe.matricule || "—"} · {employe.genre || "—"}</span></span></label>)}</div></div>
              </>}
              {config.fields.map((field) => (
                <label key={field.name} className={field.type === "textarea" ? "sm:col-span-2 xl:col-span-3" : ""}>
                  <span className="mb-1 block text-sm font-semibold text-foreground">{field.label}{field.required ? " *" : ""}</span>
                  {field.type === "textarea" ? <textarea value={formulaire[field.name] || ""} onChange={(e) => changer(field.name, e.target.value)} rows={4} className="form-control min-h-28" /> : field.type === "image" ? <input type="file" accept="image/*" onChange={(e) => changerImage(field.name, e.target.files?.[0])} className="file-input" /> : <input value={formulaire[field.name] || ""} onChange={(e) => changer(field.name, e.target.value)} type={field.type || "text"} className="form-control" />}
                </label>
              ))}
            </div>
            {config.hasLines && <div className="mt-6 rounded-xl border border-border bg-muted/60 p-4 xl:p-5">
              <div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-foreground xl:text-lg">{config.type === "devis" ? "Achats à faire" : "Prestations"}</h3><button type="button" onClick={() => setLignes([...lignes, { description: "", quantite: 1, prix: 0 }])} className="mini-button"><Plus className="size-4" /> Ajouter une ligne</button></div>
              <div className="mb-2 hidden text-xs font-bold uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_90px_140px_140px_40px] sm:gap-2 sm:px-3"><span>Description</span><span>Qté</span><span>{config.type === "devis" ? "Coût unitaire" : "Prix unitaire"}</span><span className="text-right">Total ligne</span><span></span></div>
              <div className="space-y-2">{lignes.map((ligne, index) => {
                const totalLigne = Number(ligne.quantite || 0) * Number(ligne.prix || 0);
                return (
                  <div key={index} className="grid gap-2 rounded-lg border border-border/60 bg-card p-3 sm:grid-cols-[1fr_90px_140px_140px_40px] sm:items-center">
                    <input placeholder={config.type === "devis" ? "Achat à faire" : "Description"} value={ligne.description} onChange={(e) => setLignes(lignes.map((l, i) => i === index ? { ...l, description: e.target.value } : l))} className="form-control" />
                    <input type="number" min="1" value={ligne.quantite} onChange={(e) => setLignes(lignes.map((l, i) => i === index ? { ...l, quantite: Number(e.target.value) } : l))} className="form-control" />
                    <input type="number" min="0" value={ligne.prix} onChange={(e) => setLignes(lignes.map((l, i) => i === index ? { ...l, prix: Number(e.target.value) } : l))} placeholder={config.type === "devis" ? "Coût" : "Prix"} className="form-control" />
                    <span className="hidden text-right text-sm font-bold tabular-nums text-foreground sm:block">{totalLigne.toLocaleString("fr-FR")} $</span>
                    <button type="button" onClick={() => setLignes(lignes.filter((_, i) => i !== index))} className="tool-action danger justify-self-end"><Trash2 className="size-4" /></button>
                  </div>
                );
              })}</div>
            </div>}
            {avecDeductions && <div className="mt-6 rounded-xl border border-border bg-muted/60 p-4 xl:p-5">
              <div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-foreground xl:text-lg">Frais supplémentaires</h3><button type="button" onClick={() => setDeductions([...deductions, { libelle: "Frais d’entreprise", montant: 0 }])} className="mini-button"><Plus className="size-4" /> Ajouter</button></div>
              <p className="mb-3 text-xs text-muted-foreground">Personnalisez le nom et le montant en $ des frais supplémentaires (ex : Transport, Taxes, Commission…). Ces frais sont ajoutés au montant final <strong>et sortent aussi du budget total du chantier</strong>.</p>
              <div className="space-y-2">{deductions.map((deduction, index) => {
                const montantAffiche = typeof deduction.montant === "number"
                  ? deduction.montant
                  : Math.round(totalAvantDeduction * Number(deduction.pourcentage || 0) / 100 * 100) / 100;
                return (
                  <div key={index} className="grid gap-2 rounded-lg border border-border/60 bg-card p-3 sm:grid-cols-[1fr_160px_40px] sm:items-center">
                    <input placeholder="Nom des frais (ex : Transport)" value={deduction.libelle} onChange={(e) => setDeductions(deductions.map((d, i) => i === index ? { ...d, libelle: e.target.value } : d))} className="form-control" />
                    <input type="number" min="0" step="0.01" value={montantAffiche} onChange={(e) => setDeductions(deductions.map((d, i) => i === index ? { libelle: d.libelle, montant: Number(e.target.value) } : d))} placeholder="Montant ($)" className="form-control" />
                    <button type="button" onClick={() => setDeductions(deductions.filter((_, i) => i !== index))} className="tool-action danger justify-self-end"><Trash2 className="size-4" /></button>
                  </div>
                );
              })}</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/60 bg-card p-3"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total avant frais</p><p className="mt-1 text-base font-black tabular-nums text-foreground">{totalAvantDeduction.toLocaleString("fr-FR")} $</p></div>
                <div className="rounded-lg border border-border/60 bg-card p-3"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Frais supplémentaires</p><p className="mt-1 text-base font-black tabular-nums text-foreground">{totalDeductions.toLocaleString("fr-FR")} $</p></div>
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-3"><p className="text-xs font-bold uppercase tracking-wide text-primary">Montant final</p><p className="mt-1 text-base font-black tabular-nums text-primary">{total.toLocaleString("fr-FR")} $</p></div>
              </div>
            </div>}
            {estFacturePro && <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 xl:p-5">
              <div className="mb-3 flex items-center gap-2"><Wallet className="size-5 text-primary" /><h3 className="font-bold text-foreground xl:text-lg">Suivi du budget chantier</h3></div>
              <div className="grid gap-3 sm:grid-cols-2 xl:gap-4">
                <label>
                  <span className="mb-1 block text-sm font-semibold text-foreground">Chantier concerné</span>
                  <select value={chantierId} onChange={(e) => selectionnerChantier(e.target.value)} className="form-control">
                    <option value="">— Nouveau chantier (utilise les infos client) —</option>
                    {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom_chantier || "Chantier sans nom"}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-sm font-semibold text-foreground">Budget total du chantier ($)</span>
                  <input type="number" min="0" step="0.01" value={budgetTotalChantier} onChange={(e) => setBudgetTotalChantier(e.target.value)} placeholder="Ex : 50000" className="form-control" />
                </label>
              </div>
              {estNouveauChantier && <p className="mt-2 rounded-lg bg-amber-500/10 p-2 text-xs font-semibold text-amber-700 dark:text-amber-400">Nouveau chantier détecté · Identifié par : {nomChantierEffectif}</p>}
              <p className="mt-3 text-xs text-muted-foreground">Le montant final (prestations + frais supplémentaires) est soustrait du budget total du chantier pour calculer le budget restant.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-border/60 bg-card p-3"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Budget total</p><p className="mt-1 text-base font-black tabular-nums text-foreground">{budgetTotalNum.toLocaleString("fr-FR")} $</p></div>
                <div className="rounded-lg border border-border/60 bg-card p-3"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Budget payé</p><p className="mt-1 text-base font-black tabular-nums text-foreground">{budgetPaye.toLocaleString("fr-FR")} $</p></div>
                <div className="rounded-lg border border-border/60 bg-card p-3"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">dont frais</p><p className="mt-1 text-base font-black tabular-nums text-muted-foreground">{totalDeductions.toLocaleString("fr-FR")} $</p></div>
                <div className={`rounded-lg border p-3 ${budgetRestant === 0 && budgetTotalNum > 0 ? "border-green-500/40 bg-green-500/10" : "border-primary/30 bg-primary/10"}`}><p className={`text-xs font-bold uppercase tracking-wide ${budgetRestant === 0 && budgetTotalNum > 0 ? "text-green-700 dark:text-green-400" : "text-primary"}`}>Budget restant</p><p className={`mt-1 text-base font-black tabular-nums ${budgetRestant === 0 && budgetTotalNum > 0 ? "text-green-700 dark:text-green-400" : "text-primary"}`}>{budgetRestant.toLocaleString("fr-FR")} $</p></div>
              </div>
            </div>}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:gap-5">
              {config.type !== "carte_service" && config.type !== "rendu_3d" && config.type !== "realistic_sketchup" && config.type !== "plan_architectural" && config.type !== "code_qr" && config.type !== "version_nuit" && <><label><span className="mb-1 block text-sm font-semibold text-foreground">{estCommunication ? "Dénominateur de celui qui impose le sceau" : "Texte au-dessus du sceau"}</span><input value={libelleSceau} onChange={(e) => setLibelleSceau(e.target.value)} className="form-control" /></label>
              {!estCommunication && config.type !== "fiche_employe" && <label><span className="mb-1 block text-sm font-semibold text-foreground">Texte au-dessus de la signature</span><input value={libelleSignature} onChange={(e) => setLibelleSignature(e.target.value)} className="form-control" /></label>}
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Importer le sceau de l’entreprise</span><input type="file" accept="image/*" onChange={(e) => setSceau(e.target.files?.[0])} className="file-input" /></label>
              {!estCommunication && config.type !== "fiche_employe" && <label><span className="mb-1 block text-sm font-semibold text-foreground">Importer la signature du client</span><input type="file" accept="image/*" onChange={(e) => setSignature(e.target.files?.[0])} className="file-input" /></label>}</>}
            </div>
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/15 p-4 shadow-document sm:flex-row sm:items-center sm:justify-between">{config.showTotal === false ? <span className="text-sm font-semibold text-foreground">{documentEdite ? `Modification de ${documentEdite.numero}` : "Fiche prête à générer"}</span> : <strong className="text-lg text-foreground tabular-nums">Total : {total.toLocaleString("fr-FR")} $</strong>}<button disabled={chargement} className="primary-action"><Save className="size-4" /> {chargement ? "Génération…" : documentEdite ? (config.type === "rendu_3d" || config.type === "realistic_sketchup" || config.type === "plan_architectural" || config.type === "code_qr" || config.type === "version_nuit" ? "Réenregistrer l’image" : "Réenregistrer le PDF") : (config.type === "rendu_3d" || config.type === "realistic_sketchup" || config.type === "plan_architectural" || config.type === "code_qr" || config.type === "version_nuit" ? "Générer et enregistrer l’image" : "Générer et enregistrer le PDF")}</button></div>
          </form>
          <div className="space-y-6 lg:sticky lg:top-4 lg:self-start"><div className="rounded-2xl border border-border bg-card p-5 shadow-document xl:p-6"><FileCheck2 className="mb-3 size-8 text-primary" /><h2 className="text-xl font-bold text-foreground">Document officiel prêt à l’emploi</h2><p className="mt-2 text-sm text-muted-foreground">Chaque PDF inclut le logo SCM SARL, le drapeau de la RDC, une mise en page structurée, ainsi que les zones sceau et signature.</p></div><DocumentHistory type={config.type} actualisation={actualisation} onEdit={editerDocument} /></div>
        </div>
      </div>
    </main>
  );
}
