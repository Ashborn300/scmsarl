import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, BriefcaseBusiness, CalendarDays, IdCard, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import scmLogo from "@/assets/scm-logo.jpeg";

type EmployePublic = {
  id: string;
  nom_complet: string;
  matricule: string;
  genre: string;
  poste: string;
  telephone: string;
  email: string;
  adresse: string;
  date_admission: string | null;
  statut: string;
  photo_profil: string;
};

export const Route = createFileRoute("/qr-employe/$employeId")({
  component: QrEmployePage,
});

function formaterDate(valeur: string | null) {
  if (!valeur) return "—";
  try {
    return new Date(valeur).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return valeur;
  }
}

function QrEmployePage() {
  const { employeId } = Route.useParams();
  const [employe, setEmploye] = useState<EmployePublic | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function chargerEmploye() {
      setChargement(true);
      const { data, error } = await supabase.rpc("scm_get_employe_public", { _employe_id: employeId });
      if (error) console.error("Erreur chargement employé public", error);
      const ligne = Array.isArray(data) ? (data[0] as EmployePublic | undefined) : (data as EmployePublic | null);
      setEmploye(ligne ?? null);
      setChargement(false);
    }
    chargerEmploye();
  }, [employeId]);

  if (chargement) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-bold text-muted-foreground">Chargement du profil…</p>
        </div>
      </main>
    );
  }

  if (!employe) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4 py-10 text-foreground">
        <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-document">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
            <UserRound className="size-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-black">Profil indisponible</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ce QR code ne correspond à aucun employé actif chez SCM SARL, ou son profil a été retiré.</p>
          <Link to="/" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Retour à l'accueil</Link>
        </section>
      </main>
    );
  }

  const initiales = (employe.nom_complet || "SCM").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

  const infos: ReadonlyArray<readonly [typeof IdCard, string, string]> = [
    [IdCard, "Matricule", employe.matricule || "—"],
    [BriefcaseBusiness, "Poste", employe.poste || "—"],
    [UserRound, "Genre", employe.genre || "—"],
    [CalendarDays, "Date d'admission", formaterDate(employe.date_admission)],
    [Phone, "Téléphone", employe.telephone || "—"],
    [Mail, "Email", employe.email || "—"],
    [MapPin, "Adresse", employe.adresse || "—"],
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-document">
        {/* En-tête entreprise */}
        <header className="relative overflow-hidden bg-tool-gradient p-6 text-tool-foreground sm:p-8">
          <div className="absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-10 size-44 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img src={scmLogo} alt="Logo SCM SARL" className="h-14 w-14 rounded-2xl bg-card object-contain p-1.5 shadow-lg" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-90">SCM SARL</p>
                <p className="text-sm font-semibold opacity-80">Profil officiel employé</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider backdrop-blur-sm">
              <ShieldCheck className="size-3.5" /> Vérifié
            </span>
          </div>
        </header>

        {/* Identité */}
        <div className="border-b border-border bg-muted/40 px-6 py-6 sm:px-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            {employe.photo_profil ? (
              <img src={employe.photo_profil} alt={employe.nom_complet} className="size-28 rounded-2xl border-4 border-card object-cover shadow-lg sm:size-32" />
            ) : (
              <div className="flex size-28 items-center justify-center rounded-2xl border-4 border-card bg-primary text-3xl font-black text-primary-foreground shadow-lg sm:size-32">
                {initiales || <UserRound className="size-10" />}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-black leading-tight text-foreground sm:text-3xl">{employe.nom_complet || "Employé SCM"}</h1>
              <p className="mt-1 text-sm font-bold text-primary">{employe.poste || "Membre de l'équipe"}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
                  <BadgeCheck className="size-3.5" /> {employe.statut || "Actif"}
                </span>
                {employe.matricule && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1 text-xs font-bold text-muted-foreground">
                    <IdCard className="size-3.5" /> {employe.matricule}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Informations professionnelles</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {infos.map(([Icone, label, valeur]) => (
              <article key={label} className="group flex items-start gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icone className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="mt-0.5 break-words text-sm font-bold text-foreground">{valeur}</p>
                </div>
              </article>
            ))}
          </div>

          <footer className="mt-8 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-center">
            <p className="text-xs font-semibold text-muted-foreground">Profil authentifié par <strong className="text-foreground">SCM SARL</strong> — généré via QR code officiel.</p>
          </footer>
        </div>
      </section>
    </main>
  );
}
