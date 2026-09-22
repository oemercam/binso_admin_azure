'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { CloseButton } from '@/components/ui/close-button'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { Toggle } from '@/components/ui/toggle'
import { useBusinessStore } from '@/components/state/business-store'
import { resolveTimeTrackingPolicy } from '@/modules/orders/policies'
import { createDefaultOrderPolicy } from '@/modules/orders/defaults'
import type { OrderPolicy } from '@/modules/orders/types'
import type { OrderAssignmentRule, ServiceProviderType } from '@/modules/workforce/types'
import type { EvidenceFrequency, TimeTrackingPolicy } from '@/modules/time/types'
import type { BillingModel, Order, OrderStatus } from '@/types/domain'

function yesNo(value: boolean) { return value ? 'Aktiv' : 'Nicht aktiv' }

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const store = useBusinessStore()
  const order = store.orders.find((item) => item.id === params.id)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  const [assignmentOpen, setAssignmentOpen] = useState<OrderAssignmentRule | 'new' | null>(null)
  const [activeSection, setActiveSection] = useState<'overview' | 'time' | 'people' | 'billing' | 'evidence' | 'documents'>('overview')
  const [sectionOpen, setSectionOpen] = useState(false)

  if (!order) {
    return <section className="page"><div className="detail-back-row"><Link className="text-link" href="/orders">← Aufträge</Link></div><div className="empty-state"><strong>Auftrag nicht gefunden</strong><span>Der Auftrag ist nicht mehr vorhanden oder wurde noch nicht geladen.</span></div></section>
  }

  const policy = store.orderPolicies.find((item) => item.orderId === order.id)
  const assignments = store.orderAssignmentRules.filter((item) => item.orderId === order.id)
  const evidence = store.timeEvidence.filter((item) => item.orderId === order.id)

  return (
    <section className="page">
      <div className="detail-back-row"><Link className="text-link" href="/orders">← Aufträge</Link></div>
      <div className="page-title"><div><p className="eyebrow">AUFTRAG</p><h1>{order.name}</h1><p className="page-description">{order.customerName}{order.endCustomerName ? ` · Endkunde: ${order.endCustomerName}` : ''}</p></div><div className="page-action-group"><span className={`status ${order.status === 'active' ? 'active' : 'neutral'}`}>{order.status === 'active' ? 'Aktiv' : order.status === 'paused' ? 'Pausiert' : 'Abgeschlossen'}</span><button className="button secondary" onClick={() => setEditOpen(true)}><Icon name="edit" size={15}/> Bearbeiten</button></div></div>

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
          <HubButton active={activeSection === 'billing'} label="Abrechnung" meta={`${order.billingModel === 'time' ? 'Nach Aufwand' : order.billingModel === 'fixed' ? 'Pauschal' : 'Gemischt'} · CHF ${order.salesRate}/h`} onClick={() => { setActiveSection('billing'); setSectionOpen(true) } } />
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
              <SummaryRow label="Abrechnungsmodell" value={order.billingModel === 'time' ? 'Nach Aufwand' : order.billingModel === 'fixed' ? 'Pauschal' : 'Gemischt'} />
            </div>
            {policy?.contractChain && <details className="hub-disclosure"><summary><span><strong>Vertrags- und Leistungskette</strong><small>{policy.contractChain.parties.length} Parteien</small></span><Icon name="chevron" size={15}/></summary><div className="chain-list compact-chain">{policy.contractChain.parties.map((party, index) => <div key={party.id} className="chain-item"><span className="chain-index">{String(index + 1).padStart(2, '0')}</span><span className="primary-cell"><strong>{party.name}</strong><small>{party.role.replaceAll('_', ' ')}</small></span></div>)}</div></details>}
          </section>}

          {activeSection === 'time' && <section className="hub-panel">
            <div className="section-title"><div><h2>Zeiterfassung</h2><p>Nur die aktiven Regeln dieses Auftrags.</p></div><button className="button secondary compact-action" onClick={() => setPolicyOpen(true)}><Icon name="edit" size={15}/> Regeln</button></div>
            {policy ? <div className="summary-list"><SummaryRow label="Erfassung" value={modeLabel(policy.timeTracking.mode)} /><SummaryRow label="Rundung" value={`${policy.timeTracking.bookingIntervalMinutes} Minuten`} /><SummaryRow label="Beschreibung" value={policy.timeTracking.requireDescription ? 'Pflicht' : 'Optional'} /><SummaryRow label="Nachweis" value={policy.timeTracking.evidence.required ? `${frequencyLabel(policy.timeTracking.evidence.frequency)} · Pflicht` : 'Nicht erforderlich'} /><SummaryRow label="Freigabe" value={policy.timeTracking.evidence.blockApprovalWhenMissing ? 'Nachweis muss vorhanden sein' : 'Ohne Nachweis möglich'} /><SummaryRow label="Fakturierung" value={policy.timeTracking.evidence.blockBillingWhenMissing ? 'Bei fehlendem Nachweis gesperrt' : 'Nicht blockiert'} /></div> : <div className="empty-state"><strong>Standardregeln aktiv</strong><span>Für diesen Auftrag sind keine zusätzlichen Zeitregeln definiert.</span></div>}
          </section>}

          {activeSection === 'people' && <section className="hub-panel">
            <div className="section-title"><div><h2>Team</h2><p>Zugewiesene Mitarbeitende und externe Leistungserbringer.</p></div><button className="button secondary compact-action" onClick={() => setAssignmentOpen('new')}><Icon name="plus" size={15}/> Zuweisen</button></div>
            {assignments.length ? <div className="hub-row-list">{assignments.map((assignment) => { const effective = policy ? resolveTimeTrackingPolicy(policy, assignment) : assignment.timePolicyOverride as TimeTrackingPolicy | undefined; return <InteractiveRow className="hub-row interactive-hub-row" key={`${assignment.orderId}-${assignment.personId}`} onActivate={() => setAssignmentOpen(assignment)} ariaLabel={`${personName(assignment.personId, store)} Regel bearbeiten`}><span><strong>{personName(assignment.personId, store)}</strong><small>{providerLabel(assignment.providerType)} · {effective?.evidence.required ? `${frequencyLabel(effective.evidence.frequency)} Nachweis` : 'Auftragsstandard'}</small></span><Icon name="chevron" size={15}/></InteractiveRow>})}</div> : <div className="empty-state"><strong>Noch niemand zugewiesen</strong><span>Füge Mitarbeitende oder externe Leistungserbringer hinzu.</span></div>}
          </section>}

          {activeSection === 'billing' && <section className="hub-panel">
            <div className="section-title"><div><h2>Abrechnung</h2><p>Nur abrechnungsrelevante Regeln und Werte.</p></div></div>
            {policy ? <div className="summary-list"><SummaryRow label="Modell" value={policy.billing.model} /><SummaryRow label="Rechnungsdarstellung" value={policy.billing.invoiceGrouping} /><SummaryRow label="Stundenauszug" value={policy.billing.attachTimesheet ? 'Anhängen' : 'Nicht anhängen'} /><SummaryRow label="PO / Bestellnummer" value={policy.billing.purchaseOrderRequired ? 'Pflicht' : 'Optional'} /><SummaryRow label="Leistungsperiode" value={policy.billing.servicePeriodRequired ? 'Pflicht' : 'Optional'} /><SummaryRow label="Freigabe ab" value={policy.approval.invoiceApprovalThreshold ? `CHF ${policy.approval.invoiceApprovalThreshold.toLocaleString('de-CH')}` : 'Keine Schwelle'} /></div> : <div className="summary-list"><SummaryRow label="Modell" value={order.billingModel}/><SummaryRow label="Verkaufssatz" value={`CHF ${order.salesRate}/h`}/><SummaryRow label="Budget" value={`${order.budgetHours} h`}/></div>}
            <div className="hub-inline-action"><Link href="/invoices?new=1" className="text-link">Rechnung erstellen <Icon name="chevron" size={14}/></Link></div>
          </section>}

          {activeSection === 'evidence' && <section className="hub-panel">
            <div className="section-title"><div><h2>Nachweise</h2><p>Rapporte und Freigaben für diesen Auftrag.</p></div><button className="button secondary compact-action" onClick={() => setUploadOpen(true)}><Icon name="plus" size={15}/> Hochladen</button></div>
            <div className="hub-row-list">{evidence.length ? evidence.map((item) => <div className="hub-row evidence-hub-row" key={item.id}><span><strong>{item.fileName}</strong><small>{item.periodDate} · {personName(item.personId, store)}</small></span><span className={`status ${item.status === 'verified' ? 'active' : 'neutral'}`}>{evidenceLabel(item.status)}</span>{item.status !== 'verified' && <button className="text-button" onClick={() => store.updateEvidence(item.id, { status: 'verified', verifiedAt: new Date().toISOString() })}>Prüfen</button>}</div>) : <div className="empty-state"><strong>Keine Nachweise vorhanden</strong><span>Für diesen Auftrag wurden noch keine Rapporte hochgeladen.</span></div>}</div>
          </section>}

          {activeSection === 'documents' && <section className="hub-panel">
            <div className="section-title"><div><h2>Dokumente</h2><p>Angebote, Rechnungen und Nachweise zum Auftrag.</p></div></div>
            <div className="hub-row-list">
              <Link className="hub-row" href="/quotes"><span><strong>Angebote</strong><small>Dokumente und Versionen</small></span><Icon name="chevron" size={15}/></Link>
              <Link className="hub-row" href="/invoices"><span><strong>Rechnungen</strong><small>Fakturierte Leistungen</small></span><Icon name="chevron" size={15}/></Link>
              <button type="button" className="hub-row hub-row-button" onClick={() => setUploadOpen(true)}><span><strong>Zeitnachweis hochladen</strong><small>PDF oder Kundenrapport</small></span><Icon name="chevron" size={15}/></button>
            </div>
          </section>}
        </div>
      </div>

      {editOpen && <OrderEditor order={order} onClose={() => setEditOpen(false)} />}
      {uploadOpen && <EvidenceUpload orderId={order.id} onClose={() => setUploadOpen(false)} />}
      {policyOpen && <PolicyEditor orderId={order.id} current={policy ?? createDefaultOrderPolicy(order.id, order.billingModel)} onClose={() => setPolicyOpen(false)} />}
      {assignmentOpen && <AssignmentEditor orderId={order.id} current={assignmentOpen === 'new' ? null : assignmentOpen} onClose={() => setAssignmentOpen(null)} />}
    </section>
  )

  function OrderEditor({ order, onClose }: { order: Order; onClose: () => void }) {
    const [draft, setDraft] = useState(order)
    function save(event: React.FormEvent) { event.preventDefault(); store.updateOrder(order.id, draft); onClose() }
    return <div className="overlay-layer sheet-layer" onMouseDown={onClose}><form className="form-sheet mobile-fullscreen-sheet" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="sheet-heading"><div><strong>Auftrag bearbeiten</strong><span>Stammdaten, Budget und Status.</span></div><CloseButton onClick={onClose} /></div><div className="form-grid"><label className="full"><span>Auftragsname *</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required/></label><label><span>Mandats-/Vertragsreferenz</span><input value={draft.mandateRef ?? ''} onChange={(e) => setDraft({ ...draft, mandateRef: e.target.value })}/></label><label><span>WTO / Beschaffungsreferenz</span><input value={draft.procurementRef ?? ''} onChange={(e) => setDraft({ ...draft, procurementRef: e.target.value })}/></label><label><span>Endkunde</span><input value={draft.endCustomerName ?? ''} onChange={(e) => setDraft({ ...draft, endCustomerName: e.target.value })}/></label><label><span>Generalunternehmer</span><input value={draft.primeContractorName ?? ''} onChange={(e) => setDraft({ ...draft, primeContractorName: e.target.value })}/></label><label><span>Budget Stunden</span><input type="number" min="0" step="0.25" value={draft.budgetHours} onChange={(e) => setDraft({ ...draft, budgetHours: Number(e.target.value) })}/></label><label><span>Verkaufssatz CHF/h</span><input type="number" min="0" step="0.05" value={draft.salesRate} onChange={(e) => setDraft({ ...draft, salesRate: Number(e.target.value) })}/></label><label><span>Kostensatz CHF/h</span><input type="number" min="0" step="0.05" value={draft.costRate} onChange={(e) => setDraft({ ...draft, costRate: Number(e.target.value) })}/></label><label><span>Abrechnungsmodell</span><select value={draft.billingModel} onChange={(e) => setDraft({ ...draft, billingModel: e.target.value as BillingModel })}><option value="time">Nach Aufwand</option><option value="fixed">Pauschal</option><option value="mixed">Gemischt</option></select></label><label><span>Status</span><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as OrderStatus })}><option value="active">Aktiv</option><option value="paused">Pausiert</option><option value="completed">Abgeschlossen</option></select></label></div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Speichern</button></div></form></div>
  }

  function EvidenceUpload({ orderId, onClose }: { orderId: string; onClose: () => void }) {
    const orderEntries = store.timeEntries.filter((entry) => entry.orderId === orderId)
    const [timeEntryId, setTimeEntryId] = useState(orderEntries.find((entry) => !store.timeEvidence.some((proof) => proof.timeEntryId === entry.id))?.id ?? orderEntries[0]?.id ?? '')
    const [file, setFile] = useState<File | null>(null)
    const [signed, setSigned] = useState(true)
    const [customerApproved, setCustomerApproved] = useState(true)
    const selectedEntry = orderEntries.find((entry) => entry.id === timeEntryId)

    function save(event: React.FormEvent) {
      event.preventDefault()
      if (!file || !selectedEntry) return
      store.addEvidence({ id: `evi-${Date.now()}`, timeEntryId: selectedEntry.id, orderId, personId: selectedEntry.personId, periodDate: selectedEntry.date, fileName: file.name, mimeType: file.type || 'application/pdf', status: 'uploaded', signed, customerApproved, uploadedAt: new Date().toISOString() })
      onClose()
    }

    return <div className="overlay-layer sheet-layer" onMouseDown={onClose}><form className="form-sheet bottom-sheet" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="sheet-grabber"/><div className="sheet-heading"><div><strong>Zeitnachweis hochladen</strong><span>Im Demo-System werden Dateiname und Prüfstatus gespeichert.</span></div><CloseButton onClick={onClose} /></div>{orderEntries.length ? <><div className="form-grid"><label className="full"><span>Zeiteintrag *</span><select value={timeEntryId} onChange={(e) => setTimeEntryId(e.target.value)} required>{orderEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.date} · {entry.personName} · {entry.hours} h</option>)}</select></label><label className="full"><span>PDF-Nachweis *</span><input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required/></label><div className="form-toggle-field"><span>Signiert</span><Toggle label="Signiert" checked={signed} onChange={setSigned}/></div><div className="form-toggle-field"><span>Kunde bestätigt</span><Toggle label="Kunde bestätigt" checked={customerApproved} onChange={setCustomerApproved}/></div></div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Nachweis speichern</button></div></> : <div className="empty-state"><strong>Noch keine Zeiten vorhanden</strong><span>Erfasse zuerst eine Zeit auf diesem Auftrag.</span><div><Link href="/time?new=1" className="button primary">Zeit erfassen</Link></div></div>}</form></div>
  }

  function PolicyEditor({ orderId, current, onClose }: { orderId: string; current: OrderPolicy; onClose: () => void }) {
    const [draft, setDraft] = useState(current)
    const evidence = draft.timeTracking.evidence
    const setTime = (changes: Partial<TimeTrackingPolicy>) => setDraft((value) => ({ ...value, timeTracking: { ...value.timeTracking, ...changes } }))
    const setEvidence = (changes: Partial<TimeTrackingPolicy['evidence']>) => setDraft((value) => ({ ...value, timeTracking: { ...value.timeTracking, evidence: { ...value.timeTracking.evidence, ...changes } } }))
    function save(event: React.FormEvent) { event.preventDefault(); store.updateOrderPolicy(orderId, draft); onClose() }
    return <div className="overlay-layer sheet-layer" onMouseDown={onClose}><form className="form-sheet policy-editor mobile-fullscreen-sheet" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="sheet-heading"><div><strong>Auftragsregeln</strong><span>Nur den Bereich öffnen, den du anpassen möchtest.</span></div><CloseButton onClick={onClose} /></div><div className="policy-groups"><details className="policy-group" open><summary><span><strong>Zeiterfassung</strong><small>System, Rundung und Buchungsregeln</small></span><Icon name="chevron" size={15}/></summary><div className="policy-group-body"><div className="form-grid"><label><span>Zeiterfassung</span><select value={draft.timeTracking.mode} onChange={(e) => setTime({ mode: e.target.value as TimeTrackingPolicy['mode'] })}><option value="internal">Nur Binso Admin</option><option value="external_customer_system">Nur Kundensystem</option><option value="both">Binso + Kundensystem</option></select></label><label><span>Rundung</span><select value={draft.timeTracking.bookingIntervalMinutes} onChange={(e) => setTime({ bookingIntervalMinutes: Number(e.target.value) as 1|5|15|30 })}><option value="1">1 Minute</option><option value="5">5 Minuten</option><option value="15">15 Minuten</option><option value="30">30 Minuten</option></select></label><label><span>Rückwirkend buchbar</span><input type="number" min="0" value={draft.timeTracking.allowRetroactiveDays} onChange={(e) => setTime({ allowRetroactiveDays: Number(e.target.value) })}/></label></div><div className="policy-toggle-list"><ToggleRow label="Beschreibung Pflicht" checked={draft.timeTracking.requireDescription} onChange={(v) => setTime({ requireDescription: v })}/></div></div></details><details className="policy-group"><summary><span><strong>Nachweise</strong><small>{evidence.required ? `${frequencyLabel(evidence.frequency)} · erforderlich` : 'Nicht erforderlich'}</small></span><Icon name="chevron" size={15}/></summary><div className="policy-group-body"><div className="form-grid"><label><span>Nachweisrhythmus</span><select value={evidence.frequency} onChange={(e) => setEvidence({ frequency: e.target.value as EvidenceFrequency })}><option value="none">Keiner</option><option value="daily">Täglich</option><option value="weekly">Wöchentlich</option><option value="monthly">Monatlich</option></select></label></div><div className="policy-toggle-list"><ToggleRow label="Nachweis erforderlich" checked={evidence.required} onChange={(v) => setEvidence({ required: v, frequency: v && evidence.frequency === 'none' ? 'daily' : evidence.frequency })}/><ToggleRow label="Unterschrift erforderlich" checked={evidence.signatureRequired} onChange={(v) => setEvidence({ signatureRequired: v })}/><ToggleRow label="Kundenfreigabe erforderlich" checked={evidence.customerApprovalRequired} onChange={(v) => setEvidence({ customerApprovalRequired: v })}/><ToggleRow label="Freigabe ohne Nachweis blockieren" checked={evidence.blockApprovalWhenMissing} onChange={(v) => setEvidence({ blockApprovalWhenMissing: v })}/><ToggleRow label="Fakturierung ohne Nachweis blockieren" checked={evidence.blockBillingWhenMissing} onChange={(v) => setEvidence({ blockBillingWhenMissing: v })}/><ToggleRow label="Nachweis-Erinnerung" checked={evidence.reminderEnabled} onChange={(v) => setEvidence({ reminderEnabled: v })}/></div></div></details><details className="policy-group"><summary><span><strong>Abrechnung</strong><small>Rechnungs- und Pflichtangaben</small></span><Icon name="chevron" size={15}/></summary><div className="policy-group-body"><div className="policy-toggle-list"><ToggleRow label="Stundenauszug an Rechnung" checked={draft.billing.attachTimesheet} onChange={(v) => setDraft((d) => ({ ...d, billing: { ...d.billing, attachTimesheet: v } }))}/><ToggleRow label="PO / Bestellnummer Pflicht" checked={draft.billing.purchaseOrderRequired} onChange={(v) => setDraft((d) => ({ ...d, billing: { ...d.billing, purchaseOrderRequired: v } }))}/><ToggleRow label="Leistungsperiode Pflicht" checked={draft.billing.servicePeriodRequired} onChange={(v) => setDraft((d) => ({ ...d, billing: { ...d.billing, servicePeriodRequired: v } }))}/></div></div></details></div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Regeln speichern</button></div></form></div>
  }

  function AssignmentEditor({ orderId, current, onClose }: { orderId: string; current: OrderAssignmentRule | null; onClose: () => void }) {
    const choices = useMemo(() => [
      ...store.employees.map((employee) => ({ id: employee.id, name: employee.name, providerType: (employee.employmentType === 'hourly' ? 'employee_hourly' : 'employee_salary') as ServiceProviderType })),
      ...store.suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name, providerType: 'external_company' as ServiceProviderType })),
    ], [])
    const initial = current?.personId ?? choices[0]?.id ?? ''
    const [personId, setPersonId] = useState(initial)
    const selectedChoice = choices.find((item) => item.id === personId)
    const [active, setActive] = useState(current?.active ?? true)
    const [overrideEnabled, setOverrideEnabled] = useState(Boolean(current?.timePolicyOverride))
    const [evidenceRequired, setEvidenceRequired] = useState(current?.timePolicyOverride?.evidence?.required ?? false)
    const [frequency, setFrequency] = useState<EvidenceFrequency>(current?.timePolicyOverride?.evidence?.frequency ?? 'daily')
    const [signatureRequired, setSignatureRequired] = useState(current?.timePolicyOverride?.evidence?.signatureRequired ?? false)
    const [customerApprovalRequired, setCustomerApprovalRequired] = useState(current?.timePolicyOverride?.evidence?.customerApprovalRequired ?? false)
    function save(event: React.FormEvent) {
      event.preventDefault()
      const providerType = current?.providerType ?? selectedChoice?.providerType ?? 'employee_salary'
      const override: OrderAssignmentRule['timePolicyOverride'] = overrideEnabled ? { evidence: { required: evidenceRequired, frequency: evidenceRequired ? frequency : 'none', formats: ['pdf'], signatureRequired, customerApprovalRequired, blockApprovalWhenMissing: evidenceRequired, blockBillingWhenMissing: evidenceRequired, reminderEnabled: evidenceRequired } } : undefined
      store.updateOrderAssignmentRule({ orderId, personId, providerType, active, timePolicyOverride: override })
      onClose()
    }
    return <div className="overlay-layer sheet-layer" onMouseDown={onClose}><form className="form-sheet bottom-sheet" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="sheet-heading"><div><strong>{current ? 'Mitarbeiterregel bearbeiten' : 'Leistungserbringer zuweisen'}</strong><span>Auftragsstandard übernehmen oder individuell abweichen.</span></div><CloseButton onClick={onClose} /></div><div className="form-grid"><label className="full"><span>Person / Firma *</span><select value={personId} disabled={Boolean(current)} onChange={(e) => setPersonId(e.target.value)} required>{choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</select></label></div><div className="policy-toggle-list"><ToggleRow label="Zuweisung aktiv" checked={active} onChange={setActive}/><ToggleRow label="Eigene Zeitnachweis-Regel" checked={overrideEnabled} onChange={setOverrideEnabled}/>{overrideEnabled && <><ToggleRow label="Nachweis erforderlich" checked={evidenceRequired} onChange={setEvidenceRequired}/>{evidenceRequired && <div className="form-grid"><label><span>Rhythmus</span><select value={frequency} onChange={(e) => setFrequency(e.target.value as EvidenceFrequency)}><option value="daily">Täglich</option><option value="weekly">Wöchentlich</option><option value="monthly">Monatlich</option></select></label></div>}<ToggleRow label="Unterschrift erforderlich" checked={signatureRequired} onChange={setSignatureRequired}/><ToggleRow label="Kundenfreigabe erforderlich" checked={customerApprovalRequired} onChange={setCustomerApprovalRequired}/></>}</div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Speichern</button></div></form></div>
  }
}

