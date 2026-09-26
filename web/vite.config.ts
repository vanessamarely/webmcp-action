import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const webMcpHeaders = {
  "Origin-Agent-Cluster": "?1",
  "Permissions-Policy": "tools=(self)",
};

export default defineConfig({
  plugins: [react()],
  server: { headers: webMcpHeaders },
  preview: { headers: webMcpHeaders },
});
