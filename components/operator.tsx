"use client";
import {AppVersionNotice} from "./app-version-notice";
import {LocalizedText,LocalizedElement,useTranslation} from "@/lib/client/locale";
import {LocaleSwitcher} from "./locale-switcher";
import {RingChart} from "./statistics";
import {formatDateTime} from "@/lib/display-format";
import {supportReference} from "@/lib/support-reference";
import {MaintenanceControl} from "./maintenance-control";
import {MonitoringPanel} from "./monitoring";
import {useApiQuery} from "@/lib/client/use-api-query";
import {ActionRow, ActionSheet, CreateAction, FilterSheet, FormSheet, MetricTiles, MetricTile, WorkspaceSection,DetailTabs} from "./binso-ux";
import {DataTable, DataTableHead, DataTableRow, RecordsView, RecordsControls, RecordRow, useRecordsController} from "./records";
import ConfirmDialog from "./confirm-dialog";

import Link from "next/link";
import {HeaderPanel} from "./header-panel";
import {Avatar} from "./avatar";
import { createContext, useContext, useEffect, useMemo, useState, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {AppHeader,MobileDock} from "./app-chrome";
import {DesktopNavigationToggle,useDesktopNavigation} from "./desktop-navigation";
import { PageHeading } from "./binso-ux";
import {Button, EmptyState, Icon, Logo, Metric, SectionTitle, Status, Toast, Field, Input, Select, Textarea, LoadingState, ErrorState, MessageBubble} from "./ui";
import { apiPatch, apiPost, logoutOperatorClientSession, useBackendMode } from "@/lib/client/backend";
import {platformFinanceInsights} from "@/lib/finance-periods";
import {sumMoney} from "@/lib/money";
import {businessDate} from "@/lib/financial-status";
import { plans } from "@/lib/plans";
import {operatorCan,type OperatorRole,type OperatorPermission} from "@/lib/permissions";
import {canOpenOperatorSection} from "@/lib/operator-pages";

const OperatorAccess=createContext<OperatorRole|"readonly">("platform_owner");
function useOperatorPermission(permission:OperatorPermission){return operatorCan(useContext(OperatorAccess),permission);}
function useOperatorToast(){
 const [toast,setMessage]=useState<string|null>(null),[tone,setTone]=useState<"success"|"danger">("success");
 const setToast=(message:string|null,nextTone:"success"|"danger"="success")=>{setMessage(message);setTone(nextTone);};
 return [toast,setToast,tone] as const;
}

const operatorNav = [
  ["","Dashboard","home"],
  ["tickets","Tickets","support"],
  ["kunden","Kunden","users"],
  ["zahlungen","Zahlungen","wallet"],
  ["finanzen","Finanzen","chart"],
  ["abonnemente","Abonnemente","card"],
  ["sperrungen","Sperrungen","lock"],
  ["monitoring","Monitoring","chart"],
  ["ankuendigungen","Ankündigungen","bell"],
  ["sicherheit","Zugriff & Rollen","settings"],
  ["audit","Audit","file"],
] as const;

const operatorNavGroups = [
  {label:"Betrieb",slugs:["","tickets","kunden"]},
  {label:"Abrechnung",slugs:["zahlungen","finanzen","abonnemente"]},
  {label:"Plattform",slugs:["sperrungen","monitoring","ankuendigungen"]},
  {label:"Governance",slugs:["sicherheit","audit"]},
] as const;

function moneyChf(value:number){
  return "CHF "+value.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2});
}

const demoPlan=(id:"start"|"business"|"pro")=>{
  const plan=plans.find(item=>item.id===id);
  if(!plan)throw new Error("Demo plan configuration is missing: "+id);
  return {plan:plan.name,mrr:"CHF "+plan.monthly.toLocaleString("de-CH")};
};
const demoCustomers = [
  {id:"acme",name:"Acme AG",...demoPlan("business"),status:"Aktiv"},
  {id:"mueller",name:"Müller GmbH",...demoPlan("start"),status:"Aktiv"},
  {id:"berger",name:"Berger Bau AG",...demoPlan("pro"),status:"Aktiv"},
  {id:"meier",name:"Meier Handel AG",...demoPlan("business"),status:"Eingeschränkt"},
];

const tickets = [
  ["#8421","Rechnungsstellung unklar","Acme AG","Offen"],
  ["#8419","Zahlung fehlgeschlagen","Müller GmbH","In Bearbeitung"],
  ["#8416","Zugangsproblem","Berger Bau AG","Offen"],
  ["#8415","Funktionserweiterung","Huber & Söhne","Wartet auf Kunde"],
];

type OperatorTicket = {
  case_number?:string;
  id:string;
  subject:string;
  priority:string;
  status:string;
  updated_at:string;
  tenant?:{name?:string}|null;
};

type OperatorTenant = {
  id:string;
  name:string;
  uid?:string|null;
  city?:string|null;
  created_at:string;
  account?:{plan?:string;subscription_status?:string;account_status?:string;user_limit?:number}|null;
};

function operatorStatus(value:string){
  const map:Record<string,string>={
    new:"Neu",open:"Offen",in_progress:"In Bearbeitung",waiting_customer:"Wartet auf Kunde",
    resolved:"Gelöst",closed:"Geschlossen",active:"Aktiv",past_due:"Überfällig",suspended:"Gesperrt",
    restricted:"Eingeschränkt",cancelled:"Gekündigt",trial:"Testphase",expired:"Abgelaufen",read_only:"Eingeschränkt",inactive:"Inaktiv"
  };
  return map[value]??value;
}

function operatorPlan(value:string|undefined){
  const map:Record<string,string>={trial:"Testphase",start:"Start",business:"Business",pro:"Pro"};
  return map[value??""]??"—";
}

function OperatorLoadState({loading,error,onRetry}:{loading:boolean;error:string|null;onRetry:()=>void}){
 return loading?<LoadingState><LocalizedText>{"Daten werden geladen …"}</LocalizedText></LoadingState>:<ErrorState onRetry={onRetry} retryLabel="Erneut versuchen"><LocalizedText>{error}</LocalizedText></ErrorState>;
}

function useOperatorTickets(){
  const production=useBackendMode();
  
  const resource=useApiQuery<{items:OperatorTicket[]}>(production?"/api/operator/tickets":null);
  const items=resource.data?.items??[];
  const loading=resource.loading,loadError=resource.error,refresh=resource.refresh;
  
  return {production,items,loading,loadError,refresh};
}

function useOperatorCustomers(){
  const production=useBackendMode();
  
  const resource=useApiQuery<{items:OperatorTenant[]}>(production?"/api/operator/customers":null);
  const items=resource.data?.items??[];
  const loading=resource.loading,loadError=resource.error,refresh=resource.refresh;
  
  return {production,items,loading,loadError,refresh};
}


