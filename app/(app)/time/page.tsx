'use client'

import { Select, Textarea, Input } from '@/components/ui/form-controls'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { useFeedback } from '@/components/ui/feedback'
import { Toggle } from '@/components/ui/toggle'
import { useBusinessStore } from '@/components/state/business-store'
import { useCurrentUser } from '@/components/state/current-user'
import type { WorkerType } from '@/types/domain'
import { getTimeEntryApprovalEligibility, getTimeEntryBillingEligibility } from '@/modules/time/eligibility'
import { resolveTimeTrackingPolicy } from '@/modules/orders/policies'

export default function TimePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const store = useBusinessStore()
  const user = useCurrentUser()
  const currentEmployee = store.employees.find((item) => item.email.toLowerCase() === user.email.toLowerCase())
  const canWrite = user.role !== 'finance'
  const canApprove = user.role === 'owner' || user.role === 'admin' || (user.role === 'employee' && store.appSettings.workflow.allowSelfApproval)

  const assignedOrderIds = new Set(
    store.orderAssignmentRules
      .filter((rule) => rule.active && (!currentEmployee || rule.personId === currentEmployee.id))
      .map((rule) => rule.orderId),
  )
  const availableOrders = store.orders.filter((order) =>
    order.status === 'active' && (user.role !== 'employee' || assignedOrderIds.has(order.id)),
  )

  const [open, setOpen] = useState(false)
  const [orderId, setOrderId] = useState(availableOrders[0]?.id ?? '')
  const [hours, setHours] = useState('8')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [personId, setPersonId] = useState(currentEmployee?.id ?? '')
  const [selected, setSelected] = useState<string[]>([])
  const [billableEntry, setBillableEntry] = useState(true)
  const [formError, setFormError] = useState('')
  const feedback = useFeedback()

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    setOpen(true)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    router.replace(`${pathname}${suffix}`, { scroll: false })
  }, [pathname, router, searchParams])

  const people = useMemo(() => {
    const all = availablePeople(orderId, store)
    if (user.role !== 'employee') return all
    return currentEmployee ? all.filter((item) => item.id === currentEmployee.id) : []
  }, [orderId, store.orderAssignmentRules, store.employees, store.suppliers, store.timeEntries, user.role, currentEmployee?.id])

  useEffect(() => {
    if (!people.some((item) => item.id === personId)) setPersonId(people[0]?.id ?? '')
  }, [people, personId])

  const visibleEntries = useMemo(
    () => user.role === 'employee' && currentEmployee
      ? store.timeEntries.filter((entry) => entry.personId === currentEmployee.id)
      : store.timeEntries,
    [currentEmployee, store.timeEntries, user.role],
  )
  const total = visibleEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const billable = visibleEntries.filter((entry) => entry.billable).reduce((sum, entry) => sum + entry.hours, 0)
  const unbilled = visibleEntries.filter((entry) => getTimeEntryBillingEligibility(entry, store.timeEvidence, store.orderPolicies, store.orderAssignmentRules).eligible)
  const selectedEntries = useMemo(() => unbilled.filter((entry) => selected.includes(entry.id)), [selected, unbilled])
  const selectedCustomerIds = new Set(selectedEntries.map((entry) => entry.customerId))
  const selectedOrderIds = new Set(selectedEntries.map((entry) => entry.orderId))
  const canInvoice = user.role !== 'employee' && user.role !== 'finance' && selectedEntries.length > 0 && selectedCustomerIds.size === 1 && selectedOrderIds.size === 1

  function save(event: React.FormEvent) {
    event.preventDefault()
    setFormError('')
    const order = store.orders.find((item) => item.id === orderId)
    const person = people.find((item) => item.id === personId)
    if (!order || !person) { setFormError('Bitte Auftrag und Leistungserbringer auswählen.'); return }

    const policy = store.orderPolicies.find((item) => item.orderId === order.id)
    const assignment = store.orderAssignmentRules.find((item) => item.orderId === order.id && item.personId === person.id)
    const effective = policy ? (assignment ? resolveTimeTrackingPolicy(policy, assignment) : policy.timeTracking) : undefined
    const rawHours = Number(hours)
    if (!Number.isFinite(rawHours) || rawHours <= 0) { setFormError('Bitte gültige Stunden erfassen.'); return }
    if (effective?.requireDescription && !description.trim()) { setFormError('Für diesen Auftrag ist eine Beschreibung Pflicht.'); return }

    const selectedDate = new Date(`${date}T12:00:00`)
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const ageDays = Math.floor((today.getTime() - selectedDate.getTime()) / 86400000)
    if (ageDays < 0) { setFormError('Zeiten können nicht in der Zukunft erfasst werden.'); return }
    if (effective && ageDays > effective.allowRetroactiveDays) {
      setFormError(`Für diesen Auftrag können Zeiten maximal ${effective.allowRetroactiveDays} Tage rückwirkend erfasst werden.`)
      return
    }

    const roundedHours = effective ? roundHours(rawHours, effective.bookingIntervalMinutes) : rawHours
    const minimumHours = (effective?.minimumBookingMinutes ?? 0) / 60
    if (minimumHours && roundedHours < minimumHours) { setFormError(`Mindestbuchung: ${effective?.minimumBookingMinutes} Minuten.`); return }

    const workerType = person.workerType
    const salesRate = assignment?.salesRate ?? (workerType === 'hourly_employee' ? Math.min(order.salesRate, 145) : order.salesRate)
    const internalCostRate = assignment?.internalCostRate ?? (workerType === 'external' ? order.costRate : workerType === 'hourly_employee' ? 72 : order.costRate)
    const entryId = `time-${Date.now()}`
    const autoApprove = !store.appSettings.workflow.requireTimeApproval && !(effective?.evidence.blockApprovalWhenMissing && effective.evidence.required)

    store.addTimeEntry({
      id: entryId,
      orderId,
      orderName: order.name,
      customerId: order.customerId,
      customerName: order.customerName,
      personId: person.id,
      personName: person.name,
      workerType,
      date,
      hours: roundedHours,
      description: description.trim(),
      billable: billableEntry,
      approved: autoApprove,
      salesRate,
      internalCostRate,
    })
    setDescription('')
    setOpen(false)
    if (effective?.evidence.required) feedback.info(`Zeit gespeichert. Für ${person.name} ist ein ${frequencyLabel(effective.evidence.frequency).toLowerCase()}er Nachweis erforderlich.`)
    else feedback.success('Zeit gespeichert.')
  }

  function approveEntry(entryId: string) {
    const entry = store.timeEntries.find((item) => item.id === entryId)
    if (!entry || !canApprove) return
    const eligibility = getTimeEntryApprovalEligibility(entry, store.timeEvidence, store.orderPolicies, store.orderAssignmentRules)
    if (!eligibility.eligible) { feedback.warning(eligibility.reason); return }
    const updated = store.updateTimeEntry(entry.id, { approved: true })
    if (updated) feedback.success('Zeit freigegeben.')
    else feedback.warning('Die Zeit kann nicht mehr geändert werden.')
  }

  function createInvoiceFromSelected() {
    if (!canInvoice) return
    const first = selectedEntries[0]
    const invoice = store.createInvoiceFromTimes({ customerId: first.customerId, orderId: first.orderId, timeEntryIds: selectedEntries.map((entry) => entry.id), period: periodLabel(first.date) })
    if (invoice) router.push(`/invoices?view=${invoice.id}`)
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="ZEIT"
        title="Zeiterfassung"
        description="Zeiten erfassen, Nachweise prüfen, freigeben und direkt fakturieren."
        action={canWrite ? <button className="button primary page-primary-action" onClick={() => setOpen(true)}><Icon name="plus" size={16}/><span>Zeit erfassen</span></button> : undefined}
      />

      <div className="time-hero"><div><span>September</span><strong>{total} h</strong><small>erfasst</small></div><div className="time-hero-progress"><i style={{ width: `${Math.min(100, (total / 168) * 100)}%` }}/></div><div><span>Verrechenbar</span><strong>{billable} h</strong><small>{unbilled.reduce((sum, entry) => sum + entry.hours, 0)} h bereit</small></div></div>

      {user.role !== 'employee' && user.role !== 'finance' && (
        <div className="selection-bar"><div><strong>{selectedEntries.length} Zeiten ausgewählt</strong><span>{canInvoice ? 'Bereit für Rechnung' : selectedEntries.length ? 'Für eine Rechnung nur Zeiten desselben Auftrags auswählen' : 'Freigegebene und vollständige Zeiten markieren'}</span></div><button className="button primary" disabled={!canInvoice} onClick={createInvoiceFromSelected}><Icon name="invoices" size={15}/> Rechnung aus Zeiten</button></div>
      )}

      <div className="data-list operational-desktop-list">
        <div className="data-row time-grid-v5 data-head"><span/><span>Datum</span><span>Auftrag / Person</span><span>Tätigkeit</span><span>Stunden</span><span>Abrechnung</span></div>
        {visibleEntries.map((entry) => {
          const billing = getTimeEntryBillingEligibility(entry, store.timeEvidence, store.orderPolicies, store.orderAssignmentRules)
          const approval = getTimeEntryApprovalEligibility(entry, store.timeEvidence, store.orderPolicies, store.orderAssignmentRules)
          return (
            <div className="data-row time-grid-v5" key={entry.id}>
              <span>{user.role !== 'employee' && user.role !== 'finance' && <Input type="checkbox" disabled={!billing.eligible} checked={selected.includes(entry.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, entry.id] : current.filter((id) => id !== entry.id))}/>}</span>
              <span>{formatDate(entry.date)}</span>
              <span className="primary-cell"><strong>{entry.orderName}</strong><small>{entry.personName} · {workerLabel(entry.workerType)}</small></span>
              <span>{entry.description || '–'}</span>
              <span><strong>{entry.hours} h</strong></span>
              <span className="time-status-actions">
                <span className={entry.invoicedInvoiceId ? 'status paid' : billing.eligible ? 'status active' : 'status neutral'}>{entry.invoicedInvoiceId ? 'Verrechnet' : billing.reason}</span>
                {!entry.approved && !entry.invoicedInvoiceId && canApprove && (approval.eligible
                  ? <button type="button" className="row-link text-row-action" onClick={() => approveEntry(entry.id)}>Freigeben</button>
                  : <Link className="row-link text-row-action" href={`/orders/${entry.orderId}#evidence`}>{approval.reason}</Link>)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mobile-record-list operational-mobile-list">
        {visibleEntries.map((entry) => {
          const billing = getTimeEntryBillingEligibility(entry, store.timeEvidence, store.orderPolicies, store.orderAssignmentRules)
          return <article className="mobile-record operational-row" key={entry.id}><div className="record-top"><span><strong>{entry.hours} h · {entry.description || 'Zeiteintrag'}</strong><small>{entry.orderName} · {entry.personName}</small></span>{user.role !== 'employee' && user.role !== 'finance' && billing.eligible && <Input type="checkbox" checked={selected.includes(entry.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, entry.id] : current.filter((id) => id !== entry.id))}/>}</div><div className="record-meta operational-status-line"><span>{formatDate(entry.date)}</span><span>{entry.invoicedInvoiceId ? 'Verrechnet' : billing.reason}</span></div></article>
        })}
      </div>

      {open && canWrite && (
        <StandardFormSheet open title={<>Zeit erfassen</>} description={<>Direkt einem Auftrag und Leistungserbringer zuordnen.</>} onClose={() => setOpen(false)} onSubmit={save} formId="time-page-sheet-1" footer={<><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button type="submit" form="time-page-sheet-1" className="button primary" disabled={!availableOrders.length || !people.length}>Speichern</button></>}>{formError && <div className="field-error">{formError}</div>}
            <div className="form-grid">
              <label className="full"><span>Auftrag *</span><Select value={orderId} onChange={(e) => setOrderId(e.target.value)} required>{availableOrders.map((order) => <option key={order.id} value={order.id}>{order.name} · {order.customerName}</option>)}</Select></label>
              <label className="full"><span>Leistungserbringer *</span><Select value={personId} onChange={(e) => setPersonId(e.target.value)} required>{people.map((person) => <option key={person.id} value={person.id}>{person.name} · {workerLabel(person.workerType)}</option>)}</Select></label>
              <label><span>Datum *</span><Input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} required/></label>
              <label><span>Stunden *</span><Input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} required/></label>
              <div className="form-toggle-field"><span>Verrechenbar</span><Toggle label="Verrechenbar" checked={billableEntry} onChange={setBillableEntry}/></div>
              <label className="full"><span>Beschreibung</span><Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kurze Beschreibung der ausgeführten Arbeiten"/></label>
            </div>
            {!availableOrders.length && <div className="field-error">Für dieses Profil ist aktuell kein aktiver Auftrag zur Zeiterfassung zugewiesen.</div>}</StandardFormSheet>
      )}
    </section>
  )
}

