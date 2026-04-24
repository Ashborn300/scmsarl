import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/scm-logo.jpeg";
import drapeauRdcUrl from "@/assets/drapeau-rdc.svg";
import carteServiceMockupUrl from "@/assets/carte-service-mockup-optimized.jpg";

export type OutilType = "facture" | "devis" | "recu" | "contrat_construction" | "contrat_employe" | "description_projet" | "communiquer" | "certificat" | "carte_service" | "rendu_3d" | "realistic_sketchup" | "fiche_employe" | "code_qr" | "formulaire_personnalise";
export type TypeChampPersonnalise = "texte" | "nombre" | "image" | "fichier";
export type ChampPersonnalise = { id: string; label: string; type: TypeChampPersonnalise; requis: boolean };
export type FormulairePersonnalise = { id: string; titre: string; description: string; champs: ChampPersonnalise[]; url_publique: string; publie: boolean; created_at: string; updated_at: string };
export type ReponseFormulaire = { id: string; formulaire_id: string; reponses: Record<string, string>; fichiers: Record<string, { nom: string; type: string; taille: number; contenu: string }>; created_at: string };

export type DocumentRecord = {
  id: string;
  numero: string;
  nom_fichier: string;
  donnees_formulaire: Record<string, unknown>;
  pdf_base64: string;
  image_base64?: string;
  qr_base64?: string;
  url_publique?: string;
  montant_total?: number;
  client?: string;
  employe?: string;
  projet?: string;
  nom_complet?: string;
  matricule?: string;
  date_document: string;
  created_at: string;
};

export type LignePrestation = { description: string; quantite: number; prix: number };

export type EmployeRecord = {
  id: string;
  nom_complet: string;
  matricule: string;
  genre: string;
  poste: string;
  telephone: string;
  email: string;
  adresse: string;
  date_naissance: string | null;
  date_admission: string | null;
  numero_piece_identite: string;
  contact_urgence: string;
  chantier_assigne: string | null;
  statut: string;
  role: string;
  photo_profil: string;
};

const couleursPdfParOutil: Record<OutilType, { principal: [number, number, number]; secondaire: [number, number, number]; doux: [number, number, number] }> = {
  facture: { principal: [37, 99, 235], secondaire: [8, 145, 178], doux: [230, 240, 255] },
  devis: { principal: [245, 158, 11], secondaire: [250, 204, 21], doux: [255, 247, 214] },
  recu: { principal: [16, 185, 129], secondaire: [34, 197, 94], doux: [225, 250, 240] },
  contrat_construction: { principal: [124, 58, 237], secondaire: [168, 85, 247], doux: [242, 232, 255] },
  contrat_employe: { principal: [20, 184, 166], secondaire: [6, 182, 212], doux: [224, 250, 247] },
  description_projet: { principal: [239, 68, 68], secondaire: [249, 115, 22], doux: [255, 235, 232] },
  communiquer: { principal: [236, 72, 153], secondaire: [249, 115, 22], doux: [255, 232, 243] },
  certificat: { principal: [3, 76, 120], secondaire: [245, 181, 72], doux: [238, 248, 252] },
  carte_service: { principal: [10, 132, 216], secondaire: [30, 45, 55], doux: [230, 244, 255] },
  rendu_3d: { principal: [85, 107, 47], secondaire: [196, 126, 66], doux: [242, 246, 232] },
  realistic_sketchup: { principal: [88, 77, 66], secondaire: [46, 125, 92], doux: [241, 238, 233] },
  fiche_employe: { principal: [22, 101, 52], secondaire: [37, 99, 235], doux: [232, 246, 237] },
  code_qr: { principal: [15, 23, 42], secondaire: [20, 184, 166], doux: [232, 247, 245] },
  formulaire_personnalise: { principal: [80, 70, 229], secondaire: [13, 148, 136], doux: [236, 238, 255] },
};

export const tablesParOutil: Record<OutilType, string> = {
  facture: "factures",
  devis: "devis",
  recu: "recus",
  contrat_construction: "contrats_construction",
  contrat_employe: "contrats_employes",
  description_projet: "descriptions_projets",
  communiquer: "communications",
  certificat: "certificats",
  carte_service: "cartes_service",
  rendu_3d: "rendus_3d",
  realistic_sketchup: "realistic_sketchup",
  fiche_employe: "fiches_employes",
  code_qr: "codes_qr_employes",
  formulaire_personnalise: "formulaires_personnalises",
};

