"use client";

import {appConfig} from "@/config/app";
import {subscribeAppEvent,appEvents} from "@/lib/client/app-events";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {listLocalRecords,loadAppPreferences,loadSettings,type AppUser,type LocalRecord} from "@/lib/local-store";
import {modules} from "@/lib/modules";
import {getDemoModuleSeed} from "@/lib/demo/module-seeds";
import {getOrganization,getSession,logout} from "@/lib/saas-store";
import {apiFetch,isProductionMode} from "@/lib/client/runtime";
import {localRoleToTenant,routePermission,tenantCan} from "@/lib/permissions";
import BrandLogo from "@/components/ui/brand-logo";
import WorkspaceRuntime from "@/components/workspace-runtime";
import {useLocale} from "@/components/locale-provider";
import ThemeToggle from "@/components/ui/theme-toggle";
import {clearUserRuntimeState} from "@/lib/client/session-cleanup";
import ResponsiveOverlay from "@/components/ui/responsive-overlay";
import MobileNavigationRow from "@/components/navigation/mobile-navigation-row";
import {mobileMoreNavigation,mobileQuickCreate,portalNavigation as groups} from "@/config/navigation";
import {getWorkspaceRouteMetadata} from "@/config/route-metadata";
import {planAllowsPath,type PlanId} from "@/config/plan-access";
import {uiConfig} from "@/config/ui";
import {
  Bell,Building2,Check,ChevronDown,Clock3,CreditCard,Headphones,LayoutDashboard,
  LogOut,MessageSquareText,Newspaper,Plus,Search,SlidersHorizontal,UserRound,Users,X
} from "lucide-react";

type SearchItem={label:string;sub:string;href:string};
type ShellUser={id:string;name:string;email:string;role:string};

