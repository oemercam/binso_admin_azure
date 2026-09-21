import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { orders, employees } from '@/lib/data/demo'
import {
  orderAssignmentRules,
  orderPolicies,
  timeEvidence,
} from '@/lib/data/order-policies'
import { resolveTimeTrackingPolicy } from '@/modules/orders/policies'

function yesNo(value: boolean) {
  return value ? 'Aktiv' : 'Nicht aktiv'
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = orders.find((item) => item.id === id)
  if (!order) notFound()

  const policy = orderPolicies.find((item) => item.orderId === id)
  const assignments = orderAssignmentRules.filter((item) => item.orderId === id)
  const evidence = timeEvidence.filter((item) => item.orderId === id)

  return (
    <section className="page">
      <div className="detail-back-row">
        <Link className="text-link" href="/orders">
          ← Aufträge
        </Link>
      </div>

      <div className="page-title">
        <div>
          <p className="eyebrow">AUFTRAG</p>
          <h1>{order.name}</h1>
          <p className="page-description">
            {order.customerName}
            {order.endCustomerName ? ` · Endkunde: ${order.endCustomerName}` : ''}
          </p>
        </div>
        <span className="status status-good">Aktiv</span>
      </div>

      <nav className="detail-tabs" aria-label="Auftragsbereiche">
        <a href="#overview">Übersicht</a>
        <a href="#time">Zeiterfassung</a>
        <a href="#people">Mitarbeitende</a>
        <a href="#billing">Abrechnung</a>
        <a href="#evidence">Nachweise</a>
      </nav>

      <section id="overview" className="section-block">
        <div className="section-title"><div><h2>Vertrags- und Leistungskette</h2><p>Wer beauftragt wen und wer erbringt die Leistung.</p></div></div>
        {policy?.contractChain ? (
          <div className="chain-list">
            {policy.contractChain.parties.map((party, index) => (
              <div key={party.id} className="chain-item">
                <span className="chain-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="primary-cell"><strong>{party.name}</strong><small>{party.role.replaceAll('_', ' ')}</small></span>
                {index < policy.contractChain!.parties.length - 1 && <Icon name="chevron" size={15} />}
              </div>
            ))}
          </div>
        ) : <p className="muted">Keine spezielle Leistungskette hinterlegt.</p>}
      </section>

      {policy && (
        <section id="time" className="section-block">
          <div className="section-title"><div><h2>Zeiterfassungsregeln</h2><p>Standard für diesen Auftrag. Mitarbeiter-Overrides werden darunter separat ausgewiesen.</p></div></div>
          <div className="rule-grid">
            <Rule label="Erfassung" value={policy.timeTracking.mode === 'both' ? 'Binso + Kundensystem' : policy.timeTracking.mode === 'internal' ? 'Binso Admin' : 'Kundensystem'} />
            <Rule label="Rundung" value={`${policy.timeTracking.bookingIntervalMinutes} Minuten`} />
            <Rule label="Beschreibung Pflicht" value={yesNo(policy.timeTracking.requireDescription)} />
            <Rule label="Nachweis erforderlich" value={yesNo(policy.timeTracking.evidence.required)} />
            <Rule label="Rhythmus" value={policy.timeTracking.evidence.frequency} />
            <Rule label="Unterschrift" value={yesNo(policy.timeTracking.evidence.signatureRequired)} />
            <Rule label="Kundenfreigabe" value={yesNo(policy.timeTracking.evidence.customerApprovalRequired)} />
            <Rule label="Fakturierung blockieren" value={yesNo(policy.timeTracking.evidence.blockBillingWhenMissing)} />
          </div>
        </section>
      )}

      <section id="people" className="section-block">
        <div className="section-title"><div><h2>Mitarbeitende und Overrides</h2><p>Die Auftragsregel gilt standardmässig. Abweichungen werden pro Person hinterlegt.</p></div></div>
        <div className="data-list">
          <div className="data-row data-head assignment-grid"><span>Person</span><span>Typ</span><span>Zeiterfassung</span><span>Nachweis</span></div>
          {assignments.map((assignment) => {
            const person = employees.find((item) => item.id === assignment.personId)
            const effective = policy ? resolveTimeTrackingPolicy(policy, assignment) : undefined
            return (
              <div className="data-row assignment-grid" key={`${assignment.orderId}-${assignment.personId}`}>
                <span className="primary-cell"><strong>{person?.name ?? (assignment.personId === 'ext-001' ? 'Dario Meier / Meier Cloud Consulting GmbH' : assignment.personId)}</strong><small>{assignment.providerType.replaceAll('_', ' ')}</small></span>
                <span>{assignment.providerType}</span>
                <span>{effective?.mode ?? '—'}</span>
                <span>{effective?.evidence.required ? `${effective.evidence.frequency} · Pflicht` : 'Nicht erforderlich'}</span>
              </div>
            )
          })}
        </div>
      </section>

      {policy && (
        <section id="billing" className="section-block">
          <div className="section-title"><div><h2>Abrechnung</h2><p>Regeln für die spätere Fakturierung.</p></div></div>
          <div className="rule-grid">
            <Rule label="Modell" value={policy.billing.model} />
            <Rule label="Rechnungsdarstellung" value={policy.billing.invoiceGrouping} />
            <Rule label="Stundenauszug" value={yesNo(policy.billing.attachTimesheet)} />
            <Rule label="PO / Bestellnummer Pflicht" value={yesNo(policy.billing.purchaseOrderRequired)} />
            <Rule label="Leistungsperiode Pflicht" value={yesNo(policy.billing.servicePeriodRequired)} />
            <Rule label="Rechnungsfreigabe ab" value={policy.approval.invoiceApprovalThreshold ? `CHF ${policy.approval.invoiceApprovalThreshold.toLocaleString('de-CH')}` : 'Keine Schwelle'} />
          </div>
        </section>
      )}

      <section id="evidence" className="section-block">
        <div className="section-title"><div><h2>Zeitnachweise</h2><p>Hochgeladene externe Rapporte für diesen Auftrag.</p></div></div>
        <div className="compact-list">
          {evidence.length ? evidence.map((item) => (
            <div key={item.id}>
              <span className="primary-cell"><strong>{item.fileName}</strong><small>{item.periodDate} · {item.signed ? 'signiert' : 'nicht signiert'}</small></span>
              <span>{item.status}</span>
              <span>{item.customerApproved ? 'Kunde bestätigt' : 'Freigabe offen'}</span>
            </div>
          )) : <p className="muted">Keine Nachweise vorhanden.</p>}
        </div>
      </section>
    </section>
  )
}

function Rule({ label, value }: { label: string; value: string }) {
  return <div className="rule-item"><span>{label}</span><strong>{value}</strong></div>
}
