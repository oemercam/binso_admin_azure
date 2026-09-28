import 'server-only'
import type { PoolClient } from 'pg'

export const NORMALIZED_CORE_KEYS = [
  'customers', 'customerContacts', 'quotes', 'orders', 'timeEntries', 'invoices', 'payments',
  'employees', 'contracts', 'suppliers', 'supplierInvoices', 'expenses', 'creditNotes', 'customerActivities',
] as const

export type State = Record<string, unknown>
export type Obj = Record<string, unknown>

type NumberTable = 'customers' | 'quotes' | 'invoices' | 'contracts' | 'credit_notes'
type NumberColumn = 'customer_no' | 'quote_no' | 'invoice_no' | 'contract_no' | 'credit_no'

export function records(state: State, key: string): Obj[] {
  const value = state[key]
  return Array.isArray(value)
    ? value.filter((item): item is Obj => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : []
}

export function nestedRecords(value: unknown): Obj[] {
  return Array.isArray(value)
    ? value.filter((item): item is Obj => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : []
}

export function text(value: unknown, fallback = '') { return typeof value === 'string' ? value : fallback }
export function optionalText(value: unknown) { return typeof value === 'string' && value.trim() ? value : null }
export function num(value: unknown, fallback = 0) { return typeof value === 'number' && Number.isFinite(value) ? value : fallback }
export function bool(value: unknown, fallback = false) { return typeof value === 'boolean' ? value : fallback }
export function json(value: unknown) { return value && typeof value === 'object' && !Array.isArray(value) ? JSON.stringify(value) : null }
export function stringArray(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [] }
export function dateText(value: unknown) { return value instanceof Date ? value.toISOString().slice(0, 10) : optionalText(value) }
export function timestampText(value: unknown) { return value instanceof Date ? value.toISOString() : optionalText(value) }

export async function existingNumber(
  client: PoolClient,
  table: NumberTable,
  organizationId: string,
  externalId: string,
  column: NumberColumn,
) {
  const result = await client.query<Record<string, string>>(
    `select ${column} as value from ${table} where organization_id=$1 and external_id=$2`,
    [organizationId, externalId],
  )
  return result.rows[0]?.value ?? null
}

export async function existingStatus(client: PoolClient, table: 'quotes' | 'orders' | 'invoices', organizationId: string, externalId: string) {
  const result = await client.query<{ status: string }>(
    `select status from ${table} where organization_id=$1 and external_id=$2`,
    [organizationId, externalId],
  )
  return result.rows[0]?.status ?? null
}

export async function pk(client: PoolClient, table: string, organizationId: string, externalId: string | null) {
  if (!externalId) return null
  const allowed = new Set(['customers', 'quotes', 'orders', 'invoices', 'contracts', 'suppliers', 'expenses', 'time_entries', 'invoice_lines'])
  if (!allowed.has(table)) throw new Error('normalized_repository_invalid_table')
  const result = await client.query<{ id: string }>(
    `select id::text from ${table} where organization_id=$1 and external_id=$2`,
    [organizationId, externalId],
  )
  return result.rows[0]?.id ?? null
}

export async function syncChildRows(client: PoolClient, table: 'quote_lines' | 'contract_lines' | 'invoice_lines', organizationId: string, parentColumn: 'quote_id' | 'contract_id' | 'invoice_id', parentId: string, externalIds: string[]) {
  await client.query(
    `delete from ${table} where organization_id=$1 and ${parentColumn}=$2 and not (external_id = any($3::text[]))`,
    [organizationId, parentId, externalIds],
  )
}

