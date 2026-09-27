import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The notebook code is plain ESM that pulls in `ajv` (a CommonJS package) for
// validation. Pre-bundling ajv keeps Vite from tripping on it in the browser.
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["ajv/dist/2020.js"],
  },
});
