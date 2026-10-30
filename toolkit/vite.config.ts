import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { buildApp } from "./src_server/app.js";

// Express API mounted vào chính Vite dev server (chỉ khi `npm run dev`).
// `apply: "serve"` → KHÔNG chạy khi `vite build`, không kéo code server vào bản build UI.
function toolkitServer(): Plugin {
  return {
    name: "toolkit-server",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api", buildApp());
    }
  };
}

export default defineConfig({
  plugins: [vue(), toolkitServer()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
