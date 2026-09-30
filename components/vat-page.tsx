"use client";
import {subscribeAppEvent,appEvents} from "@/lib/client/app-events";
import {useEffect,useMemo,useState} from "react";
import {CheckCircle2,Download,RefreshCw,Send} from "lucide-react";
import {exportCsv,loadSettings,parseMoney,type LocalRecord} from "@/lib/local-store";
import {listAppRecords} from "@/lib/client/data-service";
import {isProductionMode} from "@/lib/client/runtime";
import {notify} from "@/lib/notify";
import {usePermissions} from "@/lib/client/use-permissions";
import {useLocale} from "@/components/locale-provider";
import {domainConfig} from "@/config/domain";
import {demoAnalyticsFixture} from "@/lib/demo/fixtures";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/form-controls";

export default function VatPage(){
 const {t,formatCurrency}=useLocale();const permissions=usePermissions();const canWrite=permissions.canModule("mwst","write");
 const [status,setStatus]=useState("In Vorbereitung");const [checked,setChecked]=useState(false);const [records,setRecords]=useState<LocalRecord[]>([]);const [correction,setCorrection]=useState(0);const [method,setMethod]=useState("Effektive Abrechnung");
 useEffect(()=>{let active=true;const load=()=>{void listAppRecords().then(items=>{if(active)setRecords(items)});setMethod(loadSettings().vatMethod)};const timer=window.setTimeout(load,0);const unsubscribe=subscribeAppEvent(appEvents.dataChanged,load);return()=>{active=false;window.clearTimeout(timer);unsubscribe()}},[]);
 const calc=useMemo(()=>{
  const invoices=records.filter(r=>r.module==="rechnungen"&&!["Entwurf","Storniert"].includes(r.status));
  const expenses=records.filter(r=>r.module==="spesen"&&["Freigegeben","Verbucht"].includes(r.status));
  const baseline=isProductionMode()?{outputVat:0,inputVat:0}:demoAnalyticsFixture.vat;
  const outputVat=invoices.reduce((sum,record)=>sum+Number(record.meta?.vat||record.positions?.reduce((value,position)=>value+position.quantity*position.unitPrice*position.vatRate/100,0)||0),baseline.outputVat);
  const inputVat=expenses.reduce((sum,record)=>{const gross=parseMoney(record.fields["Betrag CHF"]||record.fields.Betrag||record.row[3]);const rate=domainConfig.defaultVatRate;return sum+(gross*rate/(100+rate))},baseline.inputVat);
  const openDocs=records.filter(r=>r.module==="spesen"&&r.status==="Offen").length;
  const taxable=invoices.reduce((sum,record)=>sum+Number(record.meta?.net||0),0);
  return{outputVat,inputVat,payable:outputVat-inputVat+correction,openDocs,taxable};
 },[records,correction]);
 function runCheck(){if(!canWrite)return;setChecked(true);notify(calc.openDocs?`${t("Prüfung abgeschlossen")}: ${calc.openDocs} ${t("offene Spesenbelege.")}`:t("Plausibilitätsprüfung ohne offene Punkte abgeschlossen."))}
 function exportVat(){exportCsv("mwst-aktuelle-periode.csv",[t("Position"),t("Betrag")],[[t("Umsatzsteuer"),formatCurrency(calc.outputVat)],[t("Vorsteuer"),formatCurrency(calc.inputVat)],[t("Zahllast inkl. Korrektur"),formatCurrency(calc.payable)],[t("Korrektur"),formatCurrency(correction)],[t("Lokaler steuerbarer Umsatz"),formatCurrency(calc.taxable)]]);notify(t("MWST-Vorschau als CSV exportiert."))}
 const checks:[[string,boolean],[string,boolean],[string,boolean],[string,boolean]]=[["Umsätze aus Rechnungen berücksichtigt",true],["Vorsteuer aus freigegebenen Spesen berücksichtigt",true],[`${calc.openDocs} ${t("offene Spesenbelege prüfen")}`,calc.openDocs===0],["Steuersätze und Differenz plausibilisiert",checked]];
 return <div className="page"><section className="module-heading"><div><div className="eyebrow">{t("Finanzen")}</div><h1>{t("MWST")}</h1><p>{t("MWST aus lokalen Rechnungen und freigegebenen Spesen berechnen, plausibilisieren und Einreichung simulieren.")}</p></div>{canWrite&&<Button icon={<RefreshCw size={17}/>} onClick={runCheck}>{t("Prüfen")}</Button>}</section><section className="module-stats"><article className="stat-card"><span>{t("Umsatzsteuer")}</span><strong>{formatCurrency(calc.outputVat)}</strong><small>{isProductionMode()?t("aus erfassten Dokumenten"):t("Demo-Basis + lokale Dokumente")}</small></article><article className="stat-card"><span>{t("Vorsteuer")}</span><strong>{formatCurrency(calc.inputVat)}</strong><small>{t("freigegebene Spesen")}</small></article><article className="stat-card"><span>{t("Zahllast")}</span><strong>{formatCurrency(calc.payable)}</strong><small>{t("Aktuelle Periode")}</small></article></section><div className="vat-layout"><section className="workspace-card"><div className="section-title"><h2>{t("Aktuelle MWST-Abrechnung")}</h2><span>{t(status)}</span></div><div className="vat-method-row"><label><span>{t("Methode")}</span><strong>{t(method)}</strong></label><label><span>{t("Manuelle Korrektur")} ({domainConfig.currency})</span><Input type="number" inputMode="decimal" step="0.05" disabled={!canWrite} value={correction} onChange={e=>{setCorrection(Number(e.target.value));setChecked(false)}}/></label></div><div className="vat-checks">{checks.map(([label,done])=><div key={label} className={done?"done":""}><CheckCircle2 size={18}/><span>{t(label)}</span><strong>{done?"OK":t("Offen")}</strong></div>)}</div><div className="workflow-actions"><Button variant="secondary" icon={<Download size={17}/>} onClick={exportVat}>{t("Vorschau exportieren")}</Button><Button icon={<Send size={17}/>} disabled={!checked||!canWrite} onClick={()=>{setStatus("Eingereicht · Demo");notify(t("Einreichung wurde lokal simuliert. Es wurden keine Daten an die ESTV übertragen."))}}>{t("Einreichung simulieren")}</Button></div></section>{!isProductionMode()&&<aside className="workspace-card"><h3>{t("Demo-Berechnung")}</h3><p>{t("Die MWST-Werte werden lokal aus den erfassten Testdaten ergänzt. Die Basiswerte dienen nur dazu, auch vor dem Erfassen eigener Daten eine gefüllte Ansicht zu zeigen.")}</p><p><strong>{t("Keine echte ESTV-Übermittlung.")}</strong></p></aside>}</div></div>
}
