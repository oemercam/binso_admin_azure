import { contracts as seedContracts, creditNotes as seedCreditNotes, customerActivities as seedCustomerActivities, customerContacts as seedCustomerContacts, customers as seedCustomers, expenses as seedExpenses, employees as seedEmployees, invoices as seedInvoices, orders as seedOrders, payments as seedPayments, quotes as seedQuotes, supplierInvoices as seedSupplierInvoices, suppliers as seedSuppliers, timeEntries as seedTimeEntries } from '@/lib/data/demo'
import { orderAssignmentRules as seedOrderAssignmentRules, orderPolicies as seedOrderPolicies, timeEvidence as seedTimeEvidence } from '@/lib/data/order-policies'
import { defaultCompanyProfile, defaultDocumentTemplates } from '@/lib/data/document-defaults'
import { defaultAppSettings } from '@/lib/data/app-settings'
import { DEFAULT_ORGANIZATION_ID, defaultOrganization } from '@/lib/data/organizations'
import { seedAuditEvents, seedEntitlements, seedExportJobs, seedImportJobs, seedMemberships, seedNumberSequences, seedSubscriptions } from '@/lib/data/saas'
import { mergeAppSettings } from '@/components/state/business-store-utils'
import type { AppSettings, BusinessBootstrap, CompanyProfile, DocumentTemplates } from '@/types/domain'
import type { BusinessState } from '@/components/state/business-store-types'

export const STORAGE_KEY = 'business-platform-demo-v13-organizations'
export const LEGACY_STORAGE_KEYS = ['binso-admin-demo-v12-responsive', 'binso-admin-demo-v10-e2e', 'binso-admin-demo-v9', 'binso-admin-demo-v8']

export function scopeRecords<T extends { organizationId: string }>(items: T[], organizationId = DEFAULT_ORGANIZATION_ID): T[] {
  return items.map((item) => ({ ...item, organizationId: item.organizationId ?? organizationId }))
}

export function freshState(includeDemo = true): BusinessState {
  return {
    organizations: [defaultOrganization],
    currentOrganizationId: DEFAULT_ORGANIZATION_ID,
    memberships: includeDemo ? seedMemberships : [],
    subscriptions: includeDemo ? seedSubscriptions : [],
    entitlements: includeDemo ? seedEntitlements : [],
    auditEvents: includeDemo ? seedAuditEvents : [],
    numberSequences: includeDemo ? seedNumberSequences : [],
    importJobs: includeDemo ? seedImportJobs : [],
    exportJobs: includeDemo ? seedExportJobs : [],
    customers: includeDemo ? scopeRecords(seedCustomers) : [],
    contracts: includeDemo ? scopeRecords(seedContracts) : [],
    expenses: includeDemo ? scopeRecords(seedExpenses) : [],
    creditNotes: includeDemo ? scopeRecords(seedCreditNotes) : [],
    customerActivities: includeDemo ? scopeRecords(seedCustomerActivities) : [],
    customerContacts: includeDemo ? scopeRecords(seedCustomerContacts) : [],
    suppliers: includeDemo ? scopeRecords(seedSuppliers) : [],
    quotes: includeDemo ? scopeRecords(seedQuotes) : [],
    orders: includeDemo ? scopeRecords(seedOrders) : [],
    timeEntries: includeDemo ? scopeRecords(seedTimeEntries) : [],
    invoices: includeDemo ? scopeRecords(seedInvoices) : [],
    payments: includeDemo ? scopeRecords(seedPayments) : [],
    supplierInvoices: includeDemo ? scopeRecords(seedSupplierInvoices) : [],
    employees: includeDemo ? scopeRecords(seedEmployees) : [],
    timeEvidence: includeDemo ? scopeRecords(seedTimeEvidence) : [],
    orderPolicies: includeDemo ? scopeRecords(seedOrderPolicies) : [],
    orderAssignmentRules: includeDemo ? scopeRecords(seedOrderAssignmentRules) : [],
    companyProfile: { ...defaultCompanyProfile, organizationId: DEFAULT_ORGANIZATION_ID },
    documentTemplates: defaultDocumentTemplates,
    appSettings: defaultAppSettings,
    companyProfiles: { [DEFAULT_ORGANIZATION_ID]: { ...defaultCompanyProfile, organizationId: DEFAULT_ORGANIZATION_ID } },
    documentTemplatesByOrganization: { [DEFAULT_ORGANIZATION_ID]: defaultDocumentTemplates },
    appSettingsByOrganization: { [DEFAULT_ORGANIZATION_ID]: defaultAppSettings },
  }
}

