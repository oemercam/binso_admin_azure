'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select } from '@/components/ui/form-controls'
import { SettingsSection, SettingsValueRow } from '@/components/settings/settings-row'
import { useFeedback } from '@/components/ui/feedback'
import { useCurrentUser } from '@/components/state/current-user'

 type AccountProfile = {
  id: string
  email: string
  displayName: string
  phone: string
  locale: string
  timezone: string
  status: 'active' | 'suspended'
  lastLoginAt: string | null
  createdAt: string
}

export default function AccountPage() {
  const user = useCurrentUser()
  const feedback = useFeedback()
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [displayName, setDisplayName] = useState(user.name)
  const [phone, setPhone] = useState('')
  const [locale, setLocale] = useState('de-CH')
  const [timezone, setTimezone] = useState('Europe/Zurich')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch('/api/account', { cache: 'no-store' })
        const result = await response.json().catch(() => ({})) as { profile?: AccountProfile; error?: { message?: string } }
        if (!response.ok || !result.profile) throw new Error(result.error?.message || 'Konto konnte nicht geladen werden.')
        if (cancelled) return
        setProfile(result.profile)
        setDisplayName(result.profile.displayName)
        setPhone(result.profile.phone)
        setLocale(result.profile.locale)
        setTimezone(result.profile.timezone)
      } catch (cause) {
        if (!cancelled) feedback.error(cause instanceof Error ? cause.message : 'Konto konnte nicht geladen werden.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [feedback])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayName, phone, locale, timezone }),
      })
      const result = await response.json().catch(() => ({})) as { profile?: AccountProfile; error?: { message?: string } }
      if (!response.ok || !result.profile) throw new Error(result.error?.message || 'Konto konnte nicht gespeichert werden.')
      setProfile(result.profile)
      feedback.success('Kontodaten wurden gespeichert.')
    } catch (cause) {
      feedback.error(cause instanceof Error ? cause.message : 'Konto konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page apple-page settings-page">
      <PageHeader title="Konto" description="Persönliche Kontodaten und bevorzugte Darstellung verwalten." />

      <form onSubmit={save}>
        <SettingsSection title="Profil" description="Diese Angaben gehören zu deinem persönlichen Binso-One-Konto.">
          <div className="form-grid">
            <label className="full"><span>Name</span><Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={120} disabled={loading} /></label>
            <label className="full"><span>E-Mail</span><Input value={profile?.email ?? user.email} readOnly disabled /></label>
            <label className="full"><span>Telefon</span><Input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} placeholder="Optional" disabled={loading} /></label>
            <label><span>Sprache</span><Select value={locale} onChange={(event) => setLocale(event.target.value)} disabled={loading}><option value="de-CH">Deutsch (Schweiz)</option><option value="fr-CH">Français (Suisse)</option><option value="it-CH">Italiano (Svizzera)</option><option value="en-CH">English (Switzerland)</option></Select></label>
            <label><span>Zeitzone</span><Select value={timezone} onChange={(event) => setTimezone(event.target.value)} disabled={loading}><option value="Europe/Zurich">Europe/Zurich</option><option value="Europe/Berlin">Europe/Berlin</option><option value="Europe/Paris">Europe/Paris</option><option value="Europe/Rome">Europe/Rome</option><option value="UTC">UTC</option></Select></label>
          </div>
          <div className="customer-quick-actions"><button type="submit" className="button primary" disabled={saving || loading}>{saving ? 'Speichern…' : 'Speichern'}</button></div>
        </SettingsSection>
      </form>

      <SettingsSection title="Sicherheit" description="Authentifizierung wird über den konfigurierten Identitätsanbieter verwaltet.">
        <SettingsValueRow title="Kontostatus" value={profile?.status === 'suspended' ? 'Gesperrt' : 'Aktiv'} />
        <SettingsValueRow title="Letzte Anmeldung" value={profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString('de-CH') : '–'} />
        <SettingsValueRow title="Anmeldung" value="Extern verwaltet" description="Binso One speichert keine Passwörter." />
      </SettingsSection>
    </section>
  )
}
