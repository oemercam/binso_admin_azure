# Binso Admin v4 – kompletter Kopier-Code
Jeder Abschnitt enthält **Pfad + Dateiname + vollständigen Inhalt**. `package-lock.json` im GitHub-Repository behalten und nicht ersetzen.

## `.github/workflows/main_binso-admin-prod.yml`

```yaml
name: Build and deploy Binso Admin to Azure

on:
  push:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: binso-admin-production
  cancel-in-progress: true

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v5
      - name: Set up Node.js
        uses: actions/setup-node@v5
        with:
          node-version: '24'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build Next.js application
        run: npm run build
        env:
          NODE_ENV: production
      - name: Prepare standalone deployment
        shell: bash
        run: |
          set -euo pipefail
          test -f .next/standalone/server.js
          mkdir -p .next/standalone/.next
          if [ -d .next/static ]; then cp -r .next/static .next/standalone/.next/static; fi
          if [ -d public ]; then cp -r public .next/standalone/public; fi
      - name: Upload deployment artifact
        uses: actions/upload-artifact@v4
        with:
          name: binso-admin
          path: .next/standalone
          include-hidden-files: true
          if-no-files-found: error
          retention-days: 1

  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: build
    permissions:
      id-token: write
      contents: read
    steps:
      - name: Download deployment artifact
        uses: actions/download-artifact@v4
        with:
          name: binso-admin
          path: app
      - name: Login to Azure
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZUREAPPSERVICE_CLIENTID_26AFEFB731284F009ED9276FD775F286 }}
          tenant-id: ${{ secrets.AZUREAPPSERVICE_TENANTID_2CCE2EB4F39347B98167444DC3298211 }}
          subscription-id: ${{ secrets.AZUREAPPSERVICE_SUBSCRIPTIONID_062EB98486644201BBC1D99AE3FDD2FC }}
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: 'binso-admin-prod'
          slot-name: 'Production'
          package: app

```

## `app/(app)/accounting/page.tsx`

```tsx
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

export default function AccountingPage() {
  return (
    <section className="page">
      <PageHeader eyebrow="BUCHHALTUNG" title="Buchhaltung" description="Zahlungen, Belege und Übergabe an die Finanzbuchhaltung." action={<button className="button primary"><Icon name="download" size={16}/> Export vorbereiten</button>} />

      <div className="metric-strip">
        <div className="metric"><span>Ungeprüfte Belege</span><strong>4</strong><small>CHF 1'282</small></div>
        <div className="metric"><span>Offene Zahlungen</span><strong>2</strong><small>CHF 6'180</small></div>
        <div className="metric"><span>Zu exportieren</span><strong>9</strong><small>September 2026</small></div>
        <div className="metric"><span>MWST</span><strong>CHF 1'436</strong><small>provisorisch</small></div>
      </div>

      <div className="dashboard-bottom-grid">
        <section className="section-block">
          <div className="section-title"><div><h2>Letzte Zahlungen</h2><p>Manuell oder via Bankabgleich</p></div></div>
          <div className="compact-list">
            <div><span className="primary-cell"><strong>RE-2026-007</strong><small>Tech Partner Schweiz AG</small></span><span>18.09.2026</span><strong>CHF 7'755</strong></div>
            <div><span className="primary-cell"><strong>Hosting September</strong><small>Microsoft Azure</small></span><span>16.09.2026</span><strong>- CHF 286</strong></div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-title"><div><h2>Monatsabschluss</h2><p>September 2026</p></div></div>
          <div className="check-list">
            <div><Icon name="check" size={16}/><span>Rechnungen geprüft</span></div>
            <div><Icon name="check" size={16}/><span>Zahlungen abgeglichen</span></div>
            <div><Icon name="warning" size={16}/><span>4 Belege prüfen</span></div>
            <div><span className="empty-check"/><span>Export erstellen</span></div>
          </div>
        </section>
      </div>
    </section>
  )
}

```

## `app/(app)/customers/page.tsx`

```tsx
'use client'

import { useMemo, useState } from 'react'
import { customers as initialCustomers } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

export default function CustomersPage() {
  const [customers, setCustomers] = useState(initialCustomers)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')

  const filtered = useMemo(
    () => customers.filter((customer) => `${customer.name} ${customer.contact} ${customer.email}`.toLowerCase().includes(query.toLowerCase())),
    [customers, query],
  )

  function createCustomer(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setCustomers((current) => [
      {
        id: `demo-${Date.now()}`,
        name: name.trim(),
        contact: contact.trim(),
        email: email.trim(),
        paymentDays: 30,
        status: 'active',
      },
      ...current,
    ])
    setName('')
    setContact('')
    setEmail('')
    setOpen(false)
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="CRM"
        title="Kunden"
        description="Kontakte, Verkauf und Abrechnung zentral verwalten."
        action={<button className="button primary" onClick={() => setOpen(true)}><Icon name="plus" size={16}/> Kunde erfassen</button>}
      />

      <div className="module-toolbar">
        <label className="search-field">
          <Icon name="search" size={16}/>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kunden durchsuchen" />
        </label>
        <span className="toolbar-meta">{filtered.length} Kunden</span>
      </div>

      <div className="data-list">
        <div className="data-row customer-grid data-head">
          <span>Kunde</span><span>Kontakt</span><span>Zahlungsziel</span><span>Status</span><span />
        </div>
        {filtered.map((customer) => (
          <div className="data-row customer-grid" key={customer.id}>
            <span className="primary-cell"><strong>{customer.name}</strong><small>{customer.email || 'Keine E-Mail'}</small></span>
            <span className="primary-cell"><strong>{customer.contact || '–'}</strong><small>{customer.phone || ''}</small></span>
            <span>{customer.paymentDays} Tage</span>
            <span className="status active">Aktiv</span>
            <button className="row-link" aria-label={`${customer.name} öffnen`}><Icon name="chevron" size={15}/></button>
          </div>
        ))}
      </div>

      <div className="mobile-record-list">
        {filtered.map((customer) => (
          <article className="mobile-record" key={customer.id}>
            <div className="record-top"><span className="record-icon"><Icon name="building" size={17}/></span><span><strong>{customer.name}</strong><small>{customer.contact || 'Kein Kontakt'}</small></span><Icon name="chevron" size={15}/></div>
            <div className="record-meta"><span>{customer.email || 'Keine E-Mail'}</span><span>{customer.paymentDays} Tage</span></div>
          </article>
        ))}
      </div>

      {open && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setOpen(false)}>
          <form className="form-sheet" onSubmit={createCustomer} onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-grabber"/>
            <div className="sheet-heading"><div><strong>Kunde erfassen</strong><span>Neuer CRM-Kontakt</span></div><button type="button" className="icon-button" onClick={() => setOpen(false)}><Icon name="close" size={17}/></button></div>
            <div className="form-grid">
              <label><span>Firma *</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
              <label><span>Ansprechperson</span><input value={contact} onChange={(e) => setContact(e.target.value)} /></label>
              <label><span>E-Mail</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <label><span>Zahlungsziel</span><select defaultValue="30"><option>10</option><option>20</option><option>30</option></select></label>
            </div>
            <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button className="button primary">Kunde speichern</button></div>
          </form>
        </div>
      )}
    </section>
  )
}

```

## `app/(app)/dashboard/page.tsx`

```tsx
import { getSession } from '@/lib/auth/server'
import { PageHeader } from '@/components/ui/page-header'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { Icon } from '@/components/ui/icon'
import { activity, invoices, orders, quotes, timeEntries } from '@/lib/data/demo'

const chf = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  maximumFractionDigits: 0,
})

export default async function DashboardPage() {
  const session = await getSession()
  const role = session?.user.role ?? 'employee'

  if (role === 'employee') {
    return <EmployeeDashboard />
  }

  if (role === 'finance') {
    return <FinanceDashboard />
  }

  return <OwnerDashboard role={role} />
}

function OwnerDashboard({ role }: { role: 'owner' | 'admin' }) {
  const openInvoices = invoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled')
  const openAmount = openInvoices.reduce((sum, invoice) => sum + invoice.amount - invoice.paidAmount, 0)
  const billableHours = timeEntries.filter((entry) => entry.billable && !entry.invoiced).reduce((sum, entry) => sum + entry.hours, 0)
  const billableValue = billableHours * 150

  return (
    <section className="page">
      <PageHeader
        eyebrow={role === 'owner' ? 'INHABER' : 'ADMINISTRATION'}
        title="Dashboard"
        description="Geschäft, Aufträge und Liquidität auf einen Blick."
      />

      <div className="metric-strip">
        <Metric label="Umsatz September" value="CHF 18'660" detail="+34.2 % zum Vormonat" tone="positive" />
        <Metric label="Noch nicht verrechnet" value={chf.format(billableValue)} detail={`${billableHours} h abrechenbar`} />
        <Metric label="Offene Rechnungen" value={chf.format(openAmount)} detail={`${openInvoices.length} Positionen`} tone="warning" />
        <Metric label="Deckungsbeitrag" value="CHF 6'048" detail="Marge 32.4 %" />
      </div>

      <div className="dashboard-layout">
        <section className="surface chart-surface">
          <SectionTitle title="Geschäftsentwicklung" subtitle="Umsatz und interne Kosten · letzte 6 Monate" />
          <RevenueChart />
        </section>

        <section className="surface focus-surface">
          <SectionTitle title="Heute wichtig" subtitle="Priorisierte Aufgaben" />
          <div className="focus-list">
            <Focus icon="warning" label="1 Rechnung überfällig" meta="CHF 1'980 · seit 20.09." tone="danger" />
            <Focus icon="quotes" label="1 Angebot läuft aus" meta="AN-2026-014 · in 9 Tagen" />
            <Focus icon="time" label="43.5 h fehlen im Monat" meta="Monatsabschluss September" />
          </div>
        </section>
      </div>

      <section className="section-block">
        <SectionTitle title="Aktive Aufträge" subtitle="Budget, Verbrauch und wirtschaftlicher Stand" />
        <div className="data-list desktop-wide">
          <div className="data-row data-head">
            <span>Auftrag</span><span>Budget</span><span>Verbraucht</span><span>Rest</span><span>Auslastung</span><span>Marge</span>
          </div>
          {orders.map((order) => {
            const percentage = Math.round((order.usedHours / order.budgetHours) * 100)
            const margin = Math.round(((order.salesRate - order.costRate) / order.salesRate) * 100)
            return (
              <div className="data-row" key={order.id}>
                <span className="primary-cell"><strong>{order.name}</strong><small>{order.customerName}</small></span>
                <span>{order.budgetHours} h</span>
                <span>{order.usedHours} h</span>
                <span><strong>{order.budgetHours - order.usedHours} h</strong></span>
                <span className="progress-cell"><span className="mini-progress"><i style={{ width: `${percentage}%` }} /></span><small>{percentage} %</small></span>
                <span>{margin} %</span>
              </div>
            )
          })}
        </div>
      </section>

      <div className="dashboard-bottom-grid">
        <section className="section-block">
          <SectionTitle title="Sales Pipeline" subtitle="Angebote und nächste Schritte" />
          <div className="compact-list">
            {quotes.map((quote) => (
              <div key={quote.id}>
                <span className="primary-cell"><strong>{quote.number} · {quote.title}</strong><small>{quote.customerName}</small></span>
                <span>{chf.format(quote.amount)}</span>
                <Status value={quote.status} />
              </div>
            ))}
          </div>
        </section>

        <section className="section-block">
          <SectionTitle title="Letzte Aktivitäten" subtitle="Unternehmensweit" />
          <div className="timeline">
            {activity.map((item) => (
              <div key={`${item.time}-${item.title}`}>
                <i />
                <span><strong>{item.title}</strong><small>{item.meta}</small></span>
                <time>{item.time}</time>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

function FinanceDashboard() {
  const open = invoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled')
  const openAmount = open.reduce((sum, invoice) => sum + invoice.amount - invoice.paidAmount, 0)

  return (
    <section className="page">
      <PageHeader eyebrow="BUCHHALTUNG" title="Finanzübersicht" description="Forderungen, Zahlungen und anstehende Aufgaben." />
      <div className="metric-strip">
        <Metric label="Offene Forderungen" value={chf.format(openAmount)} detail={`${open.length} Rechnungen`} tone="warning" />
        <Metric label="Bezahlt im Monat" value="CHF 7'755" detail="1 Zahlung" tone="positive" />
        <Metric label="Überfällig" value="CHF 1'980" detail="1 Rechnung" tone="danger" />
        <Metric label="Noch verrechenbar" value="CHF 5'700" detail="38 h freigegeben" />
      </div>
      <div className="dashboard-layout">
        <section className="surface chart-surface"><SectionTitle title="Umsatzentwicklung" subtitle="Letzte 6 Monate" /><RevenueChart /></section>
        <section className="surface focus-surface">
          <SectionTitle title="Buchhaltungsaufgaben" subtitle="Heute relevant" />
          <div className="focus-list">
            <Focus icon="credit-card" label="Zahlung verbuchen" meta="RE-2026-009 · Muster AG" />
            <Focus icon="warning" label="Mahnung prüfen" meta="RE-2026-008 · 1 Tag überfällig" tone="danger" />
            <Focus icon="accounting" label="Monatsexport vorbereiten" meta="September 2026" />
          </div>
        </section>
      </div>
    </section>
  )
}

function EmployeeDashboard() {
  return (
    <section className="page">
      <PageHeader eyebrow="MEIN ARBEITSTAG" title="Hallo" description="Deine Aufträge, Zeiten und heutige Aufgaben." />
      <div className="metric-strip employee-metrics">
        <Metric label="Heute erfasst" value="8.0 h" detail="Soll 8.4 h" tone="positive" />
        <Metric label="September" value="124.5 h" detail="43.5 h offen" />
        <Metric label="Verrechenbar" value="112 h" detail="89.9 % deiner Zeiten" />
      </div>

      <div className="dashboard-layout">
        <section className="surface">
          <SectionTitle title="Meine Aufträge" subtitle="Aktuell zugewiesen" />
          <div className="compact-list">
            {orders.slice(0, 2).map((order) => (
              <div key={order.id}>
                <span className="primary-cell"><strong>{order.name}</strong><small>{order.customerName}</small></span>
                <span>{order.budgetHours - order.usedHours} h Rest</span>
                <span className="status neutral">Aktiv</span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface">
          <SectionTitle title="Schnellerfassung" subtitle="Heute" />
          <a href="/time?new=1" className="big-action"><Icon name="time" size={20}/><span><strong>Zeit erfassen</strong><small>Auf Auftrag oder Tätigkeit buchen</small></span><Icon name="chevron" size={16}/></a>
        </section>
      </div>
    </section>
  )
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: 'positive' | 'warning' | 'danger' }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small className={tone ? `tone-${tone}` : undefined}>{detail}</small></div>
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="section-title"><div><h2>{title}</h2><p>{subtitle}</p></div></div>
}

function Focus({ icon, label, meta, tone }: { icon: any; label: string; meta: string; tone?: 'danger' }) {
  return <div className="focus-item"><span className={tone ? `focus-icon ${tone}` : 'focus-icon'}><Icon name={icon} size={17}/></span><span><strong>{label}</strong><small>{meta}</small></span><Icon name="chevron" size={15}/></div>
}

function Status({ value }: { value: string }) {
  const map: Record<string, string> = { draft: 'Entwurf', sent: 'Versendet', accepted: 'Angenommen', declined: 'Abgelehnt', expired: 'Abgelaufen' }
  return <span className={`status ${value}`}>{map[value] ?? value}</span>
}

```

