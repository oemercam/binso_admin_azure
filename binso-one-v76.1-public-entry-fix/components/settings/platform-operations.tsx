'use client'
import { useCallback, useEffect, useState } from 'react'
import { SettingsSection, SettingsValueRow } from './settings-row'
import { useFeedback } from '@/components/ui/feedback'

type Operations = {
  jobs: Array<{ id: string; job_name:string; status: string; started_at: string; completed_at?:string; summary: Record<string, number> }>
  mail: Array<{ id: string; organization_id: string; kind: string; status: string; last_error?: string; created_at: string; attempts:number }>
  events: Array<{ id: string; severity: string; area: string; code: string; request_id?: string; created_at:string }>
  audit: Array<{ id: string; actor_email: string; action: string; detail?: string; created_at:string }>
}
export function PlatformOperations({ canManage, mode='all' }: { canManage: boolean; mode?:'all'|'jobs'|'mail'|'monitoring' }) {
  const [data, setData] = useState<Operations | null>(null)
  const [error, setError] = useState('')
  const feedback = useFeedback()
  const refresh = useCallback(async () => {
    try { const response = await fetch('/api/platform/operations', { cache: 'no-store' }); if (!response.ok) throw new Error(); setData(await response.json() as Operations); setError('') }
    catch { setError('Betriebsdaten nicht verfügbar. Datenbank und Migration prüfen.') }
  }, [])
  useEffect(() => { queueMicrotask(() => { void refresh() }) }, [refresh])
  async function cancel(id: string) { const response = await fetch('/api/platform/operations', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, action: 'cancel' }) }); if (!response.ok) feedback.error('Versandauftrag konnte nicht abgebrochen werden.'); await refresh() }
  const labels: Record<string, string> = { queued: 'Eingeplant', sending: 'In Verarbeitung', accepted: 'Von Graph angenommen', uncertain: 'Unklar – Postfach prüfen', failed: 'Fehlgeschlagen', cancelled: 'Abgebrochen', completed: 'Abgeschlossen', running: 'Läuft' }
  return <>
    <button type="button" className="button secondary" onClick={() => { void refresh() }}>Betriebsdaten aktualisieren</button>
    {error && <p role="alert">{error}</p>}
    {(mode==='all'||mode==='jobs')&&<SettingsSection title="Hintergrundjobs" description="Lifecycle, Abgleich und Hintergrundverarbeitung mit letztem Status.">{data?.jobs.length === 0 && <p>Noch kein Job ausgeführt.</p>}{data?.jobs.map(job => <SettingsValueRow key={job.id} title={`${job.job_name} · ${new Date(job.started_at).toLocaleString('de-CH')}`} value={labels[job.status] ?? job.status} description={Object.entries(job.summary??{}).map(([key, value]) => `${key}: ${value}`).join(' · ')||job.completed_at} />)}</SettingsSection>}
    {(mode==='all'||mode==='mail')&&<SettingsSection title="E-Mail-Warteschlange" description="Graph-Annahme, Versuche und Fehler. Unklare Versuche werden nie blind erneut gesendet.">{data?.mail.length === 0 && <p>Keine Versandaufträge.</p>}{data?.mail.map(mail => <div key={mail.id}><SettingsValueRow title={`${mail.kind} · ${mail.organization_id}`} value={labels[mail.status] ?? mail.status} description={`${mail.last_error || new Date(mail.created_at).toLocaleString('de-CH')} · Versuche ${mail.attempts}`} />{canManage && ['queued','failed','uncertain'].includes(mail.status) && <button type="button" className="button secondary" onClick={() => { void cancel(mail.id) }}>Versandauftrag abbrechen</button>}</div>)}</SettingsSection>}
    {(mode==='all'||mode==='monitoring')&&<SettingsSection title="Betriebsereignisse" description="Letzte Ereigniscodes und Korrelations-IDs ohne Geschäftsinhalte.">{data?.events.map(event => <SettingsValueRow key={event.id} title={`${event.area} · ${event.code}`} value={event.severity} description={`${event.request_id??'–'} · ${new Date(event.created_at).toLocaleString('de-CH')}`} />)}</SettingsSection>}
    {mode==='all'&&<SettingsSection title="Betreiber-Audit" description="Letzte Änderungen durch den Betreiber.">{data?.audit.map(event => <SettingsValueRow key={event.id} title={event.action} value={event.actor_email} description={`${event.detail??''} · ${new Date(event.created_at).toLocaleString('de-CH')}`} />)}</SettingsSection>}
  </>
}
