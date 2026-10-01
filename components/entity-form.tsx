"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Paperclip } from "lucide-react";
import { getModule } from "@/lib/modules";
import {getDemoModuleSeed} from "@/lib/demo/module-seeds";
import { ensureSeedOverride, listLocalRecords, money, parseMoney } from "@/lib/local-store";
import { createAppRecord, getAppRecord, updateAppRecord } from "@/lib/client/data-service";
import { isProductionMode } from "@/lib/client/runtime";
import { notify } from "@/lib/notify";
import { confirmAction } from "@/lib/confirm";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import RelationshipPicker from "@/components/relationship-picker";
import { customerDefaults, findEntity, supplierDefaults, type EntityOption } from "@/lib/relationships";
import { usePermissions } from "@/lib/client/use-permissions";
import {useLocale} from "@/components/locale-provider";
import {Button} from "@/components/ui/button";
import {getEntityFormDefinitions,type Def} from "@/config/entity-forms";
import {accountingDefaults} from "@/config/accounting";
import {domainConfig} from "@/config/domain";
import {limitsConfig,megabytes} from "@/config/limits";
import {Input,Select,Textarea} from "@/components/ui/form-controls";

export default function EntityForm({ title, backHref, type }: { title: string; backHref: string; type: string }) {
 const router=useRouter();
 const {t}=useLocale();
 const {ready:permissionsReady,canModule}=usePermissions();
 const definitions=useMemo(()=>getEntityFormDefinitions(),[]);
 const cfg=definitions[type];
 const initial=useMemo(()=>Object.fromEntries((cfg?.fields||[]).map(f=>[f.name,f.defaultValue||""])),[cfg]);
 const [values,setValues]=useState<Record<string,string>>(initial);
 const [relations,setRelations]=useState<Record<string,string>>({});
 const [fileData,setFileData]=useState("");
 const [dirty,setDirty]=useState(false);
 const [errors,setErrors]=useState<Record<string,string>>({});
 const [showAdvanced,setShowAdvanced]=useState(false);
 useUnsavedChanges(dirty);
 useEffect(()=>{if(permissionsReady&&cfg&&!canModule(cfg.module,"write"))router.replace("/forbidden")},[permissionsReady,canModule,cfg,router]);

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


 const essentialFields:Record<string,Set<string>>={
  Kunde:new Set(["firma"]),Lieferant:new Set(["firma"]),Projekt:new Set(["bezeichnung","kunde"]),Auftrag:new Set(["bezeichnung","kunde","projekt","volumen"]),Zeiteintrag:new Set(["datum","mitarbeiter","projekt","leistung","dauer"]),Spese:new Set(["datum","beschreibung","projekt","betrag"]),Zahlung:new Set(["datum","zahler","betrag","rechnung"]),Eingangsrechnung:new Set(["nummer","lieferant","datum","betrag"]),Leistung:new Set(["bezeichnung","typ","einheit","preis"]),Buchung:new Set(["datum","beleg","konto","betrag"]),Aufgabe:new Set(["aufgabe","projekt","faellig","verantwortlich"]),Abwesenheit:new Set(["mitarbeiter","art","von","bis"]),Dokument:new Set(["name","typ","beleg"]),Vertrag:new Set(["vertrag","kunde","lieferant","wert"]),Mitarbeiter:new Set(["name","funktion","email","pensum"])
 };
 const essentials=essentialFields[type]||new Set((cfg?.fields||[]).filter(f=>f.required).map(f=>f.name));
 const visibleFields=(cfg?.fields||[]).filter(f=>showAdvanced||essentials.has(f.name)||f.required);
 const advancedCount=Math.max(0,(cfg?.fields||[]).length-(cfg?.fields||[]).filter(f=>essentials.has(f.name)||f.required).length);

  if(!cfg) return <div className="page"><h1>{t(title)}</h1><p>{t("Für diesen Datentyp ist kein lokales Formular konfiguriert.")}</p></div>;

 function onFile(file?:File){
   if(!file)return;
   if(file.size>limitsConfig.maxDemoAttachmentBytes){notify(t("Für die lokale Demo sind Belege bis {size} MB erlaubt.").replace("{size}",String(megabytes(limitsConfig.maxDemoAttachmentBytes))),"info");return}
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
         const due=new Date();due.setDate(due.getDate()+Number(d.paymentDays||domainConfig.defaultPaymentDays));
         setValues(v=>({...v,lieferant:option.label,faellig:due.toISOString().slice(0,10)}));
       }
     }
   }
 }

 function validate(){
   const next:Record<string,string>={};
   for(const f of cfg.fields){
     const value=(values[f.name]||"").trim();
     if(f.required&&!value)next[f.name]=t("Dieses Feld ist erforderlich.");
     if(f.type==="email"&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))next[f.name]=t("Ungültige E-Mail-Adresse.");
   }
   if(type==="Vertrag"&&!values.kunde&&!values.lieferant) next.kunde=t("Kunde oder Lieferant auswählen.");
   setErrors(next);return Object.keys(next).length===0;
 }

 async function cancel(){
   if(!dirty){router.push(backHref);return}
   const ok=await confirmAction({title:t("Möchten Sie wirklich abbrechen?"),message:t("Nicht gespeicherte Änderungen gehen verloren."),confirmLabel:t("Abbrechen"),cancelLabel:t("Fortfahren"),tone:"danger"});
   if(ok){setDirty(false);router.push(backHref)}
 }

 async function save(e:React.FormEvent){
   e.preventDefault();
   if(!validate()){notify(t("Bitte prüfen Sie die markierten Pflichtfelder."),"danger");return}
   const row=cfg.row(values);
   const meta:Record<string,unknown>={relations};
   if(fileData)meta.belegDataUrl=fileData;
   if(type==="Vertrag")meta.recurring=values.wiederkehrend==="Ja";
   const rec=await createAppRecord({
     module:cfg.module,status:values.status||"Aktiv",row,
     fields:Object.fromEntries(cfg.fields.map(f=>[f.storageKey||f.label,values[f.name]||""])),
     meta
   });

   if(type==="Zahlung"&&relations.invoiceId){
     let invoice=isProductionMode()?await getAppRecord(relations.invoiceId):listLocalRecords("rechnungen").find(r=>r.id===relations.invoiceId);
     if(!isProductionMode()&&!invoice&&relations.invoiceId.startsWith("seed:rechnungen:")){
       const seedId=relations.invoiceId.split(":").pop()||"1";
       const mod=getModule("rechnungen");const idx=Number(seedId)-1;const seedRow=getDemoModuleSeed("rechnungen").rows[idx];
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
       row:[values.datum,values.nummer,values.konto||accountingDefaults.officeExpense,money(Number(values.betrag||0)),"Verbucht"],
       fields:{Datum:values.datum,Beleg:values.nummer,Konto:values.konto||accountingDefaults.officeExpense,Gegenkonto:accountingDefaults.accountsPayable,Betrag:money(Number(values.betrag||0)),Status:"Verbucht"},
       meta:{relations:{supplierInvoiceId:rec.id,supplierId:relations.supplierId||""}}
     });
   }

   setDirty(false);notify(`${t(type)} ${t("wurde gespeichert.")}`);router.push(`${backHref}/${rec.id}`);
 }

 return <div className="page form-page">
  <div className="form-title-row"><div className="form-title-copy"><h1>{t(title)}</h1><p>{t("Erfasse zuerst nur das Nötigste. Weitere Angaben kannst du jederzeit ergänzen.")}</p></div></div>
  <form className="editor-layout" onSubmit={save}>
   <section className="workspace-card editor-main">
    <div className="form-grid">{visibleFields.map(f=><div key={f.name} className={f.full?"full":""}>
     {f.relation?<RelationshipPicker module={f.relation.module} label={t(f.label)} value={relations[f.relation.relationKey]||""} onChange={o=>setRelation(f,o)} required={f.required} createHref={f.relation.createHref}/>:
      <label><span>{t(f.label)}{f.currency?` (${domainConfig.currency})`:""}{f.required?" *":""}</span>{f.options?<Select required={f.required} value={values[f.name]||""} onChange={e=>{setDirty(true);setErrors(x=>({...x,[f.name]:""}));setValues(v=>({...v,[f.name]:e.target.value}))}}>{f.options.map(o=><option key={o} value={o}>{t(o)}</option>)}</Select>:
      f.type==="file"?<div className="file-input"><Paperclip size={18}/><input type="file" accept="image/*,.pdf" onChange={e=>onFile(e.target.files?.[0])}/>{values.beleg&&<small>{values.beleg}</small>}</div>:
      f.full?<Textarea rows={4} value={values[f.name]||""} onChange={e=>{setDirty(true);setErrors(x=>({...x,[f.name]:""}));setValues(v=>({...v,[f.name]:e.target.value}))}}/>:
      <Input required={f.required} type={f.type||"text"} placeholder={f.placeholder?t(f.placeholder):undefined} value={values[f.name]||""} onChange={e=>{setDirty(true);setErrors(x=>({...x,[f.name]:""}));setValues(v=>({...v,[f.name]:e.target.value}))}}/>}</label>}
     {errors[f.name]&&<small className="field-error">{errors[f.name]}</small>}
    </div>)}</div>{advancedCount>0&&<button type="button" className="progressive-fields-toggle" onClick={()=>setShowAdvanced(v=>!v)}>{showAdvanced?<ChevronUp size={16}/>:<ChevronDown size={16}/>}<span>{showAdvanced?t("Weniger Angaben anzeigen"):t("Weitere Angaben ({count})").replace("{count}",String(advancedCount))}</span></button>}
   </section>
   <aside className="editor-side"><div className="workspace-card side-card"><h3>{t("Speichern")}</h3><p>{t("Relationen werden als IDs gespeichert. Namen dienen nur der Anzeige.")}</p><Button type="submit" icon={<Check size={17}/>}>{t("Speichern")}</Button><Button type="button" variant="secondary" onClick={cancel}>{t("Abbrechen")}</Button></div></aside>
  </form>
 </div>
}