## `app/(app)/employees/page.tsx`

```tsx
import { employees } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

export default function EmployeesPage() {
  return (
    <section className="page">
      <PageHeader eyebrow="TEAM" title="Mitarbeitende" description="Rollen, Auslastung und Zeitstatus verwalten." action={<button className="button primary"><Icon name="plus" size={16}/> Mitarbeitende einladen</button>} />

      <div className="data-list">
        <div className="data-row employee-grid data-head"><span>Mitarbeiter</span><span>Rolle</span><span>Gebucht</span><span>Verrechenbar</span><span>Auslastung</span><span /></div>
        {employees.map((employee) => (
          <div className="data-row employee-grid" key={employee.id}>
            <span className="user-cell"><span className="avatar">{employee.name.split(' ').map(part => part[0]).slice(0,2).join('')}</span><span className="primary-cell"><strong>{employee.name}</strong><small>{employee.email}</small></span></span>
            <span>{role(employee.role)}</span>
            <span>{employee.bookedHours} / {employee.targetHours} h</span>
            <span>{employee.billableHours} h</span>
            <span className="progress-cell"><span className="mini-progress"><i style={{ width: `${employee.utilisation}%` }}/></span><small>{employee.utilisation}%</small></span>
            <button className="row-link"><Icon name="chevron" size={15}/></button>
          </div>
        ))}
      </div>
    </section>
  )
}

function role(value: string) {
  if (value === 'owner') return 'Inhaber'
  if (value === 'admin') return 'Admin'
  if (value === 'finance') return 'Buchhaltung'
  return 'Mitarbeiter'
}

```

## `app/(app)/finance/page.tsx`

```tsx
import { PageHeader } from '@/components/ui/page-header'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { invoices, orders } from '@/lib/data/demo'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })

export default function FinancePage() {
  const committedRevenue = orders.reduce((sum, order) => sum + order.usedHours * order.salesRate, 0)
  const open = invoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled').reduce((sum, invoice) => sum + invoice.amount - invoice.paidAmount, 0)

  return (
    <section className="page">
      <PageHeader eyebrow="CONTROLLING" title="Finanzen" description="Umsatz, Marge, Forderungen und Liquidität." />

      <div className="metric-strip">
        <div className="metric"><span>Geleisteter Umsatz</span><strong>{chf.format(committedRevenue)}</strong><small>aus erfassten Zeiten</small></div>
        <div className="metric"><span>Offene Forderungen</span><strong>{chf.format(open)}</strong><small className="tone-warning">noch nicht bezahlt</small></div>
        <div className="metric"><span>Deckungsbeitrag</span><strong>CHF 6'048</strong><small>Marge 32.4 %</small></div>
        <div className="metric"><span>Cash Forecast</span><strong>+ CHF 9'630</strong><small className="tone-positive">30 Tage</small></div>
      </div>

      <div className="dashboard-layout">
        <section className="surface chart-surface"><div className="section-title"><div><h2>Umsatz und Kosten</h2><p>Letzte sechs Monate</p></div></div><RevenueChart/></section>
        <section className="surface">
          <div className="section-title"><div><h2>Liquidität</h2><p>Nächste 30 Tage</p></div></div>
          <div className="finance-ledger">
            <div><span>Aktueller Bestand</span><strong>CHF 34'200</strong></div>
            <div><span>Erwartete Eingänge</span><strong className="tone-positive">+ CHF 12'400</strong></div>
            <div><span>Erwartete Ausgänge</span><strong>- CHF 8'950</strong></div>
            <div className="total"><span>Prognose</span><strong>CHF 37'650</strong></div>
          </div>
        </section>
      </div>
    </section>
  )
}

```

## `app/(app)/invoices/page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { invoices as initialInvoices } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import type { Invoice, InvoiceStatus } from '@/types/domain'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })

const label: Record<InvoiceStatus, string> = {
  draft: 'Entwurf',
  sent: 'Versendet',
  partial: 'Teilbezahlt',
  paid: 'Bezahlt',
  overdue: 'Überfällig',
  cancelled: 'Storniert',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState(initialInvoices)
  const [preview, setPreview] = useState<Invoice | null>(null)
  const [payment, setPayment] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  function savePayment(event: React.FormEvent) {
    event.preventDefault()
    if (!payment) return
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) return
    setInvoices((current) => current.map((invoice) => {
      if (invoice.id !== payment.id) return invoice
      const paidAmount = Math.min(invoice.amount, invoice.paidAmount + amount)
      return { ...invoice, paidAmount, status: paidAmount >= invoice.amount ? 'paid' : 'partial' }
    }))
    setPayment(null)
    setPaymentAmount('')
  }

  return (
    <section className="page">
      <PageHeader eyebrow="FAKTURIERUNG" title="Rechnungen" description="Erstellen, versenden, überwachen und Zahlungseingänge verbuchen." action={<button className="button primary"><Icon name="plus" size={16}/> Rechnung erstellen</button>} />

      <div className="workflow-strip invoice-workflow">
        <div><strong>{chf.format(invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount - i.paidAmount, 0))}</strong><span>Offen</span></div>
        <div><strong>{chf.format(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.paidAmount, 0))}</strong><span>Bezahlt</span></div>
        <div><strong>{chf.format(invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount - i.paidAmount, 0))}</strong><span>Überfällig</span></div>
      </div>

      <div className="data-list">
        <div className="data-row invoice-grid data-head"><span>Rechnung</span><span>Kunde</span><span>Fällig</span><span>Betrag</span><span>Status</span><span /></div>
        {invoices.map((invoice) => (
          <div className="data-row invoice-grid" key={invoice.id}>
            <span className="primary-cell"><strong>{invoice.number}</strong><small>{invoice.period}</small></span>
            <span>{invoice.customerName}</span>
            <span>{invoice.due}</span>
            <span><strong>{chf.format(invoice.amount)}</strong></span>
            <span className={`status ${invoice.status}`}>{label[invoice.status]}</span>
            <div className="row-actions">
              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <button className="row-link" title="Zahlung erfassen" onClick={() => { setPayment(invoice); setPaymentAmount(String(invoice.amount - invoice.paidAmount)) }}><Icon name="credit-card" size={15}/></button>
              )}
              <button className="row-link" title="Vorschau" onClick={() => setPreview(invoice)}><Icon name="chevron" size={15}/></button>
            </div>
          </div>
        ))}
      </div>

      <div className="mobile-record-list">
        {invoices.map((invoice) => (
          <article className="mobile-record" key={invoice.id} onClick={() => setPreview(invoice)}>
            <div className="record-top"><span><strong>{invoice.number}</strong><small>{invoice.customerName}</small></span><span className={`status ${invoice.status}`}>{label[invoice.status]}</span></div>
            <div className="record-meta"><span>{chf.format(invoice.amount)}</span><span>fällig {invoice.due}</span></div>
          </article>
        ))}
      </div>

      {preview && (
        <div className="overlay-layer" onMouseDown={() => setPreview(null)}>
          <div className="document-preview-shell" onMouseDown={(event) => event.stopPropagation()}>
            <div className="preview-toolbar"><div><strong>{preview.number}</strong><span>{preview.customerName}</span></div><div><button className="icon-button"><Icon name="download" size={16}/></button><button className="icon-button" onClick={() => setPreview(null)}><Icon name="close" size={16}/></button></div></div>
            <div className="document-preview invoice-document">
              <header><div className="preview-logo">BINSO</div><div><strong>RECHNUNG</strong><span>{preview.number}</span></div></header>
              <section><small>Rechnung an</small><strong>{preview.customerName}</strong><p>Leistungen {preview.period}</p></section>
              <div className="invoice-lines"><div><span>IT-Dienstleistungen</span><span>{chf.format(preview.amount)}</span></div></div>
              <div className="preview-total"><span>Total</span><strong>{chf.format(preview.amount)}</strong></div>
              <footer>Fällig am {preview.due}</footer>
            </div>
            <div className="preview-actions"><button className="button secondary"><Icon name="edit" size={15}/> Bearbeiten</button><button className="button secondary"><Icon name="send" size={15}/> Senden</button>{preview.status !== 'paid' && <button className="button primary" onClick={() => { setPayment(preview); setPreview(null); setPaymentAmount(String(preview.amount - preview.paidAmount)) }}><Icon name="credit-card" size={15}/> Zahlung erfassen</button>}</div>
          </div>
        </div>
      )}

      {payment && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setPayment(null)}>
          <form className="form-sheet compact-sheet" onSubmit={savePayment} onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-grabber"/>
            <div className="sheet-heading"><div><strong>Zahlung erfassen</strong><span>{payment.number} · {payment.customerName}</span></div><button type="button" className="icon-button" onClick={() => setPayment(null)}><Icon name="close" size={17}/></button></div>
            <div className="form-grid">
              <label><span>Betrag CHF</span><input inputMode="decimal" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} /></label>
              <label><span>Zahlungsdatum</span><input type="date" defaultValue="2026-09-21"/></label>
              <label className="full"><span>Zahlungsart</span><select defaultValue="Bank"><option>Bank</option><option>Bar</option><option>Kreditkarte</option><option>Sonstige</option></select></label>
            </div>
            <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setPayment(null)}>Abbrechen</button><button className="button primary">Zahlung speichern</button></div>
          </form>
        </div>
      )}
    </section>
  )
}

