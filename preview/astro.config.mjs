import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";

// Static preview of the component catalog. `astro build` → fully static ./dist.
//
// For GitHub Pages project sites the app is served from /<repo>/, so pass the base at
// build time (the deploy workflow does this automatically):
//   SITE=https://<user>.github.io BASE=/<repo>/ pnpm --filter preview build
// Locally BASE defaults to "/" so nothing changes.
const SITE = process.env.SITE || "http://localhost:4321";
const BASE = process.env.BASE || "/";

export default defineConfig({
  site: SITE,
  base: BASE,
  vite: {
    plugins: [tailwind()],
  },
});
