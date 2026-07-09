'use client'

import { useState } from 'react'
import { Send, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

export interface EmailTemplateOption {
  value: string
  label: string
}

interface EmailComposeProps {
  templates: EmailTemplateOption[]
  onSend: (data: { to: string; cc: string; bcc: string; subject: string; body: string; template: string }) => void
  onSaveDraft: (data: { to: string; cc: string; bcc: string; subject: string; body: string; template: string }) => void
  sending?: boolean
  saving?: boolean
  defaultTo?: string
  defaultSubject?: string
  defaultBody?: string
  defaultTemplate?: string
}

export function EmailCompose({ templates, onSend, onSaveDraft, sending, saving, defaultTo = '', defaultSubject = '', defaultBody = '', defaultTemplate = '' }: EmailComposeProps) {
  const [to, setTo] = useState(defaultTo)
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)
  const [template, setTemplate] = useState(defaultTemplate)
  const [showCcBcc, setShowCcBcc] = useState(false)

  const handleTemplateSelect = (key: string) => {
    setTemplate(key)
    if (key && !subject) {
      const t = templates.find(t => t.value === key)
      if (t) setSubject(t.label)
    }
  }

  const handleSend = () => {
    if (!to.trim() || !subject.trim()) return
    onSend({ to: to.trim(), cc: cc.trim(), bcc: bcc.trim(), subject: subject.trim(), body, template })
  }

  const handleSaveDraft = () => {
    onSaveDraft({ to: to.trim(), cc: cc.trim(), bcc: bcc.trim(), subject: subject.trim(), body, template })
  }

  const inputClass = 'w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[13px] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30'
  const canSend = to.trim() && subject.trim() && !sending

  return (
    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
      {/* Template selector */}
      {templates.length > 0 && (
        <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--content-bg)]">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1.5">Templates</p>
          <div className="flex flex-wrap gap-1.5">
            {templates.map(t => (
              <button key={t.value} onClick={() => handleTemplateSelect(t.value)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  template === t.value ? 'bg-[var(--primary)] text-white' : 'bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] border border-[var(--border-color)]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recipient fields */}
      <div className="px-4 pt-3 space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-[var(--text-secondary)] w-8">To</label>
          <input type="email" value={to} onChange={e => setTo(e.target.value)} className={`${inputClass} flex-1`} placeholder="recipient@example.com" />
          <button onClick={() => setShowCcBcc(!showCcBcc)} className="text-[10px] text-[var(--primary)] hover:underline flex items-center gap-0.5">
            {showCcBcc ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Cc/Bcc
          </button>
        </div>
        {showCcBcc && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] w-8">Cc</label>
              <input type="email" value={cc} onChange={e => setCc(e.target.value)} className={`${inputClass} flex-1`} placeholder="cc@example.com" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] w-8">Bcc</label>
              <input type="email" value={bcc} onChange={e => setBcc(e.target.value)} className={`${inputClass} flex-1`} placeholder="bcc@example.com" />
            </div>
          </>
        )}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-[var(--text-secondary)] w-8">Subj</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className={`${inputClass} flex-1`} placeholder="Email subject" />
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className={`${inputClass} resize-y`} placeholder="Write your email..." />
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-t border-[var(--border-color)] flex items-center gap-2 bg-[var(--content-bg)]">
        <button onClick={handleSend} disabled={!canSend}
          className="flex items-center gap-1.5 matdash-btn matdash-btn-primary px-4 py-1.5 rounded-md text-[12px] disabled:opacity-50">
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
        </button>
        <button onClick={handleSaveDraft} disabled={saving}
          className="flex items-center gap-1.5 matdash-btn matdash-btn-outline px-4 py-1.5 rounded-md text-[12px] disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Draft
        </button>
      </div>
    </div>
  )
}
