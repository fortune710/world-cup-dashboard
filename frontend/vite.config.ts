import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiUrl = env.VITE_API_URL || "http://localhost:8000"

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "lodash": "lodash-es",
        "es-toolkit/compat/isPlainObject": "lodash-es/isPlainObject",
        "es-toolkit/compat/sortBy": "lodash-es/sortBy",
        "es-toolkit/compat/get": "lodash-es/get",
        "es-toolkit/compat/throttle": "lodash-es/throttle",
        "es-toolkit/compat/range": "lodash-es/range",
        "es-toolkit/compat/last": "lodash-es/last",
        "es-toolkit/compat/maxBy": "lodash-es/maxBy",
        "es-toolkit/compat/minBy": "lodash-es/minBy",
        "es-toolkit/compat/omit": "lodash-es/omit",
        "es-toolkit/compat/sumBy": "lodash-es/sumBy",
        "es-toolkit/compat/uniqBy": "lodash-es/uniqBy",
      },
    },
    build: {
      sourcemap: true,
    },
    server: {
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  }
})

