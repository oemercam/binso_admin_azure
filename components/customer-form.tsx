"use client";
import Link from "next/link";
import {useRouter,useSearchParams} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {sameCustomerCreation} from "@/lib/customer-replay";
import {safeAppPath} from "@/lib/navigation";
import {LocalizedText} from "@/lib/client/locale";
import {apiPatch,apiPost} from "@/lib/client/backend";
import {useApiQuery} from "@/lib/client/use-api-query";
import {AppShell} from "./app-shell";
import {FormPage,DetailDisclosure} from "./binso-ux";
import {useDirtySnapshot} from "./use-dirty-snapshot";
import {useProcessDraft} from "./use-process-draft";
import {allowDraftNavigation} from "./use-browser-back-guard";
import {Button,Field,Input,Select,FormSection,FormActions,ErrorState,LoadingState,SectionTitle,Toast} from "./ui";

/** Shared full-page customer editor, also used inside a business capture process. */
export function CustomerForm({customerId,onCreated,onCancel,draftScope}:{customerId?:string;onCreated?:(customer:{id:string;name:string})=>void;onCancel?:()=>void;draftScope?:string}={}) {
  const router=useRouter();
  const searchParams=useSearchParams();
  const returnTo=safeAppPath(searchParams.get("returnTo"),customerId?"/kunden/"+encodeURIComponent(customerId):"/kunden");
  const [company,setCompany]=useState("");
  const [moreOpen,setMoreOpen]=useState(false);
  const [customerType,setCustomerType]=useState<"company"|"person">("company");
  const [contactName,setContactName]=useState("");
  const [contactLastName,setContactLastName]=useState("");
  const customerName=customerType==="person"&&!customerId?[contactName,contactLastName].map(value=>value.trim()).filter(Boolean).join(" "):company;
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
  const {dirty,markPristine}=useDirtySnapshot([company,customerType,email,phone,city,sector,address,postalCode,uid,notes,customerStatus,buildingNumber,paymentDays,...(!customerId?[contactName,contactLastName]:[])]);
  const [savedRecord,setSavedRecord]=useState(false);
  const [sheetOpen,setSheetOpen]=useState(false);
  useEffect(()=>{queueMicrotask(()=>setSheetOpen(true))},[]);
  const [replay,setReplay]=useState<{body:string;key:string}|null>(null);
  const [allowDuplicate,setAllowDuplicate]=useState(false);
  const [duplicateQuery,setDuplicateQuery]=useState('');
  useEffect(()=>{const timer=window.setTimeout(()=>setDuplicateQuery(new URLSearchParams({name:customerName.trim(),email:email.trim(),uid:uid.trim(),excludeId:customerId??''}).toString()),250);return()=>window.clearTimeout(timer)},[customerName,email,uid,customerId]);
  const duplicateCheck=useApiQuery<{items:Array<{id:string;customer_no:string;name:string;email?:string}>}>(!customerId&&customerName.trim().length>=2&&duplicateQuery?'/api/customers/duplicates?'+duplicateQuery:null);
  const duplicateItems=duplicateCheck.data?.items??[];
  const recovery=useProcessDraft({process:customerId?"customer:edit:"+customerId:"customer:create"+(draftScope?":"+draftScope:""),value:{customerType,company,contactName,contactLastName,email,phone,city,sector,address,postalCode,uid,notes,customerStatus,buildingNumber,paymentDays,replay,allowDuplicate},dirty,enabled:!loadingRecord&&!recordError,onRestore:value=>{
    if(!value||[value.company,value.email,value.phone,value.city,value.sector,value.address,value.postalCode,value.uid,value.notes].some(item=>typeof item!=="string"||item.length>320)||!["active","inactive"].includes(value.customerStatus))return;
    setMoreOpen(true);setCustomerType(value.customerType==="person"?"person":"company");setPaymentDays(typeof value.paymentDays==="string"?value.paymentDays:null);setContactLastName(typeof value.contactLastName==="string"&&value.contactLastName.length<=120?value.contactLastName:"");setContactName(typeof value.contactName==="string"&&value.contactName.length<=320?value.contactName:"");setAllowDuplicate(value.allowDuplicate===true);    setBuildingNumber(typeof value.buildingNumber==="string"?value.buildingNumber:"");setCompany(value.company);setEmail(value.email);setPhone(value.phone);setCity(value.city);setSector(value.sector);setAddress(value.address);setPostalCode(value.postalCode);setUid(value.uid);setNotes(value.notes);setCustomerStatus(value.customerStatus);
    if(value.replay&&typeof value.replay.body==="string"&&value.replay.body.length<8192&&typeof value.replay.key==="string"&&value.replay.key.length>=8&&value.replay.key.length<=128)setReplay(value.replay);
  }});
  const close=()=>{recovery.clear();setSheetOpen(false);if(onCreated){onCancel?.();return;}allowDraftNavigation();router.push(returnTo)};
  useEffect(()=>{if(!customerId||!recordQuery.data||hydratedCustomer.current===customerId)return;hydratedCustomer.current=customerId;const {item}=recordQuery.data;queueMicrotask(()=>{setCompany(String(item.name??''));setEmail(String(item.email??''));setPhone(String(item.phone??''));setCity(String(item.city??''));setSector(String(item.sector??''));setAddress(String(item.street??''));setBuildingNumber(String(item.building_number??''));setPostalCode(String(item.postal_code??''));setUid(String(item.uid??''));setNotes(String(item.notes??''));setCustomerStatus(String(item.status??'active'));setPaymentDays(item.paymentDays!=null?String(item.paymentDays):null);setHydratedRecordId(customerId);markPristine([String(item.name??''),"company",String(item.email??''),String(item.phone??''),String(item.city??''),String(item.sector??''),String(item.street??''),String(item.postal_code??''),String(item.uid??''),String(item.notes??''),String(item.status??'active'),String(item.building_number??''),item.paymentDays!=null?String(item.paymentDays):null]);});},[customerId,recordQuery.data,markPristine]);
  const save=async()=>{
    if(saveRecordPending.current||!recovery.ready||loadingRecord||recordError)return;
    if(!customerId&&(!contactName.trim()||!contactLastName.trim())){setToast("Bitte Vorname und Nachname der Kontaktperson eingeben.");return;}
    if(customerName.trim().length<2){
      setToast("Bitte einen Kundennamen mit mindestens zwei Zeichen eingeben.");
      return;
    }
    setToast(null);saveRecordPending.current=true;setSavingRecord(true);
    try{
      let savedCustomerId=customerId;
      {
        const body={name:customerName.trim(),...(!customerId?{customerType}:{}),sector,email,phone,city,address:[address,buildingNumber].filter(Boolean).join(" "),street:address,buildingNumber,postalCode,uid,notes,status:customerId?customerStatus:"active",...(paymentDays!==null&&paymentDays!==""?{paymentDays:Number(paymentDays)}:{}),...(!customerId?{allowDuplicate,contactFirstName:contactName.trim(),contactLastName:contactLastName.trim()}:{})},serialized=JSON.stringify(body);
        const attempt=replay&&sameCustomerCreation(replay.body,serialized)?{body:serialized,key:replay.key}:{body:serialized,key:crypto.randomUUID()};setReplay(attempt);recovery.persist({customerType,company,contactName,contactLastName,email,phone,city,sector,address,postalCode,uid,notes,customerStatus,buildingNumber,paymentDays,replay:attempt,allowDuplicate});
        const result=customerId?await apiPatch<{item?:{id:string}}>("/api/customers/"+encodeURIComponent(customerId),body):await apiPost<{item?:{id:string}}>("/api/customers",body,{idempotencyKey:attempt.key});
        if(typeof result.item?.id!=="string"||!result.item.id)throw new Error("Die Speicherung konnte nicht bestätigt werden. Bitte den gespeicherten Stand prüfen.");
        savedCustomerId=result.item.id;
      }
      setToast("Kunde gespeichert.");
      setSavedRecord(true);
      recovery.clear();
      if(onCreated){onCreated({id:savedCustomerId!,name:customerName.trim()});return;}
      allowDraftNavigation();
      const destination=customerId?returnTo:"/kunden/"+encodeURIComponent(savedCustomerId!);
      if(customerId)window.setTimeout(()=>router.push(destination),700);
      else router.push(destination);
    }catch(error){
      saveRecordPending.current=false;setSavingRecord(false);
      setToast(error instanceof Error?error.message:"Kunde konnte nicht gespeichert werden.");
    }
  };
  const editor=<FormPage open={sheetOpen} onClose={close} label={customerId?"Kunde bearbeiten":"Kunde erstellen"} busy={savingRecord} dirty={dirty&&!savedRecord}>
      {loadingRecord?<LoadingState><LocalizedText>{"Kunde wird geladen …"}</LocalizedText></LoadingState>:recordError?<ErrorState onRetry={recordQuery.refresh} retryLabel="Erneut versuchen"><LocalizedText>{recordError}</LocalizedText></ErrorState>:<form onSubmit={event=>{event.preventDefault();return save()}}>
          {toast&&toast!=="Kunde gespeichert."&&<ErrorState>{toast}</ErrorState>}
          <FormSection><div className="form-grid two">
          {!customerId&&<Field label="Kundentyp"><Select value={customerType} disabled={savingRecord} onChange={event=>setCustomerType(event.target.value as "company"|"person")}><option value="company"><LocalizedText>Firma</LocalizedText></option><option value="person"><LocalizedText>Privatperson</LocalizedText></option></Select></Field>}
          {(customerId||customerType==="company")&&<Field label="Kundenname *"><Input required minLength={2} maxLength={320} autoComplete="organization" value={company} disabled={savingRecord} onChange={e=>{setCompany(e.target.value);setAllowDuplicate(false)}} placeholder="Muster AG"/></Field>}
          {!customerId&&<div className="form-grid two full"><Field label={customerType==="person"?"Vorname *":"Kontaktperson · Vorname *"}><Input required maxLength={120} autoComplete="given-name" value={contactName} disabled={savingRecord} onChange={e=>setContactName(e.target.value)}/></Field><Field label={customerType==="person"?"Nachname *":"Kontaktperson · Nachname *"}><Input required maxLength={120} autoComplete="family-name" value={contactLastName} disabled={savingRecord} onChange={e=>setContactLastName(e.target.value)}/></Field></div>}
          <p className="full"><LocalizedText>{"* Pflichtfeld"}</LocalizedText></p>
          {!customerId&&duplicateCheck.error&&<ErrorState className="full" onRetry={duplicateCheck.refresh}><LocalizedText>{duplicateCheck.error}</LocalizedText></ErrorState>}
          {!customerId&&duplicateItems.length>0&&<section className="full"><SectionTitle title="Mögliche Dubletten"/>{duplicateItems.map(item=><p key={item.id}><Link href={'/kunden/'+encodeURIComponent(item.id)}>{item.customer_no} · {item.name}</Link></p>)}<Field label="Als separaten Kunden erfassen"><Input type="checkbox" checked={allowDuplicate} onChange={event=>setAllowDuplicate(event.target.checked)}/></Field></section>}

          </div></FormSection>
          <DetailDisclosure label="Weitere Angaben" open={moreOpen} onOpenChange={setMoreOpen}><div className="form-grid two"><Field label="Zahlungsfrist" hint="Leer bei Neuanlage: Firmenstandard"><Input required={!!customerId} type="number" min={0} max={180} step={1} value={paymentDays??""} onChange={event=>setPaymentDays(event.target.value)} /></Field>
            <Field label="E-Mail"><Input type="email" autoComplete="email" maxLength={320} value={email} disabled={savingRecord} onChange={e=>{setEmail(e.target.value);setAllowDuplicate(false)}} placeholder="max.muster@beispiel.ch"/></Field>
            <Field label="Telefon"><Input type="tel" inputMode="tel" autoComplete="tel" maxLength={320} value={phone} disabled={savingRecord} onChange={e=>setPhone(e.target.value)} placeholder="+41 31 555 12 34"/></Field>
            <Field label="Strasse"><Input autoComplete="address-line1" maxLength={320} value={address} disabled={savingRecord} onChange={e=>setAddress(e.target.value)} placeholder="Bahnhofstrasse"/></Field><Field label="Hausnummer"><Input placeholder="12" autoComplete="address-line2" maxLength={40} value={buildingNumber} disabled={savingRecord} onChange={e=>setBuildingNumber(e.target.value)}/></Field>
            <Field label="PLZ"><Input inputMode="numeric" autoComplete="postal-code" maxLength={320} value={postalCode} disabled={savingRecord} onChange={e=>setPostalCode(e.target.value)} placeholder="8000"/></Field>
            <Field label="Ort"><Input autoComplete="address-level2" maxLength={320} value={city} disabled={savingRecord} onChange={e=>setCity(e.target.value)} placeholder="Zürich"/></Field>
            {customerId&&<Field label="Status"><Select disabled={savingRecord} value={customerStatus} onChange={e=>setCustomerStatus(e.target.value)}><option value="active"><LocalizedText>{"Aktiv"}</LocalizedText></option><option value="inactive"><LocalizedText>{"Inaktiv"}</LocalizedText></option></Select></Field>}
            <Field label="Branche"><Select disabled={savingRecord} value={sector} onChange={e=>setSector(e.target.value)}><option value={"Dienstleistung"}><LocalizedText>{"Dienstleistung"}</LocalizedText></option><option value={"Bauunternehmen"}><LocalizedText>{"Bauunternehmen"}</LocalizedText></option><option value={"Immobilien"}><LocalizedText>{"Immobilien"}</LocalizedText></option><option value={"Beratung"}><LocalizedText>{"Beratung"}</LocalizedText></option><option value={"Handel"}><LocalizedText>{"Handel"}</LocalizedText></option><option value={"Elektro"}><LocalizedText>{"Elektro"}</LocalizedText></option></Select></Field>
            <Field label="UID"><Input maxLength={320} value={uid} disabled={savingRecord} onChange={e=>{setUid(e.target.value);setAllowDuplicate(false)}} placeholder="CHE-000.000.000"/></Field>
            <Field label="Interne Notiz"><Input maxLength={320} value={notes} disabled={savingRecord} onChange={e=>setNotes(e.target.value)} placeholder="Optional"/></Field>
          </div></DetailDisclosure>
        <FormActions><Button variant="secondary" disabled={savingRecord} onClick={close}><LocalizedText>Abbrechen</LocalizedText></Button><Button requiresWrite type="submit" disabled={savingRecord||!recovery.ready||(customerName.trim().length<2||!customerId&&(!contactName.trim()||!contactLastName.trim()))}><LocalizedText>{savingRecord?"Wird gespeichert…":customerId?"Änderungen speichern":"Kunde speichern"}</LocalizedText></Button></FormActions>
      </form>}
    </FormPage>;
  if(onCreated)return editor;
  return <AppShell editing unsavedChanges={false} title={customerId?"Kunde bearbeiten":"Kunde erstellen"} active="kunden" backHref={returnTo} backLabel="Kunden">{editor}{toast==="Kunde gespeichert."&&<Toast title={toast} tone="success"/>}</AppShell>;
}
