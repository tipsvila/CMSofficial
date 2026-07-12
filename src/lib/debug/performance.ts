export async function trackApiCall<T>(endpoint: string, fetchFn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    return await fetchFn()
  } finally {
    const duration = Math.round(performance.now() - start)
    if (duration > 1000) {
      console.warn(`[API] ${endpoint} - ${duration}ms`)
    }
  }
}
