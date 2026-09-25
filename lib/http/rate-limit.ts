import { isDatabaseConfigured, query } from '@/lib/db/client'

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function clientKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-azure-clientip')?.trim() || 'unknown'
}

function bucketKey(request: Request, scope: string) {
  return `${scope}:${clientKey(request)}`
}

export function enforceRateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const now = Date.now()
  const key = bucketKey(request, scope)
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true as const, retryAfterSeconds: 0 }
  }
  if (current.count >= limit) return { allowed: false as const, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) }
  current.count += 1
  return { allowed: true as const, retryAfterSeconds: 0 }
}

/**
 * Distributed rate limiting for public/high-abuse routes. PostgreSQL is used deliberately
 * so multiple App Service instances share the same bucket without requiring another service.
 * If the database is unavailable we fail closed for protected public endpoints.
 */
export async function enforceDistributedRateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  if (!isDatabaseConfigured()) return enforceRateLimit(request, scope, limit, windowMs)
  const key = bucketKey(request, scope)
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  try {
    const result = await query<{ count: number; reset_at: Date }>(
      `insert into rate_limit_buckets(bucket_key,count,reset_at,updated_at)
       values($1,1,now()+($2::text || ' seconds')::interval,now())
       on conflict(bucket_key) do update set
         count = case when rate_limit_buckets.reset_at <= now() then 1 else rate_limit_buckets.count + 1 end,
         reset_at = case when rate_limit_buckets.reset_at <= now() then now()+($2::text || ' seconds')::interval else rate_limit_buckets.reset_at end,
         updated_at = now()
       returning count,reset_at`,
      [key, windowSeconds],
    )
    const row = result.rows[0]
    if (!row) return { allowed: false as const, retryAfterSeconds: windowSeconds }
    if (row.count > limit) return { allowed: false as const, retryAfterSeconds: Math.max(1, Math.ceil((row.reset_at.getTime() - Date.now()) / 1000)) }
    return { allowed: true as const, retryAfterSeconds: 0 }
  } catch {
    return { allowed: false as const, retryAfterSeconds: Math.max(1, windowSeconds) }
  }
}
