import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/plus-jakarta-sans'
import './styles/index.css'
import './styles/pages.css'
import App from './App.jsx'
import { Router } from './routes/router.jsx'
import { SessionProvider } from './context/session.jsx'
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
