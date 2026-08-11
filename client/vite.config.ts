import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
// By default, Vite only reads .env files from this directory - the client and server share the same .env file in the root directory
  envDir: resolve(import.meta.dirname, ".."),
  plugins: [
    // Must run before react — it generates routeTree.gen.ts from src/routes
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
});