export const prefixesParOutil: Record<OutilType, string> = {
  facture: "FAC",
  devis: "DEV",
  recu: "REC",
  contrat_construction: "CCO",
  contrat_employe: "CEM",
  description_projet: "PRJ",
  communiquer: "COM",
  certificat: "CRT",
  carte_service: "CAR",
  rendu_3d: "R3D",
  realistic_sketchup: "RSK",
  fiche_employe: "FEM",
  code_qr: "QR",
  formulaire_personnalise: "FRM",
};

const colonnesRechercheParOutil: Record<OutilType, string[]> = {
  facture: ["nom_fichier", "numero", "client"],
  devis: ["nom_fichier", "numero", "client"],
  recu: ["nom_fichier", "numero", "client"],
  contrat_construction: ["nom_fichier", "numero", "client"],
  contrat_employe: ["nom_fichier", "numero", "employe"],
  description_projet: ["nom_fichier", "numero", "projet"],
  communiquer: ["nom_fichier", "numero", "titre"],
  certificat: ["nom_fichier", "numero", "beneficiaire"],
  carte_service: ["nom_fichier", "numero", "nom_complet", "matricule"],
  rendu_3d: ["nom_fichier", "numero", "titre"],
  realistic_sketchup: ["nom_fichier", "numero", "titre"],
  fiche_employe: ["nom_fichier", "numero", "titre", "type_fiche"],
  code_qr: ["nom_fichier", "numero", "employe_nom", "matricule"],
  formulaire_personnalise: ["titre", "description", "url_publique"],
};

const db = supabase as any;

