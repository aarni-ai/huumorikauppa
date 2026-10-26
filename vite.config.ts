import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from "vite";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "./src/config/toimitus";

/** index.html:n %TOIMITUS...%-paikat täytetään toimitusehtojen konfiguraatiosta (src/config/toimitus.ts). */
function toimitusehdotHtml(): Plugin {
  const arvot: Record<string, string> = { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI };
  return {
    name: "toimitusehdot-html",
    transformIndexHtml: {
      order: "pre",
      handler: (html) => html.replace(/%(ILMAINEN_RAJA_TEKSTI|TOIMITUSAIKA_TEKSTI|TOIMITUSMAKSU_TEKSTI)%/g, (_m, k: string) => arvot[k]),
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: 'public',
  // Myyjä (api/_lib/yritys.js): MYYJA=uusiku Vercelissä vaihtaa yritystiedot Uusiku Oy:ksi myös selaimessa.
  define: {
    "import.meta.env.VITE_MYYJA": JSON.stringify(process.env.MYYJA || process.env.VITE_MYYJA || ""),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [toimitusehdotHtml(), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    // scripts/prerender.mjs lukee chunkien nimet (tuotesivun ProductPage-chunkin esilataus) ja poistaa manifestin.
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-toast", "@radix-ui/react-tooltip"],
          query: ["@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
}));
