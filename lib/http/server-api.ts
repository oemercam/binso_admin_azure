import { NextResponse } from 'next/server'

export function apiJson<T>(data: T, init?: ResponseInit) {
  const response = NextResponse.json(data, init)
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  response.headers.set('X-Correlation-Id', crypto.randomUUID())
  return response
}

export function apiError(status: number, code: string, message: string) {
  return apiJson({ error: { code, message } }, { status })
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
