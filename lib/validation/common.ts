import { MAX_SHORT_TEXT_LENGTH, MAX_TEXT_LENGTH } from '@/lib/config/product'

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function isEmail(value: string) {
  const normalized = normalizeEmail(value)
  return normalized.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
}

export function cleanShortText(value: string, maxLength = MAX_SHORT_TEXT_LENGTH) {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

export function cleanText(value: string, maxLength = MAX_TEXT_LENGTH) {
  return value.trim().slice(0, maxLength)
}
