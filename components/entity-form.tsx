"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Paperclip } from "lucide-react";
import { getModule, type ModuleKey } from "@/lib/modules";
import { ensureSeedOverride, listLocalRecords, parseMoney } from "@/lib/local-store";
import { createAppRecord, getAppRecord, updateAppRecord } from "@/lib/client/data-service";
import { isProductionMode } from "@/lib/client/runtime";
import { notify } from "@/lib/notify";
import { confirmAction } from "@/lib/confirm";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import RelationshipPicker from "@/components/relationship-picker";
import { customerDefaults, findEntity, supplierDefaults, type EntityOption } from "@/lib/relationships";
import { usePermissions } from "@/lib/client/use-permissions";

type RelationDef={module:ModuleKey;relationKey:string;createHref?:string};
type Def={name:string;label:string;type?:string;placeholder?:string;options?:string[];required?:boolean;full?:boolean;defaultValue?:string;relation?:RelationDef};
type FormDef={module:ModuleKey;fields:Def[];row:(v:Record<string,string>)=>string[]};
const today=()=>new Date().toISOString().slice(0,10);

const map:Record<string,FormDef>={
 Kunde:{module:"kunden",fields:[
  {name:"firma",label:"Firmenname",required:true},{name:"kontakt",label:"Kontaktperson",required:true},{name:"email",label:"E-Mail",type:"email",required:true},{name:"telefon",label:"Telefon"},
  {name:"adresse",label:"Strasse und Nr."},{name:"ort",label:"PLZ / Ort"},{name:"uid",label:"UID"},{name:"sprache",label:"Sprache",options:["Deutsch","FranÃ§ais","Italiano","English"],defaultValue:"Deutsch"},
  {name:"zahlungsfrist",label:"Zahlungsfrist",type:"number",defaultValue:"30"},{name:"rabatt",label:"Rabatt %",type:"number",defaultValue:"0"},{name:"notiz",label:"Notiz",full:true},{name:"status",label:"Status",options:["Aktiv","Interessent","Inaktiv"],defaultValue:"Aktiv"}
 ],row:v=>[v.firma,v.kontakt,v.email,"CHF 0",v.status]},
 Auftrag:{module:"auftraege",fields:[
  {name:"bezeichnung",label:"Auftragsbezeichnung",required:true},{name:"kunde",label:"Kunde",required:true,relation:{module:"kunden",relationKey:"customerId",createHref:"/kunden/neu"}},{name:"projekt",label:"Projekt",relation:{module:"projekte",relationKey:"projectId",createHref:"/projekte/neu"}},
  {name:"volumen",label:"Auftragsvolumen",type:"number",defaultValue:"0"},{name:"start",label:"Start",type:"date",defaultValue:today()},{name:"ende",label:"Geplantes Ende",type:"date"},{name:"status",label:"Status",options:["Bereit","In Arbeit","Abgeschlossen","Storniert"],defaultValue:"Bereit"},{name:"notiz",label:"Notiz",full:true}
 ],row:v=>[v.bezeichnung,v.kunde,v.projekt||"â€“",`CHF ${Number(v.volumen||0).toLocaleString("de-CH")}`,v.status]},
 Projekt:{module:"projekte",fields:[
  {name:"bezeichnung",label:"Projektname",required:true},{name:"kunde",label:"Kunde",required:true,relation:{module:"kunden",relationKey:"customerId",createHref:"/kunden/neu"}},{name:"projektleitung",label:"Projektleitung",relation:{module:"personal",relationKey:"managerId",createHref:"/personal/neu"}},{name:"team",label:"Team / Ressourcen"},
  {name:"budget",label:"Budget",type:"number",defaultValue:"0"},{name:"stundenbudget",label:"Stundenbudget",type:"number",defaultValue:"0"},{name:"fortschritt",label:"Fortschritt %",type:"number",defaultValue:"0"},{name:"start",label:"Start",type:"date",defaultValue:today()},{name:"ende",label:"Ende",type:"date"},{name:"status",label:"Status",options:["Geplant","In Arbeit","Laufend","Blockiert","Abgeschlossen"],defaultValue:"Geplant"},{name:"notiz",label:"Projektbeschreibung",full:true}
 ],row:v=>[v.bezeichnung,v.kunde,`${v.fortschritt||0} %`,`CHF ${Number(v.budget||0).toLocaleString("de-CH")}`,v.status]},
 Zeiteintrag:{module:"zeiterfassung",fields:[
  {name:"datum",label:"Datum",type:"date",required:true,defaultValue:today()},{name:"mitarbeiter",label:"Mitarbeiter",required:true,relation:{module:"personal",relationKey:"employeeId",createHref:"/personal/neu"}},{name:"projekt",label:"Projekt",required:true,relation:{module:"projekte",relationKey:"projectId",createHref:"/projekte/neu"}},{name:"leistung",label:"Leistung",required:true,relation:{module:"produkte",relationKey:"productId",createHref:"/produkte/neu"}},
  {name:"von",label:"Von",type:"time",defaultValue:"08:00"},{name:"bis",label:"Bis",type:"time",defaultValue:"17:00"},{name:"pause",label:"Pause Minuten",type:"number",defaultValue:"60"},{name:"dauer",label:"Dauer in Stunden",type:"number",required:true,defaultValue:"8"},{name:"verrechenbar",label:"Verrechenbar",options:["Ja","Nein"],defaultValue:"Ja"},{name:"status",label:"Status",options:["Entwurf","Freigegeben"],defaultValue:"Entwurf"},{name:"notiz",label:"Notiz",full:true}
 ],row:v=>[v.datum,v.projekt,v.leistung,`${v.dauer} h`,v.status]},
 Spese:{module:"spesen",fields:[
  {name:"datum",label:"Datum",type:"date",defaultValue:today()},{name:"mitarbeiter",label:"Mitarbeiter",required:true,relation:{module:"personal",relationKey:"employeeId",createHref:"/personal/neu"}},{name:"beschreibung",label:"Beschreibung",required:true},{name:"projekt",label:"Projekt",relation:{module:"projekte",relationKey:"projectId",createHref:"/projekte/neu"}},{name:"betrag",label:"Betrag CHF",type:"number",required:true},
  {name:"kategorie",label:"Kategorie",options:["Reise","Verpflegung","Material","Software","Fahrzeug","Sonstiges"]},{name:"weiterverrechenbar",label:"Weiterverrechenbar",options:["Ja","Nein"],defaultValue:"Nein"},{name:"status",label:"Status",options:["Offen","Freigegeben","Verbucht","Abgelehnt"],defaultValue:"Offen"},{name:"beleg",label:"Beleg",type:"file",full:true}
 ],row:v=>[v.datum,v.beschreibung,v.projekt||"â€“",`CHF ${Number(v.betrag||0).toFixed(2)}`,v.status]},
 Zahlung:{module:"zahlungen",fields:[
  {name:"datum",label:"Datum",type:"date",defaultValue:today()},{name:"zahler",label:"Zahler",required:true,relation:{module:"kunden",relationKey:"customerId"}},{name:"referenz",label:"Referenz",required:true},{name:"betrag",label:"Betrag CHF",type:"number",required:true},{name:"rechnung",label:"Rechnung",relation:{module:"rechnungen",relationKey:"invoiceId"}},
  {name:"art",label:"Zahlungsart",options:["Bank","Bar","Karte","TWINT","Sonstiges"],defaultValue:"Bank"},{name:"status",label:"Zuordnung",options:["Zugeordnet","Teilzugeordnet","Offen"],defaultValue:"Zugeordnet"}
 ],row:v=>[v.datum,v.zahler,v.referenz,`CHF ${Number(v.betrag||0).toFixed(2)}`,v.status]},
 Lieferant:{module:"lieferanten",fields:[
  {name:"firma",label:"Firmenname",required:true},{name:"kontakt",label:"Kontaktperson"},{name:"email",label:"E-Mail",type:"email"},{name:"telefon",label:"Telefon"},{name:"adresse",label:"Adresse"},{name:"iban",label:"IBAN"},{name:"zahlungsfrist",label:"Zahlungsfrist",type:"number",defaultValue:"30"},{name:"status",label:"Status",options:["Aktiv","Inaktiv"],defaultValue:"Aktiv"}
 ],row:v=>[v.firma,v.kontakt||"â€“",v.email||"â€“","CHF 0",v.status]},
 Eingangsrechnung:{module:"eingangsrechnungen",fields:[
  {name:"nummer",label:"Rechnungsnummer",required:true},{name:"lieferant",label:"Lieferant",required:true,relation:{module:"lieferanten",relationKey:"supplierId",createHref:"/lieferanten/neu"}},{name:"datum",label:"Datum",type:"date",defaultValue:today()},{name:"faellig",label:"FÃ¤llig",type:"date"},{name:"betrag",label:"Betrag CHF",type:"number",required:true},{name:"konto",label:"Aufwandskonto",defaultValue:"6500 BÃ¼roaufwand"},{name:"status",label:"Status",options:["Entwurf","Zur Freigabe","Freigegeben","Bezahlt","ÃœberfÃ¤llig"],defaultValue:"Entwurf"},{name:"beleg",label:"Beleg",type:"file",full:true}
 ],row:v=>[v.nummer,v.lieferant,v.faellig||v.datum,`CHF ${Number(v.betrag||0).toFixed(2)}`,v.status]},
 Leistung:{module:"produkte",fields:[
  {name:"bezeichnung",label:"Bezeichnung",required:true},{name:"typ",label:"Typ",options:["Leistung","Artikel"],defaultValue:"Leistung"},{name:"einheit",label:"Einheit",options:["Stunde","Pauschale","StÃ¼ck","Tag","Monat"],defaultValue:"Stunde"},{name:"preis",label:"Preis CHF",type:"number",required:true},{name:"mwst",label:"MWST %",type:"number",defaultValue:"8.1"},{name:"status",label:"Status",options:["Aktiv","Inaktiv"],defaultValue:"Aktiv"}
 ],row:v=>[v.bezeichnung,v.typ,v.einheit,`CHF ${Number(v.preis||0).toFixed(2)}`,v.status]},
 Buchung:{module:"buchhaltung",fields:[
  {name:"datum",label:"Datum",type:"date",defaultValue:today()},{name:"beleg",label:"Beleg",required:true},{name:"konto",label:"Konto",required:true},{name:"gegenkonto",label:"Gegenkonto",defaultValue:"1020 Bank"},{name:"betrag",label:"Betrag CHF",type:"number",required:true},{name:"status",label:"Status",options:["Entwurf","Verbucht"],defaultValue:"Entwurf"}
 ],row:v=>[v.datum,v.beleg,v.konto,`CHF ${Number(v.betrag||0).toFixed(2)}`,v.status]},
 Aufgabe:{module:"aufgaben",fields:[
  {name:"aufgabe",label:"Aufgabe",required:true},{name:"kunde",label:"Kunde",relation:{module:"kunden",relationKey:"customerId"}},{name:"projekt",label:"Projekt",relation:{module:"projekte",relationKey:"projectId"}},{name:"rechnung",label:"Rechnung",relation:{module:"rechnungen",relationKey:"invoiceId"}},{name:"faellig",label:"FÃ¤llig",type:"date"},{name:"verantwortlich",label:"Verantwortlich",relation:{module:"personal",relationKey:"employeeId"}},{name:"prioritaet",label:"PrioritÃ¤t",options:["Normal","Hoch","Kritisch"],defaultValue:"Normal"},{name:"status",label:"Status",options:["Offen","In Arbeit","Erledigt"],defaultValue:"Offen"}
 ],row:v=>[v.aufgabe,v.projekt||v.kunde||v.rechnung||"Intern",v.faellig||"â€“",v.verantwortlich||"â€“",v.status]},
 Abwesenheit:{module:"abwesenheiten",fields:[
  {name:"mitarbeiter",label:"Mitarbeiter",required:true,relation:{module:"personal",relationKey:"employeeId",createHref:"/personal/neu"}},{name:"art",label:"Art",options:["Ferien","Krankheit","Unbezahlt","MilitÃ¤r/Zivildienst","Andere"],defaultValue:"Ferien"},{name:"von",label:"Von",type:"date",required:true},{name:"bis",label:"Bis",type:"date",required:true},{name:"tage",label:"Tage",type:"number",defaultValue:"1"},{name:"status",label:"Status",options:["Offen","Genehmigt","Abgelehnt"],defaultValue:"Offen"}
 ],row:v=>[v.mitarbeiter,v.art,`${v.von}â€“${v.bis}`,v.tage,v.status]},
 Dokument:{module:"dokumente",fields:[
  {name:"name",label:"Dokumentname",required:true},{name:"typ",label:"Typ",options:["Vertrag","Rechnung","Richtlinie","Personal","Projekt","Andere"],defaultValue:"Andere"},{name:"kunde",label:"Kunde",relation:{module:"kunden",relationKey:"customerId"}},{name:"projekt",label:"Projekt",relation:{module:"projekte",relationKey:"projectId"}},{name:"mitarbeiter",label:"Mitarbeiter",relation:{module:"personal",relationKey:"employeeId"}},{name:"lieferant",label:"Lieferant",relation:{module:"lieferanten",relationKey:"supplierId"}},{name:"datum",label:"Aktualisiert",type:"date",defaultValue:today()},{name:"status",label:"Status",options:["Aktuell","Archiviert"],defaultValue:"Aktuell"},{name:"beleg",label:"Datei",type:"file",full:true}
 ],row:v=>[v.name,v.typ,v.projekt||v.kunde||v.mitarbeiter||v.lieferant||"Firma",v.datum,v.status]},
 Vertrag:{module:"vertraege",fields:[
  {name:"vertrag",label:"Vertrag",required:true},{name:"kunde",label:"Kunde",relation:{module:"kunden",relationKey:"customerId"}},{name:"lieferant",label:"Lieferant",relation:{module:"lieferanten",relationKey:"supplierId"}},{name:"start",label:"Start",type:"date"},{name:"ende",label:"Ende",type:"date"},{name:"wert",label:"Wert CHF",type:"number"},{name:"intervall",label:"Intervall",options:["Einmalig","Monatlich","JÃ¤hrlich"],defaultValue:"JÃ¤hrlich"},{name:"wiederkehrend",label:"Rechnung automatisch vorbereiten",options:["Nein","Ja"],defaultValue:"Nein"},{name:"status",label:"Status",options:["Entwurf","Aktiv","GekÃ¼ndigt","Abgelaufen"],defaultValue:"Aktiv"}
 ],row:v=>[v.vertrag,v.kunde||v.lieferant||"â€“",v.ende?`${v.start}â€“${v.ende}`:v.intervall,`CHF ${Number(v.wert||0).toFixed(2)}`,v.status]},
 Mitarbeiter:{module:"personal",fields:[
  {name:"name",label:"Name",required:true},{name:"funktion",label:"Funktion",required:true},{name:"email",label:"E-Mail",type:"email"},{name:"telefon",label:"Telefon"},{name:"adresse",label:"Adresse"},{name:"ahv",label:"AHV-Nr."},{name:"iban",label:"IBAN"},{name:"pensum",label:"Pensum %",type:"number",defaultValue:"100"},{name:"wochenstunden",label:"Wochenstunden",type:"number",defaultValue:"42"},{name:"ferien",label:"Ferientage / Jahr",type:"number",defaultValue:"25"},{name:"eintritt",label:"Eintritt",type:"date",defaultValue:today()},{name:"brutto",label:"Monatslohn brutto CHF",type:"number"},{name:"kinderzulage",label:"Kinderzulage CHF",type:"number",defaultValue:"0"},{name:"quellensteuer",label:"Quellensteuer %",type:"number",defaultValue:"0"},{name:"bvg",label:"BVG Abzug CHF",type:"number",defaultValue:"300"},{name:"status",label:"Status",options:["Aktiv","Inaktiv","Ausgetreten"],defaultValue:"Aktiv"}
 ],row:v=>[v.name,v.funktion,`${v.pensum}%`,v.eintritt,v.status]}
};

