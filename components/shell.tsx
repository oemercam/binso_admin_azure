"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { listLocalRecords, loadAppPreferences, loadSettings, type AppUser, type LocalRecord } from "@/lib/local-store";
import { modules } from "@/lib/modules";
import { getOrganization, getSession, logout } from "@/lib/saas-store";
import { apiFetch, isProductionMode } from "@/lib/client/runtime";
import { localRoleToTenant, permissionForModule, routePermission, tenantCan } from "@/lib/permissions";
import BrandLogo from "@/components/ui/brand-logo";
import ThemeToggle from "@/components/ui/theme-toggle";
import {
  BarChart3, BadgeDollarSign, Banknote, BriefcaseBusiness, ChevronDown, Clock3,
  FileCheck2, FolderKanban, LayoutDashboard, Menu, Percent, ReceiptText, Search,
  Settings, Users, WalletCards, X, Building2, BookOpen, ListTodo, CalendarOff, Files, Package, LogOut, Plus, UserRound, SlidersHorizontal, Check, Headphones, MessageSquareText, Bell, CreditCard
} from "lucide-react";

const groups = [
  { label: "Ãœbersicht", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },{label:"Aufgaben",href:"/aufgaben",icon:ListTodo}] },
  { label: "Verkauf", items: [
    { label: "Kunden", href: "/kunden", icon: Users },
    { label: "Offerten", href: "/offerten", icon: FileCheck2 },
    { label: "AuftrÃ¤ge", href: "/auftraege", icon: BriefcaseBusiness },
    { label: "Rechnungen", href: "/rechnungen", icon: ReceiptText },
    { label: "Zahlungen", href: "/zahlungen", icon: Banknote },
  ]},
  { label: "Projekte", items: [
    { label: "Projekte", href: "/projekte", icon: FolderKanban },
    { label: "Zeiterfassung", href: "/zeiterfassung", icon: Clock3 },
    { label: "Spesen", href: "/spesen", icon: WalletCards },
  ]},
  { label: "Einkauf", items: [
    {label:"Lieferanten",href:"/lieferanten",icon:Building2},
    {label:"Eingangsrechnungen",href:"/eingangsrechnungen",icon:ReceiptText},
  ]},
  { label: "Finanzen", items: [
    {label:"Buchhaltung",href:"/buchhaltung",icon:BookOpen},
    {label:"Bank",href:"/bank",icon:Banknote},
    { label: "MWST", href: "/mwst", icon: Percent },
    { label: "Berichte", href: "/berichte", icon: BarChart3 },
  ]},
  { label: "Personal", items: [
    { label: "Mitarbeitende", href: "/personal", icon: Users },
    {label:"Abwesenheiten",href:"/abwesenheiten",icon:CalendarOff},
    { label: "Lohn", href: "/lohn", icon: BadgeDollarSign },
  ]},
  { label: "Stammdaten", items: [
    {label:"Produkte und Leistungen",href:"/produkte",icon:Package},
    {label:"Dokumente",href:"/dokumente",icon:Files},
    {label:"VertrÃ¤ge",href:"/vertraege",icon:FileCheck2},
  ]},
  { label: "System", items: [{ label: "Benachrichtigungen", href: "/benachrichtigungen", icon: Bell },{ label: "Support", href: "/support", icon: Headphones },{ label: "Neuigkeiten", href: "/neuigkeiten", icon: Bell },{ label: "Einstellungen", href: "/einstellungen", icon: Settings }] }
]

