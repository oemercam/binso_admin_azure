"use client";

import {appConfig} from "@/config/app";
import {subscribeAppEvent,appEvents} from "@/lib/client/app-events";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { listLocalRecords, loadAppPreferences, loadSettings, type AppUser, type LocalRecord } from "@/lib/local-store";
import { modules } from "@/lib/modules";
import {getDemoModuleSeed} from "@/lib/demo/module-seeds";
import { getOrganization, getSession, logout } from "@/lib/saas-store";
import { apiFetch, isProductionMode } from "@/lib/client/runtime";
import { localRoleToTenant, routePermission, tenantCan } from "@/lib/permissions";
import BrandLogo from "@/components/ui/brand-logo";
import WorkspaceRuntime from "@/components/workspace-runtime";
import {useLocale} from "@/components/locale-provider";
import ThemeToggle from "@/components/ui/theme-toggle";
import {clearUserRuntimeState} from "@/lib/client/session-cleanup";
import ResponsiveOverlay from "@/components/ui/responsive-overlay";
import {portalNavigation as groups} from "@/config/navigation";
import {planAllowsPath,type PlanId} from "@/config/plan-access";
import {uiConfig} from "@/config/ui";
import {
  ChevronDown, Clock3, FolderKanban, LayoutDashboard, Menu, ReceiptText, Search,
  X, Building2, LogOut, UserRound, SlidersHorizontal, Check, MessageSquareText, CreditCard, Bell, Headphones, Newspaper
} from "lucide-react";

type SearchItem={label:string;sub:string;href:string};

