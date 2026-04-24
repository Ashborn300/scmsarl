import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-bold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">La page demandée n’existe pas ou a été déplacée.</p>
        <div className="mt-6">
          <Link to="/" className="primary-action">Retour à l’accueil</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SCM SARL — Gestion de documents BTP" },
      { name: "description", content: "Application professionnelle en  pour générer factures, devis, reçus, contrats et descriptions de projets SCM SARL." },
      { name: "author", content: "SCM SARL" },
      { property: "og:title", content: "SCM SARL — Gestion de documents BTP" },
      { property: "og:description", content: "Application professionnelle en  pour générer factures, devis, reçus, contrats et descriptions de projets SCM SARL." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "SCM SARL — Gestion de documents BTP" },
      { name: "twitter:description", content: "Application professionnelle en  pour générer factures, devis, reçus, contrats et descriptions de projets SCM SARL." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/69d2124e-b377-4d29-a093-375bbc14d24f/id-preview-9174ecc7--738ebd6f-830b-4466-84dc-f39e94facf3e.lovable.app-1776994836974.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/69d2124e-b377-4d29-a093-375bbc14d24f/id-preview-9174ecc7--738ebd6f-830b-4466-84dc-f39e94facf3e.lovable.app-1776994836974.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() { return <Outlet />; }
