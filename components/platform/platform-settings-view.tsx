'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/form-controls'
import type { PlatformFeatureFlag } from '@/types/domain'

export function PlatformSettingsView() {
  const [flags, setFlags] = useState<PlatformFeatureFlag[]>([])
  const [reason, setReason] = useState('Geplante Plattformänderung')

  const loadFlags = useCallback(async () => {
    const response = await fetch('/api/platform/feature-flags', { cache: 'no-store' })
    const payload = (await response.json()) as { flags?: PlatformFeatureFlag[] }
    if (response.ok) setFlags(payload.flags ?? [])
  }, [])

  useEffect(() => {
    let active = true

    void fetch('/api/platform/feature-flags', { cache: 'no-store' })
      .then(async (response) => ({ response, payload: (await response.json()) as { flags?: PlatformFeatureFlag[] } }))
      .then(({ response, payload }) => {
        if (active && response.ok) setFlags(payload.flags ?? [])
      })

    return () => {
      active = false
    }
  }, [])

  async function toggle(flag: PlatformFeatureFlag) {
    const response = await fetch('/api/platform/feature-flags', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: flag.key, enabled: !flag.enabled, reason }),
    })
    if (response.ok) await loadFlags()
  }

  return (
    <section className="page apple-page">
      <PageHeader
        title="Plattform-Einstellungen"
        description="App-Level-Einstellungen und Feature Flags. Keine Azure-Secrets oder Infrastruktur-Credentials."
      />
      <label className="settings-reason">
        <span>Änderungsgrund</span>
        <Input value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>
      <div className="settings-section">
        <div className="section-title">
          <div>
            <h2>Feature Flags</h2>
            <p>Feature Flags steuern Rollout, nicht Berechtigungen.</p>
          </div>
        </div>
        {flags.map((flag) => (
          <div className="settings-row" key={flag.key}>
            <span>
              <strong>{flag.key}</strong>
              <small>{flag.description}</small>
            </span>
            <button
              className={`button ${flag.enabled ? 'secondary' : 'primary'}`}
              onClick={() => void toggle(flag)}
            >
              {flag.enabled ? 'Deaktivieren' : 'Aktivieren'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
