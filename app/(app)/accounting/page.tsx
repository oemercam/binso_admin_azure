'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DatePicker, Select, Textarea, Input } from '@/components/ui/form-controls'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { CompactInfoRow } from '@/components/ui/compact-info-row'
import { useBusinessStore } from '@/components/state/business-store'
import { downloadTextFile } from '@/lib/browser/actions'
import { formatChf } from '@/lib/format/locale'

const chf = (value: number) => formatChf(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function AccountingPage() {
  const store = useBusinessStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [supplierOpen, setSupplierOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setSupplierOpen(true)
    })
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    router.replace(`${pathname}${suffix}`, { scroll: false })
    return () => { cancelled = true }
  }, [pathname, router, searchParams])

  const openSupplier = store.supplierInvoices
    .filter((invoice) => invoice.status !== 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  const openCustomer = store.invoices
    .filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled')
    .reduce((sum, invoice) => sum + invoice.amount - invoice.paidAmount, 0)

  const supplierReviewCount = store.supplierInvoices.filter((invoice) => invoice.status === 'review').length
  const supplierOpenCount = store.supplierInvoices.filter((invoice) => invoice.status === 'open').length
  const overdueCustomerCount = store.invoices.filter((invoice) => invoice.status === 'overdue').length

  const orderCosts = useMemo(() => store.orders
    .map((order) => {
      const internal = store.timeEntries
        .filter((entry) => entry.orderId === order.id)
        .reduce((sum, entry) => sum + entry.hours * entry.internalCostRate, 0)
      const external = store.supplierInvoices
        .filter((invoice) => invoice.orderId === order.id)
        .reduce((sum, invoice) => sum + invoice.netAmount, 0)
      return { order, internal, external, total: internal + external }
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total), [store.orders, store.supplierInvoices, store.timeEntries])

  function exportCsv() {
    const rows = [
      ['Typ', 'Nummer', 'Partner', 'Datum', 'Fällig', 'Betrag', 'Status'],
      ...store.invoices.map((invoice) => ['Debitor', invoice.number, invoice.customerName, invoice.issueDate, invoice.due, invoice.amount.toFixed(2), invoice.status]),
      ...store.supplierInvoices.map((invoice) => ['Kreditor', invoice.number, invoice.supplierName, invoice.invoiceDate, invoice.due, invoice.amount.toFixed(2), invoice.status]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n')
    downloadTextFile(`binso-buchhaltung-${new Date().toISOString().slice(0, 10)}.csv`, `\ufeff${csv}`, 'text/csv;charset=utf-8')
  }

  return (
    <section className="page apple-page">
      <PageHeader
        title="Buchhaltung"
        description="Offene Posten, Lieferantenrechnungen und Zahlungen bearbeiten."
        action={
          <button
            className="button primary page-primary-action"
            onClick={() => setSupplierOpen(true)}
            aria-label="Lieferantenrechnung erfassen"
            title="Lieferantenrechnung erfassen"
          >
            <Icon name="plus" size={16}/>
            <span>Lieferantenrechnung</span>
          </button>
        }
      />

      <div className="metric-strip">
        <div className="metric"><span>Offene Debitoren</span><strong>{chf(openCustomer)}</strong><small>Kundenrechnungen</small></div>
        <div className="metric"><span>Offene Kreditoren</span><strong>{chf(openSupplier)}</strong><small>Lieferantenrechnungen</small></div>
        <div className="metric"><span>Überfällig</span><strong>{overdueCustomerCount}</strong><small>Kundenrechnungen</small></div>
        <div className="metric"><span>Zahlungen</span><strong>{store.payments.length}</strong><small>verbucht</small></div>
      </div>

      <section className="section-block">
        <div className="section-title">
          <div>
            <h2>Zu erledigen</h2>
            <p>Die nächsten Aufgaben in der Buchhaltung</p>
          </div>
          <button type="button" className="button secondary section-action" onClick={exportCsv}>
            <Icon name="download" size={15}/>
            <span>Export</span>
          </button>
        </div>
        <div className="accounting-task-list">
          <button type="button" className="accounting-task-row" onClick={() => setSupplierOpen(true)}>
            <span className="accounting-task-copy">
              <strong>Lieferantenrechnung erfassen</strong>
              <small>Neue externe Kosten einem Auftrag zuordnen</small>
            </span>
            <Icon name="chevron" size={15}/>
          </button>
          <div className="accounting-task-row static">
            <span className="accounting-task-copy">
              <strong>Kreditoren prüfen</strong>
              <small>{supplierReviewCount} in Prüfung · {supplierOpenCount} freigegeben</small>
            </span>
            <span className="status neutral">{supplierReviewCount}</span>
          </div>
          <div className="accounting-task-row static">
            <span className="accounting-task-copy">
              <strong>Überfällige Debitoren</strong>
              <small>Offene Kundenrechnungen und Mahnungen</small>
            </span>
            <span className={overdueCustomerCount ? 'status overdue' : 'status neutral'}>{overdueCustomerCount}</span>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-title">
          <div>
            <h2>Lieferantenrechnungen</h2>
            <p>Externe Leistungen und Fremdkosten</p>
          </div>
        </div>
        <div className="compact-list operational-compact-list">
          {store.supplierInvoices.length ? store.supplierInvoices.map((invoice) => (
            <CompactInfoRow
              key={invoice.id}
              title={`${invoice.number} · ${invoice.supplierName}`}
              meta={`${invoice.orderName || 'Ohne Auftrag'} · ${invoice.note || 'Keine Beschreibung'}`}
              amount={chf(invoice.amount)}
              trailing={
                <>
                  <span className={`status ${invoice.status === 'paid' ? 'paid' : invoice.status === 'review' ? 'neutral' : 'active'}`}>
                    {invoice.status === 'paid' ? 'Bezahlt' : invoice.status === 'review' ? 'In Prüfung' : 'Freigegeben'}
                  </span>
                  {invoice.status === 'review' && (
                    <button className="row-link text-row-action" onClick={() => store.updateSupplierInvoice(invoice.id, { status: 'open' })}>
                      Freigeben
                    </button>
                  )}
                  {invoice.status === 'open' && (
                    <button className="row-link text-row-action" onClick={() => store.updateSupplierInvoice(invoice.id, { status: 'paid' })}>
                      Bezahlt
                    </button>
                  )}
                </>
              }
            />
          )) : (
            <div className="empty-state compact-empty-state">
              <strong>Keine Lieferantenrechnungen</strong>
              <span>Neue externe Kosten kannst du oben erfassen.</span>
            </div>
          )}
        </div>
      </section>

      <section className="section-block">
        <div className="section-title">
          <div>
            <h2>Auftragskosten</h2>
            <p>Interne und externe Kosten nach Auftrag</p>
          </div>
        </div>
        <div className="compact-list operational-compact-list">
          {orderCosts.length ? orderCosts.map(({ order, internal, external, total }) => (
            <CompactInfoRow
              key={order.id}
              title={order.name}
              meta={`${chf(internal)} intern · ${chf(external)} extern`}
              amount={chf(total)}
            />
          )) : (
            <div className="empty-state compact-empty-state">
              <strong>Noch keine Auftragskosten</strong>
              <span>Kosten erscheinen, sobald Zeiten oder Lieferantenrechnungen erfasst sind.</span>
            </div>
          )}
        </div>
      </section>

      {supplierOpen && <SupplierInvoiceForm onClose={() => setSupplierOpen(false)} />}
    </section>
  )

  function SupplierInvoiceForm({ onClose }: { onClose: () => void }) {
    const [supplierId, setSupplierId] = useState(store.suppliers[0]?.id ?? '')
    const [orderId, setOrderId] = useState(store.orders[0]?.id ?? '')
    const [number, setNumber] = useState('')
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
    const [due, setDue] = useState(new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10))
    const [netAmount, setNetAmount] = useState('')
    const [vatRate, setVatRate] = useState('8.1')
    const [note, setNote] = useState('')

    function save(event: React.FormEvent) {
      event.preventDefault()
      const supplier = store.suppliers.find((item) => item.id === supplierId)
      const order = store.orders.find((item) => item.id === orderId)
      if (!supplier) return
      const net = Number(netAmount)
      const vat = Math.round(net * (Number(vatRate) / 100) * 100) / 100
      store.addSupplierInvoice({
        id: `sinv-${Date.now()}`,
        number: number.trim(),
        supplierId: supplier.id,
        supplierName: supplier.name,
        orderId: order?.id,
        orderName: order?.name,
        invoiceDate,
        due,
        netAmount: net,
        vatAmount: vat,
        amount: Math.round((net + vat) * 100) / 100,
        status: 'review',
        note: note.trim(),
      })
      onClose()
    }

    return (
      <StandardFormSheet
        open
        title={<>Lieferantenrechnung erfassen</>}
        description={<>Externe Leistung einem Auftrag zuordnen.</>}
        onClose={onClose}
        onSubmit={save}
        formId="accounting-page-sheet-1"
        footer={
          <>
            <button type="button" className="button secondary" onClick={onClose}>Abbrechen</button>
            <button type="submit" form="accounting-page-sheet-1" className="button primary">Speichern</button>
          </>
        }
      >
        <div className="form-grid">
          <label><span>Lieferant *</span><Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>{store.suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}</Select></label>
          <label><span>Auftrag</span><Select value={orderId} onChange={(e) => setOrderId(e.target.value)}><option value="">Ohne Auftrag</option>{store.orders.map((order) => <option value={order.id} key={order.id}>{order.name}</option>)}</Select></label>
          <label><span>Rechnungsnummer *</span><Input value={number} onChange={(e) => setNumber(e.target.value)} required/></label>
          <label><span>Rechnungsdatum *</span><DatePicker value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required/></label>
          <label><span>Fällig *</span><DatePicker value={due} onChange={(e) => setDue(e.target.value)} required/></label>
          <label><span>Netto CHF *</span><Input inputMode="decimal" value={netAmount} onChange={(e) => setNetAmount(e.target.value)} required/></label>
          <label><span>MWST %</span><Input inputMode="decimal" value={vatRate} onChange={(e) => setVatRate(e.target.value)}/></label>
          <label className="full"><span>Beschreibung</span><Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)}/></label>
        </div>
      </StandardFormSheet>
    )
  }
}
