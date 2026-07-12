'use client'

import { useState, useCallback, useRef } from 'react'

interface ImportProgress {
  status: 'idle' | 'importing' | 'done' | 'error'
  imported: number
  total: number
  percent: number
  skipped: number
  error: string | null
}

export function useCSVImport() {
  const [progress, setProgress] = useState<ImportProgress>({
    status: 'idle', imported: 0, total: 0, percent: 0, skipped: 0, error: null,
  })
  const abortRef = useRef<AbortController | null>(null)
  const progressRef = useRef(progress)
  progressRef.current = progress

  const importCSV = useCallback(async (url: string, file: File): Promise<{ done: boolean; imported: number; skipped: number } | { error: string }> => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setProgress({ status: 'importing', imported: 0, total: 0, percent: 0, skipped: 0, error: null })

    try {
      const formData = new FormData()
      formData.append('file', file)

      setProgress(p => ({ ...p, status: 'importing' }))
      const res = await fetch(url, { method: 'POST', body: formData, signal: controller.signal })

      let result: Record<string, unknown>
      try {
        result = await res.json()
      } catch {
        setProgress(p => ({ ...p, status: 'error', error: 'Invalid server response' }))
        return { error: 'Invalid server response' }
      }

      if (!res.ok || !result.success) {
        const msg = (result.error as string) || 'Import failed'
        setProgress(p => ({ ...p, status: 'error', error: msg }))
        return { error: msg }
      }

      const imported = (result.imported as number) || 0
      setProgress({ status: 'done', imported, total: imported, percent: 100, skipped: 0, error: null })
      return { done: true, imported, skipped: 0 }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return { error: 'cancelled' }
      const msg = err instanceof Error ? err.message : 'Import failed'
      setProgress(p => ({ ...p, status: 'error', error: msg }))
      return { error: msg }
    }
  }, [])

  const cancel = useCallback(() => { abortRef.current?.abort() }, [])
  const reset = useCallback(() => {
    setProgress({ status: 'idle', imported: 0, total: 0, percent: 0, skipped: 0, error: null })
  }, [])

  return { progress, importCSV, cancel, reset }
}
