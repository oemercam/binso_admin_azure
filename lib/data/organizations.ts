import type { Organization } from '@/types/domain'

export const DEFAULT_ORGANIZATION_ID = 'org-binso-demo'

export const defaultOrganization: Organization = {
  id: DEFAULT_ORGANIZATION_ID,
  name: 'Binso GmbH',
  slug: 'binso',
  status: 'active',
  country: 'Schweiz',
  currency: 'CHF',
  locale: 'de-CH',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}
