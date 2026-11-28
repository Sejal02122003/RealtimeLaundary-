// Leave VITE_API_URL empty in development; the Vite proxy handles /api.
const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/admin`

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

/** Set `file: true` to receive a download or document as a Blob. */
export async function api(path, { method = 'GET', body, token, file = false } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body && JSON.stringify(body),
    })
  } catch {
    throw new ApiError('No connection. Check your internet and try again.', 0)
  }

  if (response.status === 204) return null
  if (file && response.ok) return response.blob()
  const data = await response.json().catch(() => null)
  if (!response.ok || !data) {
    throw new ApiError(data?.error ?? 'The server is not responding. Try again.', response.status)
  }
  return data
}
