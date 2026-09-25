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
          <span className="active"><i />Übersicht</span>
          <span><i />Kunden</span>
          <span><i />Angebote</span>
          <span><i />Aufträge</span>
          <span><i />Zeiterfassung</span>
          <span><i />Rechnungen</span>
          <span><i />Mitarbeitende</span>
        </nav>
      </aside>
      <div className="marketing-dashboard-main">
        <div className="marketing-dashboard-top"><span>Übersicht</span><div><i /><i /></div></div>
        <div className="marketing-dashboard-heading"><div><small>Heute</small><strong>Willkommen zurück</strong></div><span className="marketing-dashboard-new-action">+ Neu</span></div>
        <div className="marketing-dashboard-kpis">
          <article><span>Offene Aufträge</span><strong>12</strong><small>+ 3 diese Woche</small></article>
          <article><span>Erfasste Stunden</span><strong>142 h</strong><small>+ 12 %</small></article>
          <article><span>Umsatz Monat</span><strong>CHF 24’830</strong><small>+ 18 %</small></article>
        </div>
        <div className="marketing-dashboard-grid">
          <section>
            <div className="marketing-card-head"><span>Umsatzentwicklung</span><small>6 Monate</small></div>
            <div className="marketing-line-chart"><i/><i/><i/><i/><i/><i/></div>
          </section>
          <section>
            <div className="marketing-card-head"><span>Aktuelle Aufträge</span><small>Alle</small></div>
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
      <div className="marketing-phone-brand"><BinsoLogo /><span>•••</span></div>
      <div className="marketing-phone-welcome"><small>Heute</small><strong>Guten Morgen</strong><span>Hier ist dein Überblick.</span></div>
      <div className="marketing-phone-kpis"><article><span>Aufträge</span><strong>12</strong></article><article><span>Stunden</span><strong>142 h</strong></article><article><span>Umsatz</span><strong>CHF 24’830</strong></article></div>
      <div className="marketing-phone-tasks"><strong>Meine Aufgaben</strong><span><i/>Angebot versenden</span><span><i/>Rechnung erstellen</span><span><i/>Zeit erfassen</span></div>
      <div className="marketing-phone-nav"><span>Übersicht</span><span>Kunden</span><span>Zeit</span><span>Mehr</span></div>
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
    </div>
  )
}

function CustomerListVisual() {
  return (
    <div className="landing-feature-ui landing-feature-ui-customers" aria-hidden="true">
      <div className="landing-feature-ui-head"><span>Kunden</span><b>+ Neuer Kunde</b></div>
      <div className="landing-feature-search">Kunden suchen …</div>
      <div className="landing-feature-list">
        <span><i>A</i><strong>Acme GmbH</strong><small>Zürich</small><b>Aktiv</b></span>
        <span><i>M</i><strong>Müller AG</strong><small>Bern</small><b>Aktiv</b></span>
        <span><i>C</i><strong>Creative Minds</strong><small>Luzern</small><b>Aktiv</b></span>
      </div>
    </div>
  )
}

function QuoteOrderVisual() {
  return (
    <div className="landing-feature-ui landing-feature-ui-quotes" aria-hidden="true">
      <div className="landing-feature-ui-head"><span>Angebote</span><b>+ Neues Angebot</b></div>
      <div className="landing-feature-tabs"><i>Alle</i><span>Offen</span><span>Angenommen</span></div>
      <div className="landing-feature-table">
        <span><strong>Website Relaunch</strong><small>Acme GmbH</small><b>CHF 12’450.–</b><em>Offen</em></span>
        <span><strong>IT-Beratung</strong><small>Müller AG</small><b>CHF 8’900.–</b><em>Angenommen</em></span>
        <span><strong>Support</strong><small>Creative Minds</small><b>CHF 3’250.–</b><em>Offen</em></span>
      </div>
    </div>
  )
}

function TimeInvoiceVisual() {
  return (
    <div className="landing-feature-duo" aria-hidden="true">
      <div className="landing-time-visual">
        <span>Zeiterfassung</span>
        <strong>00:24:17</strong>
        <small>Website Relaunch · Acme GmbH</small>
        <div><i>▶</i><b>Timer läuft</b></div>
      </div>
      <div className="landing-invoice-visual">
        <span>Rechnung RE-2026-004</span>
        <strong>CHF 12’450.–</strong>
        <small>Acme GmbH</small>
        <div><i>✓</i><b>Bezahlt</b></div>
      </div>
    </div>
  )
}