export async function genererNumero(type: OutilType) {
  const { data, error } = await db.rpc("generer_numero_document", {
    _type_document: type,
    _prefixe: prefixesParOutil[type],
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function listerDocuments(type: OutilType, recherche = "") {
  const table = tablesParOutil[type];
  let requete = db.from(table).select("*").order("created_at", { ascending: false });
  if (recherche.trim()) {
    const terme = `%${recherche.trim()}%`;
    requete = requete.or(colonnesRechercheParOutil[type].map((colonne) => `${colonne}.ilike.${terme}`).join(","));
  }
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return (data ?? []) as DocumentRecord[];
}

export async function listerDocumentsRecents() {
  const resultats = await Promise.all(
    (Object.keys(tablesParOutil) as OutilType[]).map(async (type) => {
      const { data } = await db.from(tablesParOutil[type]).select("*").order("created_at", { ascending: false }).limit(4);
      return (data ?? []).map((document: DocumentRecord) => ({ ...document, type }));
    }),
  );
  return resultats.flat().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 8);
}

export async function listerEmployes() {
  const { data, error } = await db.from("employes").select("id, nom_complet, matricule, genre, poste, telephone, email, adresse, date_naissance, date_admission, numero_piece_identite, contact_urgence, chantier_assigne, statut, role, photo_profil").order("nom_complet", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as EmployeRecord[];
}

export async function enregistrerDocument(type: OutilType, payload: Record<string, unknown>, pdfBase64: string, numero?: string, id?: string) {
  const table = tablesParOutil[type];
  const documentNumero = numero || (await genererNumero(type));
  const nomFichier = `${documentNumero}-${String(payload.titreCourt || payload.client || payload.employe || payload.projet || "document").replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.pdf`;
  const ligneBase = {
    numero: documentNumero,
    nom_fichier: nomFichier,
    donnees_formulaire: payload,
    pdf_base64: pdfBase64,
    date_document: String(payload.date || new Date().toISOString().slice(0, 10)),
  };

  const ligne = {
    ...ligneBase,
    ...(type === "facture" || type === "devis" || type === "recu"
      ? { montant_total: Number(payload.total || payload.montant || payload.budget || 0) }
      : {}),
    ...(type === "facture" || type === "devis" || type === "recu" || type === "contrat_construction" ? { client: String(payload.client || payload.nomClient || "") } : {}),
    ...(type === "contrat_employe" ? { employe: String(payload.employe || "") } : {}),
    ...(type === "description_projet" ? { projet: String(payload.projet || payload.nomProjet || "") } : {}),
    ...(type === "communiquer" ? { titre: String(payload.titre || payload.objet || "") } : {}),
    ...(type === "certificat" ? { beneficiaire: String(payload.beneficiaire || "") } : {}),
  };
  const requete = id ? db.from(table).update(ligne).eq("id", id).select().single() : db.from(table).insert(ligne).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as DocumentRecord;
}

export async function enregistrerCarteService(payload: Record<string, unknown>, imageBase64: string, numero?: string, id?: string) {
  const documentNumero = numero || (await genererNumero("carte_service"));
  const nomFichier = `${documentNumero}-${String(payload.nomComplet || "carte-service").replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.png`;
  const ligne = {
    numero: documentNumero,
    nom_fichier: nomFichier,
    nom_complet: String(payload.nomComplet || ""),
    matricule: String(payload.matricule || ""),
    donnees_formulaire: payload,
    image_base64: imageBase64,
    date_document: String(payload.date || new Date().toISOString().slice(0, 10)),
  };
  const requete = id ? db.from("cartes_service").update(ligne).eq("id", id).select().single() : db.from("cartes_service").insert(ligne).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as DocumentRecord;
}

export async function enregistrerRendu3D(payload: Record<string, unknown>, imageBase64: string, numero?: string, id?: string) {
  const documentNumero = numero || (await genererNumero("rendu_3d"));
  const nomFichier = `${documentNumero}-${String(payload.titre || "rendu-3d").replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.png`;
  const ligne = {
    numero: documentNumero,
    nom_fichier: nomFichier,
    titre: String(payload.titre || "Rendu 3D"),
    donnees_formulaire: payload,
    image_base64: imageBase64,
    date_document: String(payload.date || new Date().toISOString().slice(0, 10)),
  };
  const requete = id ? db.from("rendus_3d").update(ligne).eq("id", id).select().single() : db.from("rendus_3d").insert(ligne).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as DocumentRecord;
}

export async function enregistrerRealisticSketchup(payload: Record<string, unknown>, imageBase64: string, numero?: string, id?: string) {
  const documentNumero = numero || (await genererNumero("realistic_sketchup"));
  const nomFichier = `${documentNumero}-${String(payload.titre || "realistic-sketchup").replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.png`;
  const ligne = {
    numero: documentNumero,
    nom_fichier: nomFichier,
    titre: String(payload.titre || "Realistic SketchUp"),
    donnees_formulaire: payload,
    image_base64: imageBase64,
    date_document: String(payload.date || new Date().toISOString().slice(0, 10)),
  };
  const requete = id ? db.from("realistic_sketchup").update(ligne).eq("id", id).select().single() : db.from("realistic_sketchup").insert(ligne).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as DocumentRecord;
}

export async function enregistrerFicheEmploye(payload: Record<string, unknown>, pdfBase64: string, numero?: string, id?: string) {
  const documentNumero = numero || (await genererNumero("fiche_employe"));
  const nomFichier = `${documentNumero}-${String(payload.titre || payload.typeFiche || "fiche-employe").replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.pdf`;
  const ligne = {
    numero: documentNumero,
    nom_fichier: nomFichier,
    type_fiche: String(payload.typeFiche || "individuelle"),
    titre: String(payload.titre || "Fiche employé"),
    donnees_formulaire: payload,
    pdf_base64: pdfBase64,
    date_document: String(payload.date || new Date().toISOString().slice(0, 10)),
  };
  const requete = id ? db.from("fiches_employes").update(ligne).eq("id", id).select().single() : db.from("fiches_employes").insert(ligne).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as DocumentRecord;
}

export async function enregistrerCodeQR(payload: Record<string, unknown>, qrBase64: string, urlPublique: string, numero?: string, id?: string) {
  const documentNumero = numero || (await genererNumero("code_qr"));
  const nomFichier = `${documentNumero}-${String(payload.employeNom || "code-qr-employe").replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.png`;
  const ligne = {
    numero: documentNumero,
    nom_fichier: nomFichier,
    employe_id: String(payload.employeId || ""),
    employe_nom: String(payload.employeNom || ""),
    matricule: String(payload.matricule || ""),
    url_publique: urlPublique,
    qr_base64: qrBase64,
    donnees_formulaire: payload,
    date_document: String(payload.date || new Date().toISOString().slice(0, 10)),
  };
  const requete = id ? db.from("codes_qr_employes").update(ligne).eq("id", id).select().single() : db.from("codes_qr_employes").insert(ligne).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as DocumentRecord;
}

export async function creerFormulairePersonnalise(titre: string, description: string, champs: ChampPersonnalise[], urlPublique = "") {
  const id = crypto.randomUUID();
  const lien = urlPublique || `https://scm-tolls.lovable.app/formulaire/${id}`;
  const { data, error } = await db.from("formulaires_personnalises").insert({ id, titre, description, champs, url_publique: lien, publie: true }).select().single();
  if (error) throw new Error(error.message);
  return data as FormulairePersonnalise;
}

export async function listerFormulairesPersonnalises() {
  const { data, error } = await db.from("formulaires_personnalises").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FormulairePersonnalise[];
}

export async function obtenirFormulairePublic(id: string) {
  const { data, error } = await db.from("formulaires_personnalises").select("*").eq("id", id).eq("publie", true).maybeSingle();
  if (error) throw new Error(error.message);
  return data as FormulairePersonnalise | null;
}

export async function envoyerReponseFormulaire(formulaireId: string, reponses: Record<string, string>, fichiers: ReponseFormulaire["fichiers"]) {
  const { data, error } = await db.from("reponses_formulaires").insert({ formulaire_id: formulaireId, reponses, fichiers }).select().single();
  if (error) throw new Error(error.message);
  return data as ReponseFormulaire;
}

export async function listerReponsesFormulaire(formulaireId: string) {
  const { data, error } = await db.from("reponses_formulaires").select("*").eq("formulaire_id", formulaireId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReponseFormulaire[];
}

export async function supprimerDocument(type: OutilType, id: string) {
  const { error } = await db.from(tablesParOutil[type]).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

async function imageVersBase64(url: string) {
  const reponse = await fetch(url);
  const blob = await reponse.blob();
  return await new Promise<string>((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(String(lecteur.result));
    lecteur.onerror = reject;
    lecteur.readAsDataURL(blob);
  });
}

async function drapeauRdcVersPng() {
  const svg = await fetch(drapeauRdcUrl).then((reponse) => reponse.text());
  const image = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const contexte = canvas.getContext("2d");
  if (!contexte) throw new Error("Impossible de préparer le drapeau de la RDC.");
  contexte.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/png");
}

function texteMultiligne(pdf: jsPDF, label: string, valeur: string, x: number, y: number, largeur = 170, couleur: [number, number, number] = [16, 42, 88]) {
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...couleur);
  pdf.text(label, x, y);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(36, 45, 64);
  const lignes = pdf.splitTextToSize(valeur || "—", largeur);
  pdf.text(lignes, x, y + 6);
  return y + 10 + lignes.length * 5;
}

function piedDePage(pdf: jsPDF, couleur: [number, number, number], sceau?: string, signature?: string, libelleSceau = "Sceau de l’entreprise", libelleSignature = "Signature du client") {
  const y = 244;
  pdf.setDrawColor(...couleur);
  pdf.line(18, y - 8, 192, y - 8);
  pdf.setFontSize(9);
  pdf.setTextColor(90, 98, 115);
  pdf.text(libelleSceau || "Sceau de l’entreprise", 25, y);
  pdf.text(libelleSignature || "Signature du client", 115, y);
  if (sceau) pdf.addImage(sceau, "JPEG", 27, y + 7, 48, 24, undefined, "FAST");
  if (signature) pdf.addImage(signature, "JPEG", 117, y + 7, 48, 24, undefined, "FAST");
}

function piedDePageCommunication(pdf: jsPDF, couleur: [number, number, number], sceau?: string, libelleSceau = "Nom / fonction de celui qui impose le sceau") {
  const y = 238;
  pdf.setDrawColor(...couleur);
  pdf.line(18, y - 8, 192, y - 8);
  pdf.setFontSize(9);
  pdf.setTextColor(90, 98, 115);
  pdf.text(libelleSceau || "Nom / fonction de celui qui impose le sceau", 115, y);
  if (sceau) pdf.addImage(sceau, "JPEG", 118, y + 7, 52, 28, undefined, "FAST");
}

function texteValeur(pdf: jsPDF, label: string, valeur: string, x: number, y: number, largeur = 170, interligne = 4.5, couleur: [number, number, number] = [16, 42, 88]) {
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...couleur);
  pdf.text(label.toUpperCase(), x, y);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(36, 45, 64);
  const lignes = pdf.splitTextToSize(valeur || "—", largeur);
  pdf.text(lignes, x, y + 5);
  return y + 8 + lignes.length * interligne;
}

function valeurChamp(champs: Array<[string, string]>, label: string) {
  return champs.find(([nom]) => nom === label)?.[1] || "—";
}

function creerPdfDescriptionProjet(pdf: jsPDF, champs: Array<[string, string]>, couleur: [number, number, number], couleurDouce: [number, number, number], options: { sceau?: string; signature?: string; libelleSceau?: string; libelleSignature?: string }) {
  let y = 82;
  pdf.setTextColor(...couleur);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setFillColor(...couleurDouce);
  pdf.rect(20, y - 5, 168, 8, "F");
  pdf.text("INFORMATIONS GÉNÉRALES", 23, y);
  y += 12;
  y = texteValeur(pdf, "Titre du projet", valeurChamp(champs, "Titre du projet"), 20, y, 78, 3.8, couleur);
  y = texteValeur(pdf, "Nom du client", valeurChamp(champs, "Nom du client"), 110, y - 13, 78, 3.8, couleur) + 2;
  pdf.setFont("helvetica", "bold");
  pdf.setFillColor(...couleurDouce);
  pdf.rect(20, y - 5, 168, 8, "F");
  pdf.text("ENTREPRISE", 23, y);
  pdf.text("TYPE", 94, y);
  pdf.text("DATE", 145, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(pdf.splitTextToSize(valeurChamp(champs, "Nom de l’entreprise"), 64), 23, y + 8);
  pdf.text(pdf.splitTextToSize(valeurChamp(champs, "Type d’entreprise"), 42), 94, y + 8);
  pdf.text(valeurChamp(champs, "Date"), 145, y + 8);
  y += 23;

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...couleur);
  pdf.text("COORDONNÉES", 20, y);
  y += 8;
  pdf.setFillColor(...couleurDouce);
  pdf.rect(20, y - 5, 168, 8, "F");
  pdf.text("Nom du point de contact", 23, y);
  pdf.text("Adresse courriel", 82, y);
  pdf.text("Téléphone", 146, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(pdf.splitTextToSize(valeurChamp(champs, "Nom du point de contact"), 54), 23, y + 8);
  pdf.text(pdf.splitTextToSize(valeurChamp(champs, "Adresse courriel"), 58), 82, y + 8);
  pdf.text(pdf.splitTextToSize(valeurChamp(champs, "Téléphone"), 40), 146, y + 8);
  y += 21;
  y = texteValeur(pdf, "Adresse postale", valeurChamp(champs, "Adresse postale"), 20, y, 78, 3.8, couleur);
  y = texteValeur(pdf, "Emplacement / adresse de la propriété", valeurChamp(champs, "Emplacement / adresse de la propriété"), 110, y - 13, 78, 3.8, couleur) + 1;
  y = texteValeur(pdf, "Aperçu du projet", valeurChamp(champs, "Aperçu du projet"), 20, y, 168, 3.8, couleur);
  y = texteValeur(pdf, "Dim. parcelle : Ly x LX en mètres", valeurChamp(champs, "Dim. parcelle : Ly x LX en mètres"), 20, y + 1, 78, 3.8, couleur);
  y = texteValeur(pdf, "Superficie en m²", valeurChamp(champs, "Superficie en m²"), 110, y - 13, 36, 3.8, couleur);
  y = texteValeur(pdf, "Nombre de niveaux", valeurChamp(champs, "Nombre de niveaux"), 151, y - 13, 37, 3.8, couleur) + 1;
  y = texteValeur(pdf, "Portée du projet", valeurChamp(champs, "Portée du projet"), 20, y, 78, 3.8, couleur);
  texteValeur(pdf, "État de la zone du terrain", valeurChamp(champs, "État de la zone du terrain"), 110, y - 13, 78, 3.8, couleur);
  piedDePage(pdf, couleur, options.sceau, options.signature, options.libelleSceau, options.libelleSignature);
}

function formatImage(image?: string): "JPEG" | "PNG" { return image?.startsWith("data:image/png") ? "PNG" : "JPEG"; }

function ajouterImageSiValide(pdf: jsPDF, image: string | undefined, x: number, y: number, w: number, h: number) {
  if (!image) return;
  pdf.addImage(image, formatImage(image), x, y, w, h, undefined, "FAST");
}

function creerPdfCertificat(pdf: jsPDF, champs: Array<[string, string]>, numero: string, options: { sceau?: string; signature?: string; libelleSceau?: string; libelleSignature?: string }) {
  const logoCertificat = valeurChamp(champs, "Logo personnalisé");
  const signatureGauche = valeurChamp(champs, "Signature gauche");
  const titre = valeurChamp(champs, "Titre du certificat");
  const sousTitre = valeurChamp(champs, "Sous-titre");
  const beneficiaire = valeurChamp(champs, "Nom du bénéficiaire");
  const texte = valeurChamp(champs, "Texte du certificat");
  const date = valeurChamp(champs, "Date");
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 210, 297, "F");
  pdf.setFillColor(3, 76, 120); pdf.triangle(0, 0, 0, 42, 105, 0, "F"); pdf.triangle(210, 0, 210, 42, 105, 0, "F");
  pdf.setFillColor(246, 181, 73); pdf.triangle(0, 0, 0, 15, 91, 41, "F"); pdf.triangle(210, 0, 210, 15, 119, 41, "F");
  pdf.setFillColor(31, 126, 161); pdf.triangle(0, 38, 0, 63, 93, 51, "F"); pdf.triangle(210, 38, 210, 63, 117, 51, "F");
  pdf.setDrawColor(246, 181, 73); pdf.setLineWidth(1.3); pdf.rect(16, 48, 178, 223); pdf.setLineWidth(0.45); pdf.rect(20, 52, 170, 215);
  ajouterImageSiValide(pdf, logoCertificat && logoCertificat !== "—" ? logoCertificat : undefined, 85, 23, 40, 24);
  pdf.setFont("times", "bold"); pdf.setTextColor(255, 255, 255); pdf.setFontSize(28); pdf.text((titre || "CERTIFICAT").toUpperCase(), 105, 18, { align: "center" });
  pdf.setFontSize(13); pdf.text((sousTitre || "DE RECONNAISSANCE").toUpperCase(), 105, 28, { align: "center" });
  pdf.setTextColor(42, 48, 63); pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text("CE CERTIFICAT EST FIÈREMENT PRÉSENTÉ À :", 105, 92, { align: "center" });
  pdf.setFont("times", "italic"); pdf.setFontSize(30); pdf.setTextColor(18, 38, 58); pdf.text(beneficiaire || "Nom du bénéficiaire", 105, 121, { align: "center" });
  pdf.setDrawColor(130, 137, 150); pdf.line(52, 128, 158, 128);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(52, 61, 78); pdf.text(pdf.splitTextToSize(texte || "Pour attester officiellement de cette distinction.", 130), 105, 150, { align: "center" });
  pdf.setFontSize(8); pdf.setTextColor(95, 103, 118); pdf.text(`N° ${numero}`, 24, 260); pdf.text(date || new Date().toLocaleDateString("fr-FR"), 58, 231, { align: "center" });
  pdf.setDrawColor(80, 88, 105); pdf.line(36, 220, 80, 220); pdf.line(130, 220, 174, 220);
  ajouterImageSiValide(pdf, signatureGauche && signatureGauche !== "—" ? signatureGauche : undefined, 38, 196, 40, 18);
  ajouterImageSiValide(pdf, options.signature, 132, 196, 40, 18);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(32, 40, 58); pdf.text(options.libelleSceau || "DATE", 58, 228, { align: "center" }); pdf.text(options.libelleSignature || "SIGNATURE", 152, 228, { align: "center" });
  ajouterImageSiValide(pdf, options.sceau, 88, 40, 34, 34);
}

function ajouterEnteteFicheEmploye(pdf: jsPDF, logo: string, drapeauRdc: string, titre: string, numero: string, couleur: [number, number, number]) {
  pdf.setFillColor(247, 249, 252);
  pdf.rect(0, 0, 210, 297, "F");
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(12, 12, 186, 273, 3, 3, "F");
  pdf.addImage(logo, "JPEG", 18, 16, 54, 29, undefined, "FAST");
  pdf.addImage(drapeauRdc, "PNG", 166, 17, 24, 18, undefined, "FAST");
  pdf.setTextColor(...couleur);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(titre.toUpperCase(), 18, 58);
  pdf.setFontSize(10);
  pdf.text(`N° ${numero}`, 18, 65);
  pdf.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 158, 65);
  pdf.setDrawColor(...couleur);
  pdf.line(18, 70, 192, 70);
}

function blocInfoEmploye(pdf: jsPDF, label: string, valeur: string | undefined | null, x: number, y: number, largeur: number, couleur: [number, number, number], couleurDouce: [number, number, number]) {
  pdf.setFillColor(...couleurDouce);
  pdf.roundedRect(x, y, largeur, 20, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...couleur);
  pdf.text(label.toUpperCase(), x + 4, y + 6);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(35, 45, 62);
  pdf.text(pdf.splitTextToSize(valeur || "—", largeur - 8), x + 4, y + 13);
}

export async function creerPdfFicheEmploye(typeFiche: string, employes: EmployeRecord[], numero: string, sceau?: string) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const couleurs = couleursPdfParOutil.fiche_employe;
  const logo = await imageVersBase64(logoUrl);
  const drapeauRdc = await drapeauRdcVersPng();
  ajouterEnteteFicheEmploye(pdf, logo, drapeauRdc, typeFiche === "collective" ? "Fiche collective des employés" : "Fiche individuelle de l’employé", numero, couleurs.principal);

  if (typeFiche === "collective") {
    let x = 20;
    let y = 84;
    employes.forEach((employe, index) => {
      if (y > 226) { piedDePage(pdf, couleurs.principal, sceau, undefined, "Sceau de l’entreprise", ""); pdf.addPage(); ajouterEnteteFicheEmploye(pdf, logo, drapeauRdc, "Fiche collective des employés", numero, couleurs.principal); x = 20; y = 84; }
      pdf.setFillColor(...couleurs.doux);
      pdf.roundedRect(x, y - 6, 81, 42, 2, 2, "F");
      ajouterImageSiValide(pdf, employe.photo_profil, x + 4, y - 1, 24, 24);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(9.5); pdf.setTextColor(...couleurs.principal);
      pdf.text(pdf.splitTextToSize(`${index + 1}. ${employe.nom_complet || "—"}`, 47), x + 32, y + 2);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.2); pdf.setTextColor(45, 55, 72);
      pdf.text(`Matricule : ${employe.matricule || "—"}`, x + 32, y + 17);
      pdf.text(`Genre : ${employe.genre || "—"}`, x + 32, y + 25);
      if (x < 90) x = 107; else { x = 20; y += 49; }
    });
    piedDePage(pdf, couleurs.principal, sceau, undefined, "Sceau de l’entreprise", "");
    return pdf.output("datauristring");
  }

  const employe = employes[0];
  pdf.setFillColor(...couleurs.doux);
  pdf.roundedRect(20, 82, 168, 45, 3, 3, "F");
  ajouterImageSiValide(pdf, employe?.photo_profil, 26, 88, 32, 32);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(15); pdf.setTextColor(...couleurs.principal);
  pdf.text(pdf.splitTextToSize(employe?.nom_complet || "—", 116), 66, 94);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(45, 55, 72);
  pdf.text(`Matricule : ${employe?.matricule || "—"}`, 66, 106);
  pdf.text(`Poste : ${employe?.poste || "—"}`, 66, 116);
  const infos: Array<[string, string | undefined | null]> = [["Genre", employe?.genre], ["Téléphone", employe?.telephone], ["Email", employe?.email], ["Adresse", employe?.adresse], ["Date de naissance", employe?.date_naissance], ["Date d’admission", employe?.date_admission], ["N° pièce d’identité", employe?.numero_piece_identite], ["Contact d’urgence", employe?.contact_urgence], ["Statut", employe?.statut], ["Rôle", employe?.role]];
  infos.forEach(([label, valeur], index) => blocInfoEmploye(pdf, label, valeur, index % 2 === 0 ? 20 : 107, 140 + Math.floor(index / 2) * 25, 81, couleurs.principal, couleurs.doux));
  piedDePage(pdf, couleurs.principal, sceau, undefined, "Sceau de l’entreprise", "");
  return pdf.output("datauristring");
}

