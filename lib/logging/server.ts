type LogMeta = Record<string, string | number | boolean | null | undefined>

const SENSITIVE_KEY = /(email|name|phone|address|token|secret|password|iban|authorization|cookie|api[-_]?key|client[-_]?secret)/i
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi
const STRIPE_KEY_PATTERN = /\b(?:sk|rk|whsec)_(?:live|test)?_?[A-Za-z0-9]+\b/gi

function sanitizeText(value: string) {
  return value
    .replace(EMAIL_PATTERN, '[redacted-email]')
    .replace(BEARER_PATTERN, 'Bearer [redacted]')
    .replace(STRIPE_KEY_PATTERN, '[redacted-secret]')
    .slice(0, 1_000)
}

function sanitize(meta: LogMeta = {}) {
  return Object.fromEntries(Object.entries(meta).filter(([key, value]) => {
    if (value === undefined) return false
    return !SENSITIVE_KEY.test(key)
  }).map(([key, value]) => [key, typeof value === 'string' ? sanitizeText(value) : value]))
}

export function logInfo(event: string, meta?: LogMeta) {
  console.info(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', event, ...sanitize(meta) }))
}

export function logError(event: string, error: unknown, meta?: LogMeta) {
  const err = error instanceof Error ? error : new Error('Unknown error')
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    event,
    error: err.name,
    message: sanitizeText(err.message),
    ...sanitize(meta),
  }))
}
