'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: string; type: ToastType; message: string }

const listeners: Array<() => void> = []
let toasts: Toast[] = []

function emitChange() { for (const l of listeners) l() }
function addToast(type: ToastType, message: string) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { id, type, message }]
  emitChange()
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); emitChange() }, 4000)
}
function removeToast(id: string) { toasts = toasts.filter((t) => t.id !== id); emitChange() }

export function useToast() {
  const [, setUpdate] = useState(0)
  const listenerRef = useRef(() => setUpdate((n) => n + 1))
  useEffect(() => {
    const l = listenerRef.current
    listeners.push(l)
    return () => { const i = listeners.indexOf(l); if (i >= 0) listeners.splice(i, 1) }
  }, [])
  const toast = useCallback((type: ToastType, message: string) => { addToast(type, message) }, [])
  return { toast }
}

const icons = {
  success: <CheckCircle size={16} className="text-[var(--success)]" />,
  error: <AlertCircle size={16} className="text-[var(--danger)]" />,
  info: <Info size={16} className="text-[var(--info)]" />,
}
const bgColors = {
  success: 'bg-[var(--success-light)] border-[var(--success)]',
  error: 'bg-[var(--danger-light)] border-[var(--danger)]',
  info: 'bg-[var(--info-light)] border-[var(--info)]',
}

export function ToastContainer() {
  const [, setUpdate] = useState(0)
  const listenerRef = useRef(() => setUpdate((n) => n + 1))
  useEffect(() => {
    const l = listenerRef.current
    listeners.push(l)
    return () => { const i = listeners.indexOf(l); if (i >= 0) listeners.splice(i, 1) }
  }, [])
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-2 max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg slide-in-from-right ${bgColors[t.type]}`}>
          {icons[t.type]}
          <p className="text-[13px] font-medium text-[var(--text-primary)] flex-1">{t.message}</p>
          <button onClick={() => removeToast(t.id)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}
