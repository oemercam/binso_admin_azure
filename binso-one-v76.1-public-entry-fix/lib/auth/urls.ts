export function signInUrl(returnTo = '/post-login') {
  return `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
}

export function registerUrl(plan?: string) {
  const returnTo = plan ? `/register?plan=${encodeURIComponent(plan)}` : '/register'
  return signInUrl(returnTo)
}

export function signOutUrl(returnTo = '/sign-in') {
  return `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
}