```

## `app/(app)/layout.tsx`

```tsx
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell/app-shell'
import { getSession } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  return <AppShell user={session.user}>{children}</AppShell>
}

```

## `app/(app)/orders/page.tsx`

```tsx
import { orders } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })

export default function OrdersPage() {
  return (
    <section className="page">
      <PageHeader eyebrow="PROJEKTE" title="Aufträge" description="Budget, Leistung, Marge und Abrechnung im Blick." action={<button className="button primary"><Icon name="plus" size={16}/> Auftrag erstellen</button>} />

      <div className="data-list">
        <div className="data-row order-grid data-head"><span>Auftrag</span><span>Budget</span><span>Verbraucht</span><span>Rest</span><span>Umsatz</span><span>Marge</span><span /></div>
        {orders.map((order) => {
          const remaining = order.budgetHours - order.usedHours
          const revenue = order.usedHours * order.salesRate
          const margin = Math.round(((order.salesRate - order.costRate) / order.salesRate) * 100)
          return (
            <div className="data-row order-grid" key={order.id}>
              <span className="primary-cell"><strong>{order.name}</strong><small>{order.customerName}</small></span>
              <span>{order.budgetHours} h</span>
              <span>{order.usedHours} h</span>
              <span><strong>{remaining} h</strong></span>
              <span>{chf.format(revenue)}</span>
              <span>{margin} %</span>
              <button className="row-link"><Icon name="chevron" size={15}/></button>
            </div>
          )
        })}
      </div>

      <div className="mobile-record-list">
        {orders.map((order) => {
          const percentage = Math.round((order.usedHours / order.budgetHours) * 100)
          return (
            <article className="mobile-record" key={order.id}>
              <div className="record-top"><span><strong>{order.name}</strong><small>{order.customerName}</small></span><span>{percentage}%</span></div>
              <div className="mobile-progress"><i style={{ width: `${percentage}%` }}/></div>
              <div className="record-meta"><span>{order.usedHours} / {order.budgetHours} h</span><span>{order.budgetHours - order.usedHours} h Rest</span></div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

```

## `app/(app)/quotes/page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { quotes as initialQuotes } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import type { QuoteStatus } from '@/types/domain'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })

const labels: Record<QuoteStatus, string> = {
  draft: 'Entwurf',
  sent: 'Versendet',
  accepted: 'Angenommen',
  declined: 'Abgelehnt',
  expired: 'Abgelaufen',
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState(initialQuotes)
  const [preview, setPreview] = useState<(typeof quotes)[number] | null>(null)

  function changeStatus(id: string, status: QuoteStatus) {
    setQuotes((current) => current.map((quote) => quote.id === id ? { ...quote, status } : quote))
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="VERKAUF"
        title="Angebote"
        description="Von der Offerte bis zum Auftrag ohne Medienbruch."
        action={<button className="button primary"><Icon name="plus" size={16}/> Angebot erstellen</button>}
      />

      <div className="workflow-strip">
        <div><strong>{quotes.filter(q => q.status === 'draft').length}</strong><span>Entwurf</span></div>
        <div><strong>{quotes.filter(q => q.status === 'sent').length}</strong><span>Versendet</span></div>
        <div><strong>{quotes.filter(q => q.status === 'accepted').length}</strong><span>Angenommen</span></div>
        <div><strong>{quotes.filter(q => q.status === 'expired').length}</strong><span>Abgelaufen</span></div>
      </div>

      <div className="data-list">
        <div className="data-row quote-grid data-head"><span>Angebot</span><span>Kunde</span><span>Gültig bis</span><span>Betrag</span><span>Status</span><span /></div>
        {quotes.map((quote) => (
          <div className="data-row quote-grid" key={quote.id}>
            <span className="primary-cell"><strong>{quote.number} · {quote.title}</strong><small>Version {quote.version}</small></span>
            <span>{quote.customerName}</span>
            <span>{quote.validUntil}</span>
            <span>{chf.format(quote.amount)}</span>
            <span className={`status ${quote.status}`}>{labels[quote.status]}</span>
            <button className="row-link" onClick={() => setPreview(quote)} aria-label="Angebot öffnen"><Icon name="chevron" size={15}/></button>
          </div>
        ))}
      </div>

      <div className="mobile-record-list">
        {quotes.map((quote) => (
          <article className="mobile-record" key={quote.id} onClick={() => setPreview(quote)}>
            <div className="record-top"><span><strong>{quote.number}</strong><small>{quote.customerName}</small></span><span className={`status ${quote.status}`}>{labels[quote.status]}</span></div>
            <h3>{quote.title}</h3>
            <div className="record-meta"><span>{chf.format(quote.amount)}</span><span>bis {quote.validUntil}</span></div>
          </article>
        ))}
      </div>

      {preview && (
        <div className="overlay-layer" onMouseDown={() => setPreview(null)}>
          <div className="document-preview-shell" onMouseDown={(event) => event.stopPropagation()}>
            <div className="preview-toolbar">
              <div><strong>{preview.number}</strong><span>{preview.customerName}</span></div>
              <div>
                <button className="icon-button" title="Bearbeiten"><Icon name="edit" size={16}/></button>
                <button className="icon-button" title="Duplizieren"><Icon name="copy" size={16}/></button>
                <button className="icon-button" onClick={() => setPreview(null)}><Icon name="close" size={16}/></button>
              </div>
            </div>

            <div className="document-preview">
              <header><div className="preview-logo">BINSO</div><div><strong>ANGEBOT</strong><span>{preview.number}</span></div></header>
              <section><small>Empfänger</small><strong>{preview.customerName}</strong><p>{preview.title}</p></section>
              <div className="preview-total"><span>Total exkl. MWST</span><strong>{chf.format(preview.amount)}</strong></div>
              <footer>Gültig bis {preview.validUntil} · Version {preview.version}</footer>
            </div>

            <div className="preview-actions">
              <button className="button secondary" onClick={() => changeStatus(preview.id, 'declined')}>Ablehnen</button>
              <button className="button secondary" onClick={() => changeStatus(preview.id, 'sent')}><Icon name="send" size={15}/> Erneut senden</button>
              <button className="button primary" onClick={() => changeStatus(preview.id, 'accepted')}><Icon name="check" size={15}/> Als angenommen markieren</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

```

## `app/(app)/settings/page.tsx`

```tsx
import { PageHeader } from '@/components/ui/page-header'
import { ThemeControl } from '@/components/settings/theme-control'
import { PushSettings } from '@/components/pwa/push-settings'

export default function SettingsPage() {
  return (
    <section className="page settings-page">
      <PageHeader eyebrow="EINSTELLUNGEN" title="Einstellungen" description="Persönliche Darstellung, Benachrichtigungen und Administration." />

      <div className="settings-sections">
        <section className="settings-row">
          <div><h2>Darstellung</h2><p>Systemdarstellung automatisch übernehmen oder manuell wählen.</p></div>
          <ThemeControl />
        </section>

        <section className="settings-row">
          <div><h2>Push-Benachrichtigungen</h2><p>Fälligkeiten, Budgetwarnungen und wichtige Aufgaben auf Mobilgeräten.</p></div>
          <PushSettings />
        </section>

        <section className="settings-row">
          <div><h2>Benachrichtigungsregeln</h2><p>Welche Ereignisse eine Meldung auslösen.</p></div>
          <div className="switch-list">
            <label><span>Rechnung überfällig</span><input type="checkbox" defaultChecked /></label>
            <label><span>Auftragsbudget über 80 %</span><input type="checkbox" defaultChecked /></label>
            <label><span>Angebot läuft aus</span><input type="checkbox" defaultChecked /></label>
          </div>
        </section>

        <section className="settings-row">
          <div><h2>Unternehmen</h2><p>Stammdaten und Standardwerte.</p></div>
          <dl className="settings-values">
            <div><dt>Firma</dt><dd>Binso GmbH</dd></div>
            <div><dt>Währung</dt><dd>CHF</dd></div>
            <div><dt>Zahlungsziel</dt><dd>30 Tage</dd></div>
          </dl>
        </section>
      </div>
    </section>
  )
}

```

## `app/(app)/time/page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { orders, timeEntries as initialEntries } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

export default function TimePage() {
  const [entries, setEntries] = useState(initialEntries)
  const [open, setOpen] = useState(false)
  const [orderId, setOrderId] = useState(orders[0].id)
  const [hours, setHours] = useState('8')
  const [note, setNote] = useState('')

  const total = entries.reduce((sum, entry) => sum + entry.hours, 0)

  function save(event: React.FormEvent) {
    event.preventDefault()
    const order = orders.find((item) => item.id === orderId)
    if (!order) return
    setEntries((current) => [{
      id: `demo-${Date.now()}`,
      orderId,
      orderName: order.name,
      customerName: order.customerName,
      date: new Intl.DateTimeFormat('de-CH').format(new Date()),
      hours: Number(hours),
      note,
      billable: true,
      invoiced: false,
    }, ...current])
    setNote('')
    setOpen(false)
  }

  return (
    <section className="page">
      <PageHeader eyebrow="ZEIT" title="Zeiterfassung" description="Schnell erfassen, freigeben und später verrechnen." action={<button className="button primary" onClick={() => setOpen(true)}><Icon name="plus" size={16}/> Zeit erfassen</button>} />

      <div className="time-hero">
        <div><span>September</span><strong>{total} h</strong><small>von 168 h Soll</small></div>
        <div className="time-hero-progress"><i style={{ width: `${Math.min(100, (total / 168) * 100)}%` }}/></div>
        <div><span>Verrechenbar</span><strong>112 h</strong><small>89.9 %</small></div>
      </div>

      <div className="data-list">
        <div className="data-row time-grid data-head"><span>Datum</span><span>Auftrag</span><span>Tätigkeit</span><span>Stunden</span><span>Abrechnung</span><span /></div>
        {entries.map((entry) => (
          <div className="data-row time-grid" key={entry.id}>
            <span>{entry.date}</span>
            <span className="primary-cell"><strong>{entry.orderName}</strong><small>{entry.customerName}</small></span>
            <span>{entry.note || '–'}</span>
            <span><strong>{entry.hours} h</strong></span>
            <span className={entry.invoiced ? 'status paid' : 'status active'}>{entry.invoiced ? 'Verrechnet' : 'Offen'}</span>
            <button className="row-link"><Icon name="chevron" size={15}/></button>
          </div>
        ))}
      </div>

      <div className="mobile-record-list">
        {entries.map((entry) => (
          <article className="mobile-record" key={entry.id}>
            <div className="record-top"><span><strong>{entry.hours} h · {entry.note || 'Zeiteintrag'}</strong><small>{entry.orderName}</small></span><span>{entry.date}</span></div>
            <div className="record-meta"><span>{entry.customerName}</span><span>{entry.invoiced ? 'Verrechnet' : 'Offen'}</span></div>
          </article>
        ))}
      </div>

      {open && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setOpen(false)}>
          <form className="form-sheet" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-grabber"/>
            <div className="sheet-heading"><div><strong>Zeit erfassen</strong><span>Schnelleingabe</span></div><button type="button" className="icon-button" onClick={() => setOpen(false)}><Icon name="close" size={17}/></button></div>
            <div className="form-grid">
              <label className="full"><span>Auftrag</span><select value={orderId} onChange={(e) => setOrderId(e.target.value)}>{orders.map((order) => <option key={order.id} value={order.id}>{order.name} · {order.customerName}</option>)}</select></label>
              <label><span>Stunden</span><input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} /></label>
              <label><span>Verrechenbar</span><select defaultValue="Ja"><option>Ja</option><option>Nein</option></select></label>
              <label className="full"><span>Beschreibung</span><textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Was wurde gemacht?" /></label>
            </div>
            <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button className="button primary">Speichern</button></div>
          </form>
        </div>
      )}
    </section>
  )
}

```

## `app/api/health/route.ts`

```ts
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export function GET() { return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() }) }

```

## `app/api/push/subscriptions/route.ts`

```ts
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const subscription = await request.json()
  // TODO production: persist encrypted/validated subscription in database, scoped to session.user.id.
  return NextResponse.json({ ok: true, stored: Boolean(subscription?.endpoint) })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  // TODO production: delete subscription belonging to session.user.id.
  return NextResponse.json({ ok: true })
}

```

## `app/globals.css`

```css
:root{
  --bg:#ffffff;
  --surface:#ffffff;
  --surface-2:#f7f7f8;
  --surface-3:#f1f2f4;
  --text:#111214;
  --text-2:#34373d;
  --muted:#6d727c;
  --faint:#9a9fa8;
  --line:#e5e7eb;
  --line-strong:#d7dbe0;
  --sidebar:#fafafa;
  --accent:#111214;
  --accent-contrast:#ffffff;
  --green:#0b7a46;
  --green-bg:#edf8f2;
  --amber:#9a6700;
  --amber-bg:#fff7e5;
  --red:#b42318;
  --red-bg:#fff1f0;
  --blue:#2857d6;
  --blue-bg:#eef3ff;
  --shadow:0 10px 30px rgba(18,22,30,.08);
  --shadow-soft:0 1px 2px rgba(18,22,30,.04);
  --radius:12px;
  --safe-top:env(safe-area-inset-top,0px);
  --safe-bottom:env(safe-area-inset-bottom,0px);
}

html[data-theme='dark']{
  --bg:#0b0c0e;
  --surface:#111316;
  --surface-2:#171a1f;
  --surface-3:#20242a;
  --text:#f5f6f7;
  --text-2:#d6d9de;
  --muted:#a5abb5;
  --faint:#7d838d;
  --line:#292d33;
  --line-strong:#363b43;
  --sidebar:#0e1013;
  --accent:#f5f6f7;
  --accent-contrast:#111214;
  --green:#6bd49c;
  --green-bg:#11261b;
  --amber:#f4c35e;
  --amber-bg:#2b2413;
  --red:#ff928b;
  --red-bg:#2d1719;
  --blue:#8aa8ff;
  --blue-bg:#18223f;
  --shadow:0 16px 38px rgba(0,0,0,.34);
  --shadow-soft:0 1px 2px rgba(0,0,0,.22);
}

*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;background:var(--bg);color:var(--text)}
body{margin:0;min-height:100dvh;background:var(--bg);color:var(--text);font-weight:400;line-height:1.45}
button,input,select,textarea{font:inherit}
button,a,input,select,textarea{-webkit-tap-highlight-color:transparent}
button{cursor:pointer}
a{color:inherit}
input,select,textarea{color:var(--text)}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--text);outline-offset:2px}

