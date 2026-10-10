"use client";
import {Statistics} from "../statistics";
import {EntityFiles} from "../entity-files";
import {useApiQuery} from "@/lib/client/use-api-query";
import {useDirtySnapshot} from "../use-dirty-snapshot";
import {Avatar} from "../avatar";

import { DocumentList, type DocumentListItem } from "../document-list";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useId } from "react";
import ConfirmDialog from "../confirm-dialog";
import { AppShell } from "../app-shell";
import { RecordRow, RecordsView } from "../records";
import { customers } from "@/lib/demo-data";
import { appendDemoRow } from "@/lib/demo-storage";
import { apiPatch, apiPost, apiDelete, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {Button, EmptyState, Field, SectionTitle, Status, Toast, Input, Select, FormActions, LoadingState, ErrorState} from "../ui";
import { ActionRow, ActionSheet, FormSheet, CreateAction, DetailTabs } from "../binso-ux";
import { useDemoRows, swissDate } from "./shared";
import { FinancialSummary } from "./finance";

export function formatSwissPhone(value:unknown){const raw=String(value??"").trim();const digits=raw.replace(/\D/g,"");if(digits.startsWith("41")&&digits.length===11)return `+41 ${digits.slice(2,4)} ${digits.slice(4,7)} ${digits.slice(7,9)} ${digits.slice(9,11)}`;if(digits.startsWith("0")&&digits.length===10)return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,8)} ${digits.slice(8,10)}`;return raw;}

export function formatSwissUid(value:unknown){const raw=String(value??"").trim().toUpperCase();const digits=raw.replace(/\D/g,"");if(digits.length===9)return `CHE-${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}`;return raw;}

export function CustomersPage() {
  const {rows:customerRows,loading,error}=useDemoRows("customers",customers);
  return <AppShell title="Kunden" subtitle="Kunden, Kontakte und Aktivitäten zentral verwalten." active="kunden" actions={<CreateAction href="/kunden/neu" label="Neuer Kunde"/>}>
    <div className="customer-records-layout">
      <div>
        <RecordsView loading={loading} error={error} items={customerRows} countLabel="Kunden" placeholder="Kunden suchen..." columns={[{label:"Kunde",index:0},{label:"Kontakt",index:1},{label:"Ort",index:2},{label:"Status",index:4,status:true}]} rowHref={row=>`/kunden/${row[4]?row[3]:"acme"}`}>{(row)=>{const [name,sector,city,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"acme";const status=statusMaybe??idOrStatus;return <RecordRow href={"/kunden/"+id} title={name} meta={[city,sector].filter(value=>value&&value!=="—").join(" · ")} status={status}/>}}</RecordsView>
      </div>

    </div>
  </AppShell>;
}

export function CustomerDetail({customerId="acme"}:{customerId?:string}) {
  const production=useBackendMode();
  const workspace=useApiQuery<{item:Record<string,unknown>;contacts:Array<Record<string,unknown>>;documents:Array<Record<string,unknown>>;summary:FinancialSummary;activity:Array<{at:string;title:string;detail:string}>;statistics:Array<{currency:string;date:string;paid:unknown;billed:unknown;invoice_count:unknown}>|null}>(production?"/api/customers/"+encodeURIComponent(customerId)+"?include=workspace":null);
  const searchParams=useSearchParams();
  const requestedReturnTo=searchParams.get("returnTo");
  const returnTo=requestedReturnTo==="/dashboard"?"/dashboard":"/kunden";
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

      if(loadError)return <AppShell title="Kunde" subtitle="Kundendaten nicht verfügbar" active="kunden" backHref={returnTo} backLabel="Kunden"><div role="alert"><EmptyState icon="users" title="Kunde konnte nicht geladen werden" text={loadError}/></div><div className="page-actions"><Button onClick={workspace.refresh}>Erneut versuchen</Button><Button href={returnTo} variant="ghost">Zur Übersicht</Button></div></AppShell>;
  if(!customer) return <AppShell title="Kunde" subtitle="Daten werden geladen." active="kunden" backHref={returnTo} backLabel="Kunden"><EmptyState icon="users" title="Kunde wird geladen" text="Die Kundendaten werden abgerufen."/></AppShell>;

  const availableCurrencies=[...new Set((workspace.data?.statistics??[]).map(row=>row.currency))];
  const displayCurrency=availableCurrencies.includes(statisticCurrency)?statisticCurrency:availableCurrencies[0]??'CHF';
  const name=String(customer.name??"Kunde");
  const sector=String(customer.sector??"");
  const city=String(customer.city??"");
  const status=String(customer.status??"active");
  return <AppShell title={name} status={status==="inactive"?"Inaktiv":"Aktiv"} statusTone={status==="inactive"?"neutral":"success"} subtitle={[sector,city].filter(Boolean).join(" · ")} active="kunden" backHref={returnTo} backLabel="Kunden" actions={<Button variant="ghost" icon="more" ariaLabel="Kundenaktionen" onClick={()=>setCustomerActions(true)}/>} >
    <div className="customer-detail-workspace">

      <div className="desktop-detail-main"><DetailTabs label="Kundenbereiche" panelId={panelId}><button className={tab==="overview"?"active":""} onClick={()=>setTab("overview")}>Übersicht</button><button className={tab==="contacts"?"active":""} onClick={()=>setTab("contacts")}>Kontakte</button><button className={tab==="finances"?"active":""} onClick={()=>setTab("finances")}>Finanzen</button><button className={tab==="activity"?"active":""} onClick={()=>setTab("activity")}>Aktivität</button></DetailTabs>
    <div id={panelId} role="tabpanel" aria-labelledby={panelId+'-tab-'+['overview','contacts','finances','activity'].indexOf(tab??'overview')}>
    {tab==="overview"&&<>{workspace.data?.statistics&&<>{new Set(workspace.data.statistics.map(row=>row.currency)).size>1&&<Field allowReadOnlyInput label="Statistikwährung"><Select value={displayCurrency} onChange={event=>setStatisticCurrency(event.target.value)}>{availableCurrencies.map(currency=><option key={currency}>{currency}</option>)}</Select></Field>}<Statistics title="Kundenentwicklung" subtitle="Zahlungen und fakturiertes Volumen · ohne Entwürfe und Stornos" currency={displayCurrency} storageKey={'customer:'+customerId} events={workspace.data.statistics.filter(row=>row.currency===displayCurrency).map(row=>({date:row.date,values:{paid:row.paid,billed:row.billed,invoice_count:row.invoice_count}}))} series={[{key:'paid',label:'Erhaltene Zahlungen',tone:'positive'},{key:'billed',label:'Fakturiert',tone:'neutral'}]} metricKeys={['invoice_count']} metrics={totals=>[{label:'Erhaltene Zahlungen',value:totals.paid},{label:'Fakturiertes Volumen',value:totals.billed},{label:'Rechnungen',value:totals.invoice_count,format:'number'}]}/></>}<section className="surface"><SectionTitle title="Kundendetails"/><dl className="detail-list">{[['Firma',name],['Hauptkontakt',contacts.filter(contact=>contact.is_primary).map(contact=>[contact.first_name,contact.last_name].filter(Boolean).join(' ')).join(', ')],['E-Mail',customer.email],['Telefon',formatSwissPhone(customer.phone)],['Adresse',[customer.street,[customer.postal_code,city].filter(Boolean).join(' ')].filter(Boolean).join(', ')],['UID',formatSwissUid(customer.uid)]].filter(([,value])=>Boolean(value)).map(([label,value])=><div key={String(label)}><dt>{String(label)}</dt><dd>{String(value)}</dd></div>)}</dl>{(!customer.email||!customer.phone||!customer.street)&&<Button href={'/kunden/'+encodeURIComponent(customerId)+'/bearbeiten'} variant="secondary">Kundendaten vervollständigen</Button>}</section></>}
    {tab==="contacts"&&<section className="customer-tab-panel"><SectionTitle title="Kontakte" action={<Button variant="secondary" icon="plus" requiresWrite onClick={()=>openContact()}>Kontakt</Button>}/>{contacts.length?<div className="contact-list">{contacts.map(contact=>{const fullName=[contact.first_name,contact.last_name].filter(Boolean).join(" ");return <div key={String(contact.id)} role="button" tabIndex={0} onClick={()=>openContact(contact)} onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openContact(contact)}}}><Avatar name={fullName} identity={String(contact.id)}/><div className="contact-main"><b>{fullName}</b>{[contact.job_title,contact.email,formatSwissPhone(contact.phone)].filter(Boolean).map((value,index)=><small key={index}>{String(value)}</small>)}{contact.is_primary===true&&<Status tone="success">Hauptkontakt</Status>}</div><div className="contact-actions" onClick={e=>e.stopPropagation()}><Button variant="ghost" icon="more" ariaLabel={fullName+" Aktionen"} onClick={()=>setContactMenu(contact)}/></div></div>})}</div>:<p>Keine Kontakte erfasst</p>}</section>}
    {tab==="finances"&&<EntityFiles purpose="customer_document" entityId={customerId}/>}
    {tab==="finances"&&<section className="customer-tab-panel"><SectionTitle title="Finanzen"/><DocumentList items={customerDocuments as DocumentListItem[]} error={customerDocumentsError} context="customer"/></section>}
    {tab==="activity"&&<section className="customer-tab-panel"><SectionTitle title="Aktivität"/>{customerActivity.length?<div className="timeline">{customerActivity.map((item,index)=><div key={item.at+index}><i/><div><b>{item.title}</b><small>{swissDate(item.at)} · {item.detail}</small></div></div>)}</div>:<p>Keine Geschäftsaktivität vorhanden</p>}</section>}</div></div>
      <aside className="desktop-context-rail"><section className="desktop-summary-card"><span className="compact-section-label">Übersicht</span><div className="desktop-summary-facts"><span>Kontakte <b>{contacts.length}</b></span><span>Angebote / Rechnungen <b>{customerDocuments.length}</b></span></div></section></aside>
    </div>
    <ActionSheet label="Kundenaktionen" description={name} open={customerActions} onClose={()=>setCustomerActions(false)}><div className="action-list"><ActionRow href={'/kunden/'+encodeURIComponent(customerId)+'/bearbeiten'} icon="edit" title="Kunde bearbeiten" onClick={()=>setCustomerActions(false)}/><ActionRow requiresWrite navigation icon="plus" title="Kontakt hinzufügen" onClick={()=>{setCustomerActions(false);openContact()}}/><ActionRow href={'/angebote/neu?customerId='+encodeURIComponent(customerId)} icon="file" title="Angebot erstellen" onClick={()=>setCustomerActions(false)}/><ActionRow href={'/rechnungen/neu?customerId='+encodeURIComponent(customerId)} icon="receipt" title="Rechnung erstellen" onClick={()=>setCustomerActions(false)}/><ActionRow href={'/zeit?customerId='+encodeURIComponent(customerId)} icon="clock" title="Zeit erfassen" onClick={()=>setCustomerActions(false)}/><ActionRow href={'/projekte/neu?customerId='+encodeURIComponent(customerId)} icon="box" title="Auftrag / Projekt starten" onClick={()=>setCustomerActions(false)}/></div></ActionSheet>
    {contactMenu&&<ActionSheet label="Kontaktaktionen" open={!!contactMenu} onClose={()=>setContactMenu(null)}><div className="action-list"><ActionRow requiresWrite navigation icon="edit" title="Kontakt bearbeiten" onClick={()=>{openContact(contactMenu);setContactMenu(null)}}/>{!!contactMenu.email&&<ActionRow icon="mail" title="E-Mail senden" href={'mailto:'+String(contactMenu.email)} onClick={()=>setContactMenu(null)}/>}{!!contactMenu.phone&&<ActionRow icon="phone" title="Anrufen" href={'tel:'+String(contactMenu.phone)} onClick={()=>setContactMenu(null)}/>}<ActionRow requiresWrite danger icon="trash" title="Kontakt entfernen" onClick={()=>{setRemoveContact(String(contactMenu.id));setContactMenu(null)}}/></div></ActionSheet>}
    <FormSheet label={contactId?"Kontakt bearbeiten":"Kontakt hinzufügen"} description={"Kontakt wird direkt "+name+" zugeordnet."} className="contact-sheet" open={contactOpen} onClose={()=>setContactOpen(false)} busy={contactSaving}><div className="form-grid two"><Field label="Vorname"><Input value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field><Field label="Nachname"><Input value={lastName} onChange={e=>setLastName(e.target.value)}/></Field><Field label="E-Mail"><Input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} type="email"/></Field><Field label="Telefon"><Input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} type="tel"/></Field><Field label="Funktion" className="full"><Input value={contactRole} onChange={e=>setContactRole(e.target.value)} placeholder="z. B. Buchhaltung"/></Field><Field label="Als Hauptkontakt festlegen" className="full"><Input type="checkbox" checked={contactPrimary} onChange={e=>setContactPrimary(e.target.checked)}/></Field></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setContactOpen(false)}>Abbrechen</Button><Button requiresWrite disabled={contactSaving} onClick={()=>void saveContact()}>{contactSaving?"Wird gespeichert…":"Speichern"}</Button></div></FormSheet>
    {removeContact&&<ConfirmDialog open danger busy={contactSaving} title="Kontakt entfernen?" message="Der Kontakt wird aus der Kundenliste entfernt. Bestehende Dokumente bleiben erhalten." confirmLabel={contactSaving?"Wird entfernt…":"Entfernen"} onCancel={()=>{if(!contactBusy.current)setRemoveContact(null)}} onConfirm={()=>void remove()}/>}
    {contactToast&&<Toast title={contactToast} tone={contactToast==="Kontakt gespeichert."||contactToast==="Kontakt entfernt."?"success":"danger"}/>}
  </AppShell>;
}

export function CustomerForm({customerId}:{customerId?:string}={}) {
  const router=useRouter();
  const searchParams=useSearchParams();
  const returnTo=searchParams.get("returnTo")==="/dashboard"?"/dashboard":"/kunden";
  const [company,setCompany]=useState("");
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
  const recordQuery=useApiQuery<{item:Record<string,unknown>}>(customerId?"/api/customers/"+encodeURIComponent(customerId):null);
  const hydratedCustomer=useRef<string|null>(null);
  const loadingRecord=recordQuery.loading;
  const recordError=recordQuery.error;
  const [savingRecord,setSavingRecord]=useState(false);
  const saveRecordPending=useRef(false);
  const {dirty,markPristine}=useDirtySnapshot([company,email,phone,city,sector,address,postalCode,uid,notes,customerStatus]);
  const [savedRecord,setSavedRecord]=useState(false);
  useEffect(()=>{if(!customerId||!recordQuery.data||hydratedCustomer.current===customerId)return;hydratedCustomer.current=customerId;const {item}=recordQuery.data;queueMicrotask(()=>{setCompany(String(item.name??''));setEmail(String(item.email??''));setPhone(String(item.phone??''));setCity(String(item.city??''));setSector(String(item.sector??''));setAddress(String(item.street??''));setPostalCode(String(item.postal_code??''));setUid(String(item.uid??''));setNotes(String(item.notes??''));setCustomerStatus(String(item.status??'active'));markPristine([String(item.name??''),String(item.email??''),String(item.phone??''),String(item.city??''),String(item.sector??''),String(item.street??''),String(item.postal_code??''),String(item.uid??''),String(item.notes??''),String(item.status??'active')]);});},[customerId,recordQuery.data,markPristine]);
  const save=async()=>{
    if(saveRecordPending.current||loadingRecord||recordError)return;
    if(!company.trim() || !city.trim()){
      setToast("Firmenname und Ort sind erforderlich.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    saveRecordPending.current=true;setSavingRecord(true);
    try{
      if(isProductionBackendEnabled()) await (customerId?apiPatch:apiPost)("/api/customers"+(customerId?"/"+encodeURIComponent(customerId):""),{name:company.trim(),sector,email,phone,city,address,postalCode,uid,notes,status:customerStatus});
      else appendDemoRow("customers",[company.trim(),sector,city.trim(),"Aktiv"]);
      setToast("Kunde gespeichert.");
      setSavedRecord(true);
      window.setTimeout(()=>router.push(customerId?"/kunden/"+encodeURIComponent(customerId):returnTo),700);
    }catch(error){
      saveRecordPending.current=false;setSavingRecord(false);
      setToast(error instanceof Error?error.message:"Kunde konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };
  if(loadingRecord||recordError)return <AppShell title="Kunde" active="kunden" backHref="/kunden">{loadingRecord?<LoadingState>Kunde wird geladen …</LoadingState>:<ErrorState onRetry={recordQuery.refresh} retryLabel="Erneut versuchen">{recordError}</ErrorState>}</AppShell>;
  return <AppShell editing={true} unsavedChanges={dirty&&!savedRecord} title={customerId?"Kunde bearbeiten":"Kunde erstellen"} subtitle="Nur die wichtigsten Angaben. Details kannst du später ergänzen." active="kunden" backHref={returnTo} backLabel="Kunden">
    <div className="form-page" inert={savingRecord}>
      <section className="form-section clean">
        <h2>Grundangaben</h2>
        <div className="form-grid two">
          <Field label="Firmenname"><Input autoFocus value={company} onChange={e=>setCompany(e.target.value)} placeholder="Firma oder Name"/></Field>
          <Field label="E-Mail"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@firma.ch"/></Field>
          <Field label="Telefon"><Input type="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+41 00 000 00 00"/></Field>
          <Field label="Ort"><Input value={city} onChange={e=>setCity(e.target.value)} placeholder="Zürich"/></Field>
          <Field label="Status"><Select value={customerStatus} onChange={e=>setCustomerStatus(e.target.value)}><option value="active">Aktiv</option><option value="inactive">Inaktiv</option></Select></Field><Field label="Branche"><Select value={sector} onChange={e=>setSector(e.target.value)}><option>Dienstleistung</option><option>Bauunternehmen</option><option>Immobilien</option><option>Beratung</option><option>Handel</option><option>Elektro</option></Select></Field>
        </div>
      </section>
      <details className="optional-details"><summary>Weitere Angaben</summary><div className="form-grid two"><Field label="Adresse"><Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Strasse und Nummer"/></Field><Field label="PLZ"><Input inputMode="numeric" value={postalCode} onChange={e=>setPostalCode(e.target.value)} placeholder="8000"/></Field><Field label="UID"><Input value={uid} onChange={e=>setUid(e.target.value)} placeholder="CHE-000.000.000"/></Field><Field label="Interne Notiz"><Input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional"/></Field></div></details>
      <FormActions ><Button requiresWrite disabled={savingRecord} onClick={save}>{savingRecord?"Wird gespeichert…":customerId?"Änderungen speichern":"Kunde speichern"}</Button></FormActions>
    </div>
    {toast&&<Toast title={toast} tone={toast==="Kunde gespeichert."?"success":"danger"}/>}
  </AppShell>;
}
