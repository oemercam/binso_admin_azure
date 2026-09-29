"use client";
import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { exportCsv, money, parseMoney, type LocalRecord } from "@/lib/local-store";
import { listAppRecords } from "@/lib/client/data-service";
import { isProductionMode } from "@/lib/client/runtime";
import { notify } from "@/lib/notify";

export default function ReportsPage(){
 const [period,setPeriod]=useState('September 2026');const [records,setRecords]=useState<LocalRecord[]>([]);
 useEffect(()=>{let active=true;const load=()=>void listAppRecords().then(items=>{if(active)setRecords(items)});const t=window.setTimeout(load,0);window.addEventListener('binso-data-changed',load);return()=>{active=false;window.clearTimeout(t);window.removeEventListener('binso-data-changed',load)}},[]);
 const report=useMemo(()=>{
   const invoices=records.filter(r=>r.module==='rechnungen'); const expenses=records.filter(r=>r.module==='spesen'); const hours=records.filter(r=>r.module==='zeiterfassung');
   const revenue=(isProductionMode()?0:128450)+invoices.reduce((s,r)=>s+(r.status==='Bezahlt'?Number(r.meta?.gross||parseMoney(r.fields.Betrag||r.row[3])):0),0);
   const costs=(isProductionMode()?0:79640)+expenses.reduce((s,r)=>s+parseMoney(r.fields['Betrag CHF']||r.fields.Betrag||r.row[3]),0);
   const result=revenue-costs; const open=invoices.filter(r=>!['Bezahlt','Gutschrift','Storniert'].includes(r.status)).reduce((s,r)=>s+Number(r.meta?.gross||parseMoney(r.fields.Betrag||r.row[3])),isProductionMode()?0:24300);
   const tracked=hours.reduce((s,r)=>s+Number(String(r.fields['Dauer in Stunden']||r.fields.Dauer||r.row[3]||'0').replace(/[^0-9.,]/g,'').replace(',','.'))||0,isProductionMode()?0:612);
   return {revenue,costs,result,margin:revenue?result/revenue*100:0,open,tracked};
 },[records]);
 function csv(){exportCsv(`bericht-${period.replaceAll(' ','-')}.csv`,['Kennzahl','Wert'],[['Umsatz',money(report.revenue)],['Kosten',money(report.costs)],['Ergebnis',money(report.result)],['Marge',`${report.margin.toFixed(1)} %`],['Offene Debitoren',money(report.open)],['Stunden',`${report.tracked.toFixed(2)} h`]]);notify('Bericht als CSV exportiert.')}
 return <div className="page"><section className="module-heading"><div><div className="eyebrow">Auswertung</div><h1>Berichte</h1><p>Umsatz, Kosten, Liquidität, Projekte und Auslastung aus den erfassten Geschäftsdaten auswerten.</p></div><div className="report-actions"><select value={period} onChange={e=>setPeriod(e.target.value)}><option>September 2026</option><option>Q3 2026</option><option>2026 YTD</option></select><button onClick={()=>notify('Bericht aus den aktuellen Daten aktualisiert.')}><RefreshCw size={17}/>Aktualisieren</button><button onClick={csv}><Download size={17}/>CSV</button></div></section><section className="module-stats"><article className="stat-card"><span>Umsatz</span><strong>{money(report.revenue)}</strong><small>aus erfassten Daten</small></article><article className="stat-card"><span>Kosten</span><strong>{money(report.costs)}</strong><small>inkl. Spesen</small></article><article className="stat-card"><span>Ergebnis</span><strong>{money(report.result)}</strong><small>{report.margin.toFixed(1)} % Marge</small></article></section><div className="reports-grid"><section className="workspace-card"><div className="section-title"><h2>Umsatzentwicklung</h2><span>{period}</span></div><div className="bar-chart">{[48,58,52,70,66,82,74,90,86,100,92,96].map((v,i)=><div key={i}><span style={{height:`${Math.min(100,v+(records.length%9))}%`}}/><small>{i+1}</small></div>)}</div></section><section className="workspace-card"><div className="section-title"><h2>Kennzahlen</h2><button className="text-icon-button" onClick={csv}><Download size={17}/></button></div><div className="report-kpis"><div><span>Offene Debitoren</span><strong>{money(report.open)}</strong></div><div><span>Erfasste Stunden</span><strong>{report.tracked.toFixed(1)} h</strong></div><div><span>Projektmarge</span><strong>{report.margin.toFixed(1)} %</strong></div><div><span>Vorgänge</span><strong>{records.length}</strong></div></div></section></div></div>
}
