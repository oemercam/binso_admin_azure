"use client";
import {LocalizedText,LocalizedElement,useLocale} from "@/lib/client/locale";
import {formatDateTime} from '@/lib/display-format';
import {localeTags} from '@/lib/locales';
import {LocaleSwitcher} from "./locale-switcher";

import {usePathname,useSearchParams} from "next/navigation";
import {safeAppPath} from "@/lib/navigation";
import {searchSources,type SearchItem} from "@/lib/search";
import {useState} from "react";
import {usePageAccess} from "@/lib/client/page-access";
import {Avatar} from "./avatar";
import {ActionRow,SettingsGroup,ListSearch} from "./binso-ux";
import {settingsGroups} from "./settings-navigation";
import {Button, Toast, EmptyState, Icon, LoadingState, ErrorState} from "./ui";

export type PanelNotification={id:string;kind:string;title:string;body:string;href?:string|null;read_at?:string|null;created_at:string};

function PanelLink({href,icon,title,onClose}:{href:string;icon:string;title:string;onClose:()=>void}){
 return <ActionRow href={href} icon={icon} title={title} onClick={onClose}/>;
}

export function SearchPanel({query,onQuery,items,loading,error,onClose,recent=[],onRemember,onClearRecent,onUndoRecent}:{onUndoRecent?:()=>void;recent?:string[];onRemember?:(query:string)=>void;onClearRecent?:()=>void;query:string;onQuery:(query:string)=>void;items:SearchItem[];loading:boolean;error:string|null;onClose:()=>void}){
 const access=usePageAccess();
 const [scope,setScope]=useState("all");
 const sources=searchSources.filter(source=>access.canOpen(source.href));
 const selected=sources.some(source=>source.type===scope)?scope:"all";
 const visible=items.filter(item=>access.canOpen(item.href)&&(selected==="all"||item.type===selected));
 const groups=Array.from(new Set(visible.map(item=>item.type)));
 return <div className="global-search">
  <div className="header-search-controls"><ListSearch value={query} onChange={onQuery} placeholder="Suchen…" ariaLabel="Suchen" autoFocus onCommit={()=>onRemember?.(query)}/><button type="button" className="header-search-cancel" onClick={onClose}><LocalizedText>{"Abbrechen"}</LocalizedText></button></div>
  <LocalizedElement as="div" className="chips header-search-scopes" aria-label="Suchbereiche"><button type="button" className={selected==="all"?"active":""} aria-pressed={selected==="all"} onClick={()=>setScope("all")}><LocalizedText>{"Alle"}</LocalizedText></button>{sources.map(source=><button type="button" key={source.type} className={selected===source.type?"active":""} aria-pressed={selected===source.type} onClick={()=>setScope(source.type)}>{source.type}</button>)}</LocalizedElement>
  <div className="search-results">
   {!query.trim()&&onUndoRecent&&<Toast inline tone="info" title="Suchverlauf gelöscht." actionLabel="Rückgängig" onAction={onUndoRecent}/>}
   {!query.trim()&&recent.length>0&&<section><div className="recent-search-heading"><h3><LocalizedText>{"Letzte Suchanfragen"}</LocalizedText></h3><button type="button" className="text-action" onClick={onClearRecent}><LocalizedText>{"Löschen"}</LocalizedText></button></div><div className="action-list">{recent.map(term=><ActionRow key={term} icon="clock" title={term} onClick={()=>onQuery(term)}/>)}</div></section>}
   {!query.trim()&&<><h3><LocalizedText>{"Schnellzugriff"}</LocalizedText></h3><div>{[["/kunden","users","Kunden öffnen"],["/rechnungen","receipt","Rechnungen öffnen"],["/angebote","file","Angebote öffnen"]].map(([href,icon,title])=><PanelLink key={href} href={href} icon={icon} title={title} onClose={onClose}/>)}</div></>}
   {loading&&<LoadingState className="technical-hint"><LocalizedText>{"Suche läuft …"}</LocalizedText></LoadingState>}
   {query.trim().length>=2&&!loading&&error&&<ErrorState className="technical-hint"><LocalizedText>{error}</LocalizedText></ErrorState>}
   {query.trim().length>=2&&!loading&&!error&&visible.length===0&&<EmptyState  title="Keine Treffer gefunden" />}
   {groups.map(type=><section key={type}><h3><LocalizedText>{type}</LocalizedText></h3>{visible.filter(item=>item.type===type).map(item=><ActionRow verbatim key={item.href} href={item.href} icon={item.icon} title={item.title} description={item.meta} onClick={()=>{onRemember?.(query);onClose()}}/>)}</section>)}
  </div>
 </div>;
}

