"use client";

import Link from "next/link";
import type {SearchItem} from "@/lib/search";
import {usePageAccess} from "@/lib/client/page-access";
import {Avatar} from "./avatar";
import {Button,EmptyState,Icon} from "./ui";

export type PanelNotification={id:string;kind:string;title:string;body:string;href?:string|null;read_at?:string|null;created_at:string};

function PanelLink({href,icon,title,onClose}:{href:string;icon:string;title:string;onClose:()=>void}){
 const access=usePageAccess();if(!access.canOpen(href))return null;
 return <Link prefetch={false} href={href} className="action-row" onClick={onClose}><Icon name={icon} size={18}/><span>{title}</span><Icon name="arrow" size={16}/></Link>;
}

export function SearchPanel({query,onQuery,items,loading,error,onClose}:{query:string;onQuery:(query:string)=>void;items:SearchItem[];loading:boolean;error:string|null;onClose:()=>void}){
 const access=usePageAccess();const visible=items.filter(item=>access.canOpen(item.href));
 const groups=Array.from(new Set(visible.map(item=>item.type)));
 return <div className="global-search">
  <div className="header-search-controls"><div className="searchbox" role="search"><Icon name="search"/><input aria-label="Suchen" autoFocus value={query} onChange={e=>onQuery(e.target.value)} placeholder="Suchen…"/>{query&&<button className="search-clear" type="button" aria-label="Suche löschen" onClick={()=>onQuery("")}><Icon name="close" size={15}/></button>}</div><button type="button" className="text-action" onClick={onClose}>Abbrechen</button></div>
  <div className="search-results">
   {!query.trim()&&<><h3>Schnellzugriff</h3><div>{[["/kunden","users","Kunden öffnen"],["/rechnungen","receipt","Rechnungen öffnen"],["/angebote","file","Angebote öffnen"]].map(([href,icon,title])=><PanelLink key={href} href={href} icon={icon} title={title} onClose={onClose}/>)}</div></>}
   {loading&&<p className="technical-hint" role="status">Suche läuft …</p>}
   {query.trim().length>=2&&!loading&&error&&<p className="technical-hint" role="alert">{error}</p>}
   {query.trim().length>=2&&!loading&&!error&&visible.length===0&&<EmptyState compact title="Keine Treffer gefunden" text=""/>}
   {groups.map(type=><section key={type}><h3>{type}</h3>{visible.filter(item=>item.type===type).map(item=><Link key={item.href} href={item.href} onClick={onClose}><span className="activity-icon"><Icon name={item.icon}/></span><div><b>{item.title}</b><span>{item.meta}</span></div><Icon name="arrow" size={16}/></Link>)}</section>)}
  </div>
 </div>;
}

export function NotificationPanel({items,loading,error,filter,onFilter,onRead,onReadAll,onRetry,onClose}:{items:PanelNotification[];loading:boolean;error:string|null;filter:"all"|"unread";onFilter:(filter:"all"|"unread")=>void;onRead:(id:string)=>void;onReadAll:()=>void;onRetry:()=>void;onClose:()=>void}){
 const access=usePageAccess();const visible=items.filter(item=>(filter==="all"||!item.read_at)&&(!item.href||access.canOpen(item.href)));
 return <div className="notification-list">
  <div className="header-notification-filters"><button type="button" aria-pressed={filter==="all"} onClick={()=>onFilter("all")}>Alle</button><button type="button" aria-pressed={filter==="unread"} onClick={()=>onFilter("unread")}>Ungelesen</button>{items.some(item=>!item.read_at)&&<button type="button" className="text-action" onClick={onReadAll}>Alle als gelesen</button>}</div>
  {loading&&<p role="status">Wird geladen …</p>}
  {error&&<div role="alert"><p>{error}</p><Button variant="secondary" onClick={onRetry}>Erneut laden</Button></div>}
  {!loading&&!error&&!visible.length&&<EmptyState compact title={filter==="unread"?"Keine ungelesenen Benachrichtigungen":"Keine Benachrichtigungen"} text=""/>}
  {!error&&visible.map(item=><Link prefetch={false} href={item.href||"/benachrichtigungen"} key={item.id} onClick={()=>{onRead(item.id);onClose()}}><span className="activity-icon"><Icon name={item.kind==="support"?"support":item.kind==="payment"?"wallet":"bell"}/></span><div><b>{item.title}</b><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"})}</small></div>{!item.read_at&&<i className="unread-dot"/>}</Link>)}
  <Link className="notification-settings-link" href="/benachrichtigungen" onClick={onClose}><span>Alle Benachrichtigungen</span><Icon name="arrow" size={15}/></Link>
 </div>;
}

export function AccountPanel({profile,demo,logoutBusy,onLogout,onClose}:{profile:{name:string;identity:string;avatar:string};demo:boolean;logoutBusy:boolean;onLogout:()=>void;onClose:()=>void}){
 return <div className="account-sheet"><div className="account-sheet-profile"><Avatar name={profile.name} identity={profile.identity} src={profile.avatar} size="large"/><div><b>{profile.name||"Persönliches Konto"}</b><small>Persönliches Konto</small></div></div>
  <h3>Persönlich</h3><div>{[["/einstellungen/konto","user","Mein Profil"],["/einstellungen/sicherheit","lock","Sicherheit"],["/einstellungen/benachrichtigungen","bell","Benachrichtigungen"],["/einstellungen/darstellung","moon","Darstellung & Sprache"]].map(([href,icon,title])=><PanelLink key={href} href={href} icon={icon} title={title} onClose={onClose}/>)}</div>
  <div className="sheet-secondary"><PanelLink href="/einstellungen" icon="settings" title="Unternehmenseinstellungen" onClose={onClose}/></div>
  {demo&&<div className="sheet-secondary"><PanelLink href="/registrieren" icon="plus" title="Eigenes Konto erstellen" onClose={onClose}/></div>}
  <div className="sheet-secondary"><button type="button" disabled={logoutBusy} onClick={onLogout}><Icon name="logout"/><span>{logoutBusy?"Wird abgemeldet…":"Abmelden"}</span></button></div>
 </div>;
}
