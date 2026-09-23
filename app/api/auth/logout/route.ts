import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/config/env'

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/sign-in'
  return value
}

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'))
  if (env.authMode === 'local') return NextResponse.redirect(new URL(returnTo, request.url))

  const logout = new URL('/.auth/logout', request.url)
  logout.searchParams.set('post_logout_redirect_uri', returnTo)
  return NextResponse.redirect(logout)
}
