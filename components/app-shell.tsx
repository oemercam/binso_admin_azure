import Link from "next/link";
import { Icon, Logo } from "./ui";

const nav = [
  ["/dashboard","Start","home"], ["/kunden","Kunden","users"], ["/angebote","Angebote","file"], ["/rechnungen","Rechnungen","receipt"], ["/zahlungen","Zahlungen","wallet"], ["/produkte","Produkte","box"], ["/zeit","Zeiterfassung","clock"], ["/spesen","Spesen","card"], ["/mitarbeiter","Mitarbeiter","users"]
] as const;

export function AppShell({ title, subtitle, active, children, actions }: { title: string; subtitle?: string; active: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return <div className="app-root">
    <aside className="app-sidebar">
      <Link href="/dashboard" className="sidebar-logo"><Logo /></Link>
      <nav>{nav.map(([href,label,icon])=><Link key={href} href={href} className={active===href.slice(1)?"active":""}><Icon name={icon}/><span>{label}</span></Link>)}</nav>
      <div className="sidebar-bottom"><Link href="/support"><Icon name="support"/><span>Support</span></Link><Link href="/einstellungen"><Icon name="settings"/><span>Einstellungen</span></Link></div>
    </aside>
    <div className="app-main">
      <header className="mobile-header"><Link href="/dashboard"><Logo /></Link><div><button aria-label="Suche"><Icon name="search"/></button><button aria-label="Benachrichtigungen"><Icon name="bell"/></button><span className="avatar">TM</span></div></header>
      <main className="page-container"><div className="page-head"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>{children}</main>
      <nav className="bottom-nav">
        <Link href="/dashboard" className={active==="dashboard"?"active":""}><Icon name="home"/><span>Start</span></Link>
        <Link href="/kunden" className={active==="kunden"?"active":""}><Icon name="users"/><span>Kunden</span></Link>
        <Link href="/rechnungen" className={["angebote","rechnungen","zahlungen"].includes(active)?"active":""}><Icon name="receipt"/><span>Belege</span></Link>
        <Link href="/zeit" className={active==="zeit"?"active":""}><Icon name="clock"/><span>Zeit</span></Link>
        <Link href="/einstellungen" className={["produkte","spesen","mitarbeiter","support","einstellungen"].includes(active)?"active":""}><Icon name="more"/><span>Mehr</span></Link>
      </nav>
    </div>
  </div>;
}
