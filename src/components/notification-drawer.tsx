'use client'

import { useState, useEffect } from 'react'
import { CheckCheck, Trash2 } from 'lucide-react'

interface Notification {
  id: string; type: string; title: string; body: string | null
  entityId: string | null; entityType: string | null
  isRead: boolean; createdAt: string
}

interface Props {
  onClose: () => void
  onRefresh: () => void
}

const typeIcons: Record<string, string> = {
  AOG_ALERT: '🚨', QUOTE_RECEIVED: '📋', ORDER_UPDATE: '📦',
  CERT_EXPIRY: '⚠️', COMPLIANCE_ALERT: '🛡️', SYSTEM: '⚙️',
}

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationDrawer({ onClose, onRefresh }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notifications?limit=20')
      .then(r => r.json())
      .then(d => setNotifications(d.notifications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isRead: true }) })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    onRefresh()
  }

  const markAllRead = async () => {
    await fetch('/api/notifications/mark-all-read', { method: 'PUT' })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    onRefresh()
  }

  const clearAll = async () => {
    await fetch('/api/notifications/clear', { method: 'DELETE' })
    setNotifications([])
    onRefresh()
  }

  const unread = notifications.filter(n => !n.isRead).length

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-xl z-50 max-h-[480px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-[var(--text-primary)]">Notifications</h3>
          {unread > 0 && <span className="px-2 py-0.5 text-xs bg-[var(--danger-light)] text-[var(--danger)] rounded-full">{unread}</span>}
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="p-1 hover:bg-[var(--primary-light)] rounded" title="Mark all read">
              <CheckCheck size={14} className="text-[var(--primary)]" />
            </button>
          )}
          <button onClick={clearAll} className="p-1 hover:bg-[var(--primary-light)] rounded" title="Clear all">
            <Trash2 size={14} className="text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-[var(--text-muted)] text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-muted)] text-sm">No notifications</div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => { if (!n.isRead) markRead(n.id) }}
                className={`w-full px-4 py-3 text-left hover:bg-[var(--content-bg)] transition-colors ${!n.isRead ? 'bg-[var(--primary-light)]/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{typeIcons[n.type] ?? '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${!n.isRead ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 bg-[var(--primary)] rounded-full flex-shrink-0" />}
                    </div>
                    {n.body && <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-xs text-[var(--text-muted)] mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={onClose} className="w-full px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--content-bg)] border-t border-[var(--border-color)]">
        Close
      </button>
    </div>
  )
}