export function applyBootstrap(base: BusinessState, bootstrap?: BusinessBootstrap | null): BusinessState {
  if (!bootstrap?.organizations.length) return base
  const currentOrganizationId = bootstrap.currentOrganizationId
  return {
    ...base,
    organizations: bootstrap.organizations,
    currentOrganizationId,
    memberships: bootstrap.memberships,
    subscriptions: bootstrap.subscriptions,
    entitlements: bootstrap.entitlements,
    companyProfile: bootstrap.companyProfiles[currentOrganizationId] ?? { ...defaultCompanyProfile, organizationId: currentOrganizationId, name: bootstrap.organizations[0].name },
    companyProfiles: { ...base.companyProfiles, ...bootstrap.companyProfiles },
    documentTemplatesByOrganization: { ...base.documentTemplatesByOrganization, [currentOrganizationId]: base.documentTemplatesByOrganization[currentOrganizationId] ?? defaultDocumentTemplates },
    appSettingsByOrganization: { ...base.appSettingsByOrganization, [currentOrganizationId]: base.appSettingsByOrganization[currentOrganizationId] ?? defaultAppSettings },
  }
}


const TENANT_ARRAY_KEYS = [
  'auditEvents','numberSequences','importJobs','exportJobs','customers','contracts','expenses','creditNotes',
  'customerActivities','customerContacts','suppliers','quotes','orders','timeEntries','invoices','payments',
  'supplierInvoices','employees','timeEvidence','orderPolicies','orderAssignmentRules',
] as const satisfies readonly (keyof BusinessState)[]

export function tenantSnapshot(state: BusinessState, organizationId: string): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {}
  for (const key of TENANT_ARRAY_KEYS) {
    const value = state[key]
    if (Array.isArray(value)) snapshot[key] = value.filter((item) => typeof item === 'object' && item !== null && 'organizationId' in item && (item as { organizationId: string }).organizationId === organizationId)
  }
  snapshot.companyProfile = state.companyProfiles[organizationId] ?? state.companyProfile
  snapshot.documentTemplates = state.documentTemplatesByOrganization[organizationId] ?? state.documentTemplates
  snapshot.appSettings = state.appSettingsByOrganization[organizationId] ?? state.appSettings
  return snapshot
}

export function mergeTenantSnapshot(current: BusinessState, snapshot: Record<string, unknown>, organizationId: string): BusinessState {
  const next = { ...current }
  for (const key of TENANT_ARRAY_KEYS) {
    const incoming = Array.isArray(snapshot[key]) ? snapshot[key] : []
    const existing = current[key]
    if (!Array.isArray(existing)) continue
    ;(next as unknown as Record<string, unknown>)[key] = [
      ...existing.filter((item) => typeof item !== 'object' || item === null || !('organizationId' in item) || (item as { organizationId: string }).organizationId !== organizationId),
      ...incoming,
    ]
  }
  if (snapshot.companyProfile && typeof snapshot.companyProfile === 'object') {
    const profile = { ...defaultCompanyProfile, ...(snapshot.companyProfile as Partial<CompanyProfile>), organizationId }
    next.companyProfile = profile
    next.companyProfiles = { ...current.companyProfiles, [organizationId]: profile }
  }
  if (snapshot.documentTemplates && typeof snapshot.documentTemplates === 'object') {
    const templates = { ...defaultDocumentTemplates, ...(snapshot.documentTemplates as Partial<DocumentTemplates>) }
    next.documentTemplates = templates
    next.documentTemplatesByOrganization = { ...current.documentTemplatesByOrganization, [organizationId]: templates }
  }
  if (snapshot.appSettings && typeof snapshot.appSettings === 'object') {
    const settings = mergeAppSettings(snapshot.appSettings as Partial<AppSettings>)
    next.appSettings = settings
    next.appSettingsByOrganization = { ...current.appSettingsByOrganization, [organizationId]: settings }
  }
  return next
}

