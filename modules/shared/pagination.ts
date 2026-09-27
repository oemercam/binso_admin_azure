export const DEFAULT_PAGE_LIMIT = 50
export const MAX_PAGE_LIMIT = 100

export function boundedLimit(raw: string | number | null | undefined) {
  const value = typeof raw === 'string' ? Number(raw) : raw
  if (!Number.isFinite(value)) return DEFAULT_PAGE_LIMIT
  return Math.max(1, Math.min(MAX_PAGE_LIMIT, Math.trunc(value as number)))
}

export type Cursor = { createdAt: string; id: string }

export function encodeCursor(cursor: Cursor) {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

export function decodeCursor(raw: string | null | undefined): Cursor | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Partial<Cursor>
    if (typeof parsed.createdAt !== 'string' || typeof parsed.id !== 'string' || !parsed.id) return null
    if (Number.isNaN(Date.parse(parsed.createdAt))) return null
    return { createdAt: parsed.createdAt, id: parsed.id }
  } catch {
    return null
  }
}
