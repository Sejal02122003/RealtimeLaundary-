import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

const RouterContext = createContext(null)
const currentUrl = () => window.location.pathname + window.location.search
let activeTransition = null

/**
 * Runs a page change inside a View Transition. The `data-nav` attribute picks
 * the animation in index.css. Browsers without support just swap the page.
 */
function withTransition(kind, update) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (kind === 'none' || reduceMotion || !document.startViewTransition) {
    update()
    return
  }

  const root = document.documentElement
  root.dataset.nav = kind
  const transition = document.startViewTransition(() => flushSync(update))
  activeTransition = transition
  // `ready` rejects when a transition is skipped, which is harmless.
  transition.ready.catch(() => {})
  transition.finished.finally(() => {
    if (activeTransition === transition) delete root.dataset.nav
  })
}

export function Router({ children }) {
  const [url, setUrl] = useState(currentUrl)
  const urlRef = useRef(url)
  const indexRef = useRef(window.history.state?.idx ?? 0)

  useEffect(() => {
    if (window.history.state?.idx === undefined) {
      window.history.replaceState({ idx: indexRef.current }, '')
    }

    const handlePop = (event) => {
      const next = currentUrl()
      const index = event.state?.idx ?? indexRef.current
      const kind = index < indexRef.current ? 'back' : 'forward'
      indexRef.current = index
      if (next === urlRef.current) return
      urlRef.current = next
      withTransition(kind, () => setUrl(next))
    }

    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const navigate = useCallback((to, { replace = false, transition = 'forward', onUpdate } = {}) => {
    if (to === urlRef.current) return
    if (!replace) indexRef.current += 1
    window.history[replace ? 'replaceState' : 'pushState']({ idx: indexRef.current }, '', to)
    urlRef.current = to
    withTransition(transition, () => {
      onUpdate?.()
      setUrl(to)
    })
  }, [])

  const back = useCallback(
    (fallback = '/jobs') => {
      if (indexRef.current > 0) window.history.back()
      else navigate(fallback, { replace: true, transition: 'back' })
    },
    [navigate],
  )

  const value = useMemo(() => {
    const { pathname, searchParams } = new URL(url, window.location.origin)
    return { pathname, query: searchParams, navigate, back }
  }, [url, navigate, back])

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export const useRouter = () => useContext(RouterContext)

export function Link({ to, transition, children, ...props }) {
  const { navigate } = useRouter()

  const handleClick = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
    event.preventDefault()
    navigate(to, { transition })
  }

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}

export function Redirect({ to }) {
  const { navigate } = useRouter()
  useEffect(() => {
    navigate(to, { replace: true, transition: 'none' })
  }, [to, navigate])
  return null
}
