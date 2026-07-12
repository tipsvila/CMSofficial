'use client'
import { useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useToast } from '@/components/toast'
import type { SAMRecord } from '@/lib/sam-email'

const CSV_HEADERS = [
  'Award ID/PIID', 'Recipient Name', 'Total Obligated Amount',
  'End Date', 'NAICS Description', 'PSC Description', 'Awarding Agency',
]

function csvRowMapper(row: SAMRecord): string[] {
  return [
    String(row.awardIdPiid ?? ''),
    String(row.recipientName ?? ''),
    row.totalObligatedAmount != null ? String(row.totalObligatedAmount) : '',
    String(row.periodOfPerformanceCurrentEndDate ?? ''),
    String(row.naicsDescription ?? ''),
    String(row.productOrServiceCodeDescription ?? ''),
    String(row.awardingAgencyName ?? ''),
  ]
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = [CSV_HEADERS, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

interface UseSAMExportReturn {
  exporting: boolean
  handleExportCSV: (search: string, sortBy: string, sortOrder: string) => Promise<void>
  handleExportSelected: (selectedItems: SAMRecord[]) => Promise<void>
}

export function useSAMExport(): UseSAMExportReturn {
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  const handleExportCSV = useCallback(async (search: string, sortBy: string, sortOrder: string) => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ search, sortBy, sortOrder })
      const result = await api.get<{ records: SAMRecord[]; total: number }>(`/api/sam-data/export?${params.toString()}`)
      const items = result.records || []
      const rows = items.map(csvRowMapper)
      downloadCsv(rows, `sam-data-${new Date().toISOString().split('T')[0]}.csv`)
      toast('success', `Exported ${items.length} SAM records to CSV`)
    } catch { toast('error', 'Failed to export CSV') }
    finally { setExporting(false) }
  }, [toast])

  const handleExportSelected = useCallback(async (selectedItems: SAMRecord[]) => {
    setExporting(true)
    try {
      const rows = selectedItems.map(csvRowMapper)
      downloadCsv(rows, `sam-data-selected-${new Date().toISOString().split('T')[0]}.csv`)
      toast('success', `Exported ${selectedItems.length} selected records to CSV`)
    } catch { toast('error', 'Failed to export selected records') }
    finally { setExporting(false) }
  }, [toast])

  return { exporting, handleExportCSV, handleExportSelected }
}