export default function Shell({ children }: { children: React.ReactNode }) {
  const {t}=useLocale();
  const [open, setOpen] = useState(false); const [moreOpen,setMoreOpen]=useState(false); const [mobileSearchOpen,setMobileSearchOpen]=useState(false); const [query,setQuery]=useState(''); const [companyOpen,setCompanyOpen]=useState(false); const [company,setCompany]=useState('Binso GmbH'); const [records,setRecords]=useState<LocalRecord[]>([]); const [users,setUsers]=useState<AppUser[]>([]); const [activeUserId,setActiveUserId]=useState('u1'); const [productionRole,setProductionRole]=useState<string>('reader'); const [permissionsReady,setPermissionsReady]=useState(false);
  const [productionPlan,setProductionPlan]=useState<PlanId>('business'); const [productionSearch,setProductionSearch]=useState<{query:string;items:SearchItem[]}>({query:"",items:[]}); const searchRef=useRef<HTMLInputElement>(null); const pathname = usePathname(); const router=useRouter(); const active = (href: string) => href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  useEffect(()=>{const t=window.setTimeout(async()=>{if(isProductionMode()){try{const me=await apiFetch<{user:{role:string};plan:PlanId}>("/api/me");setProductionRole(me.user.role);setProductionPlan(me.plan);setPermissionsReady(true)}catch{router.replace(`/portal/login?next=${encodeURIComponent(pathname)}`)}return}const session=getSession();if(!session){router.replace(`/portal/login?next=${encodeURIComponent(pathname)}`);return}const org=getOrganization(session.orgId);if(org&&!org.onboardingComplete){router.replace("/onboarding")}},0);return()=>window.clearTimeout(t)},[router,pathname]);
  useEffect(()=>{const load=()=>{const pref=loadAppPreferences();const st=loadSettings();setCompany(pref.activeCompany||st.companyName);setActiveUserId(pref.activeUserId);setUsers(st.users);setRecords(listLocalRecords());if(!isProductionMode())setPermissionsReady(true)};const t=window.setTimeout(load,0);const unsubData=subscribeAppEvent(appEvents.dataChanged,load);const unsubSettings=subscribeAppEvent(appEvents.settingsChanged,load);return()=>{window.clearTimeout(t);unsubData();unsubSettings()}},[]);
  const searchItems=useMemo<SearchItem[]>(()=>{
    const items:SearchItem[]=[];
    if(!isProductionMode())modules.filter(m=>!['einstellungen','berichte','lohn','mwst'].includes(m.key)).forEach(m=>getDemoModuleSeed(m.key).rows.forEach((r:string[],i:number)=>items.push({label:r[0],sub:m.label,href:`${m.href}/${i+1}`})));
    records.forEach(r=>items.push({label:r.row[0]||r.module,sub:r.module,href:`/${r.module}/${r.id}`}));
    return items;
  },[records]);
  useEffect(()=>{const normalized=query.trim();if(!isProductionMode()||normalized.length<2)return;const controller=new AbortController();const t=window.setTimeout(()=>{void apiFetch<{items:SearchItem[]}>(`/api/search?q=${encodeURIComponent(normalized)}`,{signal:controller.signal}).then(r=>setProductionSearch({query:normalized,items:r.items})).catch(()=>{})},appConfig.searchDebounceMs);return()=>{window.clearTimeout(t);controller.abort()}},[query]);
  const results=useMemo(()=>{const normalized=query.trim();if(isProductionMode())return normalized.length>=2&&productionSearch.query===normalized?productionSearch.items.slice(0,8):[];const q=normalized.toLowerCase();if(!q)return[];return searchItems.filter(i=>`${i.label} ${i.sub}`.toLowerCase().includes(q)).slice(0,8)},[query,searchItems,productionSearch]);
  function submitSearch(e:React.FormEvent){e.preventDefault();if(results[0]){router.push(results[0].href);setQuery('')}}
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();if(window.innerWidth<=uiConfig.breakpoints.mobile)setMobileSearchOpen(true);else searchRef.current?.focus()}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[]);
  const activeUser=users.find(u=>u.id===activeUserId)||users[0];
  const initials=(activeUser?.name||'Binso').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const effectiveRole=isProductionMode()?productionRole:localRoleToTenant(activeUser?.role||'Lesen');
  const localPlan=getSession()?getOrganization(getSession()!.orgId)?.plan||"business":"business";
  const effectivePlan:PlanId=isProductionMode()?productionPlan:localPlan;
  const canSee=(href:string)=>{const permission=routePermission(href);return planAllowsPath(effectivePlan,href)&&(!permission||tenantCan(effectiveRole,permission))};
  useEffect(()=>{if(!permissionsReady)return;if(!planAllowsPath(effectivePlan,pathname)){router.replace(`/upgrade?next=${encodeURIComponent(pathname)}`);return}const permission=routePermission(pathname);if(permission&&!tenantCan(effectiveRole,permission))router.replace('/forbidden')},[pathname,effectiveRole,effectivePlan,permissionsReady,router]);

  return <div className="app-shell">
      {open && <button className="sidebar-backdrop" aria-label={t("Navigation schliessen")} onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand-row"><Link className="brand brand-image-link" href="/dashboard" aria-label={t("Binso One Dashboard")}><BrandLogo/></Link><button className="sidebar-close" onClick={() => setOpen(false)}><X size={20}/></button></div>
        <nav className="sidebar-nav">{groups.map(group => <div className="nav-group" key={group.label}><div className="nav-group-label">{t(group.label)}</div>{group.items.filter(item=>canSee(item.href)).map(item => {const Icon = item.icon;return <Link onClick={() => setOpen(false)} key={item.href} href={item.href} className={active(item.href) ? "nav-item active" : "nav-item"}><Icon size={18} strokeWidth={1.8}/><span>{t(item.label)}</span></Link>})}</div>)}</nav>
        <div className="sidebar-footer"><BrandLogo/><small>{t("Lokale Entwicklungsumgebung")}</small></div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <Link href="/dashboard" className="mobile-brand mobile-brand-image" aria-label={t("Binso One Dashboard")}><BrandLogo compact/></Link>
          <button className="mobile-top-action mobile-search-trigger" onClick={()=>setMobileSearchOpen(true)} aria-label={t("Suche öffnen")}><Search size={18}/></button>
          <form className="search global-search" onSubmit={submitSearch}><Search size={18}/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Kunden, Rechnungen, Projekte suchen …")} aria-label={t("Globale Suche")}/><kbd>Ctrl K</kbd>{query&&<div className="search-results">{results.length?results.map(r=><Link key={`${r.href}-${r.label}`} href={r.href} onClick={()=>setQuery('')}><strong>{r.label}</strong><span>{r.sub}</span></Link>):<p>{t("Keine Treffer")}</p>}</div>}</form>
          <div className="account-menu-wrap">
            <button className="account-trigger" onClick={()=>setCompanyOpen(v=>!v)} aria-expanded={companyOpen} aria-haspopup="menu">
              <div className="account-trigger-copy"><strong>{activeUser?.name||"Benutzer"}</strong><span>{company}</span></div>
              <div className="avatar">{initials}</div>
              <ChevronDown size={14}/>
            </button>
            {companyOpen&&<div className="account-menu" role="menu">
              <div className="account-menu-profile">
                <div className="account-menu-avatar">{initials}</div>
                <div><strong>{activeUser?.name||"Benutzer"}</strong><span>{activeUser?.email||""}</span><small>{activeUser?.role||"Benutzer"}</small></div>
              </div>
              <div className="account-workspace">
                <span className="account-workspace-icon"><Building2 size={16}/></span>
                <div><small>{t("Aktuelle Firma")}</small><strong>{company}</strong></div>
                <Check size={16}/>
              </div>
              <div className="account-theme-row"><span>{t("Darstellung")}</span><ThemeToggle compact/></div>
              <div className="account-menu-section">
                <span className="account-menu-section-label">{t("Konto")}</span>
                <div className="account-menu-links">
                  <Link href="/einstellungen?tab=profil" onClick={()=>setCompanyOpen(false)}><UserRound size={17}/><span><strong>{t("Mein Profil")}</strong><small>{t("Sprache und persönliche Einstellungen")}</small></span></Link>
                  {tenantCan(effectiveRole,"organization:write")&&<Link href="/einstellungen?tab=firma" onClick={()=>setCompanyOpen(false)}><SlidersHorizontal size={17}/><span><strong>{t("Unternehmenseinstellungen")}</strong><small>{t("Firma, Benutzer und System")}</small></span></Link>}
                  {tenantCan(effectiveRole,"billing:read")&&<Link href="/abo" onClick={()=>setCompanyOpen(false)}><CreditCard size={17}/><span><strong>{t("Plan und Abrechnung")}</strong><small>{t("Abonnement und Zahlungsdaten")}</small></span></Link>}
                </div>
              </div>
              <div className="account-menu-section">
                <span className="account-menu-section-label">{t("Service")}</span>
                <div className="account-menu-links">
                  <Link href="/benachrichtigungen" onClick={()=>setCompanyOpen(false)}><Bell size={17}/><span><strong>{t("Benachrichtigungen")}</strong><small>{t("Hinweise und Aktivitäten")}</small></span></Link>
                  <Link href="/neuigkeiten" onClick={()=>setCompanyOpen(false)}><Newspaper size={17}/><span><strong>{t("Neuigkeiten")}</strong><small>{t("Änderungen und neue Funktionen")}</small></span></Link>
                  <Link href="/support" onClick={()=>setCompanyOpen(false)}><Headphones size={17}/><span><strong>{t("Support")}</strong><small>{t("Hilfe und Supportanfragen")}</small></span></Link>
                  <Link href="/feedback" onClick={()=>setCompanyOpen(false)}><MessageSquareText size={17}/><span><strong>{t("Feedback geben")}</strong><small>{t("Idee, Fehler oder Verbesserung melden")}</small></span></Link>
                </div>
              </div>
              <button className="account-logout" onClick={async()=>{if(isProductionMode()){try{await apiFetch("/api/auth/logout",{method:"POST",body:"{}"})}catch{}}else logout();await clearUserRuntimeState();setCompanyOpen(false);router.push("/portal/login")}}><LogOut size={17}/><span>{t("Abmelden")}</span></button>
            </div>}
          </div>
        </header>
        <main>{children}</main>
        <nav className="mobile-nav" aria-label={t("Mobile Navigation")}>
          <Link href="/dashboard" className={active("/dashboard")?"mobile-nav-item active":"mobile-nav-item"}><LayoutDashboard size={20}/><span>{t("Start")}</span></Link>
          <Link href="/projekte" className={active("/projekte")?"mobile-nav-item active":"mobile-nav-item"}><FolderKanban size={20}/><span>{t("Projekte")}</span></Link>
          <Link href="/zeiterfassung" className={active("/zeiterfassung")?"mobile-nav-item active":"mobile-nav-item"}><Clock3 size={20}/><span>{t("Zeit")}</span></Link>
          <Link href="/rechnungen" className={active("/rechnungen")?"mobile-nav-item active":"mobile-nav-item"}><ReceiptText size={20}/><span>{t("Rechnungen")}</span></Link>
          <button className={moreOpen?"mobile-nav-item active":"mobile-nav-item"} onClick={()=>setMoreOpen(true)}><Menu size={20}/><span>{t("Mehr")}</span></button>
        </nav>

        <ResponsiveOverlay open={mobileSearchOpen} title={t("Suchen")} onClose={()=>setMobileSearchOpen(false)} size="md">
          <div className="mobile-search-panel">
            <form className="mobile-search-field" onSubmit={e=>{submitSearch(e);setMobileSearchOpen(false)}}><Search size={17}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Kunden, Rechnungen, Projekte …")}/></form>
            <div className="mobile-search-results">{query?(results.length?results.map(r=><Link key={`m-${r.href}-${r.label}`} href={r.href} onClick={()=>{setQuery("");setMobileSearchOpen(false)}}><strong>{r.label}</strong><span>{r.sub}</span></Link>):<p>{t("Keine Treffer")}</p>):<p>{t("Suche nach Kunden, Rechnungen, Projekten und weiteren Einträgen.")}</p>}</div>
          </div>
        </ResponsiveOverlay>

        <ResponsiveOverlay open={moreOpen} title={t("Navigation")} onClose={()=>setMoreOpen(false)} size="md">
          <div className="mobile-more-content">
            {groups.slice(1).map(group=><div className="sheet-group" key={group.label}>
              <span className="sheet-group-label">{t(group.label)}</span>
              <div className="sheet-group-links">{group.items.filter(item=>canSee(item.href)).map(item=>{const Icon=item.icon;return <Link key={item.href} href={item.href} onClick={()=>setMoreOpen(false)} className={active(item.href)?"active":""}><Icon size={18}/><span>{t(item.label)}</span></Link>})}</div>
            </div>)}
          </div>
        </ResponsiveOverlay>
      </div>
      {permissionsReady&&<WorkspaceRuntime/>}
    </div>
}
