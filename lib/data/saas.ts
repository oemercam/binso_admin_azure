import type {
  AuditEvent,
  DataExportJob,
  ImportJob,
  NumberSequence,
  OrganizationEntitlements,
  OrganizationMembership,
  OrganizationSubscription,
} from '@/types/domain'
import { DEFAULT_ORGANIZATION_ID } from '@/lib/data/organizations'

export const seedMemberships: OrganizationMembership[] = [{
  id: 'membership-demo-owner',
  organizationId: DEFAULT_ORGANIZATION_ID,
  userId: 'local-demo',
  email: 'demo@binso.ch',
  role: 'owner',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}]

export const seedSubscriptions: OrganizationSubscription[] = [{
  id: 'subscription-binso',
  organizationId: DEFAULT_ORGANIZATION_ID,
  plan: 'professional',
  status: 'active',
  seats: 10,
}]

export const seedEntitlements: OrganizationEntitlements[] = [{
  organizationId: DEFAULT_ORGANIZATION_ID,
  features: ['crm','quotes','orders','contracts','time','invoices','finance','employees','expenses','reminders','approvals','accounting','margin','audit','imports','exports','api','automations'],
  maxUsers: 25,
  maxStorageMb: 51200,
}]

export const seedNumberSequences: NumberSequence[] = [
  { organizationId: DEFAULT_ORGANIZATION_ID, kind: 'customer', prefix: 'KD', nextValue: 1, padding: 4, includeYear: false },
  { organizationId: DEFAULT_ORGANIZATION_ID, kind: 'quote', prefix: 'AN', nextValue: 1, padding: 3, includeYear: true },
  { organizationId: DEFAULT_ORGANIZATION_ID, kind: 'order', prefix: 'AU', nextValue: 1, padding: 3, includeYear: true },
  { organizationId: DEFAULT_ORGANIZATION_ID, kind: 'contract', prefix: 'VR', nextValue: 1, padding: 3, includeYear: true },
  { organizationId: DEFAULT_ORGANIZATION_ID, kind: 'invoice', prefix: 'RE', nextValue: 1, padding: 3, includeYear: true },
  { organizationId: DEFAULT_ORGANIZATION_ID, kind: 'credit_note', prefix: 'GS', nextValue: 1, padding: 3, includeYear: true },
]

export const seedAuditEvents: AuditEvent[] = []
export const seedImportJobs: ImportJob[] = []
export const seedExportJobs: DataExportJob[] = []
