import { readFileSync, existsSync } from 'node:fs'

const requiredFiles = [
  'app/api/auth/login/route.ts',
  'app/api/auth/logout/route.ts',
  'app/sign-in/page.tsx',
  'app/register/page.tsx',
  'docs/CUSTOMER-AUTHENTICATION-V65.md',
]
for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Customer auth check: missing ${file}`)
}

const urls = readFileSync('lib/auth/urls.ts', 'utf8')
const loginRoute = readFileSync('app/api/auth/login/route.ts', 'utf8')
const logoutRoute = readFileSync('app/api/auth/logout/route.ts', 'utf8')
const signIn = readFileSync('app/sign-in/page.tsx', 'utf8')
const register = readFileSync('app/register/page.tsx', 'utf8')
const env = readFileSync('.env.example', 'utf8')
const server = readFileSync('lib/auth/server.ts', 'utf8')

const invariants = [
  [urls.includes('/api/auth/login?returnTo='), 'signInUrl must use the internal auth gateway'],
  [urls.includes('/api/auth/logout?returnTo='), 'signOutUrl must use the internal logout gateway'],
  [loginRoute.includes("value.startsWith('/')") && loginRoute.includes("value.startsWith('//')"), 'login returnTo must reject external redirects'],
  [logoutRoute.includes("value.startsWith('/')") && logoutRoute.includes("value.startsWith('//')"), 'logout returnTo must reject external redirects'],
  [loginRoute.includes('env.authProviderName'), 'provider must be server-configurable'],
  [signIn.includes('>Anmelden</a>') && signIn.includes('Registrieren</a>'), 'sign-in must expose distinct sign-in and registration actions'],
  [signIn.includes("redirect('/post-login')"), 'authenticated users must leave the sign-in page'],
  [register.includes('Registrierung starten') && register.includes('Bereits registriert?'), 'registration must provide a clear customer flow'],
  [env.includes('AUTH_PROVIDER_NAME=aad'), 'safe Microsoft fallback must remain configured'],
  [server.includes("'emailaddress'") && server.includes("'preferred_username'"), 'principal parser must support external-ID email claims'],
  [!register.toLowerCase().includes('passwordhash') && !server.toLowerCase().includes('passwordhash'), 'application must not implement password persistence'],
]

for (const [ok, message] of invariants) if (!ok) throw new Error(`Customer auth check: ${message}`)
console.log(`Customer authentication check passed (${invariants.length} invariants, V65).`)
