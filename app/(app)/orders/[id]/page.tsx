'use client'

import { Select, Input } from '@/components/ui/form-controls'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { PageHeader } from '@/components/ui/page-header'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { Toggle } from '@/components/ui/toggle'
import { useBusinessStore } from '@/components/state/business-store'
import { resolveTimeTrackingPolicy } from '@/modules/orders/policies'
import { createDefaultOrderPolicy } from '@/modules/orders/defaults'
import type { OrderPolicy } from '@/modules/orders/types'
import type { OrderAssignmentRule, ServiceProviderType } from '@/modules/workforce/types'
import type { EvidenceFrequency, TimeTrackingPolicy } from '@/modules/time/types'
import type { BillingModel, Expense, Order, OrderStatus } from '@/types/domain'
import { formatChf } from '@/lib/format/locale'

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const store = useBusinessStore()
  const order = store.orders.find((item) => item.id === params.id)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [assignmentOpen, setAssignmentOpen] = useState<OrderAssignmentRule | 'new' | null>(null)
  const [activeSection, setActiveSection] = useState<'overview' | 'time' | 'people' | 'billing' | 'evidence' | 'documents'>('overview')
  const [sectionOpen, setSectionOpen] = useState(false)

  if (!order) {
    return <section className="page apple-page"><div className="detail-back-row"><Link className="text-link" href="/orders">← Aufträge</Link></div><div className="empty-state"><strong>Auftrag nicht gefunden</strong><span>Der Auftrag ist nicht mehr vorhanden oder wurde noch nicht geladen.</span></div></section>
  }

  const editorOrder = order

  const policy = store.orderPolicies.find((item) => item.orderId === order.id)
  const assignments = store.orderAssignmentRules.filter((item) => item.orderId === order.id)
  const evidence = store.timeEvidence.filter((item) => item.orderId === order.id)
  const expenses = store.expenses.filter((item) => item.orderId === order.id)
  const sourceQuote = order.sourceQuoteId ? store.quotes.find((item) => item.id === order.sourceQuoteId) : undefined
  const linkedInvoices = store.invoices.filter((item) => item.orderId === order.id)

  return (
    <section className="page apple-page">
      <div className="detail-back-row"><Link className="text-link" href="/orders">← Aufträge</Link></div>
      <PageHeader
        eyebrow="AUFTRAG"
        title={order.name}
        description={`${order.customerName}${order.endCustomerName ? ` · Endkunde: ${order.endCustomerName}` : ''}`}
        action={
          <div className="page-action-group">
            <span className={`status ${order.status === 'active' ? 'active' : 'neutral'}`}>{order.status === 'active' ? 'Aktiv' : order.status === 'paused' ? 'Pausiert' : 'Abgeschlossen'}</span>
            <button className="button secondary" onClick={() => setEditOpen(true)}><Icon name="edit" size={15}/> Bearbeiten</button>
          </div>
        }
      />

      <div className="order-kpi-strip">
        <span><small>Budget</small><strong>{order.budgetHours} h</strong></span>
        <span><small>Verbraucht</small><strong>{order.usedHours} h</strong></span>
        <span><small>Rest</small><strong>{Math.max(0, order.budgetHours - order.usedHours)} h</strong></span>
      </div>

      <div className={sectionOpen ? 'object-hub-layout section-open' : 'object-hub-layout'}>
        <nav className="object-hub-nav" aria-label="Auftragsbereiche">
          <HubButton active={activeSection === 'overview'} label="Übersicht" meta={order.mandateRef || order.procurementRef || 'Stammdaten und Vertragskette'} onClick={() => { setActiveSection('overview'); setSectionOpen(true) } } />
          <HubButton active={activeSection === 'people'} label="Team" meta={`${assignments.length} zugewiesen`} onClick={() => { setActiveSection('people'); setSectionOpen(true) } } />
          <HubButton active={activeSection === 'time'} label="Zeiterfassung" meta={policy?.timeTracking.evidence.required ? `${frequencyLabel(policy.timeTracking.evidence.frequency)} · Nachweis Pflicht` : 'Auftragsregeln'} onClick={() => { setActiveSection('time'); setSectionOpen(true) } } />
          <HubButton active={activeSection === 'evidence'} label="Nachweise" meta={evidence.length ? `${evidence.filter((item) => item.status !== 'verified').length} offen` : 'Keine Nachweise'} onClick={() => { setActiveSection('evidence'); setSectionOpen(true) } } />
          <HubButton active={activeSection === 'billing'} label="Abrechnung" meta={`${billingLabel(order.billingModel)} · CHF ${order.salesRate}/h`} onClick={() => { setActiveSection('billing'); setSectionOpen(true) } } />
          <HubButton active={activeSection === 'documents'} label="Dokumente" meta="Auftragsbezogene Dokumente" onClick={() => { setActiveSection('documents'); setSectionOpen(true) } } />
        </nav>

        <div className="object-hub-content">
          <button type="button" className="object-hub-back" onClick={() => setSectionOpen(false)}>← Auftrag</button>
          {activeSection === 'overview' && <section className="hub-panel">
            <div className="section-title"><div><h2>Übersicht</h2><p>Die wichtigsten Auftrags- und Vertragsdaten.</p></div></div>
            <div className="summary-list">
              <SummaryRow label="Kunde" value={order.customerName} />
              <SummaryRow label="Endkunde" value={order.endCustomerName || '–'} />
              <SummaryRow label="Mandatsreferenz" value={order.mandateRef || '–'} />
              <SummaryRow label="Beschaffungsreferenz" value={order.procurementRef || '–'} />
              <SummaryRow label="Abrechnungsmodell" value={billingLabel(order.billingModel)} />
            </div>
            {policy?.contractChain && <details className="hub-disclosure"><summary><span><strong>Vertrags- und Leistungskette</strong><small>{policy.contractChain.parties.length} Parteien</small></span><Icon name="chevron" size={15}/></summary><div className="chain-list compact-chain">{policy.contractChain.parties.map((party, index) => <div key={party.id} className="chain-item"><span className="chain-index">{String(index + 1).padStart(2, '0')}</span><span className="primary-cell"><strong>{party.name}</strong><small>{party.role.replaceAll('_', ' ')}</small></span></div>)}</div></details>}
          </section>}

          {activeSection === 'time' && <section className="hub-panel">
            <div className="section-title"><div><h2>Zeiterfassung</h2><p>Nur die aktiven Regeln dieses Auftrags.</p></div><button className="button secondary compact-action" onClick={() => setPolicyOpen(true)}><Icon name="edit" size={15}/> Regeln</button></div>
            {policy ? <div className="summary-list"><SummaryRow label="Erfassung" value={modeLabel(policy.timeTracking.mode)} /><SummaryRow label="Rundung" value={`${policy.timeTracking.bookingIntervalMinutes} Minuten`} /><SummaryRow label="Beschreibung" value={policy.timeTracking.requireDescription ? 'Pflicht' : 'Optional'} /><SummaryRow label="Nachweis" value={policy.timeTracking.evidence.required ? `${frequencyLabel(policy.timeTracking.evidence.frequency)} · Pflicht` : 'Nicht erforderlich'} /><SummaryRow label="Freigabe" value={policy.timeTracking.evidence.blockApprovalWhenMissing ? 'Nachweis muss vorhanden sein' : 'Ohne Nachweis möglich'} /><SummaryRow label="Fakturierung" value={policy.timeTracking.evidence.blockBillingWhenMissing ? 'Bei fehlendem Nachweis gesperrt' : 'Nicht blockiert'} /></div> : <div className="empty-state"><strong>Standardregeln aktiv</strong><span>Für diesen Auftrag sind keine zusätzlichen Zeitregeln definiert.</span></div>}
          </section>}

          {activeSection === 'people' && <section className="hub-panel">
            <div className="section-title"><div><h2>Team</h2><p>Zugewiesene Mitarbeitende und externe Leistungserbringer.</p></div><button className="button secondary compact-action" onClick={() => setAssignmentOpen('new')}><Icon name="plus" size={15}/> Zuweisen</button></div>
            {assignments.length ? <div className="hub-row-list">{assignments.map((assignment) => { const effective = policy ? resolveTimeTrackingPolicy(policy, assignment) : assignment.timePolicyOverride as TimeTrackingPolicy | undefined; const sales = assignment.salesRate ?? order.salesRate; const cost = assignment.internalCostRate ?? order.costRate; return <InteractiveRow className="hub-row interactive-hub-row" key={`${assignment.orderId}-${assignment.personId}`} onActivate={() => setAssignmentOpen(assignment)} ariaLabel={`${personName(assignment.personId, store)} Regel bearbeiten`}><span><strong>{personName(assignment.personId, store)}</strong><small>{providerLabel(assignment.providerType)} · Verkauf CHF {sales.toFixed(2)}/h · Kosten CHF {cost.toFixed(2)}/h · {effective?.evidence.required ? `${frequencyLabel(effective.evidence.frequency)} Rapport` : 'kein Rapport'}</small></span><Icon name="chevron" size={15}/></InteractiveRow>})}</div> : <div className="empty-state"><strong>Noch niemand zugewiesen</strong><span>Füge Mitarbeitende oder externe Leistungserbringer hinzu.</span></div>}
          </section>}

          {activeSection === 'billing' && <section className="hub-panel">
            <div className="section-title"><div><h2>Abrechnung</h2><p>Zeiten, Spesen, Material und Rechnungsregeln dieses Auftrags.</p></div><button className="button secondary compact-action" onClick={() => setExpenseOpen(true)}><Icon name="plus" size={15}/> Spesen / Material</button></div>
            {policy ? <div className="summary-list"><SummaryRow label="Modell" value={billingLabel(policy.billing.model as BillingModel)} /><SummaryRow label="Rechnungsdarstellung" value={policy.billing.invoiceGrouping} /><SummaryRow label="Stundenauszug" value={policy.billing.attachTimesheet ? 'Anhängen' : 'Nicht anhängen'} /><SummaryRow label="PO / Bestellnummer" value={policy.billing.purchaseOrderRequired ? 'Pflicht' : 'Optional'} /><SummaryRow label="Leistungsperiode" value={policy.billing.servicePeriodRequired ? 'Pflicht' : 'Optional'} /><SummaryRow label="Freigabe ab" value={policy.approval.invoiceApprovalThreshold ? formatChf(policy.approval.invoiceApprovalThreshold, { maximumFractionDigits: 0 }) : 'Keine Schwelle'} /></div> : <div className="summary-list"><SummaryRow label="Modell" value={billingLabel(order.billingModel)}/><SummaryRow label="Verkaufssatz" value={`CHF ${order.salesRate}/h`}/><SummaryRow label="Budget" value={`${order.budgetHours} h`}/></div>}
            <div className="section-title sub-section-title"><div><h2>Spesen und Material</h2><p>{expenses.filter((item) => item.billable && !item.invoicedInvoiceId).length} noch nicht verrechenbar zugeordnet</p></div></div>
            <div className="hub-row-list">{expenses.length ? expenses.map((expense) => <div className="hub-row" key={expense.id}><span><strong>{expense.description}</strong><small>{expense.date} · {expense.category === 'material' ? 'Material' : expense.category === 'travel' ? 'Reisekosten' : expense.category === 'expense' ? 'Spesen' : 'Sonstiges'}</small></span><span>{expense.quantity} × CHF {expense.unitPrice.toFixed(2)}</span><span className={`status ${expense.invoicedInvoiceId ? 'neutral' : 'active'}`}>{expense.invoicedInvoiceId ? 'Verrechnet' : expense.billable ? 'Bereit' : 'Intern'}</span></div>) : <div className="empty-state"><strong>Keine Spesen oder Materialpositionen</strong><span>Positionen können direkt diesem Auftrag zugeordnet werden.</span></div>}</div>
            <div className="hub-inline-action"><Link href={`/invoices?new=1&customer=${order.customerId}&order=${order.id}`} className="text-link">Rechnung erstellen <Icon name="chevron" size={14}/></Link></div>
          </section>}

          {activeSection === 'evidence' && <section className="hub-panel">
            <div className="section-title"><div><h2>Nachweise</h2><p>Rapporte und Freigaben für diesen Auftrag.</p></div><button className="button secondary compact-action" onClick={() => setUploadOpen(true)}><Icon name="plus" size={15}/> Rapport</button></div>
            <div className="hub-row-list">{evidence.length ? evidence.map((item) => <div className="hub-row evidence-hub-row" key={item.id}><span><strong>{item.fileName}</strong><small>{item.periodDate} · {personName(item.personId, store)}</small></span><span className={`status ${item.status === 'verified' ? 'active' : 'neutral'}`}>{evidenceLabel(item.status)}</span>{item.status !== 'verified' && <button className="text-button" onClick={() => store.updateEvidence(item.id, { status: 'verified', verifiedAt: new Date().toISOString() })}>Prüfen</button>}</div>) : <div className="empty-state"><strong>Keine Nachweise vorhanden</strong><span>Für diesen Auftrag wurden noch keine Rapporte hochgeladen.</span></div>}</div>
          </section>}

          {activeSection === 'documents' && <section className="hub-panel">
            <div className="section-title"><div><h2>Dokumente</h2><p>Direkt mit diesem Auftrag verknüpfte Angebote und Rechnungen.</p></div></div>
            <div className="hub-row-list">
              {sourceQuote && <Link className="hub-row" href={`/quotes?view=${sourceQuote.id}`}><span><strong>{sourceQuote.number}</strong><small>Angebot · Version {sourceQuote.version}</small></span><Icon name="chevron" size={15}/></Link>}
              {linkedInvoices.map((invoice) => <Link className="hub-row" href={`/invoices?view=${invoice.id}`} key={invoice.id}><span><strong>{invoice.number}</strong><small>Rechnung · {invoice.period}</small></span><Icon name="chevron" size={15}/></Link>)}
              {!sourceQuote && !linkedInvoices.length && <div className="empty-state"><strong>Keine verknüpften Dokumente</strong><span>Angebote und Rechnungen erscheinen hier, sobald sie diesem Auftrag zugeordnet sind.</span></div>}
            </div>
          </section>}
        </div>
      </div>

      {editOpen && <OrderEditor order={order} onClose={() => setEditOpen(false)} />}
      {uploadOpen && <EvidenceUpload orderId={order.id} onClose={() => setUploadOpen(false)} />}
      {expenseOpen && <ExpenseForm order={order} onClose={() => setExpenseOpen(false)} />}
      {policyOpen && <PolicyEditor orderId={order.id} current={policy ?? createDefaultOrderPolicy(order.id, order.billingModel, { ...store.appSettings.workflow.customerProcess, ...(store.customers.find((customer) => customer.id === order.customerId)?.workflowOverride ?? {}) })} onClose={() => setPolicyOpen(false)} />}
      {assignmentOpen && <AssignmentEditor orderId={order.id} current={assignmentOpen === 'new' ? null : assignmentOpen} onClose={() => setAssignmentOpen(null)} />}
    </section>
  )

  function OrderEditor({ order, onClose }: { order: Order; onClose: () => void }) {
    const [draft, setDraft] = useState(order)
    function save(event: React.FormEvent) { event.preventDefault(); store.updateOrder(order.id, draft); onClose() }
    return <StandardFormSheet open title={<>Auftrag bearbeiten</>} description={<>Stammdaten, Budget und Status.</>} onClose={onClose} onSubmit={save} formId="id-page-sheet-1" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="id-page-sheet-1" className="button primary">Speichern</button></>}><div className="form-grid"><label className="full"><span>Auftragsname *</span><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required/></label><label><span>Mandats-/Vertragsreferenz</span><Input value={draft.mandateRef ?? ''} onChange={(e) => setDraft({ ...draft, mandateRef: e.target.value })}/></label><label><span>Beschaffungsreferenz</span><Input value={draft.procurementRef ?? ''} onChange={(e) => setDraft({ ...draft, procurementRef: e.target.value })}/></label><label><span>Endkunde</span><Input value={draft.endCustomerName ?? ''} onChange={(e) => setDraft({ ...draft, endCustomerName: e.target.value })}/></label><label><span>Generalunternehmer</span><Input value={draft.primeContractorName ?? ''} onChange={(e) => setDraft({ ...draft, primeContractorName: e.target.value })}/></label><label><span>Budget Stunden</span><Input type="number" min="0" step="0.25" value={draft.budgetHours} onChange={(e) => setDraft({ ...draft, budgetHours: Number(e.target.value) })}/></label><label><span>Verkaufssatz CHF/h</span><Input type="number" min="0" step="0.05" value={draft.salesRate} onChange={(e) => setDraft({ ...draft, salesRate: Number(e.target.value) })}/></label><label><span>Kostensatz CHF/h</span><Input type="number" min="0" step="0.05" value={draft.costRate} onChange={(e) => setDraft({ ...draft, costRate: Number(e.target.value) })}/></label><label><span>Abrechnungsmodell</span><Select value={draft.billingModel} onChange={(e) => setDraft({ ...draft, billingModel: e.target.value as BillingModel })}><option value="time">Nach Aufwand</option><option value="fixed">Pauschal</option><option value="retainer">Retainer</option><option value="milestone">Meilenstein</option><option value="mixed">Gemischt</option></Select></label><label><span>Status</span><Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as OrderStatus })}><option value="active">Aktiv</option><option value="paused">Pausiert</option><option value="completed">Abgeschlossen</option></Select></label></div></StandardFormSheet>
  }

  function EvidenceUpload({ orderId, onClose }: { orderId: string; onClose: () => void }) {
    const orderEntries = store.timeEntries.filter((entry) => entry.orderId === orderId)
    const assignmentPeople = store.orderAssignmentRules.filter((item) => item.orderId === orderId && item.active)
    const defaultPersonId = assignmentPeople[0]?.personId ?? orderEntries[0]?.personId ?? ''
    const [personId, setPersonId] = useState(defaultPersonId)
    const personEntries = orderEntries.filter((entry) => entry.personId === personId)
    const effective = policy && personId
      ? resolveTimeTrackingPolicy(policy, assignments.find((item) => item.personId === personId))
      : policy?.timeTracking
    const monthly = effective?.evidence.frequency === 'monthly'
    const [periodMonth, setPeriodMonth] = useState(new Date().toISOString().slice(0, 7))
    const [timeEntryId, setTimeEntryId] = useState(personEntries[0]?.id ?? '')
    const [file, setFile] = useState<File | null>(null)
    const [signed, setSigned] = useState(effective?.evidence.signatureRequired ?? true)
    const [customerApproved, setCustomerApproved] = useState(effective?.evidence.customerApprovalRequired ?? true)
    const selectedEntry = personEntries.find((entry) => entry.id === timeEntryId)

    function save(event: React.FormEvent) {
      event.preventDefault()
      if (!file || !personId) return
      if (!monthly && !selectedEntry) return
      const periodDate = monthly ? `${periodMonth}-01` : selectedEntry!.date
      const duplicate = store.timeEvidence.some((item) => item.orderId === orderId && item.personId === personId && (monthly ? item.periodDate.slice(0, 7) === periodMonth : item.timeEntryId === selectedEntry!.id))
      if (duplicate) return
      store.addEvidence({
        id: `evi-${Date.now()}`,
        timeEntryId: monthly ? undefined : selectedEntry!.id,
        orderId,
        personId,
        periodDate,
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        status: 'uploaded',
        signed,
        customerApproved,
        uploadedAt: new Date().toISOString(),
      })
      onClose()
    }

    const people = assignmentPeople.map((assignment) => ({ id: assignment.personId, name: personName(assignment.personId, store) }))
    return <StandardFormSheet open title={<>{monthly ? 'Monatsrapport hochladen' : 'Zeitnachweis hochladen'}</>} description={<>{monthly ? 'Unterschriebenen Kundenrapport dem Leistungserbringer und Monat zuordnen.' : 'Nachweis dem Zeiteintrag zuordnen.'}</>} onClose={onClose} onSubmit={save} formId="id-page-sheet-2" footer={(people.length || orderEntries.length) ? <><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="id-page-sheet-2" className="button primary">{monthly ? 'Monatsrapport speichern' : 'Nachweis speichern'}</button></> : null}>
      {(people.length || orderEntries.length) ? <div className="form-grid">
        <label className="full"><span>Leistungserbringer *</span><Select value={personId} onChange={(e) => { setPersonId(e.target.value); const first = orderEntries.find((entry) => entry.personId === e.target.value); setTimeEntryId(first?.id ?? '') }} required>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</Select></label>
        {monthly ? <label><span>Monat *</span><Input type="month" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} required/></label> : <label className="full"><span>Zeiteintrag *</span><Select value={timeEntryId} onChange={(e) => setTimeEntryId(e.target.value)} required>{personEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.date} · {entry.hours} h</option>)}</Select></label>}
        <label className="full"><span>PDF-Nachweis *</span><Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required/></label>
        <div className="form-toggle-field"><span>Unterschrieben</span><Toggle label="Unterschrieben" checked={signed} onChange={setSigned}/></div>
        <div className="form-toggle-field"><span>Vom Kunden freigegeben</span><Toggle label="Vom Kunden freigegeben" checked={customerApproved} onChange={setCustomerApproved}/></div>
      </div> : <div className="empty-state"><strong>Keine Zuweisung vorhanden</strong><span>Weise zuerst einen Mitarbeitenden oder externen Leistungserbringer zu.</span></div>}
    </StandardFormSheet>
  }

  function ExpenseForm({ order, onClose }: { order: Order; onClose: () => void }) {
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState<Expense['category']>('expense')
    const [quantity, setQuantity] = useState(1)
    const [unitPrice, setUnitPrice] = useState(0)
    const [billable, setBillable] = useState(true)
    function save(event: React.FormEvent) {
      event.preventDefault()
      if (!description.trim() || quantity <= 0 || unitPrice < 0) return
      store.addExpense({ id: `exp-${Date.now()}`, customerId: order.customerId, customerName: order.customerName, orderId: order.id, orderName: order.name, date: new Date().toISOString().slice(0, 10), description: description.trim(), category, quantity, unitPrice, billable })
      onClose()
    }
    return <StandardFormSheet open title={<>Spesen oder Material erfassen</>} description={<>{order.name} · kann direkt in die nächste Rechnung übernommen werden.</>} onClose={onClose} onSubmit={save} formId="expense-form" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="expense-form" className="button primary">Speichern</button></>}><div className="form-grid"><label className="full"><span>Beschreibung *</span><Input value={description} onChange={(e) => setDescription(e.target.value)} required/></label><label><span>Typ</span><Select value={category} onChange={(e) => setCategory(e.target.value as Expense['category'])}><option value="expense">Spesen</option><option value="material">Material</option><option value="travel">Reisekosten</option><option value="other">Sonstiges</option></Select></label><label><span>Menge</span><Input type="number" min="0.01" step="0.25" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}/></label><label><span>Preis CHF</span><Input type="number" min="0" step="0.05" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))}/></label><div className="form-toggle-field"><span>Dem Kunden verrechnen</span><Toggle label="Dem Kunden verrechnen" checked={billable} onChange={setBillable}/></div></div></StandardFormSheet>
  }

  function PolicyEditor({ orderId, current, onClose }: { orderId: string; current: OrderPolicy; onClose: () => void }) {
    const [draft, setDraft] = useState(current)
    const evidence = draft.timeTracking.evidence
    const setTime = (changes: Partial<TimeTrackingPolicy>) => setDraft((value) => ({ ...value, timeTracking: { ...value.timeTracking, ...changes } }))
    const setEvidence = (changes: Partial<TimeTrackingPolicy['evidence']>) => setDraft((value) => ({ ...value, timeTracking: { ...value.timeTracking, evidence: { ...value.timeTracking.evidence, ...changes } } }))
    function save(event: React.FormEvent) { event.preventDefault(); store.updateOrderPolicy(orderId, draft); onClose() }
    return <StandardFormSheet open title={<>Auftragsregeln</>} description={<>Nur den Bereich öffnen, den du anpassen möchtest.</>} onClose={onClose} onSubmit={save} formId="id-page-sheet-3" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="id-page-sheet-3" className="button primary">Regeln speichern</button></>} mode="fullscreen"><div className="policy-groups"><details className="policy-group" open><summary><span><strong>Zeiterfassung</strong><small>System, Rundung und Buchungsregeln</small></span><Icon name="chevron" size={15}/></summary><div className="policy-group-body"><div className="form-grid"><label><span>Zeiterfassung</span><Select value={draft.timeTracking.mode} onChange={(e) => setTime({ mode: e.target.value as TimeTrackingPolicy['mode'] })}><option value="internal">Nur Binso Admin</option><option value="external_customer_system">Nur Kundensystem</option><option value="both">Binso + Kundensystem</option></Select></label><label><span>Rundung</span><Select value={draft.timeTracking.bookingIntervalMinutes} onChange={(e) => setTime({ bookingIntervalMinutes: Number(e.target.value) as 1|5|15|30 })}><option value="1">1 Minute</option><option value="5">5 Minuten</option><option value="15">15 Minuten</option><option value="30">30 Minuten</option></Select></label><label><span>Rückwirkend buchbar</span><Input type="number" min="0" value={draft.timeTracking.allowRetroactiveDays} onChange={(e) => setTime({ allowRetroactiveDays: Number(e.target.value) })}/></label></div><div className="policy-toggle-list"><ToggleRow label="Beschreibung Pflicht" checked={draft.timeTracking.requireDescription} onChange={(v) => setTime({ requireDescription: v })}/></div></div></details><details className="policy-group"><summary><span><strong>Nachweise</strong><small>{evidence.required ? `${frequencyLabel(evidence.frequency)} · erforderlich` : 'Nicht erforderlich'}</small></span><Icon name="chevron" size={15}/></summary><div className="policy-group-body"><div className="form-grid"><label><span>Nachweisrhythmus</span><Select value={evidence.frequency} onChange={(e) => setEvidence({ frequency: e.target.value as EvidenceFrequency })}><option value="none">Keiner</option><option value="daily">Täglich</option><option value="weekly">Wöchentlich</option><option value="monthly">Monatlich</option></Select></label></div><div className="policy-toggle-list"><ToggleRow label="Nachweis erforderlich" checked={evidence.required} onChange={(v) => setEvidence({ required: v, frequency: v && evidence.frequency === 'none' ? 'daily' : evidence.frequency })}/><ToggleRow label="Unterschrift erforderlich" checked={evidence.signatureRequired} onChange={(v) => setEvidence({ signatureRequired: v })}/><ToggleRow label="Kundenfreigabe erforderlich" checked={evidence.customerApprovalRequired} onChange={(v) => setEvidence({ customerApprovalRequired: v })}/><ToggleRow label="Freigabe ohne Nachweis blockieren" checked={evidence.blockApprovalWhenMissing} onChange={(v) => setEvidence({ blockApprovalWhenMissing: v })}/><ToggleRow label="Fakturierung ohne Nachweis blockieren" checked={evidence.blockBillingWhenMissing} onChange={(v) => setEvidence({ blockBillingWhenMissing: v })}/><ToggleRow label="Nachweis-Erinnerung" checked={evidence.reminderEnabled} onChange={(v) => setEvidence({ reminderEnabled: v })}/></div></div></details><details className="policy-group"><summary><span><strong>Abrechnung</strong><small>Rechnungs- und Pflichtangaben</small></span><Icon name="chevron" size={15}/></summary><div className="policy-group-body"><div className="policy-toggle-list"><ToggleRow label="Stundenauszug an Rechnung" checked={draft.billing.attachTimesheet} onChange={(v) => setDraft((d) => ({ ...d, billing: { ...d.billing, attachTimesheet: v } }))}/><ToggleRow label="PO / Bestellnummer Pflicht" checked={draft.billing.purchaseOrderRequired} onChange={(v) => setDraft((d) => ({ ...d, billing: { ...d.billing, purchaseOrderRequired: v } }))}/><ToggleRow label="Leistungsperiode Pflicht" checked={draft.billing.servicePeriodRequired} onChange={(v) => setDraft((d) => ({ ...d, billing: { ...d.billing, servicePeriodRequired: v } }))}/></div></div></details></div></StandardFormSheet>
  }

  function AssignmentEditor({ orderId, current, onClose }: { orderId: string; current: OrderAssignmentRule | null; onClose: () => void }) {
    const choices = [
      ...store.employees.map((employee) => ({ id: employee.id, name: employee.name, providerType: (employee.employmentType === 'hourly' ? 'employee_hourly' : 'employee_salary') as ServiceProviderType })),
      ...store.suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name, providerType: 'external_company' as ServiceProviderType })),
    ]
    const initial = current?.personId ?? choices[0]?.id ?? ''
    const [personId, setPersonId] = useState(initial)
    const selectedChoice = choices.find((item) => item.id === personId)
    const providerType = current?.providerType ?? selectedChoice?.providerType ?? 'employee_salary'
    const customer = store.customers.find((item) => item.id === editorOrder.customerId)
    const customerProcess = { ...store.appSettings.workflow.customerProcess, ...(customer?.workflowOverride ?? {}) }
    const providerSettlementDefault = providerType === 'external_company' || providerType === 'external_individual'
      ? store.appSettings.workflow.supplierSettlement
      : providerType === 'employee_hourly'
        ? { ...store.appSettings.workflow.employeeSettlement, ...(store.employees.find((item) => item.id === personId)?.settlementOverride ?? {}) }
        : { mode: 'salary' as const, requireApprovedMonthlyReport: false, requireSupplierInvoice: false, requireFinanceApproval: true }

    const [active, setActive] = useState(current?.active ?? true)
    const [salesRate, setSalesRate] = useState(current?.salesRate ?? editorOrder.salesRate)
    const [internalCostRate, setInternalCostRate] = useState(current?.internalCostRate ?? (store.employees.find((item) => item.id === personId)?.internalCostRate ?? editorOrder.costRate))
    const [overrideEnabled, setOverrideEnabled] = useState(Boolean(current?.timePolicyOverride))
    const [evidenceRequired, setEvidenceRequired] = useState(current?.timePolicyOverride?.evidence?.required ?? customerProcess.monthlyReportRequired)
    const [frequency, setFrequency] = useState<EvidenceFrequency>(current?.timePolicyOverride?.evidence?.frequency ?? (customerProcess.monthlyReportRequired ? 'monthly' : 'none'))
    const [signatureRequired, setSignatureRequired] = useState(current?.timePolicyOverride?.evidence?.signatureRequired ?? customerProcess.customerSignatureRequired)
    const [customerApprovalRequired, setCustomerApprovalRequired] = useState(current?.timePolicyOverride?.evidence?.customerApprovalRequired ?? customerProcess.customerApprovalRequired)
    const [settlementOverrideEnabled, setSettlementOverrideEnabled] = useState(Boolean(current?.settlementOverride))
    const [requireApprovedReportForPayout, setRequireApprovedReportForPayout] = useState(current?.settlementOverride?.requireApprovedMonthlyReport ?? providerSettlementDefault.requireApprovedMonthlyReport)
    const [requireSupplierInvoice, setRequireSupplierInvoice] = useState(current?.settlementOverride?.requireSupplierInvoice ?? providerSettlementDefault.requireSupplierInvoice)
    const [requireFinanceApproval, setRequireFinanceApproval] = useState(current?.settlementOverride?.requireFinanceApproval ?? providerSettlementDefault.requireFinanceApproval)

    function save(event: React.FormEvent) {
      event.preventDefault()
      const override: OrderAssignmentRule['timePolicyOverride'] = overrideEnabled ? {
        evidence: {
          required: evidenceRequired,
          frequency: evidenceRequired ? frequency : 'none',
          formats: evidenceRequired ? ['pdf'] : [],
          signatureRequired,
          customerApprovalRequired,
          blockApprovalWhenMissing: false,
          blockBillingWhenMissing: evidenceRequired && customerProcess.blockBillingUntilReportApproved,
          reminderEnabled: evidenceRequired,
        },
      } : undefined
      const settlementOverride: OrderAssignmentRule['settlementOverride'] = settlementOverrideEnabled ? {
        mode: providerType === 'external_company' || providerType === 'external_individual' ? 'supplier_invoice' : providerType === 'employee_hourly' ? 'hourly_payroll' : 'salary',
        requireApprovedMonthlyReport: requireApprovedReportForPayout,
        requireSupplierInvoice: providerType === 'external_company' || providerType === 'external_individual' ? requireSupplierInvoice : false,
        requireFinanceApproval,
      } : undefined
      store.updateOrderAssignmentRule({ orderId, personId, providerType, active, salesRate, internalCostRate, timePolicyOverride: override, settlementOverride })
      onClose()
    }

    return <StandardFormSheet open title={<>{current ? 'Zuweisung bearbeiten' : 'Leistungserbringer zuweisen'}</>} description={<>Konditionen, Rapport und Auszahlung für diesen Auftrag festlegen.</>} onClose={onClose} onSubmit={save} formId="id-page-sheet-4" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="id-page-sheet-4" className="button primary">Speichern</button></>}>
      <div className="form-grid">
        <label className="full"><span>Person / Firma *</span><Select value={personId} disabled={Boolean(current)} onChange={(e) => setPersonId(e.target.value)} required>{choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</Select></label>
        <label><span>Verkaufssatz CHF/h</span><Input type="number" min="0" step="0.05" value={salesRate} onChange={(e) => setSalesRate(Number(e.target.value))}/></label>
        <label><span>Kosten / Einkauf CHF/h</span><Input type="number" min="0" step="0.05" value={internalCostRate} onChange={(e) => setInternalCostRate(Number(e.target.value))}/></label>
      </div>
      <div className="policy-toggle-list">
        <ToggleRow label="Zuweisung aktiv" checked={active} onChange={setActive}/>
        <ToggleRow label="Eigene Rapportregel" checked={overrideEnabled} onChange={setOverrideEnabled}/>
        {overrideEnabled && <>
          <ToggleRow label="Nachweis erforderlich" checked={evidenceRequired} onChange={setEvidenceRequired}/>
          {evidenceRequired && <div className="form-grid"><label><span>Rhythmus</span><Select value={frequency} onChange={(e) => setFrequency(e.target.value as EvidenceFrequency)}><option value="daily">Täglich</option><option value="weekly">Wöchentlich</option><option value="monthly">Monatlich</option></Select></label></div>}
          <ToggleRow label="Unterschrift erforderlich" checked={signatureRequired} onChange={setSignatureRequired}/>
          <ToggleRow label="Kundenfreigabe erforderlich" checked={customerApprovalRequired} onChange={setCustomerApprovalRequired}/>
        </>}
        <ToggleRow label="Eigene Auszahlungsregel" checked={settlementOverrideEnabled} onChange={setSettlementOverrideEnabled}/>
        {settlementOverrideEnabled && <>
          <ToggleRow label="Freigegebener Monatsrapport vor Auszahlung" checked={requireApprovedReportForPayout} onChange={setRequireApprovedReportForPayout}/>
          {(providerType === 'external_company' || providerType === 'external_individual') && <ToggleRow label="Lieferantenrechnung erforderlich" checked={requireSupplierInvoice} onChange={setRequireSupplierInvoice}/>}
          <ToggleRow label="Buchhaltungsfreigabe erforderlich" checked={requireFinanceApproval} onChange={setRequireFinanceApproval}/>
        </>}
      </div>
    </StandardFormSheet>
  }
}

