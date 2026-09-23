'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Input, Select } from '@/components/ui/form-controls'
import { planDefinitions } from '@/lib/data/plans'
import type { SignupRequest, SubscriptionPlan } from '@/types/domain'

const KEY = 'business-platform-pending-signup'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPlan = (searchParams.get('plan') as SubscriptionPlan | null) ?? 'business'
  const [companyName, setCompanyName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<SubscriptionPlan>(initialPlan)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const signup: SignupRequest = {
      id: `signup-${Date.now()}`,
      companyName: companyName.trim(),
      ownerName: ownerName.trim(),
      email: email.trim().toLowerCase(),
      plan,
      status: 'account_created',
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(KEY, JSON.stringify(signup))
    router.push('/onboarding')
  }

  return (
    <main className="public-product-page">
      <section className="public-form-shell">
        <div className="public-product-head"><span>Registrierung</span><h1>Organisation erstellen</h1><p>Nur die wichtigsten Angaben. Alles Weitere kann später ergänzt werden.</p></div>
        <form className="public-form" onSubmit={submit}>
          <label><span>Firma *</span><Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required /></label>
          <label><span>Name *</span><Input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} required /></label>
          <label><span>Geschäftliche E-Mail *</span><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label><span>Plan</span><Select value={plan} onChange={(event) => setPlan(event.target.value as SubscriptionPlan)}>{planDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}{item.monthlyPriceChf ? ` · CHF ${item.monthlyPriceChf}` : ''}</option>)}</Select></label>
          <button className="button primary" type="submit">Organisation erstellen</button>
          <small>Im aktuellen Demo-Stand wird noch keine Zahlung ausgelöst.</small>
        </form>
      </section>
    </main>
  )
}


export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}
