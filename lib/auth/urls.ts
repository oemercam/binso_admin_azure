import { ROUTES } from '@/lib/navigation/routes'

export function signInUrl(returnTo: string = ROUTES.auth.postLogin) {
  return customerSignInUrl(returnTo)
}

export function customerSignInUrl(returnTo: string = ROUTES.auth.postLogin) {
  return `/api/auth/login?audience=customer&returnTo=${encodeURIComponent(returnTo)}`
}

export function adminSignInUrl(returnTo: string = ROUTES.app.platform) {
  return `/api/auth/login?audience=admin&returnTo=${encodeURIComponent(returnTo)}`
}

export function registerUrl(plan?: string) {
  const returnTo = plan ? `${ROUTES.auth.register}?plan=${encodeURIComponent(plan)}` : ROUTES.auth.register
  return customerSignInUrl(returnTo)
}

export function signOutUrl(returnTo: string = ROUTES.auth.signIn) {
  return `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
}
