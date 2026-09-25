import { readFileSync, existsSync } from 'node:fs'

const requiredFiles = [
  'app/api/auth/login/route.ts',
  'app/api/auth/logout/route.ts',
  'app/sign-in/page.tsx',
  'app/register/page.tsx',
  'app/admin-access/page.tsx',
  'docs/CUSTOMER-AUTHENTICATION-V65.md',
]

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Customer auth check: missing ${file}`)
  }
}

const urls = readFileSync('lib/auth/urls.ts', 'utf8')
const loginRoute = readFileSync('app/api/auth/login/route.ts', 'utf8')
const logoutRoute = readFileSync('app/api/auth/logout/route.ts', 'utf8')
const signIn = readFileSync('app/sign-in/page.tsx', 'utf8')
const adminAccess = readFileSync('app/admin-access/page.tsx', 'utf8')
const publicShell = readFileSync('components/public/public-shell.tsx', 'utf8')
const publicSiteConfig = readFileSync('lib/config/public-site.ts', 'utf8')
const register = readFileSync('app/register/page.tsx', 'utf8')
const env = readFileSync('.env.example', 'utf8')
const server = readFileSync('lib/auth/server.ts', 'utf8')

const invariants = [
  [
    urls.includes('/api/auth/login?audience=customer&returnTo='),
    'customerSignInUrl must use the internal customer auth gateway',
  ],
  [
    urls.includes('/api/auth/login?audience=admin&returnTo='),
    'adminSignInUrl must use the internal admin auth gateway',
  ],
  [
    urls.includes('/api/auth/logout?returnTo='),
    'signOutUrl must use the internal logout gateway',
  ],
  [
    loginRoute.includes("value.startsWith('/')") &&
      loginRoute.includes("value.startsWith('//')"),
    'login returnTo must reject external redirects',
  ],
  [
    logoutRoute.includes("value.startsWith('/')") &&
      logoutRoute.includes("value.startsWith('//')"),
    'logout returnTo must reject external redirects',
  ],
  [
    loginRoute.includes('env.authProviderName'),
    'customer provider must remain server-configurable',
  ],
  [
    loginRoute.includes('env.authAdminProviderName'),
    'admin provider must remain server-configurable',
  ],
  [
    signIn.includes('customerSignInUrl') &&
      signIn.includes("'/post-login'"),
    'customer sign-in must use the customer authentication flow',
  ],
  [
    signIn.includes('/admin-access'),
    'customer sign-in must expose the separate admin access',
  ],
  [
    adminAccess.includes('adminSignInUrl'),
    'admin access must use the dedicated admin authentication flow',
  ],
  [
    publicShell.includes('href="/sign-in"') &&
      publicShell.includes('href="/register"') &&
      publicShell.includes('publicSite.accessNavigation'),
    'public shell must expose customer entry actions and the access navigation',
  ],
  [
    publicSiteConfig.includes("href: '/sign-in'") &&
      publicSiteConfig.includes("href: '/register'") &&
      publicSiteConfig.includes("href: '/admin-access'"),
    'public access navigation must define customer login, registration and admin access separately',
  ],
  [
    signIn.includes("redirect('/post-login')"),
    'authenticated users must leave the customer sign-in page',
  ],
  [
    register.includes('Konto erstellen') &&
      register.includes('Bereits registriert?'),
    'registration must provide a clear customer flow',
  ],
  [
    env.includes('AUTH_PROVIDER_NAME='),
    'customer auth provider configuration must exist',
  ],
  [
    env.includes('AUTH_ADMIN_PROVIDER_NAME=aad'),
    'Binso admin Microsoft provider must remain configured',
  ],
  [
    server.includes("'emailaddress'") &&
      server.includes("'preferred_username'"),
    'principal parser must support external-ID email claims',
  ],
  [
    !register.toLowerCase().includes('passwordhash') &&
      !server.toLowerCase().includes('passwordhash'),
    'application must not implement password persistence',
  ],
]

for (const [ok, message] of invariants) {
  if (!ok) {
    throw new Error(`Customer auth check: ${message}`)
  }
}

console.log(
  `Customer authentication check passed (${invariants.length} invariants, V78).`,
)
