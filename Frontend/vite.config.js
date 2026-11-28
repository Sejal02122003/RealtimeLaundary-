import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// One server and one build for all three apps. Each app has its own page:
//   index.html -> User     driver.html -> Driver     admin.html -> Admin
const page = (name) => fileURLToPath(new URL(name, import.meta.url))

// Sends every address under /driver and /admin to that app's page, so that
// opening or refreshing an inner page such as /driver/jobs works.
function appPages() {
  const rewrite = (req, _res, next) => {
    const app = req.url.match(/^\/(driver|admin)(?=[/?]|$)/)?.[1]
    if (app && req.headers.accept?.includes('text/html')) req.url = `/${app}.html`
    next()
  }
  const register = (server) => {
    server.middlewares.use(rewrite)
  }
  return { name: 'app-pages', configureServer: register, configurePreviewServer: register }
}

// The apps call /api on their own origin and Vite forwards it to the backend.
const proxy = { '/api': process.env.API_PROXY ?? 'http://localhost:5000' }

export default defineConfig({
  plugins: [react(), appPages()],
  server: { port: 5173, strictPort: true, proxy },
  preview: { port: 4173, strictPort: true, proxy },
  build: {
    rolldownOptions: { input: ['index.html', 'driver.html', 'admin.html'].map(page) },
  },
})
