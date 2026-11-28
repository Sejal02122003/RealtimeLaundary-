import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './styles/index.css'
import './styles/pages.css'
import App from './App.jsx'
import { Router } from './routes/router.jsx'
import { StoreProvider } from './context/store.jsx'
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
