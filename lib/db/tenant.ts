import 'server-only'
import type { PoolClient } from 'pg'
import { withTransaction } from './client'

export type DatabaseTenantContext = {
  organizationId: string
  userId: string
}

/**
 * Executes tenant work in one PostgreSQL transaction and binds the RLS context
 * using transaction-local settings. Request/query supplied organization ids must
 * never be passed here unless they were resolved from an authenticated membership.
 */
export async function withTenantTransaction<T>(
  context: DatabaseTenantContext,
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return withTransaction(async (client) => {
    await client.query("select set_config('app.organization_id', $1, true)", [context.organizationId])
    await client.query("select set_config('app.user_id', $1, true)", [context.userId])
    return callback(client)
  })
}
