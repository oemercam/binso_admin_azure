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
