import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/scm-logo.jpeg";

export type OutilType = "facture" | "devis" | "recu" | "contrat_construction" | "contrat_employe" | "description_projet";

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

export const tablesParOutil: Record<OutilType, string> = {
  facture: "factures",
  devis: "devis",
  recu: "recus",
  contrat_construction: "contrats_construction",
  contrat_employe: "contrats_employes",
  description_projet: "descriptions_projets",
};

export const prefixesParOutil: Record<OutilType, string> = {
  facture: "FAC",
  devis: "DEV",
  recu: "REC",
  contrat_construction: "CCO",
  contrat_employe: "CEM",
  description_projet: "PRJ",
};

const colonnesRechercheParOutil: Record<OutilType, string[]> = {
  facture: ["nom_fichier", "numero", "client"],
  devis: ["nom_fichier", "numero", "client"],
  recu: ["nom_fichier", "numero", "client"],
  contrat_construction: ["nom_fichier", "numero", "client"],
  contrat_employe: ["nom_fichier", "numero", "employe"],
  description_projet: ["nom_fichier", "numero", "projet"],
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

function ajouterDrapeauRdc(pdf: jsPDF, x: number, y: number) {
  pdf.setFillColor(0, 149, 218);
  pdf.rect(x, y, 22, 14, "F");
  pdf.setDrawColor(252, 209, 22);
  pdf.setLineWidth(4);
  pdf.line(x + 2, y + 14, x + 22, y);
  pdf.setDrawColor(206, 17, 38);
  pdf.setLineWidth(2);
  pdf.line(x + 3, y + 14, x + 22, y + 1);
  pdf.setFillColor(252, 209, 22);
  pdf.text("★", x + 3, y + 6);
}

function texteMultiligne(pdf: jsPDF, label: string, valeur: string, x: number, y: number, largeur = 170) {
  pdf.setFont("helvetica", "bold");
  pdf.text(label, x, y);
  pdf.setFont("helvetica", "normal");
  const lignes = pdf.splitTextToSize(valeur || "—", largeur);
  pdf.text(lignes, x, y + 6);
  return y + 10 + lignes.length * 5;
}

function piedDePage(pdf: jsPDF, sceau?: string, signature?: string) {
  const y = 244;
  pdf.setDrawColor(25, 55, 109);
  pdf.line(18, y - 8, 192, y - 8);
  pdf.setFontSize(9);
  pdf.setTextColor(90, 98, 115);
  pdf.text("Zone réservée au sceau de l’entreprise", 25, y);
  pdf.text("Zone réservée à la signature du client", 115, y);
  pdf.setDrawColor(170, 176, 190);
  pdf.roundedRect(22, y + 4, 58, 30, 2, 2);
  pdf.roundedRect(112, y + 4, 58, 30, 2, 2);
  if (sceau) pdf.addImage(sceau, "JPEG", 27, y + 7, 48, 24, undefined, "FAST");
  if (signature) pdf.addImage(signature, "JPEG", 117, y + 7, 48, 24, undefined, "FAST");
  pdf.setFontSize(8);
  pdf.text("SCM SARL — RCCM : CD/KNM/RCCM/24-B-01256 — IDNAT : 01-F4200-N55523N — N° Impôt : A2442 173S", 18, 287);
}

export async function creerPdf(type: OutilType, titre: string, numero: string, champs: Array<[string, string]>, options: { sceau?: string; signature?: string; lignes?: LignePrestation[]; total?: number }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await imageVersBase64(logoUrl);
  pdf.setFillColor(247, 249, 252);
  pdf.rect(0, 0, 210, 297, "F");
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(12, 12, 186, 273, 3, 3, "F");
  pdf.addImage(logo, "JPEG", 18, 16, 54, 29, undefined, "FAST");
  ajouterDrapeauRdc(pdf, 170, 18);
  pdf.setTextColor(16, 42, 88);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(19);
  pdf.text(titre.toUpperCase(), 18, 58);
  pdf.setFontSize(10);
  pdf.text(`N° ${numero}`, 18, 65);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 158, 65);
  pdf.setDrawColor(22, 73, 146);
  pdf.setLineWidth(0.7);
  pdf.line(18, 70, 192, 70);

  let y = 82;
  champs.forEach(([label, valeur]) => {
    y = texteMultiligne(pdf, label, valeur, 20, y, 165);
    if (y > 218) {
      piedDePage(pdf, options.sceau, options.signature);
      pdf.addPage();
      y = 24;
    }
  });

  if (options.lignes?.length) {
    y += 2;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(16, 42, 88);
    pdf.text("Prestations", 20, y);
    y += 8;
    pdf.setFillColor(230, 238, 250);
    pdf.rect(20, y - 5, 168, 8, "F");
    pdf.text("Description", 23, y);
    pdf.text("Qté", 125, y);
    pdf.text("Prix", 145, y);
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

  if (typeof options.total === "number") {
    pdf.setFillColor(16, 42, 88);
    pdf.roundedRect(124, 220, 64, 14, 2, 2, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.text(`TOTAL : ${options.total.toLocaleString("fr-FR")} $`, 130, 229);
  }

  piedDePage(pdf, options.sceau, options.signature);
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
