"use client";
import {subscribeAppEvent,appEvents} from "@/lib/client/app-events";
import {useEffect,useMemo,useState} from "react";
import {CheckCircle2,Download,FileText,Play,Send} from "lucide-react";
import {exportCsv,parseMoney,type LocalRecord} from "@/lib/local-store";
import {listAppRecords} from "@/lib/client/data-service";
import {isProductionMode} from "@/lib/client/runtime";
import {notify} from "@/lib/notify";
import {usePermissions} from "@/lib/client/use-permissions";
import ResponsiveOverlay from "@/components/ui/responsive-overlay";
import {Button} from "@/components/ui/button";
import {demoPayrollFixture} from "@/lib/demo/fixtures";
import {useLocale} from "@/components/locale-provider";

type PayrollRow={name:string;brutto:number;allowance:number;ahv:number;alv:number;nbu:number;bvg:number;withholding:number;netto:number};

function fromRecord(r:LocalRecord):PayrollRow{
 const brutto=parseMoney(r.fields["Monatslohn brutto CHF"]||r.fields.Brutto||"0");
 const allowance=parseMoney(r.fields["Kinderzulage CHF"]||"0");
 const ahv=parseMoney(r.fields["AHV Abzug CHF"]||"0");
 const alv=parseMoney(r.fields["ALV Abzug CHF"]||"0");
 const nbu=parseMoney(r.fields["NBU Abzug CHF"]||"0");
 const bvg=parseMoney(r.fields["BVG Abzug CHF"]||"0");
 const withholding=parseMoney(r.fields["Quellensteuer CHF"]||"0");
 return {name:r.fields.Name||r.row[0],brutto,allowance,ahv,alv,nbu,bvg,withholding,netto:brutto+allowance-ahv-alv-nbu-bvg-withholding};
}



