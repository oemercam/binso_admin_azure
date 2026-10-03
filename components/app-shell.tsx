"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, Icon, IconButton, Logo } from "./ui";
import { apiGet, apiPost, clearDemoClientSession, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";

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
  const router=useRouter();
  const [sheet, setSheet] = useState<"more" | "docs" | "search" | "notifications" | "quick" | "account" | null>(null);
  const production=useBackendMode();
  const [query, setQuery] = useState("");
  const [remoteSearch,setRemoteSearch]=useState<typeof searchItems>([]);
  const [timerRunning, setTimerRunning] = useState(true);
  const [dark, setDark] = useState(false);
  const [timerBaseSeconds, setTimerBaseSeconds] = useState(8067);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [timerNow, setTimerNow] = useState(0);
  const [accountInitials,setAccountInitials]=useState("TM");

  useEffect(() => {
    queueMicrotask(() => {
      const running=window.localStorage.getItem("binso.timer.running") !== "false";
      const storedBase=Number(window.localStorage.getItem("binso.timer.baseSeconds") ?? "8067");
      let startedAt=Number(window.localStorage.getItem("binso.timer.startedAt") ?? "0");
      if(running && !startedAt){
        startedAt=Date.now();
        window.localStorage.setItem("binso.timer.startedAt",String(startedAt));
      }
      setTimerRunning(running);
      setTimerBaseSeconds(Number.isFinite(storedBase) ? storedBase : 8067);
      setTimerStartedAt(running ? startedAt : null);
      setTimerNow(Date.now());
      setDark(window.localStorage.getItem("binso.theme") === "dark");
    });
  }, []);

  useEffect(() => {
    const syncTimer=()=>{
      const running=window.localStorage.getItem("binso.timer.running") !== "false";
      const storedBase=Number(window.localStorage.getItem("binso.timer.baseSeconds") ?? "0");
      const storedStarted=Number(window.localStorage.getItem("binso.timer.startedAt") ?? "0");
      setTimerRunning(running);
      setTimerBaseSeconds(Number.isFinite(storedBase)?storedBase:0);
      setTimerStartedAt(running&&storedStarted?storedStarted:null);
      setTimerNow(Date.now());
    };
    window.addEventListener("binso-timer-change",syncTimer);
    return()=>window.removeEventListener("binso-timer-change",syncTimer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(()=>{
    if(!isProductionBackendEnabled()) return;
    apiGet<{authenticated:boolean;user?:{email?:string}}>("/api/auth/session")
      .then(session=>{
        const email=session.user?.email??"";
        const local=email.split("@")[0]??"";
        const parts=local.split(/[._-]+/).filter(Boolean);
        const initials=(parts.length>1?(parts[0][0]+parts[1][0]):local.slice(0,2)).toUpperCase();
        if(initials) queueMicrotask(()=>setAccountInitials(initials));
      })
      .catch(()=>undefined);
  },[]);

  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheet]);

  useEffect(() => {
    const onKeyDown=(event:KeyboardEvent)=>{
      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){
        event.preventDefault();
        setSheet("search");
      }
      if(event.key==="Escape") setSheet(null);
    };
    window.addEventListener("keydown",onKeyDown);
    return()=>window.removeEventListener("keydown",onKeyDown);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => setTimerNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(()=>{
    if(!production||query.trim().length<2){
      queueMicrotask(()=>setRemoteSearch([]));
      return;
    }
    const timer=window.setTimeout(()=>{
      apiGet<{items:typeof searchItems}>("/api/search?q="+encodeURIComponent(query.trim()))
        .then(payload=>setRemoteSearch(payload.items))
        .catch(()=>setRemoteSearch([]));
    },180);
    return()=>window.clearTimeout(timer);
  },[production,query]);

  const filtered = useMemo(() => {
    if(production){
      if(!query.trim()) return [];
      return remoteSearch;
    }
    if (!query.trim()) return searchItems;
    const q = query.toLowerCase();
    return searchItems.filter(item => `${item.type} ${item.title} ${item.meta}`.toLowerCase().includes(q));
  }, [production,query,remoteSearch]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("binso.theme", next ? "dark" : "light");
  }

  const timerSeconds = timerBaseSeconds + (timerRunning && timerStartedAt ? Math.max(0, Math.floor((timerNow - timerStartedAt) / 1000)) : 0);

  async function stopTimer() {
    setTimerRunning(false);
    setTimerBaseSeconds(timerSeconds);
    setTimerStartedAt(null);
    window.localStorage.setItem("binso.timer.running", "false");
    window.localStorage.setItem("binso.timer.baseSeconds", String(timerSeconds));
    window.localStorage.removeItem("binso.timer.startedAt");
    if(isProductionBackendEnabled()){
      try{
        const ended=new Date();
        const started=new Date(ended.getTime()-timerSeconds*1000);
        await apiPost("/api/time-entries",{customerName:"Acme AG",projectName:"Website Redesign",description:"Timer",startedAt:started.toISOString(),endedAt:ended.toISOString(),durationMinutes:Math.max(1,Math.round(timerSeconds/60))});
      }catch{
        // The timer remains stopped locally; failed persistence can be surfaced by the time page.
      }
    }
  }

  async function logout(){
    clearDemoClientSession();
    try{ await fetch("/api/auth/logout",{method:"POST",headers:{"Content-Type":"application/json"}}); }
    finally{ router.push("/login"); router.refresh(); }
  }

  const formattedTimer = [Math.floor(timerSeconds / 3600), Math.floor((timerSeconds % 3600) / 60), timerSeconds % 60].map(value => String(value).padStart(2, "0")).join(":");

  return <div className={`app-root app-section-${active} ${timerRunning ? "timer-active" : ""}`}>
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
      <div className="desktop-appbar">
        <button className="desktop-search-trigger" type="button" onClick={() => setSheet("search")}><Icon name="search" size={17}/><span>Suchen</span><kbd>⌘ K</kbd></button>
        <div className="desktop-appbar-actions">
          <Button icon="plus" onClick={() => setSheet("quick")}>Erstellen</Button>
          <button className="desktop-notification-button" type="button" aria-label="Benachrichtigungen" onClick={() => setSheet("notifications")}><Icon name="bell"/><i className="notification-badge">1</i></button>
          <button className="avatar avatar-button" type="button" aria-label="Benutzerkonto" onClick={() => setSheet("account")}>{accountInitials}</button>
        </div>
      </div>
      <header className="mobile-header">
        <div className="mobile-header-leading">
          {backHref ? <Link className="mobile-back" href={backHref} aria-label={backLabel}><Icon name="back"/></Link> : <Link href="/dashboard"><Logo /></Link>}
          {backHref && <span className="mobile-header-title">{title}</span>}
        </div>
        <div className="mobile-header-actions">
          <IconButton label="Suche" icon="search" onClick={() => setSheet("search")}/>
          <button className="mobile-notification-button icon-button" type="button" aria-label="Benachrichtigungen" onClick={() => setSheet("notifications")}><Icon name="bell"/><i className="notification-badge">1</i></button>
          <button className="avatar avatar-button" type="button" aria-label="Benutzerkonto" onClick={() => setSheet("account")}>{accountInitials}</button>
        </div>
      </header>

      <main className="page-container" data-section={active}>
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
        <b>{formattedTimer}</b>
        <button type="button" onClick={()=>void stopTimer()} aria-label="Zeitmessung stoppen"><Icon name="stop" size={16}/><span>Stoppen</span></button>
      </div>}

      <nav className="bottom-nav" aria-label="Hauptnavigation">
        <Link href="/dashboard" className={active==="dashboard"?"active":""}><Icon name="home"/><span>Start</span></Link>
        <Link href="/kunden" className={active==="kunden"?"active":""}><Icon name="users"/><span>Kunden</span></Link>
        <button type="button" className={["angebote","rechnungen","zahlungen","belege"].includes(active)?"active":""} onClick={() => setSheet("docs")}><Icon name="receipt"/><span>Belege</span></button>
        <Link href="/zeit" className={active==="zeit"?"active":""}><Icon name="clock"/><span>Zeit</span></Link>
        <button type="button" className={["produkte","spesen","mitarbeiter","support","einstellungen"].includes(active)?"active":""} onClick={() => setSheet("more")}><Icon name="more"/><span>Mehr</span></button>
      </nav>

      {sheet && <div className="sheet-layer" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSheet(null); }}>
        <section className={sheet === "search" ? "bottom-sheet search-sheet" : "bottom-sheet"} role="dialog" aria-modal="true" aria-label={sheet === "more" ? "Mehr" : sheet === "docs" ? "Belege" : sheet === "search" ? "Suche" : sheet === "quick" ? "Erstellen" : sheet === "account" ? "Konto" : "Benachrichtigungen"}>
          <div className="sheet-handle"/>
          <header className="sheet-header">
            <div>
              <h2>{sheet === "more" ? "Mehr" : sheet === "docs" ? "Belege" : sheet === "search" ? "Suche" : sheet === "quick" ? "Erstellen" : sheet === "account" ? "Konto" : "Benachrichtigungen"}</h2>
              {sheet === "docs" && <p>Dokumente und Zahlungen direkt öffnen.</p>}
              {sheet === "quick" && <p>Häufige Aufgaben ohne Umweg starten.</p>}
              {sheet === "account" && <p>Profil, Darstellung und Sitzung.</p>}
            </div>
            <IconButton label="Schliessen" icon="close" onClick={() => setSheet(null)}/>
          </header>

          {sheet === "docs" && <div className="sheet-menu">
            <SheetLink href="/belege" icon="receipt" title="Belegübersicht" text="Angebote, Rechnungen und Zahlungen zusammen" onSelect={() => setSheet(null)}/>
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
              <SheetLink href="/einstellungen/konto" icon="user" title="Persönliche Daten" text="Profil und Sprache" onSelect={() => setSheet(null)}/>
              <SheetLink href="/einstellungen/abonnement" icon="card" title="Abonnement" text="Plan und Abrechnung" onSelect={() => setSheet(null)}/>
              <SheetLink href="/einstellungen" icon="settings" title="Einstellungen" text="Alle Einstellungen" onSelect={() => setSheet(null)}/>
            </div>
            <div className="sheet-secondary">
              <button type="button" onClick={toggleTheme}><Icon name={dark ? "sun" : "moon"}/><span>{dark ? "Helle Darstellung" : "Dunkle Darstellung"}</span></button>
              <button type="button" onClick={()=>void logout()}><Icon name="logout"/><span>Abmelden</span></button>
            </div>
          </>}

          {sheet === "quick" && <div className="sheet-menu quick-create-menu">
            <SheetLink href="/kunden/neu" icon="users" title="Kunde" text="Neuen Kunden erfassen" onSelect={() => setSheet(null)}/>
            <SheetLink href="/angebote/neu" icon="file" title="Angebot" text="Angebot mit Live-Vorschau erstellen" onSelect={() => setSheet(null)}/>
            <SheetLink href="/rechnungen/neu" icon="receipt" title="Rechnung" text="Rechnung erstellen und prüfen" onSelect={() => setSheet(null)}/>
            <SheetLink href="/zahlungen/neu" icon="wallet" title="Zahlung" text="Zahlung zu einer Rechnung erfassen" onSelect={() => setSheet(null)}/>
            <SheetLink href="/spesen/neu" icon="card" title="Spese" text="Beleg und Ausgabe erfassen" onSelect={() => setSheet(null)}/>
            <SheetLink href="/mitarbeiter/neu" icon="users" title="Mitarbeiter" text="Teammitglied hinzufügen" onSelect={() => setSheet(null)}/>
          </div>}

          {sheet === "account" && <div className="account-sheet">
            <div className="account-sheet-profile"><span className="avatar avatar-large">{accountInitials}</span><div><b>Mein Binso One</b><small>Persönliche Einstellungen</small></div></div>
            <div className="sheet-menu">
              <SheetLink href="/einstellungen/konto" icon="user" title="Persönliche Daten" text="Profil und Sprache" onSelect={() => setSheet(null)}/>
              <SheetLink href="/einstellungen/sicherheit" icon="lock" title="Sicherheit" text="Passwort und Sitzungen" onSelect={() => setSheet(null)}/>
              <SheetLink href="/einstellungen/abonnement" icon="card" title="Abonnement" text="Plan und Abrechnung" onSelect={() => setSheet(null)}/>
            </div>
            <div className="sheet-secondary">
              <button type="button" onClick={toggleTheme}><Icon name={dark ? "sun" : "moon"}/><span>{dark ? "Helle Darstellung" : "Dunkle Darstellung"}</span></button>
              <button type="button" onClick={()=>void logout()}><Icon name="logout"/><span>Abmelden</span></button>
            </div>
          </div>}

          {sheet === "search" && <div className="global-search">
            <label className="searchbox large"><Icon name="search"/><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kunden, Rechnungen, Angebote oder Tickets suchen..."/></label>
            <div className="search-results">
              {production&&query.trim().length<2&&<p className="technical-hint">Mindestens zwei Zeichen eingeben.</p>}
              {production&&query.trim().length>=2&&filtered.length===0&&<p className="technical-hint">Keine Treffer gefunden.</p>}
              {filtered.map(item => <Link key={item.href} href={item.href} onClick={() => setSheet(null)}>
                <span className="activity-icon"><Icon name={item.icon}/></span>
                <div><small>{item.type}</small><b>{item.title}</b><span>{item.meta}</span></div>
                <Icon name="arrow" size={16}/>
              </Link>)}
            </div>
          </div>}

          {sheet === "notifications" && <div className="notification-list">
            <Link href="/rechnungen/RE-2026-019" onClick={() => setSheet(null)}><span className="activity-icon"><Icon name="wallet"/></span><div><b>Rechnung bezahlt</b><p>Acme AG · CHF 4’346.40</p><small>vor 12 Minuten</small></div></Link>
            <Link href="/support/5832" onClick={() => setSheet(null)}><span className="activity-icon"><Icon name="support"/></span><div><b>Neue Support-Antwort</b><p>Ticket #5832 wurde beantwortet.</p><small>vor 1 Stunde</small></div><i className="unread-dot"/></Link>
            <Link href="/angebote/AN-2026-012" onClick={() => setSheet(null)}><span className="activity-icon"><Icon name="file"/></span><div><b>Angebot angenommen</b><p>Acme AG · AN-2026-012</p><small>heute</small></div></Link>
            <Link className="notification-settings-link" href="/benachrichtigungen" onClick={() => setSheet(null)}>Alle Benachrichtigungen <Icon name="arrow" size={15}/></Link>
            <Link className="notification-settings-link" href="/einstellungen/benachrichtigungen" onClick={() => setSheet(null)}>Einstellungen <Icon name="arrow" size={15}/></Link>
          </div>}
        </section>
      </div>}
    </div>
  </div>;
}

function SheetLink({ href, icon, title, text, onSelect }: { href: string; icon: string; title: string; text: string; onSelect: () => void }) {
  return <Link href={href} onClick={onSelect}><span className="sheet-menu-icon"><Icon name={icon}/></span><div><b>{title}</b><small>{text}</small></div><Icon name="arrow" size={17}/></Link>;
}