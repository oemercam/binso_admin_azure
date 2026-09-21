import type { AppSettings } from '@/types/domain'

export const defaultAppSettings: AppSettings = {
  mail: {
    provider: 'microsoft365',
    senderName: 'Binso GmbH',
    invoiceSender: 'rechnungen@binso.ch',
    quoteSender: 'angebote@binso.ch',
    reminderSender: 'buchhaltung@binso.ch',
    payrollSender: 'lohn@binso.ch',
    replyTo: 'info@binso.ch',
    financeCc: '',
    attachPdf: true,
    deliveryTracking: true,
    copySender: false,
  },
  reminders: {
    enabled: true,
    automaticSend: false,
    firstAfterDays: 5,
    secondAfterDays: 12,
    thirdAfterDays: 22,
    onlyBusinessDays: true,
    stopWhenPaid: true,
  },
  payroll: {
    enabled: true,
    generateAfterApprovedTimesheet: true,
    autoSend: false,
    requireFinanceApproval: true,
    hourlyEmployeesOnly: true,
    period: 'monthly',
    subject: 'Lohnabrechnung {{period}} – Binso GmbH',
    emailBody:
      'Guten Tag {{name}}\n\nIm Anhang erhalten Sie Ihre Lohnabrechnung für {{period}}.\n\nFreundliche Grüsse\nBinso GmbH',
  },
  workflow: {
    requireTimeApproval: true,
    allowSelfApproval: false,
    lockInvoicedTimes: true,
    requireQuoteAcceptanceBeforeOrder: true,
  },
  notifications: {
    overdueInvoice: true,
    budgetWarning: true,
    expiringQuote: true,
    paymentReceived: true,
    timesheetReady: true,
  },
}
