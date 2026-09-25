import type {
  Contract,
  CreditNote,
  Customer,
  CustomerContact,
  CustomerActivity,
  Expense,
  Employee,
  Invoice,
  Order,
  Payment,
  Quote,
  Supplier,
  SupplierInvoice,
  TimeEntry,
} from '@/types/domain'
import { DEFAULT_ORGANIZATION_ID } from '@/lib/data/organizations'

// Sämtliche Firmen- und Personennamen ausser Binso GmbH sind fiktive Demo-Daten.
export const customers: Customer[] = [
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'cus-001',
    customerNo: 'K-1001',
    name: 'Alpine Public IT AG',
    legalName: 'Alpine Public IT AG',
    contact: 'Marco Frei',
    email: 'marco.frei@demo-alpine.ch',
    phone: '+41 31 555 21 40',
    address: 'Bundesgasse 18',
    zip: '3011',
    city: 'Bern',
    country: 'Schweiz',
    uid: 'CHE-111.222.333 MWST',
    paymentDays: 30,
    status: 'active',
    notes: 'Demo-Kunde für laufende IT-Dienstleistungen und wiederkehrende Betreuung.',
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'cus-002',
    customerNo: 'K-1002',
    name: 'Muster Industrie AG',
    contact: 'Anna Keller',
    email: 'anna.keller@demo-muster.ch',
    phone: '+41 44 555 18 20',
    address: 'Industriestrasse 44',
    zip: '8005',
    city: 'Zürich',
    country: 'Schweiz',
    uid: 'CHE-444.555.666 MWST',
    paymentDays: 20,
    status: 'active',
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'cus-003',
    customerNo: 'K-1003',
    name: 'Helvetic Systems AG',
    contact: 'Luca Meier',
    email: 'luca.meier@demo-helvetic.ch',
    phone: '+41 71 555 10 80',
    address: 'Rosenbergstrasse 7',
    zip: '9000',
    city: 'St. Gallen',
    country: 'Schweiz',
    paymentDays: 30,
    status: 'active',
  },
]

export const suppliers: Supplier[] = [
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'sup-001',
    supplierNo: 'L-2001',
    name: 'Meier Cloud Consulting GmbH',
    contact: 'Dario Meier',
    email: 'dario.meier@demo-mcc.ch',
    uid: 'CHE-777.888.999 MWST',
    paymentDays: 20,
    status: 'active',
  },
]

export const quotes: Quote[] = [
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'quo-001',
    number: 'AN-2026-014',
    customerId: 'cus-002',
    customerName: 'Muster Industrie AG',
    title: 'Workplace Engineering Erweiterung',
    validUntil: '30.09.2026',
    status: 'sent',
    version: 2,
    lines: [
      { id: 'ql-001', description: 'Senior Workplace Engineering', quantity: 80, unit: 'h', unitPrice: 165 },
      { id: 'ql-002', description: 'Technische Dokumentation', quantity: 16, unit: 'h', unitPrice: 150 },
      { id: 'ql-003', description: 'Projektstart und Übergabe', quantity: 1, unit: 'pauschal', unitPrice: 1200 },
    ],
    amount: 16800,
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'quo-002',
    number: 'AN-2026-013',
    customerId: 'cus-003',
    customerName: 'Helvetic Systems AG',
    title: 'M365 Security Assessment',
    validUntil: '27.09.2026',
    status: 'accepted',
    version: 1,
    lines: [
      { id: 'ql-004', description: 'Security Assessment', quantity: 40, unit: 'h', unitPrice: 185 },
      { id: 'ql-005', description: 'Management Report', quantity: 1, unit: 'pauschal', unitPrice: 2200 },
    ],
    amount: 9600,
  },
]

