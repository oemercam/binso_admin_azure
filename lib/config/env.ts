import { publicEnv } from '@/lib/config/public-env'

function resolveAuthMode() {
  const requested = process.env.AUTH_MODE
  if (requested === 'local') return publicEnv.isProduction ? 'azure' as const : 'local' as const
  if (requested === 'azure') return 'azure' as const
  return publicEnv.isProduction ? 'azure' as const : 'local' as const
}

function resolveDefaultRole() {
  const value = process.env.AUTH_DEFAULT_ROLE?.toLowerCase()
  return value === 'owner' || value === 'admin' || value === 'finance' || value === 'employee' ? value : 'employee'
}

export const env = {
  authMode: resolveAuthMode(),
  authDefaultRole: resolveDefaultRole(),
  appName: publicEnv.appName,
  vapidPublicKey: publicEnv.vapidPublicKey,
  authProviderName: process.env.AUTH_PROVIDER_NAME?.trim() || 'aad',
  authAdminProviderName: process.env.AUTH_ADMIN_PROVIDER_NAME?.trim() || 'aad',
} as const
