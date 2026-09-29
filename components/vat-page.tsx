"use client";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, RefreshCw, Send } from "lucide-react";
import { exportCsv, loadSettings, money, parseMoney, type LocalRecord } from "@/lib/local-store";
import { listAppRecords } from "@/lib/client/data-service";
import { notify } from "@/lib/notify";
import { usePermissions } from "@/lib/client/use-permissions";

export default function VatPage(){
 const permissions=usePermissions();const canWrite=permissions.canModule("mwst","write");
 const [status,setStatus]=useState('In Vorbereitung');const [checked,setChecked]=useState(false);const [records,setRecords]=useState<LocalRecord[]>([]);const [correction,setCorrection]=useState(0);const [method,setMethod]=useState('Effektive Abrechnung');
 useEffect(()=>{let active=true;const load=()=>{void listAppRecords().then(items=>{if(active)setRecords(items)});setMethod(loadSettings().vatMethod)};const t=window.setTimeout(load,0);window.addEventListener('binso-data-changed',load);return()=>{active=false;window.clearTimeout(t);window.removeEventListener('binso-data-changed',load)}},[]);
 const calc=useMemo(()=>{
   const invoices=records.filter(r=>r.module==='rechnungen'&&!['Entwurf','Storniert'].includes(r.status));
   const expenses=records.filter(r=>r.module==='spesen'&&['Freigegeben','Verbucht'].includes(r.status));
   const outputVat=invoices.reduce((s,r)=>s+Number(r.meta?.vat||r.positions?.reduce((a,p)=>a+p.quantity*p.unitPrice*p.vatRate/100,0)||0),18940);
   const inputVat=expenses.reduce((s,r)=>{const gross=parseMoney(r.fields['Betrag CHF']||r.fields.Betrag||r.row[3]);return s+(gross*8.1/108.1)},11120);
   const openDocs=records.filter(r=>r.module==='spesen'&&r.status==='Offen').length;
   const taxable=invoices.reduce((s,r)=>s+Number(r.meta?.net||0),0);
   return{outputVat,inputVat,payable:outputVat-inputVat+correction,openDocs,taxable};
 },[records,correction]);
 function runCheck(){if(!canWrite)return;setChecked(true);notify(calc.openDocs?`Prüfung abgeschlossen: ${calc.openDocs} offene Spesenbelege.`:'Plausibilitätsprüfung ohne offene Punkte abgeschlossen.')}
 function exportVat(){exportCsv('mwst-q3-2026.csv',['Position','Betrag'],[['Umsatzsteuer',money(calc.outputVat)],['Vorsteuer',money(calc.inputVat)],['Zahllast inkl. Korrektur',money(calc.payable)],['Korrektur',money(correction)],['Lokaler steuerbarer Umsatz',money(calc.taxable)]]);notify('MWST-Vorschau als CSV exportiert.')}
 return <div className="page"><section className="module-heading"><div><div className="eyebrow">Finanzen</div><h1>MWST</h1><p>MWST aus lokalen Rechnungen und freigegebenen Spesen berechnen, plausibilisieren und Einreichung simulieren.</p></div>{canWrite&&<button className="primary-inline" onClick={runCheck}><RefreshCw size={17}/>Prüfen</button>}</section><section className="module-stats"><article className="stat-card"><span>Umsatzsteuer</span><strong>{money(calc.outputVat)}</strong><small>Basis + lokale Dokumente</small></article><article className="stat-card"><span>Vorsteuer</span><strong>{money(calc.inputVat)}</strong><small>freigegebene Spesen</small></article><article className="stat-card"><span>Zahllast</span><strong>{money(calc.payable)}</strong><small>Q3 2026 · Demo</small></article></section><div className="vat-layout"><section className="workspace-card"><div className="section-title"><h2>Abrechnung Q3 2026</h2><span>{status}</span></div><div className="vat-method-row"><label><span>Methode</span><strong>{method}</strong></label><label><span>Manuelle Korrektur CHF</span><input type="number" step="0.05" disabled={!canWrite} value={correction} onChange={e=>{setCorrection(Number(e.target.value));setChecked(false)}}/></label></div><div className="vat-checks">{[
   ['Umsätze aus Rechnungen berücksichtigt',true],['Vorsteuer aus freigegebenen Spesen berücksichtigt',true],[`${calc.openDocs} offene Spesenbelege prüfen`,calc.openDocs===0],['Steuersätze und Differenz plausibilisiert',checked]
  ].map(([label,done])=><div key={String(label)} className={done?'done':''}><CheckCircle2 size={18}/><span>{String(label)}</span><strong>{done?'OK':'Offen'}</strong></div>)}</div><div className="workflow-actions"><button onClick={exportVat}><Download size={17}/>Vorschau exportieren</button><button disabled={!checked||!canWrite} onClick={()=>{setStatus('Eingereicht · Demo');notify('Einreichung wurde lokal simuliert. Es wurden keine Daten an die ESTV übertragen.')}}><Send size={17}/>Einreichung simulieren</button></div></section><aside className="workspace-card"><h3>Demo-Berechnung</h3><p>Die MWST-Werte werden lokal aus den erfassten Testdaten ergänzt. Die Basiswerte dienen nur dazu, auch vor dem Erfassen eigener Daten eine gefüllte Ansicht zu zeigen.</p><p><strong>Keine echte ESTV-Übermittlung.</strong></p></aside></div></div>
}
