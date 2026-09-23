'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { useBusinessStore } from '@/components/state/business-store'
import type { OrganizationMembership, SignupRequest } from '@/types/domain'

type OnboardingState = {
  signup: SignupRequest | null
  memberships: OrganizationMembership[]
}

export default function OnboardingPage() {
  const router = useRouter()
  const store = useBusinessStore()
  const [state, setState] = useState<OnboardingState | null>(null)
  const [ready, setReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      void (async () => {
        try {
          const response = await fetch('/api/onboarding', { cache: 'no-store' })
          const result = await response.json() as OnboardingState & { error?: string }
          if (!response.ok) throw new Error(result.error || 'Onboarding konnte nicht geladen werden.')
          if (!cancelled) setState(result)
        } catch (cause) {
          if (!cancelled) setError(cause instanceof Error ? cause.message : 'Onboarding konnte nicht geladen werden.')
        } finally {
          if (!cancelled) setReady(true)
        }
      })()
    })
    return () => { cancelled = true }
  }, [])

  async function create() {
    const signup = state?.signup
    if (!signup || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signupId: signup.id }),
      })
      const result = await response.json() as { organizationId?: string; error?: string }
      if (!response.ok || !result.organizationId) throw new Error(result.error || 'Organisation konnte nicht erstellt werden.')

      const slug = signup.companyName.toLowerCase().replace(/[^a-z0-9äöü]+/g, '-').replace(/^-|-$/g, '')
      store.createOrganization({
        organizationId: result.organizationId,
        name: signup.companyName,
        slug: slug || `firma-${Date.now()}`,
        ownerEmail: signup.email,
        plan: signup.plan,
      })
      router.push('/dashboard')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Organisation konnte nicht erstellt werden.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) return null

  const signup = state?.signup ?? null
  const existingMembership = state?.memberships?.[0]

  return (
    <section className="page apple-page">
      <PageHeader title="Willkommen" description="Ihre Organisation wird mit einem 14-tägigen Testzugang eingerichtet." />
      {existingMembership ? <div className="customer-overview-section">
        <div className="customer-overview-list">
          <div><span>Status</span><strong>Organisation bereits eingerichtet</strong></div>
          <div><span>Rolle</span><strong>{existingMembership.role}</strong></div>
        </div>
        <div className="customer-quick-actions"><button className="button primary" onClick={() => router.push('/dashboard')}>Zum Dashboard</button></div>
      </div> : signup ? <div className="customer-overview-section">
        <div className="customer-overview-list">
          <div><span>Firma</span><strong>{signup.companyName}</strong></div>
          <div><span>Inhaber</span><strong>{signup.ownerName}</strong></div>
          <div><span>E-Mail</span><strong>{signup.email}</strong></div>
          <div><span>Plan</span><strong>{signup.plan}</strong></div>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="customer-quick-actions">
          <button className="button secondary" onClick={() => router.push(`/register?plan=${signup.plan}`)} disabled={submitting}>Angaben ändern</button>
          <button className="button primary" onClick={create} disabled={submitting}>{submitting ? 'Wird eingerichtet…' : 'Testzugang starten'}</button>
        </div>
      </div> : <div className="list-empty">
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        Keine offene Registrierung. <button className="button secondary" onClick={() => router.push('/pricing')}>Preise ansehen</button>
      </div>}
    </section>
  )
}
