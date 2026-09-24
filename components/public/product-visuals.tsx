import type { ReactNode } from 'react'

type IconName = 'customers' | 'quotes' | 'orders' | 'time' | 'invoices' | 'employees' | 'contracts' | 'finance'

function ProductIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    customers: <><circle cx="8" cy="8" r="3" /><path d="M3.5 17.5c.7-3 2.4-4.5 4.5-4.5s3.8 1.5 4.5 4.5" /><path d="M14.5 6.5h5M17 4v5" /></>,
    quotes: <><path d="M6 3.5h9l3 3v14H6z" /><path d="M15 3.5v4h4" /><path d="M9 11h6M9 15h6" /></>,
    orders: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3.5v3M16 3.5v3M4 9h16M8 13h3M8 16h6" /></>,
    time: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></>,
    invoices: <><path d="M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    employees: <><circle cx="9" cy="8" r="3" /><circle cx="16" cy="9" r="2.5" /><path d="M3.5 18c.8-3.3 2.7-5 5.5-5 2.7 0 4.6 1.7 5.5 5M14 14c2.8-.5 5 1 6 4" /></>,
    contracts: <><path d="M6 3.5h9l3 3v14H6z" /><path d="M15 3.5v4h4M9 11h6M9 15h4" /><path d="m13 18 1.2 1.2L17 16.5" /></>,
    finance: <><path d="M4 19.5h16M6 16V11M10 16V7M14 16v-3M18 16V5" /></>,
  }

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function DashboardProductVisual() {
  return (
    <div className="product-visual-stage" aria-label="Vorschau der Binso One Anwendung">
      <div className="product-browser-frame">
        <div className="product-browser-bar">
          <div className="product-browser-dots"><span /><span /><span /></div>
          <span className="product-browser-address">app.binso.one</span>
          <span className="product-browser-status">Live</span>
        </div>
        <div className="product-app-frame">
          <aside className="product-app-sidebar">
            <div className="product-app-brand"><span className="product-app-mark">B</span><strong>One</strong></div>
            <div className="product-app-nav">
              <span className="active"><i />Übersicht</span>
              <span><i />Kunden</span>
              <span><i />Angebote</span>
              <span><i />Aufträge</span>
              <span><i />Zeiterfassung</span>
              <span><i />Rechnungen</span>
            </div>
          </aside>
          <div className="product-app-content">
            <div className="product-app-topline"><span>Übersicht</span><div><i /><i /></div></div>
            <div className="product-app-title"><div><small>Mittwoch, 24. September</small><strong>Guten Morgen</strong></div><button type="button" tabIndex={-1}>+ Neu</button></div>
            <div className="product-kpis">
              <article><span>Offene Angebote</span><strong>CHF 24’800</strong><small>8 Angebote</small></article>
              <article><span>Laufende Aufträge</span><strong>12</strong><small>4 diese Woche</small></article>
              <article><span>Offene Rechnungen</span><strong>CHF 18’420</strong><small>6 Rechnungen</small></article>
            </div>
            <div className="product-app-grid">
              <section className="product-chart-card">
                <div className="product-card-head"><span>Umsatz</span><small>Letzte 6 Monate</small></div>
                <div className="product-chart-bars"><i style={{height:'34%'}}/><i style={{height:'48%'}}/><i style={{height:'42%'}}/><i style={{height:'64%'}}/><i style={{height:'72%'}}/><i style={{height:'88%'}}/></div>
              </section>
              <section className="product-focus-card">
                <div className="product-card-head"><span>Heute im Fokus</span><small>3 Punkte</small></div>
                <div className="product-focus-list"><span><i/>Angebot prüfen</span><span><i/>Zeiten freigeben</span><span><i/>Rechnung senden</span></div>
              </section>
            </div>
          </div>
        </div>
      </div>
      <div className="product-phone-frame" aria-hidden="true">
        <div className="product-phone-status"><span>9:41</span><i /></div>
        <div className="product-phone-head"><strong>One</strong><span>•••</span></div>
        <div className="product-phone-copy"><small>Heute</small><strong>Übersicht</strong></div>
        <div className="product-phone-metric"><span>Offene Rechnungen</span><strong>CHF 18’420</strong></div>
        <div className="product-phone-list"><span><i/>Kunden</span><span><i/>Aufträge</span><span><i/>Zeit erfassen</span></div>
        <div className="product-phone-pill"><span>Suchen</span><b>+</b><span>Menü</span></div>
      </div>
    </div>
  )
}

