import { NextResponse, type NextRequest } from 'next/server'

const DEFAULT_OPERATOR_HOST = 'admin.binso.ch'
const DEFAULT_PUBLIC_HOST = 'www.binso.ch'

export function proxy(request: NextRequest) {
  const requestHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(':')[0].toLowerCase()
  const operatorHost = (process.env.BINSO_OPERATOR_HOST || DEFAULT_OPERATOR_HOST).toLowerCase()
  const publicHost = (process.env.BINSO_PUBLIC_HOST || DEFAULT_PUBLIC_HOST).toLowerCase()
  const protectedOperatorPath = request.nextUrl.pathname.startsWith('/platform') || request.nextUrl.pathname.startsWith('/api/platform')

  if (process.env.NODE_ENV === 'production' && protectedOperatorPath && requestHost !== operatorHost) {
    return new NextResponse('Not Found', { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })
  }

  const response = NextResponse.next()
  if (process.env.NODE_ENV === 'production' && requestHost && requestHost !== publicHost) response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/).*)'] }
