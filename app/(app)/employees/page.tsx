'use client'

import { Select, Input } from '@/components/ui/form-controls'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { Toggle } from '@/components/ui/toggle'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { useBusinessStore } from '@/components/state/business-store'
import type { Employee, Role } from '@/types/domain'

export default function EmployeesPage() {
  const store = useBusinessStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setCreating(true)
    })
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    router.replace(`${pathname}${suffix}`, { scroll: false })
    return () => { cancelled = true }
  }, [pathname, router, searchParams])

  return (
    <section className="page apple-page mobile-standard-page">
      <PageHeader title="Mitarbeitende" description="Mitarbeitende, Anstellung, Kosten und Einsatzdaten verwalten." action={<button className="button primary page-primary-action" onClick={() => setCreating(true)} aria-label="Mitarbeitende erfassen" title="Mitarbeitende erfassen"><Icon name="plus" size={16}/><span>Mitarbeitende erfassen</span></button>} />
      <div className="data-list">
        <div className="data-row employee-grid data-head"><span>Mitarbeiter</span><span>Rolle</span><span>Gebucht</span><span>Verrechenbar</span><span>Auslastung</span><span /></div>
        {store.employees.map((employee) => (
          <InteractiveRow className="data-row employee-grid employee-row-compact" key={employee.id} onActivate={() => setEditing(employee)} ariaLabel={`${employee.name} öffnen`}>
            <span className="user-cell"><span className="avatar">{initials(employee.name)}</span><span className="primary-cell"><strong>{employee.name}<i className={`employee-status-dot ${employee.status}`} aria-hidden="true"/></strong><small className="employee-email">{employee.email}</small><small className="employee-mobile-summary">{roleLabel(employee.role)} · {employee.bookedHours} / {employee.targetHours} h im Monat</small></span></span>
            <span className="employee-role">{roleLabel(employee.role)}</span><span className="employee-hours">{employee.bookedHours} / {employee.targetHours} h</span><span className="employee-billable">{employee.billableHours} h</span><span className="progress-cell employee-utilisation"><span className="mini-progress"><i style={{ width: `${Math.min(100, employee.utilisation)}%` }}/></span><small>{employee.utilisation}%</small></span><span className="row-disclosure" aria-hidden="true"><Icon name="chevron" size={15}/></span>
          </InteractiveRow>
        ))}
      </div>
      {creating && <EmployeeForm onClose={() => setCreating(false)} onSave={(employee) => { store.addEmployee(employee); setCreating(false); setEditing(employee) }} />}
      {editing && <EmployeeEditor employee={store.employees.find((item) => item.id === editing.id) ?? editing} onClose={() => setEditing(null)} onSave={(employee) => { store.updateEmployee(employee.id, employee); setEditing(null) }} />}
    </section>
  )
}

function EmployeeForm({ onClose, onSave }: { onClose: () => void; onSave: (employee: Employee) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('employee')
  const [employmentType, setEmploymentType] = useState<Employee['employmentType']>('salary')
  const [targetHours, setTargetHours] = useState(168)
  const [internalCostRate, setInternalCostRate] = useState(80)
  function submit(event: React.FormEvent) { event.preventDefault(); onSave({ id: `emp-${Date.now()}`, name: name.trim(), email: email.trim(), role, employmentType, status: 'active', targetHours, bookedHours: 0, billableHours: 0, utilisation: 0, internalCostRate }) }
  return <StandardFormSheet open title={<>Mitarbeitenden erfassen</>} description={<>Profil und betriebliche Basisdaten.</>} onClose={onClose} onSubmit={submit} formId="employees-page-sheet-1" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="employees-page-sheet-1" className="button primary">Erfassen</button></>}><div className="form-grid"><label className="full"><span>Name *</span><Input value={name} onChange={(e) => setName(e.target.value)} required/></label><label className="full"><span>E-Mail *</span><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/></label><label><span>Rolle</span><Select value={role} onChange={(e) => setRole(e.target.value as Role)}><option value="employee">Mitarbeiter</option><option value="finance">Buchhaltung</option><option value="admin">Admin</option><option value="owner">Inhaber</option></Select></label><label><span>Anstellung</span><Select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as Employee['employmentType'])}><option value="salary">Festlohn</option><option value="hourly">Stundenlohn</option></Select></label><label><span>Sollstunden / Monat</span><Input type="number" min="0" value={targetHours} onChange={(e) => setTargetHours(Number(e.target.value))}/></label><label><span>Interne Kosten CHF/h</span><Input type="number" min="0" step="0.05" value={internalCostRate} onChange={(e) => setInternalCostRate(Number(e.target.value))}/></label></div></StandardFormSheet>
}

