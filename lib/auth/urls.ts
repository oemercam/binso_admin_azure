export function signInUrl(returnTo = '/') {
  return `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
}

export function signOutUrl(returnTo = '/sign-in') {
  return `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(returnTo)}`
}