function personName(id: string, store: ReturnType<typeof useBusinessStore>) { return store.employees.find((item) => item.id === id)?.name ?? store.suppliers.find((item) => item.id === id)?.name ?? store.timeEntries.find((item) => item.personId === id)?.personName ?? id }
function providerLabel(value: ServiceProviderType) { const labels: Record<ServiceProviderType,string> = { employee_salary: 'Festlohn', employee_hourly: 'Stundenlohn', external_individual: 'Externe Person', external_company: 'Externe Firma' }; return labels[value] }
function modeLabel(value: TimeTrackingPolicy['mode']) { return value === 'both' ? 'Binso + Kundensystem' : value === 'internal' ? 'Binso Admin' : 'Kundensystem' }
function frequencyLabel(value: EvidenceFrequency) { return value === 'daily' ? 'Täglich' : value === 'weekly' ? 'Wöchentlich' : value === 'monthly' ? 'Monatlich' : 'Keiner' }
function evidenceLabel(value: string) { const labels: Record<string,string> = { uploaded:'Hochgeladen', verified:'Geprüft', rejected:'Abgelehnt', missing:'Fehlt', not_required:'Nicht erforderlich' }; return labels[value] ?? value }
function HubButton({ active, label, meta, onClick }: { active:boolean; label:string; meta:string; onClick:()=>void }) { return <button type="button" className={active ? 'hub-row active' : 'hub-row'} onClick={onClick}><span><strong>{label}</strong><small>{meta}</small></span><Icon name="chevron" size={15}/></button> }
function SummaryRow({ label, value }: { label:string; value:string }) { return <div className="summary-row"><span>{label}</span><strong>{value}</strong></div> }
function Rule({ label, value }: { label: string; value: string }) { return <div className="rule-item"><span>{label}</span><strong>{value}</strong></div> }
function ToggleRow({ label, checked, onChange }: { label:string; checked:boolean; onChange:(value:boolean)=>void }) { return <div className="policy-toggle-row"><span>{label}</span><Toggle label={label} checked={checked} onChange={onChange}/></div> }
