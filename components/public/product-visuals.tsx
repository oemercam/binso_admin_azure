import type { ReactNode } from 'react'
import { BinsoLogo } from '@/components/ui/binso-logo'

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

function DesktopDashboard({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'marketing-dashboard compact' : 'marketing-dashboard'}>
      <aside>
        <div className="marketing-dashboard-brand"><BinsoLogo /></div>
        <nav>
          <span className="active"><i />Ãœbersicht</span>
          <span><i />Kunden</span>
          <span><i />Angebote</span>
          <span><i />AuftrÃ¤ge</span>
          <span><i />Zeiterfassung</span>
          <span><i />Rechnungen</span>
          <span><i />Mitarbeitende</span>
        </nav>
      </aside>
      <div className="marketing-dashboard-main">
        <div className="marketing-dashboard-top"><span>Ãœbersicht</span><div><i /><i /></div></div>
        <div className="marketing-dashboard-heading"><div><small>Heute</small><strong>Willkommen zurÃ¼ck</strong></div><span className="marketing-dashboard-new-action">+ Neu</span></div>
        <div className="marketing-dashboard-kpis">
          <article><span>Offene AuftrÃ¤ge</span><strong>12</strong><small>+ 3 diese Woche</small></article>
          <article><span>Erfasste Stunden</span><strong>142 h</strong><small>+ 12 %</small></article>
          <article><span>Umsatz Monat</span><strong>CHF 24â€™830</strong><small>+ 18 %</small></article>
        </div>
        <div className="marketing-dashboard-grid">
          <section>
            <div className="marketing-card-head"><span>Umsatzentwicklung</span><small>6 Monate</small></div>
            <div className="marketing-line-chart"><i/><i/><i/><i/><i/><i/></div>
          </section>
          <section>
            <div className="marketing-card-head"><span>Aktuelle AuftrÃ¤ge</span><small>Alle</small></div>
            <div className="marketing-task-list"><span><i/>Website Relaunch</span><span><i/>IT-Beratung</span><span><i/>Support & Wartung</span></div>
          </section>
        </div>
      </div>
    </div>
  )
}

function MobileDashboard() {
  return (
    <div className="marketing-phone-ui">
      <div className="marketing-phone-status"><span>9:41</span><i /></div>
      <div className="marketing-phone-brand"><BinsoLogo /><span>â€¢â€¢â€¢</span></div>
      <div className="marketing-phone-welcome"><small>Heute</small><strong>Guten Morgen</strong><span>Hier ist dein Ãœberblick.</span></div>
      <div className="marketing-phone-kpis"><article><span>AuftrÃ¤ge</span><strong>12</strong></article><article><span>Stunden</span><strong>142 h</strong></article><article><span>Umsatz</span><strong>CHF 24â€™830</strong></article></div>
      <div className="marketing-phone-tasks"><strong>Meine Aufgaben</strong><span><i/>Angebot versenden</span><span><i/>Rechnung erstellen</span><span><i/>Zeit erfassen</span></div>
      <div className="marketing-phone-nav"><span>Ãœbersicht</span><span>Kunden</span><span>Zeit</span><span>Mehr</span></div>
    </div>
  )
}

export function DashboardProductVisual() {
  return (
    <div className="landing-device-stage" aria-label="Vorschau der Binso One Anwendung auf Desktop und Mobile">
      <div className="landing-laptop">
        <div className="landing-laptop-screen"><DesktopDashboard /></div>
        <div className="landing-laptop-base" />
      </div>
      <div className="landing-phone"><MobileDashboard /></div>
    </div>
  )
}

export function LandingProofVisual() {
  return (
    <div className="landing-proof-visual" aria-label="Binso One Dashboard Vorschau">
      <div className="landing-proof-window">
        <div className="landing-proof-window-bar"><span/><span/><span/><b><BinsoLogo /></b></div>
        <DesktopDashboard compact />
      </div>
      <div className="landing-proof-callout"><strong>Alles verbunden</strong><span>Kunden, AuftrÃ¤ge, Zeiten und Rechnungen greifen ineinander.</span></div>
    </div>
  )
}

const stories = [
  { title: 'Angebot bis Rechnung', text: 'Angebote erstellen, in AuftrÃ¤ge Ã¼bernehmen und erfasste Leistungen direkt weiterverrechnen.', icon: 'quotes' as const, className: 'blue' },
  { title: 'Zeit und Team', text: 'Arbeitszeit projektbezogen erfassen und Mitarbeitende mit klaren Rollen organisieren.', icon: 'time' as const, className: 'green' },
  { title: 'Kunden und VertrÃ¤ge', text: 'Kontakte, Firmen, VertrÃ¤ge und wiederkehrende Leistungen zentral verwalten.', icon: 'customers' as const, className: 'violet' },
]

export function FeatureStoryVisual() {
  return (
    <div className="landing-story-grid">
      {stories.map((story) => (
        <article className={`landing-story-card ${story.className}`} key={story.title}>
          <div className="landing-story-icon"><ProductIcon name={story.icon} /></div>
          <div><h3>{story.title}</h3><p>{story.text}</p></div>
          <div className="landing-story-ui" aria-hidden="true"><span/><span/><span/></div>
        </article>
      ))}
    </div>
  )
}

const workflow = [
  ['01', 'Anfrage', 'Anfrage erfassen und zuordnen'],
  ['02', 'Angebot', 'Leistung und Preis festlegen'],
  ['03', 'Auftrag', 'Annahme direkt weiterfÃ¼hren'],
  ['04', 'Zeit & Leistung', 'Arbeit laufend erfassen'],
  ['05', 'Rechnung', 'Leistungen Ã¼bernehmen'],
  ['06', 'Zahlung', 'Offene BetrÃ¤ge verfolgen'],
] as const

export function BusinessFlowVisual() {
  return (
    <div className="business-flow-visual landing-process" aria-label="GeschÃ¤ftsprozess von der Anfrage bis zur Zahlung">
      {workflow.map(([number, title, detail], index) => (
        <div className="business-flow-step" key={title}>
          <div className="business-flow-node"><span>{number}</span><strong>{title}</strong><small>{detail}</small></div>
          {index < workflow.length - 1 ? <div className="business-flow-connector" aria-hidden="true"><i /><b>â†’</b></div> : null}
        </div>
      ))}
    </div>
  )
}

export function OnboardingVisual() {
  const steps = [
    ['Konto erstellen', 'GeschÃ¤ftliche E-Mail und sichere Anmeldung'],
    ['Unternehmen einrichten', 'Nur die wichtigsten Angaben fÃ¼r den Start'],
    ['Ersten Kunden erfassen', 'Direkt mit echten GeschÃ¤ftsdaten arbeiten'],
    ['Ablauf starten', 'Angebot, Auftrag und Rechnung durchgÃ¤ngig weiterfÃ¼hren'],
  ] as const

  return (
    <div className="onboarding-visual landing-onboarding-visual">
      <div className="onboarding-progress"><span>Einrichtung</span><strong>75%</strong><i><b /></i></div>
      <div className="onboarding-steps">
        {steps.map(([title, detail], index) => <div key={title} className={index < 3 ? 'done' : ''}><span>{index < 3 ? 'âœ“' : '4'}</span><div><strong>{title}</strong><small>{detail}</small></div></div>)}
      </div>
    </div>
  )
}
