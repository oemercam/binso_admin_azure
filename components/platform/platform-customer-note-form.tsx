'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/form-controls'
import { apiRequest, jsonBody } from '@/lib/http/api-client'
import { useFeedback } from '@/components/ui/feedback'

export function PlatformCustomerNoteForm({ organizationId }: { organizationId: string }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const feedback = useFeedback()

  async function save() {
    const value = note.trim()
    if (!value || saving) return
    setSaving(true)
    try {
      await apiRequest(`/api/platform/customers/${encodeURIComponent(organizationId)}/notes`, {
        method: 'POST',
        body: jsonBody({ note: value }),
      })
      setNote('')
      feedback.success('Notiz wurde gespeichert.')
      window.location.reload()
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Notiz konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="settings-section"><h2>Interne Notiz</h2><Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Nur für Binso-Operatoren sichtbar"/><button type="button" className="button primary" disabled={saving || !note.trim()} onClick={() => void save()}>{saving ? 'Speichern…' : 'Notiz speichern'}</button></div>
}