export const orders: Order[] = [
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'ord-001',
    customerId: 'cus-001',
    customerName: 'Alpine Public IT AG',
    endCustomerName: 'Bundesstelle Digital Services (Demo)',
    primeContractorName: 'Alpine Public IT AG',
    name: 'Digital Workplace Betreuung',
    mandateRef: 'MV-BIN-2026-017',
    procurementRef: 'REF-2026-04',
    budgetHours: 1600,
    usedHours: 334.5,
    salesRate: 165,
    costRate: 103,
    billingModel: 'time',
    status: 'active',
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'ord-002',
    customerId: 'cus-002',
    customerName: 'Muster Industrie AG',
    name: 'Client Migration Phase 2',
    mandateRef: 'MI-2026-082',
    budgetHours: 420,
    usedHours: 301,
    salesRate: 165,
    costRate: 110,
    billingModel: 'time',
    status: 'active',
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'ord-003',
    customerId: 'cus-003',
    customerName: 'Helvetic Systems AG',
    name: 'M365 Security Assessment',
    mandateRef: 'HS-SEC-026',
    budgetHours: 120,
    usedHours: 84,
    salesRate: 185,
    costRate: 118,
    billingModel: 'mixed',
    status: 'active',
  },
]

export const timeEntries: TimeEntry[] = [
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'time-001', orderId: 'ord-001', orderName: 'Digital Workplace Betreuung', customerId: 'cus-001', customerName: 'Alpine Public IT AG',
    personId: 'emp-001', personName: 'Ömer Cam', workerType: 'employee', date: '2026-09-01', hours: 8,
    description: 'Workplace Architektur, Abstimmung und technische Führung', billable: true, approved: true, salesRate: 165, internalCostRate: 105, invoicedInvoiceId: 'inv-001',
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'time-002', orderId: 'ord-001', orderName: 'Digital Workplace Betreuung', customerId: 'cus-001', customerName: 'Alpine Public IT AG',
    personId: 'emp-002', personName: 'Nina Keller', workerType: 'hourly_employee', date: '2026-09-02', hours: 7.5,
    description: 'Client Engineering und Pakettests', billable: true, approved: true, salesRate: 145, internalCostRate: 72, invoicedInvoiceId: 'inv-001',
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'time-003', orderId: 'ord-001', orderName: 'Digital Workplace Betreuung', customerId: 'cus-001', customerName: 'Alpine Public IT AG',
    personId: 'ext-001', personName: 'Dario Meier / Meier Cloud Consulting GmbH', workerType: 'external', date: '2026-09-03', hours: 8,
    description: 'M365 Engineering und technische Analyse', billable: true, approved: true, salesRate: 165, internalCostRate: 125, invoicedInvoiceId: 'inv-001',
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'time-004', orderId: 'ord-001', orderName: 'Digital Workplace Betreuung', customerId: 'cus-001', customerName: 'Alpine Public IT AG',
    personId: 'emp-001', personName: 'Ömer Cam', workerType: 'employee', date: '2026-09-08', hours: 8,
    description: 'Security Hardening und Review', billable: true, approved: true, salesRate: 165, internalCostRate: 105,
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'time-005', orderId: 'ord-001', orderName: 'Digital Workplace Betreuung', customerId: 'cus-001', customerName: 'Alpine Public IT AG',
    personId: 'emp-002', personName: 'Nina Keller', workerType: 'hourly_employee', date: '2026-09-09', hours: 8,
    description: 'Treiber- und Hardwarevalidierung', billable: true, approved: true, salesRate: 145, internalCostRate: 72,
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'time-006', orderId: 'ord-001', orderName: 'Digital Workplace Betreuung', customerId: 'cus-001', customerName: 'Alpine Public IT AG',
    personId: 'ext-001', personName: 'Dario Meier / Meier Cloud Consulting GmbH', workerType: 'external', date: '2026-09-10', hours: 6,
    description: 'Intune Policy Review', billable: true, approved: true, salesRate: 165, internalCostRate: 125,
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'time-007', orderId: 'ord-002', orderName: 'Client Migration Phase 2', customerId: 'cus-002', customerName: 'Muster Industrie AG',
    personId: 'emp-001', personName: 'Ömer Cam', workerType: 'employee', date: '2026-09-15', hours: 7.5,
    description: 'Migration und Abnahmetest', billable: true, approved: true, salesRate: 165, internalCostRate: 105,
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'time-008', orderId: 'ord-003', orderName: 'M365 Security Assessment', customerId: 'cus-003', customerName: 'Helvetic Systems AG',
    personId: 'emp-001', personName: 'Ömer Cam', workerType: 'employee', date: '2026-08-28', hours: 6.5,
    description: 'Assessment und Management Summary', billable: true, approved: true, salesRate: 185, internalCostRate: 105, invoicedInvoiceId: 'inv-002',
  },
]

