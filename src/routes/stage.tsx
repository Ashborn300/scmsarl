import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, GraduationCap, Send } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import scmLogo from "@/assets/scm-logo.jpeg";

export const Route = createFileRoute("/stage")({
  head: () => ({
    meta: [
      { title: "SCM SARL — Demande de stage" },
      { name: "description", content: "Postulez pour un stage chez SCM SARL : remplissez le formulaire officiel de candidature." },
      { property: "og:title", content: "SCM SARL — Demande de stage" },
      { property: "og:description", content: "Formulaire officiel de demande de stage chez SCM SARL." },
    ],
  }),
  component: StagePage,
});

const db = supabase as any;

const initial = {
  nom_complet: "",
  adresse: "",
  telephone: "",
  niveau_etude: "",
  ecole: "",
  motivation: "",
};

function StagePage() {
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
    if (!form.nom_complet.trim() || !form.telephone.trim() || !form.niveau_etude.trim() || !form.ecole.trim()) {
      setErreur("Veuillez compléter tous les champs obligatoires.");
      return;
    }
    if (form.motivation.trim().length < 20) {
      setErreur("Le texte de motivation doit contenir au moins 20 caractères.");
      return;
    }
    setEnvoiEnCours(true);
    try {
      const { error } = await db.from("stagiaires").insert({
        nom_complet: form.nom_complet.trim(),
        adresse: form.adresse.trim(),
        telephone: form.telephone.trim(),
        niveau_etude: form.niveau_etude.trim(),
        ecole: form.ecole.trim(),
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
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] px-4 py-8 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <a href="https://scm-sarl.site/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
            <ArrowLeft className="size-4" /> Retour à l’accueil
          </a>
          <div className="flex items-center gap-4">
            <img src={scmLogo} alt="SCM SARL" className="h-14 w-24 rounded-lg bg-white/10 object-contain p-1 sm:h-16 sm:w-28" />
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                <GraduationCap className="size-3.5" /> Stages SCM SARL
              </span>
              <h1 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">Demande de stage</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-white/85 sm:text-base">
            Vous souhaitez intégrer SCM SARL en tant que stagiaire ? Remplissez ce formulaire et notre équipe étudiera votre dossier dans les plus brefs délais.
          </p>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          {envoye ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-document">
              <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
              <h2 className="mt-4 text-2xl font-black text-emerald-900">Demande envoyée !</h2>
              <p className="mt-2 text-sm text-emerald-800">
                Votre demande de stage a bien été reçue. Si elle est validée, un matricule vous sera attribué.
                Vous pourrez alors vous connecter à votre espace stagiaire.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button type="button" onClick={() => setEnvoye(false)} className="primary-action">
                  Nouvelle demande
                </button>
                <Link to="/stagiaire" className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50">
                  Espace stagiaire
                </Link>
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
                  <span className="mb-1 block text-sm font-semibold text-foreground">Téléphone *</span>
                  <input type="tel" value={form.telephone} onChange={(e) => maj("telephone", e.target.value)} className="form-control" placeholder="+243 ..." required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-foreground">Adresse</span>
                  <input value={form.adresse} onChange={(e) => maj("adresse", e.target.value)} className="form-control" placeholder="Quartier, commune, ville" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-foreground">Niveau d’étude *</span>
                  <input value={form.niveau_etude} onChange={(e) => maj("niveau_etude", e.target.value)} className="form-control" placeholder="Ex : Licence 3, Master 1" required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-foreground">École ou université d’origine *</span>
                  <input value={form.ecole} onChange={(e) => maj("ecole", e.target.value)} className="form-control" placeholder="Ex : Université de Kinshasa" required />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-foreground">Texte de motivation *</span>
                <textarea value={form.motivation} onChange={(e) => maj("motivation", e.target.value)} rows={6} className="form-control min-h-32" placeholder="Présentez-vous brièvement et expliquez pourquoi vous souhaitez effectuer un stage chez SCM SARL." required />
              </label>

              <button type="submit" disabled={envoiEnCours} className="primary-action w-full sm:w-auto">
                <Send className="size-4" /> {envoiEnCours ? "Envoi en cours…" : "Envoyer ma demande"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà stagiaire ?{" "}
            <Link to="/stagiaire" className="font-bold text-primary hover:underline">Accéder à mon espace stagiaire</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
