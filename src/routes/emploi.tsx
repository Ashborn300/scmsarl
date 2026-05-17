import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Briefcase, CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import scmLogo from "@/assets/scm-logo.jpeg";

export const Route = createFileRoute("/emploi")({
  head: () => ({
    meta: [
      { title: "SCM SARL — Postuler à un emploi" },
      { name: "description", content: "Postulez pour rejoindre SCM SARL : maçon, charpentier, ingénieur, soudeur et autres postes. Remplissez le formulaire de candidature." },
      { property: "og:title", content: "SCM SARL — Postuler à un emploi" },
      { property: "og:description", content: "Formulaire officiel de candidature à un emploi chez SCM SARL." },
    ],
  }),
  component: EmploiPage,
});

const db = supabase as any;

const POSTES = ["Maçon", "Charpentier", "Ingénieur", "Soudeur", "Autre"] as const;

const initial = {
  nom_complet: "",
  telephone: "",
  adresse: "",
  niveau_etude: "",
  poste_vise: "",
  poste_autre: "",
  motivation: "",
};

function EmploiPage() {
  const [form, setForm] = useState(initial);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");

  function maj<K extends keyof typeof initial>(champ: K, valeur: string) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    if (!form.nom_complet.trim() || !form.telephone.trim() || !form.niveau_etude.trim() || !form.poste_vise.trim()) {
      setErreur("Veuillez compléter tous les champs obligatoires.");
      return;
    }
    if (form.poste_vise === "Autre" && !form.poste_autre.trim()) {
      setErreur("Précisez le poste visé.");
      return;
    }
    if (form.motivation.trim().length < 20) {
      setErreur("Le texte de motivation doit contenir au moins 20 caractères.");
      return;
    }
    setEnvoiEnCours(true);
    try {
      const { error } = await db.from("candidatures_emploi").insert({
        nom_complet: form.nom_complet.trim(),
        telephone: form.telephone.trim(),
        adresse: form.adresse.trim(),
        niveau_etude: form.niveau_etude.trim(),
        poste_vise: form.poste_vise.trim(),
        poste_autre: form.poste_vise === "Autre" ? form.poste_autre.trim() : "",
        motivation: form.motivation.trim(),
        statut: "en_attente",
      });
      if (error) throw new Error(error.message);
      setEnvoye(true);
      setForm(initial);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#0f172a] px-4 py-8 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
            <ArrowLeft className="size-4" /> Retour à l’accueil
          </Link>
          <div className="flex items-center gap-4">
            <img src={scmLogo} alt="SCM SARL" className="h-14 w-24 rounded-lg bg-white/10 object-contain p-1 sm:h-16 sm:w-28" />
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                <Briefcase className="size-3.5" /> Emploi SCM SARL
              </span>
              <h1 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">Postuler à un emploi</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-white/85 sm:text-base">
            Vous souhaitez rejoindre les équipes de SCM SARL ? Remplissez ce formulaire et notre équipe RH étudiera votre candidature.
          </p>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          {envoye ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-document">
              <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
              <h2 className="mt-4 text-2xl font-black text-emerald-900">Candidature envoyée !</h2>
              <p className="mt-2 text-sm text-emerald-800">
                Votre candidature a bien été reçue. Notre équipe RH vous contactera si votre profil est retenu.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button type="button" onClick={() => setEnvoye(false)} className="primary-action">
                  Nouvelle candidature
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={soumettre} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-document sm:p-8">
              <h2 className="text-xl font-black text-foreground">Formulaire de candidature</h2>
              <p className="text-sm text-muted-foreground">Les champs marqués d’un * sont obligatoires.</p>

              {erreur && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{erreur}</div>
              )}

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Nom complet *</span>
                <input value={form.nom_complet} onChange={(e) => maj("nom_complet", e.target.value)} className="form-control" placeholder="Ex : Jean Mwamba" required />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-foreground">Numéro de téléphone *</span>
                  <input type="tel" value={form.telephone} onChange={(e) => maj("telephone", e.target.value)} className="form-control" placeholder="+243 ..." required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-foreground">Adresse</span>
                  <input value={form.adresse} onChange={(e) => maj("adresse", e.target.value)} className="form-control" placeholder="Quartier, commune, ville" />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Niveau d’études *</span>
                <input value={form.niveau_etude} onChange={(e) => maj("niveau_etude", e.target.value)} className="form-control" placeholder="Ex : CAP, BAC, Licence, Master, Sans diplôme..." required />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Poste visé *</span>
                <select value={form.poste_vise} onChange={(e) => maj("poste_vise", e.target.value)} className="form-control" required>
                  <option value="">— Sélectionnez un poste —</option>
                  {POSTES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>

              {form.poste_vise === "Autre" && (
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-foreground">Précisez le poste *</span>
                  <input value={form.poste_autre} onChange={(e) => maj("poste_autre", e.target.value)} className="form-control" placeholder="Ex : Électricien, Plombier..." required />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Texte de motivation *</span>
                <textarea value={form.motivation} onChange={(e) => maj("motivation", e.target.value)} rows={6} className="form-control min-h-32" placeholder="Présentez-vous brièvement et expliquez pourquoi vous souhaitez rejoindre SCM SARL." required />
              </label>

              <button type="submit" disabled={envoiEnCours} className="primary-action w-full sm:w-auto">
                <Send className="size-4" /> {envoiEnCours ? "Envoi en cours…" : "Envoyer ma candidature"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
