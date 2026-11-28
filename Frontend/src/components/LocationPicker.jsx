import { useEffect, useRef, useState } from 'react'
import { importLibrary, toAddressFields } from '../maps.js'
import Icon from './Icon.jsx'
import './LocationPicker.css'

const DEFAULT_CENTER = { lat: 22.7533, lng: 75.8937 } // Vijay Nagar, Indore
const SEARCH_DELAY_MS = 300
// About 5 m. Smaller shifts of the map are not treated as a new spot.
const MIN_MOVE_DEGREES = 0.00005

const hasMoved = (a, b) =>
  Math.abs(a.lat - b.lat) > MIN_MOVE_DEGREES || Math.abs(a.lng - b.lng) > MIN_MOVE_DEGREES

/**
 * A map with a fixed pin in its centre. Moving the map (by dragging, searching or
 * using the device location) calls onPick with the spot and its address.
 */
export default function LocationPicker({ onPick }) {
  const canvas = useRef(null)
  const map = useRef(null)
  const onPickRef = useRef(onPick)
  const session = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ready | failed
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [message, setMessage] = useState('')
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    onPickRef.current = onPick
  }, [onPick])

  useEffect(() => {
    let cancelled = false
    let listener
    let request = 0

    // Google calls this when it rejects the API key.
    window.gm_authFailure = () => setStatus('failed')

    async function setUp() {
      const [{ Map }, { Geocoder }] = await Promise.all([
        importLibrary('maps'),
        importLibrary('geocoding'),
      ])
      if (cancelled) return

      const geocoder = new Geocoder()
      let picked = DEFAULT_CENTER

      map.current = new Map(canvas.current, {
        center: DEFAULT_CENTER,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: 'greedy',
      })

      listener = map.current.addListener('idle', async () => {
        const location = map.current.getCenter().toJSON()
        if (!hasMoved(location, picked)) return
        picked = location

        const current = ++request
        setMessage('Finding the address…')
        let fields = null
        try {
          const { results } = await geocoder.geocode({ location })
          fields = toAddressFields(results)
        } catch {
          // The spot is still saved; the address can be typed by hand.
        }
        if (cancelled || current !== request) return
        setMessage(
          fields
            ? 'Address filled in below. Add your flat or house number.'
            : 'No address found for this spot. Type it below.',
        )
        onPickRef.current({ location, ...fields })
      })

      setStatus('ready')
    }

    setUp().catch(() => !cancelled && setStatus('failed'))

    return () => {
      cancelled = true
      listener?.remove()
    }
  }, [])

  useEffect(() => {
    const input = query.trim()
    if (status !== 'ready' || input.length < 3) return

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } = await importLibrary('places')
        // One token covers the typing and the selection, which Google bills as one session.
        session.current ??= new AutocompleteSessionToken()
        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: session.current,
          includedRegionCodes: ['in'],
          locationBias: { center: map.current.getCenter().toJSON(), radius: 30000 },
        })
        if (cancelled) return
        const found = response.suggestions.map((s) => s.placePrediction).filter(Boolean)
        setSuggestions(found)
        setMessage(found.length ? '' : 'No places match that search.')
      } catch {
        if (!cancelled) setMessage('Search is not available right now.')
      }
    }, SEARCH_DELAY_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, status])

  const moveTo = (location) => {
    map.current.setZoom(17)
    map.current.panTo(location)
  }

  const choose = async (prediction) => {
    setQuery('')
    setSuggestions([])
    try {
      const place = prediction.toPlace()
      await place.fetchFields({ fields: ['location'] })
      session.current = null
      moveTo(place.location)
    } catch {
      setMessage('Could not open that place. Try another one.')
    }
  }

  const locate = () => {
    if (!navigator.geolocation) return setMessage('This device cannot share its location.')
    setLocating(true)
    setMessage('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false)
        moveTo({ lat: coords.latitude, lng: coords.longitude })
      },
      (error) => {
        setLocating(false)
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Location access is blocked. Search for your address instead.'
            : 'Could not get your location. Search for your address instead.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  if (status === 'failed') {
    return <p className="form__hint">The map is not available. Type your address below.</p>
  }

  return (
    <div className="picker">
      <input
        type="search"
        className="picker__search"
        aria-label="Search for a place"
        placeholder="Search for your building or street"
        autoComplete="off"
        disabled={status !== 'ready'}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setMessage('')
          if (e.target.value.trim().length < 3) setSuggestions([])
        }}
        onKeyDown={(e) => {
          // Enter picks the first match rather than submitting the address form.
          if (e.key !== 'Enter') return
          e.preventDefault()
          if (suggestions[0]) choose(suggestions[0])
        }}
      />

      {suggestions.length > 0 && (
        <ul className="picker__results">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button type="button" onClick={() => choose(s)}>
                {s.text.toString()}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="picker__map">
        <div ref={canvas} className="picker__canvas" />
        {status === 'ready' ? (
          <span className="picker__pin">
            <Icon name="pin" size={34} strokeWidth={2.4} />
          </span>
        ) : (
          <p className="picker__loading">Loading map…</p>
        )}
      </div>

      <button
        type="button"
        className="soft-button"
        disabled={status !== 'ready' || locating}
        onClick={locate}
      >
        {locating ? 'Finding you…' : 'Use my current location'}
      </button>

      {message && (
        <p className="form__hint" role="status">
          {message}
        </p>
      )}
    </div>
  )
}
