function resolveAuthMode() {
  const requested = process.env.AUTH_MODE
  if (requested === 'local') {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCAL_AUTH !== 'true') return 'azure' as const
    return 'local' as const
  }
  if (requested === 'azure') return 'azure' as const
  return process.env.NODE_ENV === 'production' ? 'azure' as const : 'local' as const
}

export const env = {
  authMode: resolveAuthMode(),
  appName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'Binso Admin',
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || '',
} as const