export function OperatorPage({ section = "", demo = false, identity, role="platform_owner" }: { section?: string; demo?: boolean;identity?:{name:string;email:string}|null;role?:OperatorRole|"readonly" }) {
  const {navigationCollapsed,toggleNavigation}=useDesktopNavigation();
  const translate=useTranslation();
  const key = section.split("/")[0] || "";
  const detail = section.split("/")[1] || "";
  const title = useMemo(() => operatorNav.find(([slug]) => slug === key)?.[1] ?? "Dashboard", [key]);
  const [mobileMore,setMobileMore]=useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
  const [createOpen,setCreateOpen]=useState(false);
  useEffect(()=>{queueMicrotask(()=>setCreateOpen(false));},[section]);
  const [logoutBusy,setLogoutBusy]=useState(false);
  const [logoutError,setLogoutError]=useState("");
  const logout=async()=>{if(logoutBusy)return;setLogoutBusy(true);setLogoutError("");try{const payload=await logoutOperatorClientSession();const path=typeof payload.microsoftLogoutUrl==="string"?payload.microsoftLogoutUrl:"/operator/login";window.location.assign(new URL(path,window.location.origin).toString());}catch{setLogoutError("Abmelden fehlgeschlagen. Bitte erneut versuchen.");setLogoutBusy(false);}};

  const allowed=demo||canOpenOperatorSection(role,section);
  const canCreate=allowed&&!detail&&((key==="sperrungen"&&operatorCan(demo?"platform_owner":role,"restrictions:manage"))||(key==="ankuendigungen"&&operatorCan(demo?"platform_owner":role,"announcements:manage")));
  return <OperatorAccess.Provider value={demo?"platform_owner":role}><div className="operator-root" data-navigation-collapsed={navigationCollapsed||undefined} data-operator-demo={demo?"true":"false"}>
    <aside id="operator-desktop-navigation" className="operator-sidebar">
      <Link prefetch={false} href="/operator"><Logo dark compact={navigationCollapsed}/></Link>
      <nav className="operator-sidebar-groups">{operatorNavGroups.map(group=><div className="operator-sidebar-group" key={group.label}><span className="operator-nav-label"><LocalizedText>{group.label}</LocalizedText></span>{group.slugs.map(slug=>{const item=operatorNav.find(([candidate])=>candidate===slug);if(!item)return null;const [,label,icon]=item;return <Link prefetch={false} aria-label={translate(label)} title={translate(label)} aria-current={slug===key?"page":undefined} className={slug===key?"active":""} href={slug ? `/operator/${slug}` : "/operator"} key={slug}><Icon name={icon}/><span><LocalizedText>{label}</LocalizedText></span></Link>})}</div>)}</nav>
    </aside>

    <main className="operator-main">
      <AppVersionNotice/>
      <AppHeader contentHeader className="operator-app-header" detail={!!detail} leadingClassName="operator-header-brand" leading={<>
        <DesktopNavigationToggle collapsed={navigationCollapsed} onToggle={toggleNavigation} controls="operator-desktop-navigation"/>
        {detail?<Link href={"/operator/"+key} className="mobile-back" aria-label="Zur Liste"><Icon name="back"/></Link>:key===""?<Link href="/operator" className="mobile-header-brand" aria-label="Zum Admin-Dashboard"><Logo compact/><span>One</span></Link>:<span className="operator-section-label"><LocalizedText>{title}</LocalizedText></span>}
        <span className="operator-header-desktop-label"><LocalizedText>{"Admin"}</LocalizedText></span>
      </>} actionClassName="operator-user" actions={<>{demo&&<span className="app-demo-badge"><LocalizedText>{"Demo"}</LocalizedText></span>}<Link prefetch={false} className="icon-button operator-home-link" href="/dashboard" aria-label="Zur App"><Icon name="home" size={18}/></Link><LocalizedElement as="button" className="avatar avatar-button" type="button" aria-label="Benutzerkonto" onClick={()=>{setMobileMore(false);setAccountOpen(true)}}><Avatar name={identity?.name} identity={identity?.email}/></LocalizedElement></>}/>

      <div className="operator-page-head"><PageHeading leading={detail?<Button href={"/operator/"+key} variant="ghost" className="icon-button desktop-back" icon="back" ariaLabel={key==="tickets"?"Zur Ticketliste":"Zur Kundenliste"}/>:undefined} title={detail ? (key === "tickets" ? "Ticketdetails" : key === "kunden" ? "Kundendetails" : title) : title} description={operatorSubtitle(key, detail)} action={canCreate?<CreateAction label={key==="sperrungen"?"Einschränkung erstellen":"Ankündigung erstellen"} onClick={()=>setCreateOpen(true)}/>:undefined}/></div>
      {accountOpen&&<HeaderPanel kind="account" label="Konto" onClose={()=>setAccountOpen(false)} headerSelector=".operator-app-header" backgroundSelector=".operator-sidebar,.operator-main > :not(.operator-app-header)"><div className="account-sheet"><div className="account-sheet-profile"><Avatar size="large"/><div><b><LocalizedText verbatim={!!identity?.name}>{identity?.name||"One Admin"}</LocalizedText></b><small><LocalizedText>{identity?.email||"Administration"}</LocalizedText></small></div></div><LocaleSwitcher/><div className="action-list"><ActionRow href="/dashboard" icon="home" title="Zum Kundenportal" description="Binso One öffnen" onClick={()=>setAccountOpen(false)}/><ActionRow icon="logout" title="Abmelden" disabled={logoutBusy} onClick={()=>void logout()}/></div>{logoutError&&<ErrorState><LocalizedText>{logoutError}</LocalizedText></ErrorState>}</div></HeaderPanel>}

      <MobileDock><LocalizedElement as="nav" className="operator-mobile-nav" aria-label="Operator Navigation">
        {operatorNav.filter(([slug])=>["","tickets","kunden","monitoring"].includes(slug)).map(([slug,label,icon])=><Link aria-label={translate(slug===""?"Start":slug==="monitoring"?"Status":label)+(slug===""||slug==="monitoring"?" · "+translate(label):"")} title={translate(label)} aria-current={slug===key?"page":undefined} className={slug===key?"active":""} href={slug ? `/operator/${slug}` : "/operator"} key={slug}><Icon name={icon} size={19}/><span>{slug===""?<LocalizedText>{"Start"}</LocalizedText>:slug==="monitoring"?<LocalizedText>{"Status"}</LocalizedText>:<LocalizedText>{label}</LocalizedText>}</span></Link>)}
        <button type="button" className={["zahlungen","finanzen","abonnemente","sperrungen","ankuendigungen","sicherheit","audit"].includes(key)?"active":""} onClick={()=>setMobileMore(true)}><Icon name="more" size={19}/><span><LocalizedText>{"Mehr"}</LocalizedText></span></button>
      </LocalizedElement></MobileDock>
      <ActionSheet label="Weitere Admin-Bereiche" open={mobileMore} onClose={()=>setMobileMore(false)}>
        {operatorNavGroups.map(group=>{const items=group.slugs.map(slug=>operatorNav.find(([candidate])=>candidate===slug)).filter((item):item is NonNullable<typeof item>=>Boolean(item&&["zahlungen","finanzen","abonnemente","sperrungen","ankuendigungen","sicherheit","audit"].includes(item[0])&&(demo||canOpenOperatorSection(role,item[0]))));if(!items.length)return null;return <section className="navigation-sheet-group" key={group.label}><h3><LocalizedText>{group.label}</LocalizedText></h3><div className="action-list">{items.map(([slug,label,icon])=><ActionRow href={`/operator/${slug}`} key={slug} icon={icon} title={label} navigation onClick={()=>setMobileMore(false)}/>)}</div></section>})}
      </ActionSheet>

      <div className="operator-app-content">{!allowed ? <EmptyState icon="lock" title="Keine Berechtigung für diesen Bereich" text="Deine Adminrolle erlaubt diesen Zugriff nicht. Wende dich für eine passende Rolle an die Entra-Administration."/> : detail && key === "tickets" ? <TicketDetail ticketId={detail}/> :
        detail && key === "kunden" ? <OperatorCustomerDetail tenantId={detail}/> :
        key === "tickets" ? <TicketsView/> :
        key === "kunden" ? <CustomersView/> :
        key === "zahlungen" ? <PaymentsView/> :
        key === "finanzen" ? <OperatorFinanceView demo={demo}/> :
        key === "abonnemente" ? <SubscriptionsView/> :
        key === "sperrungen" ? <RestrictionsView open={createOpen} onClose={()=>setCreateOpen(false)}/> :
        key === "monitoring" ? <><MonitoringView/>{!demo&&<MaintenanceControl canManage={operatorCan(role,"security:manage")}/>}</> :
        key === "ankuendigungen" ? <AnnouncementsView open={createOpen} onClose={()=>setCreateOpen(false)}/> :
        key === "sicherheit" ? <SecurityView/> :
        key === "audit" ? <AuditView/> :
        <OperatorDashboard/>}</div>
    </main>
  </div></OperatorAccess.Provider>;
}

function operatorSubtitle(key: string, detail: string) {
  if (detail && key === "tickets") return "Kundenanfrage prüfen und beantworten.";
  if (detail && key === "kunden") return "Kundenkonto, Abonnement, Zahlungen, Tickets und Einschränkungen.";
  const subtitles: Record<string, string> = {
    "": "Betrieb und Kundenumgebung von Binso One.",
    tickets: "Kundenanfragen verwalten und beantworten.",
    kunden: "Kundenkonten, Status und Supportkontext.",
    zahlungen: "Zahlungen und fehlgeschlagene Transaktionen.",
    finanzen: "Plattformumsatz, Kosten und wirtschaftliche Entwicklung.",
    abonnemente: "Pläne, Nutzung und Abrechnungsstatus.",
    sperrungen: "Einschränkungen kontrolliert verwalten.",
    monitoring: "Status der Plattform und abhängiger Services.",
    ankuendigungen: "Hinweise für Kunden veröffentlichen.",
    sicherheit: "Interne Microsoft-Entra-Zugriffe, Rollen und Berechtigungen.",
    audit: "Kritische Operator-Aktionen nachvollziehen.",
  };
  return subtitles[key] ?? "Binso One Operator";
}

