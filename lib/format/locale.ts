const CHF_FORMATTERS = new Map<string, Intl.NumberFormat>()
const DATE_FORMATTER = new Intl.DateTimeFormat('de-CH')
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('de-CH', { dateStyle: 'short', timeStyle: 'short' })
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' })
const MONTH_FORMATTER = new Intl.DateTimeFormat('de-CH', { month: 'long' })
const MONTH_SHORT_FORMATTER = new Intl.DateTimeFormat('de-CH', { month: 'short' })

const ZURICH_DATE_FORMATTER = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' })
const HOURS_FORMATTER = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 })

function currencyFormatter(minimumFractionDigits: number, maximumFractionDigits: number) {
  const key = `${minimumFractionDigits}:${maximumFractionDigits}`
  const existing = CHF_FORMATTERS.get(key)
  if (existing) return existing
  const formatter = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits,
    maximumFractionDigits,
  })
  CHF_FORMATTERS.set(key, formatter)
  return formatter
}

export function formatChf(value: number, options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}) {
  const minimum = options.minimumFractionDigits ?? 0
  const maximum = options.maximumFractionDigits ?? Math.max(minimum, 2)
  return currencyFormatter(minimum, maximum)
    .format(Number.isFinite(value) ? value : 0)
    .replace(/['’]/g, '’')
}

export function dateFromIso(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12)
  return Number.isNaN(date.getTime()) ? null : date
}

export function isoFromDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function formatDate(value?: string | null, fallback = '–') {
  const date = dateFromIso(value)
  return date ? DATE_FORMATTER.format(date) : fallback
}


export function formatCalendarDate(value?: string | Date | null, fallback = '–') {
  if (!value) return fallback
  const date = value instanceof Date ? value : (/^\d{4}-\d{2}-\d{2}$/.test(value) ? dateFromIso(value) : new Date(value))
  return date && !Number.isNaN(date.getTime()) ? DATE_FORMATTER.format(date) : fallback
}

export function formatDateTime(value?: string | Date | null, fallback = '–') {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : DATE_TIME_FORMATTER.format(date)
}

export function formatMonthYear(value: string | Date) {
  const date = typeof value === 'string' ? dateFromIso(value) : value
  return date ? MONTH_YEAR_FORMATTER.format(date) : '–'
}

export function formatMonth(value: string | Date) {
  const date = typeof value === 'string' ? dateFromIso(value) : value
  return date ? MONTH_FORMATTER.format(date) : '–'
}

export function formatMonthShort(value: string | Date) {
  const date = typeof value === 'string' ? dateFromIso(value) : value
  return date ? MONTH_SHORT_FORMATTER.format(date).replace('.', '') : '–'
}

export function isSameMonthIso(value: string, reference = todayIso()) {
  return value.slice(0, 7) === reference.slice(0, 7)
}

export function todayIso() {
  return isoFromDate(new Date())
}

export function todayZurichIso() {
  return ZURICH_DATE_FORMATTER.format(new Date())
}

export function addDaysIso(value: string, days: number) {
  const date = dateFromIso(value)
  if (!date) return value
  date.setDate(date.getDate() + days)
  return isoFromDate(date)
}

export function normalizeSearch(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-CH')
}

export function formatHours(value: number) {
  return `${HOURS_FORMATTER.format(Number.isFinite(value) ? value : 0)} h`
}
