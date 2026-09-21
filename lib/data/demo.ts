export const customers = [
  {
    name: 'Muster AG',
    contact: 'Anna Keller',
    email: 'anna.keller@muster.ch',
    orders: 2,
    open: 4200,
    status: 'Aktiv',
  },
  {
    name: 'Tech Partner Schweiz AG',
    contact: 'Marco Frei',
    email: 'marco.frei@techpartner.ch',
    orders: 1,
    open: 0,
    status: 'Aktiv',
  },
  {
    name: 'Alpine Systems AG',
    contact: 'Luca Meier',
    email: 'luca.meier@alpine.ch',
    orders: 1,
    open: 1980,
    status: 'Aktiv',
  },
]

export const orders = [
  {
    name: 'Workplace Engineering 2026',
    customer: 'Muster AG',
    budget: 1000,
    used: 620,
    salesRate: 150,
    costRate: 105,
    status: 'Aktiv',
  },
  {
    name: 'Client Migration',
    customer: 'Tech Partner Schweiz AG',
    budget: 420,
    used: 301,
    salesRate: 165,
    costRate: 110,
    status: 'Aktiv',
  },
  {
    name: 'M365 Security Review',
    customer: 'Alpine Systems AG',
    budget: 120,
    used: 84,
    salesRate: 185,
    costRate: 118,
    status: 'Aktiv',
  },
]

export const timeEntries = [
  {
    date: '21.09.2026',
    project: 'Workplace Engineering 2026',
    customer: 'Muster AG',
    activity: 'Engineering',
    hours: 8,
  },
  {
    date: '18.09.2026',
    project: 'Client Migration',
    customer: 'Tech Partner Schweiz AG',
    activity: 'Migration und Tests',
    hours: 7.5,
  },
  {
    date: '17.09.2026',
    project: 'M365 Security Review',
    customer: 'Alpine Systems AG',
    activity: 'Review und Dokumentation',
    hours: 6.5,
  },
  {
    date: '16.09.2026',
    project: 'Workplace Engineering 2026',
    customer: 'Muster AG',
    activity: 'Client Engineering',
    hours: 8,
  },
]

export const invoices = [
  {
    number: 'RE-2026-009',
    customer: 'Muster AG',
    period: 'September 2026',
    amount: 4200,
    due: '30.09.2026',
    status: 'Offen',
  },
  {
    number: 'RE-2026-008',
    customer: 'Alpine Systems AG',
    period: 'August 2026',
    amount: 1980,
    due: '20.09.2026',
    status: 'Überfällig',
  },
  {
    number: 'RE-2026-007',
    customer: 'Tech Partner Schweiz AG',
    period: 'August 2026',
    amount: 7755,
    due: '15.09.2026',
    status: 'Bezahlt',
  },
]
