function resolveAuthMode() {
  const requested = process.env.AUTH_MODE
  if (requested === 'local') return process.env.NODE_ENV === 'production' ? 'azure' as const : 'local' as const
  if (requested === 'azure') return 'azure' as const
  return process.env.NODE_ENV === 'production' ? 'azure' as const : 'local' as const
}

function resolveDefaultRole() {
  const value = process.env.AUTH_DEFAULT_ROLE?.toLowerCase()
  return value === 'owner' || value === 'admin' || value === 'finance' || value === 'employee' ? value : 'employee'
}

export const env = {
  authMode: resolveAuthMode(),
  authDefaultRole: resolveDefaultRole(),
  appName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'Binso Admin',
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || '',
} as const