function personName(id: string, store: ReturnType<typeof useBusinessStore>) { return store.employees.find((item) => item.id === id)?.name ?? store.suppliers.find((item) => item.id === id)?.name ?? store.timeEntries.find((item) => item.personId === id)?.personName ?? id }
function providerLabel(value: ServiceProviderType) { const labels: Record<ServiceProviderType,string> = { employee_salary: 'Festlohn', employee_hourly: 'Stundenlohn', external_individual: 'Externe Person', external_company: 'Externe Firma' }; return labels[value] }
function modeLabel(value: TimeTrackingPolicy['mode']) { return value === 'both' ? 'Binso + Kundensystem' : value === 'internal' ? 'Binso Admin' : 'Kundensystem' }
function frequencyLabel(value: EvidenceFrequency) { return value === 'daily' ? 'Täglich' : value === 'weekly' ? 'Wöchentlich' : value === 'monthly' ? 'Monatlich' : 'Keiner' }
function evidenceLabel(value: string) { const labels: Record<string,string> = { uploaded:'Hochgeladen', verified:'Geprüft', rejected:'Abgelehnt', missing:'Fehlt', not_required:'Nicht erforderlich' }; return labels[value] ?? value }
function HubButton({ active, label, meta, onClick }: { active:boolean; label:string; meta:string; onClick:()=>void }) { return <button type="button" className={active ? 'hub-row active' : 'hub-row'} onClick={onClick}><span><strong>{label}</strong><small>{meta}</small></span><Icon name="chevron" size={15}/></button> }
function SummaryRow({ label, value }: { label:string; value:string }) { return <div className="summary-row"><span>{label}</span><strong>{value}</strong></div> }
function ToggleRow({ label, checked, onChange }: { label:string; checked:boolean; onChange:(value:boolean)=>void }) { return <div className="policy-toggle-row"><span>{label}</span><Toggle label={label} checked={checked} onChange={onChange}/></div> }

function billingLabel(value: BillingModel | 'retainer' | 'milestone') { return value === 'time' ? 'Nach Aufwand' : value === 'fixed' ? 'Pauschal' : value === 'retainer' ? 'Retainer' : value === 'milestone' ? 'Meilenstein' : 'Gemischt' }