export default function PayrollPage(){
 const {t,formatCurrency,formatDate}=useLocale();const permissions=usePermissions();const canWrite=permissions.canModule("lohn","write");
 const [status,setStatus]=useState("Vorbereitet");const [records,setRecords]=useState<LocalRecord[]>([]);const [selected,setSelected]=useState<PayrollRow>();
 useEffect(()=>{let active=true;const load=()=>void listAppRecords("personal").then(items=>{if(active)setRecords(items)});const timer=window.setTimeout(load,0);const unsubscribe=subscribeAppEvent(appEvents.dataChanged,load);return()=>{active=false;window.clearTimeout(timer);unsubscribe()}},[]);
 const staff=useMemo(()=>{const locals=records.filter(r=>r.status==="Aktiv").map(fromRecord).filter(x=>x.brutto>0);return isProductionMode()?locals:[...demoPayrollFixture, ...locals]},[records]);
 const totals=useMemo(()=>staff.reduce((a,r)=>({brutto:a.brutto+r.brutto,abzug:a.abzug+(r.brutto-r.netto),netto:a.netto+r.netto}),{brutto:0,abzug:0,netto:0}),[staff]);
 function action(next:string,msg:string){if(!canWrite)return;setStatus(next);notify(t(msg))}
 const period=formatDate(new Date(),{month:"long",year:"numeric"});
 const filePeriod=new Date().toISOString().slice(0,7);
 function csv(){exportCsv(`lohnlauf-${filePeriod}.csv`,[t("Mitarbeiter"),t("Brutto"),t("Kinderzulage"),"AHV/IV/EO","ALV","NBU",t("BVG Demo"),t("Quellensteuer"),t("Netto")],staff.map(r=>[r.name,formatCurrency(r.brutto),formatCurrency(r.allowance),formatCurrency(r.ahv),formatCurrency(r.alv),formatCurrency(r.nbu),formatCurrency(r.bvg),formatCurrency(r.withholding),formatCurrency(r.netto)]));notify(t("Lohnlauf als CSV exportiert."))}
 return <div className="page"><section className="module-heading"><div><div className="eyebrow">{t("Personal")}</div><h1>{t("Lohn")}</h1><p>{t("Lohnlauf lokal berechnen, prüfen, freigeben, Abrechnungen anzeigen und Auszahlung simulieren.")}</p></div>{canWrite&&<button className="ui-button ui-button-primary ui-button-md" onClick={()=>action("Berechnet","Lohnlauf wurde aus den lokalen Personaldaten neu berechnet.")}><Play size={17}/>{t("Lohnlauf berechnen")}</button>}</section><section className="module-stats"><article className="stat-card"><span>{t("Lohnsumme brutto")}</span><strong>{formatCurrency(totals.brutto)}</strong><small>{staff.length} {t("Mitarbeitende")}</small></article><article className="stat-card"><span>{t("Abzüge Demo")}</span><strong>{formatCurrency(totals.abzug)}</strong><small>{t("AHV/ALV/NBU/BVG vereinfacht")}</small></article><article className="stat-card"><span>{t("Netto")}</span><strong>{formatCurrency(totals.netto)}</strong><small>{t("Status")}: {t(status)}</small></article></section><section className="workspace-card"><div className="section-title"><h2>{t("Lohnlauf")} · {period}</h2><span>{t(status)}</span></div><div className="payroll-table"><div className="payroll-row head"><span>{t("Mitarbeiter")}</span><span>{t("Brutto")}</span><span>{t("Abzüge")}</span><span>{t("Netto")}</span><span/></div>{staff.map(r=><div className="payroll-row" key={r.name}><strong>{r.name}</strong><span>{formatCurrency(r.brutto)}</span><span>{formatCurrency(r.brutto-r.netto)}</span><strong>{formatCurrency(r.netto)}</strong><button className="text-icon-button" onClick={()=>setSelected(r)}><FileText size={17}/>{t("Abrechnung")}</button></div>)}</div><div className="workflow-actions">{canWrite&&<><button onClick={()=>action("Freigegeben","Lohnlauf freigegeben.")}><CheckCircle2 size={17}/>{t("Freigeben")}</button><button disabled={status!=="Freigegeben"&&status!=="Auszahlung erstellt"} onClick={()=>action("Auszahlung erstellt","Zahlungsdatei im Demo-Modus erstellt.")}><Send size={17}/>{t("Auszahlung erstellen")}</button><button onClick={csv}><Download size={17}/>{t("CSV exportieren")}</button></>}</div><p className="legal-demo-note">{t("Die Abzüge sind für die lokale UI-Demo bewusst vereinfacht und keine produktive Schweizer Lohnberechnung.")}</p></section><ResponsiveOverlay open={Boolean(selected)} title={t("Lohnabrechnung · Demo")} onClose={()=>setSelected(undefined)} size="md" actions={selected?<div className="ui-action-row ui-action-row-three"><Button variant="secondary" onClick={()=>window.print()}>{t("Drucken / PDF")}</Button><Button variant="secondary" onClick={()=>notify(t("Lohnausweis-Vorschau im Demo-Modus erzeugt."),"info")}>{t("Lohnausweis Demo")}</Button><Button onClick={()=>setSelected(undefined)}>{t("Schliessen")}</Button></div>:undefined}>{selected&&<div className="payslip"><h3>{selected.name}</h3><div><span>{t("Bruttolohn")}</span><strong>{formatCurrency(selected.brutto)}</strong></div>{selected.allowance>0&&<div><span>{t("Kinderzulage")}</span><strong>+ {formatCurrency(selected.allowance)}</strong></div>}<div><span>AHV/IV/EO {t("Demo")}</span><strong>- {formatCurrency(selected.ahv)}</strong></div><div><span>ALV {t("Demo")}</span><strong>- {formatCurrency(selected.alv)}</strong></div><div><span>NBU {t("Demo")}</span><strong>- {formatCurrency(selected.nbu)}</strong></div><div><span>BVG {t("Demo")}</span><strong>- {formatCurrency(selected.bvg)}</strong></div>{selected.withholding>0&&<div><span>{t("Quellensteuer Demo")}</span><strong>- {formatCurrency(selected.withholding)}</strong></div>}<div className="payslip-total"><span>{t("Netto")}</span><strong>{formatCurrency(selected.netto)}</strong></div></div>}</ResponsiveOverlay></div>
}
