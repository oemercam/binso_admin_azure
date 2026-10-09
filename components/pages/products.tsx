"use client";
import {useApiQuery} from "@/lib/client/use-api-query";
import {useDirtySnapshot} from "../use-dirty-snapshot";

import { formatQuantity, withPriceUnit } from "@/lib/display-format";

import { formatCurrency } from "@/lib/financial-status";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../app-shell";
import { RecordRow, RecordsView } from "../records";
import { products } from "@/lib/demo-data";
import { appendDemoRow } from "@/lib/demo-storage";
import { apiPatch, apiPost, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {Button, Field, Icon, Toast, Input, Select, Textarea, FormActions, LoadingState, ErrorState} from "../ui";
import { ActionRow, ActionsMenu, CreateAction } from "../binso-ux";
import { useDemoRows } from "./shared";

export function ProductsPage() {
  const {rows:productRows,loading,error}=useDemoRows("products",products);
  return <AppShell title="Produkte" subtitle="Produkte und Dienstleistungen zentral verwalten." active="produkte" actions={<CreateAction href="/produkte/neu" label="Neues Produkt"/>}>
    <RecordsView countLabel="Produkte" loading={loading} error={error} items={productRows} placeholder="Produkte suchen..." chips={["Alle","Dienstleistungen","Produkte"]} columns={[{label:"Produkt / Leistung",index:0},{label:"Typ",index:1},{label:"Preis",index:2,align:"right"},{label:"Status",index:4,status:true}]} rowHref={row=>`/produkte/${row[4]?row[3]:"beratung"}`}>{(row)=>{const [name,type,price,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"beratung";const status=statusMaybe??idOrStatus;return <RecordRow href={"/produkte/"+id} icon="box" title={name} meta={type} value={price} status={status}/>}}</RecordsView>
  </AppShell>;
}

export function ProductForm({ existing = false, productId }: { existing?: boolean; productId?: string }) {
  const router=useRouter();
  const production=useBackendMode();
  const [name,setName]=useState("");
  const [type,setType]=useState("Dienstleistung");
  const [sku,setSku]=useState("");
  const [unit,setUnit]=useState("hour");
  const [price,setPrice]=useState("");
  const [vatRate,setVatRate]=useState("8.1");
  const [description,setDescription]=useState("");
  const [status,setStatus]=useState("Aktiv");
  const [toast,setToast]=useState<string|null>(null);
  const recordQuery=useApiQuery<{item?:Record<string,unknown>;items?:Record<string,unknown>[]}>(existing&&productId?(production?"/api/products/"+encodeURIComponent(productId):"/api/demo/data?collection=products&id="+encodeURIComponent(productId)):null);
  const loadingRecord=recordQuery.loading;
  const recordError=recordQuery.error??(existing&&recordQuery.data&&!recordQuery.data.item&&!recordQuery.data.items?.length?"Produkt wurde nicht gefunden.":null);
  const [savingRecord,setSavingRecord]=useState(false);
  const saveRecordPending=useRef(false);
  const {dirty,markPristine}=useDirtySnapshot([name,type,sku,unit,price,vatRate,description,status]);
  const [savedRecord,setSavedRecord]=useState(false);
  const [editingRecord,setEditingRecord]=useState(!existing);

  useEffect(()=>{
    if(!recordQuery.data||editingRecord)return;
      const item=recordQuery.data.item??recordQuery.data.items?.[0];
      if(!item)return;
      queueMicrotask(()=>{
        setName(String(item.name??""));
        setType(item.kind==="product"?"Produkt":"Dienstleistung");
        setSku(String(item.sku??""));
        setUnit(String(item.unit??"hour"));
        setPrice(String(item.unit_price??"0.00"));
        setVatRate(String(item.vat_rate??"8.1"));
        setDescription(String(item.description??""));
        setStatus(item.status==="inactive"?"Inaktiv":"Aktiv");markPristine([String(item.name??""),item.kind==="product"?"Produkt":"Dienstleistung",String(item.sku??""),String(item.unit??"hour"),String(item.unit_price??"0.00"),String(item.vat_rate??"8.1"),String(item.description??""),item.status==="inactive"?"Inaktiv":"Aktiv"]);
      });
  },[recordQuery.data,editingRecord,markPristine]);

  const save=async()=>{
    if(saveRecordPending.current||loadingRecord||recordError)return;
    if(!name.trim()||!price.trim()){setToast("Name und Verkaufspreis sind erforderlich.");window.setTimeout(()=>setToast(null),2200);return;}
    saveRecordPending.current=true;setSavingRecord(true);
    try{
      const numericPrice=Number(price.replace(",","."));
      if(!Number.isFinite(numericPrice)||numericPrice<0)throw new Error("Bitte einen gültigen Verkaufspreis erfassen.");
      const payload={name:name.trim(),kind:type==="Produkt"?"product":"service",sku,unit,unitPrice:numericPrice,vatRate:Number(vatRate),description,status:status==="Inaktiv"?"inactive":"active"};
      if(production){
        if(existing&&productId) await apiPatch("/api/products/"+encodeURIComponent(productId),payload);
        else await apiPost("/api/products",payload);
      }else if(!existing){
        appendDemoRow("products",[name.trim(),type,"CHF "+numericPrice.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2}),"Aktiv"]);
      }
      setSavedRecord(true);
      setToast("Produkt gespeichert.");
      window.setTimeout(()=>router.push("/produkte"),700);
    }catch(error){
      saveRecordPending.current=false;setSavingRecord(false);
      setToast(error instanceof Error?error.message:"Produkt konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };

  if(loadingRecord||recordError)return <AppShell title="Produkt" active="produkte" backHref="/produkte">{loadingRecord?<LoadingState>Produkt wird geladen …</LoadingState>:<ErrorState onRetry={recordQuery.refresh} retryLabel="Erneut versuchen">{recordError}</ErrorState>}</AppShell>;
  return <AppShell unsavedChanges={dirty&&!savedRecord} title={existing ? name||"Produkt" : "Produkt erstellen"} status={existing?status:undefined} statusTone={status==="Aktiv"?"success":"neutral"} editing={editingRecord} subtitle={existing ? type : "Für Angebote und Rechnungen wiederverwendbar."} active="produkte" backHref="/produkte" backLabel="Produkte" actions={existing?<><ActionsMenu label="Produktaktionen" busy={savingRecord}>{!editingRecord&&<ActionRow requiresWrite icon="edit" onClick={()=>setEditingRecord(true)} title="Bearbeiten" navigation/>}<ActionRow href="/angebote/neu" icon="file" title="Angebot erstellen" navigation/><ActionRow href="/rechnungen/neu" icon="receipt" title="Rechnung erstellen" navigation/></ActionsMenu></>:undefined}>
    <div className={existing?"entity-detail-workspace":"form-page"} inert={savingRecord}>

      <div className={existing?"entity-edit-main":"entity-edit-main form-main-new"}>
        {!editingRecord?<dl className="detail-list">
          <div><dt>Verkaufspreis</dt><dd>{withPriceUnit(formatCurrency(price,"CHF"),unit)}</dd></div>
          <div><dt>MwSt.</dt><dd>{formatQuantity(vatRate,"%")}</dd></div>
          {sku&&<div><dt>Artikelnummer</dt><dd>{sku}</dd></div>}
          {description&&<div><dt>Beschreibung</dt><dd>{description}</dd></div>}
        </dl>:<div className="form-grid two">
          <Field label="Name"><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Name"/></Field>
          <Field label="Typ"><Select value={type} onChange={e=>setType(e.target.value)}><option>Dienstleistung</option><option>Produkt</option></Select></Field>
          <Field label="Artikelnummer"><Input value={sku} onChange={e=>setSku(e.target.value)} placeholder="Optional"/></Field>
          <Field label="Einheit"><Select value={unit} onChange={e=>setUnit(e.target.value)}><option value="hour">Stunde</option><option value="piece">Stück</option><option value="flat">Pauschal</option></Select></Field>
          <Field label="Verkaufspreis (CHF)"><Input inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00"/></Field>
          <Field label="MwSt."><Select value={vatRate} onChange={e=>setVatRate(e.target.value)}><option value="8.1">8.1 %</option><option value="2.6">2.6 %</option><option value="0">0 %</option></Select></Field>
          <Field label="Status"><Select value={status} onChange={e=>setStatus(e.target.value)}><option>Aktiv</option><option>Inaktiv</option></Select></Field>
          <Field label="Beschreibung" className="full"><Textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Kurze Beschreibung"/></Field>
        </div>}
      </div>
      {existing&&<aside className="desktop-context-rail"><section className="desktop-toolbox"><Link href="/angebote/neu"><Icon name="file"/><span><b>Angebot erstellen</b></span><Icon name="arrow" size={15}/></Link><Link href="/rechnungen/neu"><Icon name="receipt"/><span><b>Rechnung erstellen</b></span><Icon name="arrow" size={15}/></Link></section></aside>}
      {editingRecord&&<FormActions ><Button requiresWrite disabled={savingRecord} onClick={()=>void save()}>{savingRecord?"Wird gespeichert…":"Speichern"}</Button></FormActions>}
    </div>
    {toast&&<Toast title={toast} tone={toast==="Produkt gespeichert."?"success":"danger"}/>}
  </AppShell>;
}
