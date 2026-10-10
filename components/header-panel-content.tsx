"use client";

import type {SearchItem} from "@/lib/search";
import {usePageAccess} from "@/lib/client/page-access";
import {Avatar} from "./avatar";
import {ActionRow} from "./binso-ux";
import {Button, EmptyState, Icon, LoadingState, ErrorState} from "./ui";

export type PanelNotification={id:string;kind:string;title:string;body:string;href?:string|null;read_at?:string|null;created_at:string};

function PanelLink({href,icon,title,onClose}:{href:string;icon:string;title:string;onClose:()=>void}){
 return <ActionRow href={href} icon={icon} title={title} onClick={onClose}/>;
}

export function SearchPanel({query,onQuery,items,loading,error,onClose}:{query:string;onQuery:(query:string)=>void;items:SearchItem[];loading:boolean;error:string|null;onClose:()=>void}){
 const access=usePageAccess();const visible=items.filter(item=>access.canOpen(item.href));
 const groups=Array.from(new Set(visible.map(item=>item.type)));
 return <div className="global-search">
  <div className="header-search-controls"><div className="searchbox" role="search"><Icon name="search"/><input aria-label="Suchen" autoFocus value={query} onChange={e=>onQuery(e.target.value)} placeholder="Suchen…"/>{query&&<button className="search-clear" type="button" aria-label="Suche löschen" onClick={()=>onQuery("")}><Icon name="close" size={15}/></button>}</div></div>
  <div className="search-results">
   {!query.trim()&&<><h3>Schnellzugriff</h3><div>{[["/kunden","users","Kunden öffnen"],["/rechnungen","receipt","Rechnungen öffnen"],["/angebote","file","Angebote öffnen"]].map(([href,icon,title])=><PanelLink key={href} href={href} icon={icon} title={title} onClose={onClose}/>)}</div></>}
   {loading&&<LoadingState className="technical-hint">Suche läuft …</LoadingState>}
   {query.trim().length>=2&&!loading&&error&&<ErrorState className="technical-hint">{error}</ErrorState>}
   {query.trim().length>=2&&!loading&&!error&&visible.length===0&&<EmptyState compact title="Keine Treffer gefunden" text=""/>}
   {groups.map(type=><section key={type}><h3>{type}</h3>{visible.filter(item=>item.type===type).map(item=><ActionRow key={item.href} href={item.href} icon={item.icon} title={item.title} description={item.meta} onClick={onClose}/>)}</section>)}
  </div>
 </div>;
}

export function NotificationPanel({items,loading,error,filter,onFilter,onRead,onReadAll,onRetry,onClose}:{items:PanelNotification[];loading:boolean;error:string|null;filter:"all"|"unread";onFilter:(filter:"all"|"unread")=>void;onRead:(id:string)=>void;onReadAll:()=>void;onRetry:()=>void;onClose:()=>void}){
 const access=usePageAccess();const visible=items.filter(item=>(filter==="all"||!item.read_at)&&(!item.href||access.canOpen(item.href)));
 return <div className="notification-list">
  <div className="header-notification-filters"><button type="button" aria-pressed={filter==="all"} onClick={()=>onFilter("all")}>Alle</button><button type="button" aria-pressed={filter==="unread"} onClick={()=>onFilter("unread")}>Ungelesen</button>{items.some(item=>!item.read_at)&&<button type="button" className="text-action" onClick={onReadAll}>Alle als gelesen</button>}</div>
  {loading&&<LoadingState>Wird geladen …</LoadingState>}
  {error&&<ErrorState onRetry={onRetry} retryLabel="Erneut laden">{error}</ErrorState>}
  {!loading&&!error&&!visible.length&&<EmptyState compact title={filter==="unread"?"Keine ungelesenen Benachrichtigungen":"Keine Benachrichtigungen"} text=""/>}
  {!error&&visible.map(item=><ActionRow href={item.href||"/benachrichtigungen"} key={item.id} icon={item.kind==="support"?"support":item.kind==="payment"?"wallet":"bell"} title={item.title} description={item.body} metadata={new Date(item.created_at).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"})} endAdornment={!item.read_at?<i className="unread-dot" aria-label="Ungelesen"/>:undefined} onClick={()=>{onRead(item.id);onClose()}}/>)}
  <ActionRow href="/benachrichtigungen" title="Alle Benachrichtigungen" icon="bell" onClick={onClose}/>

 </div>;
}

export function AccountPanel({profile,demo,logoutBusy,onLogout,onClose}:{profile:{name:string;identity:string;avatar:string};demo:boolean;logoutBusy:boolean;onLogout:()=>void;onClose:()=>void}){
 return <div className="account-sheet"><div className="account-sheet-profile"><Avatar name={profile.name} identity={profile.identity} src={profile.avatar} size="large"/><div><b>{profile.name||"Persönliches Konto"}</b><small>Persönliches Konto</small></div></div>
  <h3>Persönlich</h3><div>{[["/einstellungen/konto","user","Mein Profil"],["/einstellungen/sicherheit","lock","Sicherheit"],["/einstellungen/benachrichtigungen","bell","Benachrichtigungen"],["/einstellungen/darstellung","moon","Darstellung & Sprache"]].map(([href,icon,title])=><PanelLink key={href} href={href} icon={icon} title={title} onClose={onClose}/>)}</div>
  <h3>Unternehmen</h3><div className="action-list"><PanelLink href="/einstellungen" icon="settings" title="Unternehmenseinstellungen" onClose={onClose}/>{demo&&<PanelLink href="/registrieren" icon="plus" title="Eigenes Konto erstellen" onClose={onClose}/>}</div>
  <h3>Sitzung</h3><div className="action-list"><ActionRow icon="logout" title={logoutBusy?"Wird abgemeldet…":"Abmelden"} disabled={logoutBusy} onClick={onLogout}/></div>
 </div>;
}
