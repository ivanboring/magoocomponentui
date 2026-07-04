import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";

// Static preview of the component catalog. `astro build` → fully static ./dist.
export default defineConfig({
  site: "http://localhost:4321",
  vite: {
    plugins: [tailwind()],
  },
});
