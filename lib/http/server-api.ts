import { NextResponse } from 'next/server'

export function requestId(request?: Request) {
  return request?.headers.get('x-correlation-id')?.trim() || crypto.randomUUID()
}

export function apiJson<T>(data: T, init?: ResponseInit, correlationId = crypto.randomUUID()) {
  const response = NextResponse.json(data, init)
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  response.headers.set('X-Correlation-Id', correlationId)
  return response
}

export function apiError(status: number, code: string, message: string, correlationId = crypto.randomUUID()) {
  return apiJson({ error: { code, message } }, { status }, correlationId)
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return
  const expected = new URL(request.url).origin
  if (origin !== expected) throw new Error('invalid_origin')
}

export async function readJsonBody<T>(request: Request, maxBytes = 32_768): Promise<T> {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error('payload_too_large')
  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error('payload_too_large')
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('invalid_json')
  }
}
