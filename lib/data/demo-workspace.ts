import type { AppSettings, CompanyProfile, NumberSequence } from '@/types/domain'
import {
  contracts,
  creditNotes,
  customerActivities,
  customerContacts,
  customers,
  employees,
  expenses,
  invoices,
  orders,
  payments,
  quotes,
  supplierInvoices,
  suppliers,
  timeEntries,
} from '@/lib/data/demo'
import { orderAssignmentRules, orderPolicies, timeEvidence } from '@/lib/data/order-policies'
import { defaultAppSettings } from '@/lib/data/app-settings'
import { defaultCompanyProfile, defaultDocumentTemplates } from '@/lib/data/document-defaults'
import { seedNumberSequences } from '@/lib/data/saas'

function withOrganization<T extends { organizationId: string }>(items: readonly T[], organizationId: string): T[] {
  return items.map((item) => ({ ...item, organizationId }))
}

function demoSettings(): AppSettings {
  return {
    ...defaultAppSettings,
    mail: {
      ...defaultAppSettings.mail,
      senderName: 'Binso One Demo',
      invoiceSender: '',
      quoteSender: '',
      reminderSender: '',
      payrollSender: '',
      replyTo: '',
      financeCc: '',
      attachPdf: false,
      deliveryTracking: false,
      copySender: false,
    },
    reminders: {
      ...defaultAppSettings.reminders,
      automaticSend: false,
    },
    payroll: {
      ...defaultAppSettings.payroll,
      autoSend: false,
    },
  }
}

export function createDemoBusinessState(input: {
  organizationId: string
  organizationName: string
  ownerName: string
  ownerEmail: string
  address?: string
  zip?: string
  city?: string
  uid?: string
}): Record<string, unknown> {
  const { organizationId } = input

  const demoEmployees = withOrganization(employees, organizationId).map((employee) => (
    employee.id === 'emp-001'
      ? { ...employee, name: input.ownerName || 'Demo Benutzer', email: input.ownerEmail }
      : employee
  ))
  const demoTimeEntries = withOrganization(timeEntries, organizationId).map((entry) => (
    entry.personId === 'emp-001'
      ? { ...entry, personName: input.ownerName || 'Demo Benutzer' }
      : entry
  ))
  const demoEvidence = withOrganization(timeEvidence, organizationId).map((evidence) => (
    evidence.personId === 'emp-001'
      ? { ...evidence, fileName: evidence.fileName.replace(/Oemer-Cam/gi, 'Demo-Benutzer') }
      : evidence
  ))

  const companyProfile: CompanyProfile = {
    ...defaultCompanyProfile,
    organizationId,
    name: input.organizationName,
    address: input.address ?? '',
    zip: input.zip ?? '',
    city: input.city ?? '',
    uid: input.uid ?? '',
    email: input.ownerEmail,
  }
  const numberSequences: NumberSequence[] = withOrganization(seedNumberSequences, organizationId).map((sequence) => {
    const existingNext: Partial<Record<NumberSequence['kind'], number>> = {
      customer: 1004,
      quote: 15,
      order: 4,
      contract: 4,
      invoice: 10,
      credit_note: 1,
    }
    return { ...sequence, nextValue: existingNext[sequence.kind] ?? sequence.nextValue }
  })

  return {
    auditEvents: [],
    numberSequences,
    importJobs: [],
    exportJobs: [],
    customers: withOrganization(customers, organizationId),
    contracts: withOrganization(contracts, organizationId),
    expenses: withOrganization(expenses, organizationId),
    creditNotes: withOrganization(creditNotes, organizationId),
    customerActivities: withOrganization(customerActivities, organizationId),
    customerContacts: withOrganization(customerContacts, organizationId),
    suppliers: withOrganization(suppliers, organizationId),
    quotes: withOrganization(quotes, organizationId),
    orders: withOrganization(orders, organizationId),
    timeEntries: demoTimeEntries,
    invoices: withOrganization(invoices, organizationId),
    payments: withOrganization(payments, organizationId),
    supplierInvoices: withOrganization(supplierInvoices, organizationId),
    employees: demoEmployees,
    timeEvidence: demoEvidence,
    orderPolicies: withOrganization(orderPolicies, organizationId),
    orderAssignmentRules: withOrganization(orderAssignmentRules, organizationId),
    companyProfile,
    documentTemplates: { ...defaultDocumentTemplates },
    appSettings: demoSettings(),
  }
}
