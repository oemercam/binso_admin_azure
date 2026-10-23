"use client";

import {LocalizedText,LocalizedElement,useTranslation,useLocale} from "@/lib/client/locale";
import {asLocale} from '@/lib/locales';
import {PageAccessContext} from "@/lib/client/page-access";
import {tenantCanOpenPath,tenantCan,tenantCanCreateAt,permissionForModule,type ModuleProfile} from "@/lib/permissions";
import {moduleForPath,planAllowsPath,type PlanId} from "@/config/plan-access";
import Link from "next/link";
import {loadTheme,saveTheme} from "@/lib/client/theme";
import {AppStart} from "./app-start";
import {useNavigationScroll} from "./use-navigation-scroll";
import {TimerResumeNotice} from "./timer-resume-notice";
import { hasBlockingModal } from "./use-dialog-focus";
import {pageOrientation} from "@/lib/page-orientation";
import {safeAppPath} from "@/lib/navigation";
import { usePathname, useRouter } from "next/navigation";
import { Children, isValidElement, cloneElement, createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {WorkspaceActionContext} from '@/lib/client/workspace-actions';
import {RecordsControls} from './records';
import {useBrowserBackGuard,allowDraftNavigation} from "./use-browser-back-guard";
import ConfirmDialog from "./confirm-dialog";
import { ActionRow, ActionSheet, PageHeading, DetailHeading, CreateAction, QuickCreateAction } from "./binso-ux";
import {Button, EmptyState, Icon, IconButton, Logo, LoadingState, FormActions} from "./ui";
import {useApiQuery,useDataRevision} from "@/lib/client/use-api-query";
import { apiGet, apiPatch, apiPost, logoutClientSession, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {invalidateClientSession,type ClientSession} from "@/lib/client/session-cache";
import type { SearchItem } from "@/lib/search";
import {SearchPanel,NotificationPanel,AccountPanel,type PanelNotification} from "./header-panel-content";
import {HeaderPanel} from "./header-panel";
import {Avatar} from "./avatar";
import {SettingsWorkspace} from "./settings-navigation";
import {UserProfileContext} from '@/lib/client/user-profile';
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
  ["/projekte","Aufträge","box"],
  ["/spesen","Spesen","card"],
  ["/finanzen","Finanzen","chart"],
  ["/berichte","Berichte","chart"],
  ["/mitarbeiter","Mitarbeiter","users"],
  ["/abwesenheiten","Abwesenheiten","calendar"],
  ["/lieferanten","Lieferanten","building"],
  ["/vertraege","Verträge","file"],
] as const;

const desktopNavGroups = [
  {label:"Verkauf",paths:["/kunden","/angebote","/rechnungen","/produkte"]},
  {label:"Arbeit & Team",paths:["/projekte","/zeit","/mitarbeiter","/abwesenheiten"]},
  {label:"Finanzen",paths:["/zahlungen","/spesen","/lieferanten","/vertraege","/finanzen","/berichte"]},
];

type NotificationItem=PanelNotification;

function accessFromSession(session:ClientSession|null){return session?.authenticated?{role:session.tenant?.role??"reader",plan:session.tenant?.plan??"pro" as PlanId,readOnly:session.tenant?.readOnly===true,moduleProfile:session.tenant?.moduleProfile??"standard"}:null;}

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
  headerActions,
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
  headerActions?: React.ReactNode;
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
  useNavigationScroll(pathname);
  const formActive=editing||pathname.endsWith("/neu");
  const chatActive=/^\/support\/[^/]+$/.test(pathname)&&!pathname.endsWith("/neu");
  const [access,setAccess]=useState<{role:string;plan:PlanId;readOnly:boolean;moduleProfile:ModuleProfile}|null>(null);
  const workspaceReady=!!access;
  const [accessRetry,setAccessRetry]=useState(0);
  const [accessError,setAccessError]=useState<string|null>(null);
  useEffect(()=>{
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

  const canOpen=useCallback((href:string)=>{if(!access)return false;const path=href.split('?')[0];const accessModule=moduleForPath(path);return tenantCanOpenPath(access.role,path,access.moduleProfile)&&planAllowsPath(access.plan,path)&&(!path.endsWith('/neu')||tenantCanCreateAt(access.role,path,access.moduleProfile)&&(!access.readOnly||path.startsWith('/support/'))&&(!accessModule||tenantCan(access.role,permissionForModule(accessModule,'write')??'organization:write',access.moduleProfile)));},[access]);
  useEffect(()=>{if(access?.moduleProfile==='time_only'&&pathname==='/dashboard')router.replace('/zeit');},[access?.moduleProfile,pathname,router]);
  const homeHref=access?.moduleProfile==='time_only'?'/zeit':'/dashboard';
  const accessModule=moduleForPath(pathname);
  const settingsWrite=pathname==='/einstellungen/team'?'users:manage':pathname==='/einstellungen/abonnement'?'billing:write':['/einstellungen/firma','/einstellungen/dokumente','/einstellungen/zeiterfassung'].includes(pathname)?'organization:write':'organization:read';
  const personalSettings=pathname.startsWith('/einstellungen')&&!['/einstellungen/firma','/einstellungen/dokumente','/einstellungen/team','/einstellungen/abonnement','/einstellungen/zeiterfassung'].includes(pathname);
  const canWrite=!!access&&(!access.readOnly||personalSettings||active==='support')&&(access.moduleProfile==='time_only'&&personalSettings?canOpen(pathname):tenantCan(access.role,pathname.startsWith('/einstellungen')?settingsWrite:accessModule?permissionForModule(accessModule,'write')??'organization:read':active==='finanzen'?'accounting:write':'support:write',access.moduleProfile));
  const hasPermission=useCallback((permission:Parameters<typeof tenantCan>[1])=>!!access&&tenantCan(access.role,permission,access.moduleProfile),[access]);
  const pageAccess=useMemo(()=>({write:canWrite,canOpen,hasPermission}),[canWrite,canOpen,hasPermission]);
  const listControls=isValidElement<{children?:React.ReactNode}>(actions)&&actions.type===RecordsControls?actions:null;
  const visibleActions=listControls?listControls.props.children:actions;
  const contentCreate=isValidElement<{icon?:string}>(visibleActions)&&(visibleActions.type===CreateAction||visibleActions.type===QuickCreateAction||visibleActions.type===Button&&visibleActions.props.icon==="plus");
  const childNodes=Children.toArray(children);
  const inlineControls=childNodes.find(child=>isValidElement(child)&&child.type===RecordsControls);
  const bodyControls=listControls?cloneElement(listControls,{children:undefined}):inlineControls;
  const pageChildren=inlineControls?childNodes.filter(child=>child!==inlineControls):children;
  const orientation=preview||["/dashboard","/kunden","/finanzen","/zeit"].includes(pathname)?undefined:pageOrientation(pathname,editing,access?.role);
  const headingSubtitle=orientation&&!(subtitle&&/^\d+\s/.test(subtitle))?undefined:subtitle;
  const headingCreate=contentCreate&&pathname==="/dashboard";
  const headingActions=contentCreate&&!headingCreate?undefined:visibleActions;
  const headerOwnsDetail=!!backHref;
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

  const [query, setQuery] = useState("");
  const [recentSearches,setRecentSearches]=useState<string[]>([]);
  const [clearedSearches,setClearedSearches]=useState<string[]|null>(null);
  const rememberSearch=(term:string)=>{if(term.trim().length>=2){setClearedSearches(null);setRecentSearches(previous=>[term.trim(),...previous.filter(value=>value!==term.trim())].slice(0,5));}};
  const [remoteSearch,setRemoteSearch]=useState<{query:string;items:SearchItem[];loading:boolean;error:string|null}>({query:"",items:[],loading:false,error:null});
  const [dark, setDark] = useState(false);


  const companyQuery=useApiQuery<{item:{name?:string}}>(canOpen("/einstellungen/firma")?"/api/settings/company":null);
  const notificationQuery=useApiQuery<{items:NotificationItem[]}>(workspaceReady?"/api/notifications":null);
  const notifications=notificationQuery.data?.items??[];
  const notificationsLoading=notificationQuery.loading;
  const [notificationMutationError,setNotificationsError]=useState<string|null>(null);
  const notificationsError=notificationMutationError??notificationQuery.error;
  const [notificationFilter,setNotificationFilter]=useState<"all"|"unread">("all");
  const profileQuery=useApiQuery<{item?:Record<string,unknown>|null;email?:string}>(workspaceReady?"/api/settings/profile":null);
  const profileItem=profileQuery.data?.item;
  const {choose:chooseLocale}=useLocale(),lastProfileLocale=useRef('');
  useEffect(()=>{if(!profileItem?.id||!profileItem.language)return;const key=String(profileItem.id)+':'+String(profileItem.language);if(lastProfileLocale.current===key)return;lastProfileLocale.current=key;chooseLocale(asLocale(profileItem.language));},[profileItem?.id,profileItem?.language,chooseLocale]);
  const profile={name:String(profileItem?.display_name||[profileItem?.first_name,profileItem?.last_name].filter(Boolean).join(" ")||""),identity:String(profileQuery.data?.email||""),avatar:String(profileItem?.avatar_url||"")};
  const [timerNotice,setTimerNotice]=useState<string|null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setDark(document.documentElement.dataset.theme === "dark");

    });
  }, []);



  useEffect(() => {
    touchedRef.current=false;
    queueMicrotask(()=>{setFormDirty(false);setSheet(null)});
  }, [pathname]);



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



  useEffect(()=>{
    let active=true;
    const term=query.trim();
    if(term.length<2)return;
    queueMicrotask(()=>{if(active)setRemoteSearch({query:term,items:[],loading:true,error:null})});
    const timer=window.setTimeout(()=>{
      apiGet<{items:SearchItem[]}>("/api/search?q="+encodeURIComponent(term))
        .then(payload=>{if(active)setRemoteSearch({query:term,items:payload.items,loading:false,error:null})})
        .catch(error=>{if(active)setRemoteSearch({query:term,items:[],loading:false,error:error instanceof Error?error.message:"Suche konnte nicht geladen werden."})});
    },180);
    return()=>{active=false;window.clearTimeout(timer)};
  },[query]);

  const searchLoading=query.trim().length>=2&&(remoteSearch.query!==query.trim()||remoteSearch.loading);
  const searchError=remoteSearch.query===query.trim()?remoteSearch.error:null;

  async function loadNotifications(){
    setNotificationsError(null);
    try{await apiPost('/api/notifications/followups',{});}
    catch(error){setNotificationsError(error instanceof Error?error.message:'Aktion fehlgeschlagen.');}
  }

  function openNotifications(){
    setSheet("notifications");
    void loadNotifications();
  }

  async function markNotificationRead(id:string){
    try{
      await apiPatch("/api/notifications/"+encodeURIComponent(id),{});
    }catch{
      setNotificationsError("Benachrichtigung konnte nicht aktualisiert werden.");
    }
  }

  const unreadNotifications=notifications.filter(item=>!item.read_at).length;

  const filtered=query.trim().length>=2&&remoteSearch.query===query.trim()?remoteSearch.items.filter(item=>canOpen(item.href)):[];


  useEffect(()=>{
    const listener=(event:Event)=>setDark((event as CustomEvent<{resolved:string}>).detail.resolved==="dark");
    window.addEventListener("binso-theme",listener);
    if(workspaceReady)void loadTheme().catch(()=>{});
    return()=>window.removeEventListener("binso-theme",listener);
  },[workspaceReady]);
  async function toggleTheme(){try{await saveTheme(dark?"light":"dark");}catch{setTimerNotice("Darstellung konnte nicht gespeichert werden.");}}





  async function logout(confirmed=false){
    if(logoutBusyRef.current)return;
    if(dirty&&!confirmed){setSheet(null);setConfirmLogout(true);return;}
    logoutBusyRef.current=true;setLogoutBusy(true);setLogoutError(null);
    try{await logoutClientSession();allowDraftNavigation();window.location.replace("/login");}
    catch(error){setConfirmLogout(false);setLogoutError(error instanceof Error?error.message:"Abmelden ist fehlgeschlagen. Bitte erneut versuchen.");logoutBusyRef.current=false;setLogoutBusy(false);}
  }



  return <UserProfileContext.Provider value={profileItem??null}><WorkspaceActionContext.Provider value={registerContextActions}><PageAccessContext.Provider value={pageAccess}>
    {!access&&!accessError&&<AppStart/>}
    <div hidden={!access&&!accessError} ref={shellRef} data-ux={(["/dashboard","/kunden","/finanzen","/zeit","/einstellungen"].includes(pathname)||pathname.startsWith("/einstellungen/"))?"master-v3":undefined} data-unsaved={dirty||undefined} data-navigation-collapsed={navigationCollapsed||undefined} className={`app-root app-section-${active} ${preview ? "app-preview" : ""} ${formActive ? "app-editing" : ""} ${chatActive ? "app-chat" : ""}`}>
    <ConfirmDialog open={confirmLogout} busy={logoutBusy} title="Änderungen verwerfen und abmelden?" message="Deine Änderungen sind noch nicht gespeichert." confirmLabel="Abmelden" onCancel={()=>setConfirmLogout(false)} onConfirm={()=>void logout(true)}/>
    <TimerResumeNotice enabled={workspaceReady&&!preview} onOpenTimer={()=>{if(dirty)setLeaveHref(new URL('/zeit',window.location.origin).href);else router.push('/zeit');}}/>
    <ConfirmDialog open={leaveHref!==null} title="Änderungen verwerfen?" message="Deine Änderungen sind noch nicht gespeichert und gehen verloren." cancelLabel="Weiter bearbeiten" confirmLabel="Änderungen verwerfen" onCancel={()=>setLeaveHref(null)} onConfirm={()=>{const href=leaveHref;setLeaveHref(null);if(href){window.dispatchEvent(new Event("binso-draft-discard"));allowDraftNavigation();if(href==="browser-back"){leaveBack();return;}const url=new URL(href);if(url.origin===window.location.origin)router.replace(url.pathname+url.search+url.hash);else window.location.assign(href);}}}/>
    {logoutError&&<div className="toast" role="alert"><Icon name="close" size={16}/><span><LocalizedText>{logoutError}</LocalizedText></span><button type="button" className="text-action" disabled={logoutBusy} onClick={()=>void logout()}><LocalizedText>{"Erneut versuchen"}</LocalizedText></button></div>}
    <aside id="customer-desktop-navigation" className="app-sidebar">
      <Link href={homeHref} className="sidebar-logo" aria-label={translate("Zur Übersicht")}>{(["/dashboard","/kunden","/finanzen","/zeit","/einstellungen"].includes(pathname)||pathname.startsWith("/einstellungen/"))?<><Logo compact/><span hidden={navigationCollapsed}>One</span></>:<><Icon name="home"/><span hidden={navigationCollapsed}><LocalizedText>{"Start"}</LocalizedText></span></>}</Link>
      {companyQuery.data?.item.name&&canOpen("/einstellungen/firma")&&<Link href="/einstellungen/firma" className="workspace-company" title={companyQuery.data.item.name}><Icon name="home" size={20}/>{!navigationCollapsed&&<span>{companyQuery.data.item.name}<small><LocalizedText>{"Unternehmen"}</LocalizedText></small></span>}</Link>}
      <nav aria-label={translate("Navigation")}>
        {canOpen("/dashboard")&&<Link href="/dashboard" aria-label={translate("Start")} title={translate("Start")} className={active==="dashboard"?"active":""} aria-current={active==="dashboard"?"page":undefined}><Icon name="home"/><span><LocalizedText>{"Start"}</LocalizedText></span></Link>}
        {desktopNavGroups.map(group=>desktopNav.some(([href])=>group.paths.includes(href)&&canOpen(href))&&<div className="sidebar-nav-group" key={group.label}><span className="sidebar-nav-label"><LocalizedText>{group.label}</LocalizedText></span>{desktopNav.filter(([href])=>group.paths.includes(href)&&canOpen(href)).map(([href,label,icon])=><Link key={href} href={href} aria-label={translate(label)} title={translate(label)} className={active===href.slice(1)?"active":""} aria-current={active===href.slice(1)?"page":undefined}><Icon name={icon}/><span><LocalizedText>{label}</LocalizedText></span></Link>)}</div>)}
      </nav>
      <div className="sidebar-bottom">
        <Link href="/support" aria-label={translate("Support")} title={translate("Support")} className={active==="support" ? "active" : ""} aria-current={active==="support"?"page":undefined}><Icon name="support"/><span><LocalizedText>{"Support"}</LocalizedText></span></Link>
        <Link href="/einstellungen" aria-label={translate("Einstellungen")} title={translate("Einstellungen")} className={active==="einstellungen" ? "active" : ""} aria-current={active==="einstellungen"?"page":undefined}><Icon name="settings"/><span><LocalizedText>{"Einstellungen"}</LocalizedText></span></Link>
      </div>
    </aside>

    <div className="app-main">
      <div className="desktop-appbar">
        <DesktopNavigationToggle collapsed={navigationCollapsed} onToggle={toggleNavigation} controls="customer-desktop-navigation"/>
        {!formActive&&<div className="desktop-appbar-actions">{allowed&&headerActions}<Button className="desktop-global-search" variant="secondary" ariaLabel="Suche" icon="search" onClick={()=>setSheet("search")}><LocalizedText>{"Alles durchsuchen"}</LocalizedText><kbd>⌘ / Ctrl K</kbd></Button><LocalizedElement as="button" className="desktop-notification-button" type="button" aria-label="Benachrichtigungen" onClick={openNotifications}><Icon name="bell"/>{unreadNotifications>0&&<i className="notification-badge"><LocalizedText>{unreadNotifications>9?"9+":unreadNotifications}</LocalizedText></i>}</LocalizedElement>
          <LocalizedElement as="button" className="avatar avatar-button" type="button" aria-label="Benutzerkonto" onClick={() => setSheet("account")}><Avatar name={profile.name} identity={profile.identity} src={profile.avatar} size="small"/></LocalizedElement>
        </div>}
      </div>
      <AppHeader className={headerOwnsDetail ? "mobile-header mobile-header-detail" : "mobile-header"} detail={headerOwnsDetail} contentHeader={headingPlacement==="content"} leadingClassName="mobile-header-leading" leading={<>
        {headerOwnsDetail ? !formActive&&<Link scroll={false} className="mobile-back" href={backHref!} aria-label={backLabel}><Icon name="back"/></Link> : pathname==="/dashboard" ? <Link href="/dashboard" className="mobile-header-brand" aria-label="Zur Übersicht"><Logo compact/><span>One</span></Link> : <h1 className="mobile-section-title"><LocalizedText verbatim={titleIsUserContent}>{title}</LocalizedText></h1>}
        {headerOwnsDetail&&<div className="mobile-header-context"><h1 className="mobile-header-title"><span><LocalizedText verbatim={titleIsUserContent}>{title}</LocalizedText></span></h1></div>}
      </>} actionClassName={headerOwnsDetail?"mobile-detail-actions":"mobile-header-actions"} actions={headerOwnsDetail ? (allowed&&(headerActions||mobileActions||headingActions)?<>{headerActions}{mobileActions??headingActions}</>:undefined) : <>
        {allowed&&(headerActions??mobileActions)}
        <IconButton label="Suche" icon="search" onClick={()=>setSheet("search")}/>
        <LocalizedElement as="button" className="mobile-notification-button icon-button" type="button" aria-label="Benachrichtigungen" onClick={openNotifications}><Icon name="bell"/>{unreadNotifications>0&&<i className="notification-badge"><LocalizedText>{unreadNotifications>99?"99+":unreadNotifications}</LocalizedText></i>}</LocalizedElement>
        <LocalizedElement as="button" className="avatar avatar-button" type="button" aria-label="Benutzerkonto" onClick={()=>setSheet("account")}><Avatar name={profile.name} identity={profile.identity} src={profile.avatar} size="small"/></LocalizedElement>
      </>}>

      </AppHeader>

      <main className="page-container" data-section={active}>
        <div className={backHref ? "page-head page-head-detail" : "page-head"} data-heading-placement={headingPlacement}>
          {backHref ? <DetailHeading verbatimTitle={titleIsUserContent} title={title} subtitle={headingSubtitle} status={status} tone={statusTone} recordLabel={recordLabel} statusPlacement={headingPlacement==="content"?"subtitle":"title"} mobileAction={undefined} action={(headingActions||contextActions)&&allowed?<div className="page-actions">{headingActions}{contextActions&&<div className="context-actions-inline">{contextActions.content}</div>}</div>:undefined} leading={!formActive?<Link scroll={false} className="desktop-back" href={backHref} aria-label={backLabel}><Icon name="back" size={16}/><LocalizedText>{backLabel}</LocalizedText></Link>:undefined}/> : <PageHeading verbatimTitle={titleIsUserContent} title={title} description={headingSubtitle} action={(headingActions||contextActions)&&allowed?<div className="page-actions">{headingActions}{contextActions&&<div className="context-actions-inline">{contextActions.content}</div>}</div>:undefined}/> }
        </div>
        {allowed&&orientation&&<p className="page-orientation"><LocalizedText>{orientation}</LocalizedText></p>}
        <SettingsWorkspace>
        {allowed&&(bodyControls||contentCreate&&!headingCreate)&&<div className="workspace-command-bar">{bodyControls}{contentCreate&&!headingCreate&&visibleActions}</div>}
        {accessError?<div role="alert"><p><LocalizedText>{accessError}</LocalizedText></p><FormActions sheet><Button onClick={()=>{invalidateClientSession();setAccessError(null);setAccessRetry(value=>value+1)}}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button><Link className="button button-secondary" href="/login"><LocalizedText>{"Anmelden"}</LocalizedText></Link></FormActions></div>:!access?null:allowed?pageChildren:<EmptyState  title="Kein Zugriff" description="Diese Seite ist für deine Rolle oder deinen Plan nicht verfügbar."/>}
        </SettingsWorkspace>
      </main>

      {timerNotice&&<div className="timer-notice" role="status">{timerNotice}</div>}

      {!preview && !formActive && !chatActive && <MobileDock><LocalizedElement as="nav" className="bottom-nav" data-module-profile={access?.moduleProfile} data-visible-count={1+['/dashboard','/kunden','/finanzen','/zeit'].filter(canOpen).length} aria-label="Hauptnavigation">
        {canOpen("/dashboard")&&<Link href="/dashboard" className={active==="dashboard"?"active":""}><Icon name="home"/><span><LocalizedText>{"Start"}</LocalizedText></span></Link>}
        {canOpen("/kunden")&&<Link href="/kunden" className={active==="kunden"?"active":""}><Icon name="users"/><span><LocalizedText>{"Kunden"}</LocalizedText></span></Link>}
        {canOpen("/finanzen")&&<Link href="/finanzen" className={["angebote","rechnungen","zahlungen","belege","finanzen"].includes(active)?"active":""}><Icon name="wallet"/><span><LocalizedText>{"Finanzen"}</LocalizedText></span></Link>}
        {canOpen("/zeit")&&<Link href="/zeit" className={active==="zeit"?"active":""}><Icon name="clock"/><span><LocalizedText>{"Zeit"}</LocalizedText></span></Link>}
        <button type="button" className={["produkte","spesen","mitarbeiter","support","einstellungen"].includes(active)?"active":""} onClick={() => setSheet("more")}><Icon name="more"/><span><LocalizedText>{"Mehr"}</LocalizedText></span></button>
      </LocalizedElement></MobileDock>}

      {headerPanel&&<HeaderPanel key={sheet} kind={sheet} label={sheet==="search"?"Suche":sheet==="account"?"Konto":"Benachrichtigungen"} onClose={()=>setSheet(null)}>
        {sheet==="search"&&<SearchPanel query={query} onQuery={setQuery} items={filtered} loading={searchLoading} error={searchError} recent={recentSearches} onRemember={rememberSearch} onClearRecent={()=>{setClearedSearches(recentSearches);setRecentSearches([])}} onUndoRecent={clearedSearches?()=>{setRecentSearches(clearedSearches);setClearedSearches(null)}:undefined} onClose={()=>setSheet(null)}/>}
        {sheet==="notifications"&&<NotificationPanel items={notifications} loading={notificationsLoading} error={notificationsError} filter={notificationFilter} onFilter={setNotificationFilter} onRead={id=>void markNotificationRead(id)} onRetry={()=>void loadNotifications()} onClose={()=>setSheet(null)}/>}
        {sheet==="account"&&<AccountPanel profile={profile} logoutBusy={logoutBusy} onLogout={()=>void logout()} onClose={()=>setSheet(null)}/>}
      </HeaderPanel>}
      <ActionSheet label={sheet==="docs"?"Finanzen":"Mehr"} open={!!sheet&&!headerPanel} onClose={()=>setSheet(null)}>
        <div className="action-list">
          {(sheet==="docs"?[
            ["/finanzen","receipt","Finanzübersicht"],["/angebote","file","Angebote"],["/rechnungen","receipt","Rechnungen"],["/zahlungen","wallet","Zahlungen"],
          ]:[
            ["/angebote","file","Angebote"],["/rechnungen","receipt","Rechnungen"],["/zahlungen","wallet","Zahlungen"],["/produkte","box","Produkte"],["/projekte","box","Aufträge"],["/mitarbeiter","users","Mitarbeiter"],["/spesen","card","Spesen"],["/finanzen/analyse","chart","Finanzanalyse"],["/berichte","chart","Berichte"],["/support","support","Support"],["/einstellungen","settings","Einstellungen"],
          ]).filter(([href])=>canOpen(href)).map(([href,icon,label])=><ActionRow key={href} href={href} icon={icon} title={label} navigation onClick={()=>setSheet(null)}/>)}
        </div>
        {sheet==="more"&&<div className="sheet-secondary"><ActionRow icon="logout" title={logoutBusy?"Wird abgemeldet…":"Abmelden"} disabled={logoutBusy} onClick={()=>void logout()}/></div>}
      </ActionSheet>
    </div>
  </div></PageAccessContext.Provider></WorkspaceActionContext.Provider></UserProfileContext.Provider>;
}