export default function Shell({children}:{children:React.ReactNode}){
 const {t}=useLocale();
 const [open,setOpen]=useState(false);
 const [moreOpen,setMoreOpen]=useState(false);
 const [createOpen,setCreateOpen]=useState(false);
 const [query,setQuery]=useState("");
 const [companyOpen,setCompanyOpen]=useState(false);
 const [company,setCompany]=useState("Binso GmbH");
 const [records,setRecords]=useState<LocalRecord[]>([]);
 const [users,setUsers]=useState<AppUser[]>([]);
 const [activeUserId,setActiveUserId]=useState("u1");
 const [productionRole,setProductionRole]=useState<string>("reader");
 const [productionUser,setProductionUser]=useState<ShellUser|null>(null);
 const [permissionsReady,setPermissionsReady]=useState(false);
 const [productionPlan,setProductionPlan]=useState<PlanId>("business");
 const [productionSearch,setProductionSearch]=useState<{query:string;items:SearchItem[]}>({query:"",items:[]});
 const [compactViewport,setCompactViewport]=useState(false);
 const searchRef=useRef<HTMLInputElement>(null);
 const accountRef=useRef<HTMLDivElement>(null);
 const moreHistoryRef=useRef<{active:boolean;baseState:unknown}>({active:false,baseState:null});
 const pathname=usePathname();
 const router=useRouter();
 const routeMeta=getWorkspaceRouteMetadata(pathname);
 const active=(href:string)=>href==="/dashboard"?pathname==="/dashboard":pathname===href||pathname.startsWith(`${href}/`);

 useEffect(()=>{const media=window.matchMedia(`(max-width: ${uiConfig.breakpoints.mobile}px)`);const sync=()=>setCompactViewport(media.matches);sync();media.addEventListener("change",sync);return()=>media.removeEventListener("change",sync)},[]);
 useEffect(()=>{const timer=window.setTimeout(async()=>{if(isProductionMode()){try{const me=await apiFetch<{user:ShellUser;plan:PlanId}>("/api/me");setProductionUser(me.user);setProductionRole(me.user.role);setProductionPlan(me.plan);setPermissionsReady(true);void apiFetch<{organization?:{name?:string}}>("/api/organization").then(result=>{if(result.organization?.name)setCompany(result.organization.name)}).catch(()=>{})}catch{router.replace(`/portal/login?next=${encodeURIComponent(pathname)}`)}return}const session=getSession();if(!session){router.replace(`/portal/login?next=${encodeURIComponent(pathname)}`);return}const org=getOrganization(session.orgId);if(org&&!org.onboardingComplete)router.replace("/onboarding")},0);return()=>window.clearTimeout(timer)},[router,pathname]);
 useEffect(()=>{const load=()=>{const pref=loadAppPreferences();const st=loadSettings();if(!isProductionMode())setCompany(pref.activeCompany||st.companyName);setActiveUserId(pref.activeUserId);setUsers(st.users);setRecords(listLocalRecords());if(!isProductionMode())setPermissionsReady(true)};const timer=window.setTimeout(load,0);const unsubData=subscribeAppEvent(appEvents.dataChanged,load);const unsubSettings=subscribeAppEvent(appEvents.settingsChanged,load);return()=>{window.clearTimeout(timer);unsubData();unsubSettings()}},[]);

 const searchItems=useMemo<SearchItem[]>(()=>{const items:SearchItem[]=[];if(!isProductionMode())modules.filter(m=>!["einstellungen","berichte","lohn","mwst"].includes(m.key)).forEach(m=>getDemoModuleSeed(m.key).rows.forEach((r:string[],i:number)=>items.push({label:t(r[0]),sub:t(m.label),href:`${m.href}/${i+1}`})));records.forEach(r=>items.push({label:r.row[0]||r.module,sub:r.module,href:`/${r.module}/${r.id}`}));return items},[records,t]);
 useEffect(()=>{const normalized=query.trim();if(!isProductionMode()||normalized.length<2)return;const controller=new AbortController();const timer=window.setTimeout(()=>{void apiFetch<{items:SearchItem[]}>(`/api/search?q=${encodeURIComponent(normalized)}`,{signal:controller.signal}).then(r=>{if(!controller.signal.aborted)setProductionSearch({query:normalized,items:r.items})}).catch(()=>{if(!controller.signal.aborted)setProductionSearch({query:normalized,items:[]})})},appConfig.searchDebounceMs);return()=>{window.clearTimeout(timer);controller.abort()}},[query]);
 const normalizedSearchQuery=query.trim();
 const searchLoading=isProductionMode()&&normalizedSearchQuery.length>=2&&productionSearch.query!==normalizedSearchQuery;
 const results=useMemo(()=>{const normalized=query.trim();if(isProductionMode())return normalized.length>=2&&productionSearch.query===normalized?productionSearch.items.slice(0,8):[];const q=normalized.toLowerCase();if(!q)return[];return searchItems.filter(i=>`${i.label} ${i.sub}`.toLowerCase().includes(q)).slice(0,8)},[query,searchItems,productionSearch]);
 function submitSearch(e:React.FormEvent){e.preventDefault();if(results[0]){router.push(results[0].href);setQuery("")}}
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"&&window.innerWidth>uiConfig.breakpoints.mobile){e.preventDefault();searchRef.current?.focus()}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[]);
 useEffect(()=>{if(!companyOpen||compactViewport)return;const close=(event:PointerEvent)=>{if(accountRef.current&&!accountRef.current.contains(event.target as Node))setCompanyOpen(false)};const key=(event:KeyboardEvent)=>{if(event.key==="Escape")setCompanyOpen(false)};document.addEventListener("pointerdown",close);document.addEventListener("keydown",key);return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",key)}},[companyOpen,compactViewport]);

 const activeUser:ShellUser|AppUser|undefined=isProductionMode()?productionUser??undefined:users.find(u=>u.id===activeUserId)||users[0];
 const initials=(activeUser?.name||"Binso").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
 const effectiveRole=isProductionMode()?productionRole:localRoleToTenant(activeUser?.role||"Lesen");
 const localPlan=getSession()?getOrganization(getSession()!.orgId)?.plan||"business":"business";
 const effectivePlan:PlanId=isProductionMode()?productionPlan:localPlan;
 const canSee=(href:string)=>{const permission=routePermission(href);return planAllowsPath(effectivePlan,href)&&(!permission||tenantCan(effectiveRole,permission))};
 useEffect(()=>{if(!permissionsReady)return;if(!planAllowsPath(effectivePlan,pathname)){router.replace(`/upgrade?next=${encodeURIComponent(pathname)}`);return}const permission=routePermission(pathname);if(permission&&!tenantCan(effectiveRole,permission))router.replace("/forbidden")},[pathname,effectiveRole,effectivePlan,permissionsReady,router]);

 function openMoreNavigation(){
  if(moreOpen)return;
  const baseState=window.history.state;
  const nextState=baseState&&typeof baseState==="object"?{...baseState,__binsoOverlay:"navigation"}:{__binsoOverlay:"navigation"};
  moreHistoryRef.current={active:true,baseState};
  window.history.pushState(nextState,"",window.location.href);
  setMoreOpen(true);
 }
 function closeMoreNavigation(){
  if(moreHistoryRef.current.active&&window.history.state?.__binsoOverlay==="navigation"){window.history.back();return}
  moreHistoryRef.current={active:false,baseState:null};
  setMoreOpen(false);
 }
 function navigateFromMore(href:string){
  if(moreHistoryRef.current.active&&window.history.state?.__binsoOverlay==="navigation"){window.history.replaceState(moreHistoryRef.current.baseState,"",window.location.href)}
  moreHistoryRef.current={active:false,baseState:null};
  setMoreOpen(false);
  router.push(href);
 }
 useEffect(()=>{const onPopState=()=>{if(moreHistoryRef.current.active){moreHistoryRef.current={active:false,baseState:null};setMoreOpen(false)}};window.addEventListener("popstate",onPopState);return()=>window.removeEventListener("popstate",onPopState)},[]);

 async function signOut(){if(moreHistoryRef.current.active&&window.history.state?.__binsoOverlay==="navigation")window.history.replaceState(moreHistoryRef.current.baseState,"",window.location.href);moreHistoryRef.current={active:false,baseState:null};setMoreOpen(false);if(isProductionMode()){try{await apiFetch("/api/auth/logout",{method:"POST",body:"{}"})}catch{}}else logout();await clearUserRuntimeState();setCompanyOpen(false);router.push("/portal/login")}

 const accountContent=<div className="account-menu-content">
  <div className="account-menu-profile"><div className="account-menu-avatar">{initials}</div><div><strong>{activeUser?.name||t("Benutzer")}</strong><span>{activeUser?.email||""}</span><small>{activeUser?.role||t("Benutzer")}</small></div></div>
  <div className="account-workspace"><span className="account-workspace-icon"><Building2 size={16}/></span><div><small>{t("Aktuelle Firma")}</small><strong>{company}</strong></div><Check size={16}/></div>
  <div className="account-theme-row"><span>{t("Darstellung")}</span><ThemeToggle compact/></div>
  <div className="account-menu-section"><span className="account-menu-section-label">{t("Konto")}</span><div className="account-menu-links">
   <Link href="/einstellungen?tab=profil" onClick={()=>setCompanyOpen(false)}><UserRound size={17}/><span><strong>{t("Mein Profil")}</strong><small>{t("Sprache und persönliche Einstellungen")}</small></span></Link>
   {tenantCan(effectiveRole,"organization:write")&&<Link href="/einstellungen?tab=firma" onClick={()=>setCompanyOpen(false)}><SlidersHorizontal size={17}/><span><strong>{t("Unternehmenseinstellungen")}</strong><small>{t("Firma, Benutzer und System")}</small></span></Link>}
   {tenantCan(effectiveRole,"billing:read")&&<Link href="/abo" onClick={()=>setCompanyOpen(false)}><CreditCard size={17}/><span><strong>{t("Plan und Abrechnung")}</strong><small>{t("Abonnement und Zahlungsdaten")}</small></span></Link>}
  </div></div>
  <div className="account-menu-section"><span className="account-menu-section-label">{t("Service")}</span><div className="account-menu-links">
   <Link href="/benachrichtigungen" onClick={()=>setCompanyOpen(false)}><Bell size={17}/><span><strong>{t("Benachrichtigungen")}</strong><small>{t("Hinweise und Aktivitäten")}</small></span></Link>
   <Link href="/neuigkeiten" onClick={()=>setCompanyOpen(false)}><Newspaper size={17}/><span><strong>{t("Neuigkeiten")}</strong><small>{t("Änderungen und neue Funktionen")}</small></span></Link>
   <Link href="/support" onClick={()=>setCompanyOpen(false)}><Headphones size={17}/><span><strong>{t("Support")}</strong><small>{t("Hilfe und Supportanfragen")}</small></span></Link>
   <Link href="/feedback" onClick={()=>setCompanyOpen(false)}><MessageSquareText size={17}/><span><strong>{t("Feedback geben")}</strong><small>{t("Idee, Fehler oder Verbesserung melden")}</small></span></Link>
  </div></div>
  <button className="account-logout" onClick={()=>void signOut()}><LogOut size={17}/><span>{t("Abmelden")}</span></button>
 </div>;

 return <div className="app-shell">
  {open&&<button className="sidebar-backdrop" aria-label={t("Navigation schliessen")} onClick={()=>setOpen(false)}/>}
  <aside className={`sidebar ${open?"sidebar-open":""}`}>
   <div className="sidebar-brand-row"><Link className="brand brand-image-link" href="/dashboard" aria-label={t("Binso One Dashboard")}><BrandLogo/></Link><button className="sidebar-close" onClick={()=>setOpen(false)}><X size={20}/></button></div>
   <nav className="sidebar-nav">{groups.map(group=><div className="nav-group" key={group.label}><div className="nav-group-label">{t(group.label)}</div>{group.items.filter(item=>canSee(item.href)).map(item=>{const Icon=item.icon;return <Link onClick={()=>setOpen(false)} key={item.href} href={item.href} className={active(item.href)?"nav-item active":"nav-item"}><Icon size={18} strokeWidth={1.8}/><span>{t(item.label)}</span></Link>})}</div>)}</nav>
   <div className="sidebar-footer"><BrandLogo/><small>{t("Lokale Entwicklungsumgebung")}</small></div>
  </aside>

  <div className="content-shell">
   <header className="topbar">
    <Link href="/dashboard" className="mobile-brand mobile-brand-image" aria-label={t("Binso One Dashboard")}><BrandLogo/></Link>
    {!compactViewport&&<form className="search global-search" role="search" onSubmit={submitSearch}><Search size={18}/><input ref={searchRef} type="search" autoComplete="off" enterKeyHint="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Kunden, Rechnungen, Projekte suchen …")} aria-label={t("Globale Suche")}/><kbd>Ctrl K</kbd>{query&&<div className="search-results" role="listbox" aria-label={t("Suchergebnisse")}>{query.trim().length<2?<p>{t("Mindestens 2 Zeichen eingeben")}</p>:searchLoading?<p>{t("Suche läuft …")}</p>:results.length?results.map(r=><Link role="option" aria-selected="false" key={`${r.href}-${r.label}`} href={r.href} onClick={()=>setQuery("")}><strong>{r.label}</strong><span>{t(r.sub)}</span></Link>):<p>{t("Keine Treffer")}</p>}</div>}</form>}
    <div className="account-menu-wrap" ref={accountRef}>
     <button className="account-trigger" onClick={()=>setCompanyOpen(v=>!v)} aria-expanded={companyOpen} aria-haspopup="menu" aria-label={t("Benutzermenü")}><div className="account-trigger-copy"><strong>{activeUser?.name||t("Benutzer")}</strong><span>{company}</span></div><div className="avatar">{initials}</div><ChevronDown size={14}/></button>
     {companyOpen&&!compactViewport&&<div className="account-menu" role="menu">{accountContent}</div>}
    </div>
   </header>

   <main>{children}</main>

   <nav className="mobile-nav" aria-label={t("Mobile Navigation")}>
    <Link href="/dashboard" className={routeMeta?.mobileBottomNav==="dashboard"?"mobile-nav-item active":"mobile-nav-item"}><LayoutDashboard size={20}/><span>{t("Start")}</span></Link>
    <Link href="/kunden" className={routeMeta?.mobileBottomNav==="kunden"?"mobile-nav-item active":"mobile-nav-item"}><Users size={20}/><span>{t("Kunden")}</span></Link>
    <button className="mobile-nav-item mobile-nav-create" onClick={()=>setCreateOpen(true)} aria-label={t("Neu erstellen")}><span className="mobile-nav-create-icon"><Plus size={22}/></span><span>{t("Neu")}</span></button>
    <Link href="/zeiterfassung" className={routeMeta?.mobileBottomNav==="zeiterfassung"?"mobile-nav-item active":"mobile-nav-item"}><Clock3 size={20}/><span>{t("Zeit")}</span></Link>
    <button className={moreOpen||routeMeta?.mobileBottomNav==="more"?"mobile-nav-item active":"mobile-nav-item"} onClick={()=>moreOpen?closeMoreNavigation():openMoreNavigation()} aria-expanded={moreOpen} aria-haspopup="dialog" aria-label={t("Navigation")}><span className="workspace-menu-toggle-glyph" aria-hidden="true"><span/><span/><span/></span><span>{t("Mehr")}</span></button>
   </nav>

   <ResponsiveOverlay open={createOpen} title={t("Neu erstellen")} onClose={()=>setCreateOpen(false)} size="sm"><div className="mobile-create-sheet list-sheet-options">{mobileQuickCreate.filter(item=>canSee(item.href.replace(/\/neu$/,""))).map(item=>{const Icon=item.icon;return <Link key={item.href} href={item.href} onClick={()=>setCreateOpen(false)}><Icon size={18}/><span>{t(item.label)}</span></Link>})}</div></ResponsiveOverlay>

   {compactViewport&&<ResponsiveOverlay open={companyOpen} title={t("Konto")} onClose={()=>setCompanyOpen(false)} size="sm" className="mobile-account-overlay">{accountContent}</ResponsiveOverlay>}

   <ResponsiveOverlay open={moreOpen} title={t("Navigation")} onClose={closeMoreNavigation} size="md" showHandle={false} className="workspace-navigation-overlay"><div className="mobile-more-content">
    <div className="mobile-navigation-groups">{mobileMoreNavigation.map(group=>{const visible=group.items.filter(item=>canSee(item.href));if(!visible.length)return null;return <section className="mobile-navigation-group" key={group.label}><h3>{t(group.label)}</h3><div className="mobile-navigation-links">{visible.map(item=><MobileNavigationRow key={item.href} href={item.href} label={t(item.label)} icon={item.icon} active={active(item.href)} onNavigate={()=>navigateFromMore(item.href)}/>)}</div></section>})}</div>
    <footer className="mobile-navigation-footer">
     <div className="mobile-navigation-user"><div className="mobile-navigation-user-avatar" aria-hidden="true">{initials}</div><div><strong>{activeUser?.name||t("Benutzer")}</strong>{activeUser?.email&&<span>{activeUser.email}</span>}</div></div>
     <Link className="mobile-navigation-settings" href="/einstellungen" onClick={event=>{event.preventDefault();navigateFromMore("/einstellungen")}}><SlidersHorizontal size={18}/><span>{t("Einstellungen")}</span></Link>
     <button className="mobile-navigation-logout" type="button" onClick={()=>void signOut()}><LogOut size={18}/><span>{t("Abmelden")}</span></button>
     <small className="mobile-navigation-version">{t("Version")} {appConfig.appVersion}</small>
    </footer>
   </div></ResponsiveOverlay>
  </div>
  {permissionsReady&&<WorkspaceRuntime/>}
 </div>;
}
