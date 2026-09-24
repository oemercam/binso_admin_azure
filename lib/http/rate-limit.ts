type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function clientKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-azure-clientip')?.trim() || 'unknown'
}

export function enforceRateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const now = Date.now()
  const key = `${scope}:${clientKey(request)}`
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true as const, retryAfterSeconds: 0 }
  }
  if (current.count >= limit) return { allowed: false as const, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) }
  current.count += 1
  return { allowed: true as const, retryAfterSeconds: 0 }
}
