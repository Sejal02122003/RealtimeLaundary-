// Leave VITE_API_URL empty in development; the Vite proxy handles /api.
const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/driver`

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function api(path, { method = 'GET', body, token, signal } = {}) {
  const isForm = body instanceof FormData
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body && !isForm) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: isForm || !body ? body : JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('No connection. Check your internet and try again.', 0)
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok || !data) {
    throw new ApiError(data?.error ?? 'The server is not responding. Try again.', response.status)
  }
  return data
}

export function toFormData(fields) {
  const form = new FormData()
  Object.entries(fields).forEach(([key, value]) => form.append(key, value))
  return form
}
