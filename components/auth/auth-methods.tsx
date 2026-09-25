import { publicEnv } from '@/lib/config/public-env'

type AuthMethod = 'email' | 'microsoft' | 'google' | 'apple'

const labels: Record<AuthMethod, string> = {
  email: 'E-Mail + Passwort',
  microsoft: 'Microsoft',
  google: 'Google',
  apple: 'Apple',
}

function configuredMethods(): AuthMethod[] {
  const configured = publicEnv.authMethods
  const values = configured
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is AuthMethod => value in labels)
  return Array.from(new Set(values))
}

export function AuthMethods() {
  const methods = configuredMethods()
  return (
    <div className="auth-methods" aria-label="Verfügbare Anmeldearten">
      {methods.map((method) => <span key={method}>{labels[method]}</span>)}
    </div>
  )
}
