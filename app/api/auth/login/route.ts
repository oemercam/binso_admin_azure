import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/config/env'

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/post-login'
  return value
}

function safeProviderName(value: string) {
  return /^[a-zA-Z0-9_-]+$/.test(value) ? value : 'aad'
}

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'))
  if (env.authMode === 'local') return NextResponse.redirect(new URL(returnTo, request.url))

  const provider = safeProviderName(env.authProviderName)
  const login = new URL(`/.auth/login/${provider}`, request.url)
  login.searchParams.set('post_login_redirect_uri', returnTo)
  return NextResponse.redirect(login)
}