function OperatorDashboard() {
  const canSupport=useOperatorPermission("support:manage"),canBilling=useOperatorPermission("subscriptions:read");
  const [insight,setInsight]=useState("billing");
  const activeInsight=canBilling&&(insight==="billing"||!canSupport)?"billing":"support";
  const production=useBackendMode();
  
  const resource=useApiQuery<{stats?:Record<string,unknown>;tickets?:OperatorTicket[];incidents?:Array<{id:string;service:string;title:string;status:string;started_at:string}>}>(production?"/api/operator/dashboard":null);
  const data=resource.data??{};
  const loading=resource.loading,loadError=resource.error,refresh=resource.refresh;
  
  const stats:Record<string,unknown>=production?data.stats??{}:{customers_total:demoCustomers.length,subscriptions_active:demoCustomers.filter(item=>item.status==="Aktiv").length,trials_active:0,monthly_contract_value:demoCustomers.filter(item=>item.status==="Aktiv").reduce((total,item)=>total+(plans.find(plan=>plan.name===item.plan)?.monthly??0),0)};
  const recent=production?(data.tickets??[]):tickets.map(([,subject,customer,status],i)=>({id:String(i),subject,tenant:{name:customer},status:status==="Offen"?"open":status==="Gelöst"?"resolved":"in_progress"} as OperatorTicket));
  const incidents=data.incidents??[];
  const open=production?Number(stats.tickets_open??0):recent.filter(item=>item.status==="open").length, progress=production?Number(stats.tickets_in_progress??0):recent.filter(item=>item.status==="in_progress").length;
  const resolved=production?Number(stats.tickets_resolved??0):recent.filter(item=>item.status==="resolved").length;
  if(production&&(loading||loadError))return <OperatorLoadState loading={loading} error={loadError} onRetry={refresh}/>;

  return <div className="operator-dashboard-cockpit">
    <MetricTiles>{[
      ["Kunden",Number(stats.customers_total??0),"/operator/kunden"],
      ["Aktive Abos",canBilling?Number(stats.subscriptions_active??0):"—","/operator/abonnemente"],
      ["Testphasen",canBilling?Number(stats.trials_active??0):"—","/operator/abonnemente"],
      ["Nutzer · letzte 15 Minuten",stats.users_active==null?"—":Number(stats.users_active),"/operator/kunden"],
    ].map(([label,value,href])=>value==="—"?<MetricTile key={String(label)} label={String(label)} value="—" hint={production?"Keine Berechtigung":"Demo"}/>:<Link href={String(href)} key={String(label)}><MetricTile label={String(label)} value={String(value)}/></Link>)}</MetricTiles>
    {(canBilling||canSupport)&&<div className="operator-insight-grid"><WorkspaceSection>
      {canBilling&&canSupport&&<DetailTabs label="Dashboard-Auswertungen"><button type="button" className={activeInsight==='billing'?'active':''} onClick={()=>setInsight('billing')}><LocalizedText>{"Abrechnung"}</LocalizedText></button><button type="button" className={activeInsight==='support'?'active':''} onClick={()=>setInsight('support')}><LocalizedText>{"Support"}</LocalizedText></button></DetailTabs>}
      {activeInsight==='billing'?<><SectionTitle title="Abrechnung"/><MetricTiles columns={2}><Link href="/operator/zahlungen"><MetricTile label="Zahlungen letzte 30 Tage" value={stats.payments_30d==null?"—":moneyChf(Number(stats.payments_30d))}/></Link><Link href="/operator/finanzen"><MetricTile label="Monatlicher Vertragswert" value={moneyChf(Number(stats.monthly_contract_value??0))}/></Link></MetricTiles></>:<><SectionTitle title="Support"/><RingChart label="Offen / in Bearbeitung / gelöst" format="number" parts={[{key:"open",label:"Offen",tone:"negative",value:open},{key:"progress",label:"In Bearbeitung",tone:"neutral",value:progress},{key:"resolved",label:"Gelöst",tone:"positive",value:resolved}]}/></>}
    </WorkspaceSection></div>}
    <WorkspaceSection><SectionTitle title="Systemstatus" action={<Link prefetch={false} href="/operator/monitoring"><LocalizedText>{"Monitoring öffnen"}</LocalizedText></Link>}/><p><LocalizedText>{incidents.length?incidents.length+" aktive Störungen erfasst":"Keine aktiven Störungen erfasst."}</LocalizedText></p></WorkspaceSection>
    {canSupport&&<WorkspaceSection><SectionTitle title="Letzte Supportfälle" action={<Link href="/operator/tickets"><LocalizedText>{"Alle Tickets"}</LocalizedText></Link>}/>{recent.length?<div className="compact-list">{recent.map(x=><Link href={"/operator/tickets/"+x.id} key={x.id}><b>{x.subject}</b><span><LocalizedText verbatim={!!x.tenant?.name}>{x.tenant?.name??"Kunde"}</LocalizedText></span><Status>{operatorStatus(x.status)}</Status></Link>)}</div>:<EmptyState compact icon="support" title="Keine offenen Supportfälle" text="Neue Anfragen erscheinen hier."/>}</WorkspaceSection>}
  </div>;
}


function TicketsView() {
 const {production,items,loading,loadError,refresh}=useOperatorTickets();
 const chips=['Alle','Offen','In Bearbeitung','Wartet auf Kunde','Gelöst'];
 const columns=[{label:'Ticket',index:0},{label:'Kunde',index:1},{label:'Priorität',index:2},{label:'Status',index:3,status:true},{label:'Aktualisiert',index:4}];
 const controller=useRecordsController({placeholder:'Tickets suchen...',chips,columns});
 const rows=production?items.map(item=>[item.subject,item.tenant?.name??'Kunde',item.priority==='critical'?'Kritisch':item.priority==='high'?'Hoch':item.priority==='low'?'Niedrig':'Normal',operatorStatus(item.status),formatDateTime(item.updated_at),item.id,supportReference(item.id,item.case_number)]):tickets.map(([nr,subject,customer,status])=>[subject,customer,'Normal',status,'Demo',nr.replace('#','')]);
 return <><RecordsControls inline controller={controller} placeholder="Tickets suchen..." chips={chips} columns={columns}/><RecordsView controller={controller} toolbarActions={false} filterSummary={false} showCount={false} items={rows} loading={production&&loading} error={loadError} placeholder="Tickets suchen..." countLabel="Tickets" emptyLabel={chip=>({Offen:"Keine offenen Tickets",["In Bearbeitung"]:"Keine Tickets in Bearbeitung",["Wartet auf Kunde"]:"Keine wartenden Tickets",Gelöst:"Keine gelösten Tickets"}[chip]??"Keine Tickets erfasst")} chips={chips} columns={columns} rowHref={row=>'/operator/tickets/'+row[5]} statusGroups={{Gelöst:['Gelöst','Geschlossen']}}>{row=><RecordRow compact valuePlacement="metadata" href={'/operator/tickets/'+row[5]} title={row[0]} meta={[row[6],row[1],row[2],row[4]].filter(Boolean).join(' · ')} status={row[3]}/>}</RecordsView>{loadError&&<Button variant="secondary" onClick={refresh}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button>}</>;
}

