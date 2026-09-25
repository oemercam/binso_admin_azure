function bool(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true'
}

export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'Binso One',
  buildId: process.env.NEXT_PUBLIC_BUILD_ID?.trim() || '',
  buildDate: process.env.NEXT_PUBLIC_BUILD_DATE?.trim() || '',
  appEnvironment: process.env.NEXT_PUBLIC_APP_ENV?.trim() || process.env.NODE_ENV || 'development',
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || '',
  optionalAnalytics: bool(process.env.NEXT_PUBLIC_OPTIONAL_ANALYTICS),
  authMethods: process.env.NEXT_PUBLIC_AUTH_METHODS?.trim() || 'email,microsoft,google,apple',
  isProduction: process.env.NODE_ENV === 'production',
} as const
