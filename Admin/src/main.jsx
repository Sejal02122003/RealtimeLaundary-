import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import './pages.css'
import App from './App.jsx'
import { Router } from './router.jsx'
import { SessionProvider } from './session.jsx'
import { ToastProvider } from './components/Toast.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SessionProvider>
      <Router>
        <ToastProvider>
          <App />
        </ToastProvider>
      </Router>
    </SessionProvider>
  </StrictMode>,
)
