'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/components/toast'

interface UseMutationOptions<TData, TVars> {
  mutationFn: (vars: TVars) => Promise<TData>
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
}

export function useMutation<TData, TVars = void>({
  mutationFn, onSuccess, onError, successMessage, errorMessage,
}: UseMutationOptions<TData, TVars>) {
  const [data, setData] = useState<TData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const mutate = useCallback(async (vars: TVars) => {
    setLoading(true)
    setError(null)
    try {
      const result = await mutationFn(vars)
      setData(result)
      if (successMessage) toast('success', successMessage)
      onSuccess?.(result)
      return result
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Unknown error')
      setError(e)
      toast('error', errorMessage || e.message)
      onError?.(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [mutationFn, successMessage, errorMessage, toast, onSuccess, onError])

  const reset = useCallback(() => { setData(null); setError(null); setLoading(false) }, [])

  return { data, loading, error, mutate, reset }
}
