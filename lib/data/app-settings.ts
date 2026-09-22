import type { AppSettings } from '@/types/domain'

export const defaultAppSettings: AppSettings = {
  mail: {
    senderName: 'Binso GmbH',
    invoiceSender: 'rechnungen@binso.ch',
    quoteSender: 'angebote@binso.ch',
    reminderSender: 'buchhaltung@binso.ch',
    replyTo: 'info@binso.ch',
    financeCc: '',
  },
  workflow: {
    requireTimeApproval: true,
    allowSelfApproval: false,
    lockInvoicedTimes: true,
    requireQuoteAcceptanceBeforeOrder: true,
  },
  notifications: {
    overdueInvoice: true,
    expiringQuote: true,
  },
}
