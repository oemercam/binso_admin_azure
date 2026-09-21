export const env = {
  authMode: process.env.AUTH_MODE === 'azure' ? 'azure' : 'local',
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Binso Admin',
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
} as const
