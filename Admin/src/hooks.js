import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from './session.jsx'
import { useToast } from './components/Toast.jsx'

/**
 * Loads data from the API. With `interval`, it also refreshes while the tab is
 * visible. Pass a null path to load nothing.
 */
export function useResource(path, { interval } = {}) {
  const { request } = useSession()
  const [state, setState] = useState({ data: null, error: null, path: null })
  const latest = useRef(0)

  const reload = useCallback(async () => {
    const id = ++latest.current
    if (!path) return
    try {
      const data = await request(path)
      // A slower, older response must not replace a newer one.
      if (id === latest.current) setState({ data, error: null, path })
    } catch (error) {
      // Keep showing the last good data if a refresh fails.
      if (id === latest.current) setState((s) => ({ ...s, error }))
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

  const replace = useCallback(
    (data) => {
      latest.current += 1
      setState({ data, error: null, path })
    },
    [path],
  )

  return { ...state, stale: state.path !== path, reload, replace }
}

/**
 * Sends a change to the API, one at a time. Shows the outcome as a toast and
 * returns the response, or null if it failed.
 */
export function useAction() {
  const { request } = useSession()
  const showToast = useToast()
  const [busy, setBusy] = useState(false)
  const running = useRef(false)

  const run = useCallback(
    async (path, { method = 'POST', body, message } = {}) => {
      if (running.current) return null
      running.current = true
      setBusy(true)
      try {
        const data = (await request(path, { method, body })) ?? {}
        if (message) showToast(typeof message === 'function' ? message(data) : message)
        return data
      } catch (err) {
        showToast(err.message)
        return null
      } finally {
        running.current = false
        setBusy(false)
      }
    },
    [request, showToast],
  )

  return [run, busy]
}

/** Delays a fast-changing value, such as search text. */
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/** Saves a file from the API to the computer. */
export function useDownload() {
  const { request } = useSession()
  const showToast = useToast()

  return useCallback(
    async (path, filename) => {
      try {
        const blob = await request(path, { file: true })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        // Give the browser time to start the download.
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      } catch (err) {
        showToast(err.message)
      }
    },
    [request, showToast],
  )
}
