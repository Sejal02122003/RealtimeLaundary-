import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from './session.jsx'

/**
 * Loads data from the API. With `interval`, it also refreshes while the app is
 * on screen, so new requests show up without a manual reload.
 */
export function useResource(path, { interval } = {}) {
  const { request } = useSession()
  const [state, setState] = useState({ data: null, error: null })
  const latest = useRef(0)

  const reload = useCallback(async () => {
    const id = ++latest.current
    try {
      const data = await request(path)
      // A slower, older response must not replace a newer one.
      if (id === latest.current) setState({ data, error: null })
    } catch (error) {
      // Keep showing the last good data if a refresh fails.
      if (id === latest.current) setState((s) => ({ data: s.data, error }))
    }
  }, [path, request])

  useEffect(() => {
    reload()
    if (!interval) return undefined

    const refresh = () => document.visibilityState === 'visible' && reload()
    const timer = setInterval(refresh, interval)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [reload, interval])

  return { ...state, reload }
}
