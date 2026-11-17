import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

// `npm run build:file` sets SINGLE=1: everything (scripts, styles, fonts) is inlined into
// one HTML file that opens with a double-click, no server needed.
const single = process.env.SINGLE === "1"

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile()] : [])],
  server: { port: 5191 },
  build: single ? { outDir: "dist-single", assetsInlineLimit: 100_000_000 } : {},
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
})
