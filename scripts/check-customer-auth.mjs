import { readFileSync, existsSync } from 'node:fs'

const requiredFiles = [
  'app/api/auth/login/route.ts',
  'components/auth/auth-methods.tsx',
  'docs/CUSTOMER-AUTHENTICATION-V64.md',
]
for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Customer auth check: missing ${file}`)
}

const urls = readFileSync('lib/auth/urls.ts', 'utf8')
const route = readFileSync('app/api/auth/login/route.ts', 'utf8')
const signIn = readFileSync('app/sign-in/page.tsx', 'utf8')
const register = readFileSync('app/register/page.tsx', 'utf8')
const env = readFileSync('.env.example', 'utf8')
const server = readFileSync('lib/auth/server.ts', 'utf8')

const invariants = [
  [urls.includes('/api/auth/login?returnTo='), 'signInUrl must use the internal auth gateway'],
  [route.includes("value.startsWith('/')") && route.includes("value.startsWith('//')"), 'returnTo must reject external redirects'],
  [route.includes('AUTH_PROVIDER_NAME') || route.includes('env.authProviderName'), 'provider must be server-configurable'],
  [signIn.includes('Anmelden oder registrieren') && !signIn.includes('Mit Microsoft anmelden'), 'sign-in must be provider-neutral'],
  [register.includes('E-Mail und Passwort') && register.includes('Anmelden oder registrieren'), 'registration must support provider-neutral customer auth'],
  [env.includes('NEXT_PUBLIC_AUTH_METHODS=email,microsoft,google,apple'), 'common customer methods must be documented'],
  [env.includes('AUTH_PROVIDER_NAME=aad'), 'safe Microsoft fallback must remain configured'],
  [server.includes("'emailaddress'") && server.includes("'preferred_username'"), 'principal parser must support external-ID email claims'],
  [!register.toLowerCase().includes('passwordhash') && !server.toLowerCase().includes('passwordhash'), 'application must not implement password persistence'],
]

for (const [ok, message] of invariants) if (!ok) throw new Error(`Customer auth check: ${message}`)
console.log(`Customer authentication check passed (${invariants.length} invariants, V64).`)
