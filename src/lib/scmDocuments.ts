import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/scm-logo.jpeg";
import drapeauRdcUrl from "@/assets/drapeau-rdc.svg";

export type OutilType = "facture" | "devis" | "recu" | "contrat_construction" | "contrat_employe" | "description_projet" | "communiquer";

export type DocumentRecord = {
  id: string;
  numero: string;
  nom_fichier: string;
  donnees_formulaire: Record<string, unknown>;
  pdf_base64: string;
  montant_total?: number;
  client?: string;
  employe?: string;
  projet?: string;
  date_document: string;
  created_at: string;
};

export type LignePrestation = { description: string; quantite: number; prix: number };

const couleursPdfParOutil: Record<OutilType, { principal: [number, number, number]; secondaire: [number, number, number]; doux: [number, number, number] }> = {
  facture: { principal: [37, 99, 235], secondaire: [8, 145, 178], doux: [230, 240, 255] },
  devis: { principal: [245, 158, 11], secondaire: [250, 204, 21], doux: [255, 247, 214] },
  recu: { principal: [16, 185, 129], secondaire: [34, 197, 94], doux: [225, 250, 240] },
  contrat_construction: { principal: [124, 58, 237], secondaire: [168, 85, 247], doux: [242, 232, 255] },
  contrat_employe: { principal: [20, 184, 166], secondaire: [6, 182, 212], doux: [224, 250, 247] },
  description_projet: { principal: [239, 68, 68], secondaire: [249, 115, 22], doux: [255, 235, 232] },
  communiquer: { principal: [236, 72, 153], secondaire: [249, 115, 22], doux: [255, 232, 243] },
};

export const tablesParOutil: Record<OutilType, string> = {
  facture: "factures",
  devis: "devis",
  recu: "recus",
  contrat_construction: "contrats_construction",
  contrat_employe: "contrats_employes",
  description_projet: "descriptions_projets",
  communiquer: "communications",
};

export const prefixesParOutil: Record<OutilType, string> = {
  facture: "FAC",
  devis: "DEV",
  recu: "REC",
  contrat_construction: "CCO",
  contrat_employe: "CEM",
  description_projet: "PRJ",
  communiquer: "COM",
};

const colonnesRechercheParOutil: Record<OutilType, string[]> = {
  facture: ["nom_fichier", "numero", "client"],
  devis: ["nom_fichier", "numero", "client"],
  recu: ["nom_fichier", "numero", "client"],
  contrat_construction: ["nom_fichier", "numero", "client"],
  contrat_employe: ["nom_fichier", "numero", "employe"],
  description_projet: ["nom_fichier", "numero", "projet"],
  communiquer: ["nom_fichier", "numero", "titre"],
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
  };
  const requete = id ? db.from(table).update(ligne).eq("id", id).select().single() : db.from(table).insert(ligne).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as DocumentRecord;
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

function texteMultiligne(pdf: jsPDF, label: string, valeur: string, x: number, y: number, largeur = 170) {
  pdf.setFont("helvetica", "bold");
  pdf.text(label, x, y);
  pdf.setFont("helvetica", "normal");
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

function texteValeur(pdf: jsPDF, label: string, valeur: string, x: number, y: number, largeur = 170, interligne = 4.5) {
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(16, 42, 88);
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

function creerPdfDescriptionProjet(pdf: jsPDF, champs: Array<[string, string]>, couleur: [number, number, number], options: { sceau?: string; signature?: string; libelleSceau?: string; libelleSignature?: string }) {
  let y = 82;
  pdf.setTextColor(16, 42, 88);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setFillColor(230, 238, 250);
  pdf.rect(20, y - 5, 168, 8, "F");
  pdf.text("INFORMATIONS GÉNÉRALES", 23, y);
  y += 12;
  y = texteValeur(pdf, "Titre du projet", valeurChamp(champs, "Titre du projet"), 20, y, 78, 3.8);
  y = texteValeur(pdf, "Nom du client", valeurChamp(champs, "Nom du client"), 110, y - 13, 78, 3.8) + 2;
  pdf.setFont("helvetica", "bold");
  pdf.setFillColor(230, 238, 250);
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
  pdf.setTextColor(16, 42, 88);
  pdf.text("COORDONNÉES", 20, y);
  y += 8;
  pdf.setFillColor(230, 238, 250);
  pdf.rect(20, y - 5, 168, 8, "F");
  pdf.text("Nom du point de contact", 23, y);
  pdf.text("Adresse courriel", 82, y);
  pdf.text("Téléphone", 146, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(pdf.splitTextToSize(valeurChamp(champs, "Nom du point de contact"), 54), 23, y + 8);
  pdf.text(pdf.splitTextToSize(valeurChamp(champs, "Adresse courriel"), 58), 82, y + 8);
  pdf.text(pdf.splitTextToSize(valeurChamp(champs, "Téléphone"), 40), 146, y + 8);
  y += 21;
  y = texteValeur(pdf, "Adresse postale", valeurChamp(champs, "Adresse postale"), 20, y, 78, 3.8);
  y = texteValeur(pdf, "Emplacement / adresse de la propriété", valeurChamp(champs, "Emplacement / adresse de la propriété"), 110, y - 13, 78, 3.8) + 1;
  y = texteValeur(pdf, "Aperçu du projet", valeurChamp(champs, "Aperçu du projet"), 20, y, 168, 3.8);
  y = texteValeur(pdf, "Dim. parcelle : Ly x LX en mètres", valeurChamp(champs, "Dim. parcelle : Ly x LX en mètres"), 20, y + 1, 78, 3.8);
  y = texteValeur(pdf, "Superficie en m²", valeurChamp(champs, "Superficie en m²"), 110, y - 13, 36, 3.8);
  y = texteValeur(pdf, "Nombre de niveaux", valeurChamp(champs, "Nombre de niveaux"), 151, y - 13, 37, 3.8) + 1;
  y = texteValeur(pdf, "Portée du projet", valeurChamp(champs, "Portée du projet"), 20, y, 78, 3.8);
  texteValeur(pdf, "État de la zone du terrain", valeurChamp(champs, "État de la zone du terrain"), 110, y - 13, 78, 3.8);
  piedDePage(pdf, couleur, options.sceau, options.signature, options.libelleSceau, options.libelleSignature);
}

export async function creerPdf(type: OutilType, titre: string, numero: string, champs: Array<[string, string]>, options: { sceau?: string; signature?: string; libelleSceau?: string; libelleSignature?: string; lignes?: LignePrestation[]; total?: number }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const couleurs = couleursPdfParOutil[type];
  const logo = await imageVersBase64(logoUrl);
  const drapeauRdc = await drapeauRdcVersPng();
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
    creerPdfDescriptionProjet(pdf, champs, couleurs.principal, options);
    return pdf.output("datauristring");
  }

  let y = 82;
  champs.forEach(([label, valeur]) => {
    y = texteMultiligne(pdf, label, valeur, 20, y, 165);
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
    pdf.setTextColor(16, 42, 88);
    pdf.text(titreLignes, 20, y);
    y += 8;
    pdf.setFillColor(230, 238, 250);
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
    pdf.setFillColor(16, 42, 88);
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