.app-frame{min-height:100dvh;padding-top:58px}
.topbar{position:fixed;inset:0 0 auto 0;height:58px;display:grid;grid-template-columns:188px minmax(220px,520px) 1fr;align-items:center;gap:16px;padding:0 18px;border-bottom:1px solid var(--line);background:var(--surface);z-index:70}
.topbar-brand{display:flex;align-items:center}
.binso-logo{display:inline-flex;align-items:center;gap:9px;text-decoration:none}
.binso-logo-mark{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:var(--text);color:var(--bg);font-size:13px;font-weight:800;letter-spacing:-.03em}
.binso-logo-word{font-size:13px;font-weight:800;letter-spacing:.12em}
.global-search{height:34px;display:flex;align-items:center;gap:8px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2);color:var(--muted);font-size:12px;text-align:left}
.global-search span{flex:1}
.global-search kbd,.command-input kbd{border:1px solid var(--line);border-bottom-color:var(--line-strong);background:var(--surface);border-radius:5px;padding:2px 6px;font:10px/1.4 inherit;color:var(--faint)}
.topbar-actions{justify-self:end;display:flex;align-items:center;gap:6px}
.topbar-create,.topbar-icon,.avatar-button{border:0;background:transparent;color:var(--text)}
.topbar-create{height:34px;padding:0 10px;display:flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:8px;font-size:11px;font-weight:600}
.topbar-icon{position:relative;width:34px;height:34px;display:grid;place-items:center;border-radius:8px}
.topbar-icon:hover,.avatar-button:hover{background:var(--surface-2)}
.topbar-icon i{position:absolute;right:7px;top:7px;width:6px;height:6px;border-radius:50%;background:var(--red);border:2px solid var(--surface)}
.avatar-button{width:36px;height:36px;border-radius:50%;display:grid;place-items:center}
.avatar{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--surface-3);border:1px solid var(--line-strong);font-size:10px;font-weight:700;color:var(--text)}
.avatar.large{width:38px;height:38px;font-size:12px}

.app-shell{display:grid;grid-template-columns:188px minmax(0,1fr);min-height:calc(100dvh - 58px)}
.desktop-nav{position:fixed;top:58px;bottom:0;left:0;width:188px;padding:16px 10px 12px;background:var(--sidebar);border-right:1px solid var(--line);display:flex;flex-direction:column;overflow:auto}
.desktop-nav-section{margin-bottom:18px}
.nav-section-label{display:block;padding:0 8px 6px;font-size:9px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--faint)}
.desktop-nav nav{display:grid;gap:2px}
.desktop-nav nav a{min-height:36px;padding:0 8px;border-radius:7px;display:flex;align-items:center;gap:9px;text-decoration:none;color:var(--muted);font-size:12px;font-weight:500}
.desktop-nav nav a:hover{background:var(--surface-3);color:var(--text)}
.desktop-nav nav a.active{background:var(--surface-3);color:var(--text);font-weight:650}
.nav-spacer{flex:1}
.system-section{margin-bottom:4px}
.nav-footer{display:flex;align-items:center;gap:7px;padding:9px 8px 2px;color:var(--faint);font-size:9.5px}
.status-dot{width:6px;height:6px;border-radius:50%;background:#2dbb71}

.app-main{grid-column:2;min-width:0;padding:0 22px 54px}
.page{width:100%;padding-top:22px}
.page-header{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:20px}
.eyebrow{margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:.12em;color:var(--faint)}
h1{margin:0;font-size:24px;line-height:1.12;letter-spacing:-.03em;font-weight:700}
h2{margin:0;font-size:13px;line-height:1.3;font-weight:650}
h3{margin:8px 0 0;font-size:12px}
.page-description{margin:5px 0 0;color:var(--muted);font-size:11.5px}
.page-actions{display:flex;gap:8px}
.button{min-height:34px;padding:0 11px;border:1px solid transparent;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:11px;font-weight:650;text-decoration:none}
.button.primary{background:var(--accent);color:var(--accent-contrast)}
.button.secondary{background:var(--surface);border-color:var(--line-strong);color:var(--text)}
.button.full{width:100%}

.metric-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-bottom:20px}
.metric{padding:13px 16px 14px;border-right:1px solid var(--line)}
.metric:first-child{padding-left:0}
.metric:last-child{border-right:0}
.metric>span{display:block;color:var(--muted);font-size:9.5px}
.metric>strong{display:block;margin-top:4px;font-size:18px;line-height:1.15;letter-spacing:-.02em;font-weight:700}
.metric>small{display:block;margin-top:4px;color:var(--muted);font-size:9px}
.tone-positive{color:var(--green)!important}
.tone-warning{color:var(--amber)!important}
.tone-danger{color:var(--red)!important}

.dashboard-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(260px,.7fr);gap:18px;margin-bottom:24px}
.surface{min-width:0;padding:16px 0;border-top:1px solid var(--line)}
.chart-surface{padding-right:10px}
.focus-surface{padding-left:18px;border-left:1px solid var(--line)}
.section-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:13px}
.section-title h2{font-size:12.5px}
.section-title p{margin:3px 0 0;color:var(--muted);font-size:9.5px}
.section-block{padding:16px 0;border-top:1px solid var(--line)}
.dashboard-bottom-grid{display:grid;grid-template-columns:1fr 1fr;gap:26px}

.line-chart{height:248px;display:flex;flex-direction:column}
.line-chart-legend{display:flex;gap:16px;justify-content:flex-end;margin-bottom:8px;color:var(--muted);font-size:9px}
.line-chart-legend span{display:flex;align-items:center;gap:5px}
.line-chart-legend i{width:16px;height:2px;border-radius:2px}
.legend-primary{background:var(--text)}
.legend-secondary{background:var(--faint)}
.line-chart-stage{position:relative;flex:1;min-height:0}
.line-chart-grid{position:absolute;inset:0;display:grid;grid-template-rows:repeat(4,1fr)}
.line-chart-grid i{border-top:1px solid var(--line)}
.line-chart-stage svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.chart-line{fill:none;vector-effect:non-scaling-stroke;stroke-width:2}
.chart-line.primary{stroke:var(--text)}
.chart-line.secondary{stroke:var(--faint);stroke-width:1.5}
.line-chart-labels{display:grid;grid-template-columns:repeat(6,1fr);margin-top:8px;color:var(--faint);font-size:8.5px;text-align:center}

.focus-list{display:grid}
.focus-item{display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:9px;padding:10px 0;border-bottom:1px solid var(--line)}
.focus-item:last-child{border-bottom:0}
.focus-icon{width:28px;height:28px;border-radius:8px;background:var(--surface-2);display:grid;place-items:center;color:var(--text-2)}
.focus-icon.danger{background:var(--red-bg);color:var(--red)}
.focus-item>span:nth-child(2){display:grid;gap:2px}
.focus-item strong{font-size:10.5px}
.focus-item small{font-size:9px;color:var(--muted)}

.data-list{width:100%}
.data-row{display:grid;align-items:center;gap:12px;min-height:48px;border-bottom:1px solid var(--line);font-size:10.5px;color:var(--text-2)}
.data-row:last-child{border-bottom:0}
.data-head{min-height:31px;color:var(--faint);font-size:8.5px;text-transform:uppercase;letter-spacing:.045em;font-weight:700}
.primary-cell{display:grid;gap:2px;min-width:0}
.primary-cell strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);font-size:10.5px}
.primary-cell small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:9px}
.desktop-wide .data-row{grid-template-columns:minmax(240px,1.8fr) .55fr .65fr .55fr 1fr .45fr}
.customer-grid{grid-template-columns:minmax(220px,1.6fr) minmax(180px,1fr) .6fr .55fr 30px}
.quote-grid{grid-template-columns:minmax(250px,1.8fr) 1fr .7fr .7fr .65fr 30px}
.order-grid{grid-template-columns:minmax(250px,1.8fr) .6fr .65fr .55fr .75fr .5fr 30px}
.time-grid{grid-template-columns:.65fr minmax(240px,1.6fr) minmax(180px,1fr) .5fr .7fr 30px}
.invoice-grid{grid-template-columns:minmax(180px,1.1fr) 1fr .7fr .7fr .65fr 70px}
.employee-grid{grid-template-columns:minmax(250px,1.5fr) .7fr .9fr .7fr 1fr 30px}
.progress-cell{display:flex;align-items:center;gap:8px}
.mini-progress{height:5px;flex:1;min-width:70px;border-radius:99px;background:var(--surface-3);overflow:hidden}
.mini-progress i{display:block;height:100%;border-radius:inherit;background:var(--text)}
.progress-cell small{width:34px;font-size:8.5px;color:var(--muted)}
.row-link,.icon-button{width:28px;height:28px;border:1px solid transparent;border-radius:7px;background:transparent;color:var(--muted);display:grid;place-items:center}
.row-link:hover,.icon-button:hover{background:var(--surface-2);color:var(--text)}
.row-actions{display:flex;align-items:center;justify-content:flex-end}

.status{display:inline-flex;align-items:center;width:max-content;min-height:21px;padding:0 7px;border-radius:999px;font-size:8.5px;font-weight:650;background:var(--surface-3);color:var(--text-2)}
.status.active,.status.accepted,.status.paid{background:var(--green-bg);color:var(--green)}
.status.sent{background:var(--blue-bg);color:var(--blue)}
.status.overdue,.status.declined{background:var(--red-bg);color:var(--red)}
.status.expired{background:var(--amber-bg);color:var(--amber)}
.status.partial{background:var(--amber-bg);color:var(--amber)}
.status.neutral,.status.draft{background:var(--surface-3);color:var(--text-2)}

.compact-list{display:grid}
.compact-list>div{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:14px;padding:9px 0;border-bottom:1px solid var(--line);font-size:10px}
.compact-list>div:last-child{border-bottom:0}
.timeline{display:grid}
.timeline>div{display:grid;grid-template-columns:8px minmax(0,1fr) auto;gap:10px;align-items:start;padding:8px 0}
.timeline i{width:6px;height:6px;margin-top:4px;border-radius:50%;background:var(--text)}
.timeline span{display:grid;gap:2px}
.timeline strong{font-size:10px}
.timeline small,.timeline time{font-size:8.5px;color:var(--muted)}

