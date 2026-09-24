import type { PlanDefinition } from '@/types/domain'

export const planDefinitions: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPriceChf: 39,
    includedUsers: 3,
    description: 'Für kleine Dienstleistungsfirmen, die Kontakte, Angebote und Rechnungen zentral verwalten möchten.',
    features: ['crm','quotes','invoices','exports'],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPriceChf: 89,
    includedUsers: 10,
    description: 'Für Teams mit laufenden Aufträgen, Verträgen, Zeiterfassung und Finanzübersicht.',
    features: ['crm','quotes','orders','contracts','time','invoices','finance','employees','imports','exports'],
    recommended: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPriceChf: 149,
    includedUsers: 25,
    description: 'Für wachsende Dienstleistungsunternehmen mit Workflows, Audit und erweiterten Prozessen.',
    features: ['crm','quotes','orders','contracts','time','invoices','finance','employees','audit','imports','exports'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    includedUsers: 100,
    description: 'Für grössere Organisationen mit individuellen Integrationen, Governance und Support.',
    features: ['crm','quotes','orders','contracts','time','invoices','finance','employees','audit','imports','exports'],
  },
]

export function getPlan(id: PlanDefinition['id']) {
  return planDefinitions.find((plan) => plan.id === id) ?? planDefinitions[0]
}