function EmployeeEditor({ employee, onClose, onSave }: { employee: Employee; onClose: () => void; onSave: (employee: Employee) => void }) {
  const store = useBusinessStore()
  const [draft, setDraft] = useState(employee)
  const defaultSettlement = draft.employmentType === 'hourly'
    ? store.appSettings.workflow.employeeSettlement
    : { mode: 'salary' as const, requireApprovedMonthlyReport: false, requireSupplierInvoice: false, requireFinanceApproval: true }

  return <StandardFormSheet open title={<>{employee.name}</>} description={<>Mitarbeiterprofil, Kosten und Auszahlungsprozess bearbeiten.</>} onClose={onClose} onSubmit={(event) => { event.preventDefault(); onSave(draft) }} formId="employees-page-sheet-2" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="employees-page-sheet-2" className="button primary">Speichern</button></>}><div className="form-grid">
    <label className="full"><span>Name *</span><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required/></label>
    <label className="full"><span>E-Mail *</span><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} required/></label>
    <label><span>Rolle</span><Select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}><option value="employee">Mitarbeiter</option><option value="finance">Buchhaltung</option><option value="admin">Admin</option><option value="owner">Inhaber</option></Select></label>
    <label><span>Anstellung</span><Select value={draft.employmentType} onChange={(e) => setDraft({ ...draft, employmentType: e.target.value as Employee['employmentType'], settlementOverride: undefined })}><option value="salary">Festlohn</option><option value="hourly">Stundenlohn</option></Select></label>
    <label><span>Sollstunden / Monat</span><Input type="number" min="0" value={draft.targetHours} onChange={(e) => setDraft({ ...draft, targetHours: Number(e.target.value) })}/></label>
    <label><span>Interne Kosten CHF/h</span><Input type="number" min="0" step="0.05" value={draft.internalCostRate} onChange={(e) => setDraft({ ...draft, internalCostRate: Number(e.target.value) })}/></label>
    <div className="form-toggle-field"><span>Aktiv</span><Toggle label="Mitarbeitende aktiv" checked={draft.status === 'active'} onChange={(value) => setDraft({ ...draft, status: value ? 'active' : 'inactive' })}/></div>
    <div className="form-toggle-field full"><span>Eigene Auszahlungsregel</span><Toggle label="Eigene Auszahlungsregel" checked={Boolean(draft.settlementOverride)} onChange={(value) => setDraft({ ...draft, settlementOverride: value ? { ...defaultSettlement } : undefined })}/></div>
    {draft.settlementOverride && <>
      <div className="form-toggle-field full"><span>Freigegebener Monatsrapport erforderlich</span><Toggle label="Freigegebener Monatsrapport erforderlich" checked={draft.settlementOverride.requireApprovedMonthlyReport ?? defaultSettlement.requireApprovedMonthlyReport} onChange={(value) => setDraft({ ...draft, settlementOverride: { ...draft.settlementOverride!, requireApprovedMonthlyReport: value } })}/></div>
      <div className="form-toggle-field full"><span>Buchhaltungsfreigabe erforderlich</span><Toggle label="Buchhaltungsfreigabe erforderlich" checked={draft.settlementOverride.requireFinanceApproval ?? defaultSettlement.requireFinanceApproval} onChange={(value) => setDraft({ ...draft, settlementOverride: { ...draft.settlementOverride!, requireFinanceApproval: value } })}/></div>
    </>}
  </div></StandardFormSheet>
}

function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0]).join('').toUpperCase() }
function roleLabel(value: string) { if (value === 'owner') return 'Inhaber'; if (value === 'admin') return 'Admin'; if (value === 'finance') return 'Buchhaltung'; return 'Mitarbeiter' }
