'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select } from '@/components/ui/form-controls'
import { StatusBadge } from '@/components/ui/status-badge'
import { useFeedback } from '@/components/ui/feedback'
import { apiRequest, jsonBody } from '@/lib/http/api-client'
import { PLATFORM_ROLE_OPTIONS, platformRoleLabel } from '@/lib/auth/platform-permissions'
import type { PlatformRole } from '@/types/domain'

type Operator = { userId: string; email: string; role: PlatformRole; status: 'active' | 'suspended' }

export default function Page() {
  const feedback = useFeedback()
  const [items, setItems] = useState<Operator[]>([])
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<PlatformRole>('platform_support')
  const [status, setStatus] = useState<'active' | 'suspended'>('active')
  const [reason, setReason] = useState('Geplante Operator-Zuweisung')
  const [roleSource, setRoleSource] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ operators?: Operator[]; roleSource?: string }>('/api/platform/operators')
      setItems(result.operators ?? [])
      setRoleSource(result.roleSource ?? '')
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Operatoren konnten nicht geladen werden.')
    }
  }, [feedback])

  useEffect(() => { queueMicrotask(() => { void load() }) }, [load])

  async function save() {
    if (saving) return
    setSaving(true)
    try {
      await apiRequest('/api/platform/operators', { method: 'PUT', body: jsonBody({ userId, email, role, status, reason }) })
      setUserId(''); setEmail('')
      feedback.success('Operator wurde gespeichert.')
      await load()
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Operator konnte nicht gespeichert werden.')
    } finally { setSaving(false) }
  }

  return <section className="page apple-page"><PageHeader title="Operatoren" description={`Funktionale Binso-Rollen getrennt von Entra-Zugangsberechtigung. Rollenquelle: ${roleSource || '–'}.`} /><div className="settings-section"><h2>Zuweisung</h2><Input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="Entra User/Object ID" /><Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@binso.ch" /><Select value={role} onChange={(event) => setRole(event.target.value as PlatformRole)}>{PLATFORM_ROLE_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</Select><Select value={status} onChange={(event) => setStatus(event.target.value as 'active' | 'suspended')}><option value="active">Aktiv</option><option value="suspended">Gesperrt</option></Select><Input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="Änderungsgrund" /><button className="button primary" onClick={() => void save()} disabled={saving}>{saving ? 'Wird gespeichert…' : 'Speichern'}</button></div><div className="data-list compact-overview-list">{items.map((item) => <div className="data-row" key={item.userId}><span className="primary-cell"><strong>{item.email}</strong><small>{item.userId}</small></span><span>{platformRoleLabel(item.role)}</span><StatusBadge status={item.status} /></div>)}</div></section>
}
