// Configuration adaptée pour un déploiement Netlify.
// On désactive le plugin Cloudflare et on cible « netlify » pour TanStack Start.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    target: "netlify",
  },
});
