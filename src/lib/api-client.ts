class ApiError extends Error {
  status: number
  details?: Record<string, unknown>

  constructor(message: string, status: number, details?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })

  let data: Record<string, unknown> = {}
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    data = await res.json()
  } else if (!res.ok) {
    throw new ApiError(`Request failed with status ${res.status}`, res.status)
  }

  if (!res.ok) {
    throw new ApiError(
      (data.error as string) || `Request failed with status ${res.status}`,
      res.status,
      data.details as Record<string, unknown> | undefined
    )
  }

  return data as T
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) }),
}

export { ApiError }
