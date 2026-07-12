'use client'

import { useState, useCallback } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open: false, title: '', message: '',
    onConfirm: () => {}, onCancel: () => {},
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        ...options, open: true,
        onConfirm: () => { setState(s => ({ ...s, open: false })); resolve(true) },
        onCancel: () => { setState(s => ({ ...s, open: false })); resolve(false) },
      })
    })
  }, [])

  return { confirm, confirmState: state }
}
