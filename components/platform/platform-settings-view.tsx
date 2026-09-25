'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/form-controls'
import { useFeedback } from '@/components/ui/feedback'
import { apiRequest, jsonBody } from '@/lib/http/api-client'
import type { PlatformFeatureFlag } from '@/types/domain'

export function PlatformSettingsView() {
  const feedback = useFeedback()
  const [flags, setFlags] = useState<PlatformFeatureFlag[]>([])
  const [reason, setReason] = useState('Geplante Plattformänderung')
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const loadFlags = useCallback(async () => {
    try {
      const payload = await apiRequest<{ flags?: PlatformFeatureFlag[] }>('/api/platform/feature-flags')
      setFlags(payload.flags ?? [])
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Feature Flags konnten nicht geladen werden.')
    }
  }, [feedback])

  useEffect(() => { queueMicrotask(() => { void loadFlags() }) }, [loadFlags])

  async function toggle(flag: PlatformFeatureFlag) {
    if (savingKey) return
    setSavingKey(flag.key)
    try {
      await apiRequest('/api/platform/feature-flags', { method: 'PATCH', body: jsonBody({ key: flag.key, enabled: !flag.enabled, reason }) })
      feedback.success(`Feature Flag wurde ${flag.enabled ? 'deaktiviert' : 'aktiviert'}.`)
      await loadFlags()
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Feature Flag konnte nicht geändert werden.')
    } finally { setSavingKey(null) }
  }

  return <section className="page apple-page"><PageHeader title="Plattform-Einstellungen" description="App-Level-Einstellungen und Feature Flags. Keine Azure-Secrets oder Infrastruktur-Credentials." /><label className="settings-reason"><span>Änderungsgrund</span><Input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} /></label><div className="settings-section"><div className="section-title"><div><h2>Feature Flags</h2><p>Feature Flags steuern Rollout, nicht Berechtigungen.</p></div></div>{flags.map((flag) => <div className="settings-row" key={flag.key}><span><strong>{flag.key}</strong><small>{flag.description}</small></span><button className={`button ${flag.enabled ? 'secondary' : 'primary'}`} disabled={Boolean(savingKey)} onClick={() => void toggle(flag)}>{savingKey === flag.key ? 'Speichern…' : flag.enabled ? 'Deaktivieren' : 'Aktivieren'}</button></div>)}</div></section>
}