export function NotificationPanel({items,loading,error,filter,onFilter,onRead,onRetry,onClose}:{items:PanelNotification[];loading:boolean;error:string|null;filter:"all"|"unread";onFilter:(filter:"all"|"unread")=>void;onRead:(id:string)=>void;onRetry:()=>void;onClose:()=>void}){
 const {locale}=useLocale();const pathname=usePathname();const access=usePageAccess();const visible=items.filter(item=>(filter==="all"||!item.read_at)&&(!item.href||access.canOpen(item.href)));
 return <div className="notification-list">
  <div className="header-notification-filters"><button type="button" aria-pressed={filter==="all"} onClick={()=>onFilter("all")}><LocalizedText>{"Alle"}</LocalizedText></button><button type="button" aria-pressed={filter==="unread"} onClick={()=>onFilter("unread")}><LocalizedText>{"Ungelesen"}</LocalizedText></button></div>
  {loading&&<LoadingState><LocalizedText>{"Wird geladen …"}</LocalizedText></LoadingState>}
  {error&&<ErrorState onRetry={onRetry} retryLabel="Erneut laden"><LocalizedText>{error}</LocalizedText></ErrorState>}
  {!loading&&!error&&!visible.length&&<EmptyState  title={filter==="unread"?"Keine ungelesenen Benachrichtigungen":"Keine Benachrichtigungen"} />}
  {!error&&visible.map(item=><ActionRow href={item.href||"/benachrichtigungen"} key={item.id} icon={item.kind==="support"?"support":item.kind==="payment"?"wallet":"bell"} title={item.title} description={item.body} metadata={formatDateTime(item.created_at,localeTags[locale])} endAdornment={!item.read_at?<LocalizedElement as="i" className="unread-dot" aria-label="Ungelesen"/>:undefined} onClick={()=>{onRead(item.id);onClose()}}/>)}
  {pathname!=="/benachrichtigungen"&&<ActionRow href="/benachrichtigungen" title="Alle Benachrichtigungen" icon="bell" onClick={onClose}/>}

 </div>;
}

export function AccountPanel({profile,logoutBusy,onLogout,onClose}:{profile:{name:string;identity:string;avatar:string};logoutBusy:boolean;onLogout:()=>void;onClose:()=>void}){
 const pathname=usePathname(),params=useSearchParams();
 const origin=safeAppPath(params.get("accountReturn"),pathname);
 const target=new URL(origin,"https://binso.invalid");target.searchParams.set("panel","account");
 const back=target.pathname+target.search;
 return <div className="account-sheet"><div className="account-sheet-profile"><Avatar name={profile.name} identity={profile.identity} src={profile.avatar} size="small"/><div><b><LocalizedText verbatim={!!profile.name}>{profile.name||"Persönliches Konto"}</LocalizedText></b><small><LocalizedText verbatim={!!profile.identity}>{profile.identity||"Persönliches Konto"}</LocalizedText></small></div></div>
  <LocaleSwitcher persist="tenant"/><SettingsGroup title="Persönlich"><div>{settingsGroups[0].rows.filter(([href])=>href!=="/einstellungen/sprache").map(([href,icon,title])=><PanelLink key={href} href={href+"?accountReturn="+encodeURIComponent(back)} icon={icon} title={href==="/einstellungen/konto"?"Mein Profil":title} onClose={onClose}/>)}</div></SettingsGroup>
  <SettingsGroup title="Sitzung"><div className="action-list"><PanelLink href={'/einstellungen/sicherheit?accountReturn='+encodeURIComponent(back)+'#sitzungen'} icon="lock" title="Sitzungen" onClose={onClose}/><ActionRow icon="logout" title={logoutBusy?"Wird abgemeldet…":"Abmelden"} disabled={logoutBusy} onClick={onLogout}/></div></SettingsGroup>
 </div>;
}