export const invoices: Invoice[] = [
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'inv-001', number: 'RE-2026-009', customerId: 'cus-001', customerName: 'Alpine Public IT AG', orderId: 'ord-001', orderName: 'Digital Workplace Betreuung',
    period: 'September 2026', issueDate: '2026-09-18', due: '2026-10-18', status: 'sent',
    lines: [
      { id: 'il-001', description: '01.09.2026 – Workplace Architektur, Abstimmung und technische Führung – Ömer Cam', quantity: 8, unit: 'h', unitPrice: 165, vatRate: 8.1, sourceTimeEntryIds: ['time-001'] },
      { id: 'il-002', description: '02.09.2026 – Client Engineering und Pakettests – Nina Keller', quantity: 7.5, unit: 'h', unitPrice: 145, vatRate: 8.1, sourceTimeEntryIds: ['time-002'] },
      { id: 'il-003', description: '03.09.2026 – M365 Engineering und technische Analyse – Dario Meier', quantity: 8, unit: 'h', unitPrice: 165, vatRate: 8.1, sourceTimeEntryIds: ['time-003'] },
    ],
    subtotal: 3682.5,
    vatAmount: 298.28,
    amount: 3980.78,
    paidAmount: 0,
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'inv-002', number: 'RE-2026-008', customerId: 'cus-003', customerName: 'Helvetic Systems AG', orderId: 'ord-003', orderName: 'M365 Security Assessment',
    period: 'August 2026', issueDate: '2026-08-31', due: '2026-09-20', status: 'overdue',
    lines: [
      { id: 'il-004', description: 'Security Assessment und Management Summary', quantity: 6.5, unit: 'h', unitPrice: 185, vatRate: 8.1, sourceTimeEntryIds: ['time-008'] },
      { id: 'il-005', description: 'Management Report', quantity: 1, unit: 'pauschal', unitPrice: 777.5, vatRate: 8.1, sourceTimeEntryIds: [] },
    ],
    subtotal: 1980,
    vatAmount: 160.38,
    amount: 2140.38,
    paidAmount: 0,
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'inv-003', number: 'RE-2026-007', customerId: 'cus-002', customerName: 'Muster Industrie AG', orderId: 'ord-002', orderName: 'Client Migration Phase 2',
    period: 'August 2026', issueDate: '2026-08-25', due: '2026-09-14', status: 'paid',
    lines: [
      { id: 'il-006', description: 'Client Migration Leistungen August 2026', quantity: 47, unit: 'h', unitPrice: 165, vatRate: 8.1, sourceTimeEntryIds: [] },
    ],
    subtotal: 7755,
    vatAmount: 628.16,
    amount: 8383.16,
    paidAmount: 8383.16,
  },
]

export const payments: Payment[] = [
  { organizationId: DEFAULT_ORGANIZATION_ID, id: 'pay-001', invoiceId: 'inv-003', date: '2026-09-18', amount: 8383.16, method: 'Bank', reference: 'BANK-20260918-0042' },
]

export const supplierInvoices: SupplierInvoice[] = [
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'sinv-001', number: 'MCC-2026-091', supplierId: 'sup-001', supplierName: 'Meier Cloud Consulting GmbH',
    orderId: 'ord-001', orderName: 'Digital Workplace Betreuung', invoiceDate: '2026-09-15', due: '2026-10-05',
    netAmount: 1750, vatAmount: 141.75, amount: 1891.75, status: 'open',
    note: '14 h externe Engineering-Leistung à CHF 125.00 für den Auftrag.',
  },
]

export const employees: Employee[] = [
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'emp-001', name: 'Ömer Cam', role: 'owner', email: 'oemer.cam@binso.ch', employmentType: 'salary', status: 'active',
    targetHours: 168, bookedHours: 124.5, billableHours: 112, utilisation: 67, internalCostRate: 105,
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'emp-002', name: 'Nina Keller', role: 'employee', email: 'nina.keller@demo-binso.ch', employmentType: 'hourly', status: 'active',
    targetHours: 120, bookedHours: 94.5, billableHours: 88, utilisation: 73, internalCostRate: 72,
  },
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'emp-003', name: 'David Frei', role: 'finance', email: 'david.frei@demo-binso.ch', employmentType: 'salary', status: 'active',
    targetHours: 168, bookedHours: 142, billableHours: 41, utilisation: 24, internalCostRate: 86,
  },
]