.workflow-strip{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-bottom:18px}
.workflow-strip>div{padding:10px 13px;border-right:1px solid var(--line);display:grid;gap:1px}
.workflow-strip>div:first-child{padding-left:0}
.workflow-strip>div:last-child{border-right:0}
.workflow-strip strong{font-size:15px}
.workflow-strip span{font-size:8.5px;color:var(--muted)}
.invoice-workflow{grid-template-columns:repeat(3,1fr)}

.module-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
.search-field{width:min(360px,100%);height:34px;border:1px solid var(--line);border-radius:8px;background:var(--surface);display:flex;align-items:center;gap:7px;padding:0 9px;color:var(--muted)}
.search-field input{width:100%;border:0;outline:0;background:transparent;font-size:11px}
.toolbar-meta{font-size:9.5px;color:var(--muted)}

.time-hero{display:grid;grid-template-columns:auto minmax(160px,1fr) auto;align-items:center;gap:18px;padding:14px 0 18px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-bottom:12px}
.time-hero>div:not(.time-hero-progress){display:grid;gap:2px}
.time-hero span{font-size:8.5px;color:var(--muted)}
.time-hero strong{font-size:16px}
.time-hero small{font-size:8.5px;color:var(--muted)}
.time-hero-progress{height:7px;background:var(--surface-3);border-radius:99px;overflow:hidden}
.time-hero-progress i{display:block;height:100%;background:var(--text);border-radius:inherit}

.finance-ledger{display:grid}
.finance-ledger>div{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line);font-size:10px}
.finance-ledger>div.total{padding-top:12px;border-bottom:0}
.finance-ledger span{color:var(--muted)}
.check-list{display:grid}
.check-list>div{display:flex;align-items:center;gap:8px;padding:8px 0;font-size:10px}
.empty-check{width:16px;height:16px;border-radius:50%;border:1px solid var(--line-strong)}
.user-cell{display:flex;align-items:center;gap:9px}

.settings-sections{border-top:1px solid var(--line)}
.settings-row{display:grid;grid-template-columns:minmax(220px,.8fr) minmax(280px,1fr);gap:32px;padding:18px 0;border-bottom:1px solid var(--line)}
.settings-row h2{font-size:11.5px}
.settings-row p{margin:3px 0 0;color:var(--muted);font-size:9.5px;max-width:420px}
.segmented{display:grid;grid-template-columns:repeat(3,1fr);width:min(360px,100%);padding:3px;border-radius:9px;background:var(--surface-3)}
.segmented button{min-height:31px;border:0;border-radius:6px;background:transparent;color:var(--muted);font-size:10px}
.segmented button[aria-pressed='true']{background:var(--surface);color:var(--text);box-shadow:var(--shadow-soft)}
.switch-list{display:grid}
.switch-list label{display:flex;justify-content:space-between;gap:16px;padding:7px 0;font-size:10px}
.settings-values{margin:0}
.settings-values>div{display:flex;justify-content:space-between;padding:6px 0;font-size:10px}
.settings-values dt{color:var(--muted)}
.settings-values dd{margin:0;font-weight:600}

.overlay-layer,.mobile-menu-layer{position:fixed;inset:0;z-index:100;background:rgba(10,12,15,.32);display:grid;place-items:start center;padding-top:max(76px,var(--safe-top));padding-inline:14px}
.command-dialog{width:min(620px,100%);border:1px solid var(--line-strong);border-radius:13px;background:var(--surface);box-shadow:var(--shadow);overflow:hidden}
.command-input{height:48px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;padding:0 12px;border-bottom:1px solid var(--line)}
.command-input input{height:100%;border:0;outline:0;background:transparent;font-size:14px}
.command-results{padding:7px}
.command-label{display:block;padding:5px 7px 6px;color:var(--faint);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.command-results a{min-height:46px;padding:0 8px;border-radius:8px;display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:9px;text-decoration:none}
.command-results a:hover{background:var(--surface-2)}
.command-icon{width:28px;height:28px;border-radius:7px;background:var(--surface-2);display:grid;place-items:center}
.command-results a>span:nth-child(2){display:grid;gap:1px}
.command-results strong{font-size:10.5px}
.command-results small{font-size:8.5px;color:var(--muted)}

.sheet-layer{place-items:end center;padding:0}
.action-sheet,.form-sheet{width:min(620px,100%);max-height:min(82dvh,760px);overflow:auto;padding:9px 16px calc(18px + var(--safe-bottom));border-radius:18px 18px 0 0;background:var(--surface);box-shadow:var(--shadow)}
.compact-sheet{width:min(520px,100%)}
.sheet-grabber{width:34px;height:4px;margin:0 auto 8px;border-radius:99px;background:var(--line-strong)}
.sheet-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:4px 0 14px}
.sheet-heading>div{display:grid;gap:2px}
.sheet-heading strong{font-size:12px}
.sheet-heading span{font-size:9px;color:var(--muted)}
.quick-actions-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.quick-actions-grid a{min-height:78px;padding:12px;border:1px solid var(--line);border-radius:10px;text-decoration:none;display:grid;align-content:center;gap:7px;background:var(--surface)}
.quick-actions-grid a>span{width:30px;height:30px;border-radius:8px;background:var(--surface-2);display:grid;place-items:center}
.quick-actions-grid strong{font-size:10px}

.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.form-grid label{display:grid;gap:5px}
.form-grid label.full{grid-column:1/-1}
.form-grid label>span{font-size:9px;color:var(--muted);font-weight:600}
.form-grid input,.form-grid select,.form-grid textarea{width:100%;border:1px solid var(--line-strong);border-radius:8px;background:var(--surface);padding:0 10px;outline:0;font-size:12px}
.form-grid input,.form-grid select{height:38px}
.form-grid textarea{padding-top:9px;resize:vertical}
.sheet-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}

.profile-popover{position:fixed;right:14px;top:52px;z-index:110;width:260px;border:1px solid var(--line-strong);border-radius:11px;background:var(--surface);box-shadow:var(--shadow);padding:10px}
.profile-card-head{display:flex;gap:10px;align-items:flex-start;padding:4px 4px 10px}
.profile-card-head>span:last-child{display:grid;gap:2px;min-width:0}
.profile-card-head strong{font-size:10.5px}
.profile-card-head small{font-size:8.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis}
.profile-links{border-top:1px solid var(--line);padding-top:6px}
.profile-links a{min-height:36px;padding:0 7px;border-radius:7px;display:flex;align-items:center;gap:8px;text-decoration:none;font-size:10px}
.profile-links a:hover{background:var(--surface-2)}

.document-preview-shell{width:min(820px,calc(100vw - 28px));max-height:calc(100dvh - 92px);overflow:auto;border:1px solid var(--line-strong);border-radius:14px;background:var(--surface);box-shadow:var(--shadow)}
.preview-toolbar{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid var(--line);background:var(--surface)}
.preview-toolbar>div:first-child{display:grid;gap:1px}
.preview-toolbar>div:first-child strong{font-size:10px}
.preview-toolbar>div:first-child span{font-size:8.5px;color:var(--muted)}
.preview-toolbar>div:last-child{display:flex;gap:3px}
.document-preview{width:min(650px,calc(100% - 32px));min-height:520px;margin:18px auto;padding:42px;background:#fff;color:#111;border:1px solid #e5e7eb;box-shadow:0 12px 34px rgba(0,0,0,.08)}
.document-preview header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:34px}
.preview-logo{font-size:16px;font-weight:800;letter-spacing:.14em}
.document-preview header>div:last-child{display:grid;text-align:right;gap:2px}
.document-preview header strong{font-size:18px}
.document-preview header span{font-size:10px}
.document-preview section{display:grid;gap:4px;font-size:11px}
.document-preview section small{color:#777}
.document-preview section p{margin:18px 0 0}
.preview-total{margin-top:120px;padding-top:14px;border-top:1px solid #ddd;display:flex;justify-content:space-between}
.preview-total span{font-size:10px}
.preview-total strong{font-size:17px}
.document-preview footer{margin-top:80px;padding-top:12px;border-top:1px solid #eee;font-size:9px;color:#777}
.invoice-lines{margin-top:32px;border-top:1px solid #ddd;border-bottom:1px solid #ddd}
.invoice-lines>div{display:flex;justify-content:space-between;padding:12px 0;font-size:10px}
.preview-actions{display:flex;justify-content:flex-end;gap:8px;padding:10px 12px;border-top:1px solid var(--line)}

.mobile-pill,.mobile-record-list{display:none}
.mobile-menu-layer{display:none}

.big-action{min-height:78px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);display:grid;grid-template-columns:34px 1fr auto;align-items:center;gap:10px;text-decoration:none}
.big-action>span:nth-child(2){display:grid;gap:2px}
.big-action strong{font-size:11px}
.big-action small{font-size:9px;color:var(--muted)}
.mobile-progress{height:5px;background:var(--surface-3);border-radius:99px;overflow:hidden}
.mobile-progress i{display:block;height:100%;background:var(--text)}

.auth-page{min-height:100dvh;display:grid;place-items:center;padding:24px;background:var(--bg)}
.auth-card{width:min(360px,100%);padding:24px;border:1px solid var(--line);border-radius:13px;background:var(--surface)}
.auth-card .brand-mark.large{width:40px;height:40px}
.auth-card h1{margin:16px 0 5px;font-size:22px}
.auth-card p{margin:0 0 16px;font-size:10px}
.muted{color:var(--muted)}

@media(max-width:980px){
  .topbar{grid-template-columns:170px minmax(190px,1fr) auto}
  .app-shell{grid-template-columns:170px minmax(0,1fr)}
  .desktop-nav{width:170px}
  .app-main{grid-column:2;padding-inline:18px}
  .metric-strip{grid-template-columns:repeat(2,1fr)}
  .metric:nth-child(2){border-right:0}
  .metric:nth-child(-n+2){border-bottom:1px solid var(--line)}
  .metric:nth-child(3){padding-left:0}
  .dashboard-layout{grid-template-columns:1fr}
  .focus-surface{padding-left:0;border-left:0}
  .dashboard-bottom-grid{grid-template-columns:1fr}
  .employee-grid{grid-template-columns:minmax(220px,1.3fr) .65fr .85fr .7fr 1fr 30px}
}

@media(max-width:760px){
  html,body{overscroll-behavior-y:none}
  body{background:var(--bg)}
  .app-frame{padding-top:calc(52px + var(--safe-top))}
  .topbar{height:calc(52px + var(--safe-top));padding:var(--safe-top) 14px 0;grid-template-columns:1fr auto;border-bottom:1px solid var(--line)}
  .binso-logo-mark{width:28px;height:28px}
  .binso-logo-word{font-size:12px}
  .global-search,.topbar-create,.topbar-icon{display:none}
  .topbar-actions{gap:0}
  .avatar-button{width:34px;height:34px}
  .app-shell{display:block;min-height:auto}
  .desktop-nav{display:none}
  .app-main{padding:0 14px calc(94px + var(--safe-bottom))}
  .page{padding-top:17px}
  .page-header{align-items:flex-start;margin-bottom:16px}
  .page-actions{display:none}
  h1{font-size:22px}
  .page-description{font-size:11px;line-height:1.4}

  .metric-strip{grid-template-columns:1fr 1fr;margin-bottom:16px}
  .metric{padding:10px 10px 11px 0}
  .metric:nth-child(odd){border-right:1px solid var(--line)}
  .metric:nth-child(even){padding-left:10px;border-right:0}
  .metric:nth-child(-n+2){border-bottom:1px solid var(--line)}
  .metric>strong{font-size:16px}
  .metric>span{font-size:8.5px}
  .metric>small{font-size:8px}

  .dashboard-layout{gap:0;margin-bottom:16px}
  .surface,.section-block{padding:14px 0}
  .chart-surface{padding-right:0}
  .line-chart{height:210px}
  .focus-item{min-height:50px}

  .data-list{display:none}
  .mobile-record-list{display:grid;gap:0;border-top:1px solid var(--line)}
  .mobile-record{padding:12px 0;border-bottom:1px solid var(--line)}
  .record-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
  .record-top>span:first-child{display:grid;gap:2px;min-width:0}
  .record-top strong{font-size:10.5px}
  .record-top small{font-size:8.5px;color:var(--muted)}
  .record-icon{width:28px;height:28px;border-radius:8px;background:var(--surface-2);display:grid!important;place-items:center}
  .record-meta{display:flex;justify-content:space-between;gap:12px;margin-top:8px;color:var(--muted);font-size:8.5px}
  .mobile-record h3{font-size:10.5px;font-weight:500}

  .workflow-strip{grid-template-columns:repeat(2,1fr);margin-bottom:13px}
  .workflow-strip>div{padding:9px 10px}
  .workflow-strip>div:nth-child(2){border-right:0}
  .workflow-strip>div:nth-child(-n+2){border-bottom:1px solid var(--line)}
  .workflow-strip>div:nth-child(3){padding-left:0}
  .invoice-workflow{grid-template-columns:repeat(3,1fr)}
  .invoice-workflow>div{border-bottom:0!important;padding-left:8px!important}
  .invoice-workflow>div:first-child{padding-left:0!important}

  .module-toolbar{margin-bottom:8px}
  .search-field{height:40px;width:100%}
  .search-field input{font-size:16px}
  .toolbar-meta{display:none}

  input,select,textarea{font-size:16px!important}
  .form-grid{grid-template-columns:1fr}
  .form-grid label.full{grid-column:auto}
  .form-grid input,.form-grid select{height:44px}

  .time-hero{grid-template-columns:1fr 1fr;gap:10px}
  .time-hero-progress{grid-column:1/-1;grid-row:2}
  .time-hero>div:last-child{text-align:right}

  .settings-row{grid-template-columns:1fr;gap:12px;padding:15px 0}
  .segmented{width:100%}
  .switch-list label{min-height:40px;align-items:center}

  .mobile-pill{display:grid;grid-template-columns:1fr 44px 1fr;align-items:center;position:fixed;left:50%;bottom:calc(10px + var(--safe-bottom));transform:translateX(-50%);width:min(290px,calc(100vw - 28px));height:52px;padding:4px;background:var(--surface);border:1px solid var(--line-strong);border-radius:999px;box-shadow:0 12px 34px rgba(0,0,0,.16);z-index:80}
  html[data-theme='dark'] .mobile-pill{box-shadow:0 16px 42px rgba(0,0,0,.46)}
  .mobile-pill button{height:42px;border:0;background:transparent;color:var(--text);display:flex;align-items:center;justify-content:center;gap:6px;border-radius:999px;font-size:11px;font-weight:600}
  .pill-search{padding-left:11px}
  .pill-add{width:40px!important;height:40px!important;justify-self:center!important;background:var(--text)!important;color:var(--bg)!important}
  .pill-menu{margin-left:5px;padding:0 14px;background:var(--surface-3)!important;border:1px solid var(--line)!important}
  html[data-theme='dark'] .pill-menu{background:#20242a!important;border-color:#343941!important}
  .pill-menu:active,.pill-search:active,.pill-add:active{transform:scale(.96)}

  .mobile-menu-layer{display:grid;place-items:end center;padding:0}
  .mobile-menu-sheet{width:100%;max-height:82dvh;overflow:auto;padding:8px 15px calc(78px + var(--safe-bottom));border-radius:20px 20px 0 0;background:var(--surface)}
  .mobile-menu-sheet nav{display:grid}
  .mobile-menu-sheet nav a{min-height:46px;display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:8px;border-top:1px solid var(--line);text-decoration:none;color:var(--text-2);font-size:11px}
  .mobile-menu-sheet nav a.active{font-weight:650;color:var(--text)}
  .mobile-menu-icon{width:28px;height:28px;border-radius:8px;background:var(--surface-2);display:grid;place-items:center}

  .overlay-layer{padding-top:calc(62px + var(--safe-top));background:rgba(10,12,15,.38)}
  .command-dialog{border-radius:12px}
  .command-input{height:50px}
  .command-input input{font-size:16px}
  .command-input kbd{display:none}
  .command-results a{min-height:48px}

  .action-sheet,.form-sheet{max-height:88dvh;border-radius:20px 20px 0 0}
  .quick-actions-grid{grid-template-columns:repeat(2,1fr)}
  .quick-actions-grid a{min-height:76px}

  .profile-popover{top:calc(48px + var(--safe-top));right:10px;width:min(280px,calc(100vw - 20px))}

  .document-preview-shell{width:100%;max-height:100dvh;border-radius:0;border:0}
  .document-preview{width:calc(100% - 20px);min-height:490px;margin:10px auto;padding:26px 22px}
  .preview-actions{position:sticky;bottom:0;background:var(--surface);overflow:auto;justify-content:flex-start}
  .preview-actions .button{white-space:nowrap}

  .dashboard-bottom-grid{gap:0}
  .desktop-wide{display:none}
}

@media(max-width:390px){
  .metric-strip{grid-template-columns:1fr}
  .metric,.metric:nth-child(even),.metric:nth-child(3){padding:9px 0;border-right:0;border-bottom:1px solid var(--line)}
  .metric:last-child{border-bottom:0}
  .invoice-workflow{grid-template-columns:1fr}
  .invoice-workflow>div{border-right:0!important;border-bottom:1px solid var(--line)!important;padding-left:0!important}
  .invoice-workflow>div:last-child{border-bottom:0!important}
}

@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}
}

@media(display-mode:standalone){
  body{overscroll-behavior-y:none}
}

```

## `app/layout.tsx`

```tsx
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Binso Admin', template: '%s · Binso Admin' },
  description: 'Interne Administration für Binso GmbH',
  applicationName: 'Binso Admin',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Binso Admin' },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0c0e' },
  ],
}