export async function creerPdf(type: OutilType, titre: string, numero: string, champs: Array<[string, string]>, options: { sceau?: string; signature?: string; libelleSceau?: string; libelleSignature?: string; lignes?: LignePrestation[]; total?: number }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const couleurs = couleursPdfParOutil[type];
  const logo = await imageVersBase64(logoUrl);
  const drapeauRdc = await drapeauRdcVersPng();

  if (type === "certificat") {
    creerPdfCertificat(pdf, champs, numero, options);
    return pdf.output("datauristring");
  }

  pdf.setFillColor(247, 249, 252);
  pdf.rect(0, 0, 210, 297, "F");
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(12, 12, 186, 273, 3, 3, "F");
  pdf.addImage(logo, "JPEG", 18, 16, 54, 29, undefined, "FAST");
  pdf.addImage(drapeauRdc, "PNG", 166, 17, 24, 18, undefined, "FAST");
  pdf.setTextColor(...couleurs.principal);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(19);
  pdf.text(titre.toUpperCase(), 18, 58);
  pdf.setFontSize(10);
  pdf.text(`N° ${numero}`, 18, 65);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 158, 65);
  pdf.setDrawColor(...couleurs.secondaire);
  pdf.setLineWidth(0.7);
  pdf.line(18, 70, 192, 70);

  if (type === "description_projet") {
    creerPdfDescriptionProjet(pdf, champs, couleurs.principal, couleurs.doux, options);
    return pdf.output("datauristring");
  }

  let y = 82;
  champs.forEach(([label, valeur]) => {
    y = texteMultiligne(pdf, label, valeur, 20, y, 165, couleurs.principal);
    if (y > 218) {
      type === "communiquer" ? piedDePageCommunication(pdf, couleurs.principal, options.sceau, options.libelleSceau) : piedDePage(pdf, couleurs.principal, options.sceau, options.signature, options.libelleSceau, options.libelleSignature);
      pdf.addPage();
      y = 24;
    }
  });

  if (options.lignes?.length) {
    const titreLignes = type === "devis" ? "Achats à faire" : "Prestations";
    const libellePrix = type === "devis" ? "Coût" : "Prix";
    y += 2;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...couleurs.principal);
    pdf.text(titreLignes, 20, y);
    y += 8;
    pdf.setFillColor(...couleurs.doux);
    pdf.rect(20, y - 5, 168, 8, "F");
    pdf.text("Description", 23, y);
    pdf.text("Qté", 125, y);
    pdf.text(libellePrix, 145, y);
    pdf.text("Total", 168, y);
    pdf.setFont("helvetica", "normal");
    options.lignes.forEach((ligne) => {
      y += 8;
      pdf.text(pdf.splitTextToSize(ligne.description || "—", 92), 23, y);
      pdf.text(String(ligne.quantite), 126, y);
      pdf.text(`${ligne.prix.toLocaleString("fr-FR")} $`, 144, y);
      pdf.text(`${(ligne.quantite * ligne.prix).toLocaleString("fr-FR")} $`, 166, y);
    });
  }

  if (type !== "communiquer" && typeof options.total === "number") {
    pdf.setFillColor(...couleurs.principal);
    pdf.roundedRect(124, 220, 64, 14, 2, 2, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.text(`TOTAL : ${options.total.toLocaleString("fr-FR")} $`, 130, 229);
  }

  type === "communiquer" ? piedDePageCommunication(pdf, couleurs.principal, options.sceau, options.libelleSceau) : piedDePage(pdf, couleurs.principal, options.sceau, options.signature, options.libelleSceau, options.libelleSignature);
  return pdf.output("datauristring");
}

export function telechargerPdf(base64: string, nom: string) {
  const lien = document.createElement("a");
  lien.href = base64;
  lien.download = nom;
  lien.click();
}

export function voirPdf(base64: string) {
  const fenetre = window.open();
  if (fenetre) fenetre.document.write(`<iframe title="PDF" src="${base64}" style="border:0;width:100%;height:100vh"></iframe>`);
}

export function telechargerImage(base64: string, nom: string) {
  const lien = document.createElement("a");
  lien.href = base64;
  lien.download = nom;
  lien.click();
}

export function voirImage(base64: string) {
  const fenetre = window.open();
  if (fenetre) fenetre.document.write(`<img alt="Carte de service" src="${base64}" style="display:block;max-width:100%;height:auto;margin:0 auto;background:#c8c8c8" />`);
}

export async function mockupCarteServiceBase64() {
  return imageVersBase64(carteServiceMockupUrl);
}
