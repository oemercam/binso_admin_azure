'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PlatformTenant, SignupRequest, SubscriptionPlan } from '@/types/domain'
import { readStorage, writeStorage } from '@/lib/browser/storage'
import { getPlan } from '@/lib/data/plans'

type PlatformState = {
  tenants: PlatformTenant[]
  signups: SignupRequest[]
}

type PlatformStore = PlatformState & {
  registerSignup: (signup: SignupRequest) => void
  activateSignup: (signupId: string, organizationId: string) => PlatformTenant | null
  updateTenant: (tenantId: string, changes: Partial<PlatformTenant>) => PlatformTenant | null
  changePlan: (tenantId: string, plan: SubscriptionPlan) => PlatformTenant | null
}

const STORAGE_KEY = 'business-platform-operator-v1'

const seedState: PlatformState = {
  tenants: [
    {
      id: 'tenant-binso',
      organizationId: 'org-binso-demo',
      companyName: 'Binso GmbH',
      ownerName: 'Demo Admin',
      ownerEmail: 'demo@binso.ch',
      plan: 'professional',
      status: 'active',
      seats: 10,
      users: 4,
      monthlyRevenueChf: 149,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastActiveAt: new Date().toISOString(),
      storageMb: 384,
    },
    {
      id: 'tenant-alpine',
      organizationId: 'org-platform-alpine',
      companyName: 'Alpine Consulting AG',
      ownerName: 'Marco Frei',
      ownerEmail: 'marco@alpine-demo.ch',
      plan: 'business',
      status: 'trial',
      seats: 10,
      users: 6,
      monthlyRevenueChf: 0,
      createdAt: '2026-09-15T08:00:00.000Z',
      lastActiveAt: '2026-09-22T15:10:00.000Z',
      storageMb: 128,
    },
    {
      id: 'tenant-helvetic',
      organizationId: 'org-platform-helvetic',
      companyName: 'Helvetic Digital GmbH',
      ownerName: 'Luca Meier',
      ownerEmail: 'luca@helvetic-demo.ch',
      plan: 'starter',
      status: 'active',
      seats: 3,
      users: 3,
      monthlyRevenueChf: 39,
      createdAt: '2026-08-03T09:30:00.000Z',
      lastActiveAt: '2026-09-23T07:45:00.000Z',
      storageMb: 64,
    },
  ],
  signups: [
    {
      id: 'signup-demo-1',
      companyName: 'Neue Beratung GmbH',
      ownerName: 'Anna Keller',
      email: 'anna@beratung-demo.ch',
      plan: 'business',
      status: 'account_created',
      createdAt: '2026-09-22T18:20:00.000Z',
    },
  ],
}

const PlatformContext = createContext<PlatformStore | null>(null)

export function PlatformStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(seedState)

  useEffect(() => {
    const raw = readStorage(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as PlatformState
      queueMicrotask(() => setState(parsed))
    } catch {
      // keep seed state
    }
  }, [])

  useEffect(() => {
    writeStorage(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const store = useMemo<PlatformStore>(() => ({
    ...state,
    registerSignup(signup) {
      setState((current) => ({
        ...current,
        signups: [signup, ...current.signups.filter((item) => item.id !== signup.id)],
      }))
    },
    activateSignup(signupId, organizationId) {
      const signup = state.signups.find((item) => item.id === signupId)
      if (!signup) return null
      const plan = getPlan(signup.plan)
      const tenant: PlatformTenant = {
        id: `tenant-${Date.now()}`,
        organizationId,
        companyName: signup.companyName,
        ownerName: signup.ownerName,
        ownerEmail: signup.email,
        plan: signup.plan,
        status: 'trial',
        seats: plan.includedUsers,
        users: 1,
        monthlyRevenueChf: 0,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        storageMb: 0,
      }
      setState((current) => ({
        tenants: [tenant, ...current.tenants],
        signups: current.signups.map((item) => item.id === signupId ? { ...item, status: 'trial_started' } : item),
      }))
      return tenant
    },
    updateTenant(tenantId, changes) {
      const existing = state.tenants.find((item) => item.id === tenantId)
      if (!existing) return null
      const updated = { ...existing, ...changes }
      setState((current) => ({ ...current, tenants: current.tenants.map((item) => item.id === tenantId ? updated : item) }))
      return updated
    },
    changePlan(tenantId, planId) {
      const existing = state.tenants.find((item) => item.id === tenantId)
      if (!existing) return null
      const plan = getPlan(planId)
      const updated: PlatformTenant = {
        ...existing,
        plan: planId,
        seats: Math.max(existing.users, plan.includedUsers),
        monthlyRevenueChf: plan.monthlyPriceChf ?? existing.monthlyRevenueChf,
      }
      setState((current) => ({ ...current, tenants: current.tenants.map((item) => item.id === tenantId ? updated : item) }))
      return updated
    },
  }), [state])

  return <PlatformContext.Provider value={store}>{children}</PlatformContext.Provider>
}

export function usePlatformStore() {
  const value = useContext(PlatformContext)
  if (!value) throw new Error('usePlatformStore must be used inside PlatformStoreProvider')
  return value
}