function TicketDetail({ticketId}:{ticketId:string}) {
  const production=useBackendMode();
  const resource=useApiQuery<{item:Record<string,unknown>;messages:Array<Record<string,unknown>>}>(production?"/api/operator/tickets/"+encodeURIComponent(ticketId):null);
  const loading=resource.loading,loadError=resource.error,refresh=resource.refresh;

  
  const [reply,setReply]=useState("");
  const [internal,setInternal]=useState(false);
  const [sending,setSending]=useState(false),[updating,setUpdating]=useState(false);
  const sendPending=useRef(false);
  const [toast,setToast,toastTone]=useOperatorToast();
  const [ticket,setTicket]=useState<Record<string,unknown>|null>(null);
  const [messages,setMessages]=useState<Array<Record<string,unknown>>>([]);
  useEffect(()=>{if(!resource.data)return;const payload=resource.data;let active=true;queueMicrotask(()=>{if(active){setTicket(payload.item);setMessages(payload.messages)}});return()=>{active=false}},[resource.data]);

  

  const update=async(field:"status"|"priority",value:string)=>{
    if(!production||updating) return;
    setUpdating(true);
    try{
      const payload=await apiPatch<{item:Record<string,unknown>}>("/api/operator/tickets/"+encodeURIComponent(ticketId),{[field]:value});
      setTicket(payload.item);
      setToast("Ticket aktualisiert.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Ticket konnte nicht aktualisiert werden.","danger");
    }
    setUpdating(false);
    window.setTimeout(()=>setToast(null),2200);
  };

  const send=async()=>{
    const draft=reply,value=draft.trim();
    if(!value||sending||sendPending.current)return;
    if(!production){setReply("");setToast("Antwort wurde im Ticket ergänzt.");window.setTimeout(()=>setToast(null),2200);return;}
    sendPending.current=true;setSending(true);
    try{
      const payload=await apiPost<{item:Record<string,unknown>}>("/api/operator/tickets/"+encodeURIComponent(ticketId)+"/messages",{body:value,internal});
      setMessages(current=>current.some(item=>item.id===payload.item.id)?current:[...current,payload.item]);
      setReply(current=>current===draft?"":current);
      setToast(internal?"Interne Notiz gespeichert.":"Antwort gesendet.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Nachricht konnte nicht gespeichert werden.","danger");
    }
    sendPending.current=false;setSending(false);
    window.setTimeout(()=>setToast(null),2200);
  };

  if(production&&(loading||loadError))return <OperatorLoadState loading={loading} error={loadError} onRetry={refresh}/>;

  if(!production) return <div className="operator-ticket-layout">
    <WorkspaceSection className="operator-thread">
      <div className="ticket-meta-bar"><Field label="Status"><Select defaultValue="progress"><option value="open"><LocalizedText>{"Offen"}</LocalizedText></option><option value="progress"><LocalizedText>{"In Bearbeitung"}</LocalizedText></option><option value="waiting"><LocalizedText>{"Wartet auf Kunde"}</LocalizedText></option><option value="solved"><LocalizedText>{"Gelöst"}</LocalizedText></option></Select></Field><Field label="Priorität"><Select defaultValue="high"><option value="normal"><LocalizedText>{"Normal"}</LocalizedText></option><option value="high"><LocalizedText>{"Hoch"}</LocalizedText></option><option value="critical"><LocalizedText>{"Kritisch"}</LocalizedText></option></Select></Field></div>
      <MessageBubble outgoing={false} time={<>10:24</>} author={<><LocalizedText>{"Thomas Meier"}</LocalizedText></>}><LocalizedText>{"Guten Tag. In der letzten Rechnung sind nicht alle Positionen korrekt aufgeführt. Können Sie das bitte prüfen?"}</LocalizedText></MessageBubble>
      <MessageBubble outgoing={true} time={<>10:37</>} author={<><LocalizedText>{"Binso Support"}</LocalizedText></>}><LocalizedText>{"Guten Tag Herr Meier. Vielen Dank für die Anfrage. Ich prüfe die Rechnung gerne und melde mich in Kürze bei Ihnen."}</LocalizedText></MessageBubble>
      <div className="operator-reply"><Textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Antwort schreiben..."/><div><Button onClick={()=>void send()}><LocalizedText>{"Senden"}</LocalizedText></Button></div></div>
    </WorkspaceSection>
    <aside className="surface customer-context"><SectionTitle title="Kunde"/><h3><LocalizedText>{"Acme AG"}</LocalizedText></h3><p><LocalizedText>{"Demo-Kontext"}</LocalizedText></p></aside>{toast&&<Toast title={toast} tone={toastTone}/>}
  </div>;

  if(!ticket) return <WorkspaceSection><LoadingState/></WorkspaceSection>;

  const tenant=ticket.tenant as Record<string,unknown>|undefined;
  const status=String(ticket.status??"open");
  const priority=String(ticket.priority??"normal");

  return <div className="operator-ticket-layout">
    <WorkspaceSection className="operator-thread">
      <div className="ticket-meta-bar">
        <Field label="Status"><Select disabled={updating} value={status} onChange={e=>void update("status",e.target.value)}><option value="open"><LocalizedText>{"Offen"}</LocalizedText></option><option value="in_progress"><LocalizedText>{"In Bearbeitung"}</LocalizedText></option><option value="waiting_customer"><LocalizedText>{"Wartet auf Kunde"}</LocalizedText></option><option value="resolved"><LocalizedText>{"Gelöst"}</LocalizedText></option><option value="closed"><LocalizedText>{"Geschlossen"}</LocalizedText></option></Select></Field>
        <Field label="Priorität"><Select disabled={updating} value={priority} onChange={e=>void update("priority",e.target.value)}><option value="low"><LocalizedText>{"Niedrig"}</LocalizedText></option><option value="normal"><LocalizedText>{"Normal"}</LocalizedText></option><option value="high"><LocalizedText>{"Hoch"}</LocalizedText></option><option value="critical"><LocalizedText>{"Kritisch"}</LocalizedText></option></Select></Field>
      </div>
      <div className="tabs"><button className={!internal?"active":""} onClick={()=>setInternal(false)}><LocalizedText>{"Konversation"}</LocalizedText></button><button className={internal?"active":""} onClick={()=>setInternal(true)}><LocalizedText>{"Interne Notiz"}</LocalizedText></button></div>
      {messages.filter(message=>internal?message.internal===true:message.internal!==true).map(message=><MessageBubble outgoing={message.author_type!=="customer"} time={<>{new Date(String(message.created_at)).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"})}</>} author={<><LocalizedText>{message.author_type==="customer"?"Kunde":"Binso Operator"}</LocalizedText></>} internal={message.internal===true} key={String(message.id)}>{String(message.body??"")}</MessageBubble>)}
      <div className="operator-reply"><Textarea value={reply} onChange={e=>setReply(e.target.value)} maxLength={5000} placeholder={internal?"Interne Notiz schreiben...":"Antwort an Kunden schreiben..."}/><div><Button disabled={sending||!reply.trim()} onClick={()=>void send()}><LocalizedText>{internal?"Notiz speichern":"Senden"}</LocalizedText></Button></div></div>
    </WorkspaceSection>
    <aside className="surface customer-context">
      <SectionTitle title="Kunde"/>
      <h3>{String(tenant?.name??"Kunde")}</h3><p>{String(tenant?.uid??"")} <LocalizedText>{tenant?.city?"· "+String(tenant.city):""}</LocalizedText></p>
      {Boolean(tenant?.id)&&<Link href={"/operator/kunden/"+String(tenant?.id)}><LocalizedText>{"Kundendetails öffnen →"}</LocalizedText></Link>}
      <div className="context-block"><small><LocalizedText>{"Support-Zugriff"}</LocalizedText></small><b><LocalizedText>{"Nicht verfügbar"}</LocalizedText></b><span><LocalizedText>{"Der direkte Zugriff auf Kundenkonten ist noch nicht verfügbar."}</LocalizedText></span><Button variant="secondary" disabled><LocalizedText>{"Zugriff starten"}</LocalizedText></Button></div>
    </aside>
    {toast&&<Toast title={toast} tone={toastTone}/>}
  </div>;
}

function CustomersView() {
 const {production,items,loading,loadError,refresh}=useOperatorCustomers();
 const chips=['Alle','Aktiv','Eingeschränkt','Gesperrt'];
 const columns=[{label:'Kunde',index:0},{label:'Plan',index:1},{label:'Monatlicher Listenpreis',index:2,align:'right' as const},{label:'Status',index:3,status:true},{label:'Erstellt',index:4}];
 const controller=useRecordsController({placeholder:'Kunden suchen...',chips,columns});
 const price=Object.fromEntries(plans.map(plan=>[plan.id,moneyChf(plan.monthly)]));
 const rows=production?items.map(item=>[item.name,operatorPlan(item.account?.plan),price[item.account?.plan??'']??(item.account?.plan==='trial'?moneyChf(0):'—'),operatorStatus(item.account?.account_status??'active'),new Date(item.created_at).toLocaleDateString('de-CH'),item.id,[item.uid,item.city].filter(Boolean).join(' · ')]):demoCustomers.map(item=>[item.name,item.plan,item.mrr,item.status,'Demo',item.id,'Demo']);
 return <><RecordsControls inline controller={controller} placeholder="Kunden suchen..." chips={chips} columns={columns}/><RecordsView controller={controller} toolbarActions={false} filterSummary={false} showCount={false} items={rows} loading={production&&loading} error={loadError} placeholder="Kunden suchen..." countLabel="Kunden" emptyLabel={chip=>({Aktiv:"Keine aktiven Kunden",Eingeschränkt:"Keine eingeschränkten Kunden",Gesperrt:"Keine gesperrten Kunden"}[chip]??"Keine Kunden erfasst")} statusGroups={{Aktiv:["Aktiv","Testphase"]}} chips={chips} columns={columns} rowHref={row=>'/operator/kunden/'+row[5]}>{row=><RecordRow compact valuePlacement="metadata" href={'/operator/kunden/'+row[5]} title={row[0]} meta={[row[6],row[1],row[4]].filter(Boolean).join(' · ')} status={row[3]} value={row[2]}/>}</RecordsView>{loadError&&<Button variant="secondary" onClick={refresh}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button>}</>;
}

function OperatorCustomerDetail({tenantId}:{tenantId:string}) {
  const canRestrict=useOperatorPermission("restrictions:manage");
  const production=useBackendMode();
  
  const resource=useApiQuery<{overview?:Record<string,unknown>;tickets?:Array<Record<string,unknown>>;audit?:Array<Record<string,unknown>>}>(production?"/api/operator/customers/"+encodeURIComponent(tenantId):null);
  const data=resource.data??{};
  const loading=resource.loading,loadError=resource.error,refresh=resource.refresh;

  


  const demoCustomer=demoCustomers.find(item=>item.id===tenantId);
  if(!production&&!demoCustomer)return <p role="status"><LocalizedText>{"Kunde nicht gefunden."}</LocalizedText></p>;
  if(!production&&demoCustomer) return <>
    <div className="operator-customer-hero"><div className="operator-customer-main"><span className="record-avatar large">{demoCustomer.name[0]}</span><div><h2>{demoCustomer.name}</h2><p><LocalizedText>{"Demo-Kunde"}</LocalizedText></p></div></div><div className="operator-customer-actions"><Status tone={demoCustomer.status==="Aktiv"?"success":"warning"}><LocalizedText>{demoCustomer.status}</LocalizedText></Status><Button variant="secondary" disabled><LocalizedText>{"Support-Zugriff nicht verfügbar"}</LocalizedText></Button>{canRestrict&&<Button href="/operator/sperrungen" variant="danger"><LocalizedText>{"Einschränken"}</LocalizedText></Button>}</div></div>
    <div className="operator-customer-metrics"><Metric label="Plan" value={demoCustomer.plan} hint="Demo" icon="card"/><Metric label="Benutzer" value="—" hint="Demo" icon="users"/><Metric label="Offene Tickets" value={String(tickets.filter(item=>item[2]===demoCustomer.name&&item[3]!=="Gelöst").length)} hint="Demo" icon="support"/><Metric label="Zahlungsstatus" value="—" hint="Demo" icon="wallet"/></div>
  </>;

  const overview=data.overview??{};
  const tenant=overview.tenant as Record<string,unknown>|null|undefined;
  const account=overview.account as Record<string,unknown>|null|undefined;
  const restrictions=Array.isArray(overview.active_restrictions)?overview.active_restrictions as Array<Record<string,unknown>>:[];
  if(production&&(loading||loadError))return <OperatorLoadState loading={loading} error={loadError} onRetry={refresh}/>;

  if(!tenant) return <WorkspaceSection><LoadingState/></WorkspaceSection>;

  const plan=String(account?.plan??"");
  const accountStatus=String(account?.account_status??"active");
  const userLimit=Number(account?.user_limit??0);
  const users=Number(overview.users??0);
  const openTickets=overview.open_tickets==null?null:Number(overview.open_tickets);
  const access=overview.access as {billing?:boolean;support?:boolean;restrictions?:boolean;audit?:boolean}|undefined;

  return <>
    <div className="operator-customer-hero">
      <div className="operator-customer-main"><span className="record-avatar large">{String(tenant.name??"K").slice(0,1)}</span><div><h2>{String(tenant.name??"Kunde")}</h2><p>{String(tenant.uid??"Keine UID")} <LocalizedText>{tenant.city?"· "+String(tenant.city):""}</LocalizedText></p></div></div>
      <div className="operator-customer-actions"><Status tone={accountStatus==="active"?"success":"warning"}>{operatorStatus(accountStatus)}</Status><Button variant="secondary" disabled><LocalizedText>{"Support-Zugriff nicht verfügbar"}</LocalizedText></Button>{canRestrict&&<Button href="/operator/sperrungen" variant="danger"><LocalizedText>{"Einschränken"}</LocalizedText></Button>}</div>
    </div>
    <div className="operator-customer-metrics"><Metric label="Plan" value={operatorPlan(plan)} hint={overview.monthly_contract_value==null?"Vertragswert: "+(access?.billing?"Keine Daten":"Keine Berechtigung"):"Vertragswert: "+moneyChf(Number(overview.monthly_contract_value))+" / Monat"} icon="card"/><Metric label="Benutzer" value={String(users)+" / "+String(userLimit||"—")} hint={userLimit?String(Math.max(0,userLimit-users))+" Plätze frei":"Limit nicht verfügbar"} icon="users"/><Metric label="Offene Tickets" value={openTickets===null?"—":String(openTickets)} hint={access?.support?"Aktuelle Anfragen":"Keine Berechtigung"} icon="support"/><Metric label="Kundenzahlungen" value={overview.payments_total==null?"—":moneyChf(Number(overview.payments_total))} hint={access?.billing?"Erfasste CHF-Plattformzahlungen":"Keine Berechtigung"} icon="wallet"/></div>
    <div className="operator-customer-grid">
      <WorkspaceSection><SectionTitle title="Konto"/><dl className="operator-detail-list"><div><dt><LocalizedText>{"Firma"}</LocalizedText></dt><dd>{String(tenant.name??"—")}</dd></div><div><dt><LocalizedText>{"E-Mail"}</LocalizedText></dt><dd>{String(tenant.email??"—")}</dd></div><div><dt><LocalizedText>{"Telefon"}</LocalizedText></dt><dd>{String(tenant.phone??"—")}</dd></div><div><dt><LocalizedText>{"Erstellt"}</LocalizedText></dt><dd>{new Date(String(tenant.created_at)).toLocaleDateString("de-CH")}</dd></div><div><dt><LocalizedText>{"Mandant"}</LocalizedText></dt><dd>{String(tenant.id)}</dd></div></dl></WorkspaceSection>
      <WorkspaceSection><SectionTitle title="Abonnement"/><div className="context-block"><small><LocalizedText>{"Plan"}</LocalizedText></small><b>{operatorPlan(plan)}</b><span><LocalizedText>{overview.monthly_contract_value==null?"Vertragswert: "+(access?.billing?"Keine Daten":"Keine Berechtigung"):moneyChf(Number(overview.monthly_contract_value))+" / Monat"}</LocalizedText></span><Status tone={String(account?.subscription_status)==="active"?"success":"warning"}>{operatorStatus(String(account?.subscription_status??"Nicht verfügbar"))}</Status></div><div className="context-block"><small><LocalizedText>{"Kontostatus"}</LocalizedText></small><b>{operatorStatus(accountStatus)}</b><span><LocalizedText>{access?.restrictions?(restrictions.length?String(restrictions.length)+" aktive Einschränkung(en)":"Keine aktive Einschränkung"):"Einschränkungen: Keine Berechtigung"}</LocalizedText></span></div></WorkspaceSection>
      <WorkspaceSection><SectionTitle title="Support"/>{!access?.support?<p><LocalizedText>{"Keine Berechtigung für Supportfälle."}</LocalizedText></p>:(data.tickets??[]).length?<div className="compact-list">{(data.tickets??[]).map(ticket=><Link href={"/operator/tickets/"+String(ticket.id)} key={String(ticket.id)}><b><LocalizedText>{supportReference(String(ticket.id),typeof ticket.case_number==="string"?ticket.case_number:undefined)+" · "+String(ticket.subject??"")}</LocalizedText></b><span>{new Date(String(ticket.updated_at)).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"})}</span><Status tone={String(ticket.status)==="resolved"?"success":"warning"}>{operatorStatus(String(ticket.status))}</Status></Link>)}</div>:<EmptyState compact icon="support" title="Keine Tickets" text="Für diesen Kunden sind keine Tickets vorhanden."/>}</WorkspaceSection>
      <WorkspaceSection><SectionTitle title="Audit"/>{!access?.audit?<p><LocalizedText>{"Keine Berechtigung für Audit-Einträge."}</LocalizedText></p>:(data.audit??[]).length?<div className="audit-list">{(data.audit??[]).map(item=><span key={String(item.id)}><b>{new Date(String(item.created_at)).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"})}</b> {String(item.action)}</span>)}</div>:<p><LocalizedText>{"Noch keine tenant-spezifischen Audit-Einträge."}</LocalizedText></p>}</WorkspaceSection>
    </div>
  </>;
}

function PaymentInsight({label,value,kind,bars=[]}:{label:string;value:string;kind:"trend"|"number";bars?:number[]}) {
  return <section className={"operator-payment-insight payment-insight-"+kind}>
    <MetricTile label={label} value={value}/>
    {kind==="trend"&&<div className="payment-mini-bars" aria-hidden="true">{bars.some(height=>height>0)?bars.map((height,index)=><i key={index} style={{"--bar-value":String(height)+"%"} as CSSProperties}/>):<span><LocalizedText>{"Keine Zahlungen"}</LocalizedText></span>}</div>}
  </section>;
}

function OperatorFinanceView({demo=false}:{demo?:boolean}){
  const production=useBackendMode();
  const resource=useApiQuery<{payments?:Array<Record<string,unknown>>;subscriptions?:Array<Record<string,unknown>>;operatingCosts?:Array<Record<string,unknown>>}>(demo?"/api/demo/platform-finance":production?"/api/operator/finance":null);
  const data=resource.data??{};
  const error=resource.error,refresh=resource.refresh;
  
  const [range,setRange]=useState("month");
  const [filterOpen,setFilterOpen]=useState(false),[draftRange,setDraftRange]=useState("month");
  if(resource.loading||error)return <OperatorLoadState loading={resource.loading} error={error} onRetry={refresh}/>;
  
  const ranges:Record<string,{label:string}>={month:{label:"Dieser Monat"},last:{label:"Letzter Monat"},three:{label:"3 Monate"},year:{label:"12 Monate"},previous:{label:"Letztes Jahr"}};
  const {volume,platformRevenue,costs,result,monthly}=platformFinanceInsights(data,range,businessDate()),max=Math.max(1,...monthly.map(x=>x.value));
  return <div className="operator-finance">
    <div className="section-title"><span><LocalizedText>{ranges[range].label}</LocalizedText></span><LocalizedElement as="button" type="button" className="icon-button records-filter-action" aria-label="Zeitraum filtern" onClick={()=>{setDraftRange(range);setFilterOpen(true)}}><Icon name="filter" size={20}/></LocalizedElement></div>
    <FilterSheet label="Zeitraum" open={filterOpen} onClose={()=>setFilterOpen(false)} actions={<><Button variant="secondary" onClick={()=>setDraftRange("month")}><LocalizedText>{"Zurücksetzen"}</LocalizedText></Button><Button onClick={()=>{setRange(draftRange);setFilterOpen(false)}}><LocalizedText>{"Anwenden"}</LocalizedText></Button></>}><Field label="Zeitraum"><Select value={draftRange} onChange={event=>setDraftRange(event.target.value)}>{Object.entries(ranges).map(([key,x])=><option key={key} value={key}><LocalizedText>{x.label}</LocalizedText></option>)}</Select></Field></FilterSheet>
    <div className="operator-payment-insights"><PaymentInsight label="Kundenzahlungen" value={"CHF "+volume.toLocaleString("de-CH",{minimumFractionDigits:2})} kind="trend" bars={monthly.map(x=>max?x.value/max*100:0)}/><PaymentInsight label="Plattformumsatz" value={"CHF "+platformRevenue.toLocaleString("de-CH",{minimumFractionDigits:2})} kind="number"/><PaymentInsight label="Betriebskosten" value={"CHF "+costs.toLocaleString("de-CH",{minimumFractionDigits:2})} kind="number"/></div>
    <section className="finance-analysis"><SectionTitle title="Finanzentwicklung"/>{monthly.some(x=>x.value>0)?<div className="finance-month-bars">{monthly.map(x=><div key={x.label}><i style={{"--bar-value":`${x.value>0?x.value/max*100:0}%`} as CSSProperties}/><b><LocalizedText>{x.label}</LocalizedText></b><small><LocalizedText>{"CHF "}</LocalizedText>{x.value.toLocaleString("de-CH",{maximumFractionDigits:0})}</small></div>)}</div>:<EmptyState compact title="Keine Kundenzahlungen im gewählten Zeitraum" text="Erfasste Zahlungen erscheinen in der Finanzentwicklung."/>}</section>
    <div className="finance-breakdown"><section><h3><LocalizedText>{"Zusammenfassung"}</LocalizedText></h3><div><span><LocalizedText>{"Betriebskosten gesamt"}</LocalizedText></span><strong><LocalizedText>{"CHF "+costs.toLocaleString("de-CH",{minimumFractionDigits:2})}</LocalizedText></strong></div><div><span><LocalizedText>{"Plattformumsatz"}</LocalizedText></span><strong><LocalizedText>{"CHF "+platformRevenue.toLocaleString("de-CH",{minimumFractionDigits:2})}</LocalizedText></strong></div><div><span><LocalizedText>{"Ergebnis"}</LocalizedText></span><strong><LocalizedText>{"CHF "+result.toLocaleString("de-CH",{minimumFractionDigits:2})}</LocalizedText></strong></div></section><section><h3><LocalizedText>{"Datenbasis"}</LocalizedText></h3><p><LocalizedText>{"Kundenzahlungen, Plattformumsatz und Betriebskosten werden nach dem gewählten Zeitraum ausgewertet."}</LocalizedText></p></section></div>
  </div>
}

function PaymentsView() {
  const production=useBackendMode();
  
  const resource=useApiQuery<{items:Array<Record<string,unknown>>}>(production?"/api/operator/payments":null);
  const items:Array<Record<string,unknown>>=production?resource.data?.items??[]:[{paid_on:"2026-10-02",tenant:{name:"Acme AG"},currency:"CHF",amount:1240,status:"booked",method:"Bank"},{paid_on:"2026-10-02",tenant:{name:"Müller GmbH"},currency:"CHF",amount:49,status:"booked",method:"Bank"},{paid_on:"2026-10-01",tenant:{name:"Schmid Consulting"},currency:"CHF",amount:89,status:"pending",method:"Bank"}];
  const chips=['Alle','Verbucht','Ausstehend','Storniert'];
  const columns=[{label:'Datum',index:0},{label:'Kunde',index:1},{label:'Betrag',index:2,align:'right' as const},{label:'Status',index:3,status:true},{label:'Referenz',index:4}];
  const controller=useRecordsController({placeholder:'Zahlungen suchen...',chips,columns});
  const rows=items.map(item=>{const tenant=item.tenant as {name?:string}|undefined,invoice=item.invoice as {number?:string}|undefined;return [new Date(String(item.paid_on)).toLocaleDateString('de-CH'),tenant?.name??'Mandant',(item.currency?String(item.currency):'—')+' '+Number(item.amount??0).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2}),item.status==='booked'?'Verbucht':item.status==='reversed'?'Storniert':'Ausstehend',[invoice?.number,item.method].filter(Boolean).join(' · ')||'—'];});
  const loading=resource.loading,loadError=resource.error,refresh=resource.refresh;

  

  if(production&&(loading||loadError))return <OperatorLoadState loading={loading} error={loadError} onRetry={refresh}/>;

  const booked=items.filter(item=>item.status==="booked");
  const chfBooked=booked.filter(item=>item.currency==="CHF");
  const total=sumMoney(chfBooked.map(item=>item.amount));
  const paymentMonths=platformFinanceInsights({payments:chfBooked.map(item=>({...item,payment_date:item.paid_on}))},"year",businessDate()).monthly;
  const paymentMax=Math.max(1,...paymentMonths.map(item=>item.value));
  const paymentBars=paymentMonths.map(item=>item.value/paymentMax*100);
  const pending=items.filter(item=>item.status==="pending").length;
  const reversed=items.filter(item=>item.status==="reversed").length;
  return <>
    <div className="operator-payment-insights">
      <PaymentInsight label="Angezeigte Zahlungen · CHF" value={"CHF "+total.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})} kind="trend" bars={paymentBars}/>
      <PaymentInsight label="Verbucht" value={String(booked.length)} kind="number"/>
      <PaymentInsight label="Offen / storniert" value={String(pending+reversed)} kind="number"/>
    </div>
    <WorkspaceSection className="operator-table-card">
      <SectionTitle title="Kundenzahlungen"/>
      <p className="technical-hint"><LocalizedText>{"Erfasste Plattformzahlungen. Kennzahl und Verlauf enthalten CHF; weitere Währungen bleiben in der Liste getrennt."}</LocalizedText></p>
      <RecordsControls inline controller={controller} placeholder="Zahlungen suchen..." chips={chips} columns={columns}/>
      <RecordsView controller={controller} items={rows} placeholder="Zahlungen suchen..." chips={chips} columns={columns} toolbarActions={false} filterSummary={false} showCount={false} countLabel="Zahlungen" emptyLabel={()=>'Noch keine Kundenzahlungen'}>{row=><RecordRow compact valuePlacement="metadata" title={row[1]} meta={[row[0],row[4]].join(' · ')} value={row[2]} status={row[3]}/>}</RecordsView>
    </WorkspaceSection>
  </>;
}

function SubscriptionsView() {
  const canManage=useOperatorPermission("subscriptions:manage");
  const production=useBackendMode();
  
  const resource=useApiQuery<{items:Array<Record<string,unknown>>}>(production?"/api/operator/accounts":null);
  const items=resource.data?.items??[];
  const loading=resource.loading,loadError=resource.error,refresh=resource.refresh;
  const [selected,setSelected]=useState<Record<string,unknown>|null>(null);
  const [toast,setToast,toastTone]=useOperatorToast();
  const [saving,setSaving]=useState(false);

  const load=refresh;
  

  const updateSelected=async(patch:Record<string,unknown>)=>{
    if(!selected||!production||!canManage||saving)return;
    setSaving(true);
    try{
      const tenantId=String(selected.tenant_id);
      const payload=await apiPatch<{item:Record<string,unknown>}>("/api/operator/accounts/"+encodeURIComponent(tenantId),patch);
      setSelected(current=>current?{...current,...payload.item}:current);
      await load();
      setToast("Abonnementstatus aktualisiert.");
    }catch(error){setToast(error instanceof Error?error.message:"Abonnement konnte nicht aktualisiert werden.","danger");}
    setSaving(false);
    window.setTimeout(()=>setToast(null),2400);
  };

  if(!production)return <MetricTiles>{plans.map(plan=><MetricTile key={plan.id} label={plan.name} value={demoCustomers.filter(customer=>customer.plan===plan.name).length+" Kunden"} hint={moneyChf(plan.monthly)+" / Monat · Demo"}/>)}</MetricTiles>;

  const grouped=["trial","start","business","pro"].map(plan=>({plan,items:items.filter(item=>plan==="trial"?item.subscription_status==="trial":item.subscription_status!=="trial"&&item.plan===plan)}));
  const price:Record<string,string>={trial:"CHF 0",...Object.fromEntries(plans.map(plan=>[plan.id,moneyChf(plan.monthly)]))};

  if(production&&(loading||loadError))return <OperatorLoadState loading={loading} error={loadError} onRetry={refresh}/>;

  return <>
    <MetricTiles>{grouped.map(group=><MetricTile key={group.plan} label={operatorPlan(group.plan)} value={group.items.length+(group.items.length===1?" Kunde":" Kunden")} hint={group.items.filter(item=>item.subscription_status==="active").length+" aktiv · Listenpreis "+price[group.plan]+" / Monat"}/>)}</MetricTiles>
    <WorkspaceSection className="operator-table-card">
      <DataTable variant="operator" label="Operator-Daten"><DataTableHead className="operator-table-head customer"><span><LocalizedText>{"Kunde"}</LocalizedText></span><span><LocalizedText>{"Plan"}</LocalizedText></span><span><LocalizedText>{"Abonnement"}</LocalizedText></span><span><LocalizedText>{"Konto"}</LocalizedText></span><span><LocalizedText>{"Aktualisiert"}</LocalizedText></span></DataTableHead>{items.map(item=>{const tenant=item.tenant as {name?:string}|undefined;return <DataTableRow className="operator-table-row customer" key={String(item.tenant_id)} onClick={()=>setSelected(item)}><span><b><LocalizedText verbatim={!!tenant?.name}>{tenant?.name??"Kunde"}</LocalizedText></b></span><span>{operatorPlan(String(item.plan))}</span><span><Status tone={item.subscription_status==="active"?"success":"warning"}>{operatorStatus(String(item.subscription_status))}</Status></span><span><Status tone={item.account_status==="active"?"success":"warning"}>{operatorStatus(String(item.account_status))}</Status></span><span>{new Date(String(item.updated_at)).toLocaleDateString("de-CH")}</span></DataTableRow>})}</DataTable>
    </WorkspaceSection>
    {selected&&<FormSheet open={Boolean(selected)} label={String((selected?.tenant as {name?:string}|undefined)?.name??"Kunde")} description="Plan und interner Kontostatus. Stripe-Abonnements werden über Stripe verwaltet; interne Kontosperren ändern keine Stripe-Zahlungen." dirty={false} onClose={()=>setSelected(null)} actions={<><Button variant="secondary" onClick={()=>setSelected(null)}><LocalizedText>{"Schliessen"}</LocalizedText></Button><Button href={"/operator/kunden/"+String(selected?.tenant_id)}><LocalizedText>{"Kunde öffnen"}</LocalizedText></Button></>}><Field label="Plan"><Select disabled={saving||!canManage||Boolean(selected.billing_subscription_ref)} value={String(selected.plan)} onChange={e=>void updateSelected({plan:e.target.value})}><option value="trial" disabled><LocalizedText>{"Testphase"}</LocalizedText></option><option value="start"><LocalizedText>{"Start"}</LocalizedText></option><option value="business"><LocalizedText>{"Business"}</LocalizedText></option><option value="pro"><LocalizedText>{"Pro"}</LocalizedText></option></Select></Field><Field label="Abonnement"><Select disabled={saving||!canManage||Boolean(selected.billing_subscription_ref)} value={String(selected.subscription_status)} onChange={e=>void updateSelected({subscriptionStatus:e.target.value})}><option value="trial"><LocalizedText>{"Testphase"}</LocalizedText></option><option value="active"><LocalizedText>{"Aktiv"}</LocalizedText></option><option value="past_due"><LocalizedText>{"Überfällig"}</LocalizedText></option><option value="suspended"><LocalizedText>{"Pausiert"}</LocalizedText></option><option value="cancelled"><LocalizedText>{"Gekündigt"}</LocalizedText></option></Select></Field><Field label="Benutzerlimit"><Input disabled={saving||!canManage||selected.user_limit==null} type="number" min="1" max="10000" placeholder="Nicht verfügbar" value={selected.user_limit==null?"":String(selected.user_limit)} onChange={e=>setSelected(current=>current?{...current,user_limit:Number(e.target.value)}:current)} onBlur={()=>void updateSelected({userLimit:Number(selected.user_limit??3)})}/></Field></FormSheet>}
    {toast&&<Toast title={toast} tone={toastTone}/>}
  </>;
}

function RestrictionsView({open,onClose}:{open:boolean;onClose:()=>void}) {
  const production=useBackendMode();
  
  const {items:customers}=useOperatorCustomers();
  const resource=useApiQuery<{items:Array<Record<string,unknown>>}>(production?"/api/operator/restrictions":null);
  const items=resource.data?.items??[];
  const loading=resource.loading,loadError=resource.error,refresh=resource.refresh;
  const [tenantId,setTenantId]=useState("");
  const [reason,setReason]=useState("Zahlungsausstand");
  const [scope,setScope]=useState("write");
  const [endsAt,setEndsAt]=useState("");
  const [note,setNote]=useState("");
  const [confirm,setConfirm]=useState<"create"|string|null>(null);
  const [busy,setBusy]=useState(false),[now,setNow]=useState(0);
  useEffect(()=>{const update=()=>setNow(Date.now());update();const timer=window.setInterval(update,60000);return()=>window.clearInterval(timer);},[]);
  const [toast,setToast,toastTone]=useOperatorToast();

  const load=refresh;

  
  useEffect(()=>{if(production&&!tenantId&&customers[0]) queueMicrotask(()=>setTenantId(customers[0].id));},[production,tenantId,customers]);

  const createRestriction=async()=>{
    if(busy)return;
    if(!production){setConfirm(null);onClose();setToast("Einschränkung im Demo-Modus simuliert.");window.setTimeout(()=>setToast(null),2200);return;}
    setBusy(true);
    try{
      await apiPost("/api/operator/restrictions",{tenantId,scope,reason,note:note.trim()||reason,endsAt:endsAt||null});
      setConfirm(null);setNote("");setEndsAt("");onClose();
      await load();
      setToast("Einschränkung erstellt und im Audit protokolliert.");
    }catch(error){setToast(error instanceof Error?error.message:"Einschränkung konnte nicht erstellt werden.","danger");}
    setBusy(false);
    window.setTimeout(()=>setToast(null),2600);
  };

  const removeRestriction=async(id:string)=>{
    if(busy)return;
    if(!production){setConfirm(null);return;}
    setBusy(true);
    try{
      await apiPatch("/api/operator/restrictions/"+encodeURIComponent(id),{active:false});
      setConfirm(null);await load();setToast("Einschränkung aufgehoben.");
    }catch(error){setToast(error instanceof Error?error.message:"Einschränkung konnte nicht aufgehoben werden.","danger");}
    setBusy(false);
    window.setTimeout(()=>setToast(null),2600);
  };

  const active=production?items.filter(item=>item.active===true&&Date.parse(String(item.starts_at))<=now&&(!item.ends_at||Date.parse(String(item.ends_at))>now)):[];
  if(production&&(loading||loadError))return <OperatorLoadState loading={loading} error={loadError} onRetry={refresh}/>;

  return <>
    <FormSheet open={open} onClose={onClose} label="Einschränkung erstellen" actions={<Button onClick={()=>setConfirm("create")} disabled={production&&!tenantId}><LocalizedText>{"Einschränkung prüfen"}</LocalizedText></Button>}>
        <div className="form-grid two">
          <Field label="Kunde"><Select value={tenantId} onChange={e=>setTenantId(e.target.value)}>{production?customers.map(customer=><option value={customer.id} key={customer.id}>{customer.name}</option>):<option value={"Meier Handel AG"}><LocalizedText>{"Meier Handel AG"}</LocalizedText></option>}</Select></Field>
          <Field label="Grund"><Select value={reason} onChange={e=>setReason(e.target.value)}><option value={"Zahlungsausstand"}><LocalizedText>{"Zahlungsausstand"}</LocalizedText></option><option value={"Sicherheitsvorfall"}><LocalizedText>{"Sicherheitsvorfall"}</LocalizedText></option><option value={"Vertragsende"}><LocalizedText>{"Vertragsende"}</LocalizedText></option><option value={"Manuelle Prüfung"}><LocalizedText>{"Manuelle Prüfung"}</LocalizedText></option></Select></Field>
          <Field label="Umfang"><Select value={scope} onChange={e=>setScope(e.target.value)}><option value="all"><LocalizedText>{"Gesamter Zugriff"}</LocalizedText></option><option value="write"><LocalizedText>{"Nur Schreibzugriff"}</LocalizedText></option></Select></Field>
          <Field label="Ablaufdatum"><Input type="date" value={endsAt} onChange={e=>setEndsAt(e.target.value)}/></Field>
          <Field label="Interne Begründung" className="full"><Textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Begründung für Audit und interne Nachvollziehbarkeit"/></Field>
        </div>
    </FormSheet>
      <WorkspaceSection>
        <SectionTitle title="Aktive Einschränkungen"/>
        {production?(active.length?active.map(item=>{const tenant=item.tenant as {name?:string}|undefined;return <div className="notice" key={String(item.id)}><Status tone="warning"><LocalizedText>{item.scope==="all"?"Gesperrt":"Eingeschränkt"}</LocalizedText></Status><b><LocalizedText verbatim={!!tenant?.name}>{tenant?.name??"Kunde"}</LocalizedText></b><span>{String(item.reason??"")}<LocalizedText>{" · seit "}</LocalizedText>{new Date(String(item.starts_at)).toLocaleDateString("de-CH")}</span><Button variant="secondary" onClick={()=>setConfirm(String(item.id))}><LocalizedText>{"Aufheben"}</LocalizedText></Button></div>}):<EmptyState compact icon="lock" title="Keine aktiven Einschränkungen" text="Keine aktuell wirksame Operator-Einschränkung erfasst."/>):<div className="notice"><Status tone="warning"><LocalizedText>{"Demo"}</LocalizedText></Status><b><LocalizedText>{"Meier Handel AG"}</LocalizedText></b><span><LocalizedText>{"Zahlungsausstand · Beispiel"}</LocalizedText></span><Button variant="secondary" onClick={()=>setConfirm("demo")}><LocalizedText>{"Aufheben"}</LocalizedText></Button></div>}
      </WorkspaceSection>
    {confirm&&<ConfirmDialog open={Boolean(confirm)} title={confirm==="create"?"Zugriff einschränken?":"Einschränkung aufheben?"} message={confirm==="create"?"Der Zugriff wird gemäss Umfang eingeschränkt. Grund, Operator und Zeitpunkt werden im Audit protokolliert.":"Der normale Zugriff wird wiederhergestellt, sofern keine weitere aktive Einschränkung besteht."} confirmLabel={confirm==="create"?"Einschränken":"Aufheben"} danger={confirm==="create"} busy={busy} onCancel={()=>setConfirm(null)} onConfirm={()=>confirm==="create"?void createRestriction():confirm&&void removeRestriction(confirm)}/>}
    {toast&&<Toast title={toast} tone={toastTone}/>}
  </>;
}


function MonitoringView(){return <MonitoringPanel/>;}

function AnnouncementsView({open,onClose}:{open:boolean;onClose:()=>void}) {
  const production=useBackendMode();
  
  const resource=useApiQuery<{items:Array<Record<string,unknown>>}>(production?"/api/operator/announcements":null);
  const items=resource.data?.items??[];
  const loading=resource.loading,loadError=resource.error,refresh=resource.refresh;
  const [title,setTitle]=useState("");
  const [kind,setKind]=useState("info");
  const [audience,setAudience]=useState("");
  const {items:announcementCustomers}=useOperatorCustomers();
  const [publishing,setPublishing]=useState(false);
  const [body,setBody]=useState("");
  const [toast,setToast,toastTone]=useOperatorToast();

  const load=refresh;

  

  const publish=async()=>{
    if(publishing)return;
    if(title.trim().length<2||body.trim().length<2){
      setToast("Titel und Nachricht sind erforderlich.","danger");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    if(!production){
      onClose();setToast("Ankündigung im Demo-Modus simuliert.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    setPublishing(true);
    try{
      await apiPost<{item:Record<string,unknown>}>("/api/operator/announcements",{title,message:body,kind,organizationId:audience||null});
      refresh();
      setTitle("");setBody("");onClose();
      setToast("Ankündigung veröffentlicht.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Ankündigung konnte nicht veröffentlicht werden.","danger");
    }
    setPublishing(false);
    window.setTimeout(()=>setToast(null),2400);
  };

  const kindLabel:Record<string,string>={info:"Information",success:"Erfolg",warning:"Warnung"};
  const audienceLabel=Object.fromEntries(announcementCustomers.map(customer=>[customer.id,customer.name]));

  if(production&&(loading||loadError))return <OperatorLoadState loading={loading} error={loadError} onRetry={refresh}/>;

  return <>
    <FormSheet open={open} onClose={onClose} label="Ankündigung erstellen" actions={<Button disabled={publishing||title.trim().length<2||body.trim().length<2} onClick={()=>void publish()}><LocalizedText>{"Veröffentlichen"}</LocalizedText></Button>}>
      <div className="form-grid"><Field label="Titel" className="full"><Input required minLength={2} maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Kurzer Titel"/></Field><Field label="Typ" className="full"><Select value={kind} onChange={e=>setKind(e.target.value)}><option value="info"><LocalizedText>{"Information"}</LocalizedText></option><option value="success"><LocalizedText>{"Erfolg"}</LocalizedText></option><option value="warning"><LocalizedText>{"Warnung"}</LocalizedText></option></Select></Field><Field label="Zielgruppe" className="full"><Select value={audience} onChange={e=>setAudience(e.target.value)}><option value=""><LocalizedText>{"Alle Kunden"}</LocalizedText></option>{announcementCustomers.map(customer=><option key={customer.id} value={customer.id}>{customer.name}</option>)}</Select></Field><Field label="Nachricht" className="full"><Textarea required minLength={2} maxLength={2000} value={body} onChange={e=>setBody(e.target.value)} placeholder="Nachricht..."/></Field></div>
    </FormSheet>
    <WorkspaceSection>
      {production?(items.length?<div>{items.map(item=><div className="announcement-card" key={String(item.id)}><Status tone={item.active===true?"success":"neutral"}><LocalizedText>{item.active===true?"Veröffentlicht":"Entwurf"}</LocalizedText></Status><b>{String(item.title??"")}</b><p>{String(item.message??"")}</p><small><LocalizedText>{kindLabel[String(item.kind)]??String(item.kind)}</LocalizedText> · <LocalizedText>{item.organizationId?(audienceLabel[String(item.organizationId)]??"Einzelner Kunde"):"Alle Kunden"}</LocalizedText> · {new Date(String(item.createdAt)).toLocaleString("de-CH")}</small></div>)}</div>:<EmptyState compact icon="bell" title="Noch keine Ankündigungen" text="Veröffentlichte Hinweise erscheinen hier."/>):<div className="announcement-card"><Status tone="info"><LocalizedText>{"Demo"}</LocalizedText></Status><b><LocalizedText>{"Neue Rechnungsansicht"}</LocalizedText></b><p><LocalizedText>{"Beispiel-Ankündigung ohne Backend."}</LocalizedText></p><small><LocalizedText>{"Demo · alle Kunden"}</LocalizedText></small></div>}
    </WorkspaceSection>
    {toast&&<Toast title={toast} tone={toastTone}/>}
  </>;
}

function SecurityView() {
  const production=useBackendMode();
  
  const resource=useApiQuery<{items:Array<Record<string,unknown>>}>(production?"/api/operator/users":null);
  const items=resource.data?.items??[];
  const roleLabel:Record<string,string>={platform_owner:'Plattform Owner',platform_admin:'Administrator',platform_support:'Support',platform_billing:'Finanzen',platform_auditor:'Audit'};
  const chips=['Alle','Aktiv','Inaktiv'];
  const columns=[{label:'Benutzer',index:0},{label:'Rolle',index:1},{label:'Status',index:2,status:true},{label:'Synchronisiert',index:3}];
  const controller=useRecordsController({placeholder:'Adminbenutzer suchen...',chips,columns});
  const rows=items.map(item=>[String(item.display_name??item.email??''),roleLabel[String(item.role)]??String(item.role),item.active===true?'Aktiv':'Inaktiv',item.last_entra_sync_at?new Date(String(item.last_entra_sync_at)).toLocaleString('de-CH',{dateStyle:'short',timeStyle:'short'}):'—',String(item.email??'')]);
  const loading=resource.loading,loadError=resource.error,refresh=resource.refresh;

  

  if(production&&(loading||loadError))return <OperatorLoadState loading={loading} error={loadError} onRetry={refresh}/>;

  if(!production) return <>
    <WorkspaceSection>
      <SectionTitle title="Interne Benutzer"/>
      <DataTable variant="operator" label="Operator-Daten"><DataTableHead className="operator-table-head security"><span><LocalizedText>{"Name"}</LocalizedText></span><span><LocalizedText>{"Rolle"}</LocalizedText></span><span><LocalizedText>{"Status"}</LocalizedText></span><span><LocalizedText>{"Quelle"}</LocalizedText></span></DataTableHead>{[["Oemer Cam","Administrator","Aktiv","Microsoft Entra"],["Maria Bianchi","Support","Aktiv","Microsoft Entra"],["Luca Schneider","Support","Aktiv","Microsoft Entra"],["Anna Pross","Finanzen","Aktiv","Microsoft Entra"]].map(r=><DataTableRow className="operator-table-row security" key={r[0]}><span><b>{r[0]}</b></span><span>{r[1]}</span><span><Status tone="success">{r[2]}</Status></span><span>{r[3]}</span></DataTableRow>)}</DataTable>
    </WorkspaceSection>
  </>;

  return <>
    <WorkspaceSection>
      <SectionTitle title="Microsoft Entra Zugriffe"/>
      <p className="technical-hint"><LocalizedText>{"Interne Identitäten, MFA und Rollen werden in Microsoft Entra ID verwaltet. Binso One zeigt hier nur die zuletzt synchronisierte Berechtigung."}</LocalizedText></p>
      <RecordsControls inline controller={controller} placeholder="Adminbenutzer suchen..." chips={chips} columns={columns}/>
      <RecordsView controller={controller} items={rows} placeholder="Adminbenutzer suchen..." chips={chips} columns={columns} toolbarActions={false} filterSummary={false} showCount={false} countLabel="Adminbenutzer" emptyLabel={()=>'Noch keine Entra-Anmeldung'}>{row=><RecordRow compact valuePlacement="metadata" title={row[0]} meta={[row[4],row[1],row[3]].join(' · ')} status={row[2]}/>}</RecordsView>
    </WorkspaceSection>

  </>;
}

function AuditView() {
 const production=useBackendMode();
 const resource=useApiQuery<{items:Array<{id:string;createdAt:string|null;userName:string|null;userEmail:string|null;action:string;entityType:string|null;entityId:string|null}>}>(production?'/api/operator/audit':null);
 const columns=[{label:'Zeit',index:0},{label:'Operator',index:1},{label:'Aktion',index:2},{label:'Ziel',index:3}];
 const controller=useRecordsController({placeholder:'Audit durchsuchen...',chips:['Alle'],columns});
 const rows=production?(resource.data?.items??[]).map(item=>[item.createdAt&&Number.isFinite(Date.parse(item.createdAt))?new Date(item.createdAt).toLocaleString('de-CH',{dateStyle:'short',timeStyle:'short'}):'Zeitpunkt nicht verfügbar',item.userName||item.userEmail||'System',item.action==='operator.entra_login'?'Microsoft-Anmeldung':item.action,[item.entityType,item.entityId].filter(Boolean).map(String).join(' · ')||'—']):[['10:42','ocam','Kunde aktualisiert','Acme AG (Demo)'],['09:18','lschneider','Sperrung erstellt','Demo'],['Gestern','mbianchi','Ticket Status geändert','#8419 → In Bearbeitung']];
 return <><RecordsControls inline controller={controller} placeholder="Audit durchsuchen..." chips={['Alle']} columns={columns}/><RecordsView controller={controller} toolbarActions={false} filterSummary={false} showCount={false} items={rows} loading={production&&resource.loading} error={resource.error} placeholder="Audit durchsuchen..." countLabel="Audit-Einträge" chips={['Alle']} columns={columns}>{row=><RecordRow compact valuePlacement="metadata" title={row[2]} meta={[row[0],row[1],row[3]].join(' · ')}/>}</RecordsView>{resource.error&&<Button variant="secondary" onClick={resource.refresh}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button>}</>;
}
