'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { useBusinessStore } from '@/components/state/business-store'
import { usePlatformStore } from '@/components/state/platform-store'
import type { SignupRequest } from '@/types/domain'

const KEY = 'business-platform-pending-signup'

export default function OnboardingPage() {
  const router = useRouter()
  const store = useBusinessStore()
  const platform = usePlatformStore()
  const [signup, setSignup] = useState<SignupRequest | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      const raw = localStorage.getItem(KEY)
      if (!raw) {
        setReady(true)
        return
      }
      try {
        setSignup(JSON.parse(raw) as SignupRequest)
      } finally {
        setReady(true)
      }
    })
    return () => { cancelled = true }
  }, [])

  function create() {
    if (!signup) return
    platform.registerSignup(signup)
    const slug = signup.companyName.toLowerCase().replace(/[^a-z0-9äöü]+/g, '-').replace(/^-|-$/g, '')
    const organization = store.createOrganization({ name: signup.companyName, slug: slug || `firma-${Date.now()}`, ownerEmail: signup.email, plan: signup.plan })
    platform.activateSignup(signup.id, organization.id)
    localStorage.removeItem(KEY)
    router.push('/dashboard')
  }

  if (!ready) return null

  return (
    <section className="page apple-page">
      <PageHeader title="Willkommen" description="Ihre Organisation wird mit einem 14-tägigen Testzugang eingerichtet." />
      {signup ? <div className="customer-overview-section">
        <div className="customer-overview-list">
          <div><span>Firma</span><strong>{signup.companyName}</strong></div>
          <div><span>Inhaber</span><strong>{signup.ownerName}</strong></div>
          <div><span>E-Mail</span><strong>{signup.email}</strong></div>
          <div><span>Plan</span><strong>{signup.plan}</strong></div>
        </div>
        <div className="customer-quick-actions"><button className="button primary" onClick={create}>Testzugang starten</button></div>
      </div> : <div className="list-empty">Keine offene Registrierung. <button className="button secondary" onClick={() => router.push('/pricing')}>Preise ansehen</button></div>}
    </section>
  )
}
