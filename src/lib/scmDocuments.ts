import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/scm-logo.jpeg";
import logoCarteServiceUrl from "@/assets/logo-scm-carte.jpeg";
import drapeauRdcUrl from "@/assets/drapeau-rdc.svg";
import carteServiceMockupUrl from "@/assets/carte-service-mockup-optimized.jpg";

// Formate les nombres avec un espace ASCII standard comme séparateur de milliers.
// Évite l'espace insécable (U+00A0/U+202F) produit par toLocaleString("fr-FR")
// qui s'affiche incorrectement (ex : "30/000") avec les polices standard de jsPDF.
function formaterMontant(valeur: number, options: { decimales?: number } = {}): string {
  const nombre = Number.isFinite(valeur) ? valeur : 0;
  const fixe = options.decimales !== undefined ? nombre.toFixed(options.decimales) : String(nombre);
  const [partieEntiere, partieDecimale] = fixe.split(".");
  const signe = partieEntiere.startsWith("-") ? "-" : "";
  const entierAbs = signe ? partieEntiere.slice(1) : partieEntiere;
  const avecSeparateurs = entierAbs.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return signe + avecSeparateurs + (partieDecimale ? "," + partieDecimale : "");
}

export type OutilType = "facture" | "devis" | "devis_estimatif" | "recu" | "contrat_construction" | "contrat_fournisseur" | "contrat_employe" | "description_projet" | "communiquer" | "certificat" | "carte_service" | "rendu_3d" | "realistic_sketchup" | "plan_architectural" | "fiche_employe" | "code_qr" | "formulaire_personnalise" | "historique_connexion" | "calendrier_feries" | "organigramme_entreprise" | "demandes_conges" | "bilans_sante" | "gestion_materiel" | "arrivages_materiel" | "incidents_chantier" | "archives_chantiers" | "lettre_licenciement" | "demandes_paiement" | "recu_employe" | "version_nuit";
export type TypeChampPersonnalise = "texte" | "nombre" | "image" | "fichier";
export type ChampPersonnalise = { id: string; label: string; type: TypeChampPersonnalise; requis: boolean };
export type FormulairePersonnalise = { id: string; titre: string; description: string; champs: ChampPersonnalise[]; url_publique: string; publie: boolean; created_at: string; updated_at: string };
export type ReponseFormulaire = { id: string; formulaire_id: string; reponses: Record<string, string>; fichiers: Record<string, { nom: string; type: string; taille: number; contenu: string }>; created_at: string };
export type ConnexionScm = { id: string; role: string; nom_utilisateur: string; admin_id: string | null; employe_id: string | null; matricule: string; type_connexion: string; connected_at: string; created_at: string };
export type JourNonTravaille = { id: string; date_jour: string; titre: string; description: string; type_jour: string; actif: boolean; created_at: string; updated_at: string };
export type BlocOrganigramme = { id: string; titre: string; niveau: number; couleur: "bleu" | "vert" | "orange" | "violet" | "turquoise"; parentId?: string; position?: "bas" | "cote"; image_url?: string };
export type OrganigrammeEntreprise = { id: string; titre: string; description: string; blocs: BlocOrganigramme[]; actif: boolean; created_at: string; updated_at: string };
export type DemandeConge = { id: string; employe_id: string; employe_nom: string; raison: string; image_url: string; statut: string; created_at: string; updated_at: string };
export type BilanSanteEmploye = { id: string; employe_id: string; employe_nom: string; semaine: string; etat_global: string; groupe_sanguin: string; allergies: string; blessure: boolean; details_blessure: string; created_at: string; updated_at: string };
export type LigneMateriel = { nom: string; quantite: number };
export type RapportMateriel = { id: string; chef_chantier_id: string; chef_chantier_nom: string; chantier_id: string | null; chantier_nom: string; semaine: string; materiel_prevu: LigneMateriel[]; materiel_utilise: LigneMateriel[]; materiel_recupere: LigneMateriel[]; materiel_perdu: LigneMateriel[]; notes: string; statut: string; created_at: string; updated_at: string };
export type ArrivageMateriel = { id: string; chef_chantier_id: string; chef_chantier_nom: string; chantier_id: string | null; chantier_nom: string; date_livraison: string; nom_materiel: string; quantite: number; entreprise_partenaire: string; prix_total: number; informations_supplementaires: string; preuve_image_url: string; statut: string; created_at: string; updated_at: string };
export type IncidentChantier = { id: string; chef_chantier_id: string; chef_chantier_nom: string; chantier_id: string | null; chantier_nom: string; type_evenement: string; date_evenement: string; explication: string; images: string[]; statut: string; created_at: string; updated_at: string };
export type ArchiveChantier = { id: string; nom_chantier: string; nom_client: string; date_debut_construction: string | null; date_finalisation_construction: string | null; budget_estime_debut: number; budget_final: number; adresse_projet: string; employes_participants: EmployeRecord[]; images_chantier: string[]; pdf_base64: string; nom_fichier: string; created_at: string; updated_at: string };

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
export type LigneDeduction = { libelle: string; pourcentage?: number; montant?: number };

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
  devis_estimatif: { principal: [180, 83, 9], secondaire: [234, 179, 8], doux: [255, 243, 215] },
  recu: { principal: [16, 185, 129], secondaire: [34, 197, 94], doux: [225, 250, 240] },
  contrat_construction: { principal: [124, 58, 237], secondaire: [168, 85, 247], doux: [242, 232, 255] },
  contrat_fournisseur: { principal: [30, 64, 175], secondaire: [14, 165, 233], doux: [224, 236, 255] },
  contrat_employe: { principal: [20, 184, 166], secondaire: [6, 182, 212], doux: [224, 250, 247] },
  description_projet: { principal: [239, 68, 68], secondaire: [249, 115, 22], doux: [255, 235, 232] },
  communiquer: { principal: [236, 72, 153], secondaire: [249, 115, 22], doux: [255, 232, 243] },
  certificat: { principal: [3, 76, 120], secondaire: [245, 181, 72], doux: [238, 248, 252] },
  carte_service: { principal: [10, 132, 216], secondaire: [30, 45, 55], doux: [230, 244, 255] },
  rendu_3d: { principal: [85, 107, 47], secondaire: [196, 126, 66], doux: [242, 246, 232] },
  realistic_sketchup: { principal: [88, 77, 66], secondaire: [46, 125, 92], doux: [241, 238, 233] },
  plan_architectural: { principal: [30, 64, 175], secondaire: [99, 102, 241], doux: [232, 238, 255] },
  fiche_employe: { principal: [22, 101, 52], secondaire: [37, 99, 235], doux: [232, 246, 237] },
  code_qr: { principal: [15, 23, 42], secondaire: [20, 184, 166], doux: [232, 247, 245] },
  formulaire_personnalise: { principal: [80, 70, 229], secondaire: [13, 148, 136], doux: [236, 238, 255] },
  historique_connexion: { principal: [40, 92, 120], secondaire: [21, 128, 61], doux: [232, 242, 245] },
  calendrier_feries: { principal: [125, 71, 10], secondaire: [194, 120, 3], doux: [255, 245, 225] },
  organigramme_entreprise: { principal: [13, 42, 148], secondaire: [20, 184, 166], doux: [232, 240, 255] },
  demandes_conges: { principal: [14, 116, 144], secondaire: [34, 197, 94], doux: [230, 248, 250] },
  bilans_sante: { principal: [190, 18, 60], secondaire: [245, 158, 11], doux: [255, 238, 242] },
  gestion_materiel: { principal: [71, 85, 105], secondaire: [202, 138, 4], doux: [245, 242, 232] },
  arrivages_materiel: { principal: [14, 116, 144], secondaire: [202, 138, 4], doux: [230, 248, 250] },
  incidents_chantier: { principal: [185, 28, 28], secondaire: [234, 88, 12], doux: [255, 236, 232] },
  archives_chantiers: { principal: [52, 88, 74], secondaire: [180, 83, 9], doux: [238, 246, 241] },
  lettre_licenciement: { principal: [127, 29, 29], secondaire: [180, 83, 9], doux: [253, 240, 232] },
  demandes_paiement: { principal: [21, 94, 117], secondaire: [202, 138, 4], doux: [228, 244, 248] },
  recu_employe: { principal: [13, 148, 136], secondaire: [22, 163, 74], doux: [224, 247, 240] },
  version_nuit: { principal: [15, 23, 42], secondaire: [99, 102, 241], doux: [226, 232, 240] },
};

export const tablesParOutil: Record<OutilType, string> = {
  facture: "factures",
  devis: "devis",
  devis_estimatif: "devis_estimatifs",
  recu: "recus",
  contrat_construction: "contrats_construction",
  contrat_fournisseur: "contrats_fournisseurs",
  contrat_employe: "contrats_employes",
  description_projet: "descriptions_projets",
  communiquer: "communications",
  certificat: "certificats",
  carte_service: "cartes_service",
  rendu_3d: "rendus_3d",
  realistic_sketchup: "realistic_sketchup",
  plan_architectural: "plans_architecturaux",
  fiche_employe: "fiches_employes",
  code_qr: "codes_qr_employes",
  formulaire_personnalise: "formulaires_personnalises",
  historique_connexion: "connexions_scm",
  calendrier_feries: "jours_non_travailles",
  organigramme_entreprise: "organigrammes_entreprise",
  demandes_conges: "demandes_conges",
  bilans_sante: "bilans_sante_employes",
  gestion_materiel: "rapports_materiel",
  arrivages_materiel: "arrivages_materiel",
  incidents_chantier: "incidents_chantier",
  archives_chantiers: "archives_chantiers",
  lettre_licenciement: "lettres_licenciement",
  demandes_paiement: "demandes_paiement",
  recu_employe: "recus_employes",
  version_nuit: "versions_nuit",
};

export const prefixesParOutil: Record<OutilType, string> = {
  facture: "FAC",
  devis: "DEV",
  devis_estimatif: "DES",
  recu: "REC",
  contrat_construction: "CCO",
  contrat_fournisseur: "CFO",
  contrat_employe: "CEM",
  description_projet: "PRJ",
  communiquer: "COM",
  certificat: "CRT",
  carte_service: "CAR",
  rendu_3d: "R3D",
  realistic_sketchup: "RSK",
  plan_architectural: "PLN",
  fiche_employe: "FEM",
  code_qr: "QR",
  formulaire_personnalise: "FRM",
  historique_connexion: "LOG",
  calendrier_feries: "JNT",
  organigramme_entreprise: "ORG",
  demandes_conges: "DCG",
  bilans_sante: "SAN",
  gestion_materiel: "MAT",
  arrivages_materiel: "ARM",
  incidents_chantier: "INC",
  archives_chantiers: "ARC",
  lettre_licenciement: "LIC",
  demandes_paiement: "DPM",
  recu_employe: "REM",
  version_nuit: "VNT",
};

