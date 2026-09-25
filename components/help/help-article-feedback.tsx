'use client'

import { useState } from 'react'
import { apiRequest, jsonBody } from '@/lib/http/api-client'
import { useFeedback } from '@/components/ui/feedback'

export function HelpArticleFeedback({ articleId }: { articleId: string }) {
  const [sent, setSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const feedback = useFeedback()

  async function send(helpful: boolean) {
    if (saving || sent) return
    setSaving(true)
    try {
      await apiRequest('/api/help', { method: 'POST', body: jsonBody({ articleId, helpful }) })
      setSent(true)
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Feedback konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="module-toolbar">
      {sent ? <span>Danke für dein Feedback.</span> : <>
        <span>War dieser Artikel hilfreich?</span>
        <button type="button" className="button secondary" disabled={saving} onClick={() => void send(true)}>Ja</button>
        <button type="button" className="button secondary" disabled={saving} onClick={() => void send(false)}>Nein</button>
      </>}
    </div>
  )
}
