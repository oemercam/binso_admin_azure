'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DatePicker, Input, Select, Textarea } from '@/components/ui/form-controls'
import { Icon } from '@/components/ui/icon'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { PageHeader } from '@/components/ui/page-header'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { Toggle } from '@/components/ui/toggle'
import { useBusinessStore } from '@/components/state/business-store'
import { useFeedback } from '@/components/ui/feedback'
import type { BillingInterval, Contract, ContractLine, ContractStatus } from '@/types/domain'
import { formatChf, formatDate, formatMonthYear } from '@/lib/format/locale'
const chf = (value: number) => formatChf(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
    const params = new URLSearchParams(searchParams.toString())
    const createRequested = params.get('new') === '1'
    const viewId = params.get('view')
    const viewContract = viewId ? store.contracts.find((item) => item.id === viewId) : undefined
    if (!createRequested && !viewContract) return
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      if (createRequested) setCreating(true)
      if (viewContract) setEditing(viewContract)
    })
    if (createRequested) params.delete('new')
    if (viewContract) params.delete('view')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    router.replace(`${pathname}${suffix}`, { scroll: false })
    return () => { cancelled = true }
  }, [pathname, router, searchParams, store.contracts])

  const activeValue = useMemo(() => store.contracts.filter((item) => item.status === 'active').reduce((sum, contract) => sum + contract.lines.reduce((lineSum, line) => lineSum + line.quantity * line.unitPrice, 0), 0), [store.contracts])

  function createOrder(contract: Contract) {
    const order = store.createOrderFromContract(contract.id)
    if (!order) { feedback.warning('Für diesen Vertrag konnte kein Auftrag erstellt werden.'); return }
    feedback.success(`Auftrag «${order.name}» ist bereit.`)
    router.push(`/orders/${order.id}`)
  }

  function createInvoice(contract: Contract) {
    const billingDate = contract.nextInvoiceDate || new Date().toISOString().slice(0, 10)
    const billingPeriod = formatMonthYear(billingDate)
    const existing = store.invoices.find((item) => item.contractId === contract.id && item.period === billingPeriod && item.status !== 'cancelled')
    if (existing) {
      feedback.info(`Rechnung ${existing.number} für ${billingPeriod} ist bereits vorhanden.`)
      router.push(`/invoices?view=${existing.id}`)
      return
    }
    const invoice = store.createInvoiceFromContract(contract.id)
    if (!invoice) { feedback.warning('Für diesen Vertrag konnte keine Rechnung erstellt werden.'); return }
    feedback.success(`Rechnung ${invoice.number} für ${billingPeriod} wurde als Entwurf erstellt.`)
    router.push(`/invoices?view=${invoice.id}`)
  }

  return <section className="page apple-page mobile-standard-page">
    <PageHeader title="Verträge" description="Verträge, Laufzeiten, Konditionen und wiederkehrende Abrechnung verwalten." action={<button className="button primary page-primary-action" onClick={() => setCreating(true)}><Icon name="plus" size={16}/><span>Vertrag erfassen</span></button>} />

    <div className="metric-grid compact-metrics mobile-desktop-supplement">
      <div className="metric"><span>Aktive Verträge</span><strong>{store.contracts.filter((item) => item.status === 'active').length}</strong><small>Laufende Kundenvereinbarungen</small></div>
      <div className="metric"><span>Wiederkehrender Wert</span><strong>{chf(activeValue)}</strong><small>Summe pro jeweiligem Abrechnungsintervall</small></div>
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
        <label><span>Beginn *</span><DatePicker value={startDate} onChange={(e) => setStartDate(e.target.value)} required/></label>
        <label><span>Ende</span><DatePicker value={endDate} onChange={(e) => setEndDate(e.target.value)}/></label>
        <label><span>Kündigungsfrist Tage</span><Input type="number" min="0" value={noticeDays} onChange={(e) => setNoticeDays(Number(e.target.value))}/></label>
        <label><span>Referenz</span><Input value={reference} onChange={(e) => setReference(e.target.value)}/></label>
      </div></div></details>
      <details className="edit-step" open><summary><span><strong>2 · Abrechnung</strong><small>Wiederkehrende Rechnung und Positionen</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="form-grid">
        <label><span>Intervall *</span><Select value={billingInterval} onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}><option value="none">Keine automatische Abrechnung</option><option value="monthly">Monatlich</option><option value="quarterly">Quartalsweise</option><option value="yearly">Jährlich</option></Select></label>
        <label><span>Nächste Rechnung</span><DatePicker value={nextInvoiceDate} onChange={(e) => setNextInvoiceDate(e.target.value)} disabled={billingInterval === 'none'}/></label>
      </div><div className="line-editor"><div className="line-editor-head"><strong>Vertragspositionen</strong><button type="button" className="text-button" onClick={() => setLines((current) => [...current, newLine()])}><Icon name="plus" size={14}/> Position</button></div>{lines.map((line) => <div className="line-editor-row quote-line-editor" key={line.id}><label><span>Beschreibung</span><Input value={line.description} onChange={(e) => setLines((current) => current.map((item) => item.id === line.id ? { ...item, description: e.target.value } : item))} required/></label><label><span>Menge</span><Input type="number" min="0.01" step="0.25" value={line.quantity} onChange={(e) => setLines((current) => current.map((item) => item.id === line.id ? { ...item, quantity: Number(e.target.value) } : item))}/></label><label><span>Einheit</span><Select value={line.unit} onChange={(e) => setLines((current) => current.map((item) => item.id === line.id ? { ...item, unit: e.target.value as ContractLine['unit'] } : item))}><option value="h">h</option><option value="Stk.">Stk.</option><option value="pauschal">pauschal</option></Select></label><label><span>Preis CHF</span><Input type="number" min="0" step="0.05" value={line.unitPrice} onChange={(e) => setLines((current) => current.map((item) => item.id === line.id ? { ...item, unitPrice: Number(e.target.value) } : item))}/></label></div>)}</div></div></details>
      <details className="edit-step"><summary><span><strong>3 · Notizen</strong><small>Interne Zusatzinformationen</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><label className="block-field"><span>Notiz</span><Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)}/></label></div></details>
    </StandardFormSheet>
  }

  function ContractEditor({ contract, onClose, onOrder, onInvoice }: { contract: Contract; onClose: () => void; onOrder: () => void; onInvoice: () => void }) {
    const [draft, setDraft] = useState(contract)
    const existingOrder = store.orders.find((order) => order.contractId === contract.id)
    function save(event: React.FormEvent) { event.preventDefault(); store.updateContract(contract.id, draft); onClose(); feedback.success('Vertrag wurde aktualisiert.') }
    return <StandardFormSheet open title={<>{contract.number}</>} description={<>{contract.customerName} · {contract.name}</>} onClose={onClose} onSubmit={save} formId="contract-edit" footer={<><button type="button" className="button secondary" onClick={onOrder}>{existingOrder ? 'Auftrag öffnen' : 'Auftrag erstellen'}</button><button type="button" className="button secondary" onClick={onInvoice} disabled={draft.status !== 'active' || draft.billingInterval === 'none'}>Nächste Rechnung erstellen</button><button type="submit" form="contract-edit" className="button primary">Speichern</button></>} mode="fullscreen"><div className="form-grid">
      <label className="full"><span>Vertragsname *</span><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required/></label>
      <label><span>Status</span><Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ContractStatus })}><option value="draft">Entwurf</option><option value="active">Aktiv</option><option value="paused">Pausiert</option><option value="ended">Beendet</option><option value="cancelled">Storniert</option></Select></label>
      <label><span>Abrechnung</span><Select value={draft.billingInterval} onChange={(e) => setDraft({ ...draft, billingInterval: e.target.value as BillingInterval })}><option value="none">Keine</option><option value="monthly">Monatlich</option><option value="quarterly">Quartalsweise</option><option value="yearly">Jährlich</option></Select></label>
      <label><span>Beginn</span><DatePicker value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}/></label>
      <label><span>Ende</span><DatePicker value={draft.endDate ?? ''} onChange={(e) => setDraft({ ...draft, endDate: e.target.value || undefined })}/></label>
      <label><span>Nächste Rechnung</span><DatePicker value={draft.nextInvoiceDate ?? ''} onChange={(e) => setDraft({ ...draft, nextInvoiceDate: e.target.value || undefined })}/></label>
      <label><span>Kündigungsfrist Tage</span><Input type="number" min="0" value={draft.noticeDays} onChange={(e) => setDraft({ ...draft, noticeDays: Number(e.target.value) })}/></label>
      <div className="form-toggle-field full"><span>Eigener Zeit-/Rapportprozess</span><Toggle label="Eigener Zeit- und Rapportprozess" checked={Boolean(draft.workflowOverride)} onChange={(value) => {
        const customer = store.customers.find((item) => item.id === draft.customerId)
        const inherited = { ...store.appSettings.workflow.customerProcess, ...(customer?.workflowOverride ?? {}) }
        setDraft({ ...draft, workflowOverride: value ? inherited : undefined })
      }}/></div>
      {draft.workflowOverride && <>
        <label className="full"><span>Führende Zeiterfassung</span><Select value={draft.workflowOverride.timeTrackingMode ?? store.appSettings.workflow.customerProcess.timeTrackingMode} onChange={(e) => setDraft({ ...draft, workflowOverride: { ...draft.workflowOverride, timeTrackingMode: e.target.value as 'internal' | 'external_customer_system' | 'both' } })}><option value="external_customer_system">Kundensystem</option><option value="internal">Binso Admin</option><option value="both">Kundensystem und Binso</option></Select></label>
        <div className="form-toggle-field full"><span>Monatsrapport erforderlich</span><Toggle label="Monatsrapport erforderlich" checked={draft.workflowOverride.monthlyReportRequired ?? true} onChange={(value) => setDraft({ ...draft, workflowOverride: { ...draft.workflowOverride, monthlyReportRequired: value } })}/></div>
        <div className="form-toggle-field full"><span>Unterschrift erforderlich</span><Toggle label="Unterschrift erforderlich" checked={draft.workflowOverride.customerSignatureRequired ?? true} onChange={(value) => setDraft({ ...draft, workflowOverride: { ...draft.workflowOverride, customerSignatureRequired: value } })}/></div>
        <div className="form-toggle-field full"><span>Kundenfreigabe erforderlich</span><Toggle label="Kundenfreigabe erforderlich" checked={draft.workflowOverride.customerApprovalRequired ?? true} onChange={(value) => setDraft({ ...draft, workflowOverride: { ...draft.workflowOverride, customerApprovalRequired: value } })}/></div>
        <div className="form-toggle-field full"><span>Fakturierung bis Rapportfreigabe sperren</span><Toggle label="Fakturierung bis Rapportfreigabe sperren" checked={draft.workflowOverride.blockBillingUntilReportApproved ?? true} onChange={(value) => setDraft({ ...draft, workflowOverride: { ...draft.workflowOverride, blockBillingUntilReportApproved: value } })}/></div>
        <div className="form-toggle-field full"><span>Auszahlung bis Rapportfreigabe sperren</span><Toggle label="Auszahlung bis Rapportfreigabe sperren" checked={draft.workflowOverride.blockPayoutUntilReportApproved ?? true} onChange={(value) => setDraft({ ...draft, workflowOverride: { ...draft.workflowOverride, blockPayoutUntilReportApproved: value } })}/></div>
      </>}
      <label className="full"><span>Notizen</span><Textarea rows={5} value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })}/></label>
    </div></StandardFormSheet>
  }
}

function fmt(value: string) { return formatDate(value) }
function nextBillingDate(contracts: Contract[]) { const values = contracts.filter((item) => item.status === 'active' && item.nextInvoiceDate).map((item) => item.nextInvoiceDate as string).sort(); return values[0] ? fmt(values[0]) : '–' }
