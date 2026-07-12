'use client'
import { useState, useCallback, useMemo } from 'react'
import type { SAMRecord } from '@/lib/sam-email'

interface UseSAMSelectionReturn {
  selectedIds: Set<string>
  toggleSelect: (id: string) => void
  toggleSelectAll: (allIds: string[]) => void
  clearSelection: () => void
  selectedItems: SAMRecord[]
  selectedRecords: SAMRecord[]
}

export function useSAMSelection(items: SAMRecord[]): UseSAMSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback((allIds: string[]) => {
    setSelectedIds(prev =>
      prev.size === allIds.length ? new Set() : new Set(allIds)
    )
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectedItems = useMemo(
    () => items.filter(item => selectedIds.has(item.id)),
    [items, selectedIds],
  )

  const selectedRecords = selectedItems

  return {
    selectedIds, toggleSelect, toggleSelectAll, clearSelection,
    selectedItems, selectedRecords,
  }
}
