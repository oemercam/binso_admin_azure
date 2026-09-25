import 'server-only'

function integer(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const serverEnv = {
  appBaseUrl: process.env.APP_BASE_URL?.trim() || '',
  databaseUrl: process.env.DATABASE_URL?.trim() || '',
  platformDatabaseUrl: process.env.PLATFORM_DATABASE_URL?.trim() || '',
  databaseSsl: process.env.DATABASE_SSL?.trim().toLowerCase() !== 'false',
  databasePoolMax: integer(process.env.DATABASE_POOL_MAX, 10),
  platformDatabasePoolMax: integer(process.env.PLATFORM_DATABASE_POOL_MAX, 5),
  internalJobSecret: process.env.INTERNAL_JOB_SECRET?.trim() || '',
  platformRoleSource: (process.env.PLATFORM_ROLE_SOURCE || 'hybrid').trim().toLowerCase(),
  websiteHostname: process.env.WEBSITE_HOSTNAME?.trim() || '',
  publicHost: process.env.BINSO_PUBLIC_HOST?.trim().toLowerCase() || '',
  pushSubscriptionEncryptionKey: process.env.PUSH_SUBSCRIPTION_ENCRYPTION_KEY?.trim() || '',
  emailDeliveryMode: process.env.EMAIL_DELIVERY_MODE?.trim().toLowerCase() || 'disabled',
  graphTenantId: process.env.GRAPH_TENANT_ID?.trim() || '',
  graphClientId: process.env.GRAPH_CLIENT_ID?.trim() || '',
  graphClientSecret: process.env.GRAPH_CLIENT_SECRET?.trim() || '',
  graphSenderUserId: process.env.GRAPH_SENDER_USER_ID?.trim() || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || '',
  stripePrices: {
    starter: process.env.STRIPE_PRICE_STARTER?.trim() || '',
    business: process.env.STRIPE_PRICE_BUSINESS?.trim() || '',
    professional: process.env.STRIPE_PRICE_PROFESSIONAL?.trim() || '',
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE?.trim() || '',
  },
} as const

export function requireServerEnv(key: keyof Pick<typeof serverEnv, 'graphTenantId' | 'graphClientId' | 'graphClientSecret' | 'graphSenderUserId'>) {
  const value = serverEnv[key]
  if (!value) throw new Error(`${key} ist nicht konfiguriert.`)
  return value
}
