'use client'

import { useCallback, useEffect, useState } from 'react'
import { SettingsSection, SettingsValueRow } from './settings-row'
import { useFeedback } from '@/components/ui/feedback'
import { formatDateTime } from '@/lib/format/locale'
import { apiRequest, jsonBody } from '@/lib/http/api-client'
import { statusLabel } from '@/lib/status/presentation'

type Operations = {
  jobs: Array<{ id: string; job_name: string; status: string; started_at: string; completed_at?: string; summary: Record<string, number> }>
  mail: Array<{ id: string; organization_id: string; kind: string; status: string; last_error?: string; created_at: string; attempts: number }>
  events: Array<{ id: string; severity: string; area: string; code: string; request_id?: string; created_at: string }>
  audit: Array<{ id: string; actor_email: string; action: string; detail?: string; created_at: string }>
}

export function PlatformOperations({ canManage, mode = 'all' }: { canManage: boolean; mode?: 'all' | 'jobs' | 'mail' | 'monitoring' }) {
  const [data, setData] = useState<Operations | null>(null)
  const [loading, setLoading] = useState(false)
  const feedback = useFeedback()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await apiRequest<Operations>('/api/platform/operations'))
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Betriebsdaten sind nicht verfügbar.')
    } finally { setLoading(false) }
  }, [feedback])

  useEffect(() => { queueMicrotask(() => { void refresh() }) }, [refresh])

  async function cancel(id: string) {
    try {
      await apiRequest('/api/platform/operations', { method: 'PATCH', body: jsonBody({ id, action: 'cancel' }) })
      feedback.success('Versandauftrag wurde abgebrochen.')
      await refresh()
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Versandauftrag konnte nicht abgebrochen werden.')
    }
  }

  return <>
    <button type="button" className="button secondary" disabled={loading} onClick={() => void refresh()}>{loading ? 'Aktualisieren…' : 'Betriebsdaten aktualisieren'}</button>
    {(mode === 'all' || mode === 'jobs') && <SettingsSection title="Hintergrundjobs" description="Lifecycle, Abgleich und Hintergrundverarbeitung mit letztem Status.">{data?.jobs.length === 0 && <p>Noch kein Job ausgeführt.</p>}{data?.jobs.map((job) => <SettingsValueRow key={job.id} title={`${job.job_name} · ${formatDateTime(job.started_at)}`} value={statusLabel(job.status)} description={Object.entries(job.summary ?? {}).map(([key, value]) => `${key}: ${value}`).join(' · ') || job.completed_at} />)}</SettingsSection>}
    {(mode === 'all' || mode === 'mail') && <SettingsSection title="E-Mail-Warteschlange" description="Graph-Annahme, Versuche und Fehler. Unklare Versuche werden nie blind erneut gesendet.">{data?.mail.length === 0 && <p>Keine Versandaufträge.</p>}{data?.mail.map((mail) => <div key={mail.id}><SettingsValueRow title={`${mail.kind} · ${mail.organization_id}`} value={statusLabel(mail.status)} description={`${mail.last_error || formatDateTime(mail.created_at)} · Versuche ${mail.attempts}`} />{canManage && ['queued', 'failed', 'uncertain'].includes(mail.status) && <button type="button" className="button secondary" onClick={() => void cancel(mail.id)}>Versandauftrag abbrechen</button>}</div>)}</SettingsSection>}
    {(mode === 'all' || mode === 'monitoring') && <SettingsSection title="Betriebsereignisse" description="Letzte Ereigniscodes und Korrelations-IDs ohne Geschäftsinhalte.">{data?.events.map((event) => <SettingsValueRow key={event.id} title={`${event.area} · ${event.code}`} value={event.severity} description={`${event.request_id ?? '–'} · ${formatDateTime(event.created_at)}`} />)}</SettingsSection>}
    {mode === 'all' && <SettingsSection title="Betreiber-Audit" description="Letzte Änderungen durch den Betreiber.">{data?.audit.map((event) => <SettingsValueRow key={event.id} title={event.action} value={event.actor_email} description={`${event.detail ?? ''} · ${formatDateTime(event.created_at)}`} />)}</SettingsSection>}
  </>
}
