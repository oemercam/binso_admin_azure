"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Eye, Mail, Plus, Printer, Save, Send, Trash2, Search, Clock3, ReceiptText } from "lucide-react";
import { defaultSettings, nextNumber, parseMoney } from "@/lib/local-store";
import { createAppRecord, listAppRecords, updateAppRecord } from "@/lib/client/data-service";
import { apiFetch, isProductionMode } from "@/lib/client/runtime";
import {loadOrganizationSettings} from "@/lib/client/organization-settings";
import { notify } from "@/lib/notify";
import { confirmAction } from "@/lib/confirm";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import { billableProjectEntries, customerDefaults, loadEntity, loadEntityOptions, productDefaults, type EntityOption } from "@/lib/relationships";
import RelationshipPicker from "@/components/relationship-picker";
import { usePermissions } from "@/lib/client/use-permissions";
import ResponsiveOverlay from "@/components/ui/responsive-overlay";
import {Button} from "@/components/ui/button";
import {IconButton} from "@/components/ui/icon-button";
import {Input,Select,Textarea} from "@/components/ui/form-controls";
import {domainConfig,dueDateFrom,isoDate} from "@/config/domain";
import {demoAnalyticsFixture} from "@/lib/demo/fixtures";
import {calculateDocumentTotals,type DocumentPosition} from "@/lib/documents/calculations";
import {createBlankDocumentPosition,initialDocumentPositions} from "@/lib/documents/defaults";
import {useLocale} from "@/components/locale-provider";

type Kind="rechnung"|"offerte";
type Position=DocumentPosition;

