export function signInUrl(returnTo = '/') {
  return `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(returnTo)}`
}

export function signOutUrl(returnTo = '/sign-in') {
  return `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(returnTo)}`
}
