const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const CALLBACK = '__onGoogleMapsLoad'

export const hasMapsKey = Boolean(API_KEY)

let loading

function loadScript() {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const params = new URLSearchParams({ key: API_KEY, v: 'weekly', loading: 'async', callback: CALLBACK })
    window[CALLBACK] = resolve
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`
    script.async = true
    script.onerror = () => {
      // Forget the failed attempt so that the next call can retry.
      loading = undefined
      script.remove()
      reject(new Error('Google Maps could not be loaded'))
    }
    document.head.append(script)
  })
  return loading
}

/** Loads Google Maps on first use, then returns one of its libraries, e.g. "maps". */
export async function importLibrary(name) {
  await loadScript()
  return window.google.maps.importLibrary(name)
}

const PLUS_CODE = /^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}\b/
const AREA_TYPES = ['sublocality_level_1', 'sublocality', 'neighborhood', 'locality']

/** Turns geocoder results into the "line" and "area" fields of a saved address. */
export function toAddressFields(results) {
  const result = results.find((r) => !r.types.includes('plus_code')) ?? results[0]
  if (!result) return null

  const area = AREA_TYPES.map((type) =>
    result.address_components.find((c) => c.types.includes(type)),
  ).find(Boolean)?.long_name

  const line = result.formatted_address
    .split(', ')
    .filter((part) => part !== 'India' && !PLUS_CODE.test(part))
    .join(', ')

  return { line, area: area ?? '' }
}
