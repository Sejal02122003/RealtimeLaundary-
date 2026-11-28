import { useId } from 'react'

const SLOTS = [
  'M82 182q22 8 52 10',
  'M86 206q21 8 49 10',
  'M91 230q19 7 44 9',
]

/** The laundry basket artwork. Drawn as SVG so it stays sharp at every size. */
export default function Basket({ className, sparkle = false }) {
  const id = useId()
  const fill = (name) => `url(#${id}${name})`

  return (
    <svg className={className} viewBox="0 0 320 300" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}body`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9d5d0" />
          <stop offset="0.28" stopColor="#fbfaf8" />
          <stop offset="0.65" stopColor="#ece9e4" />
          <stop offset="1" stopColor="#bdb8b4" />
        </linearGradient>
        <linearGradient id={`${id}rim`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#efece7" />
          <stop offset="1" stopColor="#cbc6c1" />
        </linearGradient>
        <linearGradient id={`${id}towel`} x1="0.2" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#8fd0ff" />
          <stop offset="0.5" stopColor="#4a9cf0" />
          <stop offset="1" stopColor="#2266c4" />
        </linearGradient>
        <linearGradient id={`${id}drape`} x1="0" y1="0" x2="1" y2="0.8">
          <stop offset="0" stopColor="#72bcfb" />
          <stop offset="0.55" stopColor="#3b8ce6" />
          <stop offset="1" stopColor="#1e5cb4" />
        </linearGradient>
        <radialGradient id={`${id}shadow`}>
          <stop offset="0" stopColor="#233152" stopOpacity="0.32" />
          <stop offset="1" stopColor="#233152" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}star`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.35" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e8dccb" />
        </linearGradient>
      </defs>

      <ellipse cx="160" cy="272" rx="125" ry="22" fill={fill('shadow')} />

      {/* Basket body and the inside of its opening */}
      <path
        d="M56 148L78 244q5 26 82 26t82-26l22-96z"
        fill={fill('body')}
      />
      <ellipse cx="160" cy="148" rx="106" ry="32" fill="#aaa5a2" />
      <path
        d="M54 148a106 32 0 0 1 212 0"
        fill="none"
        stroke={fill('rim')}
        strokeWidth="16"
      />

      <g fill="none" strokeLinecap="round">
        {SLOTS.map((d) => (
          <g key={d}>
            <path d={d} stroke="#fff" strokeWidth="11" transform="translate(0 2.5)" />
            <path d={d} stroke="#c3beb9" strokeWidth="10" />
          </g>
        ))}
      </g>

      {/* Folded towels, bottom to top */}
      <path
        d="M68 142c-4-24 14-38 44-42 36-6 82-5 112 3 25 7 34 24 27 43-8 20-48 28-95 27-50-1-85-10-88-31z"
        fill={fill('towel')}
      />
      <path
        d="M76 112c-2-23 20-35 50-37 32-3 68-1 90 8 21 9 25 29 11 40-17 14-50 17-85 15-39-2-65-9-66-26z"
        fill={fill('towel')}
      />
      <path
        d="M98 78c0-23 27-38 61-38s58 14 58 34c0 22-28 33-62 32-34 0-57-9-57-28z"
        fill={fill('towel')}
      />
      <g fill="none" stroke="#1d5db6" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round">
        <path d="M82 124c20 15 62 20 100 15" />
        <path d="M106 90c17 12 50 15 80 7" />
        <path d="M126 70c8-12 36-18 54-8 12 7 7 19-9 19-12 0-17-9-9-14" />
      </g>
      <path
        d="M114 64c10-13 28-18 44-17M88 103c7-10 18-14 30-16"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.4"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Front half of the rim */}
      <path
        d="M54 148a106 32 0 0 0 212 0"
        fill="none"
        stroke={fill('rim')}
        strokeWidth="16"
      />

      {/* Towel hanging over the rim */}
      <path
        d="M173 142c14-18 62-27 83-13 10 7 13 17 12 29l-8 62c-2 11-12 14-24 17l-36 7c-14 2-21-4-22-15l-9-66c-1-8 0-15 4-21z"
        fill="#17366b"
        opacity="0.16"
        transform="translate(-5 6)"
      />
      <path
        d="M173 142c14-18 62-27 83-13 10 7 13 17 12 29l-8 62c-2 11-12 14-24 17l-36 7c-14 2-21-4-22-15l-9-66c-1-8 0-15 4-21z"
        fill={fill('drape')}
      />
      <path
        d="M174 160c16 13 66 5 90-16"
        fill="none"
        stroke="#1d5db6"
        strokeOpacity="0.5"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M184 207c20 9 52 2 76-13M186 217c20 8 50 2 72-11"
        fill="none"
        stroke="#a9d8ff"
        strokeOpacity="0.55"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M184 141c16-12 45-17 63-10"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.4"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {sparkle && (
        <path
          className="sparkle"
          d="M273 22c5 25 12 33 37 39-25 6-32 14-37 39-5-25-12-33-37-39 25-6 32-14 37-39z"
          fill={fill('star')}
          stroke={fill('star')}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