const themeBoot = `(()=>{try{const t=localStorage.getItem('binso-theme')||'system';const d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch{}})()`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de-CH" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBoot }} /></head>
      <body>{children}<ServiceWorkerRegister /></body>
    </html>
  )
}

```

## `app/manifest.ts`

```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Binso Admin',
    short_name: 'Binso',
    description: 'Administration, Verkauf, Zeiterfassung und Finanzen für Binso GmbH.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    categories: ['business', 'productivity', 'finance'],
    icons: [
      { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}

```

## `app/offline/page.tsx`

```tsx
export default function Offline(){ return <main className="auth-page"><div className="auth-card"><div className="brand-mark large">B</div><h1>Keine Verbindung</h1><p className="muted">Die App-Oberfläche ist verfügbar. Geschäftsdaten werden aus Sicherheitsgründen nicht offline zwischengespeichert.</p></div></main> }

```

## `app/page.tsx`

```tsx
import { redirect } from 'next/navigation'
export default function Page(){ redirect('/dashboard') }

```

## `app/sign-in/page.tsx`

```tsx
import { env } from '@/lib/config/env'
import { signInUrl } from '@/lib/auth/server'
import { BinsoLogo } from '@/components/ui/binso-logo'

export default function SignInPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <BinsoLogo />
        <h1>Binso Admin</h1>
        <p className="muted">Mit deinem Firmenkonto anmelden.</p>
        {env.authMode === 'azure'
          ? <a className="button primary" href={signInUrl('/dashboard')}>Mit Microsoft anmelden</a>
          : <a className="button primary" href="/dashboard">Lokale Demo öffnen</a>}
      </div>
    </main>
  )
}

```

## `components/app-shell/app-shell.tsx`

```tsx
'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import type { AppUser } from '@/types/domain'
import { DesktopNav } from '@/components/navigation/desktop-nav'
import { MobilePillNav } from '@/components/navigation/mobile-pill-nav'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { Icon } from '@/components/ui/icon'
import { AppOverlays } from '@/components/shared/app-overlays'

export function AppShell({
  user,
  children,
}: {
  user: AppUser
  children: ReactNode
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="topbar-brand">
          <BinsoLogo />
        </div>

        <button className="global-search" onClick={() => setSearchOpen(true)}>
          <Icon name="search" size={16} />
          <span>Suchen</span>
          <kbd>Ctrl K</kbd>
        </button>

        <div className="topbar-actions">
          <button className="topbar-create" onClick={() => setQuickOpen(true)}>
            <Icon name="plus" size={16} />
            <span>Neu</span>
          </button>

          <button className="topbar-icon" aria-label="Benachrichtigungen">
            <Icon name="bell" size={17} />
            <i />
          </button>

          <button
            className="avatar-button"
            onClick={() => setProfileOpen((current) => !current)}
            aria-label="Profil öffnen"
          >
            <span className="avatar">{initials(user.name)}</span>
          </button>
        </div>
      </header>

      <div className="app-shell">
        <DesktopNav user={user} />
        <main className="app-main">{children}</main>
      </div>

      <MobilePillNav
        user={user}
        onSearch={() => setSearchOpen(true)}
        onQuick={() => setQuickOpen(true)}
      />

      <AppOverlays
        user={user}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        quickOpen={quickOpen}
        setQuickOpen={setQuickOpen}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
      />
    </div>
  )
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'BI'
  )
}

```

## `components/dashboard/revenue-chart.tsx`

```tsx
import { revenueSeries } from '@/lib/data/demo'

export function RevenueChart() {
  const max = Math.max(...revenueSeries.flatMap((item) => [item.revenue, item.cost]))

  const points = revenueSeries
    .map((item, index) => {
      const x = (index / (revenueSeries.length - 1)) * 100
      const y = 100 - (item.revenue / max) * 82 - 8
      return `${x},${y}`
    })
    .join(' ')

  const costPoints = revenueSeries
    .map((item, index) => {
      const x = (index / (revenueSeries.length - 1)) * 100
      const y = 100 - (item.cost / max) * 82 - 8
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="line-chart">
      <div className="line-chart-legend">
        <span><i className="legend-primary" /> Umsatz</span>
        <span><i className="legend-secondary" /> Kosten</span>
      </div>

      <div className="line-chart-stage">
        <div className="line-chart-grid">
          <i /><i /><i /><i />
        </div>

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Umsatz und Kosten der letzten sechs Monate">
          <polyline className="chart-line secondary" points={costPoints} />
          <polyline className="chart-line primary" points={points} />
        </svg>
      </div>

      <div className="line-chart-labels">
        {revenueSeries.map((item) => <span key={item.month}>{item.month}</span>)}
      </div>
    </div>
  )
}

```

## `components/navigation/desktop-nav.tsx`

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { navForRole } from './nav-items'
import type { AppUser } from '@/types/domain'

export function DesktopNav({ user }: { user: AppUser }) {
  const pathname = usePathname()
  const items = navForRole(user.role)
  const work = items.filter((item) => item.group === 'work')
  const management = items.filter((item) => item.group === 'management')
  const system = items.filter((item) => item.group === 'system')

  function render(itemsToRender: typeof items) {
    return itemsToRender.map((item) => {
      const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

      return (
        <Link key={item.href} href={item.href} className={active ? 'active' : undefined}>
          <Icon name={item.icon} size={16} />
          <span>{item.label}</span>
        </Link>
      )
    })
  }

  return (
    <aside className="desktop-nav">
      <div className="desktop-nav-section">
        <span className="nav-section-label">Arbeitsbereich</span>
        <nav>{render(work)}</nav>
      </div>

      {management.length > 0 && (
        <div className="desktop-nav-section">
          <span className="nav-section-label">Verwaltung</span>
          <nav>{render(management)}</nav>
        </div>
      )}

      <div className="nav-spacer" />

      <div className="desktop-nav-section system-section">
        <nav>{render(system)}</nav>
      </div>

      <div className="nav-footer">
        <span className="status-dot" />
        <span>Production</span>
      </div>
    </aside>
  )
}

```

## `components/navigation/mobile-pill-nav.tsx`

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { navForRole } from './nav-items'
import type { AppUser } from '@/types/domain'

export function MobilePillNav({
  user,
  onSearch,
  onQuick,
}: {
  user: AppUser
  onSearch: () => void
  onQuick: () => void
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const items = navForRole(user.role)

  return (
    <>
      {menuOpen && (
        <div className="mobile-menu-layer" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-grabber" />
            <div className="sheet-heading">
              <div>
                <strong>Navigation</strong>
                <span>Binso Administration</span>
              </div>
              <button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Schliessen">
                <Icon name="close" size={17} />
              </button>
            </div>

            <nav>
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? 'active' : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="mobile-menu-icon"><Icon name={item.icon} size={17} /></span>
                    <span>{item.label}</span>
                    <Icon name="chevron" size={15} />
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="mobile-pill" aria-label="Mobile Navigation">
        <button type="button" className="pill-search" onClick={onSearch}>
          <Icon name="search" size={17} />
          <span>Suche</span>
        </button>

        <button type="button" className="pill-add" onClick={onQuick} aria-label="Neu erstellen">
          <Icon name="plus" size={18} />
        </button>

        <button type="button" className="pill-menu" onClick={() => setMenuOpen(true)}>
          <span>Menü</span>
          <Icon name="menu" size={17} />
        </button>
      </div>
    </>
  )
}

```

## `components/navigation/nav-items.ts`

```ts
import type { IconName } from '@/components/ui/icon'
import type { Role } from '@/types/domain'

export type NavItem = {
  href: string
  label: string
  icon: IconName
  roles: Role[]
  group: 'work' | 'management' | 'system'
}

const all: Role[] = ['owner', 'admin', 'finance', 'employee']
const management: Role[] = ['owner', 'admin', 'finance']
const ownersAndAdmins: Role[] = ['owner', 'admin']

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: all, group: 'work' },
  { href: '/customers', label: 'Kunden', icon: 'customers', roles: management, group: 'work' },
  { href: '/quotes', label: 'Angebote', icon: 'quotes', roles: management, group: 'work' },
  { href: '/orders', label: 'Aufträge', icon: 'orders', roles: all, group: 'work' },
  { href: '/time', label: 'Zeiterfassung', icon: 'time', roles: all, group: 'work' },
  { href: '/invoices', label: 'Rechnungen', icon: 'invoices', roles: management, group: 'work' },
  { href: '/finance', label: 'Finanzen', icon: 'finance', roles: management, group: 'management' },
  { href: '/accounting', label: 'Buchhaltung', icon: 'accounting', roles: management, group: 'management' },
  { href: '/employees', label: 'Mitarbeitende', icon: 'employees', roles: ownersAndAdmins, group: 'management' },
  { href: '/settings', label: 'Einstellungen', icon: 'settings', roles: all, group: 'system' },
]

export function navForRole(role: Role) {
  return navItems.filter((item) => item.roles.includes(role))
}

```

## `components/pwa/push-settings.tsx`

```tsx
'use client'
import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const value = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(value), c => c.charCodeAt(0))
}

