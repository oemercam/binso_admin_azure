"use client";

import { readTimer, changeTimer } from "@/lib/client/time-tracker";
import Link from "next/link";
import {loadTheme,saveTheme} from "@/lib/client/theme";
import Image from "next/image";
import { useDialogFocus } from "./use-dialog-focus";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, EmptyState, Icon, IconButton, Logo } from "./ui";
import { apiGet, apiPatch, apiPost, clearDemoClientSession, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";

const desktopNav = [
  ["/dashboard","Start","home"],
  ["/kunden","Kunden","users"],
  ["/angebote","Angebote","file"],
  ["/rechnungen","Rechnungen","receipt"],
  ["/zahlungen","Zahlungen","wallet"],
  ["/produkte","Produkte","box"],
  ["/zeit","Zeiterfassung","clock"],
  ["/spesen","Spesen","card"],
  ["/finanzen","Finanzen","chart"],
  ["/mitarbeiter","Mitarbeiter","users"],
] as const;

const searchItems = [
  { type: "Kunde", title: "Acme AG", meta: "Zürich · Aktiv", href: "/kunden/acme", icon: "users" },
  { type: "Rechnung", title: "RE-2026-019", meta: "Acme AG · CHF 4’346.40", href: "/rechnungen/RE-2026-019", icon: "receipt" },
  { type: "Angebot", title: "AN-2026-012", meta: "Acme AG · CHF 7’264.32", href: "/angebote/AN-2026-012", icon: "file" },
  { type: "Ticket", title: "#5832 · Frage zur Rechnung", meta: "Offen", href: "/support/5832", icon: "support" },
];

type NotificationItem={
  id:string;
  kind:string;
  title:string;
  body:string;
  href?:string|null;
  read_at?:string|null;
  created_at:string;
};

function notificationIcon(kind:string){
  if(kind==="support") return "support";
  if(kind==="payment"||kind==="billing") return "wallet";
  if(kind==="document") return "file";
  if(kind==="announcement") return "bell";
  return "bell";
}

function notificationTime(value:string){
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"});
}

export function AppShell({
  title,
  subtitle,
  active,
  children,
  actions,
  mobileActions,
  backHref,
  backLabel = "Zurück",
  preview = false,
}: {
  title: string;
  subtitle?: string;
  active: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  mobileActions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  preview?: boolean;
}) {
  const pathname=usePathname();
  const [sheet, setSheet] = useState<"more" | "docs" | "search" | "notifications" | "quick" | "account" | null>(null);
  const dialogRef = useDialogFocus(sheet !== null, () => setSheet(null));
  const production=useBackendMode();
  const [query, setQuery] = useState("");
  const [remoteSearch,setRemoteSearch]=useState<typeof searchItems>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [dark, setDark] = useState(false);
  const [timerBaseSeconds, setTimerBaseSeconds] = useState(0);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [timerNow, setTimerNow] = useState(0);
  const [timerProjectLabel,setTimerProjectLabel]=useState("");
  const [accountInitials,setAccountInitials]=useState("TM");
  const [demoSession,setDemoSession]=useState(false);
  const [notifications,setNotifications]=useState<NotificationItem[]>([]);
  const [notificationsLoading,setNotificationsLoading]=useState(false);
  const [notificationsError,setNotificationsError]=useState<string|null>(null);
  const [navCompact,setNavCompact]=useState(false);
  const [showLaunch,setShowLaunch]=useState(false);
  const [timerNotice,setTimerNotice]=useState<string|null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setDark(document.documentElement.dataset.theme === "dark");
      const demo=window.localStorage.getItem("binso.demo.session")==="1";
      const expiresAt=Number(window.localStorage.getItem("binso.demo.expiresAt")??"0");
      const validDemo=demo&&(!expiresAt||expiresAt>Date.now());
      setDemoSession(validDemo);
      if(demo&&!validDemo){
        window.localStorage.removeItem("binso.demo.session");
        window.localStorage.removeItem("binso.demo.expiresAt");
      }
    });
  }, []);

  useEffect(() => {
    if(preview)return;
    const syncTimer=()=>{readTimer().then(state=>{setTimerRunning(state.running);setTimerBaseSeconds(state.seconds);setTimerStartedAt(state.running?Date.now():null);setTimerNow(Date.now());setTimerProjectLabel(state.project)}).catch(()=>undefined)};
    syncTimer();
    window.addEventListener("binso-timer-change",syncTimer);
    return()=>window.removeEventListener("binso-timer-change",syncTimer);
  }, [preview]);

  useEffect(()=>{
    if(preview||window.sessionStorage.getItem("binso.launch.seen")==="1") return;
    const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.sessionStorage.setItem("binso.launch.seen","1");
    if(reduceMotion) return;
    queueMicrotask(()=>setShowLaunch(true));
    const timer=window.setTimeout(()=>setShowLaunch(false),900);
    return()=>window.clearTimeout(timer);
  },[preview]);

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
    window.scrollTo({top:0,left:0,behavior:"auto"});
  }, [pathname]);

  useEffect(() => {
    if(preview) return;
    let lastY=window.scrollY;
    let compact=false;
    let ticking=false;
    const update=()=>{
      const currentY=Math.max(0,window.scrollY);
      const delta=currentY-lastY;
      if(currentY<24) compact=false;
      else if(delta>7) compact=true;
      else if(delta<-7) compact=false;
      setNavCompact(value=>value===compact?value:compact);
      lastY=currentY;
      ticking=false;
    };
    const onScroll=()=>{
      if(!ticking){
        ticking=true;
        window.requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>window.removeEventListener("scroll",onScroll);
  },[preview]);


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

  async function loadNotifications(){
    if(!production) return;
    setNotificationsLoading(true);
    setNotificationsError(null);
    try{
      const payload=await apiGet<{items:NotificationItem[]}>("/api/notifications");
      setNotifications(payload.items);
    }catch(error){
      setNotificationsError(error instanceof Error?error.message:"Benachrichtigungen konnten nicht geladen werden.");
    }finally{
      setNotificationsLoading(false);
    }
  }

  useEffect(()=>{
    if(!production) return;
    apiGet<{items:NotificationItem[]}>("/api/notifications")
      .then(payload=>queueMicrotask(()=>setNotifications(payload.items)))
      .catch(()=>undefined);
  },[production]);

  function openNotifications(){
    setSheet("notifications");
    if(production) void loadNotifications();
  }

  async function markNotificationRead(id:string){
    setNotifications(current=>current.map(item=>item.id===id?{...item,read_at:item.read_at??new Date().toISOString()}:item));
    try{
      await apiPatch("/api/notifications/"+encodeURIComponent(id),{});
    }catch{
      void loadNotifications();
    }
  }

  const unreadNotifications=production?notifications.filter(item=>!item.read_at).length:1;

  const filtered = useMemo(() => {
    if(production){
      if(!query.trim()) return [];
      return remoteSearch;
    }
    if (!query.trim()) return searchItems;
    const q = query.toLowerCase();
    return searchItems.filter(item => `${item.type} ${item.title} ${item.meta}`.toLowerCase().includes(q));
  }, [production,query,remoteSearch]);

  useEffect(()=>{
    const listener=(event:Event)=>setDark((event as CustomEvent<{resolved:string}>).detail.resolved==="dark");
    window.addEventListener("binso-theme",listener);
    void loadTheme().catch(()=>{});
    return()=>window.removeEventListener("binso-theme",listener);
  },[]);
  async function toggleTheme(){try{await saveTheme(dark?"light":"dark");}catch{setTimerNotice("Darstellung konnte nicht gespeichert werden.");}}

  const timerSeconds = timerBaseSeconds + (timerRunning && timerStartedAt ? Math.max(0, Math.floor((timerNow - timerStartedAt) / 1000)) : 0);

  async function stopTimer() {
    try{await changeTimer("finish",timerProjectLabel);setTimerRunning(false);setTimerBaseSeconds(0);setTimerStartedAt(null);setTimerNotice("Zeiteintrag gespeichert.")}
    catch(error){setTimerNotice(error instanceof Error?error.message:"Zeiteintrag konnte nicht gespeichert werden.")}
  }

  async function logout(){
    clearDemoClientSession();
    try{ await fetch("/api/auth/logout",{method:"POST",headers:{"Content-Type":"application/json"}}); }
    finally{ window.location.replace("/login"); }
  }

  const formattedTimer = [Math.floor(timerSeconds / 3600), Math.floor((timerSeconds % 3600) / 60), timerSeconds % 60].map(value => String(value).padStart(2, "0")).join(":");

  return <div className={`app-root app-section-${active} ${timerRunning && !backHref ? "timer-active" : ""} ${preview ? "app-preview" : ""}`}>
    {showLaunch&&<div className="app-launch" aria-hidden="true"><span><Image src="/brand/icon-black.svg" alt="" width={58} height={58} priority/></span></div>}
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
        <div className="desktop-appbar-actions">{timerRunning&&<Link href="/zeit" className="desktop-header-timer" aria-label={"Zeitmessung läuft "+formattedTimer}><Icon name="clock" size={16}/><span>{formattedTimer}</span></Link>}{demoSession&&<span className="app-demo-badge">Demo</span>}
          <Button icon="plus" onClick={() => setSheet("quick")}>Erstellen</Button>
          <button className="desktop-notification-button" type="button" aria-label="Benachrichtigungen" onClick={openNotifications}><Icon name="bell"/>{unreadNotifications>0&&<i className="notification-badge">{unreadNotifications>9?"9+":unreadNotifications}</i>}</button>
          <button className="avatar avatar-button" type="button" aria-label="Benutzerkonto" onClick={() => setSheet("account")}>{accountInitials}</button>
        </div>
      </div>
      <header className={backHref ? "mobile-header mobile-header-detail" : "mobile-header"}>
        <div className="mobile-header-leading">
          {backHref ? <Link className="mobile-back" href={backHref} aria-label={backLabel}><Icon name="back"/></Link> : <Link href="/dashboard"><Logo /></Link>}
          {backHref && <span className="mobile-header-title">{title}</span>}
        </div>
        {timerRunning&&!backHref&&<Link href="/zeit" className="header-timer" aria-label={"Zeitmessung läuft "+formattedTimer}><i/><b>{formattedTimer}</b></Link>}
        {backHref&&mobileActions&&<div className="mobile-detail-actions">{mobileActions}</div>}
        <div className="mobile-header-actions">{demoSession&&<span className="app-demo-badge mobile">Demo</span>}
          <IconButton label="Suche" icon="search" onClick={() => setSheet("search")}/>
          <button className="mobile-notification-button icon-button" type="button" aria-label="Benachrichtigungen" onClick={openNotifications}><Icon name="bell"/>{unreadNotifications>0&&<i className="notification-badge">{unreadNotifications>99?"99+":unreadNotifications}</i>}</button>
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

      {timerNotice&&<div className="timer-notice" role="status">{timerNotice}</div>}

      {!preview && <nav className={`bottom-nav ${navCompact ? "is-compact" : ""}`} aria-label="Hauptnavigation">
        <Link href="/dashboard" className={active==="dashboard"?"active":""}><Icon name="home"/><span>Start</span></Link>
        <Link href="/kunden" className={active==="kunden"?"active":""}><Icon name="users"/><span>Kunden</span></Link>
        <button type="button" className={["angebote","rechnungen","zahlungen","belege"].includes(active)?"active":""} onClick={() => setSheet("docs")}><Icon name="receipt"/><span>Belege</span></button>
        <Link href="/zeit" className={active==="zeit"?"active":""}><Icon name="clock"/><span>Zeit</span></Link>
        <button type="button" className={["produkte","spesen","finanzen","mitarbeiter","support","einstellungen"].includes(active)?"active":""} onClick={() => setSheet("more")}><Icon name="more"/><span>Mehr</span></button>
      </nav>}

      {sheet && <div className={`sheet-layer ${sheet==="more"||sheet==="docs"?"sheet-layer-navigation":""}`} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSheet(null); }}>
        <section ref={dialogRef} tabIndex={-1} className={sheet === "search" ? "bottom-sheet search-sheet" : "bottom-sheet"} role="dialog" aria-modal="true" aria-label={sheet === "more" ? "Mehr" : sheet === "docs" ? "Belege" : sheet === "search" ? "Suche" : sheet === "quick" ? "Erstellen" : sheet === "account" ? "Konto" : "Benachrichtigungen"}>
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
              {demoSession&&<SheetLink href="/registrieren" icon="plus" title="Eigenes Konto erstellen" text="Demo verlassen und mit eigenem Konto starten" onSelect={() => setSheet(null)}/>}
            </div>
            <div className="sheet-secondary">
              <button type="button" onClick={toggleTheme}><Icon name={dark ? "sun" : "moon"}/><span>{dark ? "Helle Darstellung" : "Dunkle Darstellung"}</span></button>
              <button type="button" onClick={()=>void logout()}><Icon name="logout"/><span>Abmelden</span></button>
            </div>
          </div>}

          {sheet === "search" && <div className="global-search">
            <div className="searchbox large" role="search"><Icon name="search"/><input aria-label="Suchen" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Suchen..."/>{query&&<button className="search-clear" type="button" aria-label="Suche löschen" onClick={()=>setQuery("")}><Icon name="close" size={15}/></button>}</div>
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
            {production ? <>
              {notificationsLoading&&notifications.length===0&&<EmptyState icon="bell" title="Benachrichtigungen werden geladen" text="Aktuelle Aktivitäten werden abgerufen."/>}
              {notificationsError&&<EmptyState icon="bell" title="Benachrichtigungen nicht verfügbar" text={notificationsError} action={<Button variant="secondary" onClick={()=>void loadNotifications()}>Erneut laden</Button>}/>}
              {!notificationsLoading&&!notificationsError&&notifications.length===0&&<EmptyState icon="bell" title="Keine Benachrichtigungen" text="Neue Aktivitäten erscheinen hier automatisch."/>}
              {!notificationsError&&notifications.slice(0,5).map(item=><Link href={item.href||"/benachrichtigungen"} key={item.id} onClick={()=>{void markNotificationRead(item.id);setSheet(null)}}>
                <span className="activity-icon"><Icon name={notificationIcon(item.kind)}/></span>
                <div><b>{item.title}</b><p>{item.body}</p><small>{notificationTime(item.created_at)}</small></div>
                {!item.read_at&&<i className="unread-dot"/>}
              </Link>)}
            </> : <>
              <Link href="/rechnungen/RE-2026-019" onClick={() => setSheet(null)}><span className="activity-icon"><Icon name="wallet"/></span><div><b>Rechnung bezahlt</b><p>Acme AG · CHF 4’346.40</p><small>vor 12 Minuten</small></div></Link>
              <Link href="/support/5832" onClick={() => setSheet(null)}><span className="activity-icon"><Icon name="support"/></span><div><b>Neue Support-Antwort</b><p>Ticket #5832 wurde beantwortet.</p><small>vor 1 Stunde</small></div><i className="unread-dot"/></Link>
              <Link href="/angebote/AN-2026-012" onClick={() => setSheet(null)}><span className="activity-icon"><Icon name="file"/></span><div><b>Angebot angenommen</b><p>Acme AG · AN-2026-012</p><small>heute</small></div></Link>
            </>}
            <Link className="notification-settings-link" href="/benachrichtigungen" onClick={() => setSheet(null)}><span>Alle Benachrichtigungen</span><Icon name="arrow" size={15}/></Link>
          </div>}
        </section>
      </div>}
    </div>
  </div>;
}

function SheetLink({ href, icon, title, text, onSelect }: { href: string; icon: string; title: string; text: string; onSelect: () => void }) {
  return <Link href={href} onClick={onSelect}><span className="sheet-menu-icon"><Icon name={icon}/></span><div><b>{title}</b><small>{text}</small></div><Icon name="arrow" size={17}/></Link>;
}
