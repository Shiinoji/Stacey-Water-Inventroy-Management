import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Enable React transforms and Tailwind CSS processing in Vite.
  plugins: [react(), tailwindcss()],
});
