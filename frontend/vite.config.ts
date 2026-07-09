import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// InsightIQ Vite config
// - Runs on port 3000 to match Kubernetes ingress mapping
// - envPrefix accepts REACT_APP_ (preserved by platform) and VITE_
// - Path alias `@/` -> src/
export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "REACT_APP_"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    // Allow all hosts (preview subdomains) & disable HMR overlay from breaking on external URL
    allowedHosts: true,
    hmr: {
      clientPort: 443,
      protocol: "wss",
    },
  },
});
