export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = 'No se pudo completar la petición.'
    try {
      const body = (await response.json()) as { error?: unknown }
      if (typeof body.error === 'string') message = body.error
    } catch {
      // The server may have returned an empty or non-JSON error.
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
