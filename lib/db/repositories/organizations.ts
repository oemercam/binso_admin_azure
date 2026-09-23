import 'server-only'
import type { PoolClient } from 'pg'
import type { Organization } from '@/types/domain'

type OrganizationRow = {
  id: string
  name: string
  slug: string
  status: 'active' | 'inactive'
  country: string
  currency: 'CHF' | 'EUR'
  locale: 'de-CH' | 'fr-CH' | 'it-CH' | 'en-CH'
  created_at: Date
  updated_at: Date
}

function mapOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    country: row.country,
    currency: row.currency,
    locale: row.locale,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function findOrganizationById(client: PoolClient, organizationId: string) {
  const result = await client.query<OrganizationRow>(
    `select id, name, slug, status, country, currency, locale, created_at, updated_at
       from organizations
      where id = $1
      limit 1`,
    [organizationId],
  )
  return result.rows[0] ? mapOrganization(result.rows[0]) : null
}
