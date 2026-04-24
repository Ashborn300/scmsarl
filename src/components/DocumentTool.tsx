import { ArrowLeft, FileCheck2, Plus, Save, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { DocumentHistory } from "./DocumentHistory";
import { creerPdf, creerPdfFicheEmploye, enregistrerCarteService, enregistrerCodeQR, enregistrerDocument, enregistrerFicheEmploye, enregistrerRealisticSketchup, enregistrerRendu3D, listerEmployes, mockupCarteServiceBase64, type DocumentRecord, type EmployeRecord, type LignePrestation, type OutilType } from "@/lib/scmDocuments";
import { genererImageOpenRouter } from "@/lib/openrouterImage.functions";

type Field = { name: string; label: string; type?: "text" | "number" | "date" | "textarea" | "image"; required?: boolean; defaultValue?: string };
type Config = { type: OutilType; titre: string; theme: string; description: string; fields: Field[]; hasLines?: boolean; showTotal?: boolean; totalLabel?: string };

const aujourdhui = new Date().toISOString().slice(0, 10);
const originePubliqueQr = "https://scm-tolls.lovable.app";

export const configs: Config[] = [
  { type: "facture", titre: "Générateur de facture professionnelle", theme: "blue", description: "Factures numérotées avec prestations, calcul automatique et modalités de paiement.", hasLines: true, fields: [
    { name: "client", label: "Informations client", type: "textarea", required: true }, { name: "date", label: "Date", type: "date", defaultValue: aujourdhui }, { name: "modalites", label: "Modalités de paiement", type: "textarea", defaultValue: "Paiement à la réception de la facture, sauf accord écrit contraire." },
  ]},
  { type: "devis", titre: "Générateur de devis professionnel", theme: "yellow", description: "Devis détaillé avec projet, achats à faire, quantités, coûts et total automatique.", hasLines: true, fields: [
    { name: "client", label: "Informations client", type: "textarea", required: true }, { name: "projet", label: "Description du projet", type: "textarea", required: true }, { name: "validite", label: "Date de validité", type: "date" }, { name: "notes", label: "Notes", type: "textarea" },
  ]},
  { type: "recu", titre: "Générateur de reçu", theme: "green", description: "Reçu de paiement formel pour règlement client.", fields: [
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
  { type: "carte_service", titre: "Génération Carte de service", theme: "service-card", description: "Carte de service générée par Nano Banana à partir du mockup SCM SARL.", showTotal: false, fields: [
    { name: "profileImage", label: "Image du profil", type: "image", required: true }, { name: "qrCodeImage", label: "Image du code QR", type: "image", required: true }, { name: "nomComplet", label: "Nom complet", required: true }, { name: "matricule", label: "Matricule", required: true }, { name: "genre", label: "Genre", required: true }, { name: "telephone", label: "Téléphone", required: true }, { name: "adresse", label: "Adresse", required: true }, { name: "poste", label: "Poste", required: true },
  ]},
  { type: "rendu_3d", titre: "Génération de rendu 3D", theme: "render-3d", description: "Transformation Nano Banana d’un plan 2D en rendu architectural isométrique 3D.", showTotal: false, fields: [
    { name: "planImage", label: "Image du plan", type: "image", required: true }, { name: "titre", label: "Titre du rendu", defaultValue: "Rendu 3D architectural" }, { name: "correctionPrompt", label: "Correction à appliquer au résultat", type: "textarea" },
  ]},
  { type: "realistic_sketchup", titre: "Realistic SketchUp", theme: "realistic-sketchup", description: "Transformation Nano Banana d’un modèle SketchUp en rendu architectural hyperréaliste.", showTotal: false, fields: [
    { name: "sketchupImage", label: "Image du modèle SketchUp", type: "image", required: true }, { name: "titre", label: "Titre du rendu", defaultValue: "Realistic SketchUp" }, { name: "correctionPrompt", label: "Correction à appliquer au résultat", type: "textarea" },
  ]},
  { type: "fiche_employe", titre: "Générateur de fiche d’employé", theme: "employee-sheet", description: "Fiche individuelle complète ou fiche collective avec photo, nom, matricule et genre.", showTotal: false, fields: [] },
  { type: "code_qr", titre: "Générateur Code QR", theme: "qr-code", description: "Code QR public menant vers une fiche web accessible avec les informations personnelles d’un employé.", showTotal: false, fields: [] },
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

export function DocumentTool({ config, retour }: { config: Config; retour: () => void }) {
  const estCommunication = config.type === "communiquer";
  const [formulaire, setFormulaire] = useState<Record<string, string>>(() => Object.fromEntries(config.fields.map((field) => [field.name, field.defaultValue || ""])));
  const [lignes, setLignes] = useState<LignePrestation[]>([{ description: "", quantite: 1, prix: 0 }]);
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

  const total = useMemo(() => config.hasLines ? lignes.reduce((somme, ligne) => somme + Number(ligne.quantite || 0) * Number(ligne.prix || 0), 0) : Number(formulaire.total || formulaire.montant || formulaire.salaire || formulaire.budget || 0), [config.hasLines, formulaire, lignes]);

  useEffect(() => { if (config.type === "fiche_employe" || config.type === "code_qr") listerEmployes().then(setEmployes).catch((erreur) => alert(erreur instanceof Error ? erreur.message : "Impossible de charger les employés.")); }, [config.type]);

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
        const mockup = await mockupCarteServiceBase64();
        const prompt = `Use the provided ID card mockup image as the exact base template.\n\nDo not redesign the layout. Do not change the background, card proportions, wave shapes, colors, shadows, spacing, or general design.\n\nOnly replace the following elements:\n\n1. Replace the circular profile photo on the front card with the uploaded profile image [PROFILE_IMAGE].\n2. Replace the QR code on the front card with the uploaded QR code image [QR_CODE_IMAGE].\n3. Keep the logo on the back card exactly as it appears in the mockup image.\n4. Replace the employee information text with:\n\nNom complet : ${formulaire.nomComplet}\nMatricule : ${formulaire.matricule}\nGenre : ${formulaire.genre}\nTéléphone : ${formulaire.telephone}\nAdresse : ${formulaire.adresse}\nPoste : ${formulaire.poste}\n\n5. Keep the back card text exactly as:\n\nInformations supplémentaires\n\nLe détenteur de cette carte est un employé Agréé de SCM SARL.\n\nRCCM : CD/KNM/RCCM/ 24-B-01256\nIDNAT : 01-F4200-N55523N\nN°IMPÔT : A2442 173S\n\nImportant:\n- Use the uploaded mockup image as the reference/base image.\n- Preserve the exact original design.\n- Only edit the specified images and text.\n- Do not invent new layout.\n- Do not add random text.\n- Keep everything clean, readable, aligned, and print-ready.`;
        const [profilOptimise, qrOptimise] = await Promise.all([optimiserImagePourIA(imagesChamps.profileImage, 768), optimiserImagePourIA(imagesChamps.qrCodeImage, 512, 0.9)]);
        const image = await genererImageOpenRouter({ data: { prompt, images: [mockup, profilOptimise, qrOptimise].filter(Boolean) } });
        await enregistrerCarteService({ ...formulaire, ...imagesChamps, titreCourt: config.titre }, image.imageUrl, numero, documentEdite?.id);
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
      if (config.type === "realistic_sketchup") {
        const correction = formulaire.correctionPrompt?.trim();
        const prompt = `Hyperrealistic architectural render using the original SketchUp geometry exactly as provided. Do not modify, redesign, or reinterpret the building form, massing, proportions, structure, or facade layout. Ultra-realistic materials applied precisely to existing surfaces: realistic concrete, brick, glass, metal, and wood with accurate scale and texture. Physically based lighting, natural daylight, realistic shadows and reflections. High-resolution details, sharp edges, correct material roughness. Realistic urban context, trees, people, and vehicles scaled correctly. Professional architectural visualization quality, true-to-life appearance.${correction ? ` Correction request: ${correction}` : ""}`;
        const sketchupOptimise = await optimiserImagePourIA(imagesChamps.sketchupImage, 896, 0.78);
        const image = await genererImageOpenRouter({ data: { prompt, images: [sketchupOptimise].filter(Boolean), model: "google/gemini-2.5-flash-image" } });
        await enregistrerRealisticSketchup({ ...formulaire, ...imagesChamps, titreCourt: config.titre }, image.imageUrl, numero, documentEdite?.id);
        setDocumentEdite(null); setActualisation((valeur) => valeur + 1); alert(documentEdite ? "Rendu Realistic SketchUp corrigé et enregistré avec succès." : "Rendu Realistic SketchUp généré et enregistré avec succès."); return;
      }
      if (config.type === "fiche_employe") {
        const typeFiche = formulaire.typeFiche || "individuelle";
        if (!employesSelectionnes.length) return alert("Veuillez sélectionner au moins un employé.");
        if (typeFiche === "individuelle" && employesSelectionnes.length !== 1) return alert("La fiche individuelle nécessite un seul employé.");
        const sceauBase64 = await lireImage(sceau) || String(ancienPayload.sceauBase64 || "") || undefined;
        const selection = employes.filter((employe) => employesSelectionnes.includes(employe.id));
        const pdf = await creerPdfFicheEmploye(typeFiche, selection, numero, sceauBase64);
        await enregistrerFicheEmploye({ typeFiche, titre: typeFiche === "collective" ? "Fiche collective employés" : selection[0]?.nom_complet || "Fiche employé", employeIds: employesSelectionnes, employes: selection, sceauBase64 }, pdf, numero, documentEdite?.id);
        setDocumentEdite(null); setActualisation((valeur) => valeur + 1); alert(documentEdite ? "Fiche employé modifiée avec succès." : "Fiche employé générée et enregistrée avec succès."); return;
      }
      if (config.type === "code_qr") {
        if (employesSelectionnes.length !== 1) return alert("Veuillez sélectionner un seul employé pour générer son code QR.");
        const employe = employes.find((item) => item.id === employesSelectionnes[0]);
        if (!employe) return alert("Employé introuvable.");
        const origineQr = window.location.hostname.endsWith(".lovable.app") ? window.location.origin : originePubliqueQr;
        const urlPublique = `${origineQr}/qr-employe/${employe.id}`;
        const qrBase64 = await QRCode.toDataURL(urlPublique, { width: 1200, margin: 2, errorCorrectionLevel: "H", color: { dark: "#0f172a", light: "#ffffff" } });
        await enregistrerCodeQR({ employeId: employe.id, employeNom: employe.nom_complet, matricule: employe.matricule, urlPublique, employe }, qrBase64, urlPublique, numero, documentEdite?.id);
        setDocumentEdite(null); setActualisation((valeur) => valeur + 1); alert("Code QR généré et enregistré avec succès. Le lien public est fonctionnel."); return;
      }
      const sceauBase64 = await lireImage(sceau) || String(ancienPayload.sceauBase64 || "") || undefined;
      const signatureBase64 = estCommunication ? undefined : await lireImage(signature) || String(ancienPayload.signatureBase64 || "") || undefined;
      const champs: Array<[string, string]> = config.fields.map((field) => [field.label, field.type === "image" ? imagesChamps[field.name] || "—" : formulaire[field.name] || "—"]);
      if (config.type === "facture") champs.unshift(["Informations entreprise", "SCM SARL\nRCCM : CD/KNM/RCCM/24-B-01256\nIDNAT : 01-F4200-N55523N\nN° Impôt : A2442 173S"]);
      const pdf = await creerPdf(config.type, config.titre.replace("Générateur de ", ""), numero, champs, { sceau: sceauBase64, signature: signatureBase64, libelleSceau, libelleSignature, lignes: config.hasLines ? lignes : undefined, total });
      await enregistrerDocument(config.type, { ...formulaire, ...imagesChamps, lignes, total, titreCourt: config.titre, libelleSceau, libelleSignature, sceauBase64, signatureBase64 }, pdf, numero, documentEdite?.id);
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
    setLibelleSceau(String(donnees.libelleSceau || (estCommunication ? "Nom / fonction de celui qui impose le sceau" : "Sceau de l’entreprise")));
    setLibelleSignature(String(donnees.libelleSignature || "Signature du client"));
    setImagesFormulaire({});
    setSceau(undefined);
    setSignature(undefined);
    setEmployesSelectionnes(Array.isArray(donnees.employeIds) ? donnees.employeIds as string[] : []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className={`min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8 tool-${config.theme}`}>
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={retour} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Retour au tableau de bord</button>
        <div className="mb-6 rounded-3xl bg-tool-gradient p-6 text-tool-foreground shadow-tool lg:p-8">
          <span className="mb-4 inline-flex rounded-full bg-tool-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">SCM SARL</span>
          <h1 className="max-w-3xl text-3xl font-black lg:text-5xl">{config.titre}</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90 lg:text-base">{config.description}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <form onSubmit={soumettre} className="rounded-2xl border border-border bg-card/95 p-4 shadow-document lg:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {(config.type === "fiche_employe" || config.type === "code_qr") && <>
                {config.type === "fiche_employe" && <label><span className="mb-1 block text-sm font-semibold text-foreground">Type de fiche</span><select value={formulaire.typeFiche || "individuelle"} onChange={(e) => { changer("typeFiche", e.target.value); setEmployesSelectionnes([]); }} className="form-control"><option value="individuelle">Fiche individuelle</option><option value="collective">Fiche collective</option></select></label>}
                <div className="sm:col-span-2 rounded-xl border border-border bg-muted/60 p-3"><span className="mb-3 block text-sm font-semibold text-foreground">Sélectionner les employés</span><div className="grid max-h-72 gap-2 overflow-auto sm:grid-cols-2">{employes.map((employe) => <label key={employe.id} className="flex items-center gap-3 rounded-lg bg-card p-3 text-sm font-semibold text-foreground"><input type={formulaire.typeFiche === "collective" ? "checkbox" : "radio"} checked={employesSelectionnes.includes(employe.id)} onChange={(e) => setEmployesSelectionnes(formulaire.typeFiche === "collective" ? (e.target.checked ? [...employesSelectionnes, employe.id] : employesSelectionnes.filter((id) => id !== employe.id)) : [employe.id])} /> <span className="min-w-0"><span className="block truncate">{employe.nom_complet || "Employé sans nom"}</span><span className="block text-xs text-muted-foreground">{employe.matricule || "—"} · {employe.genre || "—"}</span></span></label>)}</div></div>
              </>}
              {config.fields.map((field) => (
                <label key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <span className="mb-1 block text-sm font-semibold text-foreground">{field.label}{field.required ? " *" : ""}</span>
                  {field.type === "textarea" ? <textarea value={formulaire[field.name] || ""} onChange={(e) => changer(field.name, e.target.value)} rows={4} className="form-control min-h-28" /> : field.type === "image" ? <input type="file" accept="image/*" onChange={(e) => changerImage(field.name, e.target.files?.[0])} className="file-input" /> : <input value={formulaire[field.name] || ""} onChange={(e) => changer(field.name, e.target.value)} type={field.type || "text"} className="form-control" />}
                </label>
              ))}
            </div>
            {config.hasLines && <div className="mt-6 rounded-xl bg-muted p-3">
              <div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-foreground">{config.type === "devis" ? "Achats à faire" : "Prestations"}</h3><button type="button" onClick={() => setLignes([...lignes, { description: "", quantite: 1, prix: 0 }])} className="mini-button"><Plus className="size-4" /> Ajouter</button></div>
              <div className="space-y-3">{lignes.map((ligne, index) => <div key={index} className="grid gap-2 rounded-lg bg-card p-3 sm:grid-cols-[1fr_90px_120px_40px]"><input placeholder={config.type === "devis" ? "Achat à faire" : "Description"} value={ligne.description} onChange={(e) => setLignes(lignes.map((l, i) => i === index ? { ...l, description: e.target.value } : l))} className="form-control" /><input type="number" min="1" value={ligne.quantite} onChange={(e) => setLignes(lignes.map((l, i) => i === index ? { ...l, quantite: Number(e.target.value) } : l))} className="form-control" /><input type="number" min="0" value={ligne.prix} onChange={(e) => setLignes(lignes.map((l, i) => i === index ? { ...l, prix: Number(e.target.value) } : l))} placeholder={config.type === "devis" ? "Coût" : "Prix"} className="form-control" /><button type="button" onClick={() => setLignes(lignes.filter((_, i) => i !== index))} className="tool-action danger"><Trash2 className="size-4" /></button></div>)}</div>
            </div>}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {config.type !== "carte_service" && config.type !== "rendu_3d" && config.type !== "realistic_sketchup" && config.type !== "code_qr" && <><label><span className="mb-1 block text-sm font-semibold text-foreground">{estCommunication ? "Dénominateur de celui qui impose le sceau" : "Texte au-dessus du sceau"}</span><input value={libelleSceau} onChange={(e) => setLibelleSceau(e.target.value)} className="form-control" /></label>
              {!estCommunication && config.type !== "fiche_employe" && <label><span className="mb-1 block text-sm font-semibold text-foreground">Texte au-dessus de la signature</span><input value={libelleSignature} onChange={(e) => setLibelleSignature(e.target.value)} className="form-control" /></label>}
              <label><span className="mb-1 block text-sm font-semibold text-foreground">Importer le sceau de l’entreprise</span><input type="file" accept="image/*" onChange={(e) => setSceau(e.target.files?.[0])} className="file-input" /></label>
              {!estCommunication && config.type !== "fiche_employe" && <label><span className="mb-1 block text-sm font-semibold text-foreground">Importer la signature du client</span><input type="file" accept="image/*" onChange={(e) => setSignature(e.target.files?.[0])} className="file-input" /></label>}</>}
            </div>
            <div className="mt-6 flex flex-col gap-3 rounded-xl bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">{config.showTotal === false ? <span className="text-sm font-semibold text-foreground">{documentEdite ? `Modification de ${documentEdite.numero}` : "Fiche prête à générer"}</span> : <strong className="text-lg text-foreground">Total : {total.toLocaleString("fr-FR")} $</strong>}<button disabled={chargement} className="primary-action"><Save className="size-4" /> {chargement ? "Génération…" : documentEdite ? (config.type === "carte_service" || config.type === "rendu_3d" || config.type === "realistic_sketchup" || config.type === "code_qr" ? "Réenregistrer l’image" : "Réenregistrer le PDF") : (config.type === "carte_service" || config.type === "rendu_3d" || config.type === "realistic_sketchup" || config.type === "code_qr" ? "Générer et enregistrer l’image" : "Générer et enregistrer le PDF")}</button></div>
          </form>
          <div className="space-y-6"><div className="rounded-2xl border border-border bg-card p-5 shadow-document"><FileCheck2 className="mb-3 size-8 text-primary" /><h2 className="text-xl font-bold text-foreground">Document officiel prêt à l’emploi</h2><p className="mt-2 text-sm text-muted-foreground">Chaque PDF inclut le logo SCM SARL, le drapeau de la RDC, une mise en page structurée, ainsi que les zones sceau et signature.</p></div><DocumentHistory type={config.type} actualisation={actualisation} onEdit={editerDocument} /></div>
        </div>
      </div>
    </main>
  );
}