export function PushSettings() {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)
    navigator.serviceWorker?.ready.then(r => r.pushManager.getSubscription()).then(s => setEnabled(Boolean(s))).catch(() => undefined)
  }, [])

  async function toggle() {
    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const current = await registration.pushManager.getSubscription()
      if (current) {
        await fetch('/api/push/subscriptions', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify(current.toJSON()) })
        await current.unsubscribe()
        setEnabled(false)
        return
      }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) throw new Error('VAPID key missing')
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
      await fetch('/api/push/subscriptions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(subscription.toJSON()) })
      setEnabled(true)
    } finally { setBusy(false) }
  }

  if (!supported) return <p className="muted">Push wird auf diesem Gerät oder Browser nicht unterstützt.</p>
  return <button className="button secondary" onClick={toggle} disabled={busy}>{busy ? 'Bitte warten…' : enabled ? 'Push deaktivieren' : 'Push aktivieren'}</button>
}

```

## `components/pwa/service-worker-register.tsx`

```tsx
'use client'
import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined)
  }, [])
  return null
}

```

## `components/settings/theme-control.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

function apply(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  document.querySelectorAll('meta[name="theme-color"]').forEach((element) => {
    element.setAttribute('content', dark ? '#0b0c0e' : '#ffffff')
  })
}

export function ThemeControl() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = (localStorage.getItem('binso-theme') as Theme | null) ?? 'system'
    setTheme(stored)
    apply(stored)

    const media = matchMedia('(prefers-color-scheme: dark)')
    const listener = () => {
      const current = (localStorage.getItem('binso-theme') as Theme | null) ?? 'system'
      if (current === 'system') apply('system')
    }

    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  function change(value: Theme) {
    setTheme(value)
    localStorage.setItem('binso-theme', value)
    apply(value)
  }

  return (
    <div className="segmented" role="group" aria-label="Darstellung">
      {(['system', 'light', 'dark'] as const).map((value) => (
        <button key={value} type="button" aria-pressed={theme === value} onClick={() => change(value)}>
          {value === 'system' ? 'System' : value === 'light' ? 'Hell' : 'Dunkel'}
        </button>
      ))}
    </div>
  )
}

```

## `components/shared/app-overlays.tsx`

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import type { AppUser } from '@/types/domain'

const commandEntries = [
  { label: 'Kunde erfassen', meta: 'Aktion', href: '/customers?new=1', icon: 'customers' as const },
  { label: 'Angebot erstellen', meta: 'Aktion', href: '/quotes?new=1', icon: 'quotes' as const },
  { label: 'Zeit erfassen', meta: 'Aktion', href: '/time?new=1', icon: 'time' as const },
  { label: 'Rechnung erstellen', meta: 'Aktion', href: '/invoices?new=1', icon: 'invoices' as const },
  { label: 'Muster AG', meta: 'Kunde', href: '/customers', icon: 'building' as const },
  { label: 'Workplace Engineering 2026', meta: 'Auftrag', href: '/orders', icon: 'briefcase' as const },
  { label: 'RE-2026-009', meta: 'Rechnung', href: '/invoices', icon: 'receipt' as const },
]

export function AppOverlays({
  user,
  searchOpen,
  setSearchOpen,
  quickOpen,
  setQuickOpen,
  profileOpen,
  setProfileOpen,
}: {
  user: AppUser
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  quickOpen: boolean
  setQuickOpen: (open: boolean) => void
  profileOpen: boolean
  setProfileOpen: (open: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 40)
    } else {
      setQuery('')
    }
  }, [searchOpen])

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }

      if (event.key === 'Escape') {
        setSearchOpen(false)
        setQuickOpen(false)
        setProfileOpen(false)
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [setProfileOpen, setQuickOpen, setSearchOpen])

  const results = useMemo(() => {
    const cleaned = query.trim().toLowerCase()
    if (!cleaned) return commandEntries.slice(0, 5)

    return commandEntries.filter((entry) =>
      `${entry.label} ${entry.meta}`.toLowerCase().includes(cleaned),
    )
  }, [query])

  return (
    <>
      {searchOpen && (
        <div className="overlay-layer" onMouseDown={() => setSearchOpen(false)}>
          <div className="command-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-input">
              <Icon name="search" size={18} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Suchen oder Aktion ausführen"
                aria-label="Globale Suche"
              />
              <kbd>ESC</kbd>
            </div>

            <div className="command-results">
              <span className="command-label">{query ? 'Treffer' : 'Schnellzugriff'}</span>
              {results.map((entry) => (
                <Link key={`${entry.meta}-${entry.label}`} href={entry.href} onClick={() => setSearchOpen(false)}>
                  <span className="command-icon"><Icon name={entry.icon} size={17} /></span>
                  <span>
                    <strong>{entry.label}</strong>
                    <small>{entry.meta}</small>
                  </span>
                  <Icon name="chevron" size={15} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {quickOpen && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setQuickOpen(false)}>
          <div className="action-sheet" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-grabber" />
            <div className="sheet-heading">
              <div>
                <strong>Neu erstellen</strong>
                <span>Was möchtest du erfassen?</span>
              </div>
              <button className="icon-button" onClick={() => setQuickOpen(false)} aria-label="Schliessen">
                <Icon name="close" size={17} />
              </button>
            </div>

            <div className="quick-actions-grid">
              {([
                { label: 'Kunde', icon: 'customers', href: '/customers?new=1' },
                { label: 'Angebot', icon: 'quotes', href: '/quotes?new=1' },
                { label: 'Auftrag', icon: 'orders', href: '/orders?new=1' },
                { label: 'Zeit', icon: 'time', href: '/time?new=1' },
                { label: 'Rechnung', icon: 'invoices', href: '/invoices?new=1' },
                { label: 'Zahlung', icon: 'credit-card', href: '/invoices?payment=1' },
              ] as const).map((action) => (
                <Link key={action.label} href={action.href} onClick={() => setQuickOpen(false)}>
                  <span><Icon name={action.icon} size={19} /></span>
                  <strong>{action.label}</strong>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="profile-popover" role="dialog">
          <div className="profile-card-head">
            <span className="avatar large">{initials(user.name)}</span>
            <span>
              <strong>{user.name}</strong>
              <small>{roleLabel(user.role)}</small>
              <small>{user.email}</small>
            </span>
          </div>

          <div className="profile-links">
            <Link href="/settings" onClick={() => setProfileOpen(false)}>
              <Icon name="user" size={16} />
              Profil und Einstellungen
            </Link>
            <Link href="/settings" onClick={() => setProfileOpen(false)}>
              <Icon name="bell" size={16} />
              Benachrichtigungen
            </Link>
            <a href="/.auth/logout?post_logout_redirect_uri=/sign-in">
              <Icon name="logout" size={16} />
              Abmelden
            </a>
          </div>
        </div>
      )}
    </>
  )
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'BI'
  )
}

export function roleLabel(role: AppUser['role']) {
  if (role === 'owner') return 'Inhaber'
  if (role === 'admin') return 'Administrator'
  if (role === 'finance') return 'Buchhaltung'
  return 'Mitarbeiter'
}

```

## `components/ui/binso-logo.tsx`

```tsx
export function BinsoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? 'binso-logo compact' : 'binso-logo'} aria-label="Binso">
      <span className="binso-logo-mark">B</span>
      {!compact && <span className="binso-logo-word">BINSO</span>}
    </span>
  )
}

```

## `components/ui/icon.tsx`

```tsx
import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'dashboard'
  | 'customers'
  | 'quotes'
  | 'orders'
  | 'time'
  | 'invoices'
  | 'finance'
  | 'accounting'
  | 'employees'
  | 'settings'
  | 'search'
  | 'menu'
  | 'close'
  | 'chevron'
  | 'plus'
  | 'bell'
  | 'command'
  | 'check'
  | 'warning'
  | 'money'
  | 'calendar'
  | 'user'
  | 'building'
  | 'briefcase'
  | 'receipt'
  | 'chart'
  | 'logout'
  | 'dots'
  | 'send'
  | 'edit'
  | 'copy'
  | 'download'
  | 'credit-card'
  | 'clock'

export function Icon({
  name,
  size = 18,
  ...props
}: {
  name: IconName
  size?: number
} & SVGProps<SVGSVGElement>) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  const paths: Record<IconName, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    customers: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    quotes: <><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    orders: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></>,
    time: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    invoices: <><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></>,
    finance: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    accounting: <><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h4"/></>,
    employees: <><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.5M18 14a5 5 0 0 1 3 4.5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.12-1.28l2-1.55-2-3.46-2.45 1A7.3 7.3 0 0 0 14.2 5.4L13.8 3h-4l-.4 2.4a7.3 7.3 0 0 0-2.23 1.3l-2.45-1-2 3.46 2 1.55A7 7 0 0 0 4.6 12c0 .44.04.87.12 1.28l-2 1.55 2 3.46 2.45-1a7.3 7.3 0 0 0 2.23 1.3l.4 2.4h4l.4-2.4a7.3 7.3 0 0 0 2.23-1.3l2.45 1 2-3.46-2-1.55c.08-.41.12-.84.12-1.28Z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    command: <><path d="M9 6V5a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v14a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    warning: <><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v4M12 17h.01"/></>,
    money: <><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M17 14h.01M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    building: <><path d="M4 21V3h11v18M15 8h5v13M8 7h3M8 11h3M8 15h3M18 12h.01M18 16h.01M2 21h20"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18"/></>,
    receipt: <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/></>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6"/></>,
    dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></>,
    'credit-card': <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  }

  return <svg {...common} {...props}>{paths[name]}</svg>
}

```

## `components/ui/page-header.tsx`

```tsx
import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-actions">{action}</div>}
    </div>
  )
}

```

## `components/ui/stat-card.tsx`

```tsx
import { Icon, type IconName } from './icon'
export function StatCard({ label, value, helper, icon, trend }: { label: string; value: string; helper: string; icon: IconName; trend?: string }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} size={16}/></span></div><strong>{value}</strong><div className="stat-helper">{trend && <span className="trend-positive">{trend}</span>}<span>{helper}</span></div></article>
}

```

## `lib/auth/server.ts`

