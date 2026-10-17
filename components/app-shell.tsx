"use client";

import {LocalizedText,LocalizedElement,useTranslation} from "@/lib/client/locale";
import {PageAccessContext} from "@/lib/client/page-access";
import {routePermission,tenantCan,permissionForModule} from "@/lib/permissions";
import {moduleForPath,planAllowsPath,type PlanId} from "@/config/plan-access";
import { readTimer, changeTimer } from "@/lib/client/time-tracker";
import Link from "next/link";
import {loadTheme,saveTheme} from "@/lib/client/theme";
import {AppStart} from "./app-start";
import { hasBlockingModal } from "./use-dialog-focus";
import {safeAppPath} from "@/lib/navigation";
import { usePathname, useRouter } from "next/navigation";
import { isValidElement, cloneElement, createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {WorkspaceActionContext} from '@/lib/client/workspace-actions';
import {RecordsControls} from './records';
import {useBrowserBackGuard,allowDraftNavigation} from "./use-browser-back-guard";
import ConfirmDialog from "./confirm-dialog";
import { ActionRow, ActionSheet, PageHeading, DetailHeading } from "./binso-ux";
import {Button, EmptyState, Icon, IconButton, Logo, Status, LoadingState} from "./ui";
import {useApiQuery,useDataRevision} from "@/lib/client/use-api-query";
import { apiGet, apiPatch, logoutClientSession, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {invalidateClientSession,type ClientSession} from "@/lib/client/session-cache";
import type { SearchItem } from "@/lib/search";
import {SearchPanel,NotificationPanel,AccountPanel,type PanelNotification} from "./header-panel-content";
import {HeaderPanel} from "./header-panel";
import {Avatar} from "./avatar";
import {AppHeader,MobileDock} from "./app-chrome";
import {DesktopNavigationToggle,useDesktopNavigation} from "./desktop-navigation";

const desktopNav = [
  ["/dashboard","Start","home"],
  ["/kunden","Kunden","users"],
  ["/angebote","Angebote","file"],
  ["/rechnungen","Rechnungen","receipt"],
  ["/zahlungen","Zahlungen","wallet"],
  ["/produkte","Produkte","box"],
  ["/zeit","Zeiterfassung","clock"],
  ["/projekte","Aufträge / Projekte","box"],
  ["/spesen","Spesen","card"],
  ["/finanzen","Finanzen","chart"],
  ["/berichte","Berichte","chart"],
  ["/mitarbeiter","Mitarbeiter","users"],
] as const;

const desktopNavGroups = [
  {label:"Verkauf",paths:["/kunden","/angebote","/rechnungen","/produkte"]},
  {label:"Arbeit & Team",paths:["/projekte","/zeit","/mitarbeiter"]},
  {label:"Finanzen",paths:["/zahlungen","/spesen","/finanzen","/berichte"]},
];

type NotificationItem=PanelNotification;

function accessFromSession(session:ClientSession|null){return session?.authenticated?{role:session.tenant?.role??"reader",plan:session.tenant?.plan??"pro" as PlanId,readOnly:session.tenant?.readOnly===true}:null;}

function AppShellFrame({
  title,
  titleIsUserContent=false,
  headingPlacement="content",
  recordLabel,
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
  titleIsUserContent?:boolean;
  headingPlacement?:"header"|"content";
  recordLabel?:string;
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
  const {navigationCollapsed,toggleNavigation}=useDesktopNavigation();
  const translate=useTranslation();
  const pathname=usePathname();
  const [navigationQuery,setNavigationQuery]=useState("");
  const [contextActions,setContextActions]=useState<{id:string;content:React.ReactNode}|null>(null);
  const registerContextActions=useCallback((id:string,content:React.ReactNode|null)=>setContextActions(previous=>content?{id,content}:previous?.id===id?null:previous),[]);
  useEffect(()=>{const update=()=>setNavigationQuery(window.location.search);queueMicrotask(update);window.addEventListener('popstate',update);return()=>window.removeEventListener('popstate',update);},[pathname]);
  const searchParams=useMemo(()=>new URLSearchParams(navigationQuery),[navigationQuery]);
  if(pathname.startsWith("/einstellungen/")&&searchParams.has("accountReturn"))backHref=safeAppPath(searchParams.get("accountReturn"),backHref??"/dashboard");
  const identityRevision=useDataRevision(["/api/auth/session"]);
  const router=useRouter();
  const formActive=editing||pathname.endsWith("/neu");
  const [access,setAccess]=useState<{role:string;plan:PlanId;readOnly:boolean}|null>(null);
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
    const visibility=()=>{if(document.visibilityState==="visible")void refresh();};
    const storage=(event:StorageEvent)=>{if(event.key==='binso.session.changed'){invalidateClientSession();void refresh();}};
    void refresh();
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',visibility);
    window.addEventListener('binso-session-invalid',refresh);
    window.addEventListener('storage',storage);window.addEventListener('pageshow',resume);
    return()=>{active=false;window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('binso-session-invalid',refresh);window.removeEventListener('storage',storage);window.removeEventListener('pageshow',resume)};
  },[pathname,accessRetry,identityRevision]);

  const canOpen=useCallback((href:string)=>{if(!access)return false;const path=href.split('?')[0];const permission=routePermission(path);const accessModule=moduleForPath(path);return (!permission||tenantCan(access.role,permission))&&planAllowsPath(access.plan,path)&&(!path.endsWith('/neu')||(!access.readOnly||path.startsWith('/support/'))&&(!accessModule||tenantCan(access.role,permissionForModule(accessModule,'write')??'organization:write')));},[access]);
  const accessModule=moduleForPath(pathname);
  const settingsWrite=pathname==='/einstellungen/team'?'users:manage':pathname==='/einstellungen/abonnement'?'billing:write':['/einstellungen/firma','/einstellungen/dokumente','/einstellungen/zeiterfassung'].includes(pathname)?'organization:write':'organization:read';
  const personalSettings=pathname.startsWith('/einstellungen')&&!['/einstellungen/firma','/einstellungen/dokumente','/einstellungen/team','/einstellungen/abonnement','/einstellungen/zeiterfassung'].includes(pathname);
  const canWrite=!!access&&(!access.readOnly||personalSettings||active==='support')&&tenantCan(access.role,pathname.startsWith('/einstellungen')?settingsWrite:accessModule?permissionForModule(accessModule,'write')??'organization:read':active==='finanzen'?'accounting:write':'support:write');
  const pageAccess=useMemo(()=>({write:canWrite,canOpen}),[canWrite,canOpen]);
  const listControls=isValidElement<{children?:React.ReactNode}>(actions)&&actions.type===RecordsControls?actions:null;
  const visibleActions=listControls?listControls.props.children:actions;
  const bodyControls=listControls?cloneElement(listControls,{children:undefined}):undefined;
  const headerOwnsDetail=!!backHref&&headingPlacement==="header";
  const allowed=canOpen(pathname);
  const [formDirty,setFormDirty]=useState(false);
  const shellRef=useRef<HTMLDivElement>(null);
  const formBaseline=useRef("");
  const touchedRef=useRef(false);
  const formValues=()=>JSON.stringify(Array.from(shellRef.current?.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('.form-field input,.form-field select,.form-field textarea,.mobile-line-field input,.mobile-line-field select,input[type=file]')??[]).map(el=>el instanceof HTMLInputElement&&['checkbox','radio'].includes(el.type)?el.checked:el.value));
  // Hydrated backend values become the baseline until the first genuine edit.
  useEffect(()=>{if(!formActive&&touchedRef.current){touchedRef.current=false;queueMicrotask(()=>{setFormDirty(false)})}if(formActive&&!touchedRef.current)formBaseline.current=formValues()});
  const dirty=unsavedChanges??formDirty;
  useEffect(()=>{
    if(!formActive)return;
    const root=shellRef.current;
    const changed=(event:Event)=>{
      if(event.target instanceof Element&&(event.target.closest('.form-field,.mobile-line-field')||event.target.matches('input[type=file]'))){touchedRef.current=true;setFormDirty(formValues()!==formBaseline.current);}
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
  const [sheet, setSheet] = useState<"more" | "docs" | "search" | "notifications" | "account" | null>(null);
  useEffect(()=>{if(searchParams.get("panel")==="account")queueMicrotask(()=>setSheet("account"));},[searchParams]);
  const headerPanel=sheet==="search"||sheet==="notifications"||sheet==="account";
  const production=useBackendMode();
  const [query, setQuery] = useState("");
  const [recentSearches,setRecentSearches]=useState<string[]>([]);
  const [clearedSearches,setClearedSearches]=useState<string[]|null>(null);
  const rememberSearch=(term:string)=>{if(term.trim().length>=2){setClearedSearches(null);setRecentSearches(previous=>[term.trim(),...previous.filter(value=>value!==term.trim())].slice(0,5));}};
  const [remoteSearch,setRemoteSearch]=useState<{query:string;items:SearchItem[];loading:boolean;error:string|null}>({query:"",items:[],loading:false,error:null});
  const [timerRunning, setTimerRunning] = useState(false);
  const [dark, setDark] = useState(false);
  const [timerBaseSeconds, setTimerBaseSeconds] = useState(0);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [timerNow, setTimerNow] = useState(0);
  const [timerProjectLabel,setTimerProjectLabel]=useState("");
  const [demoSession,setDemoSession]=useState(false);
  const companyQuery=useApiQuery<{item:{name?:string}}>(production?"/api/settings/company":null);
  const notificationQuery=useApiQuery<{items:NotificationItem[]}>(production?"/api/notifications":null);
  const notifications=notificationQuery.data?.items??[];
  const notificationsLoading=notificationQuery.loading;
  const [notificationMutationError,setNotificationsError]=useState<string|null>(null);
  const notificationsError=notificationMutationError??notificationQuery.error;
  const [notificationFilter,setNotificationFilter]=useState<"all"|"unread">("all");
  const profileQuery=useApiQuery<{item?:Record<string,unknown>|null;email?:string}>(production?"/api/settings/profile":null);
  const profileItem=profileQuery.data?.item;
  const profile={name:String(profileItem?.display_name||[profileItem?.first_name,profileItem?.last_name].filter(Boolean).join(" ")||""),identity:String(profileQuery.data?.email||""),avatar:String(profileItem?.avatar_url||"")};
  const [navCompact,setNavCompact]=useState(false);
  const [timerNotice,setTimerNotice]=useState<string|null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setDark(document.documentElement.dataset.theme === "dark");
      try{const demo=window.localStorage.getItem("binso.demo.session")==="1";
      const expiresAt=Number(window.localStorage.getItem("binso.demo.expiresAt")??"0");
      const validDemo=demo&&(!expiresAt||expiresAt>Date.now());
      setDemoSession(validDemo);
      if(demo&&!validDemo){
        window.localStorage.removeItem("binso.demo.session");
        window.localStorage.removeItem("binso.demo.expiresAt");
      }}catch{setDemoSession(false)}
    });
  }, []);

  useEffect(() => {
    if(preview)return;
    const syncTimer=()=>{readTimer().then(state=>{setTimerRunning(state.running);setTimerBaseSeconds(state.seconds);setTimerStartedAt(state.running?Date.now():null);setTimerNow(Date.now());setTimerProjectLabel(state.project)}).catch(()=>undefined)};
    syncTimer();
    window.addEventListener("binso-timer-change",syncTimer);
    return()=>window.removeEventListener("binso-timer-change",syncTimer);
  }, [preview]);

  useEffect(() => {
    window.scrollTo({top:0,left:0,behavior:"auto"});
    touchedRef.current=false;
    queueMicrotask(()=>{setFormDirty(false);setSheet(null);setNavCompact(false)});
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
        if(formActive||hasBlockingModal())return;
        setSheet("search");
      }
    };
    window.addEventListener("keydown",onKeyDown);
    return()=>window.removeEventListener("keydown",onKeyDown);
  }, [formActive]);

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

  function loadNotifications(){setNotificationsError(null);notificationQuery.refresh();}

  function openNotifications(){
    setSheet("notifications");
    if(production) void loadNotifications();
  }

  async function markNotificationRead(id:string){
    try{
      await apiPatch("/api/notifications/"+encodeURIComponent(id),{});
    }catch{
      setNotificationsError("Benachrichtigung konnte nicht aktualisiert werden.");
    }
  }

  const unreadNotifications=notifications.filter(item=>!item.read_at).length;

  const filtered=production&&query.trim().length>=2&&remoteSearch.query===query.trim()?remoteSearch.items.filter(item=>canOpen(item.href)):[];


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

  return <WorkspaceActionContext.Provider value={registerContextActions}><PageAccessContext.Provider value={pageAccess}>
    {!access&&!accessError&&<AppStart/>}
    <div hidden={!access&&!accessError} ref={shellRef} data-navigation-collapsed={navigationCollapsed||undefined} className={`app-root app-section-${active} ${timerRunning && !backHref ? "timer-active" : ""} ${preview ? "app-preview" : ""} ${formActive ? "app-editing" : ""}`}>
    <ConfirmDialog open={confirmLogout} busy={logoutBusy} title="Änderungen verwerfen und abmelden?" message="Deine Änderungen sind noch nicht gespeichert." confirmLabel="Abmelden" onCancel={()=>setConfirmLogout(false)} onConfirm={()=>void logout(true)}/>
    <ConfirmDialog open={leaveHref!==null} title="Änderungen verwerfen?" message="Deine Änderungen sind noch nicht gespeichert und gehen verloren." cancelLabel="Weiter bearbeiten" confirmLabel="Änderungen verwerfen" onCancel={()=>setLeaveHref(null)} onConfirm={()=>{const href=leaveHref;setLeaveHref(null);if(href){window.dispatchEvent(new Event("binso-draft-discard"));allowDraftNavigation();if(href==="browser-back"){leaveBack();return;}const url=new URL(href);if(url.origin===window.location.origin)router.replace(url.pathname+url.search+url.hash);else window.location.assign(href);}}}/>
    {logoutError&&<div className="toast" role="alert"><Icon name="close" size={16}/><span><LocalizedText>{logoutError}</LocalizedText></span><button type="button" className="text-action" disabled={logoutBusy} onClick={()=>void logout()}><LocalizedText>{"Erneut versuchen"}</LocalizedText></button></div>}
    <aside id="customer-desktop-navigation" className="app-sidebar">
      <Link href="/dashboard" className="sidebar-logo"><Logo compact={navigationCollapsed}/></Link>
      {companyQuery.data?.item.name&&canOpen("/einstellungen/firma")&&<Link href="/einstellungen/firma" className="workspace-company" title={companyQuery.data.item.name}><Icon name="home" size={20}/>{!navigationCollapsed&&<span>{companyQuery.data.item.name}<small><LocalizedText>{"Unternehmen"}</LocalizedText></small></span>}</Link>}
      <nav aria-label={translate("Navigation")}>
        <Link href="/dashboard" aria-label={translate("Start")} title={translate("Start")} className={active==="dashboard"?"active":""} aria-current={active==="dashboard"?"page":undefined}><Icon name="home"/><span><LocalizedText>{"Start"}</LocalizedText></span></Link>
        {desktopNavGroups.map(group=>desktopNav.some(([href])=>group.paths.includes(href)&&canOpen(href))&&<div className="sidebar-nav-group" key={group.label}><span className="sidebar-nav-label"><LocalizedText>{group.label}</LocalizedText></span>{desktopNav.filter(([href])=>group.paths.includes(href)&&canOpen(href)).map(([href,label,icon])=><Link key={href} href={href} aria-label={translate(label)} title={translate(label)} className={active===href.slice(1)?"active":""} aria-current={active===href.slice(1)?"page":undefined}><Icon name={icon}/><span><LocalizedText>{label}</LocalizedText></span></Link>)}</div>)}
      </nav>
      <div className="sidebar-bottom">
        <Link href="/support" aria-label={translate("Support")} title={translate("Support")} className={active==="support" ? "active" : ""}><Icon name="support"/><span><LocalizedText>{"Support"}</LocalizedText></span></Link>
        <Link href="/einstellungen" aria-label={translate("Einstellungen")} title={translate("Einstellungen")} className={active==="einstellungen" ? "active" : ""}><Icon name="settings"/><span><LocalizedText>{"Einstellungen"}</LocalizedText></span></Link>
      </div>
    </aside>

    <div className="app-main">
      <div className="desktop-appbar">
        <DesktopNavigationToggle collapsed={navigationCollapsed} onToggle={toggleNavigation} controls="customer-desktop-navigation"/>
        <div className="workspace-location"><Link href="/dashboard"><LocalizedText>{"Arbeitsbereich"}</LocalizedText></Link><span aria-hidden="true">/</span><span><LocalizedText verbatim={titleIsUserContent}>{title}</LocalizedText></span></div>
        {!formActive&&<div className="desktop-appbar-actions"><Button className="desktop-global-search" variant="secondary" ariaLabel="Suche" icon="search" onClick={()=>setSheet("search")}><LocalizedText>{"Alles durchsuchen"}</LocalizedText><kbd>⌘ / Ctrl K</kbd></Button>{timerRunning&&<Link href="/zeit" className="desktop-header-timer" aria-label={"Zeitmessung läuft "+formattedTimer}><Icon name="clock" size={16}/><span>{formattedTimer}</span></Link>}<LocalizedElement as="button" className="desktop-notification-button" type="button" aria-label="Benachrichtigungen" onClick={openNotifications}><Icon name="bell"/>{unreadNotifications>0&&<i className="notification-badge"><LocalizedText>{unreadNotifications>9?"9+":unreadNotifications}</LocalizedText></i>}</LocalizedElement>
          <LocalizedElement as="button" className="avatar avatar-button" type="button" aria-label="Benutzerkonto" onClick={() => setSheet("account")}><Avatar name={profile.name} identity={profile.identity} src={profile.avatar} size="small"/></LocalizedElement>
        </div>}
      </div>
      <AppHeader className={headerOwnsDetail ? "mobile-header mobile-header-detail" : "mobile-header"} detail={headerOwnsDetail} plainActions={headingPlacement==="content"} leadingClassName="mobile-header-leading" leading={<>
        {headerOwnsDetail ? <Link className="mobile-back" href={backHref!} aria-label={backLabel}><Icon name="back"/></Link> : <><Link href="/dashboard" className="mobile-header-brand" aria-label="Zur Übersicht"><Logo compact={headingPlacement!=="content"}/></Link>{headingPlacement==="header"&&<h1 className="mobile-section-title"><LocalizedText verbatim={titleIsUserContent}>{title}</LocalizedText></h1>}</>}
        {headerOwnsDetail&&<h1 className="mobile-header-title"><span><LocalizedText verbatim={titleIsUserContent}>{title}</LocalizedText></span>{status!=null&&<Status tone={statusTone}>{status}</Status>}</h1>}
      </>} actionClassName={headerOwnsDetail?"mobile-detail-actions":"mobile-header-actions"} actions={headerOwnsDetail ? (allowed&&(mobileActions||visibleActions)?mobileActions??visibleActions:undefined) : <>
        <IconButton label="Suche" icon="search" onClick={()=>setSheet("search")}/>
        <LocalizedElement as="button" className="mobile-notification-button icon-button" type="button" aria-label="Benachrichtigungen" onClick={openNotifications}><Icon name="bell"/>{unreadNotifications>0&&<i className="notification-badge"><LocalizedText>{unreadNotifications>99?"99+":unreadNotifications}</LocalizedText></i>}</LocalizedElement>
        <LocalizedElement as="button" className="avatar avatar-button" type="button" aria-label="Benutzerkonto" onClick={()=>setSheet("account")}><Avatar name={profile.name} identity={profile.identity} src={profile.avatar} size="small"/></LocalizedElement>
      </>}>
        {timerRunning&&!backHref&&<Link href="/zeit" className="header-timer" aria-label={"Zeitmessung läuft "+formattedTimer}><i/><b>{formattedTimer}</b></Link>}
      </AppHeader>

      <main className="page-container" data-section={active}>
        <div className={backHref ? "page-head page-head-detail" : "page-head"} data-heading-placement={headingPlacement}>
          {backHref ? <DetailHeading verbatimTitle={titleIsUserContent} title={title} subtitle={subtitle} status={status} tone={statusTone} recordLabel={recordLabel} statusPlacement={headingPlacement==="content"?"subtitle":"title"} mobileAction={headingPlacement==="content"&&allowed?(mobileActions??visibleActions):undefined} action={(visibleActions||contextActions)&&allowed?<div className="page-actions">{visibleActions}{contextActions&&<div className="context-actions-inline">{contextActions.content}</div>}</div>:undefined} leading={<Link className={headingPlacement==="content"?"detail-back":"desktop-back"} href={backHref} aria-label={backLabel}><Icon name="back" size={16}/><LocalizedText>{backLabel}</LocalizedText></Link>}/> : <PageHeading verbatimTitle={titleIsUserContent} title={title} description={subtitle} action={(visibleActions||contextActions)&&allowed?<div className="page-actions">{visibleActions}{contextActions&&<div className="context-actions-inline">{contextActions.content}</div>}</div>:undefined}/> }
        </div>
        {allowed&&bodyControls}
        {accessError?<div role="alert"><p><LocalizedText>{accessError}</LocalizedText></p><div className="filter-sheet-actions"><Button onClick={()=>{invalidateClientSession();setAccessError(null);setAccessRetry(value=>value+1)}}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button><Link className="button button-secondary" href="/login"><LocalizedText>{"Anmelden"}</LocalizedText></Link></div></div>:(!access||allowed)?children:<EmptyState icon="lock" title="Kein Zugriff" text="Diese Seite ist für deine Rolle oder deinen Plan nicht verfügbar."/>}
      </main>

      {timerNotice&&<div className="timer-notice" role="status">{timerNotice}</div>}

      {!preview && !formActive && <MobileDock compact={navCompact}><LocalizedElement as="nav" className={`bottom-nav ${navCompact ? "is-compact" : ""}`} aria-label="Hauptnavigation">
        <Link href="/dashboard" className={active==="dashboard"?"active":""}><Icon name="home"/><span><LocalizedText>{"Start"}</LocalizedText></span></Link>
        {canOpen("/kunden")&&<Link href="/kunden" className={active==="kunden"?"active":""}><Icon name="users"/><span><LocalizedText>{"Kunden"}</LocalizedText></span></Link>}
        <Link href="/finanzen" className={["angebote","rechnungen","zahlungen","belege","finanzen"].includes(active)?"active":""}><Icon name="wallet"/><span><LocalizedText>{"Finanzen"}</LocalizedText></span></Link>
        {canOpen("/zeit")&&<Link href="/zeit" className={active==="zeit"?"active":""}><Icon name="clock"/><span><LocalizedText>{"Zeit"}</LocalizedText></span></Link>}
        <button type="button" className={["produkte","spesen","mitarbeiter","support","einstellungen"].includes(active)?"active":""} onClick={() => setSheet("more")}><Icon name="more"/><span><LocalizedText>{"Mehr"}</LocalizedText></span></button>
      </LocalizedElement></MobileDock>}

      {headerPanel&&<HeaderPanel key={sheet} kind={sheet} label={sheet==="search"?"Suche":sheet==="account"?"Konto":"Benachrichtigungen"} onClose={()=>setSheet(null)}>
        {sheet==="search"&&<SearchPanel query={query} onQuery={setQuery} items={filtered} loading={searchLoading} error={searchError} recent={recentSearches} onRemember={rememberSearch} onClearRecent={()=>{setClearedSearches(recentSearches);setRecentSearches([])}} onUndoRecent={clearedSearches?()=>{setRecentSearches(clearedSearches);setClearedSearches(null)}:undefined} onClose={()=>setSheet(null)}/>}
        {sheet==="notifications"&&<NotificationPanel items={notifications} loading={notificationsLoading} error={notificationsError} filter={notificationFilter} onFilter={setNotificationFilter} onRead={id=>void markNotificationRead(id)} onRetry={()=>void loadNotifications()} onClose={()=>setSheet(null)}/>}
        {sheet==="account"&&<AccountPanel profile={profile} demo={demoSession} logoutBusy={logoutBusy} onLogout={()=>void logout()} onClose={()=>setSheet(null)}/>}
      </HeaderPanel>}
      <ActionSheet label={sheet==="docs"?"Finanzen":"Mehr"} open={!!sheet&&!headerPanel} onClose={()=>setSheet(null)}>
        <div className="action-list">
          {(sheet==="docs"?[
            ["/finanzen","receipt","Finanzübersicht"],["/angebote","file","Angebote"],["/rechnungen","receipt","Rechnungen"],["/zahlungen","wallet","Zahlungen"],
          ]:[
            ["/angebote","file","Angebote"],["/rechnungen","receipt","Rechnungen"],["/zahlungen","wallet","Zahlungen"],["/produkte","box","Produkte"],["/projekte","box","Aufträge / Projekte"],["/mitarbeiter","users","Mitarbeiter"],["/spesen","card","Spesen"],["/finanzen/analyse","chart","Finanzanalyse"],["/berichte","chart","Berichte"],["/support","support","Support"],["/einstellungen","settings","Einstellungen"],
          ]).map(([href,icon,label])=><ActionRow key={href} href={href} icon={icon} title={label} navigation onClick={()=>setSheet(null)}/>)}
        </div>
        {sheet==="more"&&<div className="sheet-secondary"><ActionRow icon="logout" title={logoutBusy?"Wird abgemeldet…":"Abmelden"} disabled={logoutBusy} onClick={()=>void logout()}/></div>}
      </ActionSheet>
    </div>
  </div></PageAccessContext.Provider></WorkspaceActionContext.Provider>;
}

