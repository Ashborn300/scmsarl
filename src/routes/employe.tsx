import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, UserRound } from "lucide-react";

export const Route = createFileRoute("/employe")({
  head: () => ({
    meta: [
      { title: "Employé — SCM SARL" },
      { name: "description", content: "Page employé SCM SARL prête à recevoir du contenu." },
      { property: "og:title", content: "Employé — SCM SARL" },
      { property: "og:description", content: "Espace employé SCM SARL prêt pour les prochains contenus." },
    ],
  }),
  component: EmployePage,
});

function EmployePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="construction-grid mx-auto flex min-h-[70vh] max-w-7xl items-center rounded-3xl border border-border bg-card/80 p-6 shadow-document backdrop-blur sm:p-10">
        <div className="max-w-2xl">
          <Link to="/" className="mini-button mb-6">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
          <div className="tool-green mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-tool-gradient text-tool-foreground shadow-tool">
            <UserRound className="size-7" />
          </div>
          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">SCM SARL</p>
          <h1 className="mt-2 text-4xl font-black text-foreground sm:text-5xl">Employé</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Cette page est prête. Le contenu employé pourra être ajouté ici à la prochaine étape.
          </p>
        </div>
      </section>
    </main>
  );
}
