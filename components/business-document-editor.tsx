"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Eye, Mail, Plus, Printer, Save, Send, Trash2, X, Search, Clock3, ReceiptText } from "lucide-react";
import { defaultSettings, nextNumber } from "@/lib/local-store";
import { createAppRecord, listAppRecords, updateAppRecord } from "@/lib/client/data-service";
import { apiFetch, isProductionMode } from "@/lib/client/runtime";
import {loadOrganizationSettings} from "@/lib/client/organization-settings";
import { notify } from "@/lib/notify";
import { confirmAction } from "@/lib/confirm";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import { billableProjectEntries, customerDefaults, loadEntity, loadEntityOptions, productDefaults, type EntityOption } from "@/lib/relationships";
import RelationshipPicker from "@/components/relationship-picker";
import { usePermissions } from "@/lib/client/use-permissions";

type Kind="rechnung"|"offerte";
type Position={description:string;quantity:number;unitPrice:number;vatRate:number};
const money=(n:number)=>new Intl.NumberFormat('de-CH',{style:'currency',currency:'CHF'}).format(n);

export default function BusinessDocumentEditor({kind}:{kind:Kind}){
 const isInvoice=kind==='rechnung';
 const router=useRouter();
 const {ready:permissionsReady,canModule}=usePermissions();
const [customer,setCustomer]=useState(''); const [email,setEmail]=useState(''); const [number,setNumber]=useState(`${isInvoice?'R':'O'}-2026-0001`);
 const [date,setDate]=useState('2026-09-28'); const [due,setDue]=useState(isInvoice?'2026-10-28':'2026-10-28'); const [discount,setDiscount]=useState(0);
 const [intro,setIntro]=useState(isInvoice?'Besten Dank für Ihren Auftrag. Wir erlauben uns, folgende Leistungen in Rechnung zu stellen.':'Besten Dank für Ihre Anfrage. Gerne offerieren wir Ihnen folgende Leistungen.');
 const [positions,setPositions]=useState<Position[]>([{description:'Beratung / Projektleistung',quantity:8,unitPrice:150,vatRate:8.1},{description:'Dokumentation',quantity:2,unitPrice:120,vatRate:8.1}]);
 const [preview,setPreview]=useState(false); const [sendOpen,setSendOpen]=useState(false); const [savedId,setSavedId]=useState<string|undefined>(); const [dirty,setDirty]=useState(false); const [formError,setFormError]=useState("");
 const [customerId,setCustomerId]=useState(""); const [projectId,setProjectId]=useState(""); const [customerAddress,setCustomerAddress]=useState(""); const [customerContact,setCustomerContact]=useState(""); const [customerLanguage,setCustomerLanguage]=useState("Deutsch");
 const [productQuery,setProductQuery]=useState(""); const [products,setProducts]=useState<EntityOption[]>([]);
 useUnsavedChanges(dirty);
 useEffect(()=>{if(permissionsReady&&!canModule(isInvoice?"rechnungen":"offerten","write"))router.replace("/forbidden")},[permissionsReady,canModule,isInvoice,router]);
 const [settings,setSettings]=useState(defaultSettings); useEffect(()=>{let active=true;const timer=window.setTimeout(()=>{void (async()=>{
   const st=await loadOrganizationSettings();if(!active)return;setSettings(st);setIntro(isInvoice?st.invoiceIntro:st.quoteIntro);
   if(isProductionMode()){const existing=await listAppRecords(isInvoice?"rechnungen":"offerten");setNumber(`${isInvoice?'R':'O'}-${new Date().getFullYear()}-${String(existing.length+1).padStart(4,'0')}`)}else setNumber(nextNumber(isInvoice?"rechnungen":"offerten"));
   const params=new URLSearchParams(window.location.search);const qCustomerId=params.get("customerId")||"";const qCustomer=params.get("kunde")||"";
   const customerOption=await loadEntity("kunden",qCustomerId||qCustomer);if(active&&customerOption){const d=customerDefaults(customerOption);setCustomerId(customerOption.id);setCustomer(customerOption.label);setEmail(String(d.email||""));setCustomerAddress([d.address,d.zipCity].filter(Boolean).join(", "));setCustomerContact(String(d.contact||""));setCustomerLanguage(String(d.language||"Deutsch"));setDiscount(Number(d.discount||0))}
   const qProjectId=params.get("projectId")||"";const qProject=params.get("projekt")||"";const projectOption=await loadEntity("projekte",qProjectId||qProject);if(active&&projectOption){setProjectId(projectOption.id);setIntro(v=>`${v}\n\nProjekt: ${projectOption.label}`)}
   const qDesc=params.get("beschreibung");const qAmount=params.get("betrag");if(active&&isInvoice&&qDesc&&qAmount)setPositions([{description:qDesc||"Weiterverrechnete Spese",quantity:1,unitPrice:Number(qAmount||0),vatRate:Number(st.defaultVat||8.1)}]);
   const productOptions=await loadEntityOptions("produkte");if(active)setProducts(productOptions);
 })()},0);return()=>{active=false;window.clearTimeout(timer)}},[isInvoice]);
 const totals=useMemo(()=>{const baseNet=positions.reduce((s,p)=>s+p.quantity*p.unitPrice,0);const factor=Math.max(0,1-discount/100);const net=baseNet*factor;const vat=positions.reduce((s,p)=>s+p.quantity*p.unitPrice*p.vatRate/100,0)*factor;return {baseNet,net,vat,gross:net+vat}},[positions,discount]);
 const filteredProducts=products.filter(p=>`${p.label} ${p.sub||""}`.toLowerCase().includes(productQuery.toLowerCase())).slice(0,8);
 function chooseCustomer(option:EntityOption|undefined){
   setDirty(true);
   if(!option){setCustomerId("");setCustomer("");setEmail("");setCustomerAddress("");setCustomerContact("");return}
   const d=customerDefaults(option);setCustomerId(option.id);setCustomer(option.label);setEmail(String(d.email||""));setCustomerAddress([d.address,d.zipCity].filter(Boolean).join(", "));setCustomerContact(String(d.contact||""));setCustomerLanguage(String(d.language||"Deutsch"));setDiscount(Number(d.discount||0));
 }
 function addProduct(option:EntityOption){
   const d=productDefaults(option);setDirty(true);setPositions(v=>[...v,{description:String(d.description||option.label),quantity:1,unitPrice:Number(d.unitPrice||0),vatRate:Number(d.vatRate||8.1)}]);setProductQuery("");
 }
 async function importBillables(){
   if(!projectId){notify("Bitte zuerst ein Projekt auswählen.","warning");return}
   const {times,expenses}=isProductionMode()?{times:(await listAppRecords("zeiterfassung")).filter(r=>((r.meta?.relations as Record<string,string>|undefined)||{}).projectId===projectId&&(r.fields["Verrechenbar"]||"Ja")==="Ja"&&!Boolean(r.meta?.invoicedBy)),expenses:(await listAppRecords("spesen")).filter(r=>((r.meta?.relations as Record<string,string>|undefined)||{}).projectId===projectId&&(r.fields["Weiterverrechenbar"]||"Nein")==="Ja"&&!Boolean(r.meta?.invoicedBy))}:billableProjectEntries(projectId);
   if(!times.length&&!expenses.length){notify("Keine unverrechneten Zeiten oder Spesen vorhanden.","info");return}
   const imported=[
     ...times.map(t=>({description:`${t.fields["Leistung"]||t.row[2]||"Arbeitszeit"} · ${t.fields["Datum"]||t.row[0]}`,quantity:Number(String(t.fields["Dauer in Stunden"]||t.row[3]||"0").replace(/[^0-9.,]/g,"").replace(",","."))||0,unitPrice:180,vatRate:Number(settings.defaultVat||8.1)})),
     ...expenses.map(e=>({description:`Spese · ${e.fields["Beschreibung"]||e.row[1]||"Spese"}`,quantity:1,unitPrice:Number(String(e.fields["Betrag CHF"]||e.row[3]||"0").replace(/[^0-9.,]/g,"").replace(",", "."))||0,vatRate:Number(settings.defaultVat||8.1)}))
   ];
   setPositions(v=>[...v,...imported]);setDirty(true);notify(`${imported.length} verrechenbare Positionen übernommen.`);
 }
 function validate(){
   if(!customer.trim()||!email.trim()){setFormError("Bitte prüfen Sie die markierten Pflichtfelder.");notify("Kunde und E-Mail sind erforderlich.","danger");return false}
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setFormError("Ungültige E-Mail-Adresse.");notify("Ungültige E-Mail-Adresse.","danger");return false}
   if(!positions.length||positions.some(p=>!p.description.trim()||p.quantity<=0||p.unitPrice<0)){setFormError("Bitte Positionen vollständig ausfüllen.");notify("Bitte Positionen vollständig ausfüllen.","danger");return false}
   setFormError("");return true;
 }
 async function cancelEditor(){if(!dirty){window.history.back();return}const ok=await confirmAction({title:"Möchten Sie wirklich abbrechen?",message:"Nicht gespeicherte Änderungen gehen verloren.",confirmLabel:"Abbrechen",cancelLabel:"Fortfahren",tone:"danger"});if(ok){setDirty(false);window.history.back()}}
 async function save(status='Entwurf'){
   if(!validate()) return;
   const input={module:isInvoice?'rechnungen' as const:'offerten' as const,status,row:[number,customer,isInvoice?due:date,money(totals.gross),status],fields:{Nummer:number,Kunde:customer,'E-Mail':email,Datum:date,[isInvoice?'Fällig':'Gültig bis']:due,Betrag:money(totals.gross),Status:status,Einleitung:intro,Rabatt:`${discount} %`},positions,meta:{net:totals.net,vat:totals.vat,gross:totals.gross,discount,relations:{customerId,projectId},customerSnapshot:{address:customerAddress,contact:customerContact,email,language:customerLanguage}}};
   const {module:recordModule,...patch}=input;const rec=savedId?(await updateAppRecord(savedId,patch)):(await createAppRecord({...patch,module:recordModule}));if(!rec)throw new Error("Dokument konnte nicht gespeichert werden.");setSavedId(rec.id);
   if(isInvoice&&projectId){const source=isProductionMode()?{times:(await listAppRecords("zeiterfassung")).filter(r=>((r.meta?.relations as Record<string,string>|undefined)||{}).projectId===projectId&&!Boolean(r.meta?.invoicedBy)),expenses:(await listAppRecords("spesen")).filter(r=>((r.meta?.relations as Record<string,string>|undefined)||{}).projectId===projectId&&!Boolean(r.meta?.invoicedBy))}:billableProjectEntries(projectId);await Promise.all([...source.times,...source.expenses].map(r=>updateAppRecord(r.id,{meta:{...(r.meta||{}),invoicedBy:rec.id}})))}
   setDirty(false);notify(`${isInvoice?'Rechnung':'Offerte'} gespeichert.`);return rec;
 }
 async function send(){if(!validate())return;try{await save(isInvoice?'Offen':'Versendet');if(isProductionMode()){const subject=`${isInvoice?'Rechnung':'Offerte'} ${number} – ${settings.companyName}`;const message=`Guten Tag\n\nIm Anhang/Portal erhalten Sie unsere ${isInvoice?'Rechnung':'Offerte'} ${number}.\n\nFreundliche Grüsse\n${settings.companyName}`;const result=await apiFetch<{delivered:boolean}>("/api/email/document",{method:"POST",body:JSON.stringify({module:isInvoice?'rechnungen':'offerten',to:email,subject,message,number})});notify(result.delivered?`${isInvoice?'Rechnung':'Offerte'} wurde per E-Mail versendet.`:"Dokument gespeichert. E-Mail-Versand ist noch nicht konfiguriert.",result.delivered?"success":"info")}else notify(`${isInvoice?'Rechnung':'Offerte'} wurde im Demo-Modus an ${email} versendet.`);setSendOpen(false)}catch(e){notify(e instanceof Error?e.message:"Versand fehlgeschlagen.","danger")}}
 function printDoc(){setPreview(true); setTimeout(()=>window.print(),120)}
 const renderDocument=()=> <div className="document-paper print-document">
   <div className="doc-brand"><strong>{settings.companyName}</strong><span>{settings.address} · {settings.zipCity}</span></div>
   <div className="doc-address"><small>{settings.companyName} · {settings.address} · {settings.zipCity}</small><strong>{customer}</strong>{customerContact&&<span>z.H. {customerContact}</span>}<span>{customerAddress||"Schweiz"}</span></div>
   <div className="doc-title"><div><h2>{isInvoice?'Rechnung':'Offerte'}</h2><strong>{number}</strong></div><div><span>Datum</span><strong>{date}</strong><span>{isInvoice?'Fällig':'Gültig bis'}</span><strong>{due}</strong></div></div>
   <p className="doc-intro">{intro}</p>
   <div className="doc-positions"><div className="doc-pos-head"><span>Beschreibung</span><span>Menge</span><span>Preis</span><span>MWST</span><span>Total</span></div>{positions.map((p,i)=><div className="doc-pos" key={i}><span>{p.description||'Position'}</span><span>{p.quantity}</span><span>{money(p.unitPrice)}</span><span>{p.vatRate}%</span><span>{money(p.quantity*p.unitPrice)}</span></div>)}</div>
   <div className="doc-totals"><div><span>Zwischentotal</span><strong>{money(totals.baseNet)}</strong></div>{discount>0&&<div><span>Rabatt {discount}%</span><strong>- {money(totals.baseNet-totals.net)}</strong></div>}<div><span>MWST</span><strong>{money(totals.vat)}</strong></div><div className="doc-grand"><span>Total</span><strong>{money(totals.gross)}</strong></div></div>
   {isInvoice && <div className="qr-demo"><div className="qr-box">QR</div><div><strong>Schweizer QR-Zahlteil · Demo</strong><span>IBAN {settings.iban}</span><span>Zahlbar bis {due}</span><span>Referenz DEMO-{number.replaceAll('-','')}</span></div></div>}
   <div className="doc-footer"><span>{settings.companyName}</span><span>{settings.uid}</span><span>{settings.email} · {settings.phone}</span></div>
 </div>;
 return <div className="page document-editor-page">
  <div className="form-title-row"><button type="button" className="back-link button-link" onClick={cancelEditor}><ArrowLeft size={17}/> Zurück</button><div className="document-editor-heading"><div><div className="eyebrow">{isInvoice?'Verkauf / Rechnung':'Verkauf / Offerte'}</div><h1>{isInvoice?'Rechnung erstellen':'Offerte erstellen'}</h1><p>Erstellen, prüfen, als PDF drucken und direkt versenden.</p></div><div className="document-top-actions"><button onClick={()=>save()}><Save size={17}/> Entwurf</button><button onClick={()=>setPreview(true)}><Eye size={17}/> Vorschau</button><button className="primary-inline" onClick={()=>setSendOpen(true)}><Send size={17}/> Versenden</button></div></div></div>
  {formError&&<div className="form-error-summary">{formError}</div>}<div className="document-editor-grid">
   <section className="workspace-card editor-main">
    <div className="section-title"><h2>Empfänger und Angaben</h2><span>{isProductionMode()?"Geschäftsdaten":"Demo-Daten"}</span></div>
    <div className="form-grid"><div><RelationshipPicker module="kunden" label="Kunde" value={customerId} onChange={chooseCustomer} required createHref="/kunden/neu"/><small className="field-help">{customerContact||customerAddress||"Gespeicherten Kunden suchen oder neu erstellen."}</small></div><label><span>E-Mail *</span><input required value={email} onChange={e=>{setDirty(true);setEmail(e.target.value)}} type="email"/></label><label><span>Datum</span><input type="date" value={date} onChange={e=>{setDirty(true);setDate(e.target.value)}}/></label><label><span>{isInvoice?'Fällig':'Gültig bis'}</span><input type="date" value={due} onChange={e=>{setDirty(true);setDue(e.target.value)}}/></label><div><RelationshipPicker module="projekte" label="Projekt / Bezug" value={projectId} onChange={o=>{setDirty(true);setProjectId(o?.id||"")}} createHref="/projekte/neu"/></div><label><span>Kundensprache</span><input value={customerLanguage} onChange={e=>{setDirty(true);setCustomerLanguage(e.target.value)}}/></label><label><span>Rabatt %</span><input type="number" min="0" max="100" step="0.1" value={discount} onChange={e=>{setDirty(true);setDiscount(Number(e.target.value))}}/></label><label className="full"><span>Einleitung</span><textarea rows={3} value={intro} onChange={e=>{setDirty(true);setIntro(e.target.value)}}/></label></div>
    <div className="section-title positions-title"><h2>Positionen</h2><button type="button" onClick={()=>{setDirty(true);setPositions(p=>[...p,{description:'',quantity:1,unitPrice:0,vatRate:8.1}])}}><Plus size={16}/> Position</button></div>
    <div className="document-relation-tools"><div className="product-lookup"><Search size={16}/><input value={productQuery} onChange={e=>setProductQuery(e.target.value)} placeholder="Produkte und Leistungen suchen …"/>{productQuery&&<div className="product-results">{filteredProducts.map(option=><button type="button" key={option.id} onClick={()=>addProduct(option)}><strong>{option.label}</strong><small>{option.fields["Preis CHF"]||option.sub}</small></button>)}</div>}</div>{isInvoice&&<button type="button" className="secondary-button compact-action" onClick={importBillables}><Clock3 size={16}/><ReceiptText size={16}/> Zeit und Spesen übernehmen</button>}</div><div className="positions-editor document-positions-editor"><div className="position-labels"><span>Beschreibung</span><span>Menge</span><span>Einzelpreis</span><span>MWST</span><span/></div>{positions.map((p,index)=><div className="position-row document-position-row" key={index}><input value={p.description} onChange={e=>{setDirty(true);setPositions(x=>x.map((v,i)=>i===index?{...v,description:e.target.value}:v))}}/><input type="number" step="0.01" value={p.quantity} onChange={e=>{setDirty(true);setPositions(x=>x.map((v,i)=>i===index?{...v,quantity:Number(e.target.value)}:v))}}/><input type="number" step="0.05" value={p.unitPrice} onChange={e=>{setDirty(true);setPositions(x=>x.map((v,i)=>i===index?{...v,unitPrice:Number(e.target.value)}:v))}}/><select value={p.vatRate} onChange={e=>{setDirty(true);setPositions(x=>x.map((v,i)=>i===index?{...v,vatRate:Number(e.target.value)}:v))}}><option value={8.1}>8.1 %</option><option value={2.6}>2.6 %</option><option value={3.8}>3.8 %</option><option value={0}>0 %</option></select><button className="icon-button" onClick={()=>{setDirty(true);setPositions(x=>x.filter((_,i)=>i!==index))}}><Trash2 size={16}/></button></div>)}</div>
    <div className="editor-totals"><div><span>Brutto Positionen</span><strong>{money(totals.baseNet)}</strong></div>{discount>0&&<div><span>Rabatt</span><strong>- {money(totals.baseNet-totals.net)}</strong></div>}<div><span>Netto</span><strong>{money(totals.net)}</strong></div><div><span>MWST</span><strong>{money(totals.vat)}</strong></div><div><span>Total</span><strong>{money(totals.gross)}</strong></div></div>
   </section>
   <aside className="editor-side document-side"><div className="workspace-card side-card live-preview-card"><div className="section-title"><h3>Live-Vorschau</h3><button className="text-icon-button" onClick={()=>setPreview(true)}><Eye size={16}/></button></div><div className="mini-document">{renderDocument()}</div></div><div className="workspace-card side-card"><h3>Aktionen</h3><button className="primary-button" onClick={()=>setSendOpen(true)}><Mail size={17}/> Versenden</button><button className="secondary-button" onClick={printDoc}><Printer size={17}/> Drucken / PDF</button><button className="secondary-button" onClick={()=>save()}><Check size={17}/> Entwurf speichern</button></div></aside>
  </div>
  {preview&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setPreview(false)}}><div className="document-modal" role="dialog" aria-modal="true" aria-labelledby="document-preview-title"><div className="modal-toolbar"><div className="modal-toolbar-title"><strong id="document-preview-title">Dokumentvorschau</strong><small>A4 · Druckansicht</small></div><div className="modal-toolbar-actions"><button onClick={printDoc}><Printer size={17}/><span className="preview-print-label">Drucken / PDF</span></button><button className="icon-only" onClick={()=>setPreview(false)} aria-label="Schliessen"><X size={18}/></button></div></div><div className="modal-document-scroll">{renderDocument()}</div></div></div>}
  {sendOpen&&<div className="modal-backdrop"><div className="send-modal"><div className="section-title"><h2>Versand</h2><button className="text-icon-button" onClick={()=>setSendOpen(false)}><X size={18}/></button></div><p>{isProductionMode()?"Das Dokument wird gespeichert und über den konfigurierten E-Mail-Dienst versendet.":"Der Versand wird lokal simuliert. Es wird keine echte E-Mail versendet."}</p><label><span>Empfänger</span><input value={email} onChange={e=>{setDirty(true);setEmail(e.target.value)}} type="email"/></label><label><span>Betreff</span><input defaultValue={`${isInvoice?'Rechnung':'Offerte'} ${number} – ${settings.companyName}`}/></label><label><span>Nachricht</span><textarea rows={5} defaultValue={`Guten Tag

Im Anhang erhalten Sie unsere ${isInvoice?'Rechnung':'Offerte'} ${number}.

Freundliche Grüsse
${settings.companyName}`}/></label><div className="send-actions"><button onClick={()=>setSendOpen(false)}>Abbrechen</button><button className="primary-inline" onClick={send}><Send size={17}/> {isProductionMode()?"Versenden":"Demo-Versand ausführen"}</button></div></div></div>}
 </div>
}
