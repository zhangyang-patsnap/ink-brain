import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  cacheDir: "./.astro/cache",
  site: process.env.SITE_URL ?? "https://inkbrain.example",
  integrations: [sitemap()],
  trailingSlash: "always",
  vite: {
    plugins: [
      {
        name: "inkbrain-published-entry",
        apply: "serve",
        configureServer(server) {
          if (process.env.INKBRAIN_SOURCE_PREVIEW === "1") return;
          const origin = process.env.ADMIN_ORIGIN ?? "http://127.0.0.1:4322";
          server.middlewares.use((req, res) => {
            const incoming = new URL(req.url ?? "/", "http://localhost");
            const destination = new URL(origin);
            destination.pathname = incoming.pathname;
            destination.search = incoming.search;
            res.statusCode = 307;
            res.setHeader("Cache-Control", "no-store");
            res.setHeader("Location", destination.href);
            res.end();
          });
        },
      },
    ],
  },
});
