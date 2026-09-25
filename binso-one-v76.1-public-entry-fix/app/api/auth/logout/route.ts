import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/config/env'
import { publicRequestOrigin } from '@/lib/auth/public-origin'

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/sign-in'
  return value
}

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'))
  if (env.authMode === 'local') return NextResponse.redirect(new URL(returnTo, publicRequestOrigin(request)))

  const logout = new URL('/.auth/logout', publicRequestOrigin(request))
  logout.searchParams.set('post_logout_redirect_uri', returnTo)
  return NextResponse.redirect(logout)
}