function availablePeople(orderId: string, store: ReturnType<typeof useBusinessStore>) {
  const rules = store.orderAssignmentRules.filter((rule) => rule.orderId === orderId && rule.active)
  if (!rules.length) return store.employees.filter((employee) => employee.status === 'active').map((employee) => ({ id: employee.id, name: employee.name, workerType: employee.employmentType === 'hourly' ? 'hourly_employee' as WorkerType : 'employee' as WorkerType }))
  return rules.map((rule) => {
    const employee = store.employees.find((item) => item.id === rule.personId)
    const supplier = store.suppliers.find((item) => item.id === rule.personId)
    const historical = store.timeEntries.find((entry) => entry.personId === rule.personId)
    const workerType: WorkerType = rule.providerType === 'employee_hourly' ? 'hourly_employee' : rule.providerType.startsWith('external') ? 'external' : 'employee'
    return { id: rule.personId, name: employee?.name ?? supplier?.name ?? historical?.personName ?? rule.personId, workerType }
  })
}

function roundHours(hours: number, intervalMinutes: number) { const minutes = hours * 60; return Math.round(minutes / intervalMinutes) * intervalMinutes / 60 }
function periodLabel(date: string) { return new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)) }
function frequencyLabel(value: string) { return value === 'daily' ? 'Täglich' : value === 'weekly' ? 'Wöchentlich' : value === 'monthly' ? 'Monatlich' : 'Kein' }
function workerLabel(value: WorkerType) { if (value === 'hourly_employee') return 'Stundenlohn'; if (value === 'external') return 'Externe Firma'; return 'Intern' }
function formatDate(value: string) { return new Intl.DateTimeFormat('de-CH').format(new Date(`${value}T12:00:00`)) }
