import type { OrganizationFeature, SubscriptionPlan } from '@/types/domain'
import { getPlan, selfServicePlanDefinitions } from '@/lib/data/plans'

export const SELF_SERVICE_PLANS = ['starter', 'business', 'professional'] as const satisfies readonly SubscriptionPlan[]

export const PLAN_SHORT_BENEFIT: Record<(typeof SELF_SERVICE_PLANS)[number], string> = {
  starter: 'Kernprozess für kleine Firmen',
  business: 'Teamarbeit, Zeit und Finanzen',
  professional: 'Steuerung, Kontrolle und Integrationen',
}

export const FEATURE_LABELS: Record<OrganizationFeature, string> = {
  crm: 'Kunden und Kontakte', quotes: 'Angebote', orders: 'Aufträge', contracts: 'Verträge',
  time: 'Zeiterfassung', invoices: 'Rechnungen', finance: 'Finanzübersicht', employees: 'Mitarbeitende',
  audit: 'Audit und Nachvollziehbarkeit', expenses: 'Spesen', reminders: 'Mahnwesen', approvals: 'Freigaben',
  accounting: 'Erweiterte Finanzfunktionen', margin: 'Kosten und Margen', automations: 'Automationen',
  api: 'API und Integrationen', imports: 'Datenimport', exports: 'Datenexport',
}

export function planName(plan: SubscriptionPlan) {
  return getPlan(plan).name
}

export function isSelfServicePlan(plan: SubscriptionPlan): plan is (typeof SELF_SERVICE_PLANS)[number] {
  return SELF_SERVICE_PLANS.includes(plan as (typeof SELF_SERVICE_PLANS)[number])
}

export function selfServicePlans() {
  return selfServicePlanDefinitions
}