export const revenueSeries = [
  { month: 'Apr', revenue: 9800, cost: 7100 },
  { month: 'Mai', revenue: 11200, cost: 7850 },
  { month: 'Jun', revenue: 10400, cost: 7480 },
  { month: 'Jul', revenue: 12600, cost: 8580 },
  { month: 'Aug', revenue: 13900, cost: 9330 },
  { month: 'Sep', revenue: 18660, cost: 12612 },
]

export const activity = [
  { time: 'Heute, 09:12', title: '8.0 h erfasst', meta: 'Digital Workplace Betreuung' },
  { time: 'Gestern, 16:40', title: 'Lieferantenrechnung erfasst', meta: 'MCC-2026-091 · CHF 1’891.75' },
  { time: '18.09, 14:08', title: 'Zahlung verbucht', meta: 'RE-2026-007 · CHF 8’383.16' },
  { time: '17.09, 11:32', title: 'Angebot versendet', meta: 'AN-2026-014 · Muster Industrie AG' },
]


export const contracts: Contract[] = [
  {
    organizationId: DEFAULT_ORGANIZATION_ID,
    id: 'con-001', number: 'VR-2026-003', customerId: 'cus-002', customerName: 'Muster Industrie AG',
    name: 'Managed Workplace Support', startDate: '2026-07-01', status: 'active', autoRenew: true, noticeDays: 90,
    billingInterval: 'monthly', nextInvoiceDate: '2026-10-01', billingDay: 1, reference: 'MSA-2026-07',
    lines: [
      { id: 'cl-001', description: 'Managed Workplace Support', quantity: 1, unit: 'pauschal', unitPrice: 2450, vatRate: 8.1 },
    ],
    notes: 'Monatliche Betreuung inkl. Basis-Support und Betriebskoordination.',
  },
]

export const expenses: Expense[] = [
  { organizationId: DEFAULT_ORGANIZATION_ID, id: 'exp-001', customerId: 'cus-001', customerName: 'Alpine Public IT AG', orderId: 'ord-001', orderName: 'Digital Workplace Betreuung', date: '2026-09-10', description: 'Fahrt- und Parkkosten Kundentermin', category: 'travel', quantity: 1, unitPrice: 42, billable: true },
  { organizationId: DEFAULT_ORGANIZATION_ID, id: 'exp-002', customerId: 'cus-002', customerName: 'Muster Industrie AG', orderId: 'ord-002', orderName: 'Client Migration Phase 2', date: '2026-09-15', description: 'Adapter und Verbrauchsmaterial', category: 'material', quantity: 1, unitPrice: 180, billable: true },
]

export const creditNotes: CreditNote[] = []

export const customerActivities: CustomerActivity[] = [
  { organizationId: DEFAULT_ORGANIZATION_ID, id: 'act-001', customerId: 'cus-002', type: 'quote', title: 'Angebot AN-2026-014 versendet', detail: 'Workplace Engineering Erweiterung', createdAt: '2026-09-17T11:32:00.000Z' },
  { organizationId: DEFAULT_ORGANIZATION_ID, id: 'act-002', customerId: 'cus-003', type: 'invoice', title: 'Rechnung RE-2026-008 erstellt', detail: 'M365 Security Assessment', createdAt: '2026-08-31T09:00:00.000Z' },
]


export const customerContacts: CustomerContact[] = [
  { organizationId: DEFAULT_ORGANIZATION_ID, id: 'cc-001', customerId: 'cus-001', name: 'Marco Frei', email: 'marco.frei@demo-alpine.ch', phone: '+41 31 555 21 40', role: 'Projektleitung', primary: true },
  { organizationId: DEFAULT_ORGANIZATION_ID, id: 'cc-002', customerId: 'cus-002', name: 'Anna Keller', email: 'anna.keller@demo-muster.ch', phone: '+41 44 555 18 20', role: 'IT-Leitung', primary: true },
  { organizationId: DEFAULT_ORGANIZATION_ID, id: 'cc-003', customerId: 'cus-003', name: 'Luca Meier', email: 'luca.meier@demo-helvetic.ch', phone: '+41 71 555 10 80', role: 'Security Lead', primary: true },
]