type ShellProps=Parameters<typeof AppShellFrame>[0];
type ShellConfiguration=Omit<ShellProps,"children"> & {pathname:string};
const ShellRegistration=createContext<((configuration:ShellConfiguration)=>void)|null>(null);

/** Route components register their existing heading/actions; the layout owns
 * the mounted frame, navigation, session and timer across route transitions. */
export function AppShell(props:ShellProps){
 const register=useContext(ShellRegistration),pathname=usePathname();
 const {title,titleIsUserContent,headingPlacement,recordLabel,subtitle,active,actions,mobileActions,backHref,backLabel,preview,editing,unsavedChanges,status,statusTone}=props;
 useLayoutEffect(()=>{
  register?.({pathname,title,titleIsUserContent,headingPlacement,recordLabel,subtitle,active,actions,mobileActions,backHref,backLabel,preview,editing,unsavedChanges,status,statusTone});
 },[register,pathname,title,titleIsUserContent,headingPlacement,recordLabel,subtitle,active,actions,mobileActions,backHref,backLabel,preview,editing,unsavedChanges,status,statusTone]);
 return register?props.children:<AppShellFrame {...props}/>;
}
const appSections:Record<string,string>={berichte:"Berichte",projekte:"Aufträge / Projekte",dashboard:"Übersicht",kunden:"Kunden",angebote:"Angebote",rechnungen:"Rechnungen",zahlungen:"Zahlungen",produkte:"Produkte",mitarbeiter:"Mitarbeiter",spesen:"Spesen",zeit:"Zeiterfassung",support:"Support",einstellungen:"Einstellungen",belege:"Belege",benachrichtigungen:"Benachrichtigungen",finanzen:"Finanzen"};
export function AppShellLayout({children}:{children:React.ReactNode}){
 const pathname=usePathname(),section=pathname.split("/")[1];
 const [configuration,setConfiguration]=useState<ShellConfiguration|null>(null);
 if(!Object.hasOwn(appSections,section))return children;
 const props=configuration?.pathname===pathname?configuration:{title:appSections[section],active:section};
 return <ShellRegistration.Provider value={setConfiguration}><AppShellFrame {...props}>{children}</AppShellFrame></ShellRegistration.Provider>;
}
/** Root suspense sits inside the persistent frame on an app route. */
export function RouteLoading(){
 const inShell=useContext(ShellRegistration);
 return inShell?<LoadingState aria-live="polite"><LocalizedText>{"Inhalt wird geladen …"}</LocalizedText></LoadingState>:<AppStart/>;
}
