import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 800

/** A number that counts up to its value, and on to the next one when it changes. */
export default function CountUp({ value, format = String }) {
  const [shown, setShown] = useState(0)
  const latest = useRef(0)

  useEffect(() => {
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = latest.current
    const start = performance.now()
    let frame

    const tick = (now) => {
      const t = instant ? 1 : Math.min(Math.max((now - start) / DURATION_MS, 0), 1)
      const eased = 1 - (1 - t) ** 3
      latest.current = t < 1 ? Math.round(from + (value - from) * eased) : value
      setShown(latest.current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return format(shown)
}
