type LogMeta = Record<string, string | number | boolean | null | undefined>

function sanitize(meta: LogMeta = {}) {
  return Object.fromEntries(Object.entries(meta).filter(([key, value]) => {
    if (value === undefined) return false
    return !/(email|name|phone|address|token|secret|password|iban)/i.test(key)
  }))
}

export function logInfo(event: string, meta?: LogMeta) {
  console.info(JSON.stringify({ level: 'info', event, ...sanitize(meta) }))
}

export function logError(event: string, error: unknown, meta?: LogMeta) {
  const err = error instanceof Error ? error : new Error('Unknown error')
  console.error(JSON.stringify({ level: 'error', event, error: err.name, message: err.message, ...sanitize(meta) }))
}
