"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Icon, IconButton, Logo } from "./ui";

const desktopNav = [
  ["/dashboard","Start","home"],
  ["/kunden","Kunden","users"],
  ["/angebote","Angebote","file"],
  ["/rechnungen","Rechnungen","receipt"],
  ["/zahlungen","Zahlungen","wallet"],
  ["/produkte","Produkte","box"],
  ["/zeit","Zeiterfassung","clock"],
  ["/spesen","Spesen","card"],
  ["/mitarbeiter","Mitarbeiter","users"],
] as const;

const searchItems = [
  { type: "Kunde", title: "Acme AG", meta: "Zürich · Aktiv", href: "/kunden/acme", icon: "users" },
  { type: "Rechnung", title: "RE-2026-019", meta: "Acme AG · CHF 4’346.40", href: "/rechnungen/RE-2026-019", icon: "receipt" },
  { type: "Angebot", title: "AN-2026-012", meta: "Acme AG · CHF 7’264.32", href: "/angebote/AN-2026-012", icon: "file" },
  { type: "Ticket", title: "#5832 · Frage zur Rechnung", meta: "Offen", href: "/support/5832", icon: "support" },
];

export function AppShell({
  title,
  subtitle,
  active,
  children,
  actions,
  backHref,
  backLabel = "Zurück",
}: {
  title: string;
  subtitle?: string;
  active: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const [sheet, setSheet] = useState<"more" | "docs" | "search" | "notifications" | null>(null);
  const [query, setQuery] = useState("");
  const [timerRunning, setTimerRunning] = useState(() => typeof window === "undefined" ? true : window.localStorage.getItem("binso.timer.running") !== "false");
  const [dark, setDark] = useState(() => typeof window === "undefined" ? false : window.localStorage.getItem("binso.theme") === "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheet]);

  const filtered = useMemo(() => {
    if (!query.trim()) return searchItems;
    const q = query.toLowerCase();
    return searchItems.filter(item => `${item.type} ${item.title} ${item.meta}`.toLowerCase().includes(q));
  }, [query]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("binso.theme", next ? "dark" : "light");
  }

  function stopTimer() {
    setTimerRunning(false);
    window.localStorage.setItem("binso.timer.running", "false");
  }

  return <div className="app-root">
    <aside className="app-sidebar">
      <Link href="/dashboard" className="sidebar-logo"><Logo /></Link>
      <nav>
        {desktopNav.map(([href,label,icon]) =>
          <Link key={href} href={href} className={active===href.slice(1) ? "active" : ""}>
            <Icon name={icon}/><span>{label}</span>
          </Link>
        )}
      </nav>
      <div className="sidebar-bottom">
        <Link href="/support" className={active==="support" ? "active" : ""}><Icon name="support"/><span>Support</span></Link>
        <Link href="/einstellungen" className={active==="einstellungen" ? "active" : ""}><Icon name="settings"/><span>Einstellungen</span></Link>
      </div>
    </aside>

    <div className="app-main">
      <header className="mobile-header">
        <div className="mobile-header-leading">
          {backHref ? <Link className="mobile-back" href={backHref} aria-label={backLabel}><Icon name="back"/></Link> : <Link href="/dashboard"><Logo /></Link>}
          {backHref && <span className="mobile-header-title">{title}</span>}
        </div>
        <div className="mobile-header-actions">
          <IconButton label="Suche" icon="search" onClick={() => setSheet("search")}/>
          <IconButton label="Benachrichtigungen" icon="bell" onClick={() => setSheet("notifications")}/>
          <span className="avatar">TM</span>
        </div>
      </header>

      <main className="page-container">
        <div className={backHref ? "page-head page-head-detail" : "page-head"}>
          <div>
            {backHref && <Link className="desktop-back" href={backHref}><Icon name="back" size={16}/>{backLabel}</Link>}
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
        {children}
      </main>

      {timerRunning && <div className="global-timer" role="status">
        <div className="global-timer-main"><i/><div><small>Zeitmessung läuft</small><span>Website Redesign · Acme AG</span></div></div>
        <b>02:14:27</b>
        <button type="button" onClick={stopTimer} aria-label="Zeitmessung stoppen"><Icon name="stop" size={16}/><span>Stoppen</span></button>
      </div>}

      <nav className="bottom-nav" aria-label="Hauptnavigation">
        <Link href="/dashboard" className={active==="dashboard"?"active":""}><Icon name="home"/><span>Start</span></Link>
        <Link href="/kunden" className={active==="kunden"?"active":""}><Icon name="users"/><span>Kunden</span></Link>
        <button type="button" className={["angebote","rechnungen","zahlungen","belege"].includes(active)?"active":""} onClick={() => setSheet("docs")}><Icon name="receipt"/><span>Belege</span></button>
        <Link href="/zeit" className={active==="zeit"?"active":""}><Icon name="clock"/><span>Zeit</span></Link>
        <button type="button" className={["produkte","spesen","mitarbeiter","support","einstellungen"].includes(active)?"active":""} onClick={() => setSheet("more")}><Icon name="more"/><span>Mehr</span></button>
      </nav>

      {sheet && <div className="sheet-layer" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSheet(null); }}>
        <section className={sheet === "search" ? "bottom-sheet search-sheet" : "bottom-sheet"} role="dialog" aria-modal="true" aria-label={sheet === "more" ? "Mehr" : sheet === "docs" ? "Belege" : sheet === "search" ? "Suche" : "Benachrichtigungen"}>
          <div className="sheet-handle"/>
          <header className="sheet-header">
            <div>
              <h2>{sheet === "more" ? "Mehr" : sheet === "docs" ? "Belege" : sheet === "search" ? "Suche" : "Benachrichtigungen"}</h2>
              {sheet === "docs" && <p>Dokumente und Zahlungen direkt öffnen.</p>}
            </div>
            <IconButton label="Schliessen" icon="close" onClick={() => setSheet(null)}/>
          </header>

          {sheet === "docs" && <div className="sheet-menu">
            <SheetLink href="/angebote" icon="file" title="Angebote" text="Erstellen und nachverfolgen" onSelect={() => setSheet(null)}/>
            <SheetLink href="/rechnungen" icon="receipt" title="Rechnungen" text="Erstellen, senden und verwalten" onSelect={() => setSheet(null)}/>
            <SheetLink href="/zahlungen" icon="wallet" title="Zahlungen" text="Eingänge und offene Beträge" onSelect={() => setSheet(null)}/>
          </div>}

          {sheet === "more" && <>
            <div className="sheet-menu">
              <SheetLink href="/produkte" icon="box" title="Produkte" text="Produkte und Dienstleistungen" onSelect={() => setSheet(null)}/>
              <SheetLink href="/mitarbeiter" icon="users" title="Mitarbeiter" text="Team und Rollen" onSelect={() => setSheet(null)}/>
              <SheetLink href="/spesen" icon="card" title="Spesen" text="Belege und Freigaben" onSelect={() => setSheet(null)}/>
              <SheetLink href="/support" icon="support" title="Support" text="Tickets und Hilfe" onSelect={() => setSheet(null)}/>
              <SheetLink href="/einstellungen" icon="settings" title="Einstellungen" text="Firma, Konto und Abonnement" onSelect={() => setSheet(null)}/>
            </div>
            <div className="sheet-secondary">
              <button type="button" onClick={toggleTheme}><Icon name={dark ? "sun" : "moon"}/><span>{dark ? "Helle Darstellung" : "Dunkle Darstellung"}</span></button>
              <Link href="/login"><Icon name="logout"/><span>Abmelden</span></Link>
            </div>
          </>}

          {sheet === "search" && <div className="global-search">
            <label className="searchbox large"><Icon name="search"/><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kunden, Rechnungen, Angebote oder Tickets suchen..."/></label>
            <div className="search-results">
              {filtered.map(item => <Link key={item.href} href={item.href} onClick={() => setSheet(null)}>
                <span className="activity-icon"><Icon name={item.icon}/></span>
                <div><small>{item.type}</small><b>{item.title}</b><span>{item.meta}</span></div>
                <Icon name="arrow" size={16}/>
              </Link>)}
            </div>
          </div>}

          {sheet === "notifications" && <div className="notification-list">
            <Link href="/rechnungen/RE-2026-019" onClick={() => setSheet(null)}><span className="activity-icon"><Icon name="wallet"/></span><div><b>Rechnung bezahlt</b><p>Acme AG · CHF 4’346.40</p><small>vor 12 Minuten</small></div></Link>
            <Link href="/support/5832" onClick={() => setSheet(null)}><span className="activity-icon"><Icon name="support"/></span><div><b>Neue Support-Antwort</b><p>Ticket #5832 wurde beantwortet.</p><small>vor 1 Stunde</small></div></Link>
            <Link href="/angebote/AN-2026-012" onClick={() => setSheet(null)}><span className="activity-icon"><Icon name="file"/></span><div><b>Angebot angenommen</b><p>Acme AG · AN-2026-012</p><small>heute</small></div></Link>
          </div>}
        </section>
      </div>}
    </div>
  </div>;
}

function SheetLink({ href, icon, title, text, onSelect }: { href: string; icon: string; title: string; text: string; onSelect: () => void }) {
  return <Link href={href} onClick={onSelect}><span className="sheet-menu-icon"><Icon name={icon}/></span><div><b>{title}</b><small>{text}</small></div><Icon name="arrow" size={17}/></Link>;
}