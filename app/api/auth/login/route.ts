import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/config/env'
import { publicRequestOrigin } from '@/lib/auth/public-origin'

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/post-login'
  return value
}

function safeProviderName(value: string) {
  return /^[a-zA-Z0-9_-]+$/.test(value) ? value : 'aad'
}

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'))
  if (env.authMode === 'local') return NextResponse.redirect(new URL(returnTo, publicRequestOrigin(request)))

  const audience = request.nextUrl.searchParams.get('audience') === 'admin' ? 'admin' : 'customer'
  const configuredProvider = audience === 'admin' ? env.authAdminProviderName : env.authProviderName
  const provider = safeProviderName(configuredProvider)
  const login = new URL(`/.auth/login/${provider}`, publicRequestOrigin(request))
  login.searchParams.set('post_login_redirect_uri', returnTo)
  return NextResponse.redirect(login)
}
