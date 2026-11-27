import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from './api.js'

const TOKEN_KEY = 'freshfold-admin-token'
const SessionContext = createContext(null)

// Storage can be blocked; the session then lasts until the page is closed.
function readToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignored, see above.
  }
}

export function SessionProvider({ children }) {
  const [token, setToken] = useState(readToken)

  const signIn = useCallback((value) => {
    writeToken(value)
    setToken(value)
  }, [])

  /** An API call made as the signed-in admin. An expired session signs out. */
  const request = useCallback(
    async (path, options) => {
      try {
        return await api(path, { ...options, token })
      } catch (err) {
        if (err.status === 401) signIn(null)
        throw err
      }
    },
    [token, signIn],
  )

  const signOut = useCallback(async () => {
    // Sign out of this browser even if the server cannot be reached.
    await request('/auth/logout', { method: 'POST' }).catch(() => {})
    signIn(null)
  }, [request, signIn])

  const value = useMemo(
    () => ({ token, signIn, signOut, request }),
    [token, signIn, signOut, request],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export const useSession = () => useContext(SessionContext)