export default function BusinessDocumentEditor({kind}:{kind:Kind}){
 const isInvoice=kind==='rechnung';
 const {t,formatCurrency}=useLocale();
 const money=(value:number)=>formatCurrency(value);
 const router=useRouter();
 const {ready:permissionsReady,canModule}=usePermissions();
const [customer,setCustomer]=useState(''); const [email,setEmail]=useState(''); const [number,setNumber]=useState('');
 const [date,setDate]=useState(''); const [due,setDue]=useState(''); const [discount,setDiscount]=useState(0);
 const [intro,setIntro]=useState(t(isInvoice?'Besten Dank für Ihren Auftrag. Wir erlauben uns, folgende Leistungen in Rechnung zu stellen.':'Besten Dank für Ihre Anfrage. Gerne offerieren wir Ihnen folgende Leistungen.'));
 const [positions,setPositions]=useState<Position[]>(()=>initialDocumentPositions(!isProductionMode()));
 const [preview,setPreview]=useState(false); const [sendOpen,setSendOpen]=useState(false); const [savedId,setSavedId]=useState<string|undefined>(); const [dirty,setDirty]=useState(false); const [formError,setFormError]=useState("");
 const [customerId,setCustomerId]=useState(""); const [projectId,setProjectId]=useState(""); const [customerAddress,setCustomerAddress]=useState(""); const [customerContact,setCustomerContact]=useState(""); const [customerLanguage,setCustomerLanguage]=useState("Deutsch");
 const [productQuery,setProductQuery]=useState(""); const [products,setProducts]=useState<EntityOption[]>([]);
 useUnsavedChanges(dirty);
 useEffect(()=>{if(permissionsReady&&!canModule(isInvoice?"rechnungen":"offerten","write"))router.replace("/forbidden")},[permissionsReady,canModule,isInvoice,router]);
 const [settings,setSettings]=useState(defaultSettings); useEffect(()=>{let active=true;const timer=window.setTimeout(()=>{void (async()=>{
   const st=await loadOrganizationSettings();if(!active)return;setSettings(st);setIntro(isInvoice?st.invoiceIntro:st.quoteIntro);const today=isoDate();setDate(today);setDue(dueDateFrom(new Date(),Number(st.paymentDays||domainConfig.defaultPaymentDays)));
   if(isProductionMode()){const existing=await listAppRecords(isInvoice?"rechnungen":"offerten");setNumber(`${isInvoice?'R':'O'}-${new Date().getFullYear()}-${String(existing.length+1).padStart(4,'0')}`)}else setNumber(nextNumber(isInvoice?"rechnungen":"offerten"));
   const params=new URLSearchParams(window.location.search);const qCustomerId=params.get("customerId")||"";const qCustomer=params.get("kunde")||"";
   const customerOption=await loadEntity("kunden",qCustomerId||qCustomer);if(active&&customerOption){const d=customerDefaults(customerOption);setCustomerId(customerOption.id);setCustomer(customerOption.label);setEmail(String(d.email||""));setCustomerAddress([d.address,d.zipCity].filter(Boolean).join(", "));setCustomerContact(String(d.contact||""));setCustomerLanguage(String(d.language||"Deutsch"));setDiscount(Number(d.discount||0))}
   const qProjectId=params.get("projectId")||"";const qProject=params.get("projekt")||"";const projectOption=await loadEntity("projekte",qProjectId||qProject);if(active&&projectOption){setProjectId(projectOption.id);setIntro(v=>`${v}\n\nProjekt: ${projectOption.label}`)}
   const qDesc=params.get("beschreibung");const qAmount=params.get("betrag");if(active&&isInvoice&&qDesc&&qAmount)setPositions([{description:qDesc||"Weiterverrechnete Spese",quantity:1,unitPrice:Number(qAmount||0),vatRate:Number(st.defaultVat||domainConfig.defaultVatRate)}]);
   const productOptions=await loadEntityOptions("produkte");if(active)setProducts(productOptions);
 })()},0);return()=>{active=false;window.clearTimeout(timer)}},[isInvoice]);
 const totals=useMemo(()=>calculateDocumentTotals(positions,discount),[positions,discount]);
 const filteredProducts=products.filter(p=>`${p.label} ${p.sub||""}`.toLowerCase().includes(productQuery.toLowerCase())).slice(0,8);
 function chooseCustomer(option:EntityOption|undefined){
   setDirty(true);
   if(!option){setCustomerId("");setCustomer("");setEmail("");setCustomerAddress("");setCustomerContact("");return}
   const d=customerDefaults(option);setCustomerId(option.id);setCustomer(option.label);setEmail(String(d.email||""));setCustomerAddress([d.address,d.zipCity].filter(Boolean).join(", "));setCustomerContact(String(d.contact||""));setCustomerLanguage(String(d.language||"Deutsch"));setDiscount(Number(d.discount||0));
 }
 function addProduct(option:EntityOption){
   const d=productDefaults(option);setDirty(true);setPositions(v=>[...v,{description:String(d.description||option.label),quantity:1,unitPrice:Number(d.unitPrice||0),vatRate:Number(d.vatRate||domainConfig.defaultVatRate)}]);setProductQuery("");
 }
 async function importBillables(){
   if(!projectId){notify(t("Bitte zuerst ein Projekt auswählen."),"warning");return}
   const {times,expenses}=isProductionMode()?{times:(await listAppRecords("zeiterfassung")).filter(r=>((r.meta?.relations as Record<string,string>|undefined)||{}).projectId===projectId&&(r.fields["Verrechenbar"]||"Ja")==="Ja"&&!Boolean(r.meta?.invoicedBy)),expenses:(await listAppRecords("spesen")).filter(r=>((r.meta?.relations as Record<string,string>|undefined)||{}).projectId===projectId&&(r.fields["Weiterverrechenbar"]||"Nein")==="Ja"&&!Boolean(r.meta?.invoicedBy))}:billableProjectEntries(projectId);
   if(!times.length&&!expenses.length){notify(t("Keine unverrechneten Zeiten oder Spesen vorhanden."),"info");return}
   const imported=[
     ...times.map(t=>({description:`${t.fields["Leistung"]||t.row[2]||"Arbeitszeit"} · ${t.fields["Datum"]||t.row[0]}`,quantity:Number(String(t.fields["Dauer in Stunden"]||t.row[3]||"0").replace(/[^0-9.,]/g,"").replace(",","."))||0,unitPrice:(parseMoney(t.fields["Stundensatz CHF"]||t.fields["Ansatz CHF"]||"0")||(!isProductionMode()?demoAnalyticsFixture.defaultHourlyRate:0)),vatRate:Number(settings.defaultVat||domainConfig.defaultVatRate)})),
     ...expenses.map(e=>({description:`Spese · ${e.fields["Beschreibung"]||e.row[1]||"Spese"}`,quantity:1,unitPrice:Number(String(e.fields["Betrag CHF"]||e.row[3]||"0").replace(/[^0-9.,]/g,"").replace(",", "."))||0,vatRate:Number(settings.defaultVat||domainConfig.defaultVatRate)}))
   ];
   setPositions(v=>[...v,...imported]);setDirty(true);notify(`${imported.length} ${t("verrechenbare Positionen übernommen.")}`);
 }
 function validate(){
   if(!customer.trim()||!email.trim()){setFormError(t("Bitte prüfen Sie die markierten Pflichtfelder."));notify(t("Kunde und E-Mail sind erforderlich."),"danger");return false}
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setFormError(t("Ungültige E-Mail-Adresse."));notify(t("Ungültige E-Mail-Adresse."),"danger");return false}
   if(!positions.length||positions.some(p=>!p.description.trim()||p.quantity<=0||p.unitPrice<0)){setFormError(t("Bitte Positionen vollständig ausfüllen."));notify(t("Bitte Positionen vollständig ausfüllen."),"danger");return false}
   setFormError("");return true;
 }
 async function cancelEditor(){if(!dirty){router.back();return}const ok=await confirmAction({title:t("Möchten Sie wirklich abbrechen?"),message:t("Nicht gespeicherte Änderungen gehen verloren."),confirmLabel:t("Abbrechen"),cancelLabel:t("Fortfahren"),tone:"danger"});if(ok){setDirty(false);router.back()}}
 async function save(status='Entwurf'){
   if(!validate()) return;
   const input={module:isInvoice?'rechnungen' as const:'offerten' as const,status,row:[number,customer,isInvoice?due:date,money(totals.gross),status],fields:{Nummer:number,Kunde:customer,'E-Mail':email,Datum:date,[isInvoice?'Fällig':'Gültig bis']:due,Betrag:money(totals.gross),Status:status,Einleitung:intro,Rabatt:`${discount} %`},positions,meta:{net:totals.net,vat:totals.vat,gross:totals.gross,discount,relations:{customerId,projectId},customerSnapshot:{address:customerAddress,contact:customerContact,email,language:customerLanguage}}};
   const {module:recordModule,...patch}=input;const rec=savedId?(await updateAppRecord(savedId,patch)):(await createAppRecord({...patch,module:recordModule}));if(!rec)throw new Error("Dokument konnte nicht gespeichert werden.");setSavedId(rec.id);
   if(isInvoice&&projectId){const source=isProductionMode()?{times:(await listAppRecords("zeiterfassung")).filter(r=>((r.meta?.relations as Record<string,string>|undefined)||{}).projectId===projectId&&!Boolean(r.meta?.invoicedBy)),expenses:(await listAppRecords("spesen")).filter(r=>((r.meta?.relations as Record<string,string>|undefined)||{}).projectId===projectId&&!Boolean(r.meta?.invoicedBy))}:billableProjectEntries(projectId);await Promise.all([...source.times,...source.expenses].map(r=>updateAppRecord(r.id,{meta:{...(r.meta||{}),invoicedBy:rec.id}})))}
   setDirty(false);notify(`${t(isInvoice?'Rechnung':'Offerte')} gespeichert.`);return rec;
 }
 async function send(){if(!validate())return;try{await save(isInvoice?'Offen':'Versendet');if(isProductionMode()){const subject=`${t(isInvoice?'Rechnung':'Offerte')} ${number} – ${settings.companyName}`;const message=`${t("Guten Tag")}\n\n${t(isInvoice?"Im Anhang/Portal erhalten Sie unsere Rechnung":"Im Anhang/Portal erhalten Sie unsere Offerte")} ${number}.\n\n${t("Freundliche Grüsse")}\n${settings.companyName}`;const result=await apiFetch<{delivered:boolean}>("/api/email/document",{method:"POST",body:JSON.stringify({module:isInvoice?'rechnungen':'offerten',to:email,subject,message,number})});notify(result.delivered?`${t(isInvoice?'Rechnung':'Offerte')} wurde per E-Mail versendet.`:t("Dokument gespeichert. E-Mail-Versand ist noch nicht konfiguriert."),result.delivered?"success":"info")}else notify(`${t(isInvoice?'Rechnung':'Offerte')} wurde im Demo-Modus an ${email} versendet.`);setSendOpen(false)}catch(e){notify(e instanceof Error?e.message:t("Versand fehlgeschlagen."),"danger")}}
 function printDoc(){setPreview(true);window.setTimeout(()=>window.print(),120)}
 const renderDocument=()=> <div className="document-paper print-document">
   <div className="doc-brand"><strong>{settings.companyName}</strong><span>{settings.address} · {settings.zipCity}</span></div>
   <div className="doc-address"><small>{settings.companyName} · {settings.address} · {settings.zipCity}</small><strong>{customer}</strong>{customerContact&&<span>{t("z.H.")} {customerContact}</span>}<span>{customerAddress||t("Schweiz")}</span></div>
   <div className="doc-title"><div><h2>{t(isInvoice?'Rechnung':'Offerte')}</h2><strong>{number}</strong></div><div><span>{t("Datum")}</span><strong>{date}</strong><span>{t(isInvoice?'Fällig':'Gültig bis')}</span><strong>{due}</strong></div></div>
   <p className="doc-intro">{intro}</p>
   <div className="doc-positions"><div className="doc-pos-head"><span>{t("Beschreibung")}</span><span>{t("Menge")}</span><span>{t("Preis")}</span><span>{t("MWST")}</span><span>{t("Total")}</span></div>{positions.map((p,i)=><div className="doc-pos" key={i}><span>{p.description||t('Position')}</span><span>{p.quantity}</span><span>{money(p.unitPrice)}</span><span>{p.vatRate}%</span><span>{money(p.quantity*p.unitPrice)}</span></div>)}</div>
   <div className="doc-totals"><div><span>{t("Zwischentotal")}</span><strong>{money(totals.baseNet)}</strong></div>{discount>0&&<div><span>{t("Rabatt")} {discount}%</span><strong>- {money(totals.baseNet-totals.net)}</strong></div>}<div><span>{t("MWST")}</span><strong>{money(totals.vat)}</strong></div><div className="doc-grand"><span>{t("Total")}</span><strong>{money(totals.gross)}</strong></div></div>
   {isInvoice && <div className="qr-demo"><div className="qr-box">QR</div><div><strong>{t("Schweizer QR-Zahlteil · Demo")}</strong><span>IBAN {settings.iban}</span><span>{t("Zahlbar bis")} {due}</span><span>{t("Referenz")} DEMO-{number.replaceAll('-','')}</span></div></div>}
   <div className="doc-footer"><span>{settings.companyName}</span><span>{settings.uid}</span><span>{settings.email} · {settings.phone}</span></div>
 </div>;
 return <div className="page document-editor-page">
  <div className="form-title-row"><button type="button" className="back-link button-link" onClick={cancelEditor}><ArrowLeft size={17}/> {t("Zurück")}</button><div className="document-editor-heading"><div><div className="eyebrow">{t(isInvoice?'Verkauf / Rechnung':'Verkauf / Offerte')}</div><h1>{t(isInvoice?'Rechnung erstellen':'Offerte erstellen')}</h1><p>{t("Erstellen, prüfen, als PDF drucken und direkt versenden.")}</p></div><div className="document-top-actions"><Button variant="secondary" icon={<Save size={17}/>} onClick={()=>save()}>{t("Entwurf")}</Button><Button variant="secondary" icon={<Eye size={17}/>} onClick={()=>setPreview(true)}>{t("Vorschau anzeigen")}</Button><Button icon={<Send size={17}/>} onClick={()=>setSendOpen(true)}>{t("Versenden")}</Button></div></div></div>
  {formError&&<div className="form-error-summary">{formError}</div>}<div className="document-editor-grid">
   <section className="workspace-card editor-main">
    <div className="section-title"><h2>{t("Empfänger und Angaben")}</h2><span>{t(isProductionMode()?"Geschäftsdaten":"Demo-Daten")}</span></div>
    <div className="form-grid"><div><RelationshipPicker module="kunden" label={t("Kunde")} value={customerId} onChange={chooseCustomer} required createHref="/kunden/neu"/><small className="field-help">{customerContact||customerAddress||t("Gespeicherten Kunden suchen oder neu erstellen.")}</small></div><label><span>{t("E-Mail")} *</span><Input required value={email} onChange={e=>{setDirty(true);setEmail(e.target.value)}} type="email"/></label><label><span>{t("Datum")}</span><Input type="date" value={date} onChange={e=>{setDirty(true);setDate(e.target.value)}}/></label><label><span>{t(isInvoice?'Fällig':'Gültig bis')}</span><Input type="date" value={due} onChange={e=>{setDirty(true);setDue(e.target.value)}}/></label><div><RelationshipPicker module="projekte" label={t("Projekt / Bezug")} value={projectId} onChange={o=>{setDirty(true);setProjectId(o?.id||"")}} createHref="/projekte/neu"/></div><label><span>{t("Kundensprache")}</span><Input value={customerLanguage} onChange={e=>{setDirty(true);setCustomerLanguage(e.target.value)}}/></label><label><span>{t("Rabatt")} %</span><Input type="number" min="0" max="100" step="0.1" value={discount} onChange={e=>{setDirty(true);setDiscount(Number(e.target.value))}}/></label><label className="full"><span>{t("Einleitung")}</span><Textarea rows={3} value={intro} onChange={e=>{setDirty(true);setIntro(e.target.value)}}/></label></div>
    <div className="section-title positions-title"><h2>{t("Positionen")}</h2><Button type="button" variant="secondary" size="sm" icon={<Plus size={16}/>} onClick={()=>{setDirty(true);setPositions(p=>[...p,createBlankDocumentPosition()])}}>{t("Position")}</Button></div>
    <div className="document-relation-tools"><div className="product-lookup"><Search size={16}/><Input value={productQuery} onChange={e=>setProductQuery(e.target.value)} placeholder={t("Produkte und Leistungen suchen …")}/>{productQuery&&<div className="product-results">{filteredProducts.map(option=><button type="button" key={option.id} onClick={()=>addProduct(option)}><strong>{option.label}</strong><small>{option.fields["Preis CHF"]||option.sub}</small></button>)}</div>}</div>{isInvoice&&<Button type="button" variant="secondary" size="sm" icon={<><Clock3 size={16}/><ReceiptText size={16}/></>} onClick={importBillables}>{t("Zeit und Spesen übernehmen")}</Button>}</div><div className="positions-editor document-positions-editor"><div className="position-labels"><span>{t("Beschreibung")}</span><span>{t("Menge")}</span><span>{t("Einzelpreis")}</span><span>{t("MWST")}</span><span/></div>{positions.map((p,index)=><div className="position-row document-position-row" key={index}><Input aria-label={t("Beschreibung")} placeholder={t("Beschreibung")} value={p.description} onChange={e=>{setDirty(true);setPositions(x=>x.map((v,i)=>i===index?{...v,description:e.target.value}:v))}}/><Input aria-label={t("Menge")} placeholder={t("Menge")} type="number" step="0.01" value={p.quantity} onChange={e=>{setDirty(true);setPositions(x=>x.map((v,i)=>i===index?{...v,quantity:Number(e.target.value)}:v))}}/><Input aria-label={t("Einzelpreis")} placeholder={t("Einzelpreis")} type="number" step="0.05" value={p.unitPrice} onChange={e=>{setDirty(true);setPositions(x=>x.map((v,i)=>i===index?{...v,unitPrice:Number(e.target.value)}:v))}}/><Select value={p.vatRate} onChange={e=>{setDirty(true);setPositions(x=>x.map((v,i)=>i===index?{...v,vatRate:Number(e.target.value)}:v))}}>{domainConfig.vatRates.map(rate=><option key={rate} value={rate}>{rate} %</option>)}</Select><IconButton aria-label={t("Position löschen")} onClick={()=>{setDirty(true);setPositions(x=>x.filter((_,i)=>i!==index))}}><Trash2 size={16}/></IconButton></div>)}</div>
    <div className="editor-totals"><div><span>{t("Brutto Positionen")}</span><strong>{money(totals.baseNet)}</strong></div>{discount>0&&<div><span>{t("Rabatt")}</span><strong>- {money(totals.baseNet-totals.net)}</strong></div>}<div><span>{t("Netto")}</span><strong>{money(totals.net)}</strong></div><div><span>{t("MWST")}</span><strong>{money(totals.vat)}</strong></div><div><span>{t("Total")}</span><strong>{money(totals.gross)}</strong></div></div>
   </section>
   <aside className="editor-side document-side"><div className="workspace-card side-card document-preview-launcher"><div className="section-title"><h3>{t("Dokumentvorschau")}</h3><Eye size={18}/></div><p>{t("Die vollständige Dokumentansicht wird erst bei Bedarf geöffnet.")}</p><Button variant="secondary" icon={<Eye size={17}/>} onClick={()=>setPreview(true)}>{t("Vorschau anzeigen")}</Button></div><div className="workspace-card side-card"><h3>{t("Aktionen")}</h3><Button icon={<Mail size={17}/>} onClick={()=>setSendOpen(true)}>{t("Versenden")}</Button><Button variant="secondary" icon={<Eye size={17}/>} onClick={()=>setPreview(true)}>{t("Vorschau anzeigen")}</Button><Button variant="secondary" icon={<Check size={17}/>} onClick={()=>save()}>{t("Entwurf speichern")}</Button></div></aside>
  </div>
  <ResponsiveOverlay open={preview} title={t("Dokumentvorschau")} onClose={()=>setPreview(false)} size="document" actions={<Button variant="secondary" icon={<Printer size={17}/>} onClick={printDoc}>{t("Drucken / PDF")}</Button>}><div className="modal-document-scroll">{renderDocument()}</div></ResponsiveOverlay>
  <ResponsiveOverlay open={sendOpen} title={t("Versand")} onClose={()=>setSendOpen(false)} size="md" actions={<><Button variant="secondary" onClick={()=>setSendOpen(false)}>{t("Abbrechen")}</Button><Button icon={<Send size={17}/>} onClick={send}>{t(isProductionMode()?"Versenden":"Demo-Versand ausführen")}</Button></>}><div className="overlay-form"><p>{t(isProductionMode()?"Das Dokument wird gespeichert und über den konfigurierten E-Mail-Dienst versendet.":"Der Versand wird lokal simuliert. Es wird keine echte E-Mail versendet.")}</p><label><span>{t("Empfänger")}</span><Input value={email} onChange={e=>{setDirty(true);setEmail(e.target.value)}} type="email"/></label><label><span>{t("Betreff")}</span><Input defaultValue={`${t(isInvoice?'Rechnung':'Offerte')} ${number} – ${settings.companyName}`}/></label><label><span>{t("Nachricht")}</span><Textarea rows={5} defaultValue={`${t("Guten Tag")}\n\n${t(isInvoice?"Im Anhang erhalten Sie unsere Rechnung":"Im Anhang erhalten Sie unsere Offerte")} ${number}.\n\n${t("Freundliche Grüsse")}\n${settings.companyName}`}/></label></div></ResponsiveOverlay>
 </div>
}