const stories = [
  {
    eyebrow: 'Kunden und Kontakte',
    title: 'Alle Kundeninformationen an einem Ort.',
    text: 'Kontakte, Firmen und die wichtigsten Informationen bleiben übersichtlich zusammen. So ist sofort sichtbar, mit wem du arbeitest und was als Nächstes ansteht.',
    bullets: ['Zentrale Kundenübersicht', 'Kontakte und Firmen zusammen verwalten', 'Direkter Einstieg in Angebote und Aufträge'],
    icon: 'customers' as const,
    tone: 'blue',
    visual: <CustomerListVisual />,
  },
  {
    eyebrow: 'Angebote und Aufträge',
    title: 'Von der Anfrage direkt in die Umsetzung.',
    text: 'Erstelle Angebote, führe angenommene Leistungen als Auftrag weiter und behalte den Status im Blick – ohne Informationen nochmals erfassen zu müssen.',
    bullets: ['Professionelle Angebote', 'Direkte Übernahme in Aufträge', 'Klare Status und nächste Schritte'],
    icon: 'quotes' as const,
    tone: 'violet',
    visual: <QuoteOrderVisual />,
  },
  {
    eyebrow: 'Zeit, Rechnungen und Finanzen',
    title: 'Erfasste Arbeit wird zur Rechnung.',
    text: 'Arbeitszeiten und Leistungen werden dort erfasst, wo sie entstehen. Daraus lassen sich Rechnungen erstellen und offene Beträge nachvollziehen.',
    bullets: ['Zeit per Timer oder manuell erfassen', 'Leistungen direkt weiterverrechnen', 'Zahlungsstatus im Blick behalten'],
    icon: 'time' as const,
    tone: 'green',
    visual: <TimeInvoiceVisual />,
  },
]

export function FeatureStoryVisual() {
  return (
    <div className="landing-feature-sequence">
      {stories.map((story, index) => (
        <article className={`landing-feature-row ${story.tone} ${index % 2 ? 'visual-first' : ''}`} key={story.title}>
          <div className="landing-feature-copy">
            <div className="landing-feature-kicker"><span><ProductIcon name={story.icon} /></span>{story.eyebrow}</div>
            <h3>{story.title}</h3>
            <p>{story.text}</p>
            <ul>{story.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
          </div>
          <div className="landing-feature-visual">{story.visual}</div>
        </article>
      ))}
    </div>
  )
}

const workflow = [
  ['01', 'Kunde', 'Kontakt erfassen', 'customers' as const, 'blue'],
  ['02', 'Angebot', 'Leistung festlegen', 'quotes' as const, 'violet'],
  ['03', 'Auftrag', 'Arbeit starten', 'orders' as const, 'green'],
  ['04', 'Zeit', 'Leistung erfassen', 'time' as const, 'blue'],
  ['05', 'Rechnung', 'Abrechnung erstellen', 'invoices' as const, 'violet'],
  ['06', 'Zahlung', 'Eingang verfolgen', 'finance' as const, 'green'],
] as const

export function BusinessFlowVisual() {
  return (
    <div className="landing-process-line" aria-label="Geschäftsprozess vom Kundenkontakt bis zur Zahlung">
      <div className="landing-process-track" aria-hidden="true" />
      {workflow.map(([number, title, detail, icon, tone]) => (
        <div className={`landing-process-step ${tone}`} key={title}>
          <span className="landing-process-number">{number}</span>
          <span className="landing-process-icon"><ProductIcon name={icon} /></span>
          <strong>{title}</strong>
          <small>{detail}</small>
        </div>
      ))}
    </div>
  )
}

export function OnboardingVisual() {
  const steps = [
    ['01', 'Registrieren', 'Zugang erstellen und Identität bestätigen.'],
    ['02', 'Firma einrichten', 'Die wichtigsten Unternehmensdaten erfassen.'],
    ['03', 'Ersten Ablauf starten', 'Kunde erfassen und direkt weiterarbeiten.'],
    ['04', 'Produktiv arbeiten', 'Angebote, Aufträge, Zeiten und Rechnungen verbinden.'],
  ] as const

  return (
    <div className="landing-onboarding-modern" aria-label="Einrichtung von Binso One in vier Schritten">
      <div className="landing-onboarding-progress" aria-hidden="true">
        <div><span>Einrichtung</span><strong>04 Schritte</strong></div>
        <i><b /></i>
      </div>
      <div className="landing-onboarding-path">
        {steps.map(([number, title, detail], index) => (
          <div className="landing-onboarding-node" key={title}>
            <div className="landing-onboarding-number"><span>{number}</span>{index < steps.length - 1 ? <i aria-hidden="true" /> : null}</div>
            <div><strong>{title}</strong><small>{detail}</small></div>
          </div>
        ))}
      </div>
      <div className="landing-onboarding-ready" aria-hidden="true">
        <span>Bereit</span>
        <strong>Dein Arbeitsbereich steht.</strong>
        <div><i /><i /><i /></div>
      </div>
    </div>
  )
}