type ShellProps=Parameters<typeof AppShellFrame>[0];
type ShellConfiguration=Omit<ShellProps,"children"> & {pathname:string};
const ShellRegistration=createContext<((configuration:ShellConfiguration)=>void)|null>(null);

/** Route components register their existing heading/actions; the layout owns
 * the mounted frame, navigation, session and timer across route transitions. */
export function AppShell(props:ShellProps){
 const register=useContext(ShellRegistration),pathname=usePathname();
 const {title,titleIsUserContent,headingPlacement,recordLabel,subtitle,active,actions,mobileActions,headerActions,backHref,backLabel,preview,editing,unsavedChanges,status,statusTone}=props;
 useLayoutEffect(()=>{
  register?.({pathname,title,titleIsUserContent,headingPlacement,recordLabel,subtitle,active,actions,mobileActions,headerActions,backHref,backLabel,preview,editing,unsavedChanges,status,statusTone});
 },[register,pathname,title,titleIsUserContent,headingPlacement,recordLabel,subtitle,active,actions,mobileActions,headerActions,backHref,backLabel,preview,editing,unsavedChanges,status,statusTone]);
 return register?props.children:<AppShellFrame {...props}/>;
}
const appSections:Record<string,string>={vertraege:"Verträge",abwesenheiten:"Abwesenheiten",berichte:"Berichte",projekte:"Aufträge",dashboard:"Übersicht",kunden:"Kunden",angebote:"Angebote",rechnungen:"Rechnungen",zahlungen:"Zahlungen",produkte:"Produkte",mitarbeiter:"Mitarbeiter",spesen:"Spesen",zeit:"Zeiterfassung",support:"Support",einstellungen:"Einstellungen",belege:"Belege",benachrichtigungen:"Benachrichtigungen",finanzen:"Finanzen"};
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
 return inShell?<LoadingState/>:<AppStart/>;
}
