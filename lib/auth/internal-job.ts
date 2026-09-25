import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { serverEnv } from '@/lib/config/server-env'

export function isInternalJobAuthorized(request: Request) {
  const configured = serverEnv.internalJobSecret
  const header = request.headers.get('authorization') || ''
  const supplied = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!configured || configured.length < 32 || !supplied) return false
  const expected = Buffer.from(configured)
  const candidate = Buffer.from(supplied)
  return expected.length === candidate.length && timingSafeEqual(expected, candidate)
}