type SearchItem={label:string;sub:string;href:string};

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false); const [moreOpen,setMoreOpen]=useState(false); const [actionOpen,setActionOpen]=useState(false); const [mobileSearchOpen,setMobileSearchOpen]=useState(false); const [query,setQuery]=useState(''); const [companyOpen,setCompanyOpen]=useState(false); const [company,setCompany]=useState('Binso GmbH'); const [records,setRecords]=useState<LocalRecord[]>([]); const [users,setUsers]=useState<AppUser[]>([]); const [activeUserId,setActiveUserId]=useState('u1'); const [productionRole,setProductionRole]=useState<string>('reader'); const [permissionsReady,setPermissionsReady]=useState(false);
  const [productionSearch,setProductionSearch]=useState<{query:string;items:SearchItem[]}>({query:"",items:[]}); const searchRef=useRef<HTMLInputElement>(null); const pathname = usePathname(); const router=useRouter(); const active = (href: string) => href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  useEffect(()=>{const t=window.setTimeout(async()=>{if(isProductionMode()){try{const me=await apiFetch<{user:{role:string}}>("/api/me");setProductionRole(me.user.role);setPermissionsReady(true)}catch{router.replace("/login")}return}const session=getSession();if(!session){router.replace("/login");return}const org=getOrganization(session.orgId);if(org&&!org.onboardingComplete){router.replace("/onboarding")}},0);return()=>window.clearTimeout(t)},[router]);
  useEffect(()=>{const load=()=>{const pref=loadAppPreferences();const st=loadSettings();setCompany(pref.activeCompany||st.companyName);setActiveUserId(pref.activeUserId);setUsers(st.users);setRecords(listLocalRecords());if(!isProductionMode())setPermissionsReady(true)};const t=window.setTimeout(load,0);window.addEventListener('binso-data-changed',load);window.addEventListener('binso-settings-changed',load);return()=>{window.clearTimeout(t);window.removeEventListener('binso-data-changed',load);window.removeEventListener('binso-settings-changed',load)}},[]);
  const searchItems=useMemo<SearchItem[]>(()=>{
    const items:SearchItem[]=[];
    modules.filter(m=>!['einstellungen','berichte','lohn','mwst'].includes(m.key)).forEach(m=>m.rows?.forEach((r,i)=>items.push({label:r[0],sub:m.label,href:`${m.href}/${i+1}`})));
    records.forEach(r=>items.push({label:r.row[0]||r.module,sub:r.module,href:`/${r.module}/${r.id}`}));
    return items;
  },[records]);
  useEffect(()=>{const q=query.trim();if(!isProductionMode()||q.length<2)return;const controller=new AbortController();const t=window.setTimeout(()=>{void apiFetch<{items:SearchItem[]}>(`/api/search?q=${encodeURIComponent(q)}`,{signal:controller.signal}).then(r=>setProductionSearch({query:q,items:r.items})).catch(()=>{})},180);return()=>{window.clearTimeout(t);controller.abort()}},[query]);
  const results=useMemo(()=>{if(isProductionMode()){const q=query.trim();if(q.length<2||productionSearch.query!==q)return[];return productionSearch.items.slice(0,8)}const q=query.trim().toLowerCase();if(!q)return[];return searchItems.filter(i=>`${i.label} ${i.sub}`.toLowerCase().includes(q)).slice(0,8)},[query,searchItems,productionSearch]);
  function submitSearch(e:React.FormEvent){e.preventDefault();if(results[0]){router.push(results[0].href);setQuery('')}}
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();if(window.innerWidth<=760)setMobileSearchOpen(true);else searchRef.current?.focus()}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[]);
  const activeUser=users.find(u=>u.id===activeUserId)||users[0];
  const initials=(activeUser?.name||'Binso').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const effectiveRole=isProductionMode()?productionRole:localRoleToTenant(activeUser?.role||'Lesen');
  const canSee=(href:string)=>{const permission=routePermission(href);return !permission||tenantCan(effectiveRole,permission)};
  const canWrite=(moduleKey:string)=>{const permission=permissionForModule(moduleKey,'write');return Boolean(permission&&tenantCan(effectiveRole,permission))};
  useEffect(()=>{if(!permissionsReady)return;const permission=routePermission(pathname);if(permission&&!tenantCan(effectiveRole,permission))router.replace('/forbidden')},[pathname,effectiveRole,permissionsReady,router]);

  return <div className="app-shell">
      {open && <button className="sidebar-backdrop" aria-label="Navigation schliessen" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand-row"><Link className="brand brand-image-link" href="/dashboard" aria-label="Binso One Dashboard"><BrandLogo/></Link><button className="sidebar-close" onClick={() => setOpen(false)}><X size={20}/></button></div>
        <nav className="sidebar-nav">{groups.map(group => <div className="nav-group" key={group.label}><div className="nav-group-label">{group.label}</div>{group.items.filter(item=>canSee(item.href)).map(item => {const Icon = item.icon;return <Link onClick={() => setOpen(false)} key={item.href} href={item.href} className={active(item.href) ? "nav-item active" : "nav-item"}><Icon size={18} strokeWidth={1.8}/><span>{item.label}</span></Link>})}</div>)}</nav>
        <div className="sidebar-footer"><BrandLogo/><small>{isProductionMode()?"Produktivumgebung":"Lokale Entwicklungsumgebung"}</small></div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <Link href="/dashboard" className="mobile-brand mobile-brand-image" aria-label="Binso One Dashboard"><BrandLogo compact/></Link>
          <button className="mobile-top-action mobile-search-trigger" onClick={()=>setMobileSearchOpen(true)} aria-label="Suche Ã¶ffnen"><Search size={18}/></button>
          <form className="search global-search" onSubmit={submitSearch}><Search size={18}/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kunden, Rechnungen, Projekte suchen â€¦" aria-label="Globale Suche"/><kbd>Ctrl K</kbd>{query&&<div className="search-results">{results.length?results.map(r=><Link key={`${r.href}-${r.label}`} href={r.href} onClick={()=>setQuery('')}><strong>{r.label}</strong><span>{r.sub}</span></Link>):<p>Keine Treffer</p>}</div>}</form>
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
                <div><small>Aktuelle Firma</small><strong>{company}</strong></div>
                <Check size={16}/>
              </div>
              <div className="account-theme-row"><span>Darstellung</span><ThemeToggle compact/></div><div className="account-menu-links">
                <Link href="/einstellungen?tab=profil" onClick={()=>setCompanyOpen(false)}><UserRound size={17}/><span><strong>Mein Profil</strong><small>Sprache und persÃ¶nliche Einstellungen</small></span></Link>
                <Link href="/feedback" onClick={()=>setCompanyOpen(false)}><MessageSquareText size={17}/><span><strong>Feedback geben</strong><small>Idee, Fehler oder Verbesserung melden</small></span></Link>
                {tenantCan(effectiveRole,"organization:write")&&<Link href="/einstellungen?tab=firma" onClick={()=>setCompanyOpen(false)}><SlidersHorizontal size={17}/><span><strong>Unternehmenseinstellungen</strong><small>Firma, Benutzer und System</small></span></Link>}
                {tenantCan(effectiveRole,"billing:read")&&<Link href="/abo" onClick={()=>setCompanyOpen(false)}><CreditCard size={17}/><span><strong>Plan und Abrechnung</strong><small>Abonnement und Zahlungsdaten</small></span></Link>}
              </div>
              <button className="account-logout" onClick={async()=>{if(isProductionMode()){try{await apiFetch("/api/auth/logout",{method:"POST",body:"{}"})}catch{}}else logout();setCompanyOpen(false);router.push("/login")}}><LogOut size={17}/><span>Abmelden</span></button>
            </div>}
          </div>
        </header>
        <main>{children}</main>
        <nav className="mobile-nav" aria-label="Mobile Navigation">
          <Link href="/dashboard" className={active("/dashboard")?"mobile-nav-item active":"mobile-nav-item"}><LayoutDashboard size={20}/><span>Ãœbersicht</span></Link>
          <Link href="/kunden" className={active("/kunden")?"mobile-nav-item active":"mobile-nav-item"}><Users size={20}/><span>Kunden</span></Link>
          <button className="mobile-nav-item mobile-nav-create" onClick={()=>setActionOpen(true)} aria-label="Neu erstellen"><Plus size={24}/><span>Neu</span></button>
          <Link href="/zeiterfassung" className={active("/zeiterfassung")?"mobile-nav-item active":"mobile-nav-item"}><Clock3 size={20}/><span>Zeit</span></Link>
          <button className={moreOpen?"mobile-nav-item active":"mobile-nav-item"} onClick={()=>setMoreOpen(true)}><Menu size={20}/><span>Mehr</span></button>
        </nav>

        {actionOpen&&<div className="mobile-sheet-backdrop" onClick={()=>setActionOpen(false)}>
          <div className="mobile-action-sheet mobile-sheet" onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle"/>
            <div className="sheet-title-row"><div><h2>Neu erstellen</h2></div><button className="sheet-close" onClick={()=>setActionOpen(false)} aria-label="Schliessen"><X size={18}/></button></div>
            <div className="mobile-action-grid">
              {canWrite("kunden")&&<Link href="/kunden/neu" onClick={()=>setActionOpen(false)}><Users size={19}/><span>Kunde</span></Link>}
              {canWrite("offerten")&&<Link href="/offerten/neu" onClick={()=>setActionOpen(false)}><FileCheck2 size={19}/><span>Offerte</span></Link>}
              {canWrite("rechnungen")&&<Link href="/rechnungen/neu" onClick={()=>setActionOpen(false)}><ReceiptText size={19}/><span>Rechnung</span></Link>}
              {canWrite("zeiterfassung")&&<Link href="/zeiterfassung/neu" onClick={()=>setActionOpen(false)}><Clock3 size={19}/><span>Zeit</span></Link>}
              {canWrite("spesen")&&<Link href="/spesen/neu" onClick={()=>setActionOpen(false)}><WalletCards size={19}/><span>Spese</span></Link>}
              {canWrite("aufgaben")&&<Link href="/aufgaben/neu" onClick={()=>setActionOpen(false)}><ListTodo size={19}/><span>Aufgabe</span></Link>}
            </div>
          </div>
        </div>}

        {mobileSearchOpen&&<div className="mobile-sheet-backdrop" onClick={()=>setMobileSearchOpen(false)}>
          <div className="mobile-search-sheet mobile-sheet" onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle"/>
            <div className="sheet-title-row"><h2>Suchen</h2><button className="sheet-close" onClick={()=>setMobileSearchOpen(false)} aria-label="Schliessen"><X size={18}/></button></div>
            <div className="mobile-search-panel">
              <form className="mobile-search-field" onSubmit={e=>{submitSearch(e);setMobileSearchOpen(false)}}><Search size={17}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kunden, Rechnungen, Projekte â€¦"/></form>
              <div className="mobile-search-results">{query?(results.length?results.map(r=><Link key={`m-${r.href}-${r.label}`} href={r.href} onClick={()=>{setQuery("");setMobileSearchOpen(false)}}><strong>{r.label}</strong><span>{r.sub}</span></Link>):<p>Keine Treffer</p>):<p>Suche nach Kunden, Rechnungen, Projekten und weiteren EintrÃ¤gen.</p>}</div>
            </div>
          </div>
        </div>}

        {moreOpen&&<div className="mobile-sheet-backdrop" onClick={()=>setMoreOpen(false)}>
          <div className="mobile-more-sheet mobile-sheet" onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle"/>
            <div className="sheet-title-row"><h2>Navigation</h2><button className="sheet-close" onClick={()=>setMoreOpen(false)} aria-label="Schliessen"><X size={18}/></button></div>
            {groups.slice(1).map(group=><div className="sheet-group" key={group.label}>
              <span className="sheet-group-label">{group.label}</span>
              <div className="sheet-group-links">{group.items.filter(item=>canSee(item.href)).map(item=>{const Icon=item.icon;return <Link key={item.href} href={item.href} onClick={()=>setMoreOpen(false)} className={active(item.href)?"active":""}><Icon size={18}/><span>{item.label}</span></Link>})}</div>
            </div>)}
          </div>
        </div>}
      </div>
    </div>
}

