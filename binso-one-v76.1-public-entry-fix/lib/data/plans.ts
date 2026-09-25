import type { PlanDefinition, SubscriptionPlan } from '@/types/domain'

export const planDefinitions: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPriceChf: 39,
    includedUsers: 3,
    maxStorageMb: 2048,
    selfService: true,
    positioning: 'Für Selbstständige und kleine Dienstleistungsfirmen',
    description: 'Der vollständige Kernprozess ohne unnötige Komplexität: Kunde, Angebot, Auftrag, Rechnung und Zahlung.',
    highlights: ['Kunden und Kontakte', 'Angebote und Aufträge', 'Rechnungen und Zahlungen', 'Einfache Exporte'],
    features: ['crm','quotes','orders','invoices','exports'],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPriceChf: 89,
    includedUsers: 10,
    maxStorageMb: 10240,
    selfService: true,
    positioning: 'Für Teams mit Projekten, Zeit und wiederkehrenden Abläufen',
    description: 'Alles aus Starter plus Zeiterfassung, Verträge, Mitarbeitende, Spesen, Freigaben und Finanzübersicht.',
    highlights: ['Zeiterfassung', 'Verträge und wiederkehrende Leistungen', 'Mitarbeitende und Freigaben', 'Spesen und Finanzübersicht'],
    features: ['crm','quotes','orders','contracts','time','invoices','finance','employees','expenses','reminders','approvals','imports','exports'],
    recommended: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPriceChf: 149,
    includedUsers: 25,
    maxStorageMb: 51200,
    selfService: true,
    positioning: 'Für wachsende Firmen mit Steuerung, Kontrolle und Integrationen',
    description: 'Alles aus Business plus Kosten und Margen, Audit, Buchhaltung, Automationen und API-Zugriff.',
    highlights: ['Kosten und Margen', 'Audit und Nachvollziehbarkeit', 'Buchhaltung und Datenimport', 'API und Automationen'],
    features: ['crm','quotes','orders','contracts','time','invoices','finance','employees','expenses','reminders','approvals','accounting','margin','audit','imports','exports','api','automations'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    includedUsers: 100,
    maxStorageMb: 204800,
    selfService: false,
    positioning: 'Individuelle Erweiterung für grössere Organisationen',
    description: 'Kein viertes Standardmodell. Enterprise wird individuell auf Basis von Professional vereinbart.',
    highlights: ['Individuelle Benutzer- und Speichergrenzen', 'Integrationen', 'Erweiterter Support', 'Vertragliche Anforderungen'],
    features: ['crm','quotes','orders','contracts','time','invoices','finance','employees','expenses','reminders','approvals','accounting','margin','audit','imports','exports','api','automations'],
  },
]

export const selfServicePlanDefinitions = planDefinitions.filter((plan) => plan.selfService)

export function getPlan(id: SubscriptionPlan) {
  return planDefinitions.find((plan) => plan.id === id) ?? planDefinitions[0]
}
