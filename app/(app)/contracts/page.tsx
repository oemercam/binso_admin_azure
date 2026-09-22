'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input, Select, Textarea } from '@/components/ui/form-controls'
import { Icon } from '@/components/ui/icon'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { PageHeader } from '@/components/ui/page-header'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { useBusinessStore } from '@/components/state/business-store'
import { useFeedback } from '@/components/ui/feedback'
import type { BillingInterval, Contract, ContractLine, ContractStatus } from '@/types/domain'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2 })
const statusLabel: Record<ContractStatus, string> = { draft: 'Entwurf', active: 'Aktiv', paused: 'Pausiert', ended: 'Beendet', cancelled: 'Storniert' }
const intervalLabel: Record<BillingInterval, string> = { none: 'Keine', monthly: 'Monatlich', quarterly: 'Quartalsweise', yearly: 'Jährlich' }
const newLine = (): ContractLine => ({ id: `cl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, description: '', quantity: 1, unit: 'pauschal', unitPrice: 0, vatRate: 8.1 })

export default function ContractsPage() {
  const store = useBusinessStore()
  const feedback = useFeedback()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Contract | null>(null)

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    let cancelled = false
    queueMicrotask(() => { if (!cancelled) setCreating(true) })
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    router.replace(`${pathname}${suffix}`, { scroll: false })
    return () => { cancelled = true }
  }, [pathname, router, searchParams])

  const activeValue = useMemo(() => store.contracts.filter((item) => item.status === 'active').reduce((sum, contract) => sum + contract.lines.reduce((lineSum, line) => lineSum + line.quantity * line.unitPrice, 0), 0), [store.contracts])

  function createOrder(contract: Contract) {
    const order = store.createOrderFromContract(contract.id)
    if (!order) { feedback.warning('Für diesen Vertrag konnte kein Auftrag erstellt werden.'); return }
    feedback.success(`Auftrag «${order.name}» ist bereit.`)
    router.push(`/orders/${order.id}`)
  }

  function createInvoice(contract: Contract) {
    const invoice = store.createInvoiceFromContract(contract.id)
    if (!invoice) { feedback.warning('Für diesen Vertrag konnte keine Rechnung erstellt werden.'); return }
    feedback.success(`Rechnung ${invoice.number} wurde als Entwurf erstellt.`)
    router.push(`/invoices?view=${invoice.id}`)
  }

  return <section className="page">
    <PageHeader eyebrow="KUNDENBEZIEHUNG" title="Verträge" description="Laufende Vereinbarungen, Kündigungsfristen und wiederkehrende Abrechnung verwalten." action={<button className="button primary page-primary-action" onClick={() => setCreating(true)}><Icon name="plus" size={16}/><span>Vertrag erfassen</span></button>} />

    <div className="metric-grid compact-metrics">
      <div className="metric"><span>Aktive Verträge</span><strong>{store.contracts.filter((item) => item.status === 'active').length}</strong><small>Laufende Kundenvereinbarungen</small></div>
      <div className="metric"><span>Wiederkehrender Wert</span><strong>{chf.format(activeValue)}</strong><small>Summe pro jeweiligem Abrechnungsintervall</small></div>
      <div className="metric"><span>Nächste Abrechnung</span><strong>{nextBillingDate(store.contracts)}</strong><small>Frühester geplanter Rechnungstermin</small></div>
    </div>

    <div className="data-list compact-overview-list">
      <div className="data-row contract-grid data-head"><span>Vertrag</span><span>Kunde</span><span>Abrechnung</span><span>Nächste Rechnung</span><span>Status</span><span /></div>
      {store.contracts.map((contract) => <InteractiveRow className="data-row contract-grid compact-overview-row" key={contract.id} onActivate={() => setEditing(contract)} ariaLabel={`${contract.number} öffnen`}>
        <span className="primary-cell"><strong>{contract.number} · {contract.name}</strong><small className="desktop-row-detail">Start {fmt(contract.startDate)}{contract.endDate ? ` · Ende ${fmt(contract.endDate)}` : ' · unbefristet'}</small><small className="mobile-row-summary">{contract.customerName} · {intervalLabel[contract.billingInterval]} · {statusLabel[contract.status]}</small></span>
        <span className="overview-desktop-cell">{contract.customerName}</span>
        <span className="overview-desktop-cell">{intervalLabel[contract.billingInterval]}</span>
        <span className="overview-desktop-cell">{contract.nextInvoiceDate ? fmt(contract.nextInvoiceDate) : '–'}</span>
        <span className={`status ${contract.status} overview-desktop-cell`}>{statusLabel[contract.status]}</span>
        <span className="row-disclosure"><Icon name="chevron" size={15}/></span>
      </InteractiveRow>)}
    </div>

    {creating && <ContractForm initialCustomerId={searchParams.get('customer') ?? undefined} onClose={() => setCreating(false)} onSaved={(contract) => { setCreating(false); setEditing(contract); feedback.success(`Vertrag ${contract.number} wurde erstellt.`) }} />}
    {editing && <ContractEditor contract={editing} onClose={() => setEditing(null)} onOrder={() => createOrder(editing)} onInvoice={() => createInvoice(editing)} />}
  </section>

  function ContractForm({ initialCustomerId, onClose, onSaved }: { initialCustomerId?: string; onClose: () => void; onSaved: (contract: Contract) => void }) {
    const [customerId, setCustomerId] = useState(initialCustomerId && store.customers.some((item) => item.id === initialCustomerId) ? initialCustomerId : store.customers.find((item) => item.status === 'active')?.id ?? '')
    const [name, setName] = useState('')
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
    const [endDate, setEndDate] = useState('')
    const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly')
    const [nextInvoiceDate, setNextInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
    const [noticeDays, setNoticeDays] = useState(90)
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')
    const [lines, setLines] = useState<ContractLine[]>([newLine()])

    function save(event: React.FormEvent) {
      event.preventDefault()
      const validLines = lines.filter((line) => line.description.trim() && line.quantity > 0)
      const contract = store.createContract({ customerId, name: name.trim(), startDate, endDate: endDate || undefined, status: 'active', autoRenew: true, noticeDays, billingInterval, nextInvoiceDate: billingInterval === 'none' ? undefined : nextInvoiceDate, billingDay: nextInvoiceDate ? Number(nextInvoiceDate.slice(8, 10)) : undefined, lines: validLines, reference: reference.trim() || undefined, notes: notes.trim() || undefined })
      if (contract) onSaved(contract)
    }

    return <StandardFormSheet open title={<>Vertrag erfassen</>} description={<>Kunde und Vertragsmodell zuerst, Details nur soweit nötig.</>} onClose={onClose} onSubmit={save} formId="contract-create" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="contract-create" className="button primary">Vertrag speichern</button></>} mode="fullscreen">
      <details className="edit-step" open><summary><span><strong>1 · Vertrag</strong><small>Kunde, Laufzeit und Referenz</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="form-grid">
        <label className="full"><span>Kunde *</span><Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>{store.customers.filter((item) => item.status === 'active').map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</Select></label>
        <label className="full"><span>Vertragsname *</span><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Managed Workplace Support" required/></label>
        <label><span>Beginn *</span><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required/></label>
        <label><span>Ende</span><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}/></label>
        <label><span>Kündigungsfrist Tage</span><Input type="number" min="0" value={noticeDays} onChange={(e) => setNoticeDays(Number(e.target.value))}/></label>
        <label><span>Referenz</span><Input value={reference} onChange={(e) => setReference(e.target.value)}/></label>
      </div></div></details>
      <details className="edit-step" open><summary><span><strong>2 · Abrechnung</strong><small>Wiederkehrende Rechnung und Positionen</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="form-grid">
        <label><span>Intervall *</span><Select value={billingInterval} onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}><option value="none">Keine automatische Abrechnung</option><option value="monthly">Monatlich</option><option value="quarterly">Quartalsweise</option><option value="yearly">Jährlich</option></Select></label>
        <label><span>Nächste Rechnung</span><Input type="date" value={nextInvoiceDate} onChange={(e) => setNextInvoiceDate(e.target.value)} disabled={billingInterval === 'none'}/></label>
      </div><div className="line-editor"><div className="line-editor-head"><strong>Vertragspositionen</strong><button type="button" className="text-button" onClick={() => setLines((current) => [...current, newLine()])}><Icon name="plus" size={14}/> Position</button></div>{lines.map((line) => <div className="line-editor-row quote-line-editor" key={line.id}><label><span>Beschreibung</span><Input value={line.description} onChange={(e) => setLines((current) => current.map((item) => item.id === line.id ? { ...item, description: e.target.value } : item))} required/></label><label><span>Menge</span><Input type="number" min="0.01" step="0.25" value={line.quantity} onChange={(e) => setLines((current) => current.map((item) => item.id === line.id ? { ...item, quantity: Number(e.target.value) } : item))}/></label><label><span>Einheit</span><Select value={line.unit} onChange={(e) => setLines((current) => current.map((item) => item.id === line.id ? { ...item, unit: e.target.value as ContractLine['unit'] } : item))}><option value="h">h</option><option value="Stk.">Stk.</option><option value="pauschal">pauschal</option></Select></label><label><span>Preis CHF</span><Input type="number" min="0" step="0.05" value={line.unitPrice} onChange={(e) => setLines((current) => current.map((item) => item.id === line.id ? { ...item, unitPrice: Number(e.target.value) } : item))}/></label></div>)}</div></div></details>
      <details className="edit-step"><summary><span><strong>3 · Notizen</strong><small>Interne Zusatzinformationen</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><label className="block-field"><span>Notiz</span><Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)}/></label></div></details>
    </StandardFormSheet>
  }

  function ContractEditor({ contract, onClose, onOrder, onInvoice }: { contract: Contract; onClose: () => void; onOrder: () => void; onInvoice: () => void }) {
    const [draft, setDraft] = useState(contract)
    function save(event: React.FormEvent) { event.preventDefault(); store.updateContract(contract.id, draft); onClose(); feedback.success('Vertrag wurde aktualisiert.') }
    return <StandardFormSheet open title={<>{contract.number}</>} description={<>{contract.customerName} · {contract.name}</>} onClose={onClose} onSubmit={save} formId="contract-edit" footer={<><button type="button" className="button secondary" onClick={onOrder}>Auftrag öffnen/erstellen</button><button type="button" className="button secondary" onClick={onInvoice} disabled={draft.status !== 'active' || draft.billingInterval === 'none'}>Rechnung erstellen</button><button type="submit" form="contract-edit" className="button primary">Speichern</button></>} mode="fullscreen"><div className="form-grid">
      <label className="full"><span>Vertragsname *</span><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required/></label>
      <label><span>Status</span><Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ContractStatus })}><option value="draft">Entwurf</option><option value="active">Aktiv</option><option value="paused">Pausiert</option><option value="ended">Beendet</option><option value="cancelled">Storniert</option></Select></label>
      <label><span>Abrechnung</span><Select value={draft.billingInterval} onChange={(e) => setDraft({ ...draft, billingInterval: e.target.value as BillingInterval })}><option value="none">Keine</option><option value="monthly">Monatlich</option><option value="quarterly">Quartalsweise</option><option value="yearly">Jährlich</option></Select></label>
      <label><span>Beginn</span><Input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}/></label>
      <label><span>Ende</span><Input type="date" value={draft.endDate ?? ''} onChange={(e) => setDraft({ ...draft, endDate: e.target.value || undefined })}/></label>
      <label><span>Nächste Rechnung</span><Input type="date" value={draft.nextInvoiceDate ?? ''} onChange={(e) => setDraft({ ...draft, nextInvoiceDate: e.target.value || undefined })}/></label>
      <label><span>Kündigungsfrist Tage</span><Input type="number" min="0" value={draft.noticeDays} onChange={(e) => setDraft({ ...draft, noticeDays: Number(e.target.value) })}/></label>
      <label className="full"><span>Notizen</span><Textarea rows={5} value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })}/></label>
    </div></StandardFormSheet>
  }
}

function fmt(value: string) { return new Intl.DateTimeFormat('de-CH').format(new Date(`${value}T12:00:00`)) }
function nextBillingDate(contracts: Contract[]) { const values = contracts.filter((item) => item.status === 'active' && item.nextInvoiceDate).map((item) => item.nextInvoiceDate as string).sort(); return values[0] ? fmt(values[0]) : '–' }