const colonnesRechercheParOutil: Record<OutilType, string[]> = {
  facture: ["nom_fichier", "numero", "client"],
  devis: ["nom_fichier", "numero", "client"],
  devis_estimatif: ["nom_fichier", "numero", "client", "projet"],
  recu: ["nom_fichier", "numero", "client"],
  contrat_construction: ["nom_fichier", "numero", "client"],
  contrat_fournisseur: ["nom_fichier", "numero", "client"],
  contrat_employe: ["nom_fichier", "numero", "employe"],
  description_projet: ["nom_fichier", "numero", "projet"],
  communiquer: ["nom_fichier", "numero", "titre"],
  certificat: ["nom_fichier", "numero", "beneficiaire"],
  carte_service: ["nom_fichier", "numero", "nom_complet", "matricule"],
  rendu_3d: ["nom_fichier", "numero", "titre"],
  realistic_sketchup: ["nom_fichier", "numero", "titre"],
  plan_architectural: ["nom_fichier", "numero", "titre"],
  fiche_employe: ["nom_fichier", "numero", "titre", "type_fiche"],
  code_qr: ["nom_fichier", "numero", "employe_nom", "matricule"],
  formulaire_personnalise: ["titre", "description", "url_publique"],
  historique_connexion: ["nom_utilisateur", "role", "matricule"],
  calendrier_feries: ["titre", "description", "type_jour"],
  organigramme_entreprise: ["titre", "description"],
  demandes_conges: ["employe_nom", "raison", "statut"],
  bilans_sante: ["employe_nom", "etat_global", "groupe_sanguin", "allergies", "details_blessure"],
  gestion_materiel: ["chef_chantier_nom", "chantier_nom", "notes", "statut"],
  arrivages_materiel: ["chef_chantier_nom", "chantier_nom", "nom_materiel", "entreprise_partenaire", "informations_supplementaires", "statut"],
  incidents_chantier: ["chef_chantier_nom", "chantier_nom", "type_evenement", "explication", "statut"],
  archives_chantiers: ["nom_chantier", "nom_client", "adresse_projet", "nom_fichier"],
  lettre_licenciement: ["nom_fichier", "numero", "employe"],
  demandes_paiement: ["employe_nom", "matricule", "chantier_nom", "note", "statut"],
  recu_employe: ["nom_fichier", "numero", "employe_nom", "matricule", "chantier_nom", "motif"],
  version_nuit: ["nom_fichier", "numero", "titre"],
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

const colonnesListeParOutil: Partial<Record<OutilType, string>> = {
  facture: "id,numero,nom_fichier,client,montant_total,date_document,created_at",
  devis: "id,numero,nom_fichier,client,montant_total,date_document,created_at",
  devis_estimatif: "id,numero,nom_fichier,client,projet,montant_total,date_document,created_at",
  recu: "id,numero,nom_fichier,client,montant_total,date_document,created_at",
  contrat_construction: "id,numero,nom_fichier,client,date_document,created_at",
  contrat_fournisseur: "id,numero,nom_fichier,client,date_document,created_at",
  contrat_employe: "id,numero,nom_fichier,employe,date_document,created_at",
  description_projet: "id,numero,nom_fichier,projet,date_document,created_at",
  communiquer: "id,numero,nom_fichier,titre,date_document,created_at",
  certificat: "id,numero,nom_fichier,beneficiaire,date_document,created_at",
  carte_service: "id,numero,nom_fichier,nom_complet,matricule,date_document,created_at",
  rendu_3d: "id,numero,nom_fichier,titre,date_document,created_at",
  realistic_sketchup: "id,numero,nom_fichier,titre,date_document,created_at",
  plan_architectural: "id,numero,nom_fichier,titre,date_document,created_at",
  fiche_employe: "id,numero,nom_fichier,titre,type_fiche,date_document,created_at,updated_at",
  code_qr: "id,numero,nom_fichier,employe_nom,matricule,date_document,created_at,url_publique",
  formulaire_personnalise: "id,titre,description,url_publique,publie,created_at,updated_at",
  historique_connexion: "id,role,nom_utilisateur,matricule,type_connexion,connected_at,created_at",
  calendrier_feries: "id,date_jour,titre,description,type_jour,actif,created_at,updated_at",
  organigramme_entreprise: "id,titre,description,actif,created_at,updated_at",
  demandes_conges: "id,employe_nom,raison,statut,image_url,created_at,updated_at",
  bilans_sante: "id,employe_nom,semaine,etat_global,groupe_sanguin,allergies,blessure,created_at,updated_at",
  gestion_materiel: "id,chef_chantier_nom,chantier_nom,semaine,statut,notes,created_at,updated_at",
  arrivages_materiel: "id,chef_chantier_nom,chantier_nom,date_livraison,nom_materiel,quantite,entreprise_partenaire,prix_total,statut,created_at,updated_at",
  incidents_chantier: "id,chef_chantier_nom,chantier_nom,type_evenement,date_evenement,statut,created_at,updated_at",
  archives_chantiers: "id,nom_chantier,nom_client,adresse_projet,nom_fichier,created_at,updated_at",
  lettre_licenciement: "id,numero,nom_fichier,employe,date_document,created_at",
  demandes_paiement: "id,employe_id,employe_nom,matricule,poste,chantier_id,chantier_nom,montant,note,statut,date_traitement,reponse_admin,created_at,updated_at",
  recu_employe: "id,numero,nom_fichier,employe_id,employe_nom,matricule,chantier_id,chantier_nom,montant,motif,statut,date_envoi,date_confirmation,created_at,updated_at",
  version_nuit: "id,numero,nom_fichier,titre,date_document,created_at",
};

function colonnesLegeresPourOutil(type: OutilType) {
  return colonnesListeParOutil[type] ?? "id,numero,nom_fichier,date_document,created_at";
}

export async function listerDocuments(type: OutilType, recherche = "") {
  const table = tablesParOutil[type];
  let requete = db.from(table).select(colonnesLegeresPourOutil(type)).order("created_at", { ascending: false }).limit(200);
  if (recherche.trim()) {
    const terme = `%${recherche.trim()}%`;
    requete = requete.or(colonnesRechercheParOutil[type].map((colonne) => `${colonne}.ilike.${terme}`).join(","));
  }
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return (data ?? []) as DocumentRecord[];
}

export async function chargerDocumentComplet(type: OutilType, id: string) {
  const table = tablesParOutil[type];
  const { data, error } = await db.from(table).select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data as DocumentRecord;
}

export async function listerDocumentsRecents() {
  const resultats = await Promise.all(
    (Object.keys(tablesParOutil) as OutilType[]).map(async (type) => {
      const { data } = await db.from(tablesParOutil[type]).select(colonnesLegeresPourOutil(type)).order("created_at", { ascending: false }).limit(4);
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
  // Priorité au nom métier (client / employé / projet / bénéficiaire / titre / objet) — le titre d'outil ne sert qu'en dernier recours.
  const sourceNom =
    payload.client ||
    payload.nomClient ||
    payload.employe ||
    payload.beneficiaire ||
    payload.projet ||
    payload.nomProjet ||
    payload.titre ||
    payload.objet ||
    payload.titreCourt ||
    "document";
  const nomFichier = `${documentNumero}-${String(sourceNom).replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.pdf`;
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
      ? { montant_total: Number(payload.totalFinal || payload.total || payload.montant || payload.budget || 0) }
      : {}),
    ...(type === "facture" || type === "devis" || type === "recu" || type === "contrat_construction" ? { client: String(payload.client || payload.nomClient || "") } : {}),
    ...(type === "contrat_employe" || type === "lettre_licenciement" ? { employe: String(payload.employe || "") } : {}),
    ...(type === "description_projet" ? { projet: String(payload.projet || payload.nomProjet || "") } : {}),
    ...(type === "communiquer" ? { titre: String(payload.titre || payload.objet || "") } : {}),
    ...(type === "certificat" ? { beneficiaire: String(payload.beneficiaire || "") } : {}),
  };
  const requete = id ? db.from(table).update(ligne).eq("id", id).select().single() : db.from(table).insert(ligne).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as DocumentRecord;
}

export async function enregistrerCarteService(payload: Record<string, unknown>, pdfBase64: string, numero?: string, id?: string) {
  const documentNumero = numero || (await genererNumero("carte_service"));
  const nomFichier = `${documentNumero}-${String(payload.nomComplet || "carte-service").replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.pdf`;
  const ligne = {
    numero: documentNumero,
    nom_fichier: nomFichier,
    nom_complet: String(payload.nomComplet || ""),
    matricule: String(payload.matricule || ""),
    donnees_formulaire: payload,
    pdf_base64: pdfBase64,
    image_base64: "",
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

export async function enregistrerVersionNuit(payload: Record<string, unknown>, imageBase64: string, numero?: string, id?: string) {
  const documentNumero = numero || (await genererNumero("version_nuit"));
  const nomFichier = `${documentNumero}-${String(payload.titre || "version-nuit").replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.png`;
  const ligne = {
    numero: documentNumero,
    nom_fichier: nomFichier,
    titre: String(payload.titre || "Version nuit"),
    donnees_formulaire: payload,
    image_base64: imageBase64,
    date_document: String(payload.date || new Date().toISOString().slice(0, 10)),
  };
  const requete = id ? db.from("versions_nuit").update(ligne).eq("id", id).select().single() : db.from("versions_nuit").insert(ligne).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as DocumentRecord;
}

export async function enregistrerPlanArchitectural(payload: Record<string, unknown>, imageBase64: string, numero?: string, id?: string) {
  const documentNumero = numero || (await genererNumero("plan_architectural"));
  const nomFichier = `${documentNumero}-${String(payload.titre || "plan-architectural").replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.png`;
  const ligne = {
    numero: documentNumero,
    nom_fichier: nomFichier,
    titre: String(payload.titre || "Plan architectural"),
    donnees_formulaire: payload,
    image_base64: imageBase64,
    date_document: String(payload.date || new Date().toISOString().slice(0, 10)),
  };
  const requete = id ? db.from("plans_architecturaux").update(ligne).eq("id", id).select().single() : db.from("plans_architecturaux").insert(ligne).select().single();
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

export async function modifierFormulairePersonnalise(id: string, titre: string, description: string, champs: ChampPersonnalise[]) {
  const { data, error } = await db.from("formulaires_personnalises").update({ titre, description, champs, publie: true }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data as FormulairePersonnalise;
}

export async function supprimerFormulairePersonnalise(id: string) {
  const { error } = await db.from("formulaires_personnalises").delete().eq("id", id);
  if (error) throw new Error(error.message);
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

export async function listerConnexionsScm(dateJour: string) {
  const debut = `${dateJour}T00:00:00.000Z`;
  const fin = `${dateJour}T23:59:59.999Z`;
  const { data, error } = await db.from("connexions_scm").select("*").gte("connected_at", debut).lte("connected_at", fin).order("connected_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ConnexionScm[];
}

export async function listerJoursNonTravailles() {
  const { data, error } = await db.from("jours_non_travailles").select("*").order("date_jour", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as JourNonTravaille[];
}

export async function enregistrerJourNonTravaille(payload: Pick<JourNonTravaille, "date_jour" | "titre" | "description" | "type_jour" | "actif">, id?: string) {
  const requete = id ? db.from("jours_non_travailles").update(payload).eq("id", id).select().single() : db.from("jours_non_travailles").insert(payload).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as JourNonTravaille;
}

export async function supprimerJourNonTravaille(id: string) {
  const { error } = await db.from("jours_non_travailles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function televerserImageOrganigramme(fichier: File) {
  const extension = fichier.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const chemin = `organigrammes/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("scm-images").upload(chemin, fichier, { cacheControl: "3600", contentType: fichier.type || "image/png", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("scm-images").getPublicUrl(chemin).data.publicUrl;
}

export async function listerOrganigrammesEntreprise() {
  const { data, error } = await db.from("organigrammes_entreprise").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrganigrammeEntreprise[];
}

export async function enregistrerOrganigrammeEntreprise(payload: Pick<OrganigrammeEntreprise, "titre" | "description" | "blocs" | "actif">, id?: string) {
  const requete = id ? db.from("organigrammes_entreprise").update(payload).eq("id", id).select().single() : db.from("organigrammes_entreprise").insert(payload).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as OrganigrammeEntreprise;
}

export async function supprimerOrganigrammeEntreprise(id: string) {
  const { error } = await db.from("organigrammes_entreprise").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function televerserImageDemandeConge(fichier: File) {
  const extension = fichier.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const chemin = `demandes-conges/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("scm-images").upload(chemin, fichier, { cacheControl: "3600", contentType: fichier.type || "image/png", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("scm-images").getPublicUrl(chemin).data.publicUrl;
}

export async function listerDemandesConges() {
  const { data, error } = await db.from("demandes_conges").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DemandeConge[];
}

export async function listerBilansSanteEmployes() {
  const { data, error } = await db.from("bilans_sante_employes").select("*").order("semaine", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BilanSanteEmploye[];
}

export async function listerRapportsMateriel() {
  const { data, error } = await db.from("rapports_materiel").select("*").order("semaine", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RapportMateriel[];
}

export async function listerArrivagesMateriel() {
  const { data, error } = await db.from("arrivages_materiel").select("*").order("date_livraison", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ArrivageMateriel[];
}

export async function televerserPreuveArrivageMateriel(fichier: File) {
  const extension = fichier.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const chemin = `arrivages-materiel/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("scm-images").upload(chemin, fichier, { cacheControl: "3600", contentType: fichier.type || "image/png", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("scm-images").getPublicUrl(chemin).data.publicUrl;
}

export async function televerserImageIncidentChantier(fichier: File) {
  const extension = fichier.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const chemin = `incidents-chantiers/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("scm-images").upload(chemin, fichier, { cacheControl: "3600", contentType: fichier.type || "image/png", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("scm-images").getPublicUrl(chemin).data.publicUrl;
}

export async function listerIncidentsChantier() {
  const { data, error } = await db.from("incidents_chantier").select("*").order("date_evenement", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as IncidentChantier[];
}

export async function listerArchivesChantiers() {
  const { data, error } = await db.from("archives_chantiers").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ArchiveChantier[];
}

export async function televerserImageArchiveChantier(fichier: File) {
  const extension = fichier.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const chemin = `archives-chantiers/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("scm-images").upload(chemin, fichier, { cacheControl: "3600", contentType: fichier.type || "image/png", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("scm-images").getPublicUrl(chemin).data.publicUrl;
}

export async function enregistrerArchiveChantier(payload: Omit<ArchiveChantier, "id" | "created_at" | "updated_at">, id?: string) {
  const requete = id ? db.from("archives_chantiers").update(payload).eq("id", id).select().single() : db.from("archives_chantiers").insert(payload).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as ArchiveChantier;
}

export async function supprimerDocument(type: OutilType, id: string) {
  const { error } = await db.from(tablesParOutil[type]).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

async function imageVersBase64(url: string) {
  try {
    const reponse = await fetch(url);
    if (!reponse.ok) return "";
    const blob = await reponse.blob();
    return await new Promise<string>((resolve, reject) => {
      const lecteur = new FileReader();
      lecteur.onload = () => resolve(String(lecteur.result));
      lecteur.onerror = reject;
      lecteur.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

async function compresserPhotoEmploye(source: string | undefined | null, taille = 96, qualite = 0.7): Promise<string> {
  if (!source) return "";
  try {
    let dataUrl = String(source);
    if (!dataUrl.startsWith("data:")) {
      dataUrl = await imageVersBase64(dataUrl);
      if (!dataUrl) return "";
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = dataUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = taille;
    canvas.height = taille;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, taille, taille);
    // cover crop
    const ratio = Math.max(taille / image.width, taille / image.height);
    const w = image.width * ratio;
    const h = image.height * ratio;
    ctx.drawImage(image, (taille - w) / 2, (taille - h) / 2, w, h);
    return canvas.toDataURL("image/jpeg", qualite);
  } catch {
    return "";
  }
}

async function drapeauRdcVersPng() {
  try {
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
    if (!contexte) { URL.revokeObjectURL(url); return ""; }
    contexte.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
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
  const y = 252;
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
  const y = 246;
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
  // Bandeau supérieur décoratif
  pdf.setFillColor(3, 76, 120); pdf.triangle(0, 0, 0, 42, 105, 0, "F"); pdf.triangle(210, 0, 210, 42, 105, 0, "F");
  pdf.setFillColor(246, 181, 73); pdf.triangle(0, 0, 0, 15, 91, 41, "F"); pdf.triangle(210, 0, 210, 15, 119, 41, "F");
  pdf.setFillColor(31, 126, 161); pdf.triangle(0, 38, 0, 63, 93, 51, "F"); pdf.triangle(210, 38, 210, 63, 117, 51, "F");
  // Cadre principal
  pdf.setDrawColor(246, 181, 73); pdf.setLineWidth(1.3); pdf.rect(16, 70, 178, 201);
  pdf.setLineWidth(0.45); pdf.rect(20, 74, 170, 193);

  // Titre du certificat dans le bandeau
  pdf.setFont("times", "bold"); pdf.setTextColor(255, 255, 255); pdf.setFontSize(26);
  pdf.text((titre || "CERTIFICAT").toUpperCase(), 105, 18, { align: "center" });
  pdf.setFontSize(12);
  pdf.text((sousTitre || "DE RECONNAISSANCE").toUpperCase(), 105, 27, { align: "center" });

  // Logo personnalisé en haut, centré, mis en valeur sur fond blanc
  const aLogo = !!(logoCertificat && logoCertificat !== "—");
  if (aLogo) {
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(86, 44, 38, 38, 4, 4, "F");
    pdf.setDrawColor(246, 181, 73); pdf.setLineWidth(0.6);
    pdf.roundedRect(86, 44, 38, 38, 4, 4, "S");
    ajouterImageSiValide(pdf, logoCertificat, 89, 47, 32, 32);
  }

  // Texte d'introduction
  pdf.setTextColor(42, 48, 63); pdf.setFont("helvetica", "normal"); pdf.setFontSize(9.5);
  pdf.text("CE CERTIFICAT EST FIÈREMENT PRÉSENTÉ À :", 105, 100, { align: "center" });

  // Nom du bénéficiaire
  pdf.setFont("times", "italic"); pdf.setFontSize(30); pdf.setTextColor(18, 38, 58);
  pdf.text(beneficiaire || "Nom du bénéficiaire", 105, 128, { align: "center" });
  pdf.setDrawColor(130, 137, 150); pdf.line(52, 134, 158, 134);

  // Texte du certificat
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(10.5); pdf.setTextColor(52, 61, 78);
  pdf.text(pdf.splitTextToSize(texte || "Pour attester officiellement de cette distinction.", 140), 105, 152, { align: "center" });

  // Bloc Sceau central + signatures latérales
  // Sceau au centre, au-dessus de la ligne de signature
  ajouterImageSiValide(pdf, options.sceau, 89, 200, 32, 32);

  // Lignes de signature gauche et droite
  pdf.setDrawColor(80, 88, 105); pdf.setLineWidth(0.4);
  pdf.line(34, 240, 84, 240);
  pdf.line(126, 240, 176, 240);

  // Images de signature
  ajouterImageSiValide(pdf, signatureGauche && signatureGauche !== "—" ? signatureGauche : undefined, 38, 220, 42, 18);
  ajouterImageSiValide(pdf, options.signature, 130, 220, 42, 18);

  // Libellés sous les signatures
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(32, 40, 58);
  pdf.text(options.libelleSignature || "SIGNATURE", 59, 246, { align: "center" });
  pdf.text(options.libelleSceau || "DIRECTION", 151, 246, { align: "center" });

  // Date sous le sceau
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5); pdf.setTextColor(80, 88, 105);
  pdf.text(`Délivré le ${date || new Date().toLocaleDateString("fr-FR")}`, 105, 246, { align: "center" });

  // Numéro du certificat en pied
  pdf.setFontSize(8); pdf.setTextColor(95, 103, 118);
  pdf.text(`N° ${numero}`, 105, 263, { align: "center" });
}

function ajouterEnteteFicheEmploye(pdf: jsPDF, logo: string, drapeauRdc: string, titre: string, numero: string, couleur: [number, number, number]) {
  pdf.setFillColor(247, 249, 252);
  pdf.rect(0, 0, 210, 297, "F");
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(12, 12, 186, 273, 3, 3, "F");
  if (logo) { try { pdf.addImage(logo, "JPEG", 18, 16, 54, 29, undefined, "FAST"); } catch { /* ignore */ } }
  if (drapeauRdc) { try { pdf.addImage(drapeauRdc, "PNG", 166, 17, 24, 18, undefined, "FAST"); } catch { /* ignore */ } }
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
    // Mise en page : 6 employés par page (3 lignes × 2 colonnes), nombre de pages illimité
    const carteLargeur = 84;
    const carteHauteur = 58;
    const margeX = 18;
    const espaceX = 6;
    const debutY = 80;
    const espaceY = 6;
    // Précharger toutes les photos compressées en parallèle (≈96px JPEG, qualité 0.7)
    // pour permettre la génération de PDF avec un nombre illimité d'employés (dizaines de pages)
    // sans saturer la mémoire ni dépasser les limites de payload de la base de données.
    const photosCompressees = await Promise.all(
      employes.map((employe) => compresserPhotoEmploye(employe.photo_profil, 96, 0.7).catch(() => ""))
    );
    employes.forEach((employe, index) => {
      const indexPage = index % 6;
      if (indexPage === 0 && index > 0) {
        pdf.addPage();
        ajouterEnteteFicheEmploye(pdf, logo, drapeauRdc, "Fiche collective des employés", numero, couleurs.principal);
      }
      const colonne = indexPage % 2;
      const ligne = Math.floor(indexPage / 2);
      const x = margeX + colonne * (carteLargeur + espaceX);
      const y = debutY + ligne * (carteHauteur + espaceY);
      // Carte de l'employé
      pdf.setFillColor(...couleurs.doux);
      pdf.roundedRect(x, y, carteLargeur, carteHauteur, 3, 3, "F");
      pdf.setDrawColor(...couleurs.principal);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(x, y, carteLargeur, carteHauteur, 3, 3, "S");
      // Bandeau numéro
      pdf.setFillColor(...couleurs.principal);
      pdf.roundedRect(x, y, carteLargeur, 7, 3, 3, "F");
      pdf.rect(x, y + 4, carteLargeur, 3, "F");
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(255, 255, 255);
      pdf.text(`Employé n° ${index + 1}`, x + 3, y + 5);
      // Photo (compressée)
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(x + 4, y + 11, 22, 22, 2, 2, "F");
      ajouterImageSiValide(pdf, photosCompressees[index], x + 4, y + 11, 22, 22);
      // Nom
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(9.5); pdf.setTextColor(...couleurs.principal);
      const nomLignes = pdf.splitTextToSize(employe.nom_complet || "—", 52);
      pdf.text(nomLignes.slice(0, 2), x + 30, y + 16);
      // Infos
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(45, 55, 72);
      pdf.text(`Matricule : ${employe.matricule || "—"}`, x + 30, y + 27);
      pdf.text(`Genre : ${employe.genre || "—"}`, x + 30, y + 32);
      pdf.text(`Tél : ${employe.telephone || "—"}`, x + 4, y + 41);
      pdf.text(`Poste : ${employe.poste || "—"}`, x + 4, y + 47);
      pdf.text(pdf.splitTextToSize(`Email : ${employe.email || "—"}`, carteLargeur - 8), x + 4, y + 53);
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

export async function creerPdfArchiveChantier(archive: Omit<ArchiveChantier, "id" | "created_at" | "updated_at" | "pdf_base64" | "nom_fichier">) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const couleurs = couleursPdfParOutil.archives_chantiers;
  const logo = await imageVersBase64(logoUrl);
  const drapeauRdc = await drapeauRdcVersPng();
  ajouterEnteteFicheEmploye(pdf, logo, drapeauRdc, "Fiche archive chantier", `ARC-${Date.now().toString().slice(-6)}`, couleurs.principal);
  let y = 84;
  [["Nom du chantier", archive.nom_chantier], ["Nom du client", archive.nom_client], ["Adresse du projet", archive.adresse_projet], ["Début construction", archive.date_debut_construction || "—"], ["Finalisation construction", archive.date_finalisation_construction || "—"], ["Budget estimé au début", `${formaterMontant(Number(archive.budget_estime_debut || 0))} $`], ["Budget final", `${formaterMontant(Number(archive.budget_final || 0))} $`]].forEach(([label, valeur]) => { y = texteValeur(pdf, label, String(valeur), 20, y, 168, 4.2, couleurs.principal); });
  y += 4; pdf.setFillColor(...couleurs.doux); pdf.rect(20, y - 5, 168, 8, "F"); pdf.setFont("helvetica", "bold"); pdf.setTextColor(...couleurs.principal); pdf.text("EMPLOYÉS AYANT PARTICIPÉ", 23, y); y += 10;
  pdf.setFont("helvetica", "normal"); pdf.setTextColor(36, 45, 64);
  archive.employes_participants.forEach((employe, index) => { if (y > 234) { pdf.addPage(); ajouterEnteteFicheEmploye(pdf, logo, drapeauRdc, "Fiche archive chantier", "ARCHIVE", couleurs.principal); y = 84; } pdf.text(`${index + 1}. ${employe.nom_complet || "—"} — ${employe.poste || employe.matricule || "—"}`, 24, y); y += 6; });
  if (archive.images_chantier?.length) {
    pdf.addPage(); ajouterEnteteFicheEmploye(pdf, logo, drapeauRdc, "Images du chantier", "ARCHIVE", couleurs.principal);
    const imagesBase64 = await Promise.all(archive.images_chantier.slice(0, 6).map((image) => imageVersBase64(image).catch(() => "")));
    imagesBase64.filter(Boolean).forEach((image, index) => ajouterImageSiValide(pdf, image, index % 2 === 0 ? 20 : 108, 84 + Math.floor(index / 2) * 58, 80, 48));
  }
  piedDePage(pdf, couleurs.principal, undefined, undefined, "SCM SARL", "Archive chantier");
  return pdf.output("datauristring");
}

function creerPdfLettreLicenciement(pdf: jsPDF, logo: string, drapeauRdc: string, numero: string, champs: Array<[string, string]>, couleurs: { principal: [number, number, number]; secondaire: [number, number, number]; doux: [number, number, number] }, options: { sceau?: string; signature?: string; libelleSceau?: string; libelleSignature?: string }) {
  const employe = valeurChamp(champs, "Nom de l’employé");
  const poste = valeurChamp(champs, "Poste occupé");
  const matricule = valeurChamp(champs, "Matricule");
  const dateEffet = valeurChamp(champs, "Date d’effet du licenciement");
  const dateLettre = valeurChamp(champs, "Date de la lettre");
  const motif = valeurChamp(champs, "Motif du licenciement");
  const detailsFaits = valeurChamp(champs, "Détails et faits reprochés");
  const preavis = valeurChamp(champs, "Préavis et indemnités");
  const obligationsSortie = valeurChamp(champs, "Obligations de sortie");
  const lieu = valeurChamp(champs, "Lieu de signature");
  const signataireNom = valeurChamp(champs, "Nom du signataire");
  const signataireFonction = valeurChamp(champs, "Fonction du signataire");

  // Fond crème élégant
  pdf.setFillColor(252, 250, 246);
  pdf.rect(0, 0, 210, 297, "F");

  // Bande latérale décorative gauche
  pdf.setFillColor(...couleurs.principal);
  pdf.rect(0, 0, 6, 297, "F");
  pdf.setFillColor(...couleurs.secondaire);
  pdf.rect(6, 0, 1.5, 297, "F");

  // Carte intérieure blanche
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(14, 14, 184, 269, 2, 2, "F");
  pdf.setDrawColor(...couleurs.principal);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(14, 14, 184, 269, 2, 2, "S");

  // En-tête : logo + drapeau + identité
  if (logo) { try { pdf.addImage(logo, "JPEG", 20, 20, 36, 22, undefined, "FAST"); } catch { /* ignore */ } }
  if (drapeauRdc) { try { pdf.addImage(drapeauRdc, "PNG", 170, 20, 22, 16, undefined, "FAST"); } catch { /* ignore */ } }

  pdf.setTextColor(...couleurs.principal);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("SCM SARL", 60, 26);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(85, 92, 110);
  pdf.text("Société de Construction et Matériaux", 60, 31);
  pdf.text("République Démocratique du Congo", 60, 35);
  pdf.text("Direction des Ressources Humaines", 60, 39);

  // Filet doré sous l'en-tête
  pdf.setDrawColor(...couleurs.secondaire);
  pdf.setLineWidth(0.6);
  pdf.line(20, 46, 192, 46);
  pdf.setLineWidth(0.2);
  pdf.line(20, 47.5, 192, 47.5);

  // Titre principal centré
  pdf.setFont("times", "bold");
  pdf.setTextColor(...couleurs.principal);
  pdf.setFontSize(20);
  pdf.text("LETTRE DE LICENCIEMENT", 105, 60, { align: "center" });
  pdf.setFont("times", "italic");
  pdf.setFontSize(9);
  pdf.setTextColor(120, 100, 80);
  pdf.text(`Référence : ${numero}`, 105, 66, { align: "center" });

  // Bloc destinataire
  pdf.setFillColor(...couleurs.doux);
  pdf.roundedRect(110, 73, 82, 28, 1.5, 1.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("DESTINATAIRE", 114, 79);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(40, 45, 60);
  pdf.text(pdf.splitTextToSize(employe, 76), 114, 85);
  pdf.setFontSize(8);
  pdf.setTextColor(85, 92, 110);
  pdf.text(`Poste : ${poste}`, 114, 92);
  pdf.text(`Matricule : ${matricule}`, 114, 97);

  // Lieu et date
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(40, 45, 60);
  pdf.text(`Fait à ${lieu}, le ${dateLettre}`, 20, 80);

  // Objet
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("Objet :", 20, 110);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(40, 45, 60);
  pdf.text("Notification de rupture du contrat de travail", 36, 110);

  // Corps formel
  let y = 122;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(40, 45, 60);

  const introduction = `Madame, Monsieur ${employe},`;
  pdf.text(introduction, 20, y);
  y += 8;

  const corps = `Suite à notre analyse approfondie de votre situation professionnelle et après examen attentif des éléments constitutifs de votre dossier, nous sommes au regret de vous notifier, par la présente, votre licenciement de la société SCM SARL, prenant effet à compter du ${dateEffet}.`;
  const lignesCorps = pdf.splitTextToSize(corps, 168);
  pdf.text(lignesCorps, 20, y);
  y += lignesCorps.length * 5 + 4;

  // Section motif (encadré)
  pdf.setFillColor(...couleurs.doux);
  pdf.roundedRect(20, y - 4, 168, 7, 1, 1, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("MOTIF DU LICENCIEMENT", 23, y + 1);
  y += 10;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(40, 45, 60);
  const motifLignes = pdf.splitTextToSize(motif, 168);
  pdf.text(motifLignes, 20, y);
  y += motifLignes.length * 5 + 4;

  if (detailsFaits && detailsFaits !== "—") {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...couleurs.principal);
    pdf.text("Faits reprochés et circonstances :", 20, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(50, 55, 70);
    const detailsLignes = pdf.splitTextToSize(detailsFaits, 168);
    pdf.text(detailsLignes, 20, y);
    y += detailsLignes.length * 4.6 + 4;
  }

  if (preavis && preavis !== "—") {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...couleurs.principal);
    pdf.text("Préavis et indemnités :", 20, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(50, 55, 70);
    const preavisLignes = pdf.splitTextToSize(preavis, 168);
    pdf.text(preavisLignes, 20, y);
    y += preavisLignes.length * 4.6 + 4;
  }

  if (obligationsSortie && obligationsSortie !== "—") {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...couleurs.principal);
    pdf.text("Obligations de sortie :", 20, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(50, 55, 70);
    const oblLignes = pdf.splitTextToSize(obligationsSortie, 168);
    pdf.text(oblLignes, 20, y);
    y += oblLignes.length * 4.6 + 4;
  }

  // Formule de politesse
  if (y < 215) {
    y = Math.max(y + 2, 215);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9.5);
    pdf.setTextColor(60, 65, 80);
    const politesse = "Nous vous prions d’agréer, Madame, Monsieur, l’expression de nos salutations distinguées.";
    pdf.text(pdf.splitTextToSize(politesse, 168), 20, y);
  }

  // Bloc signature en bas — sceau de l'entreprise + signature de l'employé licencié
  const ySign = 240;
  pdf.setDrawColor(...couleurs.secondaire);
  pdf.setLineWidth(0.4);
  pdf.line(20, ySign - 4, 192, ySign - 4);

  // Colonne gauche : Sceau de l'entreprise
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("SCEAU & SIGNATURE DE L’ENTREPRISE", 22, ySign);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(95, 100, 115);
  pdf.text(signataireNom || options.libelleSceau || "Direction SCM SARL", 22, ySign + 4);
  if (signataireFonction && signataireFonction !== "—") pdf.text(signataireFonction, 22, ySign + 8);
  if (options.sceau) pdf.addImage(options.sceau, formatImage(options.sceau), 24, ySign + 11, 50, 26, undefined, "FAST");

  // Colonne droite : Signature de l'employé licencié
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("SIGNATURE DE L’EMPLOYÉ LICENCIÉ", 115, ySign);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(95, 100, 115);
  pdf.text("« Lu et approuvé »", 115, ySign + 4);
  pdf.text(employe, 115, ySign + 8);
  if (options.signature) pdf.addImage(options.signature, formatImage(options.signature), 117, ySign + 11, 50, 26, undefined, "FAST");

  // Pied de page institutionnel
  pdf.setDrawColor(...couleurs.principal);
  pdf.setLineWidth(0.2);
  pdf.line(20, 275, 192, 275);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(7);
  pdf.setTextColor(120, 125, 140);
  pdf.text("SCM SARL — Document confidentiel — Conforme au Code du travail de la République Démocratique du Congo", 105, 280, { align: "center" });
}

export async function creerPdf(type: OutilType, titre: string, numero: string, champs: Array<[string, string]>, options: { sceau?: string; signature?: string; libelleSceau?: string; libelleSignature?: string; lignes?: LignePrestation[]; deductions?: LigneDeduction[]; total?: number; totalAvantDeduction?: number }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const couleurs = couleursPdfParOutil[type];
  const logo = await imageVersBase64(logoUrl);
  const drapeauRdc = await drapeauRdcVersPng();

  if (type === "certificat") {
    creerPdfCertificat(pdf, champs, numero, options);
    return pdf.output("datauristring");
  }

  if (type === "lettre_licenciement") {
    creerPdfLettreLicenciement(pdf, logo, drapeauRdc, numero, champs, couleurs, options);
    return pdf.output("datauristring");
  }

  // En-tête réutilisable (pour la 1ère page et les suivantes)
  const dessinerEnTete = (numeroPage: number) => {
    pdf.setFillColor(247, 249, 252);
    pdf.rect(0, 0, 210, 297, "F");
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(12, 12, 186, 273, 3, 3, "F");
    if (logo) { try { pdf.addImage(logo, "JPEG", 18, 16, 54, 29, undefined, "FAST"); } catch { /* ignore */ } }
    if (drapeauRdc) { try { pdf.addImage(drapeauRdc, "PNG", 166, 17, 24, 18, undefined, "FAST"); } catch { /* ignore */ } }
    pdf.setTextColor(...couleurs.principal);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(19);
    pdf.text(titre.toUpperCase(), 18, 58);
    pdf.setFontSize(10);
    pdf.text(`N° ${numero}${numeroPage > 1 ? ` — Page ${numeroPage}` : ""}`, 18, 65);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 158, 65);
    pdf.setDrawColor(...couleurs.secondaire);
    pdf.setLineWidth(0.7);
    pdf.line(18, 70, 192, 70);
  };

  dessinerEnTete(1);

  if (type === "description_projet") {
    creerPdfDescriptionProjet(pdf, champs, couleurs.principal, couleurs.doux, options);
    return pdf.output("datauristring");
  }

  // Limites verticales de la zone de contenu (le pied de page est repoussé pour exploiter au mieux l'espace)
  const Y_DEBUT = 82;
  const Y_LIMITE = type === "communiquer" ? 234 : 240;
  let pageCourante = 1;

  // Helper : crée une nouvelle page avec en-tête et retourne le y de départ
  const passerPageSuivante = () => {
    pdf.addPage();
    pageCourante += 1;
    dessinerEnTete(pageCourante);
    return Y_DEBUT;
  };

  // Helper : rendu d'un champ label/valeur dans une colonne donnée, avec pagination
  const rendreChampColonne = (label: string, valeur: string, x: number, y: number, largeur: number) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...couleurs.principal);
    const labelLignes = pdf.splitTextToSize(label, largeur);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    const valeurLignes = pdf.splitTextToSize(valeur || "—", largeur);
    const hauteurTotale = labelLignes.length * 4.5 + 2 + valeurLignes.length * 4.8 + 4;
    // Si pas la place pour ce bloc → nouvelle page
    if (y + hauteurTotale > Y_LIMITE) {
      y = passerPageSuivante();
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...couleurs.principal);
    pdf.text(labelLignes, x, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(36, 45, 64);
    pdf.text(valeurLignes, x, y + labelLignes.length * 4.5 + 2);
    return y + hauteurTotale;
  };

  // Disposition en 2 colonnes des champs label/valeur
  const COL_GAUCHE_X = 20;
  const COL_DROITE_X = 110;
  const COL_LARGEUR = 78;
  let yGauche = Y_DEBUT;
  let yDroite = Y_DEBUT;
  let pageGauche = 1;
  let pageDroite = 1;

  champs.forEach(([label, valeur], index) => {
    const enGauche = index % 2 === 0;
    if (enGauche) {
      // S'assurer que la colonne gauche est sur la page courante
      if (pageGauche < pageCourante) {
        yGauche = Y_DEBUT;
        pageGauche = pageCourante;
      }
      const yAvant = yGauche;
      yGauche = rendreChampColonne(label, valeur, COL_GAUCHE_X, yGauche, COL_LARGEUR);
      // Si une nouvelle page a été créée pendant le rendu
      if (pageCourante > pageGauche) {
        pageGauche = pageCourante;
        pageDroite = pageCourante;
        yDroite = yGauche; // la droite reprend au même niveau sur la nouvelle page
      }
      // Sinon, conserver l'écart
      void yAvant;
    } else {
      if (pageDroite < pageCourante) {
        yDroite = Y_DEBUT;
        pageDroite = pageCourante;
      }
      yDroite = rendreChampColonne(label, valeur, COL_DROITE_X, yDroite, COL_LARGEUR);
      if (pageCourante > pageDroite) {
        pageDroite = pageCourante;
        pageGauche = pageCourante;
        yGauche = yDroite;
      }
    }
  });

  // y de départ pour la suite (sous la plus basse des deux colonnes, sur la page courante)
  let y = Math.max(
    pageGauche === pageCourante ? yGauche : Y_DEBUT,
    pageDroite === pageCourante ? yDroite : Y_DEBUT,
  ) + 4;

  // Tableau des prestations / achats (devis, facture, recu)
  if (options.lignes?.length) {
    const titreLignes = type === "devis" ? "Achats à faire" : "Prestations";
    const libellePrix = type === "devis" ? "Coût" : "Prix";
    // S'assurer qu'il reste assez de place pour l'en-tête + au moins 2 lignes
    if (y + 24 > Y_LIMITE) y = passerPageSuivante();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...couleurs.principal);
    pdf.text(titreLignes, 20, y);
    y += 8;
    pdf.setFillColor(...couleurs.doux);
    pdf.rect(20, y - 5, 168, 8, "F");
    pdf.setFontSize(9);
    pdf.text("Description", 23, y);
    pdf.text("Qté", 125, y);
    pdf.text(libellePrix, 145, y);
    pdf.text("Total", 168, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    options.lignes.forEach((ligne) => {
      const desc = pdf.splitTextToSize(ligne.description || "—", 92);
      const hauteurLigne = Math.max(8, desc.length * 4.5 + 3);
      if (y + hauteurLigne > Y_LIMITE) {
        y = passerPageSuivante();
        // Réafficher l'en-tête du tableau sur la nouvelle page
        pdf.setFont("helvetica", "bold");
        pdf.setFillColor(...couleurs.doux);
        pdf.rect(20, y - 5, 168, 8, "F");
        pdf.setTextColor(...couleurs.principal);
        pdf.text("Description", 23, y);
        pdf.text("Qté", 125, y);
        pdf.text(libellePrix, 145, y);
        pdf.text("Total", 168, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(36, 45, 64);
        y += 8;
      }
      y += hauteurLigne - 3;
      pdf.text(desc, 23, y);
      pdf.text(String(ligne.quantite), 126, y);
      pdf.text(`${formaterMontant(ligne.prix)} $`, 144, y);
      pdf.text(`${formaterMontant((ligne.quantite * ligne.prix))} $`, 166, y);
      y += 3;
    });
    y += 2;
  }

  // Frais à déduire
  if (options.deductions?.length && typeof options.totalAvantDeduction === "number") {
    const hauteurNecessaire = 8 + options.deductions.length * 7;
    if (y + hauteurNecessaire > Y_LIMITE) y = passerPageSuivante();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...couleurs.principal);
    pdf.text("Frais supplémentaires", 20, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(36, 45, 64);
    options.deductions.forEach((deduction) => {
      y += 7;
      const montant = typeof deduction.montant === "number"
        ? Number(deduction.montant || 0)
        : options.totalAvantDeduction! * Number(deduction.pourcentage || 0) / 100;
      const libelle = deduction.libelle || "Frais";
      const detail = typeof deduction.montant === "number"
        ? libelle
        : `${libelle} (${formaterMontant(Number(deduction.pourcentage || 0))} %)`;
      pdf.text(detail, 23, y);
      pdf.text(`+ ${formaterMontant(montant)} $`, 146, y);
    });
    y += 4;
  }

  // Bloc TOTAL — placé dynamiquement juste après le contenu (pas de position fixe)
  if (type !== "communiquer" && typeof options.total === "number") {
    if (y + 16 > Y_LIMITE) y = passerPageSuivante();
    pdf.setFillColor(...couleurs.principal);
    pdf.roundedRect(124, y, 64, 14, 2, 2, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(`TOTAL : ${formaterMontant(options.total)} $`, 130, y + 9);
    y += 18;
  }

  // Pied de page (sceau + signature) : uniquement sur la dernière page
  type === "communiquer"
    ? piedDePageCommunication(pdf, couleurs.principal, options.sceau, options.libelleSceau)
    : piedDePage(pdf, couleurs.principal, options.sceau, options.signature, options.libelleSceau, options.libelleSignature);
  return pdf.output("datauristring");
}

function dataUrlVersBlob(dataUrl: string, typeParDefaut: string): Blob {
  if (!dataUrl) return new Blob([], { type: typeParDefaut });
  if (!dataUrl.startsWith("data:")) {
    return new Blob([dataUrl], { type: typeParDefaut });
  }
  const [entete, donnees = ""] = dataUrl.split(",");
  const correspondanceType = entete.match(/data:([^;]+)/);
  const typeMime = correspondanceType?.[1] || typeParDefaut;
  const estBase64 = entete.includes(";base64");
  if (!estBase64) {
    return new Blob([decodeURIComponent(donnees)], { type: typeMime });
  }
  const binaire = atob(donnees);
  const buffer = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i += 1) buffer[i] = binaire.charCodeAt(i);
  return new Blob([buffer], { type: typeMime });
}

function nomFichierAvecExtension(nom: string, extension: string): string {
  const propre = (nom || "document").trim().replace(/[\\/:*?"<>|]+/g, "_");
  return propre.toLowerCase().endsWith(`.${extension}`) ? propre : `${propre}.${extension}`;
}

function declencherTelechargementBlob(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nom;
  lien.rel = "noopener";
  lien.style.display = "none";
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function telechargerPdf(base64: string, nom: string) {
  const blob = dataUrlVersBlob(base64, "application/pdf");
  declencherTelechargementBlob(blob, nomFichierAvecExtension(nom, "pdf"));
}

export function voirPdf(base64: string) {
  const blob = dataUrlVersBlob(base64, "application/pdf");
  const url = URL.createObjectURL(blob);
  const fenetre = window.open(url, "_blank", "noopener");
  if (!fenetre) {
    declencherTelechargementBlob(blob, nomFichierAvecExtension("document", "pdf"));
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function telechargerImage(base64: string, nom: string) {
  const correspondanceType = base64.match(/data:([^;]+)/);
  const typeMime = correspondanceType?.[1] || "image/png";
  const extension = typeMime.split("/")[1]?.split("+")[0] || "png";
  const blob = dataUrlVersBlob(base64, typeMime);
  declencherTelechargementBlob(blob, nomFichierAvecExtension(nom, extension));
}

export function voirImage(base64: string) {
  const correspondanceType = base64.match(/data:([^;]+)/);
  const typeMime = correspondanceType?.[1] || "image/png";
  const blob = dataUrlVersBlob(base64, typeMime);
  const url = URL.createObjectURL(blob);
  const fenetre = window.open(url, "_blank", "noopener");
  if (!fenetre) declencherTelechargementBlob(blob, nomFichierAvecExtension("image", typeMime.split("/")[1] || "png"));
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function mockupCarteServiceBase64() {
  return imageVersBase64(carteServiceMockupUrl);
}

type DonneesCarteService = {
  nomComplet: string;
  matricule: string;
  genre: string;
  poste: string;
  telephone: string;
  adresse: string;
  photoProfil: string;
  qrCode: string;
  signatureDirection?: string;
  numero: string;
  dateEmission?: string;
};

function dessinerCarteServiceRecto(pdf: jsPDF, data: DonneesCarteService, logo: string, drapeau: string, x: number, y: number, w: number, h: number) {
  const couleurPrincipale: [number, number, number] = [10, 65, 130];
  const couleurAccent: [number, number, number] = [212, 175, 55];
  const couleurTexte: [number, number, number] = [25, 35, 55];
  const couleurDouce: [number, number, number] = [241, 245, 252];

  // Ombre portée
  pdf.setFillColor(0, 0, 0);
  pdf.setGState(pdf.GState({ opacity: 0.18 }));
  pdf.roundedRect(x + 1.6, y + 2.4, w, h, 4, 4, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(x, y, w, h, 4, 4, "F");

  // Bandeau supérieur dégradé (en bandes)
  const bandeauH = h * 0.26;
  for (let i = 0; i < 30; i += 1) {
    const t = i / 29;
    const r = Math.round(couleurPrincipale[0] + (35 - couleurPrincipale[0]) * t);
    const g = Math.round(couleurPrincipale[1] + (95 - couleurPrincipale[1]) * t);
    const b = Math.round(couleurPrincipale[2] + (175 - couleurPrincipale[2]) * t);
    pdf.setFillColor(r, g, b);
    pdf.rect(x, y + (bandeauH * i) / 30, w, bandeauH / 30 + 0.2, "F");
  }
  pdf.setFillColor(...couleurAccent);
  pdf.rect(x, y + bandeauH, w, 0.9, "F");

  // Logo dans rond blanc (carte de service — logo officiel SCM SARL)
  const logoCx = x + 11;
  const logoCy = y + bandeauH / 2;
  pdf.setFillColor(255, 255, 255);
  pdf.circle(logoCx, logoCy, 8.5, "F");
  pdf.setDrawColor(...couleurAccent);
  pdf.setLineWidth(0.4);
  pdf.circle(logoCx, logoCy, 8.5, "S");
  // Logo inscrit dans le cercle (côté = r*√2 ≈ 12 pour r=8.5) — aucun débordement
  try {
    const taille = 11.8;
    pdf.addImage(logo, "JPEG", logoCx - taille / 2, logoCy - taille / 2, taille, taille, undefined, "FAST");
  } catch { /* ignore */ }

  // Titres bandeau
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("SCM SARL", x + 22, y + bandeauH / 2 + 1);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("CARTE DE SERVICE", x + 22, y + bandeauH / 2 + 7.5);

  // Drapeau RDC en haut à droite
  try { pdf.addImage(drapeau, "PNG", x + w - 18, y + 4, 14, 9, undefined, "FAST"); } catch { /* ignore */ }
  pdf.setFontSize(6.2);
  pdf.setTextColor(255, 255, 255);
  pdf.text("R.D. CONGO", x + w - 18, y + 16);

  // Photo de profil avec cadre doré
  const photoX = x + 6;
  const photoY = y + bandeauH + 5;
  const photoW = 30;
  const photoH = 36;
  pdf.setFillColor(...couleurAccent);
  pdf.roundedRect(photoX - 0.8, photoY - 0.8, photoW + 1.6, photoH + 1.6, 2, 2, "F");
  pdf.setFillColor(...couleurDouce);
  pdf.roundedRect(photoX, photoY, photoW, photoH, 1.5, 1.5, "F");
  if (data.photoProfil) {
    try { pdf.addImage(data.photoProfil, "JPEG", photoX, photoY, photoW, photoH, undefined, "FAST"); }
    catch { try { pdf.addImage(data.photoProfil, "PNG", photoX, photoY, photoW, photoH, undefined, "FAST"); } catch { /* ignore */ } }
  } else {
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(7);
    pdf.text("Photo", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
  }

  // Bloc informations
  const infoX = photoX + photoW + 5;
  const infoY = y + bandeauH + 6;
  const infoLargeur = w - (infoX - x) - 30;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11.5);
  pdf.setTextColor(...couleurPrincipale);
  const nomLignes = pdf.splitTextToSize((data.nomComplet || "—").toUpperCase(), infoLargeur);
  pdf.text(nomLignes, infoX, infoY);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...couleurAccent);
  pdf.text((data.poste || "—").toUpperCase(), infoX, infoY + 4.5 + (nomLignes.length - 1) * 4);

  pdf.setDrawColor(...couleurAccent);
  pdf.setLineWidth(0.25);
  pdf.line(infoX, infoY + 7 + (nomLignes.length - 1) * 4, infoX + infoLargeur, infoY + 7 + (nomLignes.length - 1) * 4);

  const champs: Array<[string, string]> = [
    ["MATRICULE", data.matricule || "—"],
    ["GENRE", data.genre || "—"],
    ["TÉLÉPHONE", data.telephone || "—"],
    ["ADRESSE", data.adresse || "—"],
  ];
  let cy = infoY + 11 + (nomLignes.length - 1) * 4;
  champs.forEach(([label, valeur]) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(5.8);
    pdf.setTextColor(120, 130, 150);
    pdf.text(label, infoX, cy);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.8);
    pdf.setTextColor(...couleurTexte);
    const valeurLignes = pdf.splitTextToSize(valeur, infoLargeur);
    pdf.text(valeurLignes.slice(0, 2), infoX, cy + 3);
    cy += 3 + Math.min(valeurLignes.length, 2) * 3 + 1.2;
  });

  // QR code en bas à droite
  const qrTaille = 24;
  const qrX = x + w - qrTaille - 5;
  const qrY = y + h - qrTaille - 9;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(qrX - 1, qrY - 1, qrTaille + 2, qrTaille + 2, 1, 1, "F");
  if (data.qrCode) {
    try { pdf.addImage(data.qrCode, "PNG", qrX, qrY, qrTaille, qrTaille, undefined, "FAST"); }
    catch { try { pdf.addImage(data.qrCode, "JPEG", qrX, qrY, qrTaille, qrTaille, undefined, "FAST"); } catch { /* ignore */ } }
  }
  pdf.setFontSize(5.8);
  pdf.setTextColor(120, 130, 150);
  pdf.text("Scanner pour vérifier", qrX + qrTaille / 2, qrY + qrTaille + 3, { align: "center" });

  // Pied
  pdf.setFillColor(...couleurPrincipale);
  pdf.rect(x, y + h - 5, w, 5, "F");
  pdf.setFillColor(...couleurAccent);
  pdf.rect(x, y + h - 5, w, 0.6, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  pdf.text(`N° ${data.numero}`, x + 4, y + h - 1.6);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.text("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", x + w / 2, y + h - 1.6, { align: "center" });
}

function dessinerCarteServiceVerso(pdf: jsPDF, data: DonneesCarteService, logo: string, drapeau: string, x: number, y: number, w: number, h: number) {
  const couleurPrincipale: [number, number, number] = [10, 65, 130];
  const couleurAccent: [number, number, number] = [212, 175, 55];
  const couleurTexte: [number, number, number] = [25, 35, 55];

  pdf.setFillColor(0, 0, 0);
  pdf.setGState(pdf.GState({ opacity: 0.18 }));
  pdf.roundedRect(x + 1.6, y + 2.4, w, h, 4, 4, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(x, y, w, h, 4, 4, "F");

  // Bandeau latéral gauche dégradé vertical
  const bandeauW = w * 0.22;
  for (let i = 0; i < 30; i += 1) {
    const t = i / 29;
    const r = Math.round(couleurPrincipale[0] + (35 - couleurPrincipale[0]) * t);
    const g = Math.round(couleurPrincipale[1] + (95 - couleurPrincipale[1]) * t);
    const b = Math.round(couleurPrincipale[2] + (175 - couleurPrincipale[2]) * t);
    pdf.setFillColor(r, g, b);
    pdf.rect(x, y + (h * i) / 30, bandeauW, h / 30 + 0.2, "F");
  }
  pdf.setFillColor(...couleurAccent);
  pdf.rect(x + bandeauW, y, 0.7, h, "F");

  pdf.setFillColor(255, 255, 255);
  pdf.circle(x + bandeauW / 2, y + 16, 9.5, "F");
  pdf.setDrawColor(...couleurAccent);
  pdf.setLineWidth(0.4);
  pdf.circle(x + bandeauW / 2, y + 16, 9.5, "S");
  // Logo inscrit dans le cercle (côté = r*√2 ≈ 13.4 pour r=9.5) — aucun débordement
  try {
    const taille = 13.2;
    pdf.addImage(logo, "JPEG", x + bandeauW / 2 - taille / 2, y + 16 - taille / 2, taille, taille, undefined, "FAST");
  } catch { /* ignore */ }
  try { pdf.addImage(drapeau, "PNG", x + bandeauW / 2 - 8, y + h - 22, 16, 11, undefined, "FAST"); } catch { /* ignore */ }
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.text("R.D.C.", x + bandeauW / 2, y + h - 7, { align: "center" });

  const cx = x + bandeauW + 6;
  const cw = w - bandeauW - 12;

  pdf.setTextColor(...couleurPrincipale);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("INFORMATIONS LÉGALES", cx, y + 9);
  pdf.setDrawColor(...couleurAccent);
  pdf.setLineWidth(0.4);
  pdf.line(cx, y + 11, cx + 30, y + 11);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.2);
  pdf.setTextColor(...couleurTexte);
  const intro = "Le détenteur de cette carte est un employé agréé de SCM SARL, société de droit congolais.";
  pdf.text(pdf.splitTextToSize(intro, cw), cx, y + 17);

  const legales: Array<[string, string]> = [
    ["RCCM", "CD/KNM/RCCM/24-B-01256"],
    ["IDNAT", "01-F4200-N55523N"],
    ["N° IMPÔT", "A2442 173S"],
  ];
  let ly = y + 28;
  legales.forEach(([label, valeur]) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.setTextColor(120, 130, 150);
    pdf.text(label, cx, ly);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...couleurTexte);
    pdf.text(valeur, cx + 22, ly);
    ly += 5.5;
  });

  pdf.setFillColor(248, 240, 220);
  pdf.roundedRect(cx, ly + 1, cw, 12, 1.5, 1.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...couleurAccent);
  pdf.text("EN CAS DE PERTE", cx + 2, ly + 5);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.2);
  pdf.setTextColor(...couleurTexte);
  pdf.text(pdf.splitTextToSize("Merci de retourner cette carte au siège SCM SARL ou au commissariat le plus proche.", cw - 4), cx + 2, ly + 8.5);

  // Signature unique : « Direction SCM SARL » + image de signature en petit juste en dessous
  const sigW = 50;
  const sy = y + h - 18;
  const sigX = cx + cw - sigW;
  pdf.setDrawColor(...couleurPrincipale);
  pdf.setLineWidth(0.3);
  pdf.line(sigX, sy, sigX + sigW, sy);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.2);
  pdf.setTextColor(...couleurPrincipale);
  pdf.text("Direction SCM SARL", sigX + sigW / 2, sy + 3, { align: "center" });
  // Image de signature en petit, sous le texte
  if (data.signatureDirection) {
    try {
      const sigImgW = 22;
      const sigImgH = 8;
      pdf.addImage(data.signatureDirection, formatImage(data.signatureDirection), sigX + (sigW - sigImgW) / 2, sy + 4.2, sigImgW, sigImgH, undefined, "FAST");
    } catch { /* ignore */ }
  }

  pdf.setFillColor(...couleurPrincipale);
  pdf.rect(cx - 2, y + h - 5, cw + 4, 5, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6);
  pdf.text(`Carte N° ${data.numero}`, cx, y + h - 1.6);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Émise le ${new Date(data.dateEmission || new Date()).toLocaleDateString("fr-FR")}`, cx + cw, y + h - 1.6, { align: "right" });
}

export async function creerPdfCarteService(data: DonneesCarteService) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const logo = await imageVersBase64(logoCarteServiceUrl).catch(() => "");
  const drapeau = await drapeauRdcVersPng();

  const pageW = 297;
  const pageH = 210;
  // Carte agrandie (~×1.4 du CR80) pour lisibilité PDF
  const carteW = 120;
  const carteH = 76;
  const cx = (pageW - carteW) / 2;
  const cy = (pageH - carteH) / 2;

  // Recto
  pdf.setFillColor(238, 242, 248);
  pdf.rect(0, 0, pageW, pageH, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(60, 70, 90);
  pdf.text("CARTE DE SERVICE — RECTO", pageW / 2, 14, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(120, 130, 150);
  pdf.text(`SCM SARL · Document officiel · N° ${data.numero}`, pageW / 2, 19, { align: "center" });
  dessinerCarteServiceRecto(pdf, data, logo, drapeau, cx, cy, carteW, carteH);
  pdf.setFontSize(6.5);
  pdf.setTextColor(120, 130, 150);
  pdf.text("Format CR80 (85,6 × 54 mm) recto·verso · SCM SARL · République Démocratique du Congo", pageW / 2, pageH - 8, { align: "center" });

  // Verso
  pdf.addPage("a4", "landscape");
  pdf.setFillColor(238, 242, 248);
  pdf.rect(0, 0, pageW, pageH, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(60, 70, 90);
  pdf.text("CARTE DE SERVICE — VERSO", pageW / 2, 14, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(120, 130, 150);
  pdf.text(`SCM SARL · Document officiel · N° ${data.numero}`, pageW / 2, 19, { align: "center" });
  dessinerCarteServiceVerso(pdf, data, logo, drapeau, cx, cy, carteW, carteH);
  pdf.setFontSize(6.5);
  pdf.setTextColor(120, 130, 150);
  pdf.text("Format CR80 (85,6 × 54 mm) recto·verso · SCM SARL · République Démocratique du Congo", pageW / 2, pageH - 8, { align: "center" });

  return pdf.output("datauristring");
}

// ============================================================================
// DEMANDES DE PAIEMENT — soumises par les employés à l'administration
// ============================================================================

export type StatutDemandePaiement = "en_attente" | "approuvee" | "refusee";

export type DemandePaiementRecord = {
  id: string;
  employe_id: string;
  employe_nom: string;
  matricule: string;
  poste: string;
  chantier_id: string | null;
  chantier_nom: string;
  montant: number;
  note: string;
  statut: StatutDemandePaiement;
  date_traitement: string | null;
  reponse_admin: string;
  created_at: string;
  updated_at: string;
};

export async function listerDemandesPaiement(recherche = "", employeId?: string) {
  let requete = db.from("demandes_paiement").select("*").order("created_at", { ascending: false });
  if (employeId) requete = requete.eq("employe_id", employeId);
  if (recherche.trim()) {
    const terme = `%${recherche.trim()}%`;
    requete = requete.or(`employe_nom.ilike.${terme},matricule.ilike.${terme},chantier_nom.ilike.${terme},note.ilike.${terme},statut.ilike.${terme}`);
  }
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return (data ?? []) as DemandePaiementRecord[];
}

export async function creerDemandePaiement(payload: {
  employe_id: string;
  employe_nom: string;
  matricule: string;
  poste: string;
  chantier_id: string | null;
  chantier_nom: string;
  montant: number;
  note: string;
}) {
  const ligne = { ...payload, statut: "en_attente" as const };
  const { data, error } = await db.from("demandes_paiement").insert(ligne).select().single();
  if (error) throw new Error(error.message);
  return data as DemandePaiementRecord;
}

export async function mettreAJourStatutDemandePaiement(id: string, statut: StatutDemandePaiement, reponseAdmin = "") {
  const { data, error } = await db
    .from("demandes_paiement")
    .update({ statut, reponse_admin: reponseAdmin, date_traitement: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DemandePaiementRecord;
}

export async function supprimerDemandePaiementParId(id: string) {
  const { error } = await db.from("demandes_paiement").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ============================================================================
// Reçus employés (paiements) + salaires par chantier
// ============================================================================

export type SalaireChantier = {
  id: string;
  employe_id: string;
  chantier_id: string;
  montant: number;
  created_at: string;
  updated_at: string;
};

export type RecuEmployeRecord = {
  id: string;
  numero: string;
  nom_fichier: string;
  employe_id: string;
  employe_nom: string;
  matricule: string;
  chantier_id: string | null;
  chantier_nom: string;
  montant: number;
  motif: string;
  statut: "en_attente" | "confirme" | "refuse";
  date_envoi: string;
  date_confirmation: string | null;
  pdf_base64: string;
  donnees_formulaire: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function listerSalairesChantier() {
  const { data, error } = await db.from("salaires_chantier").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as SalaireChantier[];
}

export async function definirSalairesChantier(chantierId: string, lignes: { employe_id: string; montant: number }[]) {
  // Supprime puis réinsère pour ce chantier (simple et fiable, peu de lignes)
  const { error: delErr } = await db.from("salaires_chantier").delete().eq("chantier_id", chantierId);
  if (delErr) throw new Error(delErr.message);
  if (!lignes.length) return;
  const payload = lignes.map((l) => ({ chantier_id: chantierId, employe_id: l.employe_id, montant: Number(l.montant) || 0 }));
  const { error: insErr } = await db.from("salaires_chantier").insert(payload);
  if (insErr) throw new Error(insErr.message);
}

export async function listerRecusEmployes(recherche = "", employeId?: string) {
  let requete = db.from("recus_employes").select("*").order("created_at", { ascending: false });
  if (employeId) requete = requete.eq("employe_id", employeId);
  if (recherche.trim()) {
    const terme = `%${recherche.trim()}%`;
    requete = requete.or(`nom_fichier.ilike.${terme},numero.ilike.${terme},employe_nom.ilike.${terme},matricule.ilike.${terme},chantier_nom.ilike.${terme},motif.ilike.${terme}`);
  }
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return (data ?? []) as RecuEmployeRecord[];
}

export async function confirmerRecuEmploye(recuId: string, employeId: string) {
  const { data, error } = await db.rpc("confirmer_recu_employe", { _recu_id: recuId, _employe_id: employeId });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.message || "Confirmation impossible.");
  return true;
}

export type DonneesRecuEmploye = {
  numero: string;
  date: string;
  employe: { nom_complet: string; matricule: string; poste: string };
  chantierNom: string;
  montant: number;
  motif: string;
  modePaiement: string;
  signataireNom: string;
  signataireFonction: string;
  sceau?: string;
  signature?: string;
};

export async function creerPdfRecuEmploye(data: DonneesRecuEmploye): Promise<string> {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const couleurs = couleursPdfParOutil.recu_employe;
  const logo = await imageVersBase64(logoUrl).catch(() => "");
  const drapeau = await drapeauRdcVersPng().catch(() => "");
  const pageW = 210;
  const pageH = 297;

  // Fond crème léger
  pdf.setFillColor(247, 252, 250);
  pdf.rect(0, 0, pageW, pageH, "F");

  // Bande latérale
  pdf.setFillColor(...couleurs.principal);
  pdf.rect(0, 0, 6, pageH, "F");
  pdf.setFillColor(...couleurs.secondaire);
  pdf.rect(6, 0, 1.5, pageH, "F");

  // Carte blanche
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(14, 14, 184, 269, 3, 3, "F");

  // En-tête : logo + identité + drapeau
  if (logo) { try { pdf.addImage(logo, "JPEG", 20, 20, 40, 24, undefined, "FAST"); } catch { /* ignore */ } }
  if (drapeau) { try { pdf.addImage(drapeau, "PNG", 170, 20, 22, 16, undefined, "FAST"); } catch { /* ignore */ } }
  pdf.setTextColor(...couleurs.principal);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("SCM SARL", 64, 26);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(85, 92, 110);
  pdf.text("RCCM : CD/KNM/RCCM/24-B-01256 · IDNAT : 01-F4200-N55523N", 64, 31);
  pdf.text("N° Impôt : A2442 173S · Direction des Ressources Humaines", 64, 36);

  pdf.setDrawColor(...couleurs.secondaire);
  pdf.setLineWidth(0.7);
  pdf.line(20, 50, 192, 50);
  pdf.setLineWidth(0.2);
  pdf.line(20, 51.5, 192, 51.5);

  // Titre
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("REÇU DE PAIEMENT EMPLOYÉ", pageW / 2, 62, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(85, 92, 110);
  pdf.text(`N° ${data.numero}  ·  Date : ${new Date(data.date).toLocaleDateString("fr-FR")}`, pageW / 2, 70, { align: "center" });

  // Bloc bénéficiaire
  let y = 84;
  pdf.setFillColor(...couleurs.doux);
  pdf.roundedRect(20, y - 6, 172, 36, 2.5, 2.5, "F");
  pdf.setTextColor(...couleurs.principal);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("BÉNÉFICIAIRE", 24, y);
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(11);
  pdf.text(data.employe.nom_complet || "—", 24, y + 7);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Matricule : ${data.employe.matricule || "—"}`, 24, y + 14);
  pdf.text(`Poste : ${data.employe.poste || "—"}`, 24, y + 20);
  pdf.text(`Chantier concerné : ${data.chantierNom || "—"}`, 24, y + 26);

  // Bloc montant principal
  y = 134;
  pdf.setFillColor(...couleurs.principal);
  pdf.roundedRect(20, y - 6, 172, 30, 3, 3, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("MONTANT VERSÉ", 28, y + 2);
  pdf.setFontSize(26);
  pdf.text(`${formaterMontant(Number(data.montant || 0), { decimales: 2 })} $`, 28, y + 16);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Mode de paiement : ${data.modePaiement || "—"}`, 132, y + 16);

  // Motif / description
  y = 178;
  pdf.setTextColor(...couleurs.principal);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("MOTIF DU PAIEMENT", 20, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(40, 50, 70);
  const motifLignes = pdf.splitTextToSize(data.motif || "Paiement de salaire pour le chantier indiqué.", 172);
  pdf.text(motifLignes, 20, y + 7);

  // Mention légale
  y = 224;
  pdf.setFillColor(245, 247, 250);
  pdf.roundedRect(20, y - 6, 172, 22, 2, 2, "F");
  pdf.setTextColor(71, 85, 105);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8.5);
  const mention = "Je soussigné(e) reconnais avoir reçu de SCM SARL la somme indiquée ci-dessus en règlement du motif décrit. La confirmation électronique de ce reçu via mon espace personnel vaut acquittement définitif.";
  const mentionLignes = pdf.splitTextToSize(mention, 164);
  pdf.text(mentionLignes, 24, y);

  // Sceau / signatures
  y = 254;
  if (data.sceau) {
    try { pdf.addImage(data.sceau, "PNG", 24, y - 12, 26, 26, undefined, "FAST"); } catch { /* ignore */ }
  }
  if (data.signature) {
    try { pdf.addImage(data.signature, "PNG", 142, y - 12, 44, 22, undefined, "FAST"); } catch { /* ignore */ }
  }
  pdf.setDrawColor(180, 188, 200);
  pdf.setLineWidth(0.2);
  pdf.line(20, y + 18, 88, y + 18);
  pdf.line(122, y + 18, 192, y + 18);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("Sceau & émetteur SCM SARL", 24, y + 23);
  pdf.text("Signature du bénéficiaire", 126, y + 23);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(8);
  pdf.text(`${data.signataireNom || "—"} · ${data.signataireFonction || "Direction RH"}`, 24, y + 28);
  pdf.text(`${data.employe.nom_complet || "—"}`, 126, y + 28);

  // Pied de page
  pdf.setDrawColor(...couleurs.principal);
  pdf.setLineWidth(0.2);
  pdf.line(20, 274, 192, 274);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(7);
  pdf.setTextColor(120, 125, 140);
  pdf.text("SCM SARL — Reçu de paiement employé — Confirmation requise dans l'espace personnel pour acquittement.", pageW / 2, 279, { align: "center" });

  return pdf.output("datauristring");
}

export async function enregistrerRecuEmploye(payload: {
  employeId: string;
  employeNom: string;
  matricule: string;
  chantierId: string | null;
  chantierNom: string;
  montant: number;
  motif: string;
  date: string;
  donneesFormulaire?: Record<string, unknown>;
}, pdfBase64: string, numero?: string) {
  const documentNumero = numero || (await genererNumero("recu_employe"));
  const nomFichier = `${documentNumero}-${(payload.employeNom || "recu-employe").replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.pdf`;
  const ligne = {
    numero: documentNumero,
    nom_fichier: nomFichier,
    employe_id: payload.employeId,
    employe_nom: payload.employeNom,
    matricule: payload.matricule,
    chantier_id: payload.chantierId,
    chantier_nom: payload.chantierNom,
    montant: Number(payload.montant) || 0,
    motif: payload.motif,
    statut: "en_attente",
    date_envoi: payload.date,
    pdf_base64: pdfBase64,
    donnees_formulaire: payload.donneesFormulaire || {},
  };
  const { data, error } = await db.from("recus_employes").insert(ligne).select().single();
  if (error) throw new Error(error.message);
  return data as RecuEmployeRecord;
}

export async function supprimerRecuEmploye(id: string) {
  const { error } = await db.from("recus_employes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ============================================================
// DEVIS ESTIMATIF — Multi-étapes de construction
// ============================================================

export type LigneDevisEstimatif = { designation: string; unite: string; quantite: number; prixUnitaire: number };
export type EtapeDevisEstimatif = { titre: string; lignes: LigneDevisEstimatif[] };

export type DonneesDevisEstimatif = {
  numero: string;
  titreDevis: string;
  projet: string;
  client: string;
  localisation: string;
  duree: string;
  adresseChantier: string;
  description: string;
  telephone: string;
  dateDocument: string;
  imprevuPourcentage: number;
  etapes: EtapeDevisEstimatif[];
  sceau?: string;
  nomImportateur?: string;
  fonctionImportateur?: string;
  signature?: string;
};

export type DevisEstimatifRecord = DocumentRecord & { projet?: string };

export async function creerPdfDevisEstimatif(data: DonneesDevisEstimatif): Promise<string> {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const couleurs = couleursPdfParOutil.devis_estimatif;
  const logo = await imageVersBase64(logoUrl);
  const drapeauRdc = await drapeauRdcVersPng();

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGE_X = 14;
  const Y_LIMITE = 268;

  const dessinerEntete = (numeroPage: number) => {
    // Fond
    pdf.setFillColor(247, 249, 252);
    pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(10, 10, PAGE_W - 20, PAGE_H - 20, 3, 3, "F");

    // Logo + Drapeau
    if (logo) { try { pdf.addImage(logo, "JPEG", 16, 14, 30, 18, undefined, "FAST"); } catch { /* ignore */ } }
    if (drapeauRdc) { try { pdf.addImage(drapeauRdc, "PNG", PAGE_W - 38, 15, 22, 14, undefined, "FAST"); } catch { /* ignore */ } }

    // Bandeau infos entreprise
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(...couleurs.principal);
    pdf.text("SCM SARL", 50, 19);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(80, 90, 110);
    pdf.text("Solution des constructions modernes Sarl", 50, 23.5);
    pdf.text("RCCM : CD/KNM/RCCM/24-B-01256  ·  N° Impôt : A24217735  ·  IDNAT : 01-F2300-N55523N", 50, 27);
    pdf.text("Kinshasa / Ngaliema / Av. Kilimani n° 28 A", 50, 30.5);

    pdf.setDrawColor(...couleurs.secondaire);
    pdf.setLineWidth(0.6);
    pdf.line(MARGE_X, 35, PAGE_W - MARGE_X, 35);

    // Titre du devis
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(...couleurs.principal);
    const titre = (data.titreDevis || "SYNTHÈSE DU DEVIS ESTIMATIF").toUpperCase();
    const titreLignes = pdf.splitTextToSize(titre, PAGE_W - 2 * MARGE_X);
    pdf.text(titreLignes, PAGE_W / 2, 42, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(90, 100, 120);
    pdf.text(`N° ${data.numero}${numeroPage > 1 ? `  ·  Page ${numeroPage}` : ""}`, MARGE_X, 50 + (titreLignes.length - 1) * 5);
    pdf.text(`Date : ${new Date(data.dateDocument || Date.now()).toLocaleDateString("fr-FR")}`, PAGE_W - MARGE_X, 50 + (titreLignes.length - 1) * 5, { align: "right" });
  };

  let pageCourante = 1;
  dessinerEntete(1);
  let y = 58;

  const passerPage = () => {
    pdf.addPage();
    pageCourante += 1;
    dessinerEntete(pageCourante);
    return 58;
  };

  const verifierPlace = (hauteur: number) => {
    if (y + hauteur > Y_LIMITE) y = passerPage();
  };

  // Bloc INFORMATIONS DU PROJET
  verifierPlace(8);
  pdf.setFillColor(...couleurs.doux);
  pdf.rect(MARGE_X, y, PAGE_W - 2 * MARGE_X, 6, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("INFORMATIONS DU PROJET", MARGE_X + 2, y + 4.2);
  y += 9;

  const infos: Array<[string, string]> = [
    ["Projet", data.projet || "—"],
    ["Client", data.client || "—"],
    ["Localisation", data.localisation || "—"],
    ["Durée", data.duree || "—"],
    ["Adresse du chantier", data.adresseChantier || "—"],
    ["Téléphone", data.telephone || "—"],
  ];
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  infos.forEach(([label, valeur], idx) => {
    const xCol = MARGE_X + (idx % 2) * ((PAGE_W - 2 * MARGE_X) / 2);
    if (idx % 2 === 0 && idx > 0) y += 6;
    verifierPlace(6);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...couleurs.principal);
    pdf.text(`${label} :`, xCol, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(36, 45, 64);
    const v = pdf.splitTextToSize(valeur, (PAGE_W - 2 * MARGE_X) / 2 - 35);
    pdf.text(v, xCol + 35, y);
  });
  y += 8;

  if (data.description?.trim()) {
    verifierPlace(12);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...couleurs.principal);
    pdf.text("Description :", MARGE_X, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(36, 45, 64);
    const desc = pdf.splitTextToSize(data.description, PAGE_W - 2 * MARGE_X - 25);
    pdf.text(desc, MARGE_X + 25, y);
    y += Math.max(5, desc.length * 4.2) + 3;
  }
  y += 2;

  // Tableau d'une étape
  const colX = {
    no: MARGE_X + 2,
    designation: MARGE_X + 14,
    unite: MARGE_X + 92,
    quantite: MARGE_X + 114,
    prixU: MARGE_X + 138,
    prixT: MARGE_X + 165,
  };
  const tableW = PAGE_W - 2 * MARGE_X;

  const dessinerEnteteTableau = () => {
    pdf.setFillColor(...couleurs.principal);
    pdf.rect(MARGE_X, y, tableW, 7, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text("N°", colX.no, y + 4.8);
    pdf.text("DESIGNATION", colX.designation, y + 4.8);
    pdf.text("UNITE", colX.unite, y + 4.8);
    pdf.text("QTE", colX.quantite, y + 4.8);
    pdf.text("PRIX-U ($)", colX.prixU, y + 4.8);
    pdf.text("PRIX TOTAL ($)", colX.prixT, y + 4.8);
    y += 7;
  };

  const lettres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let totalGlobal = 0;
  const sousTotaux: number[] = [];

  data.etapes.forEach((etape, etapeIdx) => {
    verifierPlace(20);
    // Titre étape
    pdf.setFillColor(...couleurs.doux);
    pdf.rect(MARGE_X, y, tableW, 6.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...couleurs.principal);
    pdf.text(`ÉTAPE ${etapeIdx + 1} : ${(etape.titre || "Étape").toUpperCase()}`, MARGE_X + 2, y + 4.5);
    y += 8;

    dessinerEnteteTableau();

    let sousTotal = 0;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(36, 45, 64);
    const lettre = lettres[etapeIdx] || `E${etapeIdx + 1}`;

    etape.lignes.forEach((ligne, ligneIdx) => {
      const total = Number(ligne.quantite || 0) * Number(ligne.prixUnitaire || 0);
      sousTotal += total;
      const designationLignes = pdf.splitTextToSize(ligne.designation || "—", 76);
      const hLigne = Math.max(6, designationLignes.length * 4.2 + 2);
      if (y + hLigne > Y_LIMITE) {
        y = passerPage();
        dessinerEnteteTableau();
      }
      // alternance fond
      if (ligneIdx % 2 === 0) {
        pdf.setFillColor(248, 250, 253);
        pdf.rect(MARGE_X, y, tableW, hLigne, "F");
      }
      const yTexte = y + 4;
      pdf.setTextColor(36, 45, 64);
      pdf.text(`${lettre}${ligneIdx + 1}`, colX.no, yTexte);
      pdf.text(designationLignes, colX.designation, yTexte);
      pdf.text(ligne.unite || "—", colX.unite, yTexte);
      pdf.text(String(ligne.quantite || 0), colX.quantite, yTexte);
      pdf.text(formaterMontant(Number(ligne.prixUnitaire || 0)), colX.prixU, yTexte);
      pdf.text(formaterMontant(total), colX.prixT, yTexte);
      y += hLigne;
    });

    // Sous-total étape
    verifierPlace(8);
    pdf.setFillColor(...couleurs.secondaire);
    pdf.rect(MARGE_X, y, tableW, 7, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`SOUS-TOTAL ÉTAPE ${etapeIdx + 1} ($)`, colX.designation, y + 4.7);
    pdf.text(`${formaterMontant(sousTotal)} $`, colX.prixT, y + 4.7);
    y += 10;
    sousTotaux.push(sousTotal);
    totalGlobal += sousTotal;
  });

  // RÉCAPITULATIF
  verifierPlace(40);
  pdf.setFillColor(...couleurs.principal);
  pdf.rect(MARGE_X, y, tableW, 7, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text("RÉCAPITULATIF GÉNÉRAL", MARGE_X + 2, y + 4.8);
  y += 9;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(36, 45, 64);
  data.etapes.forEach((etape, idx) => {
    verifierPlace(6);
    pdf.text(`Sous-total Étape ${idx + 1} — ${etape.titre}`, MARGE_X + 2, y);
    pdf.text(`${formaterMontant(sousTotaux[idx])} $`, PAGE_W - MARGE_X - 2, y, { align: "right" });
    y += 5.5;
  });

  // Imprévu
  const imprevuPct = Number(data.imprevuPourcentage || 0);
  const montantImprevu = Math.round(totalGlobal * imprevuPct) / 100;
  verifierPlace(7);
  pdf.setDrawColor(...couleurs.secondaire);
  pdf.setLineWidth(0.3);
  pdf.line(MARGE_X, y, PAGE_W - MARGE_X, y);
  y += 4;
  pdf.text(`Imprévu (${formaterMontant(imprevuPct)} %)`, MARGE_X + 2, y);
  pdf.text(`${formaterMontant(montantImprevu)} $`, PAGE_W - MARGE_X - 2, y, { align: "right" });
  y += 6;

  // Coût global
  const coutGlobal = totalGlobal + montantImprevu;
  verifierPlace(14);
  pdf.setFillColor(...couleurs.principal);
  pdf.roundedRect(MARGE_X, y, tableW, 11, 1.5, 1.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.text("COÛT GLOBAL DU PROJET", MARGE_X + 4, y + 7.2);
  pdf.text(`${formaterMontant(coutGlobal)} $`, PAGE_W - MARGE_X - 4, y + 7.2, { align: "right" });
  y += 15;

  if (data.duree?.trim()) {
    verifierPlace(6);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.setTextColor(80, 90, 110);
    pdf.text(`Durée des travaux : ${data.duree}`, MARGE_X + 2, y);
    y += 6;
  }

  // Pied : sceau + signature + nom de l'importateur
  const yPied = Math.max(y + 4, 230);
  if (yPied + 50 > PAGE_H - 14) {
    y = passerPage();
  }
  const yBlocPied = Math.max(y + 4, 230);

  pdf.setDrawColor(...couleurs.secondaire);
  pdf.setLineWidth(0.4);
  pdf.line(MARGE_X, yBlocPied - 2, PAGE_W - MARGE_X, yBlocPied - 2);

  // Bloc gauche : Sceau
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("Sceau de l'entreprise", MARGE_X + 2, yBlocPied + 4);
  if (data.sceau) {
    try { pdf.addImage(data.sceau, "JPEG", MARGE_X + 2, yBlocPied + 7, 42, 28, undefined, "FAST"); } catch { /* ignore */ }
  } else {
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(MARGE_X + 2, yBlocPied + 7, 42, 28, 1, 1, "S");
  }

  // Bloc centre : Signature
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("Signature", PAGE_W / 2 - 21, yBlocPied + 4);
  if (data.signature) {
    try { pdf.addImage(data.signature, "JPEG", PAGE_W / 2 - 21, yBlocPied + 7, 42, 22, undefined, "FAST"); } catch { /* ignore */ }
  } else {
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.2);
    pdf.line(PAGE_W / 2 - 21, yBlocPied + 28, PAGE_W / 2 + 21, yBlocPied + 28);
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(36, 45, 64);
  pdf.text(data.nomImportateur || "—", PAGE_W / 2, yBlocPied + 33, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(80, 90, 110);
  pdf.text(data.fonctionImportateur || "Personne ayant établi le devis", PAGE_W / 2, yBlocPied + 37, { align: "center" });

  // Bloc droite : Coordonnées
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("Moyens de paiement", PAGE_W - MARGE_X - 60, yBlocPied + 4);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(60, 70, 90);
  const moyens = [
    "EQUITY BCDC : 377100182502428",
    "M-PESA : +243 814 644 847",
    "AIRTEL MONEY : +243 996 742 215",
    "Tél. : (+243) 814 648 847 / 996 742 215",
  ];
  moyens.forEach((ligne, i) => pdf.text(ligne, PAGE_W - MARGE_X - 60, yBlocPied + 9 + i * 4));

  return pdf.output("datauristring");
}

export async function enregistrerDevisEstimatif(payload: Record<string, unknown>, pdfBase64: string, numero?: string, id?: string) {
  const documentNumero = numero || (await genererNumero("devis_estimatif"));
  const sourceNom = (payload.client as string) || (payload.projet as string) || "devis-estimatif";
  const nomFichier = `${documentNumero}-${String(sourceNom).replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.pdf`;
  const ligne = {
    numero: documentNumero,
    nom_fichier: nomFichier,
    donnees_formulaire: payload,
    pdf_base64: pdfBase64,
    montant_total: Number(payload.coutGlobal || payload.totalGlobal || 0),
    client: String(payload.client || ""),
    projet: String(payload.projet || ""),
    date_document: String(payload.dateDocument || new Date().toISOString().slice(0, 10)),
  };
  const requete = id
    ? db.from("devis_estimatifs").update(ligne).eq("id", id).select().single()
    : db.from("devis_estimatifs").insert(ligne).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as DevisEstimatifRecord;
}

// ============================================================
// CONTRAT AVEC FOURNISSEUR
// ============================================================

export type LigneFourniture = { description: string; quantite: string };

export type DonneesContratFournisseur = {
  numero: string;
  dateDocument: string;
  lieu: string;
  // Fournisseur
  fournisseurNom: string;
  fournisseurRepresentant: string;
  fournisseurAdresse: string;
  fournisseurTelephone: string;
  fournisseurEmail: string;
  fournisseurRccm: string;
  fournisseurIdnat: string;
  // Objet
  objet: string; // ex: "la fourniture de sable destiné aux travaux de construction"
  lignes: LigneFourniture[];
  conditionsLivraison: string;
  modalitesPaiement: string;
  duree: string;
  clauses: string;
  // Signatures
  sceauFournisseur?: string;
  signatureFournisseur?: string;
  sceauScm?: string;
  signatureScm?: string;
  signataireScmNom: string;
  signataireScmFonction: string;
};

export type ContratFournisseurRecord = DocumentRecord;

export async function creerPdfContratFournisseur(data: DonneesContratFournisseur): Promise<string> {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const couleurs = couleursPdfParOutil.contrat_fournisseur;
  const logo = await imageVersBase64(logoUrl);
  const drapeauRdc = await drapeauRdcVersPng();

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGE_X = 16;
  const Y_LIMITE = 272;

  const dessinerEntete = (numeroPage: number) => {
    pdf.setFillColor(247, 249, 252);
    pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(10, 10, PAGE_W - 20, PAGE_H - 20, 3, 3, "F");

    if (numeroPage === 1) {
      if (logo) { try { pdf.addImage(logo, "JPEG", 16, 14, 30, 18, undefined, "FAST"); } catch { /* ignore */ } }
      if (drapeauRdc) { try { pdf.addImage(drapeauRdc, "PNG", PAGE_W - 38, 15, 22, 14, undefined, "FAST"); } catch { /* ignore */ } }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(...couleurs.principal);
      pdf.text("SCM SARL", 50, 19);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(80, 90, 110);
      pdf.text("Solution des constructions modernes Sarl", 50, 23.5);
      pdf.text("RCCM : CD/KNM/RCCM/24-B-01256  ·  N° Impôt : A24217735  ·  IDNAT : 01-F2300-N55523N", 50, 27);
      pdf.text("Kinshasa / Ngaliema / Av. Kilimani n° 28 A", 50, 30.5);

      pdf.setDrawColor(...couleurs.secondaire);
      pdf.setLineWidth(0.6);
      pdf.line(MARGE_X, 35, PAGE_W - MARGE_X, 35);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(...couleurs.principal);
      pdf.text("CONTRAT DE FOURNITURE", PAGE_W / 2, 42, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(90, 100, 120);
      pdf.text(`N° ${data.numero}`, MARGE_X, 49);
      pdf.text(`Date : ${new Date(data.dateDocument || Date.now()).toLocaleDateString("fr-FR")}`, PAGE_W - MARGE_X, 49, { align: "right" });
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(120, 130, 150);
      pdf.text(`Contrat de fourniture N° ${data.numero}`, MARGE_X, 16);
      pdf.text(`Page ${numeroPage}`, PAGE_W - MARGE_X, 16, { align: "right" });
      pdf.setDrawColor(...couleurs.secondaire);
      pdf.setLineWidth(0.3);
      pdf.line(MARGE_X, 19, PAGE_W - MARGE_X, 19);
    }
  };

  let pageCourante = 1;
  dessinerEntete(1);
  let y = 58;

  const passerPage = () => {
    pdf.addPage();
    pageCourante += 1;
    dessinerEntete(pageCourante);
    return 24;
  };

  const verifierPlace = (h: number) => { if (y + h > Y_LIMITE) y = passerPage(); };

  const titreSection = (texte: string) => {
    verifierPlace(9);
    pdf.setFillColor(...couleurs.doux);
    pdf.rect(MARGE_X, y, PAGE_W - 2 * MARGE_X, 6.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...couleurs.principal);
    pdf.text(texte, MARGE_X + 2, y + 4.5);
    y += 9.5;
  };

  const paragraphe = (texte: string, options: { italique?: boolean; taille?: number } = {}) => {
    pdf.setFont("helvetica", options.italique ? "italic" : "normal");
    pdf.setFontSize(options.taille ?? 9.5);
    pdf.setTextColor(36, 45, 64);
    const lignes = pdf.splitTextToSize(texte, PAGE_W - 2 * MARGE_X);
    lignes.forEach((ligne: string) => {
      verifierPlace(5.5);
      pdf.text(ligne, MARGE_X, y);
      y += 5;
    });
    y += 1.5;
  };

  // ENTRE LES SOUSSIGNÉS
  titreSection("ENTRE LES SOUSSIGNÉS");
  paragraphe("L'ACHETEUR : SCM SARL.");
  paragraphe(`LE FOURNISSEUR : ${data.fournisseurNom || "—"}${data.fournisseurTelephone ? `  ·  Téléphone : ${data.fournisseurTelephone}` : ""}.`);

  // OBJET DU CONTRAT
  titreSection("OBJET DU CONTRAT");
  paragraphe(`Le présent contrat a pour objet ${data.objet || "la fourniture de sable destiné aux travaux de construction"} réalisés par l'Acheteur.`);
  paragraphe("Le Fournisseur s'engage à livrer :", { italique: true });

  // Tableau des fournitures
  const tableW = PAGE_W - 2 * MARGE_X;
  const colDesc = tableW * 0.7;
  const colQte = tableW * 0.3;

  verifierPlace(8);
  pdf.setFillColor(...couleurs.principal);
  pdf.rect(MARGE_X, y, tableW, 7, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text("DESCRIPTION", MARGE_X + 2, y + 4.8);
  pdf.text("QUANTITÉ", MARGE_X + colDesc + 2, y + 4.8);
  y += 7;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(36, 45, 64);
  data.lignes.forEach((ligne, idx) => {
    const lignesDesc = pdf.splitTextToSize(ligne.description || "—", colDesc - 4);
    const lignesQte = pdf.splitTextToSize(ligne.quantite || "—", colQte - 4);
    const hauteurLigne = Math.max(lignesDesc.length, lignesQte.length) * 4.5 + 3;
    verifierPlace(hauteurLigne);
    if (idx % 2 === 0) { pdf.setFillColor(248, 250, 253); pdf.rect(MARGE_X, y, tableW, hauteurLigne, "F"); }
    pdf.setDrawColor(220, 224, 232);
    pdf.setLineWidth(0.1);
    pdf.line(MARGE_X, y + hauteurLigne, MARGE_X + tableW, y + hauteurLigne);
    pdf.text(lignesDesc, MARGE_X + 2, y + 4.5);
    pdf.text(lignesQte, MARGE_X + colDesc + 2, y + 4.5);
    y += hauteurLigne;
  });
  y += 4;

  // CONDITIONS
  if (data.conditionsLivraison?.trim()) { titreSection("CONDITIONS DE LIVRAISON"); paragraphe(data.conditionsLivraison); }
  if (data.modalitesPaiement?.trim()) { titreSection("MODALITÉS DE PAIEMENT"); paragraphe(data.modalitesPaiement); }
  if (data.duree?.trim()) { titreSection("DURÉE DU CONTRAT"); paragraphe(data.duree); }
  if (data.clauses?.trim()) { titreSection("CLAUSES GÉNÉRALES"); paragraphe(data.clauses); }

  // SIGNATURES
  verifierPlace(70);
  y += 4;
  pdf.setDrawColor(...couleurs.secondaire);
  pdf.setLineWidth(0.4);
  pdf.line(MARGE_X, y, PAGE_W - MARGE_X, y);
  y += 4;

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(9);
  pdf.setTextColor(80, 90, 110);
  pdf.text(`Fait à ${data.lieu || "Kinshasa"}, le ${new Date(data.dateDocument || Date.now()).toLocaleDateString("fr-FR")}, en deux exemplaires originaux.`, MARGE_X, y);
  y += 8;

  const blocW = (PAGE_W - 2 * MARGE_X - 8) / 2;
  const yBloc = y;

  // Acheteur (SCM SARL)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("L'ACHETEUR — SCM SARL", MARGE_X, yBloc);
  if (data.sceauScm) {
    try {
      const fmt = data.sceauScm.startsWith("data:image/png") ? "PNG" : "JPEG";
      pdf.addImage(data.sceauScm, fmt, MARGE_X, yBloc + 4, 44, 28, undefined, "FAST");
    } catch (e) { console.warn("[ContratFournisseur] sceau SCM ignoré:", e); }
  }
  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.2);
  pdf.line(MARGE_X, yBloc + 30, MARGE_X + blocW - 4, yBloc + 30);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(36, 45, 64);
  pdf.text(data.signataireScmNom || "—", MARGE_X, yBloc + 34);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(80, 90, 110);
  pdf.text(data.signataireScmFonction || "Représentant SCM SARL", MARGE_X, yBloc + 38);

  // Fournisseur
  const xF = MARGE_X + blocW + 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...couleurs.principal);
  pdf.text("LE FOURNISSEUR", xF, yBloc);
  if (data.signatureFournisseur) {
    try {
      const fmt = data.signatureFournisseur.startsWith("data:image/png") ? "PNG" : "JPEG";
      pdf.addImage(data.signatureFournisseur, fmt, xF, yBloc + 4, 44, 24, undefined, "FAST");
    } catch (e) { console.warn("[ContratFournisseur] signature fournisseur ignorée:", e); }
  }
  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.2);
  pdf.line(xF, yBloc + 30, xF + blocW - 4, yBloc + 30);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(36, 45, 64);
  pdf.text(data.fournisseurRepresentant || data.fournisseurNom || "—", xF, yBloc + 34);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(80, 90, 110);
  pdf.text(data.fournisseurNom || "Fournisseur", xF, yBloc + 38);

  return pdf.output("datauristring");
}

export async function enregistrerContratFournisseur(payload: Record<string, unknown>, pdfBase64: string, numero?: string, id?: string) {
  const documentNumero = numero || (await genererNumero("contrat_fournisseur"));
  const sourceNom = (payload.fournisseurNom as string) || "contrat-fournisseur";
  const nomFichier = `${documentNumero}-${String(sourceNom).replace(/[^a-z0-9À-ÿ-]+/gi, "-")}.pdf`;
  const ligne = {
    numero: documentNumero,
    nom_fichier: nomFichier,
    donnees_formulaire: payload,
    pdf_base64: pdfBase64,
    client: String(payload.fournisseurNom || ""),
    date_document: String(payload.dateDocument || new Date().toISOString().slice(0, 10)),
  };
  const requete = id
    ? db.from("contrats_fournisseurs").update(ligne).eq("id", id).select().single()
    : db.from("contrats_fournisseurs").insert(ligne).select().single();
  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as ContratFournisseurRecord;
}
