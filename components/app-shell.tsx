"use client";

import {PageAccessContext,usePageAccess} from "@/lib/client/page-access";
import {routePermission,tenantCan,permissionForModule} from "@/lib/permissions";
import {moduleForPath,planAllowsPath,type PlanId} from "@/config/plan-access";
import { readTimer, changeTimer } from "@/lib/client/time-tracker";
import Link from "next/link";
import {loadTheme,saveTheme} from "@/lib/client/theme";
import Image from "next/image";
import { useDialogFocus } from "./use-dialog-focus";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {useBrowserBackGuard,allowDraftNavigation} from "./use-browser-back-guard";
import ConfirmDialog from "./confirm-dialog";
import { PageHeading, DetailHeading } from "./binso-ux";
import { Button, EmptyState, Icon, IconButton, Logo, Status } from "./ui";
import { apiGet, apiPatch, logoutClientSession, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {cachedClientSession,invalidateClientSession,type ClientSession} from "@/lib/client/session-cache";
import type { SearchItem } from "@/lib/search";
import {SearchPanel,NotificationPanel,AccountPanel,type PanelNotification} from "./header-panel-content";
import {HeaderPanel} from "./header-panel";
import {Avatar} from "./avatar";

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

const desktopNavGroups = [
  {label:"Verkauf",paths:["/kunden","/angebote","/rechnungen","/produkte"]},
  {label:"Arbeit & Team",paths:["/zeit","/mitarbeiter"]},
  {label:"Finanzen",paths:["/zahlungen","/spesen","/finanzen"]},
];

type NotificationItem=PanelNotification;

function accessFromSession(session:ClientSession|null){return session?.authenticated?{role:session.tenant?.role??"reader",plan:session.tenant?.plan??"pro" as PlanId,readOnly:session.tenant?.readOnly===true}:null;}

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
  editing = false,
  unsavedChanges,
  status,
  statusTone,
}: {
  title: string;
  status?: React.ReactNode;
  statusTone?: "neutral"|"success"|"warning"|"danger"|"info";
  subtitle?: string;
  active: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  mobileActions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  preview?: boolean;
  editing?: boolean;
  unsavedChanges?: boolean;
}) {
  const pathname=usePathname();
  const router=useRouter();
  const formActive=editing||pathname.endsWith("/neu");
  const [access,setAccess]=useState<{role:string;plan:PlanId;readOnly:boolean}|null>(()=>accessFromSession(cachedClientSession()));
  const [accessRetry,setAccessRetry]=useState(0);
  const [accessError,setAccessError]=useState<string|null>(null);
  useEffect(()=>{
    if(pathname.startsWith('/preview/')){queueMicrotask(()=>{setAccess({role:'owner',plan:'pro',readOnly:true});setAccessError(null)});return;}
    let active=true;let refreshRevision=0;
    const refresh=()=>{const requestedRevision=++refreshRevision;return apiGet<ClientSession>('/api/auth/session').then(session=>{
      if(!active||requestedRevision!==refreshRevision)return;
      setAccess(accessFromSession(session));
      setAccessError(session.authenticated?null:'Deine Sitzung ist beendet. Bitte melde dich erneut an.');
    }).catch(error=>{if(active&&requestedRevision===refreshRevision){setAccess(null);setAccessError(error instanceof Error?error.message:'Zugang konnte nicht geprüft werden.')}});};
    const resume=(event:PageTransitionEvent)=>{if(event.persisted){invalidateClientSession();setAccess(null);void refresh();}};
    const storage=(event:StorageEvent)=>{if(event.key==='binso.session.changed'){invalidateClientSession();void refresh();}};
    void refresh();
    window.addEventListener('focus',refresh);
    window.addEventListener('binso-session-invalid',refresh);
    window.addEventListener('storage',storage);window.addEventListener('pageshow',resume);
    return()=>{active=false;window.removeEventListener('focus',refresh);window.removeEventListener('binso-session-invalid',refresh);window.removeEventListener('storage',storage);window.removeEventListener('pageshow',resume)};
  },[pathname,accessRetry]);

  const canOpen=(href:string)=>{if(!access)return false;const path=href.split('?')[0];const permission=routePermission(path);const accessModule=moduleForPath(path);return (!permission||tenantCan(access.role,permission))&&planAllowsPath(access.plan,path)&&(!path.endsWith('/neu')||(!access.readOnly||path.startsWith('/support/'))&&(!accessModule||tenantCan(access.role,permissionForModule(accessModule,'write')??'organization:write')));};
  const accessModule=moduleForPath(pathname);
  const settingsWrite=pathname==='/einstellungen/team'?'users:manage':pathname==='/einstellungen/abonnement'?'billing:write':['/einstellungen/firma','/einstellungen/dokumente','/einstellungen/zeiterfassung'].includes(pathname)?'organization:write':'organization:read';
  const personalSettings=pathname.startsWith('/einstellungen')&&!['/einstellungen/firma','/einstellungen/dokumente','/einstellungen/team','/einstellungen/abonnement','/einstellungen/zeiterfassung'].includes(pathname);
  const canWrite=!!access&&(!access.readOnly||personalSettings||active==='support')&&tenantCan(access.role,pathname.startsWith('/einstellungen')?settingsWrite:accessModule?permissionForModule(accessModule,'write')??'organization:read':active==='finanzen'?'accounting:write':'support:write');
  const visibleActions=actions;
  const allowed=canOpen(pathname);
  const [formDirty,setFormDirty]=useState(false);
  const shellRef=useRef<HTMLDivElement>(null);
  const dirty=unsavedChanges??formDirty;
  useEffect(()=>{
    if(!formActive)return;
    const root=shellRef.current;
    const changed=(event:Event)=>{
      if(event.target instanceof Element&&event.target.closest('.form-field,.mobile-line-field'))setFormDirty(true);
    };
    root?.addEventListener('input',changed);
    root?.addEventListener('change',changed);
    return()=>{root?.removeEventListener('input',changed);root?.removeEventListener('change',changed);};
  },[formActive]);
  const [leaveHref,setLeaveHref]=useState<string|null>(null);
  const leaveBack=useBrowserBackGuard(dirty,()=>setLeaveHref("browser-back"));
  useEffect(()=>{
    if(!dirty)return;
    const navigate=(event:MouseEvent)=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>("a[href]"):null;
      if(!link||link.target==="_blank"||link.hasAttribute("download"))return;
      const url=new URL(link.href,window.location.href);
      if(url.href===window.location.href||url.hash&&url.pathname===pathname)return;
      event.preventDefault();event.stopPropagation();setLeaveHref(url.href);
    };
    document.addEventListener("click",navigate,true);
    return()=>{document.removeEventListener("click",navigate,true);};
  },[dirty,pathname]);
  const [logoutBusy,setLogoutBusy]=useState(false);
  const logoutBusyRef=useRef(false);
  const [confirmLogout,setConfirmLogout]=useState(false);
  const [logoutError,setLogoutError]=useState<string|null>(null);
  const [sheet, setSheet] = useState<"more" | "docs" | "search" | "notifications" | "quick" | "account" | null>(null);
  const headerPanel=sheet==="search"||sheet==="notifications"||sheet==="account";
  const dialogRef = useDialogFocus(sheet !== null&&!headerPanel, () => setSheet(null));
  const production=useBackendMode();
  const [query, setQuery] = useState("");
  const [remoteSearch,setRemoteSearch]=useState<{query:string;items:SearchItem[];loading:boolean;error:string|null}>({query:"",items:[],loading:false,error:null});
  const [timerRunning, setTimerRunning] = useState(false);
  const [dark, setDark] = useState(false);
  const [timerBaseSeconds, setTimerBaseSeconds] = useState(0);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [timerNow, setTimerNow] = useState(0);
  const [timerProjectLabel,setTimerProjectLabel]=useState("");
  const [demoSession,setDemoSession]=useState(false);
  const [notifications,setNotifications]=useState<NotificationItem[]>([]);
  const [notificationsLoading,setNotificationsLoading]=useState(false);
  const [notificationsError,setNotificationsError]=useState<string|null>(null);
  const [notificationFilter,setNotificationFilter]=useState<"all"|"unread">("all");
  const [profile,setProfile]=useState<{name:string;identity:string;avatar:string}>({name:"",identity:"",avatar:""});
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
      if(event.key==="Escape"){
        setSheet(null);
      }
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
    let active=true;
    const term=query.trim();
    if(!production||term.length<2)return;
    queueMicrotask(()=>{if(active)setRemoteSearch({query:term,items:[],loading:true,error:null})});
    const timer=window.setTimeout(()=>{
      apiGet<{items:SearchItem[]}>("/api/search?q="+encodeURIComponent(term))
        .then(payload=>{if(active)setRemoteSearch({query:term,items:payload.items,loading:false,error:null})})
        .catch(error=>{if(active)setRemoteSearch({query:term,items:[],loading:false,error:error instanceof Error?error.message:"Suche konnte nicht geladen werden."})});
    },180);
    return()=>{active=false;window.clearTimeout(timer)};
  },[production,query]);

  const searchLoading=production&&query.trim().length>=2&&(remoteSearch.query!==query.trim()||remoteSearch.loading);
  const searchError=remoteSearch.query===query.trim()?remoteSearch.error:null;

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

  const unreadNotifications=notifications.filter(item=>!item.read_at).length;

  const filtered=production&&query.trim().length>=2&&remoteSearch.query===query.trim()?remoteSearch.items.filter(item=>canOpen(item.href)):[];
  async function markAllRead(){try{await apiPatch("/api/notifications",{all:true});await loadNotifications();}catch{setNotificationsError("Benachrichtigungen konnten nicht als gelesen markiert werden.");}}
  useEffect(()=>{
    if(!production)return;
    let active=true;
    const refresh=()=>apiGet<{item?:Record<string,unknown>|null;email?:string}>("/api/settings/profile").then(({item,email})=>{if(active)setProfile({name:String(item?.display_name||[item?.first_name,item?.last_name].filter(Boolean).join(" ")||""),identity:String(email||""),avatar:String(item?.avatar_url||"")})}).catch(()=>undefined);
    void refresh();window.addEventListener("binso-profile-changed",refresh);
    return()=>{active=false;window.removeEventListener("binso-profile-changed",refresh)};
  },[production]);

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

  async function logout(confirmed=false){
    if(logoutBusyRef.current)return;
    if(dirty&&!confirmed){setSheet(null);setConfirmLogout(true);return;}
    logoutBusyRef.current=true;setLogoutBusy(true);setLogoutError(null);
    try{await logoutClientSession();allowDraftNavigation();window.location.replace("/login");}
    catch(error){setConfirmLogout(false);setLogoutError(error instanceof Error?error.message:"Abmelden ist fehlgeschlagen. Bitte erneut versuchen.");logoutBusyRef.current=false;setLogoutBusy(false);}
  }

  const formattedTimer = [Math.floor(timerSeconds / 3600), Math.floor((timerSeconds % 3600) / 60), timerSeconds % 60].map(value => String(value).padStart(2, "0")).join(":");

  return <PageAccessContext.Provider value={{write:canWrite,canOpen}}><div ref={shellRef} className={`app-root app-section-${active} ${timerRunning && !backHref ? "timer-active" : ""} ${preview ? "app-preview" : ""} ${formActive ? "app-editing" : ""}`}>
    <ConfirmDialog open={confirmLogout} busy={logoutBusy} title="Änderungen verwerfen und abmelden?" message="Deine Änderungen sind noch nicht gespeichert." confirmLabel="Abmelden" onCancel={()=>setConfirmLogout(false)} onConfirm={()=>void logout(true)}/>
    <ConfirmDialog open={leaveHref!==null} title="Änderungen verwerfen?" message="Deine Änderungen sind noch nicht gespeichert und gehen verloren." cancelLabel="Weiter bearbeiten" confirmLabel="Änderungen verwerfen" onCancel={()=>setLeaveHref(null)} onConfirm={()=>{const href=leaveHref;setLeaveHref(null);if(href){allowDraftNavigation();if(href==="browser-back"){leaveBack();return;}const url=new URL(href);if(url.origin===window.location.origin)router.replace(url.pathname+url.search+url.hash);else window.location.assign(href);}}}/>
    {logoutError&&<div className="toast" role="alert"><Icon name="close" size={16}/><span>{logoutError}</span><button type="button" className="text-action" disabled={logoutBusy} onClick={()=>void logout()}>Erneut versuchen</button></div>}
    {showLaunch&&<div className="app-launch" aria-hidden="true"><span><Image src="/brand/icon-black.svg" alt="" width={58} height={58} priority/></span></div>}
    <aside className="app-sidebar">
      <Link href="/dashboard" className="sidebar-logo"><Logo /></Link>
      <nav>
        <Link href="/dashboard" className={active==="dashboard"?"active":""} aria-current={active==="dashboard"?"page":undefined}><Icon name="home"/><span>Start</span></Link>
        {desktopNavGroups.map(group=>desktopNav.some(([href])=>group.paths.includes(href)&&canOpen(href))&&<div className="sidebar-nav-group" key={group.label}><span className="sidebar-nav-label">{group.label}</span>{desktopNav.filter(([href])=>group.paths.includes(href)&&canOpen(href)).map(([href,label,icon])=><Link key={href} href={href} className={active===href.slice(1)?"active":""} aria-current={active===href.slice(1)?"page":undefined}><Icon name={icon}/><span>{label}</span></Link>)}</div>)}
      </nav>
      <div className="sidebar-bottom">
        <Link href="/support" className={active==="support" ? "active" : ""}><Icon name="support"/><span>Support</span></Link>
        <Link href="/einstellungen" className={active==="einstellungen" ? "active" : ""}><Icon name="settings"/><span>Einstellungen</span></Link>
      </div>
    </aside>

    <div className="app-main">
      <div className="desktop-appbar">
        {!formActive&&<IconButton label="Suche" icon="search" onClick={()=>setSheet("search")}/>}
        {!formActive&&<div className="desktop-appbar-actions">{timerRunning&&<Link href="/zeit" className="desktop-header-timer" aria-label={"Zeitmessung läuft "+formattedTimer}><Icon name="clock" size={16}/><span>{formattedTimer}</span></Link>}<button className="desktop-notification-button" type="button" aria-label="Benachrichtigungen" onClick={openNotifications}><Icon name="bell"/>{unreadNotifications>0&&<i className="notification-badge">{unreadNotifications>9?"9+":unreadNotifications}</i>}</button>
          <button className="avatar avatar-button" type="button" aria-label="Benutzerkonto" onClick={() => setSheet("account")}><Avatar name={profile.name} identity={profile.identity} src={profile.avatar} size="small"/></button>
        </div>}
      </div>
      <header className={backHref ? "mobile-header mobile-header-detail" : "mobile-header"}>
        <div className="mobile-header-leading">
          {backHref ? <Link className="mobile-back" href={backHref} aria-label={backLabel}><Icon name="back"/></Link> : <Link href="/dashboard"><Logo /></Link>}
          {backHref && <h1 className="mobile-header-title"><span>{title}</span>{status!=null&&<Status tone={statusTone}>{status}</Status>}</h1>}
        </div>
        {timerRunning&&!backHref&&<Link href="/zeit" className="header-timer" aria-label={"Zeitmessung läuft "+formattedTimer}><i/><b>{formattedTimer}</b></Link>}
        {backHref&&(mobileActions||visibleActions)&&allowed&&<div className="mobile-detail-actions">{mobileActions??visibleActions}</div>}
        <div className="mobile-header-actions"><IconButton label="Suche" icon="search" onClick={() => setSheet("search")}/>
          <button className="mobile-notification-button icon-button" type="button" aria-label="Benachrichtigungen" onClick={openNotifications}><Icon name="bell"/>{unreadNotifications>0&&<i className="notification-badge">{unreadNotifications>99?"99+":unreadNotifications}</i>}</button>
          <button className="avatar avatar-button" type="button" aria-label="Benutzerkonto" onClick={() => setSheet("account")}><Avatar name={profile.name} identity={profile.identity} src={profile.avatar} size="small"/></button>
        </div>
      </header>

      <main className="page-container" data-section={active}>
        <div className={backHref ? "page-head page-head-detail" : "page-head"}>
          {backHref ? <DetailHeading title={title} subtitle={subtitle} status={status} tone={statusTone} action={visibleActions&&allowed?<div className="page-actions">{visibleActions}</div>:undefined} leading={<Link className="desktop-back" href={backHref} aria-label={backLabel}><Icon name="back" size={16}/></Link>}/> : <PageHeading title={title} description={subtitle} action={visibleActions&&allowed?<div className="page-actions">{visibleActions}</div>:undefined}/> }
        </div>
        {!access&&!accessError?<div className="app-session-loading" role="status" aria-label="Binso One wird geladen"><span/></div>:accessError?<div role="alert"><p>{accessError}</p><div className="filter-sheet-actions"><Button onClick={()=>{invalidateClientSession();setAccessError(null);setAccessRetry(value=>value+1)}}>Erneut versuchen</Button><Link className="button button-secondary" href="/login">Anmelden</Link></div></div>:allowed?children:<EmptyState icon="lock" title="Kein Zugriff" text="Diese Seite ist für deine Rolle oder deinen Plan nicht verfügbar."/>}
      </main>

      {timerNotice&&<div className="timer-notice" role="status">{timerNotice}</div>}

      {!preview && !formActive && <nav className={`bottom-nav ${navCompact ? "is-compact" : ""}`} aria-label="Hauptnavigation">
        <Link href="/dashboard" className={active==="dashboard"?"active":""}><Icon name="home"/><span>Start</span></Link>
        {canOpen("/kunden")&&<Link href="/kunden" className={active==="kunden"?"active":""}><Icon name="users"/><span>Kunden</span></Link>}
        <Link href="/finanzen" className={["angebote","rechnungen","zahlungen","belege","finanzen"].includes(active)?"active":""}><Icon name="wallet"/><span>Finanzen</span></Link>
        {canOpen("/zeit")&&<Link href="/zeit" className={active==="zeit"?"active":""}><Icon name="clock"/><span>Zeit</span></Link>}
        <button type="button" className={["produkte","spesen","mitarbeiter","support","einstellungen"].includes(active)?"active":""} onClick={() => setSheet("more")}><Icon name="more"/><span>Mehr</span></button>
      </nav>}

      {headerPanel&&<HeaderPanel key={sheet} kind={sheet} label={sheet==="search"?"Suche":sheet==="account"?"Konto":"Benachrichtigungen"} onClose={()=>setSheet(null)}>
        {sheet==="search"&&<SearchPanel query={query} onQuery={setQuery} items={filtered} loading={searchLoading} error={searchError} onClose={()=>setSheet(null)}/>}
        {sheet==="notifications"&&<NotificationPanel items={notifications} loading={notificationsLoading} error={notificationsError} filter={notificationFilter} onFilter={setNotificationFilter} onRead={id=>void markNotificationRead(id)} onReadAll={()=>void markAllRead()} onRetry={()=>void loadNotifications()} onClose={()=>setSheet(null)}/>}
        {sheet==="account"&&<AccountPanel profile={profile} demo={demoSession} logoutBusy={logoutBusy} onLogout={()=>void logout()} onClose={()=>setSheet(null)}/>}
      </HeaderPanel>}
      {sheet&&!headerPanel && <div className={`sheet-layer ${sheet==="more"||sheet==="docs"?"sheet-layer-navigation":""}`} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSheet(null); }}>
        <section ref={dialogRef} tabIndex={-1} className="bottom-sheet" role="dialog" aria-modal="true" aria-label={sheet === "more" ? "Mehr" : sheet === "docs" ? "Finanzen" : sheet === "quick" ? "Erstellen" : "Benachrichtigungen"}>
          <div className="sheet-handle"/>
          <header className="sheet-header">
            <div>
              <h2>{sheet === "more" ? "Mehr" : sheet === "docs" ? "Finanzen" : sheet === "quick" ? "Erstellen" : "Benachrichtigungen"}</h2>
              {sheet === "docs" && <p>Dokumente und Zahlungen direkt öffnen.</p>}
              {sheet === "quick" && <p>Häufige Aufgaben ohne Umweg starten.</p>}
            </div>
            <IconButton label="Schliessen" icon="close" onClick={() => setSheet(null)}/>
          </header>

          {sheet === "docs" && <div className="sheet-menu">
            <SheetLink href="/finanzen" icon="receipt" title="Finanzübersicht" text="Angebote, Rechnungen und Zahlungen zusammen" onSelect={() => setSheet(null)}/>
            <SheetLink href="/angebote" icon="file" title="Angebote" text="Erstellen und nachverfolgen" onSelect={() => setSheet(null)}/>
            <SheetLink href="/rechnungen" icon="receipt" title="Rechnungen" text="Erstellen, senden und verwalten" onSelect={() => setSheet(null)}/>
            <SheetLink href="/zahlungen" icon="wallet" title="Zahlungen" text="Eingänge und offene Beträge" onSelect={() => setSheet(null)}/>
          </div>}

          {sheet === "more" && <>
            <div className="sheet-menu">
              <SheetLink href="/produkte" icon="box" title="Produkte" text="Produkte und Dienstleistungen" onSelect={() => setSheet(null)}/>
              <SheetLink href="/mitarbeiter" icon="users" title="Mitarbeiter" text="Stammdaten und Arbeitsverhältnis" onSelect={() => setSheet(null)}/>
              <SheetLink href="/spesen" icon="card" title="Spesen" text="Quittungen und Freigaben" onSelect={() => setSheet(null)}/>
              <SheetLink href="/finanzen/analyse" icon="chart" title="Finanzanalyse" text="Einnahmen, Kosten und Auswertungen" onSelect={() => setSheet(null)}/>
              <SheetLink href="/support" icon="support" title="Support" text="Tickets und Hilfe" onSelect={() => setSheet(null)}/>
              <SheetLink href="/einstellungen" icon="settings" title="Einstellungen" text="Alle Einstellungen" onSelect={() => setSheet(null)}/>
            </div>
            <div className="sheet-secondary">
              <button type="button" disabled={logoutBusy} onClick={()=>void logout()}><Icon name="logout"/><span>{logoutBusy?"Wird abgemeldet…":"Abmelden"}</span></button>
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


        </section>
      </div>}
    </div>
  </div></PageAccessContext.Provider>;
}

export function SheetLink({ href, icon, title, text, onSelect }: { href: string; icon: string; title: string; text?: string; onSelect: () => void }) {
  const access=usePageAccess();
  if(!access.canOpen(href))return null;
  return <Link href={href} onClick={onSelect}><span className="sheet-menu-icon"><Icon name={icon}/></span><div><b>{title}</b>{text&&<small>{text}</small>}</div><Icon name="arrow" size={17}/></Link>;
}
