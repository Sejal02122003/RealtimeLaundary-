import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import './pages/pages.css'
import App from './App.jsx'
import { Router } from './router.jsx'
import { StoreProvider } from './store.jsx'
import { ToastProvider } from './components/Toast.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <Router>
        <ToastProvider>
          <App />
        </ToastProvider>
      </Router>
    </StoreProvider>
  </StrictMode>,
)
