'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/icon'
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

      <nav className="detail-tabs" aria-label="Auftragsbereiche"><a href="#overview">Übersicht</a><a href="#time">Zeiterfassung</a><a href="#people">Mitarbeitende</a><a href="#billing">Abrechnung</a><a href="#evidence">Nachweise</a></nav>

      <section id="overview" className="section-block">
        <div className="section-title"><div><h2>Vertrags- und Leistungskette</h2><p>Wer beauftragt wen und wer erbringt die Leistung.</p></div></div>
        {policy?.contractChain ? <div className="chain-list">{policy.contractChain.parties.map((party, index) => <div key={party.id} className="chain-item"><span className="chain-index">{String(index + 1).padStart(2, '0')}</span><span className="primary-cell"><strong>{party.name}</strong><small>{party.role.replaceAll('_', ' ')}</small></span>{index < policy.contractChain!.parties.length - 1 && <Icon name="chevron" size={15}/>}</div>)}</div> : <p className="muted">Keine spezielle Leistungskette hinterlegt.</p>}
      </section>

      <section id="time" className="section-block">
        <div className="section-title"><div><h2>Zeiterfassungsregeln</h2><p>Standard für diesen Auftrag. Abweichungen können pro Person hinterlegt werden.</p></div><button className="button secondary" onClick={() => setPolicyOpen(true)}><Icon name="edit" size={15}/> Regeln bearbeiten</button></div>
        {policy ? <div className="rule-grid"><Rule label="Erfassung" value={modeLabel(policy.timeTracking.mode)} /><Rule label="Rundung" value={`${policy.timeTracking.bookingIntervalMinutes} Minuten`} /><Rule label="Beschreibung Pflicht" value={yesNo(policy.timeTracking.requireDescription)} /><Rule label="Nachweis erforderlich" value={yesNo(policy.timeTracking.evidence.required)} /><Rule label="Rhythmus" value={frequencyLabel(policy.timeTracking.evidence.frequency)} /><Rule label="Unterschrift" value={yesNo(policy.timeTracking.evidence.signatureRequired)} /><Rule label="Kundenfreigabe" value={yesNo(policy.timeTracking.evidence.customerApprovalRequired)} /><Rule label="Fakturierung blockieren" value={yesNo(policy.timeTracking.evidence.blockBillingWhenMissing)} /></div> : <div className="rule-grid"><Rule label="Erfassung" value="Binso Admin"/><Rule label="Nachweis erforderlich" value="Nicht aktiv"/><Rule label="Abrechnung" value={order.billingModel}/></div>}
      </section>

      <section id="people" className="section-block">
        <div className="section-title"><div><h2>Mitarbeitende und Overrides</h2><p>Die Auftragsregel gilt standardmässig. Abweichungen werden pro Person hinterlegt.</p></div><button className="button secondary" onClick={() => setAssignmentOpen('new')}><Icon name="plus" size={15}/> Zuweisen</button></div>
        {assignments.length ? <div className="data-list"><div className="data-row data-head assignment-grid"><span>Person</span><span>Typ</span><span>Zeiterfassung</span><span>Nachweis</span><span/></div>{assignments.map((assignment) => { const effective = policy ? resolveTimeTrackingPolicy(policy, assignment) : assignment.timePolicyOverride as TimeTrackingPolicy | undefined; return <div className="data-row assignment-grid" key={`${assignment.orderId}-${assignment.personId}`}><span className="primary-cell"><strong>{personName(assignment.personId, store)}</strong><small>{providerLabel(assignment.providerType)}</small></span><span>{assignment.active ? 'Aktiv' : 'Inaktiv'}</span><span>{effective ? modeLabel(effective.mode) : 'Auftragsstandard'}</span><span>{effective?.evidence.required ? `${frequencyLabel(effective.evidence.frequency)} · Pflicht` : 'Nicht erforderlich'}</span><button className="row-link" onClick={() => setAssignmentOpen(assignment)} aria-label="Regel bearbeiten"><Icon name="chevron" size={15}/></button></div>})}</div> : <p className="muted">Noch keine Mitarbeitenden oder externen Leistungserbringer zugewiesen.</p>}
      </section>

      <section id="billing" className="section-block">
        <div className="section-title"><div><h2>Abrechnung</h2><p>Regeln für die spätere Fakturierung.</p></div></div>
        {policy ? <div className="rule-grid"><Rule label="Modell" value={policy.billing.model} /><Rule label="Rechnungsdarstellung" value={policy.billing.invoiceGrouping} /><Rule label="Stundenauszug" value={yesNo(policy.billing.attachTimesheet)} /><Rule label="PO / Bestellnummer Pflicht" value={yesNo(policy.billing.purchaseOrderRequired)} /><Rule label="Leistungsperiode Pflicht" value={yesNo(policy.billing.servicePeriodRequired)} /><Rule label="Rechnungsfreigabe ab" value={policy.approval.invoiceApprovalThreshold ? `CHF ${policy.approval.invoiceApprovalThreshold.toLocaleString('de-CH')}` : 'Keine Schwelle'} /></div> : <div className="rule-grid"><Rule label="Modell" value={order.billingModel}/><Rule label="Verkaufssatz" value={`CHF ${order.salesRate}/h`}/><Rule label="Budget" value={`${order.budgetHours} h`}/></div>}
      </section>

      <section id="evidence" className="section-block">
        <div className="section-title"><div><h2>Zeitnachweise</h2><p>Externe Rapporte für diesen Auftrag. Fehlende Pflichtnachweise können die Fakturierung blockieren.</p></div><button className="button secondary" onClick={() => setUploadOpen(true)}><Icon name="plus" size={15}/> Nachweis hochladen</button></div>
        <div className="compact-list">
          {evidence.length ? evidence.map((item) => <div key={item.id}><span className="primary-cell"><strong>{item.fileName}</strong><small>{item.periodDate} · {item.signed ? 'signiert' : 'nicht signiert'} · {personName(item.personId, store)}</small></span><span className={`status ${item.status === 'verified' ? 'active' : 'neutral'}`}>{evidenceLabel(item.status)}</span><span>{item.customerApproved ? 'Kunde bestätigt' : 'Freigabe offen'}</span>{item.status !== 'verified' ? <button className="row-link text-row-action" onClick={() => store.updateEvidence(item.id, { status: 'verified', verifiedAt: new Date().toISOString() })}>Prüfen</button> : <Icon name="check" size={15}/>}</div>) : <p className="muted">Keine Nachweise vorhanden.</p>}
        </div>
      </section>

      {editOpen && <OrderEditor order={order} onClose={() => setEditOpen(false)} />}
      {uploadOpen && <EvidenceUpload orderId={order.id} onClose={() => setUploadOpen(false)} />}
      {policyOpen && <PolicyEditor orderId={order.id} current={policy ?? createDefaultOrderPolicy(order.id, order.billingModel)} onClose={() => setPolicyOpen(false)} />}
      {assignmentOpen && <AssignmentEditor orderId={order.id} current={assignmentOpen === 'new' ? null : assignmentOpen} onClose={() => setAssignmentOpen(null)} />}
    </section>
  )

  function OrderEditor({ order, onClose }: { order: Order; onClose: () => void }) {
    const [draft, setDraft] = useState(order)
    function save(event: React.FormEvent) { event.preventDefault(); store.updateOrder(order.id, draft); onClose() }
    return <div className="overlay-layer sheet-layer" onMouseDown={onClose}><form className="form-sheet mobile-fullscreen-sheet" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="sheet-heading"><div><strong>Auftrag bearbeiten</strong><span>Stammdaten, Budget und Status.</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div><div className="form-grid"><label className="full"><span>Auftragsname *</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required/></label><label><span>Mandats-/Vertragsreferenz</span><input value={draft.mandateRef ?? ''} onChange={(e) => setDraft({ ...draft, mandateRef: e.target.value })}/></label><label><span>WTO / Beschaffungsreferenz</span><input value={draft.procurementRef ?? ''} onChange={(e) => setDraft({ ...draft, procurementRef: e.target.value })}/></label><label><span>Endkunde</span><input value={draft.endCustomerName ?? ''} onChange={(e) => setDraft({ ...draft, endCustomerName: e.target.value })}/></label><label><span>Generalunternehmer</span><input value={draft.primeContractorName ?? ''} onChange={(e) => setDraft({ ...draft, primeContractorName: e.target.value })}/></label><label><span>Budget Stunden</span><input type="number" min="0" step="0.25" value={draft.budgetHours} onChange={(e) => setDraft({ ...draft, budgetHours: Number(e.target.value) })}/></label><label><span>Verkaufssatz CHF/h</span><input type="number" min="0" step="0.05" value={draft.salesRate} onChange={(e) => setDraft({ ...draft, salesRate: Number(e.target.value) })}/></label><label><span>Kostensatz CHF/h</span><input type="number" min="0" step="0.05" value={draft.costRate} onChange={(e) => setDraft({ ...draft, costRate: Number(e.target.value) })}/></label><label><span>Abrechnungsmodell</span><select value={draft.billingModel} onChange={(e) => setDraft({ ...draft, billingModel: e.target.value as BillingModel })}><option value="time">Nach Aufwand</option><option value="fixed">Pauschal</option><option value="mixed">Gemischt</option></select></label><label><span>Status</span><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as OrderStatus })}><option value="active">Aktiv</option><option value="paused">Pausiert</option><option value="completed">Abgeschlossen</option></select></label></div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Speichern</button></div></form></div>
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

    return <div className="overlay-layer sheet-layer" onMouseDown={onClose}><form className="form-sheet bottom-sheet" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="sheet-grabber"/><div className="sheet-heading"><div><strong>Zeitnachweis hochladen</strong><span>Im Demo-System werden Dateiname und Prüfstatus gespeichert.</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div>{orderEntries.length ? <><div className="form-grid"><label className="full"><span>Zeiteintrag *</span><select value={timeEntryId} onChange={(e) => setTimeEntryId(e.target.value)} required>{orderEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.date} · {entry.personName} · {entry.hours} h</option>)}</select></label><label className="full"><span>PDF-Nachweis *</span><input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required/></label><div className="form-toggle-field"><span>Signiert</span><Toggle label="Signiert" checked={signed} onChange={setSigned}/></div><div className="form-toggle-field"><span>Kunde bestätigt</span><Toggle label="Kunde bestätigt" checked={customerApproved} onChange={setCustomerApproved}/></div></div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Nachweis speichern</button></div></> : <div className="empty-state"><strong>Noch keine Zeiten vorhanden</strong><span>Erfasse zuerst eine Zeit auf diesem Auftrag.</span><div><Link href="/time?new=1" className="button primary">Zeit erfassen</Link></div></div>}</form></div>
  }

  function PolicyEditor({ orderId, current, onClose }: { orderId: string; current: OrderPolicy; onClose: () => void }) {
    const [draft, setDraft] = useState(current)
    const evidence = draft.timeTracking.evidence
    const setTime = (changes: Partial<TimeTrackingPolicy>) => setDraft((value) => ({ ...value, timeTracking: { ...value.timeTracking, ...changes } }))
    const setEvidence = (changes: Partial<TimeTrackingPolicy['evidence']>) => setDraft((value) => ({ ...value, timeTracking: { ...value.timeTracking, evidence: { ...value.timeTracking.evidence, ...changes } } }))
    function save(event: React.FormEvent) { event.preventDefault(); store.updateOrderPolicy(orderId, draft); onClose() }
    return <div className="overlay-layer sheet-layer" onMouseDown={onClose}><form className="form-sheet policy-editor mobile-fullscreen-sheet" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="sheet-heading"><div><strong>Auftragsregeln</strong><span>Zeiterfassung, Nachweise und Abrechnung pro Auftrag.</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div><div className="form-grid"><label><span>Zeiterfassung</span><select value={draft.timeTracking.mode} onChange={(e) => setTime({ mode: e.target.value as TimeTrackingPolicy['mode'] })}><option value="internal">Nur Binso Admin</option><option value="external_customer_system">Nur Kundensystem</option><option value="both">Binso + Kundensystem</option></select></label><label><span>Rundung</span><select value={draft.timeTracking.bookingIntervalMinutes} onChange={(e) => setTime({ bookingIntervalMinutes: Number(e.target.value) as 1|5|15|30 })}><option value="1">1 Minute</option><option value="5">5 Minuten</option><option value="15">15 Minuten</option><option value="30">30 Minuten</option></select></label><label><span>Nachweisrhythmus</span><select value={evidence.frequency} onChange={(e) => setEvidence({ frequency: e.target.value as EvidenceFrequency })}><option value="none">Keiner</option><option value="daily">Täglich</option><option value="weekly">Wöchentlich</option><option value="monthly">Monatlich</option></select></label><label><span>Rückwirkend buchbar</span><input type="number" min="0" value={draft.timeTracking.allowRetroactiveDays} onChange={(e) => setTime({ allowRetroactiveDays: Number(e.target.value) })}/></label></div><div className="policy-toggle-list"><ToggleRow label="Beschreibung Pflicht" checked={draft.timeTracking.requireDescription} onChange={(v) => setTime({ requireDescription: v })}/><ToggleRow label="Nachweis erforderlich" checked={evidence.required} onChange={(v) => setEvidence({ required: v, frequency: v && evidence.frequency === 'none' ? 'daily' : evidence.frequency })}/><ToggleRow label="Unterschrift erforderlich" checked={evidence.signatureRequired} onChange={(v) => setEvidence({ signatureRequired: v })}/><ToggleRow label="Kundenfreigabe erforderlich" checked={evidence.customerApprovalRequired} onChange={(v) => setEvidence({ customerApprovalRequired: v })}/><ToggleRow label="Freigabe ohne Nachweis blockieren" checked={evidence.blockApprovalWhenMissing} onChange={(v) => setEvidence({ blockApprovalWhenMissing: v })}/><ToggleRow label="Fakturierung ohne Nachweis blockieren" checked={evidence.blockBillingWhenMissing} onChange={(v) => setEvidence({ blockBillingWhenMissing: v })}/><ToggleRow label="Nachweis-Erinnerung" checked={evidence.reminderEnabled} onChange={(v) => setEvidence({ reminderEnabled: v })}/><ToggleRow label="Stundenauszug an Rechnung" checked={draft.billing.attachTimesheet} onChange={(v) => setDraft((d) => ({ ...d, billing: { ...d.billing, attachTimesheet: v } }))}/><ToggleRow label="PO / Bestellnummer Pflicht" checked={draft.billing.purchaseOrderRequired} onChange={(v) => setDraft((d) => ({ ...d, billing: { ...d.billing, purchaseOrderRequired: v } }))}/><ToggleRow label="Leistungsperiode Pflicht" checked={draft.billing.servicePeriodRequired} onChange={(v) => setDraft((d) => ({ ...d, billing: { ...d.billing, servicePeriodRequired: v } }))}/></div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Regeln speichern</button></div></form></div>
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
    return <div className="overlay-layer sheet-layer" onMouseDown={onClose}><form className="form-sheet bottom-sheet" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="sheet-heading"><div><strong>{current ? 'Mitarbeiterregel bearbeiten' : 'Leistungserbringer zuweisen'}</strong><span>Auftragsstandard übernehmen oder individuell abweichen.</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div><div className="form-grid"><label className="full"><span>Person / Firma *</span><select value={personId} disabled={Boolean(current)} onChange={(e) => setPersonId(e.target.value)} required>{choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</select></label></div><div className="policy-toggle-list"><ToggleRow label="Zuweisung aktiv" checked={active} onChange={setActive}/><ToggleRow label="Eigene Zeitnachweis-Regel" checked={overrideEnabled} onChange={setOverrideEnabled}/>{overrideEnabled && <><ToggleRow label="Nachweis erforderlich" checked={evidenceRequired} onChange={setEvidenceRequired}/>{evidenceRequired && <div className="form-grid"><label><span>Rhythmus</span><select value={frequency} onChange={(e) => setFrequency(e.target.value as EvidenceFrequency)}><option value="daily">Täglich</option><option value="weekly">Wöchentlich</option><option value="monthly">Monatlich</option></select></label></div>}<ToggleRow label="Unterschrift erforderlich" checked={signatureRequired} onChange={setSignatureRequired}/><ToggleRow label="Kundenfreigabe erforderlich" checked={customerApprovalRequired} onChange={setCustomerApprovalRequired}/></>}</div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Speichern</button></div></form></div>
  }
}

