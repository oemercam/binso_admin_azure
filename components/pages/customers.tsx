"use client";
import Link from "next/link";
import {activityDays} from "@/lib/display-format";
import {contactHref} from "@/lib/contact-links";
import {usePageAccess} from "@/lib/client/page-access";
import {LocalizedText} from "@/lib/client/locale";
import {safeAppPath} from "@/lib/navigation";
import {Statistics} from "../statistics";
import {formatCurrency,financialStatus,businessDate} from "@/lib/financial-status";
import {EntityFiles} from "../entity-files";
import {useApiQuery} from "@/lib/client/use-api-query";
import {useDirtySnapshot} from "../use-dirty-snapshot";
import {Avatar} from "../avatar";
import {FormWizard} from "../form-wizard";
import {useProcessDraft} from "../use-process-draft";
import {allowDraftNavigation} from "../use-browser-back-guard";

import { DocumentList, DocumentSummaryRow, type DocumentListItem } from "../document-list";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useId } from "react";
import ConfirmDialog from "../confirm-dialog";
import { AppShell } from "../app-shell";
import { RecordRow, RecordIdentity, RecordsView, RecordsControls, useRecordsController } from "../records";
import { customers } from "@/lib/demo-data";
import { appendDemoRow } from "@/lib/demo-storage";
import { apiPatch, apiPost, apiDelete, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {Button, EmptyState, Field, SectionTitle, Status, Toast, Input, Select, LoadingState, ErrorState, FormActions} from "../ui";
import { ActionRow, ActionSheet, FormSheet, CreateAction, DetailTabs, DetailSections, DetailDisclosure, MetricTiles, MetricTile, ListSearch } from "../binso-ux";
import { useDemoRows, swissDate } from "./shared";
import { FinancialSummary } from "./finance";

export function formatSwissPhone(value:unknown){const raw=String(value??"").trim();const digits=raw.replace(/\D/g,"");if(digits.startsWith("41")&&digits.length===11)return `+41 ${digits.slice(2,4)} ${digits.slice(4,7)} ${digits.slice(7,9)} ${digits.slice(9,11)}`;if(digits.startsWith("0")&&digits.length===10)return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,8)} ${digits.slice(8,10)}`;return raw;}

export function formatSwissUid(value:unknown){const raw=String(value??"").trim().toUpperCase();const digits=raw.replace(/\D/g,"");if(digits.length===9)return `CHE-${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}`;return raw;}

const customerChips=["Alle","Aktiv","Mit offenen Beträgen","Inaktiv"];
const customerVisibleChips=customerChips.slice(0,3);
const customerColumns=[{label:"Kunde",index:0,render:(row:string[])=><RecordIdentity name={row[0]} meta={[row[1],row[2]].filter(value=>value&&value!=="—").join(" · ")} identity={row[3]||row[0]}/>},{label:"Status",index:4,status:true},{label:"Umsatz "+businessDate().slice(0,4),index:6,align:"right" as const},{label:"Offen",index:7,align:"right" as const}];
const customerSortColumns=[{label:"Name",index:0},{label:"Ort",index:2},{label:"Status",index:4}];
export function CustomersPage() {
  const production=useBackendMode();
  const financialsAllowed=usePageAccess().canOpen("/rechnungen");
  const chips=financialsAllowed?customerChips:customerChips.filter(chip=>chip!=="Mit offenen Beträgen");
  const visibleChips=financialsAllowed?customerVisibleChips:customerVisibleChips.filter(chip=>chip!=="Mit offenen Beträgen");
  const columns=financialsAllowed?customerColumns:customerColumns.filter(column=>column.index<6);
  // Whole-tenant counts remain independent of list search, status and pagination.
  const allCustomers=useApiQuery<{total:number}>(production?"/api/customers?limit=1":null);
  const activeCustomers=useApiQuery<{total:number}>(production?"/api/customers?limit=1&status=active":null);
  const balances=useApiQuery<FinancialSummary>(production&&financialsAllowed?"/api/finance/overview":null);
  const controller=useRecordsController({placeholder:"Kunden suchen...",columns:customerSortColumns,chips});
  const query=new URLSearchParams({...(financialsAllowed?{include:"financials"}:{}),limit:"50",offset:String(controller.page*50),order:({0:"name",2:"city",4:"status"} as Record<number,string>)[controller.sortIndex]?(controller.sort==='default'?'name.asc':({0:"name",2:"city",4:"status"} as Record<number,string>)[controller.sortIndex]+'.'+controller.sort):'name.asc'});
  if(controller.query.trim())query.set('q',controller.query.trim());
  if(controller.activeChip==='Mit offenen Beträgen')query.set('outstanding','1');
  if(controller.activeChip==='Aktiv'||controller.activeChip==='Inaktiv')query.set('status',controller.activeChip==='Aktiv'?'active':'inactive');
  const {rows:customerRows,total,loading,error}=useDemoRows("customers",customers,query.toString());
  return <AppShell headingPlacement="content" title="Kunden" subtitle="Kontakte, Geschäftsvorgänge und offene Forderungen." active="kunden" actions={<CreateAction href="/kunden/neu" label="Neuer Kunde"/>}>
    {production&&<MetricTiles desktopOnly columns={balances.data?.invoices.length?3:2}><MetricTile label="Kunden gesamt" value={allCustomers.data?.total??"—"}/><MetricTile label="Aktive Kunden" value={activeCustomers.data?.total??"—"}/>{!!balances.data?.invoices.length&&<MetricTile label="Offene Forderungen" value={balances.data.invoices.map(row=>formatCurrency(row.open_amount,row.currency)).join(" · ")}/>}</MetricTiles>}
    <RecordsControls appearance="line" chips={visibleChips} filterChips={chips} controller={controller} placeholder="Kunden suchen..." columns={customerSortColumns}/><RecordsView chips={chips} controller={controller} toolbarActions={false} showCount={false} remote pagination={{total,page:controller.page,pageSize:50,onPage:controller.setPage}} loading={loading} error={error} items={customerRows} countLabel="Kunden" placeholder="Kunden suchen..." columns={columns} rowHref={row=>`/kunden/${row[4]?row[3]:"acme"}`}>{(row)=>{const [name,contact,city,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"acme";return <RecordRow href={"/kunden/"+id} title={name} meta={[contact,city].filter(value=>value&&value!=="—").join(" · ")} />}}</RecordsView>
  </AppShell>;
}

export function CustomerDetail({customerId="acme"}:{customerId?:string}) {
  const production=useBackendMode();
  const access=usePageAccess();
  const workspace=useApiQuery<{item:Record<string,unknown>;contacts:Array<Record<string,unknown>>;documents:Array<Record<string,unknown>>;summary:FinancialSummary;activity:Array<{at:string;title:string;detail:string}>;statistics:Array<{currency:string;date:string;paid:unknown;billed:unknown;invoice_count:unknown}>|null}>(production?"/api/customers/"+encodeURIComponent(customerId)+"?include=workspace":null);
  const searchParams=useSearchParams();
  const requestedReturnTo=searchParams.get("returnTo");
  const returnTo=safeAppPath(requestedReturnTo,"/kunden");
  const router=useRouter();
  const panelId=useId();
  const requestedTab=searchParams.get('tab');
  const tab=['overview','contacts','finances','activity'].includes(requestedTab??'')?requestedTab:'overview';
  const setTab=(next:string)=>{const params=new URLSearchParams(searchParams.toString());params.set('tab',next);router.replace('/kunden/'+encodeURIComponent(customerId)+'?'+params.toString(),{scroll:false})};
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
  const [customerActions,setCustomerActions]=useState(false);
  const [contactMenu,setContactMenu]=useState<Record<string,unknown>|null>(null);
  const customerDocumentsError=workspace.error;
  const customerDocuments=workspace.data?.documents??[];
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [contactEmail,setContactEmail]=useState("");
  const [contactPhone,setContactPhone]=useState("");
  const [contactRole,setContactRole]=useState("");

  useEffect(()=>{if(workspace.data)queueMicrotask(()=>setContacts(workspace.data!.contacts));},[workspace.data]);

  const openContact=(contact?:Record<string,unknown>)=>{
    setContactId(contact?String(contact.id):null);
    setFirstName(String(contact?.first_name??""));setLastName(String(contact?.last_name??""));
    setContactEmail(String(contact?.email??""));setContactPhone(String(contact?.phone??""));setContactRole(String(contact?.job_title??""));
    setContactPrimary(contact?.is_primary===true||!contact&&contacts.length===0);setContactOpen(true);
  };
  const remove=async()=>{if(!removeContact||contactBusy.current)return;contactBusy.current=true;setContactSaving(true);try{
    await apiDelete("/api/customers/"+encodeURIComponent(customerId)+"/contacts/"+encodeURIComponent(removeContact));
    setContacts(current=>current.filter(c=>c.id!==removeContact));setRemoveContact(null);setContactToast("Kontakt entfernt.");
  }catch(e){setContactToast(e instanceof Error?e.message:"Kontakt konnte nicht entfernt werden.")}finally{contactBusy.current=false;setContactSaving(false)}};
  const saveContact=async()=>{
    if(!production){setContactToast("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");return;}
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
  return <AppShell headingPlacement="content" recordLabel={String(customer.customer_no??"")} titleIsUserContent title={name} status={status==="inactive"?"Inaktiv":"Aktiv"} statusTone={status==="inactive"?"neutral":"success"} subtitle={[sector,city].filter(Boolean).join(" · ")} active="kunden" backHref={returnTo} backLabel="Kunden" mobileActions={<Button variant="ghost" icon="more" ariaLabel="Kundenaktionen" onClick={()=>setCustomerActions(true)}/>} actions={<Button variant="ghost" icon="more" ariaLabel="Kundenaktionen" onClick={()=>setCustomerActions(true)}/>} >
    <div className="customer-detail-workspace">

      <div className="desktop-detail-main"><DetailTabs appearance="line" label="Kundenbereiche" panelId={panelId}><button className={tab==="overview"?"active":""} onClick={()=>setTab("overview")}><LocalizedText>{"Übersicht"}</LocalizedText></button><button className={tab==="contacts"?"active":""} onClick={()=>setTab("contacts")}><LocalizedText>{"Kontakte"}</LocalizedText></button><button className={tab==="finances"?"active":""} onClick={()=>setTab("finances")}><LocalizedText>{"Dokumente"}</LocalizedText></button><button className={tab==="activity"?"active":""} onClick={()=>setTab("activity")}><LocalizedText>{"Aktivitäten"}</LocalizedText></button></DetailTabs>
    <div id={panelId} role="tabpanel" aria-labelledby={panelId+'-tab-'+['overview','contacts','finances','activity'].indexOf(tab??'overview')}>
    {tab==="overview"&&<DetailSections summary={<><SectionTitle title="Finanzübersicht" desktopOnly/>{availableCurrencies.length>1&&<Field label="Statistikwährung" allowReadOnlyInput><Select value={displayCurrency} onChange={event=>setStatisticCurrency(event.target.value)}>{availableCurrencies.map(currency=><option key={currency} value={currency}>{currency}</option>)}</Select></Field>}{customerSummary?.invoices.filter(row=>row.currency===displayCurrency).map(row=><MetricTiles columns={2} key={row.currency}><MetricTile label={<><LocalizedText>{"Umsatz"}</LocalizedText> {businessDate().slice(0,4)}</>} value={row.revenue} currency={row.currency} compactMoney/><MetricTile label="Offen" value={row.open_amount} currency={row.currency} compactMoney/></MetricTiles>)}{!customerSummary?.invoices.length&&<p><LocalizedText>{"Keine Rechnungen erfasst"}</LocalizedText></p>}</>}
      facts={<><SectionTitle title="Kontaktperson"/>{primaryContact?<div className="contact-facts"><p>{[primaryContact.first_name,primaryContact.last_name].filter(Boolean).join(" ")}</p>{Boolean(primaryContact.email)&&<p><a href={contactHref('email',String(primaryContact.email))}>{String(primaryContact.email)}</a></p>}</div>:<p><LocalizedText>{"Keine Kontakte erfasst"}</LocalizedText></p>}</>}
      extra={<DetailDisclosure label="Weitere Kundendaten">{Boolean(primaryContact?.phone)&&<p className="contact-address"><a href={contactHref('phone',String(primaryContact!.phone))}>{formatSwissPhone(primaryContact!.phone)}</a></p>}<SectionTitle title="Firmenadresse"/><p className="contact-address">{[customer.street,customer.building_number].filter(Boolean).join(" ")}<br/>{[customer.postal_code,city].filter(Boolean).join(" ")}</p><dl className="detail-list">{[['Kundennummer',customer.customer_no],['E-Mail',customer.email],['Telefon',formatSwissPhone(customer.phone)],['UID',formatSwissUid(customer.uid)]].filter(([,value])=>Boolean(value)).map(([label,value])=><div className="detail-list-stacked" key={String(label)}><dt>{String(label)}</dt><dd>{String(value)}</dd></div>)}</dl></DetailDisclosure>}
      records={<><SectionTitle title="Offene Rechnungen" action={<Button variant="ghost" onClick={()=>setTab("finances")}><LocalizedText>{"Alle anzeigen"}</LocalizedText></Button>}/>{customerDocuments.some(item=>item.kind==='invoice'&&['open','partial','overdue'].includes(financialStatus(item as DocumentListItem)))?<div className="records">{customerDocuments.filter(item=>item.kind==='invoice'&&['open','partial','overdue'].includes(financialStatus(item as DocumentListItem))).slice(0,4).map((item,index)=><DocumentSummaryRow compact key={String(item.id??index)} item={item as DocumentListItem}/>)}</div>:<p><LocalizedText>{"Keine offenen Rechnungen"}</LocalizedText></p>}</>}/>}
    {tab==="contacts"&&<section className="customer-tab-panel"><SectionTitle title="Kontakte" action={<CreateAction label="Kontakt hinzufügen" onClick={()=>openContact()}/>}/>{contacts.length?<div className="contact-list">{contacts.map(contact=>{const fullName=[contact.first_name,contact.last_name].filter(Boolean).join(" ");return <div key={String(contact.id)}><Avatar name={fullName} identity={String(contact.id)}/><button type="button" className="contact-main" onClick={()=>setContactMenu(contact)}><b>{fullName}</b>{[contact.job_title].filter(Boolean).map((value,index)=><small key={index}>{String(value)}</small>)}</button><div className="contact-actions"><Button variant="ghost" icon="more" ariaLabel={fullName+" Aktionen"} onClick={()=>setContactMenu(contact)}/></div></div>})}</div>:<p><LocalizedText>{"Keine Kontakte erfasst"}</LocalizedText></p>}</section>}
    {tab==="overview"&&workspace.data?.statistics&&<details className="financial-snapshot"><summary><LocalizedText>{"Kundenentwicklung"}</LocalizedText></summary>{new Set(workspace.data.statistics.map(row=>row.currency)).size>1&&<Field allowReadOnlyInput label="Statistikwährung"><Select value={displayCurrency} onChange={event=>setStatisticCurrency(event.target.value)}>{availableCurrencies.map(currency=><option value={currency} key={currency}>{currency}</option>)}</Select></Field>}<Statistics defaultTrendVisible={false} title="Kundenentwicklung" subtitle="Zahlungen und fakturiertes Volumen · ohne Entwürfe und Stornos" currency={displayCurrency} storageKey={'customer:'+customerId} events={workspace.data.statistics.filter(row=>row.currency===displayCurrency).map(row=>({date:row.date,values:{paid:row.paid,billed:row.billed,invoice_count:row.invoice_count}}))} series={[{key:'paid',label:'Erhaltene Zahlungen',tone:'positive'},{key:'billed',label:'Fakturiert',tone:'neutral'}]} metricKeys={['invoice_count']} metrics={totals=>[{label:'Erhaltene Zahlungen',value:totals.paid},{label:'Fakturiertes Volumen',value:totals.billed},{label:'Rechnungen',value:totals.invoice_count,format:'number'}]}/></details>}

    {tab==="finances"&&<CustomerDocuments customerId={customerId} items={customerDocuments as DocumentListItem[]} error={customerDocumentsError}/>}
    {tab==="activity"&&<section className="customer-tab-panel"><SectionTitle title="Aktivitäten"/><ListSearch value={activityQuery} onChange={setActivityQuery} placeholder="Aktivitäten suchen..."/>{visibleActivity.length?<div className="activity-groups">{activityDays(visibleActivity).map(({day,events})=><section className="activity-day" key={day}><h3>{day||"—"}</h3><div className="timeline">{events.map((item,index)=><div key={item.at+index}><i/><div><b><LocalizedText>{item.title}</LocalizedText></b><small>{Number.isFinite(Date.parse(item.at))?new Intl.DateTimeFormat("de-CH",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Zurich"}).format(new Date(item.at)):"—"} · {item.detail}</small></div></div>)}</div></section>)}</div>:<p><LocalizedText>{"Keine Geschäftsaktivität vorhanden"}</LocalizedText></p>}</section>}</div></div>
    </div>
    <ActionSheet label="Kundenaktionen" description={name} open={customerActions} onClose={()=>setCustomerActions(false)}><div className="action-list"><ActionRow href={'/kunden/'+encodeURIComponent(customerId)+'/bearbeiten'} icon="edit" title="Kunde bearbeiten" onClick={()=>setCustomerActions(false)}/><ActionRow requiresWrite navigation icon="plus" title="Kontakt hinzufügen" onClick={()=>{setCustomerActions(false);openContact()}}/><ActionRow href={'/angebote/neu?customerId='+encodeURIComponent(customerId)} icon="file" title="Angebot erstellen" onClick={()=>setCustomerActions(false)}/><ActionRow href={'/rechnungen/neu?customerId='+encodeURIComponent(customerId)} icon="receipt" title="Rechnung erstellen" onClick={()=>setCustomerActions(false)}/><ActionRow href={'/zeit?customerId='+encodeURIComponent(customerId)} icon="clock" title="Zeit erfassen" onClick={()=>setCustomerActions(false)}/><ActionRow href={'/projekte/neu?customerId='+encodeURIComponent(customerId)} icon="box" title="Auftrag starten" onClick={()=>setCustomerActions(false)}/></div></ActionSheet>
    {contactMenu&&<ActionSheet label="Kontaktaktionen" description={[contactMenu.first_name,contactMenu.last_name,contactMenu.job_title].filter(Boolean).join(" · ")} open={!!contactMenu} onClose={()=>setContactMenu(null)}>{contactMenu.is_primary===true&&<Status tone="success"><LocalizedText>{"Hauptkontakt"}</LocalizedText></Status>}<div className="action-list"><ActionRow requiresWrite navigation icon="edit" title="Kontakt bearbeiten" onClick={()=>{openContact(contactMenu);setContactMenu(null)}}/>{contactHref('email',String(contactMenu.email??''))&&<ActionRow icon="mail" title="E-Mail senden" href={contactHref('email',String(contactMenu.email))} onClick={()=>setContactMenu(null)}/>}{contactHref('phone',String(contactMenu.phone??''))&&<ActionRow icon="phone" title="Anrufen" href={contactHref('phone',String(contactMenu.phone))} onClick={()=>setContactMenu(null)}/>}<ActionRow requiresWrite danger icon="trash" title="Kontakt entfernen" disabled={contacts.length<=1} onClick={()=>{setRemoveContact(String(contactMenu.id));setContactMenu(null)}}/></div></ActionSheet>}
    <FormSheet label={contactId?"Kontakt bearbeiten":"Kontakt hinzufügen"} description={"Kontakt wird direkt "+name+" zugeordnet."} className="contact-sheet" open={contactOpen} onClose={()=>setContactOpen(false)} busy={contactSaving}><div className="form-grid two"><Field label="Vorname"><Input value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field><Field label="Nachname"><Input value={lastName} onChange={e=>setLastName(e.target.value)}/></Field><Field label="E-Mail"><Input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} type="email"/></Field><Field label="Telefon"><Input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} type="tel"/></Field><Field label="Funktion" className="full"><Input value={contactRole} onChange={e=>setContactRole(e.target.value)} placeholder="z. B. Buchhaltung"/></Field><Field label="Als Hauptkontakt festlegen" className="full"><Input type="checkbox" checked={contactPrimary} onChange={e=>setContactPrimary(e.target.checked)}/></Field></div><FormActions sheet><Button variant="secondary" onClick={()=>setContactOpen(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button requiresWrite disabled={contactSaving} onClick={()=>void saveContact()}><LocalizedText>{contactSaving?"Wird gespeichert…":"Speichern"}</LocalizedText></Button></FormActions></FormSheet>
    {removeContact&&<ConfirmDialog open danger busy={contactSaving} title="Kontakt entfernen?" message="Der Kontakt wird aus der Kundenliste entfernt. Bestehende Dokumente bleiben erhalten." confirmLabel={contactSaving?"Wird entfernt…":"Entfernen"} onCancel={()=>{if(!contactBusy.current)setRemoveContact(null)}} onConfirm={()=>void remove()}/>}
    {contactToast&&<Toast title={contactToast} tone={contactToast==="Kontakt gespeichert."||contactToast==="Kontakt entfernt."?"success":"danger"}/>}
  </AppShell>;
}

export function CustomerForm({customerId}:{customerId?:string}={}) {
  const router=useRouter();
  const searchParams=useSearchParams();
  const returnTo=safeAppPath(searchParams.get("returnTo"),"/kunden");
  const [company,setCompany]=useState("");
  const [contactName,setContactName]=useState("");
  const [contactLastName,setContactLastName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [city,setCity]=useState("");
  const [sector,setSector]=useState("Dienstleistung");
  const [address,setAddress]=useState("");
  const [postalCode,setPostalCode]=useState("");
  const [uid,setUid]=useState("");
  const [notes,setNotes]=useState("");
  const [customerStatus,setCustomerStatus]=useState("active");
  const [toast,setToast]=useState<string|null>(null);
  const [buildingNumber,setBuildingNumber]=useState("");
  const [paymentDays,setPaymentDays]=useState<string|null>(null);
  const recordQuery=useApiQuery<{item:Record<string,unknown>}>(customerId?"/api/customers/"+encodeURIComponent(customerId):null);
  const hydratedCustomer=useRef<string|null>(null);
  const [hydratedRecordId,setHydratedRecordId]=useState<string|null>(null);
  // The query can resolve one render before its values reach the controlled
  // fields. Keep the editor loading until that hydration commits atomically.
  const loadingRecord=recordQuery.loading||Boolean(customerId&&hydratedRecordId!==customerId&&!recordQuery.error);
  const recordError=recordQuery.error;
  const [savingRecord,setSavingRecord]=useState(false);
  const saveRecordPending=useRef(false);
  const {dirty,markPristine}=useDirtySnapshot([company,email,phone,city,sector,address,postalCode,uid,notes,customerStatus,buildingNumber,paymentDays,...(!customerId?[contactName,contactLastName]:[])]);
  const [savedRecord,setSavedRecord]=useState(false);
  const [sheetOpen,setSheetOpen]=useState(false);
  useEffect(()=>{queueMicrotask(()=>setSheetOpen(true))},[]);
  const [replay,setReplay]=useState<{body:string;key:string}|null>(null);
  const [allowDuplicate,setAllowDuplicate]=useState(false);
  const [duplicateQuery,setDuplicateQuery]=useState('');
  useEffect(()=>{const timer=window.setTimeout(()=>setDuplicateQuery(new URLSearchParams({name:company.trim(),email:email.trim(),uid:uid.trim(),excludeId:customerId??''}).toString()),250);return()=>window.clearTimeout(timer)},[company,email,uid,customerId]);
  const duplicateCheck=useApiQuery<{items:Array<{id:string;customer_no:string;name:string;email?:string}>}>(isProductionBackendEnabled()&&!customerId&&company.trim().length>=2&&duplicateQuery?'/api/customers/duplicates?'+duplicateQuery:null);
  const duplicateItems=duplicateCheck.data?.items??[];
  const recovery=useProcessDraft({process:customerId?"customer:edit:"+customerId:"customer:create",value:{company,contactName,contactLastName,email,phone,city,sector,address,postalCode,uid,notes,customerStatus,buildingNumber,paymentDays,replay,allowDuplicate},dirty,enabled:!loadingRecord&&!recordError,onRestore:value=>{
    if(!value||[value.company,value.email,value.phone,value.city,value.sector,value.address,value.postalCode,value.uid,value.notes].some(item=>typeof item!=="string"||item.length>320)||!["active","inactive"].includes(value.customerStatus))return;
    setPaymentDays(typeof value.paymentDays==="string"?value.paymentDays:null);setContactLastName(typeof value.contactLastName==="string"&&value.contactLastName.length<=120?value.contactLastName:"");setContactName(typeof value.contactName==="string"&&value.contactName.length<=320?value.contactName:"");setAllowDuplicate(value.allowDuplicate===true);    setBuildingNumber(typeof value.buildingNumber==="string"?value.buildingNumber:"");setCompany(value.company);setEmail(value.email);setPhone(value.phone);setCity(value.city);setSector(value.sector);setAddress(value.address);setPostalCode(value.postalCode);setUid(value.uid);setNotes(value.notes);setCustomerStatus(value.customerStatus);
    if(value.replay&&typeof value.replay.body==="string"&&value.replay.body.length<8192&&typeof value.replay.key==="string"&&value.replay.key.length>=8&&value.replay.key.length<=128)setReplay(value.replay);
  }});
  const close=()=>{recovery.clear();allowDraftNavigation();setSheetOpen(false);router.push(returnTo)};
  useEffect(()=>{if(!customerId||!recordQuery.data||hydratedCustomer.current===customerId)return;hydratedCustomer.current=customerId;const {item}=recordQuery.data;queueMicrotask(()=>{setCompany(String(item.name??''));setEmail(String(item.email??''));setPhone(String(item.phone??''));setCity(String(item.city??''));setSector(String(item.sector??''));setAddress(String(item.street??''));setBuildingNumber(String(item.building_number??''));setPostalCode(String(item.postal_code??''));setUid(String(item.uid??''));setNotes(String(item.notes??''));setCustomerStatus(String(item.status??'active'));setPaymentDays(item.paymentDays!=null?String(item.paymentDays):null);setHydratedRecordId(customerId);markPristine([String(item.name??''),String(item.email??''),String(item.phone??''),String(item.city??''),String(item.sector??''),String(item.street??''),String(item.postal_code??''),String(item.uid??''),String(item.notes??''),String(item.status??'active'),String(item.building_number??''),item.paymentDays!=null?String(item.paymentDays):null]);});},[customerId,recordQuery.data,markPristine]);
  const save=async()=>{
    if(saveRecordPending.current||!recovery.ready||loadingRecord||recordError)return;
    if(!customerId&&(!contactName.trim()||!contactLastName.trim())){setToast("Bitte Vorname und Nachname der Kontaktperson eingeben.");return;}
    if(company.trim().length<2){
      setToast("Bitte einen Kundennamen mit mindestens zwei Zeichen eingeben.");
      return;
    }
    setToast(null);saveRecordPending.current=true;setSavingRecord(true);
    try{
      let savedCustomerId=customerId;
      if(isProductionBackendEnabled()){
        const body={name:company.trim(),sector,email,phone,city,address:[address,buildingNumber].filter(Boolean).join(" "),street:address,buildingNumber,postalCode,uid,notes,status:customerId?customerStatus:"active",...(paymentDays!==null&&paymentDays!==""?{paymentDays:Number(paymentDays)}:{}),...(!customerId?{allowDuplicate,contactFirstName:contactName.trim(),contactLastName:contactLastName.trim()}:{})},serialized=JSON.stringify(body);
        const attempt=replay?.body===serialized?replay:{body:serialized,key:crypto.randomUUID()};setReplay(attempt);recovery.persist({company,contactName,contactLastName,email,phone,city,sector,address,postalCode,uid,notes,customerStatus,buildingNumber,paymentDays,replay:attempt,allowDuplicate});
        const result=customerId?await apiPatch<{item?:{id:string}}>("/api/customers/"+encodeURIComponent(customerId),body):await apiPost<{item?:{id:string}}>("/api/customers",body,{idempotencyKey:attempt.key});
        if(typeof result.item?.id!=="string"||!result.item.id)throw new Error("Die Speicherung konnte nicht bestätigt werden. Bitte den gespeicherten Stand prüfen.");
        savedCustomerId=result.item.id;
      }
      else appendDemoRow("customers",[company.trim(),sector,city.trim(),"Aktiv"]);
      setToast("Kunde gespeichert.");
      setSavedRecord(true);
      recovery.clear();allowDraftNavigation();
      const destination="/kunden/"+encodeURIComponent(savedCustomerId!);
      if(customerId)window.setTimeout(()=>router.push(destination),700);
      else router.push(destination);
    }catch(error){
      saveRecordPending.current=false;setSavingRecord(false);
      setToast(error instanceof Error?error.message:"Kunde konnte nicht gespeichert werden.");
    }
  };
  return <AppShell editing unsavedChanges={false} title={customerId?"Kunde bearbeiten":"Kunde erstellen"} active="kunden" backHref={returnTo} backLabel="Kunden">
    <FormSheet workspace open={sheetOpen} onClose={close} label={customerId?"Kunde bearbeiten":"Kunde erstellen"} description="Beginne mit dem Namen. Weitere Angaben kannst du später ergänzen." busy={savingRecord} dirty={dirty&&!savedRecord} wizard>
      {loadingRecord?<LoadingState><LocalizedText>{"Kunde wird geladen …"}</LocalizedText></LoadingState>:recordError?<ErrorState onRetry={recordQuery.refresh} retryLabel="Erneut versuchen"><LocalizedText>{recordError}</LocalizedText></ErrorState>:<form onSubmit={event=>{event.preventDefault();return save()}}>
        <FormWizard labels={["Grunddaten"]} step={0} onStep={()=>{}} busy={savingRecord} ariaLabel="Kunde erfassen" cancelAction={<Button variant="secondary" onClick={close}><LocalizedText>{"Abbrechen"}</LocalizedText></Button>} action={<Button requiresWrite type="submit" disabled={savingRecord||!recovery.ready||(company.trim().length<2||!customerId&&(!contactName.trim()||!contactLastName.trim()))}><LocalizedText>{savingRecord?"Wird gespeichert…":customerId?"Änderungen speichern":"Kunde speichern"}</LocalizedText></Button>}>
          {toast&&toast!=="Kunde gespeichert."&&<ErrorState>{toast}</ErrorState>}
          <Field label="Kundenname *"><Input required minLength={2} maxLength={320} autoComplete="organization" value={company} disabled={savingRecord} onChange={e=>{setCompany(e.target.value);setAllowDuplicate(false)}} placeholder="Firma oder Name"/></Field>
          {!customerId&&<div className="form-grid two"><Field label="Kontaktperson · Vorname *"><Input required maxLength={120} autoComplete="given-name" value={contactName} disabled={savingRecord} onChange={e=>setContactName(e.target.value)}/></Field><Field label="Kontaktperson · Nachname *"><Input required maxLength={120} autoComplete="family-name" value={contactLastName} disabled={savingRecord} onChange={e=>setContactLastName(e.target.value)}/></Field></div>}
          <p><LocalizedText>{"* Pflichtfeld"}</LocalizedText></p>
          {!customerId&&duplicateCheck.error&&<ErrorState onRetry={duplicateCheck.refresh}><LocalizedText>{duplicateCheck.error}</LocalizedText></ErrorState>}
          {!customerId&&duplicateItems.length>0&&<section><h2><LocalizedText>{"Mögliche Dubletten"}</LocalizedText></h2>{duplicateItems.map(item=><p key={item.id}><Link href={'/kunden/'+encodeURIComponent(item.id)}>{item.customer_no} · {item.name}</Link></p>)}<Field label="Als separaten Kunden erfassen"><Input type="checkbox" checked={allowDuplicate} onChange={event=>setAllowDuplicate(event.target.checked)}/></Field></section>}

          <details className="optional-details"><summary><LocalizedText>{"Weitere Angaben"}</LocalizedText></summary><div className="form-grid two"><Field label="Zahlungsfrist" hint="Leer bei Neuanlage: Firmenstandard"><Input required={!!customerId} type="number" min={0} max={180} step={1} value={paymentDays??""} onChange={event=>setPaymentDays(event.target.value)} /></Field>
            <Field label="E-Mail"><Input type="email" autoComplete="email" maxLength={320} value={email} disabled={savingRecord} onChange={e=>{setEmail(e.target.value);setAllowDuplicate(false)}} placeholder="name@firma.ch"/></Field>
            <Field label="Telefon"><Input type="tel" inputMode="tel" autoComplete="tel" maxLength={320} value={phone} disabled={savingRecord} onChange={e=>setPhone(e.target.value)} placeholder="+41 00 000 00 00"/></Field>
            <Field label="Strasse"><Input autoComplete="address-line1" maxLength={320} value={address} disabled={savingRecord} onChange={e=>setAddress(e.target.value)} placeholder="Strasse"/></Field><Field label="Hausnummer"><Input maxLength={40} value={buildingNumber} disabled={savingRecord} onChange={e=>setBuildingNumber(e.target.value)}/></Field>
            <Field label="PLZ"><Input autoComplete="postal-code" maxLength={320} value={postalCode} disabled={savingRecord} onChange={e=>setPostalCode(e.target.value)} placeholder="8000"/></Field>
            <Field label="Ort"><Input autoComplete="address-level2" maxLength={320} value={city} disabled={savingRecord} onChange={e=>setCity(e.target.value)} placeholder="Zürich"/></Field>
            {customerId&&<Field label="Status"><Select disabled={savingRecord} value={customerStatus} onChange={e=>setCustomerStatus(e.target.value)}><option value="active"><LocalizedText>{"Aktiv"}</LocalizedText></option><option value="inactive"><LocalizedText>{"Inaktiv"}</LocalizedText></option></Select></Field>}
            <Field label="Branche"><Select disabled={savingRecord} value={sector} onChange={e=>setSector(e.target.value)}><option value={"Dienstleistung"}><LocalizedText>{"Dienstleistung"}</LocalizedText></option><option value={"Bauunternehmen"}><LocalizedText>{"Bauunternehmen"}</LocalizedText></option><option value={"Immobilien"}><LocalizedText>{"Immobilien"}</LocalizedText></option><option value={"Beratung"}><LocalizedText>{"Beratung"}</LocalizedText></option><option value={"Handel"}><LocalizedText>{"Handel"}</LocalizedText></option><option value={"Elektro"}><LocalizedText>{"Elektro"}</LocalizedText></option></Select></Field>
            <Field label="UID"><Input maxLength={320} value={uid} disabled={savingRecord} onChange={e=>{setUid(e.target.value);setAllowDuplicate(false)}} placeholder="CHE-000.000.000"/></Field>
            <Field label="Interne Notiz"><Input maxLength={320} value={notes} disabled={savingRecord} onChange={e=>setNotes(e.target.value)} placeholder="Optional"/></Field>
          </div></details>
        </FormWizard>
      </form>}
    </FormSheet>
    {toast==="Kunde gespeichert."&&<Toast title={toast} tone="success"/>}
  </AppShell>;
}

/** Customer context is retained across search, filtering and every create action. */
function CustomerDocuments({customerId,items,error}:{customerId:string;items:DocumentListItem[];error:string|null}){
 const [createOpen,setCreateOpen]=useState(false);
 const columns=[{label:"Nummer",index:0},{label:"Datum",index:2},{label:"Betrag",index:3},{label:"Status",index:5}];
 const chips=["Alle","Angebote","Rechnungen"];
 const controller=useRecordsController({placeholder:"Dokumente suchen...",columns,chips});
 const customerQuery="?customerId="+encodeURIComponent(customerId);
 return <section className="customer-tab-panel"><SectionTitle title="Dokumente"/><RecordsControls controller={controller} columns={columns} chips={chips} placeholder="Dokumente suchen..."><CreateAction label="Dokument erstellen" onClick={()=>setCreateOpen(true)}/></RecordsControls><DocumentList items={items} error={error} context="customer" controller={controller} toolbarActions={false}/><DetailDisclosure label="Dateien"><EntityFiles purpose="customer_document" entityId={customerId}/></DetailDisclosure><ActionSheet label="Dokument erstellen" open={createOpen} onClose={()=>setCreateOpen(false)}><div className="action-list"><ActionRow href={"/angebote/neu"+customerQuery} icon="file" title="Angebot erstellen"/><ActionRow href={"/rechnungen/neu"+customerQuery} icon="receipt" title="Rechnung erstellen"/></div></ActionSheet></section>;
}