export const featureVisuals: Array<{ title: string; text: string; icon: IconName; meta: string }> = [
  { title: 'Kunden', text: 'Kontakte und Firmen an einem Ort verwalten.', icon: 'customers', meta: 'CRM' },
  { title: 'Angebote', text: 'Angebote schnell erstellen und direkt weiterführen.', icon: 'quotes', meta: 'Verkauf' },
  { title: 'Aufträge', text: 'Arbeit, Zuständigkeiten und Status übersichtlich organisieren.', icon: 'orders', meta: 'Ausführung' },
  { title: 'Zeiterfassung', text: 'Arbeitszeit direkt auf Kunden und Aufträge erfassen.', icon: 'time', meta: 'Leistung' },
  { title: 'Rechnungen', text: 'Leistungen übernehmen, verrechnen und nachverfolgen.', icon: 'invoices', meta: 'Abrechnung' },
  { title: 'Mitarbeitende', text: 'Teams, Rollen und Zugriffe zentral verwalten.', icon: 'employees', meta: 'Team' },
  { title: 'Verträge', text: 'Laufzeiten und wiederkehrende Leistungen im Blick behalten.', icon: 'contracts', meta: 'Verträge' },
  { title: 'Finanzen', text: 'Offene Beträge und wichtige Kennzahlen kompakt überblicken.', icon: 'finance', meta: 'Finanzen' },
]

export function FeatureVisualGrid() {
  return (
    <div className="feature-visual-grid">
      {featureVisuals.map((feature) => (
        <article key={feature.title} className="feature-visual-card">
          <div className="feature-visual-icon"><ProductIcon name={feature.icon} /></div>
          <div className="feature-visual-meta">{feature.meta}</div>
          <h3>{feature.title}</h3>
          <p>{feature.text}</p>
          <div className="feature-mini-ui" aria-hidden="true"><span/><span/><span/></div>
        </article>
      ))}
    </div>
  )
}

const workflow = [
  ['01', 'Kunde', 'Kontakt und Firma erfassen'],
  ['02', 'Angebot', 'Leistung und Preis festlegen'],
  ['03', 'Auftrag', 'Annahme direkt weiterführen'],
  ['04', 'Zeit & Leistung', 'Arbeit laufend erfassen'],
  ['05', 'Rechnung', 'Leistungen automatisch übernehmen'],
  ['06', 'Zahlung', 'Offene Beträge im Blick behalten'],
] as const

export function BusinessFlowVisual() {
  return (
    <div className="business-flow-visual" aria-label="Geschäftsprozess vom Kunden bis zur Zahlung">
      {workflow.map(([number, title, detail], index) => (
        <div className="business-flow-step" key={title}>
          <div className="business-flow-node"><span>{number}</span><strong>{title}</strong><small>{detail}</small></div>
          {index < workflow.length - 1 ? <div className="business-flow-connector" aria-hidden="true"><i /><b>→</b></div> : null}
        </div>
      ))}
    </div>
  )
}

export function OnboardingVisual() {
  const steps = [
    ['Konto erstellen', 'Geschäftliche E-Mail und sichere Anmeldung'],
    ['Unternehmen einrichten', 'Nur die wichtigsten Angaben für den Start'],
    ['Ersten Kunden erfassen', 'Direkt mit echten Geschäftsdaten arbeiten'],
    ['Ablauf starten', 'Angebot, Auftrag und Rechnung durchgängig weiterführen'],
  ] as const

  return (
    <div className="onboarding-visual">
      <div className="onboarding-progress"><span>Einrichtung</span><strong>75%</strong><i><b /></i></div>
      <div className="onboarding-steps">
        {steps.map(([title, detail], index) => <div key={title} className={index < 3 ? 'done' : ''}><span>{index < 3 ? '✓' : '4'}</span><div><strong>{title}</strong><small>{detail}</small></div></div>)}
      </div>
    </div>
  )
}
