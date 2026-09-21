'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { Toggle } from '@/components/ui/toggle'
import { useBusinessStore } from '@/components/state/business-store'
import type { Employee, Role } from '@/types/domain'

export default function EmployeesPage() {
  const store = useBusinessStore()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  return (
    <section className="page">
      <PageHeader eyebrow="TEAM" title="Mitarbeitende" description="Rollen, Anstellungsart, Kosten und Zeitstatus verwalten." action={<button className="button primary" onClick={() => setCreating(true)}><Icon name="plus" size={16}/> Mitarbeitende erfassen</button>} />
      <div className="data-list">
        <div className="data-row employee-grid data-head"><span>Mitarbeiter</span><span>Rolle</span><span>Gebucht</span><span>Verrechenbar</span><span>Auslastung</span><span /></div>
        {store.employees.map((employee) => (
          <div className="data-row employee-grid" key={employee.id}>
            <span className="user-cell"><span className="avatar">{initials(employee.name)}</span><span className="primary-cell"><strong>{employee.name}</strong><small>{employee.email} · {employee.status === 'active' ? 'Aktiv' : 'Inaktiv'}</small></span></span>
            <span>{roleLabel(employee.role)}</span><span>{employee.bookedHours} / {employee.targetHours} h</span><span>{employee.billableHours} h</span><span className="progress-cell"><span className="mini-progress"><i style={{ width: `${Math.min(100, employee.utilisation)}%` }}/></span><small>{employee.utilisation}%</small></span><button className="row-link" onClick={() => setEditing(employee)} aria-label={`${employee.name} öffnen`}><Icon name="chevron" size={15}/></button>
          </div>
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
  return <div className="overlay-layer sheet-layer" onMouseDown={onClose}><form className="form-sheet mobile-fullscreen-sheet" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-heading"><div><strong>Mitarbeitenden erfassen</strong><span>Profil und betriebliche Basisdaten.</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div><div className="form-grid"><label className="full"><span>Name *</span><input value={name} onChange={(e) => setName(e.target.value)} required/></label><label className="full"><span>E-Mail *</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/></label><label><span>Rolle</span><select value={role} onChange={(e) => setRole(e.target.value as Role)}><option value="employee">Mitarbeiter</option><option value="finance">Buchhaltung</option><option value="admin">Admin</option><option value="owner">Inhaber</option></select></label><label><span>Anstellung</span><select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as Employee['employmentType'])}><option value="salary">Festlohn</option><option value="hourly">Stundenlohn</option></select></label><label><span>Sollstunden / Monat</span><input type="number" min="0" value={targetHours} onChange={(e) => setTargetHours(Number(e.target.value))}/></label><label><span>Interne Kosten CHF/h</span><input type="number" min="0" step="0.05" value={internalCostRate} onChange={(e) => setInternalCostRate(Number(e.target.value))}/></label></div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Erfassen</button></div></form></div>
}

function EmployeeEditor({ employee, onClose, onSave }: { employee: Employee; onClose: () => void; onSave: (employee: Employee) => void }) {
  const [draft, setDraft] = useState(employee)
  return <div className="overlay-layer sheet-layer" onMouseDown={onClose}><form className="form-sheet mobile-fullscreen-sheet" onSubmit={(event) => { event.preventDefault(); onSave(draft) }} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-heading"><div><strong>{employee.name}</strong><span>Mitarbeiterprofil bearbeiten</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div><div className="form-grid"><label className="full"><span>Name *</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required/></label><label className="full"><span>E-Mail *</span><input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} required/></label><label><span>Rolle</span><select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}><option value="employee">Mitarbeiter</option><option value="finance">Buchhaltung</option><option value="admin">Admin</option><option value="owner">Inhaber</option></select></label><label><span>Anstellung</span><select value={draft.employmentType} onChange={(e) => setDraft({ ...draft, employmentType: e.target.value as Employee['employmentType'] })}><option value="salary">Festlohn</option><option value="hourly">Stundenlohn</option></select></label><label><span>Sollstunden / Monat</span><input type="number" min="0" value={draft.targetHours} onChange={(e) => setDraft({ ...draft, targetHours: Number(e.target.value) })}/></label><label><span>Interne Kosten CHF/h</span><input type="number" min="0" step="0.05" value={draft.internalCostRate} onChange={(e) => setDraft({ ...draft, internalCostRate: Number(e.target.value) })}/></label><div className="form-toggle-field"><span>Aktiv</span><Toggle label="Mitarbeitende aktiv" checked={draft.status === 'active'} onChange={(value) => setDraft({ ...draft, status: value ? 'active' : 'inactive' })}/></div></div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Speichern</button></div></form></div>
}

function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0]).join('').toUpperCase() }
function roleLabel(value: string) { if (value === 'owner') return 'Inhaber'; if (value === 'admin') return 'Admin'; if (value === 'finance') return 'Buchhaltung'; return 'Mitarbeiter' }