```ts
import 'server-only'
import { headers } from 'next/headers'
import { env } from '@/lib/config/env'
import type { Session } from './types'
import type { Role } from '@/types/domain'

type AzureClientPrincipal = {
  userId?: string
  userDetails?: string
  userRoles?: string[]
  claims?: Array<{ typ: string; val: string }>
}

function roleFromClaims(roles: string[]): Role {
  const normalized = roles.map((role) => role.toLowerCase())
  if (normalized.includes('owner')) return 'owner'
  if (normalized.includes('admin')) return 'admin'
  if (normalized.includes('finance') || normalized.includes('accounting')) return 'finance'
  return 'employee'
}

function parseAzurePrincipal(raw: string | null): Session {
  if (!raw) return null

  try {
    const json = Buffer.from(raw, 'base64').toString('utf8')
    const principal = JSON.parse(json) as AzureClientPrincipal
    const claims = principal.claims ?? []

    const email =
      principal.userDetails ??
      claims.find((claim) => claim.typ.includes('preferred_username'))?.val ??
      claims.find((claim) => claim.typ.includes('email'))?.val ??
      ''

    const name =
      claims.find((claim) => claim.typ.endsWith('/name'))?.val ??
      claims.find((claim) => claim.typ === 'name')?.val ??
      email.split('@')[0] ??
      'Benutzer'

    const roles = principal.userRoles ?? []

    return {
      user: {
        id: principal.userId ?? email,
        name,
        email,
        role: roleFromClaims(roles),
      },
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session> {
  if (env.authMode === 'local') {
    return {
      user: {
        id: 'local-demo',
        name: 'Demo Admin',
        email: 'demo@binso.ch',
        role: 'owner',
      },
    }
  }

  const requestHeaders = await headers()
  return parseAzurePrincipal(requestHeaders.get('x-ms-client-principal'))
}

export function signInUrl(returnTo = '/') {
  return `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(returnTo)}`
}

export function signOutUrl() {
  return '/.auth/logout?post_logout_redirect_uri=/sign-in'
}

```

## `lib/auth/types.ts`

```ts
import type { AppUser } from '@/types/domain'
export type Session = { user: AppUser; expiresAt?: string } | null

```

## `lib/config/env.ts`

```ts
export const env = {
  authMode: process.env.AUTH_MODE === 'azure' ? 'azure' : 'local',
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Binso Admin',
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
} as const

```

## `lib/data/demo.ts`

```ts
import type {
  Customer,
  Employee,
  Invoice,
  Order,
  Quote,
  TimeEntry,
} from '@/types/domain'

export const customers: Customer[] = [
  {
    id: 'cus-001',
    name: 'Muster AG',
    contact: 'Anna Keller',
    email: 'anna.keller@muster.ch',
    phone: '+41 31 555 18 20',
    paymentDays: 30,
    status: 'active',
  },
  {
    id: 'cus-002',
    name: 'Tech Partner Schweiz AG',
    contact: 'Marco Frei',
    email: 'marco.frei@techpartner.ch',
    phone: '+41 44 555 22 90',
    paymentDays: 20,
    status: 'active',
  },
  {
    id: 'cus-003',
    name: 'Alpine Systems AG',
    contact: 'Luca Meier',
    email: 'luca.meier@alpine.ch',
    phone: '+41 71 555 10 80',
    paymentDays: 30,
    status: 'active',
  },
]

export const quotes: Quote[] = [
  {
    id: 'quo-001',
    number: 'AN-2026-014',
    customerId: 'cus-001',
    customerName: 'Muster AG',
    title: 'Workplace Engineering Erweiterung',
    amount: 18400,
    validUntil: '30.09.2026',
    status: 'sent',
    version: 2,
  },
  {
    id: 'quo-002',
    number: 'AN-2026-013',
    customerId: 'cus-003',
    customerName: 'Alpine Systems AG',
    title: 'M365 Security Assessment',
    amount: 9600,
    validUntil: '27.09.2026',
    status: 'accepted',
    version: 1,
  },
  {
    id: 'quo-003',
    number: 'AN-2026-012',
    customerId: 'cus-002',
    customerName: 'Tech Partner Schweiz AG',
    title: 'Client Migration Phase 2',
    amount: 22800,
    validUntil: '15.09.2026',
    status: 'expired',
    version: 1,
  },
]

export const orders: Order[] = [
  {
    id: 'ord-001',
    customerId: 'cus-001',
    customerName: 'Muster AG',
    name: 'Workplace Engineering 2026',
    budgetHours: 1000,
    usedHours: 620,
    salesRate: 150,
    costRate: 105,
    status: 'active',
  },
  {
    id: 'ord-002',
    customerId: 'cus-002',
    customerName: 'Tech Partner Schweiz AG',
    name: 'Client Migration',
    budgetHours: 420,
    usedHours: 301,
    salesRate: 165,
    costRate: 110,
    status: 'active',
  },
  {
    id: 'ord-003',
    customerId: 'cus-003',
    customerName: 'Alpine Systems AG',
    name: 'M365 Security Review',
    budgetHours: 120,
    usedHours: 84,
    salesRate: 185,
    costRate: 118,
    status: 'active',
  },
]

export const timeEntries: TimeEntry[] = [
  {
    id: 'time-001',
    orderId: 'ord-001',
    orderName: 'Workplace Engineering 2026',
    customerName: 'Muster AG',
    date: '21.09.2026',
    hours: 8,
    note: 'Engineering und technische Dokumentation',
    billable: true,
    invoiced: false,
  },
  {
    id: 'time-002',
    orderId: 'ord-002',
    orderName: 'Client Migration',
    customerName: 'Tech Partner Schweiz AG',
    date: '18.09.2026',
    hours: 7.5,
    note: 'Migration und Tests',
    billable: true,
    invoiced: false,
  },
  {
    id: 'time-003',
    orderId: 'ord-003',
    orderName: 'M365 Security Review',
    customerName: 'Alpine Systems AG',
    date: '17.09.2026',
    hours: 6.5,
    note: 'Review und Dokumentation',
    billable: true,
    invoiced: true,
  },
  {
    id: 'time-004',
    orderId: 'ord-001',
    orderName: 'Workplace Engineering 2026',
    customerName: 'Muster AG',
    date: '16.09.2026',
    hours: 8,
    note: 'Client Engineering',
    billable: true,
    invoiced: false,
  },
]

export const invoices: Invoice[] = [
  {
    id: 'inv-001',
    number: 'RE-2026-009',
    customerName: 'Muster AG',
    period: 'September 2026',
    amount: 4200,
    due: '30.09.2026',
    status: 'sent',
    paidAmount: 0,
  },
  {
    id: 'inv-002',
    number: 'RE-2026-008',
    customerName: 'Alpine Systems AG',
    period: 'August 2026',
    amount: 1980,
    due: '20.09.2026',
    status: 'overdue',
    paidAmount: 0,
  },
  {
    id: 'inv-003',
    number: 'RE-2026-007',
    customerName: 'Tech Partner Schweiz AG',
    period: 'August 2026',
    amount: 7755,
    due: '15.09.2026',
    status: 'paid',
    paidAmount: 7755,
  },
]

export const employees: Employee[] = [
  {
    id: 'emp-001',
    name: 'Ömer Cam',
    role: 'owner',
    email: 'oemer.cam@binso.ch',
    targetHours: 168,
    bookedHours: 124.5,
    billableHours: 112,
    utilisation: 67,
  },
  {
    id: 'emp-002',
    name: 'Nina Keller',
    role: 'employee',
    email: 'nina.keller@binso.ch',
    targetHours: 168,
    bookedHours: 151,
    billableHours: 137,
    utilisation: 82,
  },
  {
    id: 'emp-003',
    name: 'David Frei',
    role: 'finance',
    email: 'david.frei@binso.ch',
    targetHours: 168,
    bookedHours: 142,
    billableHours: 41,
    utilisation: 24,
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
  { time: 'Heute, 09:12', title: '8.0 h erfasst', meta: 'Workplace Engineering 2026' },
  { time: 'Gestern, 16:40', title: 'Angebot versendet', meta: 'AN-2026-014 · Muster AG' },
  { time: '18.09, 14:08', title: 'Zahlung verbucht', meta: 'RE-2026-007 · CHF 7’755' },
  { time: '17.09, 11:32', title: 'Auftrag aktualisiert', meta: 'Client Migration' },
]

```

## `lib/security/permissions.ts`

```ts
import type { Role } from '@/types/domain'

export type Permission =
  | 'dashboard:owner'
  | 'customers:read'
  | 'customers:write'
  | 'quotes:read'
  | 'quotes:write'
  | 'orders:read'
  | 'orders:write'
  | 'time:read'
  | 'time:write'
  | 'invoices:read'
  | 'invoices:write'
  | 'payments:write'
  | 'finance:read'
  | 'accounting:read'
  | 'employees:read'
  | 'employees:manage'
  | 'settings:manage'

const matrix: Record<Role, Permission[]> = {
  owner: [
    'dashboard:owner',
    'customers:read',
    'customers:write',
    'quotes:read',
    'quotes:write',
    'orders:read',
    'orders:write',
    'time:read',
    'time:write',
    'invoices:read',
    'invoices:write',
    'payments:write',
    'finance:read',
    'accounting:read',
    'employees:read',
    'employees:manage',
    'settings:manage',
  ],
  admin: [
    'customers:read',
    'customers:write',
    'quotes:read',
    'quotes:write',
    'orders:read',
    'orders:write',
    'time:read',
    'time:write',
    'invoices:read',
    'invoices:write',
    'payments:write',
    'finance:read',
    'accounting:read',
    'employees:read',
    'employees:manage',
    'settings:manage',
  ],
  finance: [
    'customers:read',
    'quotes:read',
    'orders:read',
    'time:read',
    'invoices:read',
    'invoices:write',
    'payments:write',
    'finance:read',
    'accounting:read',
  ],
  employee: [
    'orders:read',
    'time:read',
    'time:write',
  ],
}

export function can(role: Role, permission: Permission) {
  return matrix[role].includes(permission)
}

```

## `lib/storage/repository.ts`

```ts
export interface Repository<T extends { id: string }> {
  list(): Promise<T[]>
  get(id: string): Promise<T | null>
  create(input: Omit<T, 'id'>): Promise<T>
  update(id: string, input: Partial<Omit<T, 'id'>>): Promise<T>
  remove(id: string): Promise<void>
}

```

## `lib/utils/format.ts`

```ts
export const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })
export const hours = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 1 })

```

## `next.config.ts`

```ts
import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }
]

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }
        ]
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }]
      }
    ]
  }
}

export default nextConfig

```

## `package.json`

```json
{
  "name": "binso-admin-platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.9.0"
  }
}

```

## `public/sw.js`

```javascript
const CACHE = 'binso-shell-v1'
const STATIC_ASSETS = ['/offline']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // Never cache API/authenticated business data. Only same-origin static assets are cached.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/.auth/')) return
  if (request.destination === 'document') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline')))
    return
  }
  if (['style','script','image','font'].includes(request.destination)) {
    event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()))
      return response
    })))
  }
})

self.addEventListener('push', event => {
  const data = event.data?.json() ?? { title: 'Binso Admin', body: 'Neue Benachrichtigung' }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    data: { url: data.url || '/' },
    tag: data.tag || 'binso-admin'
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = event.notification.data?.url || '/'
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => 'focus' in client)
    if (existing) { existing.navigate(target); return existing.focus() }
    return self.clients.openWindow(target)
  }))
})

```

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

## `types/domain.ts`

```ts
export type Role = 'owner' | 'admin' | 'finance' | 'employee'

export type AppUser = {
  id: string
  name: string
  email: string
  role: Role
}

export type Customer = {
  id: string
  name: string
  contact?: string
  email?: string
  phone?: string
  paymentDays: number
  status: 'active' | 'inactive'
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'

export type Quote = {
  id: string
  number: string
  customerId: string
  customerName: string
  title: string
  amount: number
  validUntil: string
  status: QuoteStatus
  version: number
}

export type Order = {
  id: string
  customerId: string
  customerName: string
  name: string
  budgetHours: number
  usedHours: number
  salesRate: number
  costRate: number
  status: 'active' | 'paused' | 'completed'
}

export type TimeEntry = {
  id: string
  orderId: string
  orderName: string
  customerName: string
  date: string
  hours: number
  note?: string
  billable: boolean
  invoiced: boolean
}

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'

export type Invoice = {
  id: string
  number: string
  customerName: string
  period: string
  amount: number
  due: string
  status: InvoiceStatus
  paidAmount: number
}

export type Employee = {
  id: string
  name: string
  role: Role
  email: string
  targetHours: number
  bookedHours: number
  billableHours: number
  utilisation: number
}

```
