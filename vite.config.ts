// Configuration adaptée pour un déploiement Netlify.
// On désactive le plugin Cloudflare et on ajoute le plugin officiel
// @netlify/vite-plugin-tanstack-start qui génère la structure attendue par Netlify.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import netlify from "@netlify/vite-plugin-tanstack-start";

export default defineConfig({
  cloudflare: false,
  plugins: [netlify()],
});
