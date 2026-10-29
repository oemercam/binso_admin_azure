"use client";
import Link from "next/link";
import {CustomerImportControl} from "../customer-import";
import {CustomerDataActions} from "../customer-data-actions";
import {activityDays} from "@/lib/display-format";
import {contactHref} from "@/lib/contact-links";
import {usePageAccess} from "@/lib/client/page-access";
import {LocalizedText,useLocale} from "@/lib/client/locale";
import {localeTags} from "@/lib/locales/config";
import {safeAppPath} from "@/lib/navigation";

import {projectStatusLabels} from "@/lib/projects";
import {formatCurrency,financialStatus,businessDate} from "@/lib/financial-status";
import {EntityFiles,type EntityFilesHandle} from "../entity-files";
import {useApiQuery} from "@/lib/client/use-api-query";
import {Avatar} from "../avatar";

import { DocumentList, DocumentSummaryRow, type DocumentListItem } from "../document-list";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useId, type Ref } from "react";
import ConfirmDialog from "../confirm-dialog";
import { AppShell } from "../app-shell";
import { RecordRow, RecordIdentity, RecordsView, RecordsControls, useRecordsController } from "../records";
import { apiPatch, apiPost, apiDelete, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {Button, EmptyState, Field, SectionTitle, Status, Toast, Input, Select, LoadingState, ErrorState, FormActions, FormSection} from "../ui";
import { ActionRow, ActionSheet, FormPage, FormSheet, CreateAction, ListRow, DetailTabs, DetailSections, DetailDisclosure, MetricTiles, MetricTile, ListSearch } from "../binso-ux";
import { useRemoteRows, swissDate } from "./shared";
import { FinancialSummary } from "./finance";

export function formatSwissPhone(value:unknown){const raw=String(value??"").trim();const digits=raw.replace(/\D/g,"");if(digits.startsWith("41")&&digits.length===11)return `+41 ${digits.slice(2,4)} ${digits.slice(4,7)} ${digits.slice(7,9)} ${digits.slice(9,11)}`;if(digits.startsWith("0")&&digits.length===10)return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,8)} ${digits.slice(8,10)}`;return raw;}

export function formatSwissUid(value:unknown){const raw=String(value??"").trim().toUpperCase();const digits=raw.replace(/\D/g,"");if(digits.length===9)return `CHE-${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}`;return raw;}

const customerChips=["Alle","Aktiv","Mit offenen Beträgen","Inaktiv"];
const customerVisibleChips=customerChips.slice(0,3);
const customerColumns=[{label:"Kunde",index:0,render:(row:string[])=><RecordIdentity name={row[0]} meta={row[1]&&row[1]!=="—"?row[1]:undefined} identity={row[3]||row[0]} showMark={false}/>},{label:"Status",index:4,status:true}];
const customerSortColumns=[{label:"Name",index:0},{label:"Ort",index:2},{label:"Status",index:4}];
export function CustomersPage() {

  const financialsAllowed=usePageAccess().canOpen("/rechnungen");
  const chips=financialsAllowed?customerChips:customerChips.filter(chip=>chip!=="Mit offenen Beträgen");
  const visibleChips=financialsAllowed?customerVisibleChips:customerVisibleChips.filter(chip=>chip!=="Mit offenen Beträgen");
  const columns=customerColumns;
  // Whole-tenant counts remain independent of list search, status and pagination.
  const controller=useRecordsController({placeholder:"Kunden suchen...",columns:customerSortColumns,chips});
  const query=new URLSearchParams({...(financialsAllowed?{include:"financials"}:{}),limit:"50",offset:String(controller.page*50),order:({0:"name",2:"city",4:"status"} as Record<number,string>)[controller.sortIndex]?(controller.sort==='default'?'name.asc':({0:"name",2:"city",4:"status"} as Record<number,string>)[controller.sortIndex]+'.'+controller.sort):'name.asc'});
  if(controller.query.trim())query.set('q',controller.query.trim());
  if(controller.activeChip==='Mit offenen Beträgen')query.set('outstanding','1');
  if(controller.activeChip==='Aktiv'||controller.activeChip==='Inaktiv')query.set('status',controller.activeChip==='Aktiv'?'active':'inactive');
  const {rows:customerRows,total,loading,error}=useRemoteRows("customers",query.toString(),controller.restored);
  return <AppShell title="Kunden" active="kunden">
    <RecordsControls tools={()=><CustomerDataActions tools/>} appearance="line" chips={visibleChips} filterChips={chips} controller={controller} placeholder="Kunden suchen..." columns={customerSortColumns}><CreateAction href="/kunden/neu" label="Neuer Kunde"/></RecordsControls><RecordsView chips={chips} controller={controller} toolbarActions={false} showCount={false} remote pagination={{total,page:controller.page,pageSize:50,onPage:controller.setPage}} loading={loading} error={error} items={customerRows} countLabel="Kunden" placeholder="Kunden suchen..." columns={columns} rowHref={row=>"/kunden/"+encodeURIComponent(row[3])}>{([name,contact,,id,status])=><RecordRow href={"/kunden/"+encodeURIComponent(id)} title={name} status={status} meta={contact&&contact!=="—"?contact:""}/>}</RecordsView>
  </AppShell>;
}

export function CustomerDetail({customerId="acme"}:{customerId?:string}) {

  const access=usePageAccess();
  const customerSearch=useSearchParams();
  const requestedSection=customerSearch.get("section")??customerSearch.get("tab");
  const section=requestedSection==='finances'?'documents':['overview','documents','activity','contacts','details','files'].includes(requestedSection??'')?requestedSection:'overview';
  const {locale}=useLocale();
  const workspace=useApiQuery<{counts?:Record<string,number|null>;redirectTo?:string;item?:Record<string,unknown>;contacts?:Array<Record<string,unknown>>;documents:Array<Record<string,unknown>>;openInvoices?:Array<Record<string,unknown>>;summary:FinancialSummary;capabilities?:{invoices:boolean;offers:boolean;files?:boolean};projects?:Array<{id:string;name:string;status:string;total_count:number}>|null;payments?:Array<{id:string;paid_on:string;amount:number;currency:string;invoice_number:string;status:string;total_count:number}>|null;activity:Array<{at:string;title:string;detail:string;href?:string;version?:number;documentNumber?:string}>;statistics:Array<{currency:string;date:string;paid:unknown;billed:unknown;invoice_count:unknown}>|null}>("/api/customers/"+encodeURIComponent(customerId)+"?include="+(section==='overview'?'hub':'workspace'));
  const searchParams=useSearchParams();
  const requestedReturnTo=searchParams.get("returnTo");
  const returnTo=safeAppPath(requestedReturnTo,"/kunden");
  const router=useRouter();
  const attachmentUpload=useRef<EntityFilesHandle>(null);
  const tab=section;
  const hub='/kunden/'+encodeURIComponent(customerId)+(returnTo!=='/kunden'?'?returnTo='+encodeURIComponent(returnTo):'');
  const sectionHref=(section:string)=>hub+(hub.includes('?')?'&':'?')+'section='+section;
  const listHref=(route:string)=>route+'?customerId='+encodeURIComponent(customerId)+'&returnTo='+encodeURIComponent(hub);
  const setTab=(next:string)=>router.replace(sectionHref(next),{scroll:false});
  const [statisticCurrency,setStatisticCurrency]=useState('CHF');
  const [contactOpen,setContactOpen]=useState(false);
  const [contactId,setContactId]=useState<string|null>(null);
  const [contactPrimary,setContactPrimary]=useState(false);
  const [contactSaving,setContactSaving]=useState(false);
  const contactBusy=useRef(false);
  const [removeContact,setRemoveContact]=useState<string|null>(null);
  const [contactToast,setContactToast]=useState<string|null>(null);
  const loadError=workspace.error;
  const customer=workspace.data?.item;
  const [contacts,setContacts]=useState<Array<Record<string,unknown>>>([]);
  const customerActivity=workspace.data?.activity??[];
  const [activityQuery,setActivityQuery]=useState('');
  const visibleActivity=customerActivity.filter(item=>(item.title+' '+item.detail).toLocaleLowerCase().includes(activityQuery.trim().toLocaleLowerCase()));
  const customerSummary=workspace.data?.summary;
  const [contactImportOpen,setContactImportOpen]=useState(false);
  const [customerActions,setCustomerActions]=useState(false);
  const [contactMenu,setContactMenu]=useState<Record<string,unknown>|null>(null);
  const customerDocumentsError=workspace.error;
  const customerDocuments=workspace.data?.openInvoices??workspace.data?.documents??[];
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [contactEmail,setContactEmail]=useState("");
  const [contactPhone,setContactPhone]=useState("");
  const [contactRole,setContactRole]=useState("");

  useEffect(()=>{if(workspace.data?.contacts)queueMicrotask(()=>setContacts(workspace.data!.contacts!));},[workspace.data]);
  useEffect(()=>{const target=workspace.data?.redirectTo;if(target&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target)&&target!==customerId)router.replace('/kunden/'+encodeURIComponent(target)+'?'+searchParams.toString(),{scroll:false});},[workspace.data?.redirectTo,customerId,router,searchParams]);

  const openContact=(contact?:Record<string,unknown>)=>{
    setContactId(contact?String(contact.id):null);
    setFirstName(String(contact?.first_name??""));setLastName(String(contact?.last_name??""));
    setContactEmail(String(contact?.email??""));setContactPhone(String(contact?.phone??""));setContactRole(String(contact?.job_title??""));
    setContactPrimary(contact?.is_primary===true||!contact&&contacts.length===0);setContactOpen(true);
  };
  const makePrimary=async(contact:Record<string,unknown>)=>{
    if(contactBusy.current)return;contactBusy.current=true;setContactSaving(true);
    try{
      const payload=await apiPatch<{item:Record<string,unknown>}>("/api/customers/"+encodeURIComponent(customerId)+"/contacts/"+encodeURIComponent(String(contact.id)),{firstName:contact.first_name,lastName:contact.last_name,email:contact.email??'',phone:contact.phone??'',jobTitle:contact.job_title??'',isPrimary:true});
      setContacts(current=>current.map(item=>item.id===payload.item.id?payload.item:{...item,is_primary:false}));setContactMenu(null);setContactToast('Kontakt gespeichert.');
    }catch(error){setContactToast(error instanceof Error?error.message:'Kontakt konnte nicht gespeichert werden.');}
    finally{contactBusy.current=false;setContactSaving(false);}
  };
  const remove=async()=>{if(!removeContact||contactBusy.current)return;contactBusy.current=true;setContactSaving(true);try{
    await apiDelete("/api/customers/"+encodeURIComponent(customerId)+"/contacts/"+encodeURIComponent(removeContact));
    setContacts(current=>current.filter(c=>c.id!==removeContact));setRemoveContact(null);setContactToast("Kontakt entfernt.");
  }catch(e){setContactToast(e instanceof Error?e.message:"Kontakt konnte nicht entfernt werden.")}finally{contactBusy.current=false;setContactSaving(false)}};
  const saveContact=async()=>{
    {}
    if(contactBusy.current)return;
    if(!firstName.trim()||!lastName.trim()){setContactToast("Vorname und Nachname sind erforderlich.");return;}
    if(contactEmail.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())){setContactToast("Bitte eine gültige E-Mail-Adresse erfassen.");return;}
    contactBusy.current=true;setContactSaving(true);
    try{
      const payload=await (contactId?apiPatch:apiPost)<{item:Record<string,unknown>}>("/api/customers/"+encodeURIComponent(customerId)+"/contacts"+(contactId?"/"+encodeURIComponent(contactId):""),{
        firstName,lastName,email:contactEmail,phone:contactPhone,jobTitle:contactRole,isPrimary:contactPrimary,
      });
      setContacts(current=>[...current.filter(c=>c.id!==payload.item.id).map(c=>contactPrimary?{...c,is_primary:false}:c),payload.item]);
      setFirstName("");setLastName("");setContactEmail("");setContactPhone("");setContactRole("");
      setContactOpen(false);
      setContactToast("Kontakt gespeichert.");
    }catch(error){
      setContactToast(error instanceof Error?error.message:"Kontakt konnte nicht gespeichert werden.");
    }
    finally{contactBusy.current=false;setContactSaving(false)}
    window.setTimeout(()=>setContactToast(null),2600);
  };

      if(loadError)return <AppShell title="Kunde" subtitle="Kundendaten nicht verfügbar" active="kunden" backHref={returnTo} backLabel="Kunden"><ErrorState onRetry={workspace.refresh}>{loadError}</ErrorState><div className="page-actions"><Button href={returnTo} variant="ghost"><LocalizedText>{"Zur Übersicht"}</LocalizedText></Button></div></AppShell>;
  if(!customer) return <AppShell title="Kunde" active="kunden" backHref={returnTo} backLabel="Kunden"><LoadingState>Die Kundendaten werden abgerufen.</LoadingState></AppShell>;

  const availableCurrencies=[...new Set([...(workspace.data?.statistics??[]).map(row=>row.currency),...(customerSummary?.invoices??[]).map(row=>row.currency)])];
  const displayCurrency=availableCurrencies.includes(statisticCurrency)?statisticCurrency:availableCurrencies[0]??'CHF';
  const name=String(customer.name??"Kunde");
  const sector=String(customer.sector??"");
  const city=String(customer.city??"");
  const status=String(customer.status??"active");
  const primaryContact=contacts.find(contact=>contact.is_primary===true)??contacts[0];
  return <AppShell headingPlacement="header" recordLabel={String(customer.customer_no??"")} titleIsUserContent title={name} status={status==="inactive"?"Inaktiv":"Aktiv"} statusTone={status==="inactive"?"neutral":"success"} subtitle={[sector,city].filter(Boolean).join(" · ")} active="kunden" backHref={tab==='overview'?returnTo:hub} backLabel={tab==='overview'?'Kunden':'Zurück'} mobileActions={<Button variant="ghost" icon="more" ariaLabel="Kundenaktionen" onClick={()=>setCustomerActions(true)}/>} actions={<Button variant="ghost" icon="more" ariaLabel="Kundenaktionen" onClick={()=>setCustomerActions(true)}/>} >
    <div className="customer-detail-workspace">

      <div className="desktop-detail-main"><div>
    {tab==='overview'&&<nav className="action-list navigation-group" aria-label="Kundenbereiche">{[
      {title:'Aufträge',icon:'box',href:listHref('/projekte'),count:workspace.data?.counts?.projects,allowed:access.canOpen('/projekte')},
      {title:'Angebote',icon:'file',href:listHref('/angebote'),count:workspace.data?.counts?.offers,allowed:access.canOpen('/angebote')},
      {title:'Rechnungen',icon:'receipt',href:listHref('/rechnungen'),count:workspace.data?.counts?.invoices,allowed:access.canOpen('/rechnungen')},
      {title:'Zahlungen',icon:'wallet',href:listHref('/zahlungen'),count:workspace.data?.counts?.payments,allowed:access.canOpen('/zahlungen')},
      {title:'Kontakte',icon:'users',href:sectionHref('contacts'),count:workspace.data?.counts?.contacts,allowed:true},
      {title:'Dateien',icon:'file',href:sectionHref('files'),count:workspace.data?.counts?.files,allowed:workspace.data?.capabilities?.files!==false},
      {title:'Verlauf',icon:'clock',href:sectionHref('activity'),allowed:true},
      {title:'Stammdaten',icon:'building',href:sectionHref('details'),allowed:true},
    ].filter(row=>row.allowed).map(row=><ActionRow key={row.title} title={row.title} icon={row.icon} href={row.href} value={'count' in row?(Number.isFinite(row.count)?row.count:'—'):undefined}/>)}</nav>}
    {tab==='files'&&<EntityFiles purpose="customer_document" entityId={customerId} uploadRef={attachmentUpload}/>}
    {tab==="details"&&<DetailSections summary={workspace.data?.capabilities?.invoices===false?undefined:<><SectionTitle title="Finanzübersicht" desktopOnly/>{availableCurrencies.length>1&&<Field label="Statistikwährung" allowReadOnlyInput><Select value={displayCurrency} onChange={event=>setStatisticCurrency(event.target.value)}>{availableCurrencies.map(currency=><option key={currency} value={currency}>{currency}</option>)}</Select></Field>}{customerSummary?.invoices.filter(row=>row.currency===displayCurrency).map(row=><MetricTiles columns={2} key={row.currency}><MetricTile label={<><LocalizedText>{"Fakturiert"}</LocalizedText> {businessDate().slice(0,4)}</>} value={row.revenue} currency={row.currency} compactMoney/><MetricTile label="Offen" value={row.open_amount} currency={row.currency} compactMoney/></MetricTiles>)}{!customerSummary?.invoices.length&&<EmptyState title="Keine Rechnungen erfasst"/>}</>}
      facts={<><SectionTitle title="Kontaktperson"/>{primaryContact?<div className="contact-facts"><p>{[primaryContact.first_name,primaryContact.last_name].filter(Boolean).join(" ")}</p>{Boolean(primaryContact.job_title)&&<p>{String(primaryContact.job_title)}</p>}<Button variant="ghost" icon="arrow" ariaLabel="Kontakt öffnen" onClick={()=>setContactMenu(primaryContact)}/></div>:<EmptyState title="Keine Kontakte erfasst"/>}</>}
      extra={<DetailDisclosure label="Stammdaten">{Boolean(primaryContact?.phone)&&<p className="contact-address"><a href={contactHref('phone',String(primaryContact!.phone))}>{formatSwissPhone(primaryContact!.phone)}</a></p>}<SectionTitle title="Firmenadresse"/><p className="contact-address">{[customer.street,customer.building_number].filter(Boolean).join(" ")}<br/>{[customer.postal_code,city].filter(Boolean).join(" ")}</p><dl className="detail-list">{[['Kundennummer',customer.customer_no],['E-Mail',customer.email],['Telefon',formatSwissPhone(customer.phone)],['UID',formatSwissUid(customer.uid)]].filter(([,value])=>Boolean(value)).map(([label,value])=><div className="detail-list-stacked" key={String(label)}><dt>{String(label)}</dt><dd>{String(value)}</dd></div>)}</dl></DetailDisclosure>}
      records={workspace.data?.capabilities?.invoices===false?undefined:<><SectionTitle title="Offene Rechnungen" action={<Button variant="ghost" onClick={()=>setTab("documents")}><LocalizedText>{"Alle anzeigen"}</LocalizedText></Button>}/>{customerDocuments.some(item=>item.kind==='invoice'&&['open','partial','overdue'].includes(financialStatus(item as DocumentListItem)))?<div className="records">{customerDocuments.filter(item=>item.kind==='invoice'&&['open','partial','overdue'].includes(financialStatus(item as DocumentListItem))).slice(0,4).map((item,index)=><DocumentSummaryRow compact key={String(item.id??index)} item={item as DocumentListItem} returnTo={"/kunden/"+encodeURIComponent(customerId)}/>)}</div>:<EmptyState title="Keine offenen Rechnungen"/>}</>}/>}
    {tab==="details"&&workspace.data?.projects&&<section className="bo-workspace-section"><SectionTitle title="Aufträge" action={<Link href={'/projekte?customerId='+encodeURIComponent(customerId)}><LocalizedText>{"Alle anzeigen"}</LocalizedText></Link>}/>{workspace.data.projects.some(item=>!["completed","cancelled"].includes(item.status))?workspace.data.projects.filter(item=>!["completed","cancelled"].includes(item.status)).map(item=><ListRow key={item.id} href={'/projekte/'+encodeURIComponent(item.id)+'?returnTo='+encodeURIComponent('/kunden/'+customerId)} title={item.name} meta="Auftrag" status={projectStatusLabels[item.status]??item.status}/>):<EmptyState title="Keine Aufträge erfasst"/>}</section>}
    {tab==="details"&&workspace.data?.payments&&<section className="bo-workspace-section"><SectionTitle title="Zahlungen" action={<Link href={'/zahlungen?customerId='+encodeURIComponent(customerId)}><LocalizedText>{"Alle anzeigen"}</LocalizedText></Link>}/>{workspace.data.payments.length?workspace.data.payments.map(item=><ListRow key={item.id} href={'/zahlungen/'+encodeURIComponent(item.id)+'?returnTo='+encodeURIComponent('/kunden/'+customerId)} title={item.invoice_number} meta={swissDate(item.paid_on,localeTags[locale])} value={formatCurrency(item.amount,item.currency)} status={item.status==='booked'?'Verbucht':'Ausstehend'}/>):<EmptyState title="Keine Zahlungen erfasst"/>}</section>}
    {tab==="contacts"&&<section className="customer-tab-panel"><SectionTitle title="Kontakte" action={<><CreateAction label="Kontakt hinzufügen" onClick={()=>openContact()}/></>}/>{contacts.length?<div className="contact-list">{contacts.map(contact=>{const fullName=[contact.first_name,contact.last_name].filter(Boolean).join(" ");return <div key={String(contact.id)}><Avatar name={fullName} identity={String(contact.id)}/><button type="button" className="contact-main" onClick={()=>setContactMenu(contact)}><b>{fullName}</b>{[contact.job_title].filter(Boolean).map((value,index)=><small key={index}>{String(value)}</small>)}</button></div>})}</div>:<EmptyState title="Keine Kontakte erfasst"/>}</section>}

    {tab==="documents"&&<CustomerDocuments uploadRef={attachmentUpload} customerId={customerId} hasDocuments={workspace.data?.capabilities?.invoices!==false||workspace.data?.capabilities?.offers!==false} error={customerDocumentsError}/>}
    {tab==="activity"&&<section className="customer-tab-panel"><SectionTitle title="Verlauf"/><ListSearch value={activityQuery} onChange={setActivityQuery} placeholder="Aktivitäten suchen..."/>{visibleActivity.length?<div className="activity-groups">{activityDays(visibleActivity).map(({day,events})=><section className="activity-day" key={day}><h3>{day||"—"}</h3><div className="timeline">{events.map((item,index)=><div key={item.at+index}><i/><div><b>{item.href?<Link href={item.href}><LocalizedText>{item.title}</LocalizedText></Link>:<LocalizedText>{item.title}</LocalizedText>}</b><small>{Number.isFinite(Date.parse(item.at))?new Intl.DateTimeFormat(localeTags[locale],{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Zurich"}).format(new Date(item.at)):"—"} · {item.version?<>{item.documentNumber} · <LocalizedText>Version</LocalizedText> {item.version}</>:item.detail}</small></div></div>)}</div></section>)}</div>:<EmptyState title={customerActivity.length?"Keine Ergebnisse":"Keine Geschäftsaktivität vorhanden"}/>}</section>}</div></div>
    </div>
    <CustomerImportControl customerId={customerId} showTrigger={false} openRequested={contactImportOpen} onRequestedClose={()=>setContactImportOpen(false)}/>
    <ActionSheet label="Kundenaktionen" description={name} open={customerActions} onClose={()=>setCustomerActions(false)}><div className="action-list">{(tab==="documents"||tab==="files")&&access.write&&<ActionRow requiresWrite icon="upload" title="Datei hinzufügen" onClick={()=>{setCustomerActions(false);attachmentUpload.current?.chooseFile()}}/>}<ActionRow href={'/kunden/'+encodeURIComponent(customerId)+'/bearbeiten?returnTo='+encodeURIComponent('/kunden/'+encodeURIComponent(customerId)+'?'+searchParams.toString())} icon="edit" title="Kunde bearbeiten" onClick={()=>setCustomerActions(false)}/><ActionRow requiresWrite navigation icon="plus" title="Kontakt hinzufügen" onClick={()=>{setCustomerActions(false);openContact()}}/><ActionRow requiresWrite icon="upload" title="Kontakte importieren" onClick={()=>{setCustomerActions(false);setContactImportOpen(true)}}/><ActionRow href={'/angebote/neu?customerId='+encodeURIComponent(customerId)} icon="file" title="Angebot erstellen" onClick={()=>setCustomerActions(false)}/><ActionRow href={'/rechnungen/neu?customerId='+encodeURIComponent(customerId)} icon="receipt" title="Rechnung erstellen" onClick={()=>setCustomerActions(false)}/><ActionRow href={'/zeit?customerId='+encodeURIComponent(customerId)} icon="clock" title="Zeit erfassen" onClick={()=>setCustomerActions(false)}/><ActionRow href={'/projekte/neu?customerId='+encodeURIComponent(customerId)} icon="box" title="Auftrag starten" onClick={()=>setCustomerActions(false)}/></div></ActionSheet>
    {contactMenu&&<ActionSheet label="Kontaktaktionen" description={[contactMenu.first_name,contactMenu.last_name,contactMenu.job_title].filter(Boolean).join(" · ")} open={!!contactMenu} onClose={()=>setContactMenu(null)}>{contactMenu.is_primary===true&&<Status tone="success"><LocalizedText>{"Hauptkontakt"}</LocalizedText></Status>}<div className="action-list"><ActionRow requiresWrite navigation icon="edit" title="Kontakt bearbeiten" onClick={()=>{openContact(contactMenu);setContactMenu(null)}}/>{contactHref('email',String(contactMenu.email??''))&&<ActionRow icon="mail" title="E-Mail senden" href={contactHref('email',String(contactMenu.email))} onClick={()=>setContactMenu(null)}/>}{contactHref('phone',String(contactMenu.phone??''))&&<ActionRow icon="phone" title="Anrufen" href={contactHref('phone',String(contactMenu.phone))} onClick={()=>setContactMenu(null)}/>}{contactMenu.is_primary!==true&&<ActionRow requiresWrite icon="check" title="Als Hauptkontakt festlegen" disabled={contactSaving} onClick={()=>void makePrimary(contactMenu)}/>}<ActionRow requiresWrite danger icon="trash" title="Kontakt entfernen" disabled={contacts.length<=1} onClick={()=>{setRemoveContact(String(contactMenu.id));setContactMenu(null)}}/></div></ActionSheet>}
    <FormSheet label={contactId?"Kontakt bearbeiten":"Kontakt hinzufügen"} className="contact-sheet" open={contactOpen} onClose={()=>setContactOpen(false)} busy={contactSaving}><div className="form-grid two"><Field label="Vorname"><Input value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field><Field label="Nachname"><Input value={lastName} onChange={e=>setLastName(e.target.value)}/></Field><Field label="E-Mail"><Input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} type="email"/></Field><Field label="Telefon"><Input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} type="tel"/></Field><Field label="Funktion" className="full"><Input value={contactRole} onChange={e=>setContactRole(e.target.value)} placeholder="z. B. Buchhaltung"/></Field><Field label="Als Hauptkontakt festlegen" className="full"><Input type="checkbox" checked={contactPrimary} onChange={e=>setContactPrimary(e.target.checked)}/></Field></div><FormActions sheet><Button variant="secondary" onClick={()=>setContactOpen(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button requiresWrite disabled={contactSaving} onClick={()=>void saveContact()}><LocalizedText>{contactSaving?"Wird gespeichert…":"Speichern"}</LocalizedText></Button></FormActions></FormSheet>
    {removeContact&&<ConfirmDialog open danger busy={contactSaving} title="Kontakt entfernen?" message="Der Kontakt wird aus der Kundenliste entfernt. Bestehende Dokumente bleiben erhalten." confirmLabel={contactSaving?"Wird entfernt…":"Entfernen"} onCancel={()=>{if(!contactBusy.current)setRemoveContact(null)}} onConfirm={()=>void remove()}/>}
    {contactToast&&<Toast title={contactToast} tone={contactToast==="Kontakt gespeichert."||contactToast==="Kontakt entfernt."?"success":"danger"}/>}
  </AppShell>;
}

export {CustomerForm} from '../customer-form';

/** Customer context is retained across search, filtering and every create action. */
function CustomerDocuments({customerId,error,hasDocuments=true,uploadRef}:{customerId:string;hasDocuments?:boolean;error:string|null;uploadRef:Ref<EntityFilesHandle>}){
 const [createOpen,setCreateOpen]=useState(false);
 const columns=[{label:"Nummer",index:0},{label:"Datum",index:2},{label:"Betrag",index:3},{label:"Status",index:5}];
 const chips=["Alle","Angebote","Rechnungen"];
 const controller=useRecordsController({placeholder:"Dokumente suchen...",columns,chips});
 const params=new URLSearchParams({customer_id:'eq.'+customerId,limit:'50',offset:String(controller.page*50),order:controller.sort==='default'?'created_at.desc':({0:'number',2:'issue_date',3:'total',5:'display_status'} as Record<number,string>)[controller.sortIndex]+'.'+controller.sort});
 if(controller.query.trim())params.set('q',controller.query.trim());
 if(controller.activeChip==='Angebote')params.set('kind','offer');if(controller.activeChip==='Rechnungen')params.set('kind','invoice');
 const query=useApiQuery<{items:DocumentListItem[];total?:number}>(hasDocuments?'/api/documents?'+params:null);
 const items=query.data?.items??[];
 const customerQuery="?customerId="+encodeURIComponent(customerId);
 return <section className="customer-tab-panel"><SectionTitle title="Dokumente"/><RecordsControls controller={controller} columns={columns} chips={chips} placeholder="Dokumente suchen..."><CreateAction label="Dokument erstellen" onClick={()=>setCreateOpen(true)}/></RecordsControls>{hasDocuments&&<DocumentList items={items} loading={query.loading} error={error??query.error} context="customer" returnTo={"/kunden/"+encodeURIComponent(customerId)+"?tab=documents"} controller={controller} toolbarActions={false} remote pagination={{total:query.data?.total??items.length,page:controller.page,pageSize:50,onPage:controller.setPage}}/>}<EntityFiles purpose="customer_document" entityId={customerId} uploadRef={uploadRef}/><ActionSheet label="Dokument erstellen" open={createOpen} onClose={()=>setCreateOpen(false)}><div className="action-list"><ActionRow href={"/angebote/neu"+customerQuery} icon="file" title="Angebot erstellen"/><ActionRow href={"/rechnungen/neu"+customerQuery} icon="receipt" title="Rechnung erstellen"/></div></ActionSheet></section>;
}
