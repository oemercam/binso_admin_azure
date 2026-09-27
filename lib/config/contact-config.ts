const personalAddress = 'oemer.cam@binso.ch'

function email(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() || ''
  if (!normalized || normalized === personalAddress) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : ''
}

export const roleContactsEnabled = process.env.NEXT_PUBLIC_ROLE_CONTACTS_ENABLED?.trim().toLowerCase() === 'true'

const configured = {
  general: email(process.env.NEXT_PUBLIC_CONTACT_GENERAL),
  support: email(process.env.NEXT_PUBLIC_CONTACT_SUPPORT),
  privacy: email(process.env.NEXT_PUBLIC_CONTACT_PRIVACY),
  security: email(process.env.NEXT_PUBLIC_CONTACT_SECURITY),
  sales: email(process.env.NEXT_PUBLIC_CONTACT_SALES),
  billing: email(process.env.NEXT_PUBLIC_CONTACT_BILLING),
  legal: email(process.env.NEXT_PUBLIC_CONTACT_LEGAL),
} as const

export const publicContacts = roleContactsEnabled ? configured : {
  general: '', support: '', privacy: '', security: '', sales: '', billing: '', legal: '',
} as const

export const systemContactTargets = {
  noReply: email(process.env.MAIL_FROM_SYSTEM),
  billing: email(process.env.MAIL_FROM_BILLING),
  replyToSupport: email(process.env.MAIL_REPLY_TO_SUPPORT),
} as const
