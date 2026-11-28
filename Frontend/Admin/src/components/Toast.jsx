import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('')
  const timer = useRef(null)

  const showToast = useCallback((text) => {
    clearTimeout(timer.current)
    setMessage(text)
    timer.current = setTimeout(() => setMessage(''), 2500)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-region" role="status">
        {message && <div className="toast">{message}</div>}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
