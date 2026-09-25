'use client'

import { useCallback, useEffect, useState } from 'react'
import { SettingsSection, SettingsValueRow } from '@/components/settings/settings-row'
import { Select, Textarea } from '@/components/ui/form-controls'
import { useFeedback } from '@/components/ui/feedback'
import { formatCalendarDate, formatDateTime } from '@/lib/format/locale'
import { apiRequest, jsonBody } from '@/lib/http/api-client'
import { statusLabel } from '@/lib/status/presentation'

type Row = { id: string; request_type: 'export' | 'cancel' | 'delete'; status: string; reason?: string; retention_until?: string; created_at: string }
const requestTypeLabels: Record<Row['request_type'], string> = { export: 'Datenexport', cancel: 'Kündigung', delete: 'Datenlöschung' }

export function DataLifecycleCard() {
  const [items, setItems] = useState<Row[]>([])
  const [type, setType] = useState<Row['request_type']>('export')
  const [reason, setReason] = useState('')
  const feedback = useFeedback()

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ requests?: Row[] }>('/api/account/data-lifecycle')
      setItems(result.requests ?? [])
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Anfragen konnten nicht geladen werden.')
    }
  }, [feedback])

  useEffect(() => { queueMicrotask(() => { void load() }) }, [load])

  async function create() {
    try {
      await apiRequest('/api/account/data-lifecycle', { method: 'POST', body: jsonBody({ type, reason }) })
      setReason('')
      feedback.success('Anfrage wurde erstellt.')
      await load()
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Anfrage konnte nicht erstellt werden.')
    }
  }

  return <SettingsSection title="Daten-Lifecycle" description="Export, Kündigung und Löschung werden als nachvollziehbare Anfragen verarbeitet. Löschungen erfolgen nie sofort."><div className="form-grid"><label><span>Anfrage</span><Select value={type} onChange={(event) => setType(event.target.value as Row['request_type'])}><option value="export">Datenexport</option><option value="cancel">Kündigung</option><option value="delete">Datenlöschung</option></Select></label><label className="full"><span>Grund optional</span><Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3}/></label><div className="full"><button type="button" className="button secondary" onClick={() => void create()}>Anfrage erstellen</button></div></div>{items.map((item) => <SettingsValueRow key={item.id} title={requestTypeLabels[item.request_type]} value={statusLabel(item.status)} description={`${formatDateTime(item.created_at)}${item.retention_until ? ` · Aufbewahrung bis ${formatCalendarDate(item.retention_until)}` : ''}`}/>)}</SettingsSection>
}
