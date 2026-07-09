'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/page-header'
import { Badge, ConfirmDialog } from '@/components/ui'
import { Bell, BellOff, Trash2, CheckCheck } from 'lucide-react'
import { useToast } from '@/components/toast'
import { TableSkeleton } from '@/components/skeleton'
import { api } from '@/lib/api-client'

interface Notification {
  id: string; type: string; title: string; body?: string | null;
  entityId?: string | null; entityType?: string | null; isRead: boolean; createdAt: string
}

interface NotificationsResponse { notifications: Notification[]; total: number }

const TYPE_BADGE: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  info: 'info', success: 'success', warning: 'warning', error: 'danger', alert: 'danger',
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [data, setData] = useState<{ notifications: Notification[]; total: number }>({ notifications: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const result = await api.get<NotificationsResponse>('/api/notifications')
      setData({ notifications: result.notifications || [], total: result.total || 0 })
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load notifications') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}`, { isRead: true })
      setData(prev => ({ ...prev, notifications: prev.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) }))
    } catch { toast('error', 'Failed to mark as read') }
  }

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read', {})
      setData(prev => ({ ...prev, notifications: prev.notifications.map(n => ({ ...n, isRead: true })) }))
      toast('success', 'All notifications marked as read')
    } catch { toast('error', 'Failed to mark all as read') }
  }

  const clearAll = async () => {
    try {
      await api.delete('/api/notifications/clear')
      setData({ notifications: [], total: 0 })
      setShowClearConfirm(false)
      toast('success', 'All notifications cleared')
    } catch { toast('error', 'Failed to clear notifications') }
  }

  const unreadCount = data.notifications.filter(n => !n.isRead).length

  return (
    <div>
      <PageHeader title="Notifications" subtitle={`${unreadCount} unread of ${data.total} total`} actions={
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-2 matdash-btn matdash-btn-outline px-3 py-1.5 rounded-md text-[11px] transition-colors">
              <CheckCheck size={16} /> Mark All Read
            </button>
          )}
          {data.total > 0 && (
            <button onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 matdash-btn matdash-btn-danger px-3 py-1.5 rounded-md text-[11px] transition-colors">
              <Trash2 size={16} /> Clear All
            </button>
          )}
        </div>
      } />

      {error && <div className="bg-red-500/10 text-[var(--danger)] p-2 rounded-md text-[11px] mb-3 border border-red-500/20">{error}</div>}

      {loading ? <TableSkeleton rows={5} cols={4} /> : data.notifications.length === 0 ? (
        <div className="matdash-card flex flex-col items-center justify-center py-16 text-center">
          <BellOff size={48} className="text-[var(--text-muted)] mb-4" />
          <h3 className="text-[15px] font-bold text-[var(--text-primary)] mb-1">No notifications</h3>
          <p className="text-[12px] text-[var(--text-secondary)]">You are all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.notifications.map(n => (
            <div key={n.id}
              className={`matdash-card p-4 flex items-start gap-3 transition-all cursor-pointer hover:shadow-md ${!n.isRead ? 'border-l-4 border-l-[var(--primary)]' : ''}`}
              onClick={() => !n.isRead && markAsRead(n.id)}>
              <div className={`stat-icon-box ${n.isRead ? 'secondary' : 'primary'} shrink-0`}>
                <Bell size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-bold text-[var(--text-primary)]">{n.title}</span>
                  <Badge variant={TYPE_BADGE[n.type] || 'default'}>{n.type}</Badge>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />}
                </div>
                {n.body && <p className="text-[12px] text-[var(--text-secondary)] line-clamp-2">{n.body}</p>}
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={showClearConfirm} onClose={() => setShowClearConfirm(false)} onConfirm={clearAll}
        title="Clear All Notifications" message="Are you sure you want to clear all notifications? This action cannot be undone." confirmLabel="Clear All" />
    </div>
  )
}
