import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefcaseBusiness, CalendarDays, IdCard, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import scmLogo from "@/assets/scm-logo.jpeg";

type EmployePublic = {
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

function QrEmployePage() {
  const { employeId } = Route.useParams();
  const [employe, setEmploye] = useState<EmployePublic | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    supabase.from("employes").select("nom_complet, matricule, genre, poste, telephone, email, adresse, date_admission, statut, photo_profil").eq("id", employeId).maybeSingle()
      .then(({ data }) => setEmploye(data as EmployePublic | null))
      .finally(() => setChargement(false));
  }, [employeId]);

  if (chargement) return <main className="min-h-screen bg-background p-5 text-foreground">Chargement…</main>;
  if (!employe) return <main className="min-h-screen bg-background p-5 text-foreground"><Link to="/" className="text-primary">Retour</Link><h1 className="mt-6 text-2xl font-black">Employé introuvable</h1></main>;

  const infos = [
    [IdCard, "Matricule", employe.matricule],
    [UserRound, "Genre", employe.genre],
    [BriefcaseBusiness, "Poste", employe.poste],
    [Phone, "Téléphone", employe.telephone],
    [Mail, "Email", employe.email],
    [MapPin, "Adresse", employe.adresse],
    [CalendarDays, "Admission", employe.date_admission || "—"],
  ] as const;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-document">
        <div className="bg-tool-gradient p-6 text-tool-foreground tool-qr-code">
          <img src={scmLogo} alt="Logo SCM SARL" className="h-16 w-32 rounded-xl bg-card object-contain p-2" />
          <h1 className="mt-6 text-3xl font-black">{employe.nom_complet || "Employé SCM"}</h1>
          <p className="mt-2 text-sm font-semibold opacity-90">Profil employé public · SCM SARL</p>
        </div>
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {employe.photo_profil ? <img src={employe.photo_profil} alt={employe.nom_complet} className="size-28 rounded-2xl object-cover" /> : <div className="flex size-28 items-center justify-center rounded-2xl bg-muted"><UserRound className="size-10 text-muted-foreground" /></div>}
            <div>
              <p className="text-sm font-bold uppercase text-muted-foreground">Statut</p>
              <p className="mt-1 text-xl font-black text-foreground">{employe.statut || "—"}</p>
            </div>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {infos.map(([Icone, label, valeur]) => <article key={label} className="rounded-2xl border border-border bg-muted/60 p-4"><Icone className="mb-3 size-5 text-primary" /><p className="text-xs font-black uppercase text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-bold text-foreground">{valeur || "—"}</p></article>)}
          </div>
        </div>
      </section>
    </main>
  );
}

import { useEffect, useState } from "react";