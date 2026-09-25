'use client'

import { useState } from 'react'
import { Input, Select, Textarea } from '@/components/ui/form-controls'
import { apiRequest, jsonBody } from '@/lib/http/api-client'

type State = 'idle' | 'sending' | 'success' | 'error'

export function ContactForm() {
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'sending') return
    setState('sending')
    setError('')
    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form.entries())
    try {
      await apiRequest('/api/public/contact', { method: 'POST', body: jsonBody(payload) })
      event.currentTarget.reset()
      setState('success')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nachricht konnte nicht gesendet werden.')
      setState('error')
    }
  }

  return (
    <form className="public-contact-form" onSubmit={submit}>
      <div className="public-contact-form-grid">
        <label><span>Name</span><Input name="name" required maxLength={120} autoComplete="name" /></label>
        <label><span>Unternehmen <small>optional</small></span><Input name="company" maxLength={160} autoComplete="organization" /></label>
        <label><span>E-Mail</span><Input name="email" type="email" required maxLength={320} autoComplete="email" /></label>
        <label><span>Thema</span><Select name="topic" defaultValue="sales"><option value="sales">Binso One</option><option value="pilot">Pilot</option><option value="partnership">Zusammenarbeit</option><option value="general">Allgemeine Frage</option></Select></label>
      </div>
      <label><span>Nachricht</span><Textarea name="message" required minLength={5} maxLength={2000} rows={6} /></label>
      <button className="button primary" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Wird gesendet…' : 'Nachricht senden'}</button>
      {state === 'success' ? <p className="form-success" role="status">Danke. Deine Nachricht wurde an Binso übermittelt.</p> : null}
      {state === 'error' ? <p className="form-error" role="alert">{error}</p> : null}
    </form>
  )
}
