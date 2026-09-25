export const PRODUCT_LOCALE = 'de-CH' as const
export const PRODUCT_CURRENCY = 'CHF' as const
export const TRIAL_DAYS = 30
export const DEMO_ACCESS_HOURS = 24
export const DEFAULT_PAGE_SIZE = 25
export const MAX_TEXT_LENGTH = 2_000
export const MAX_SHORT_TEXT_LENGTH = 160
export const MIN_TOUCH_TARGET_PX = 44

export const PRODUCT_LIMITS = {
  registrationAttempts: 8,
  registrationWindowMs: 15 * 60_000,
  apiBodyTinyBytes: 2_048,
  apiBodySmallBytes: 4_096,
  apiBodyMediumBytes: 8_192,
  apiBodyContactBytes: 12_000,
  apiBodyStandardBytes: 16_384,
  apiBodySupportBytes: 24_000,
  defaultApiBodyBytes: 32_768,
  apiBodyArticleBytes: 64_000,
  stripeWebhookBodyBytes: 512_000,
  businessStateBodyBytes: 2_000_000,
  businessStateRecordsPerCollection: 10_000,
  csvUploadBytes: 2_000_000,
  auditReasonLength: 500,
} as const
