/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { euriChatPlugin } from "./server/euriChatPlugin";

export default defineConfig(({ mode }) => {
  // Third arg "" loads ALL vars (incl. EURI_API_KEY) for server-side use only.
  // Only VITE_* variables are ever exposed to browser code.
  const env = loadEnv(mode, ".", "");
  const useMocks = env.VITE_USE_MOCKS !== "false";
  const backend = env.BACKEND_URL || "http://localhost:8000";
  const apiProxy: Record<string, ProxyOptions> = useMocks ? {} : { "/api": { target: backend, changeOrigin: true } };

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Mock mode has no backend, so the dev server answers /api/chat itself.
      // With the real backend, FastAPI serves /api/chat (same contract) and this plugin is off.
      ...(useMocks
        ? [euriChatPlugin({ apiKey: env.EURI_API_KEY, model: env.EURI_MODEL || "gemini-2.5-flash-lite", baseUrl: env.EURI_BASE_URL || "https://api.euron.one/api/v1/euri" })]
        : []),
    ],
    server: { port: 5173, proxy: apiProxy },
    preview: { proxy: apiProxy },
    build: {
      // three.js (lazy, landing page only) and the mock layer are large by nature.
      chunkSizeWarningLimit: 1000,
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: false,
    },
  };
});