export default function EntityForm({ title, backHref, type }: { title: string; backHref: string; type: string }) {
 const router=useRouter();
 const permissions=usePermissions();
 const cfg=map[type];
 const initial=useMemo(()=>Object.fromEntries((cfg?.fields||[]).map(f=>[f.name,f.defaultValue||""])),[cfg]);
 const [values,setValues]=useState<Record<string,string>>(initial);
 const [relations,setRelations]=useState<Record<string,string>>({});
 const [fileData,setFileData]=useState("");
 const [dirty,setDirty]=useState(false);
 const [errors,setErrors]=useState<Record<string,string>>({});
 useUnsavedChanges(dirty);
 useEffect(()=>{if(permissions.ready&&cfg&&!permissions.canModule(cfg.module,"write"))router.replace("/forbidden")},[permissions,cfg,router]);

 useEffect(()=>{
   if(!cfg) return;
   const timer=window.setTimeout(()=>{
     const params=new URLSearchParams(window.location.search);
     const next:Record<string,string>={...initial};
     const nextRelations:Record<string,string>={};
     for(const field of cfg.fields){
       const raw=params.get(field.name)||params.get(field.relation?.relationKey||"");
       if(!raw) continue;
       if(field.relation){
         const option=findEntity(field.relation.module,raw);
         if(option){next[field.name]=option.label;nextRelations[field.relation.relationKey]=option.id}
       }else next[field.name]=raw;
     }
     const customer=params.get("customerId")||params.get("kunde");
     if(customer){
       const option=findEntity("kunden",customer);
       const defaults=customerDefaults(option);
       if(option){next.kunde=option.label;nextRelations.customerId=option.id}
       if(type==="Kunde"&&defaults.customerName) next.firma=String(defaults.customerName);
     }
     const supplier=params.get("supplierId")||params.get("lieferant");
     if(supplier){
       const option=findEntity("lieferanten",supplier);
       if(option){next.lieferant=option.label;nextRelations.supplierId=option.id}
     }
     setValues(next);setRelations(nextRelations);
   },0);
   return()=>window.clearTimeout(timer);
 },[cfg,initial,type]);

 if(!cfg) return <div className="page"><h1>{title}</h1><p>FÃ¼r diesen Datentyp ist kein lokales Formular konfiguriert.</p></div>;

 function onFile(file?:File){
   if(!file)return;
   if(file.size>1_500_000){notify("FÃ¼r die lokale Demo sind Belege bis 1.5 MB erlaubt.","info");return}
   const reader=new FileReader();setDirty(true);
   reader.onload=()=>setFileData(String(reader.result||""));
   reader.readAsDataURL(file);
   setValues(v=>({...v,beleg:file.name}));
 }

 function setRelation(field:Def,option:EntityOption|undefined){
   setDirty(true);setErrors(x=>({...x,[field.name]:""}));
   setValues(v=>({...v,[field.name]:option?.label||""}));
   if(field.relation){
     setRelations(r=>({...r,[field.relation!.relationKey]:option?.id||""}));
     if(field.relation.module==="kunden"&&option){
       setValues(v=>({...v,[field.name]:option.label,...(type==="Zahlung"?{zahler:option.label}:{}),...(type==="Projekt"||type==="Auftrag"?{kunde:option.label}:{})}));
       if(type==="Auftrag"||type==="Projekt") setRelations(r=>({...r,customerId:option.id}));
     }
     if(field.relation.module==="lieferanten"&&option){
       const d=supplierDefaults(option);
       if(type==="Eingangsrechnung"&&d.paymentDays && !values.faellig){
         const due=new Date();due.setDate(due.getDate()+Number(d.paymentDays||30));
         setValues(v=>({...v,lieferant:option.label,faellig:due.toISOString().slice(0,10)}));
       }
     }
   }
 }

 function validate(){
   const next:Record<string,string>={};
   for(const f of cfg.fields){
     const value=(values[f.name]||"").trim();
     if(f.required&&!value)next[f.name]="Dieses Feld ist erforderlich.";
     if(f.type==="email"&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))next[f.name]="UngÃ¼ltige E-Mail-Adresse.";
   }
   if(type==="Vertrag"&&!values.kunde&&!values.lieferant) next.kunde="Kunde oder Lieferant auswÃ¤hlen.";
   setErrors(next);return Object.keys(next).length===0;
 }

 async function cancel(){
   if(!dirty){router.push(backHref);return}
   const ok=await confirmAction({title:"MÃ¶chten Sie wirklich abbrechen?",message:"Nicht gespeicherte Ã„nderungen gehen verloren.",confirmLabel:"Abbrechen",cancelLabel:"Fortfahren",tone:"danger"});
   if(ok){setDirty(false);router.push(backHref)}
 }

 async function save(e:React.FormEvent){
   e.preventDefault();
   if(!validate()){notify("Bitte prÃ¼fen Sie die markierten Pflichtfelder.","danger");return}
   const row=cfg.row(values);
   const meta:Record<string,unknown>={relations};
   if(fileData)meta.belegDataUrl=fileData;
   if(type==="Vertrag")meta.recurring=values.wiederkehrend==="Ja";
   const rec=await createAppRecord({
     module:cfg.module,status:values.status||"Aktiv",row,
     fields:Object.fromEntries(cfg.fields.map(f=>[f.label,values[f.name]||""])),
     meta
   });

   if(type==="Zahlung"&&relations.invoiceId){
     let invoice=isProductionMode()?await getAppRecord(relations.invoiceId):listLocalRecords("rechnungen").find(r=>r.id===relations.invoiceId);
     if(!isProductionMode()&&!invoice&&relations.invoiceId.startsWith("seed:rechnungen:")){
       const seedId=relations.invoiceId.split(":").pop()||"1";
       const mod=getModule("rechnungen");const idx=Number(seedId)-1;const seedRow=mod.rows?.[idx];
       if(seedRow){invoice=ensureSeedOverride("rechnungen",seedId,seedRow,Object.fromEntries((mod.columns||[]).map((c,i)=>[c,seedRow[i]||""])))}
     }
     if(invoice){
       const gross=Number(invoice.meta?.gross||parseMoney(invoice.fields.Betrag||invoice.row[3]));
       const paid=Number(invoice.meta?.paidAmount||0)+Number(values.betrag||0);
       const status=paid>=gross?"Bezahlt":"Teilbezahlt";
       await updateAppRecord(invoice.id,{status,row:[...invoice.row.slice(0,4),status],fields:{...invoice.fields,Status:status},meta:{...(invoice.meta||{}),paidAmount:paid}});
     }
   }

   if(type==="Eingangsrechnung"&&(values.status==="Freigegeben"||values.status==="Bezahlt")){
     await createAppRecord({
       module:"buchhaltung",status:"Verbucht",
       row:[values.datum,values.nummer,values.konto||"6500 BÃ¼roaufwand",`CHF ${Number(values.betrag||0).toFixed(2)}`,"Verbucht"],
       fields:{Datum:values.datum,Beleg:values.nummer,Konto:values.konto||"6500 BÃ¼roaufwand",Gegenkonto:"2000 Kreditoren",Betrag:`CHF ${Number(values.betrag||0).toFixed(2)}`,Status:"Verbucht"},
       meta:{relations:{supplierInvoiceId:rec.id,supplierId:relations.supplierId||""}}
     });
   }

   setDirty(false);notify(`${type} wurde gespeichert.`);router.push(`${backHref}/${rec.id}`);
 }

 return <div className="page form-page">
  <div className="form-title-row"><button type="button" className="back-link button-link" onClick={cancel}><ArrowLeft size={17}/> ZurÃ¼ck</button><h1>{title}</h1><p>Gespeicherte Stammdaten werden verknÃ¼pft und in Folgeprozessen wiederverwendet.</p></div>
  <form className="editor-layout" onSubmit={save}>
   <section className="workspace-card editor-main">
    <div className="form-grid">{cfg.fields.map(f=><div key={f.name} className={f.full?"full":""}>
     {f.relation?<RelationshipPicker module={f.relation.module} label={f.label} value={relations[f.relation.relationKey]||""} onChange={o=>setRelation(f,o)} required={f.required} createHref={f.relation.createHref}/>:
      <label><span>{f.label}{f.required?" *":""}</span>{f.options?<select required={f.required} value={values[f.name]||""} onChange={e=>{setDirty(true);setErrors(x=>({...x,[f.name]:""}));setValues(v=>({...v,[f.name]:e.target.value}))}}>{f.options.map(o=><option key={o}>{o}</option>)}</select>:
      f.type==="file"?<div className="file-input"><Paperclip size={18}/><input type="file" accept="image/*,.pdf" onChange={e=>onFile(e.target.files?.[0])}/>{values.beleg&&<small>{values.beleg}</small>}</div>:
      f.full?<textarea rows={4} value={values[f.name]||""} onChange={e=>{setDirty(true);setErrors(x=>({...x,[f.name]:""}));setValues(v=>({...v,[f.name]:e.target.value}))}}/>:
      <input required={f.required} type={f.type||"text"} placeholder={f.placeholder} value={values[f.name]||""} onChange={e=>{setDirty(true);setErrors(x=>({...x,[f.name]:""}));setValues(v=>({...v,[f.name]:e.target.value}))}}/>}</label>}
     {errors[f.name]&&<small className="field-error">{errors[f.name]}</small>}
    </div>)}</div>
   </section>
   <aside className="editor-side"><div className="workspace-card side-card"><h3>Speichern</h3><p>Relationen werden als IDs gespeichert. Namen dienen nur der Anzeige.</p><button className="primary-button" type="submit"><Check size={17}/> Speichern</button><button type="button" className="secondary-button" onClick={cancel}>Abbrechen</button></div></aside>
  </form>
 </div>
}