function personName(id: string, store: ReturnType<typeof useBusinessStore>) { return store.employees.find((item) => item.id === id)?.name ?? store.suppliers.find((item) => item.id === id)?.name ?? store.timeEntries.find((item) => item.personId === id)?.personName ?? id }
function providerLabel(value: ServiceProviderType) { const labels: Record<ServiceProviderType,string> = { employee_salary: 'Festlohn', employee_hourly: 'Stundenlohn', external_individual: 'Externe Person', external_company: 'Externe Firma' }; return labels[value] }
function modeLabel(value: TimeTrackingPolicy['mode']) { return value === 'both' ? 'Binso + Kundensystem' : value === 'internal' ? 'Binso Admin' : 'Kundensystem' }
function frequencyLabel(value: EvidenceFrequency) { return value === 'daily' ? 'Täglich' : value === 'weekly' ? 'Wöchentlich' : value === 'monthly' ? 'Monatlich' : 'Keiner' }
function evidenceLabel(value: string) { const labels: Record<string,string> = { uploaded:'Hochgeladen', verified:'Geprüft', rejected:'Abgelehnt', missing:'Fehlt', not_required:'Nicht erforderlich' }; return labels[value] ?? value }
function Rule({ label, value }: { label: string; value: string }) { return <div className="rule-item"><span>{label}</span><strong>{value}</strong></div> }
function ToggleRow({ label, checked, onChange }: { label:string; checked:boolean; onChange:(value:boolean)=>void }) { return <div className="policy-toggle-row"><span>{label}</span><Toggle label={label} checked={checked} onChange={onChange}/></div> }
