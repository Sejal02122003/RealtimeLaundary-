import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from './api.js'

const TOKEN_KEY = 'freshfold-driver-token'
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
  const [driver, setDriver] = useState(null)

  const signIn = useCallback((session) => {
    writeToken(session.token)
    setToken(session.token)
    setDriver(session.driver)
  }, [])

  const clear = useCallback(() => {
    writeToken(null)
    setToken(null)
    setDriver(null)
  }, [])

  /** An API call made as the signed-in driver. An expired session signs out. */
  const request = useCallback(
    async (path, options) => {
      try {
        const data = await api(path, { ...options, token })
        if (data?.driver) setDriver(data.driver)
        return data
      } catch (err) {
        if (err.status === 401) clear()
        throw err
      }
    },
    [token, clear],
  )

  const signOut = useCallback(async () => {
    // Sign out on this phone even if the server cannot be reached.
    await request('/auth/logout', { method: 'POST' }).catch(() => {})
    clear()
  }, [request, clear])

  const value = useMemo(
    () => ({ token, driver, signIn, signOut, request }),
    [token, driver, signIn, signOut, request],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export const useSession = () => useContext(SessionContext)
