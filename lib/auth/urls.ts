export function signInUrl(returnTo = '/post-login') {
  return customerSignInUrl(returnTo)
}

export function customerSignInUrl(returnTo = '/post-login') {
  return `/api/auth/login?audience=customer&returnTo=${encodeURIComponent(returnTo)}`
}

export function adminSignInUrl(returnTo = '/platform') {
  return `/api/auth/login?audience=admin&returnTo=${encodeURIComponent(returnTo)}`
}

export function registerUrl(plan?: string) {
  const returnTo = plan ? `/register?plan=${encodeURIComponent(plan)}` : '/register'
  return customerSignInUrl(returnTo)
}

export function signOutUrl(returnTo = '/sign-in') {
  return `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
}
