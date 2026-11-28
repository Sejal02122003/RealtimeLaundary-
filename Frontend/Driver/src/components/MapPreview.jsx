import { destinationOf } from '../utils/utils.js'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

/** The customer's address on a Google map; "Navigate" opens the route. */
export default function MapPreview({ customer }) {
  if (!API_KEY) return <Illustration />

  const params = new URLSearchParams({ key: API_KEY, q: destinationOf(customer), zoom: '15' })

  return (
    <iframe
      className="map map--live"
      title={`Map of ${customer.name}'s address`}
      src={`https://www.google.com/maps/embed/v1/place?${params}`}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  )
}

/** Shown when no Maps API key is configured. */
function Illustration() {
  return (
    <svg
      className="map"
      viewBox="0 0 360 114"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Route illustration"
    >
      <rect width="360" height="114" fill="#dcebe5" />
      <path d="M0 31H360M0 85H360M72 0V114M236 0V114" stroke="#fff" strokeWidth="10" />
      <path
        d="M72 103V85H236V33"
        fill="none"
        stroke="#1750d6"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="72" cy="103" r="7" fill="#112340" />
      <circle cx="236" cy="33" r="9" fill="#0b6650" stroke="#fff" strokeWidth="3" />
    </svg>
  )
}
