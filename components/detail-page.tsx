"use client";

import {addDays,isoDate} from "@/config/domain";
import {accountingDefaults} from "@/config/accounting";
import {limitsConfig,megabytes} from "@/config/limits";
import {demoAnalyticsFixture} from "@/lib/demo/fixtures";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronDown, FilePlus2, FileText, MoreHorizontal, Pencil, Plus, Save, Send, Trash2 } from "lucide-react";
import {modules,type ModuleConfig} from "@/lib/modules";
import { ensureSeedOverride, findSeedOverride, getLocalRecord, listLocalRecords, money, parseMoney, type LocalRecord } from "@/lib/local-store";
import { createAppRecord, deleteAppRecord, getAppRecord, listAppRecords, updateAppRecord } from "@/lib/client/data-service";
import { apiFormFetch, isProductionMode } from "@/lib/client/runtime";
import { notify } from "@/lib/notify";
import { confirmAction } from "@/lib/confirm";
import { useRouter } from "next/navigation";
import { relationId } from "@/lib/relationships";
import { usePermissions } from "@/lib/client/use-permissions";
import ResponsiveOverlay from "@/components/ui/responsive-overlay";
import {Button} from "@/components/ui/button";
import {useLocale} from "@/components/locale-provider";
import {getDemoModuleSeed} from "@/lib/demo/module-seeds";
import {FormSection,Input} from "@/components/ui/form-controls";
import {IconButton} from "@/components/ui/icon-button";
import {mobileDetailEntries} from "@/config/mobile-ux";

type Task={id:string;text:string;done:boolean};

export default function DetailPage({config,id}:{config:ModuleConfig;id:string}){
 const router=useRouter();
 const permissions=usePermissions();
 const {t,formatDateTime}=useLocale();
 const canWrite=permissions.canModule(config.key,"write");
 const seedIndex=Math.max(0,Number(id)-1);
 const demoRows=useMemo(()=>isProductionMode()?[]:getDemoModuleSeed(config.key).rows,[config.key]);
 const seed=useMemo(
   ()=>demoRows[seedIndex]??demoRows[0]??[config.label,'–','–','–','Aktiv'],
   [demoRows,seedIndex,config.label]
 );
 const seedFields=useMemo(
   ()=>Object.fromEntries((config.columns||[]).map((c,i)=>[c,seed[i]??'–'])),
   [config.columns,seed]
 );
 const [local,setLocal]=useState<LocalRecord>();
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState<Record<string,string>>(seedFields);
 const [menu,setMenu]=useState(false);
 const [mobileMenu,setMobileMenu]=useState(false);
 const [note,setNote]=useState('');
 const [taskText,setTaskText]=useState('');
 const [allRecords,setAllRecords]=useState<LocalRecord[]>([]);
 const [absenceText,setAbsenceText]=useState(()=>isProductionMode()?'':`Ferien ${isoDate(addDays(new Date(),1))}–${isoDate(addDays(new Date(),5))}`);
 const [contactText,setContactText]=useState('');

 useEffect(()=>{
   let active=true;
   const timer=window.setTimeout(()=>{void (async()=>{
     const rec=isProductionMode()?await getAppRecord(id):(id.startsWith('local-')?getLocalRecord(id):findSeedOverride(config.key,id));
     if(!active)return;
     if(rec){setLocal(rec);setDraft(rec.fields)}else setDraft(seedFields);
     setAllRecords(isProductionMode()?await listAppRecords():listLocalRecords());
   })()},0);
   return()=>{active=false;window.clearTimeout(timer)};
 },[config.key,id,seedFields]);

 const row=local?.row||seed;
 const tasks=(local?.meta?.tasks as Task[]|undefined)||[];
 async function getEditable(){
   if(local)return local;
   if(isProductionMode()){notify(t("Datensatz wurde nicht gefunden."),"danger");return undefined}
   const rec=ensureSeedOverride(config.key,id,seed,{...seedFields});setLocal(rec);return rec;
 }
 async function remove(){if(!canWrite||!local)return;const ok=await confirmAction({title:t("Datensatz löschen"),message:t("Diesen Datensatz löschen? Diese Aktion kann nicht rückgängig gemacht werden."),confirmLabel:t("Löschen"),cancelLabel:t("Abbrechen"),tone:"danger"});if(ok){await deleteAppRecord(local.id);notify(t("Datensatz gelöscht."),"info");router.push(config.href)}}
 async function setStatus(status:string){if(!canWrite)return;const rec=await getEditable();if(!rec)return;const nextRow=[...rec.row];nextRow[nextRow.length-1]=status;const next=await updateAppRecord(rec.id,{status,row:nextRow,fields:{...rec.fields,Status:status}});if(next)setLocal(next);notify(`${t("Status auf")} «${t(status)}» ${t("gesetzt.")}`)}
 async function saveEdit(){if(!canWrite)return;const rec=await getEditable();if(!rec)return;const nextRow=(config.columns||[]).map((c,i)=>draft[c]??rec.row[i]??'–');const nextStatus=draft.Status||nextRow[nextRow.length-1]||rec.status;const next=await updateAppRecord(rec.id,{fields:draft,row:nextRow,status:nextStatus});if(next)setLocal(next);setEditing(false);notify(t('Änderungen gespeichert.'))}
 async function addNote(){if(!canWrite||!note.trim())return;const rec=await getEditable();if(!rec)return;const notes=[String(note.trim()),...((rec.meta?.notes as string[]|undefined)||[])];const next=await updateAppRecord(rec.id,{meta:{...(rec.meta||{}),notes}});if(next)setLocal(next);setNote('');notify(t('Notiz gespeichert.'))}
 async function addTask(){if(!canWrite||!taskText.trim())return;const rec=await getEditable();if(!rec)return;const nextTasks=[...tasks,{id:`t-${Date.now()}`,text:taskText.trim(),done:false}];const next=await updateAppRecord(rec.id,{meta:{...(rec.meta||{}),tasks:nextTasks}});if(next)setLocal(next);setTaskText('')}
 async function toggleTask(taskId:string){if(!canWrite)return;const rec=await getEditable();if(!rec)return;const nextTasks=tasks.map(t=>t.id===taskId?{...t,done:!t.done}:t);const next=await updateAppRecord(rec.id,{meta:{...(rec.meta||{}),tasks:nextTasks}});if(next)setLocal(next)}
 async function workflow(){if(!canWrite)return;
   switch(config.key){
     case 'kunden': {const rec=await getEditable();if(rec)router.push(`/offerten/neu?customerId=${encodeURIComponent(rec.id)}`);break;}
     case 'auftraege': {const current=await getEditable();if(!current)return;const customerId=relationId(current,"customerId");const project=await createAppRecord({module:"projekte",status:"Geplant",row:[`Projekt · ${row[0]}`,row[1]||"Kunde","0 %",row[3]||"CHF 0","Geplant"],fields:{Projekt:`Projekt · ${row[0]}`,Kunde:row[1]||"",Fortschritt:"0 %",Budget:row[3]||"",Status:"Geplant"},positions:current.positions,meta:{relations:{customerId,orderId:current.id},sourceOrder:row[0],tasks:[]}});notify(t("Projekt aus Auftrag erstellt."));router.push(`/projekte/${project.id}`);break;}
     case 'projekte': {const current=await getEditable();if(current)router.push(`/rechnungen/neu?projectId=${encodeURIComponent(current.id)}&customerId=${encodeURIComponent(relationId(current,'customerId'))}`);break;}
     case 'zeiterfassung': await setStatus('Freigegeben'); break;
     case 'spesen': await setStatus(local?.status==='Freigegeben'?'Verbucht':'Freigegeben'); break;
     case 'zahlungen': await setStatus('Zugeordnet'); break;
     case "eingangsrechnungen": {const current=await getEditable();if(!current)return;await setStatus("Freigegeben");if(!Boolean(current.meta?.accountingPosted)){await createAppRecord({module:"buchhaltung",status:"Verbucht",row:[current.fields.Datum||new Date().toISOString().slice(0,10),current.fields.Rechnungsnummer||row[0],current.fields.Aufwandskonto||accountingDefaults.officeExpense,current.fields["Betrag CHF"]||row[3],"Verbucht"],fields:{Datum:current.fields.Datum||"",Beleg:current.fields.Rechnungsnummer||row[0],Konto:current.fields.Aufwandskonto||accountingDefaults.officeExpense,Gegenkonto:accountingDefaults.accountsPayable,Betrag:current.fields["Betrag CHF"]||row[3],Status:"Verbucht"},meta:{relations:{supplierInvoiceId:current.id,supplierId:relationId(current,"supplierId")}}});const u=await updateAppRecord(current.id,{meta:{...(current.meta||{}),accountingPosted:true}});if(u)setLocal(u)}notify(t("Eingangsrechnung freigegeben und Buchung erzeugt."));break;}
     case 'personal': {const current=await getEditable();if(current)router.push(`/abwesenheiten/neu?employeeId=${encodeURIComponent(current.id)}`);break;}
     default: notify(t('Workflow-Aktion ausgeführt.'));
   }
 }
 const actionLabel=config.key==='kunden'?'Offerte erstellen':config.key==='auftraege'?'Projekt erstellen':config.key==='projekte'?'Rechnung erstellen':config.key==='zeiterfassung'?'Zeit freigeben':config.key==='spesen'?(local?.status==='Freigegeben'?'Spese verbuchen':'Spese freigeben'):config.key==='zahlungen'?'Zahlung zuordnen':config.key==='eingangsrechnungen'?'Freigeben und verbuchen':config.key==='personal'?'Abwesenheit erfassen':'Aktion ausführen';
 const notes=(local?.meta?.notes as string[]|undefined)||[];
 const absences=(local?.meta?.absences as string[]|undefined)||[];
 const contacts=(local?.meta?.contacts as string[]|undefined)||[];
 const activities=local?.activities||[];
 const currentId=local?.id||"";
 const related=allRecords.filter(r=>{
   if(r.id===currentId)return false;
   const rel=(r.meta?.relations as Record<string,string>|undefined)||{};
   if(config.key==="kunden")return rel.customerId===currentId||Object.values(r.fields).some(v=>v===row[0]);
   if(config.key==="projekte")return rel.projectId===currentId||Object.values(r.fields).some(v=>v===row[0]);
   if(config.key==="personal")return rel.employeeId===currentId;
   if(config.key==="lieferanten")return rel.supplierId===currentId;
   return false;
 }).slice(0,10);
 async function addAbsence(){if(!canWrite||!absenceText.trim())return;const rec=await getEditable();if(!rec)return;const next=[absenceText.trim(),...absences];const u=await updateAppRecord(rec.id,{meta:{...(rec.meta||{}),absences:next}});if(u)setLocal(u);setAbsenceText('');notify(t('Abwesenheit gespeichert.'))}
 async function addContact(){if(!canWrite||!contactText.trim())return;const rec=await getEditable();if(!rec)return;const next=[contactText.trim(),...contacts];const u=await updateAppRecord(rec.id,{meta:{...(rec.meta||{}),contacts:next}});if(u)setLocal(u);setContactText('');notify(t('Kontakt gespeichert.'))}
 const belegData=local?.meta?.belegDataUrl as string|undefined;
 const attachments=(local?.meta?.attachments as Array<{name:string;dataUrl:string}>|undefined)||[];
 const projectSpent=config.key==='projekte'?related.reduce((sum,r)=>{if(r.module==='spesen')return sum+parseMoney(r.fields['Betrag CHF']||r.fields.Betrag||r.row[3]);if(r.module==='zeiterfassung'){const h=Number(String(r.fields['Dauer in Stunden']||r.fields.Dauer||r.row[3]||'0').replace(/[^0-9.,]/g,'').replace(',','.'))||0;const rate=parseMoney(r.fields["Stundensatz CHF"]||r.fields["Ansatz CHF"]||"0")||(!isProductionMode()?demoAnalyticsFixture.defaultHourlyRate:0);return sum+h*rate}return sum},0):0;
 async function addAttachment(file?:File){if(!canWrite||!file)return;if(isProductionMode()){if(file.size>limitsConfig.maxFileUploadBytes){notify(t('Dateien bis {size} MB sind erlaubt.').replace('{size}',String(megabytes(limitsConfig.maxFileUploadBytes))),'info');return}const form=new FormData();form.set('file',file);form.set('purpose',`${config.key}:${local?.id||id}`);try{const data=await apiFormFetch<{item:{id:string;fileName:string}}>('/api/files',form);const rec=await getEditable();if(!rec)return;const next=[...attachments,{name:data.item.fileName,dataUrl:`/api/files/${data.item.id}`}];const u=await updateAppRecord(rec.id,{meta:{...(rec.meta||{}),attachments:next}});if(u)setLocal(u);notify(t('Anhang gespeichert.'))}catch(e){notify(e instanceof Error?e.message:t('Upload fehlgeschlagen.'),'danger')}return}if(file.size>limitsConfig.maxDemoAttachmentBytes){notify(t('Anhänge sind in der lokalen Demo auf {size} MB begrenzt.').replace('{size}',String(megabytes(limitsConfig.maxDemoAttachmentBytes))),'info');return}const reader=new FileReader();reader.onload=()=>{void (async()=>{const rec=await getEditable();if(!rec)return;const next=[...attachments,{name:file.name,dataUrl:String(reader.result||'')}];const u=await updateAppRecord(rec.id,{meta:{...(rec.meta||{}),attachments:next}});if(u)setLocal(u);notify(t('Anhang gespeichert.'))})()};reader.readAsDataURL(file)}
 function billExpense(){if(!canWrite)return;const description=row[1]||'Spese';const amount=parseMoney(row[3]);const project=row[2]||'';router.push(`/rechnungen/neu?projekt=${encodeURIComponent(project)}&beschreibung=${encodeURIComponent(description)}&betrag=${encodeURIComponent(String(amount))}`)}
 async function refundPayment(){if(!canWrite)return;const amount=-Math.abs(parseMoney(row[3]));const refund=await createAppRecord({module:'zahlungen',status:'Zugeordnet',row:[new Date().toISOString().slice(0,10),row[1]||'Zahler',`REFUND-${row[2]||Date.now()}`,money(amount),'Zugeordnet'],fields:{Datum:new Date().toISOString().slice(0,10),Zahler:row[1]||'',Referenz:`REFUND-${row[2]||''}`,Betrag:money(amount),Zuordnung:'Zugeordnet'},meta:{refundOf:row[2]||row[0]}});notify(t('Rückzahlung als negativer Zahlungsvorgang erstellt.'));router.push(`/zahlungen/${refund.id}`)}

 const translateSeedValue=(value:string)=>!isProductionMode()&&(!local||Boolean(local.meta?.sourceSeed))?t(value):value;
 const detailEntries=Object.entries(local?.fields||seedFields).map(([key,value])=>[key,String(value)] as [string,string]);
 const mobileDetails=mobileDetailEntries(config.key,detailEntries);
 const renderField=([key,value]:[string,string])=><div key={key}><span>{t(key)}</span><strong>{translateSeedValue(value)||"–"}</strong></div>;

 return <div className="page detail-page">
  <section className="detail-heading"><div><div className="eyebrow">{t(config.label)}</div><h1>{translateSeedValue(row[0])}</h1><p>{t(config.description)}</p></div><div className="detail-actions detail-actions-desktop">{canWrite&&<button onClick={()=>{setDraft(local?.fields||seedFields);setEditing(true)}}><Pencil size={17}/>{t("Bearbeiten")}</button>}{canWrite&&local&&<IconButton onClick={remove} aria-label={t("Löschen")}><Trash2 size={17}/></IconButton>}<div className="more-wrap"><IconButton onClick={()=>setMenu(v=>!v)} aria-label={t("Weitere Aktionen")}><MoreHorizontal size={18}/></IconButton>{menu&&<div className="more-menu"><button onClick={()=>{navigator.clipboard?.writeText(window.location.href);notify(t('Link kopiert.'));setMenu(false)}}>{t("Link kopieren")}</button><button onClick={()=>{window.print();setMenu(false)}}>{t("Drucken")}</button>{canWrite&&<button onClick={()=>{setStatus('Archiviert');setMenu(false)}}>{t("Archivieren")}</button>}</div>}</div></div><div className="detail-actions-mobile">{canWrite&&<IconButton aria-label={t("Bearbeiten")} onClick={()=>{setDraft(local?.fields||seedFields);setEditing(true)}}><Pencil size={18}/></IconButton>}<IconButton aria-label={t("Weitere Aktionen")} onClick={()=>setMobileMenu(true)}><MoreHorizontal size={19}/></IconButton></div></section>
  <ResponsiveOverlay open={mobileMenu} title={t("Aktionen")} onClose={()=>setMobileMenu(false)} size="sm"><div className="list-sheet-options"><button type="button" onClick={()=>{navigator.clipboard?.writeText(window.location.href);notify(t("Link kopiert."));setMobileMenu(false)}}>{t("Link kopieren")}</button><button type="button" onClick={()=>{window.print();setMobileMenu(false)}}>{t("Drucken")}</button>{canWrite&&<button type="button" onClick={()=>{void setStatus("Archiviert");setMobileMenu(false)}}>{t("Archivieren")}</button>}{canWrite&&local&&<button type="button" className="danger-action" onClick={()=>{setMobileMenu(false);void remove()}}>{t("Löschen")}</button>}</div></ResponsiveOverlay>

  <section className="detail-grid"><article className="workspace-card detail-main-card"><div className="section-title"><h2>{t("Übersicht")}</h2><span>{t("Aktueller Stand")}</span></div><div className="detail-fields detail-fields-desktop">{detailEntries.map(renderField)}</div><div className="detail-fields detail-fields-mobile">{mobileDetails.primary.map(renderField)}</div>{mobileDetails.additional.length>0&&<details className="mobile-detail-more"><summary><span>{t("Weitere Angaben")}</span><small>{mobileDetails.additional.length}</small><ChevronDown size={16}/></summary><div className="detail-fields">{mobileDetails.additional.map(renderField)}</div></details>}
   <div className="section-title sub-section"><h2>{t("Notizen")}</h2><span>{notes.length}</span></div>{canWrite&&<div className="inline-create"><Input value={note} onChange={e=>setNote(e.target.value)} placeholder={t("Notiz hinzufügen …")}/><button onClick={addNote}><Plus size={16}/>{t("Hinzufügen")}</button></div>}{notes.length>0&&<div className="note-list">{notes.map((n,i)=><p key={`${n}-${i}`}>{n}</p>)}</div>}
   {config.key==='projekte'&&<><div className="section-title sub-section"><h2>{t("Aufgaben und Meilensteine")}</h2><span>{tasks.filter(t=>t.done).length}/{tasks.length}</span></div>{canWrite&&<div className="inline-create"><Input value={taskText} onChange={e=>setTaskText(e.target.value)} placeholder={t("Aufgabe oder Meilenstein …")}/><button onClick={addTask}><Plus size={16}/>{t("Hinzufügen")}</button></div>}<div className="task-check-list">{tasks.map(t=><button key={t.id} onClick={()=>canWrite&&toggleTask(t.id)} className={t.done?'done':''}><CheckCircle2 size={17}/><span>{t.text}</span></button>)}{tasks.length===0&&<small>{t("Noch keine Aufgaben vorhanden.")}</small>}</div></>}
   {config.key==='kunden'&&<><div className="section-title sub-section"><h2>{t("Kontakte")}</h2><span>{contacts.length}</span></div>{canWrite&&<div className="inline-create"><Input value={contactText} onChange={e=>setContactText(e.target.value)} placeholder={t("Name · E-Mail · Telefon")}/><button onClick={addContact}><Plus size={16}/>{t("Kontakt")}</button></div>}<div className="note-list">{contacts.map((a,i)=><p key={`${a}-${i}`}>{a}</p>)}</div></>}
   {config.key==='personal'&&<><div className="section-title sub-section"><h2>{t("Ferien und Abwesenheiten")}</h2><span>{absences.length}</span></div>{canWrite&&<div className="inline-create"><Input value={absenceText} onChange={e=>setAbsenceText(e.target.value)} placeholder={t("z. B. Ferien 01.10.–05.10.")}/><button onClick={addAbsence}><Plus size={16}/>{t("Erfassen")}</button></div>}<div className="note-list">{absences.map((a,i)=><p key={`${a}-${i}`}>{a}</p>)}</div></>}
   {config.key==='spesen'&&belegData&&<><div className="section-title sub-section"><h2>{t("Beleg")}</h2></div><div className="receipt-preview">{belegData.startsWith('data:image')?<object data={belegData} aria-label={t("Spesenbeleg")}/>:<a href={belegData} target="_blank" rel="noreferrer">{t("PDF-Beleg öffnen")}</a>}</div></>}
   {local?.positions&&local.positions.length>0&&<><div className="section-title sub-section"><h2>{t("Positionen")}</h2><span>{local.positions.length}</span></div><div className="simple-position-list">{local.positions.map((p,i)=><div key={`${p.description}-${i}`}><span>{p.description}</span><span>{p.quantity} × {money(p.unitPrice)}</span><strong>{money(p.quantity*p.unitPrice)}</strong></div>)}</div></>}
   {config.key==='projekte'&&<div className="project-budget-summary"><div><span>{t("Erfasster Aufwand")}</span><strong>{money(projectSpent)}</strong></div><div><span>{t("Budget")}</span><strong>{row[3]||'–'}</strong></div></div>}
   {(config.key==='kunden'||config.key==='projekte')&&<><div className="section-title sub-section"><h2>{t("Verknüpfte Vorgänge")}</h2><span>{related.length}</span></div><div className="related-list">{related.map(r=><Link key={r.id} href={`/${r.module}/${r.id}`}><span>{t(modules.find(m=>m.key===r.module)?.label||r.module)}</span><strong>{r.row[0]}</strong><small>{t(r.status)}</small></Link>)}{related.length===0&&<small>{t("Noch keine verknüpften Vorgänge.")}</small>}</div></>}
   <div className="section-title sub-section"><h2>{t("Dokumente")}</h2><span>{attachments.length}</span></div>{canWrite&&<label className="attachment-button"><Plus size={16}/>{t("Dokument anhängen")}<input type="file" accept="image/*,.pdf,.doc,.docx" onChange={e=>addAttachment(e.target.files?.[0])}/></label>}<div className="attachment-list">{attachments.map((a,i)=><a key={`${a.name}-${i}`} href={a.dataUrl} target="_blank" rel="noreferrer"><FileText size={16}/><span>{a.name}</span></a>)}</div>
  </article>
  <article className="workspace-card timeline-card">{canWrite&&<><div className="section-title"><h2>{t("Aktionen")}</h2><span>{t("Workflow")}</span></div><button className="detail-workflow-button" onClick={workflow}>{['zeiterfassung','spesen','zahlungen'].includes(config.key)?<CheckCircle2 size={17}/>:config.key==='projekte'?<Send size={17}/>:<FilePlus2 size={17}/>} {t(actionLabel)}</button>{config.key==='auftraege'&&<div className="secondary-workflow-actions"><button onClick={()=>setStatus('In Arbeit')}>{t("Auftrag starten")}</button><button onClick={()=>setStatus('Abgeschlossen')}>{t("Abschliessen")}</button><button onClick={()=>window.print()}>{t("Bestätigung drucken")}</button></div>}{config.key==='projekte'&&<div className="secondary-workflow-actions"><button onClick={()=>setStatus('In Arbeit')}>{t("Projekt starten")}</button><button onClick={()=>setStatus('Abgeschlossen')}>{t("Projekt abschliessen")}</button></div>}{config.key==='spesen'&&<div className="secondary-workflow-actions"><button onClick={()=>setStatus('Abgelehnt')}>{t("Ablehnen")}</button><button onClick={billExpense}>{t("Weiterverrechnen")}</button></div>}{config.key==='zeiterfassung'&&<div className="secondary-workflow-actions"><button onClick={()=>setStatus('Entwurf')}>{t("Zurückweisen")}</button></div>}{config.key==='zahlungen'&&<div className="secondary-workflow-actions"><button onClick={refundPayment}>{t("Rückzahlung erfassen")}</button></div>}</>}<div className="section-title sub-section"><h2>{t("Aktivität")}</h2><span>{t("Verlauf")}</span></div>{activities.length?activities.slice(0,8).map((a,i)=><div className="timeline-item" key={`${a.at}-${i}`}><CalendarDays size={18}/><div><strong>{formatDateTime(a.at)}</strong><span>{t(a.text)}</span></div></div>):<div className="activity-empty-state"><CalendarDays size={17}/><div><strong>{t("Keine Aktivität vorhanden")}</strong><span>{t("Neue Aktivitäten erscheinen hier automatisch.")}</span></div></div>}</article></section>

  <ResponsiveOverlay open={canWrite&&editing} title={`${t(config.label)} ${t("bearbeiten")}`} onClose={()=>setEditing(false)} size="md" className="record-edit-overlay" actions={<><Button variant="secondary" onClick={()=>setEditing(false)}>{t("Abbrechen")}</Button><Button icon={<Save size={17}/>} onClick={saveEdit}>{t("Speichern")}</Button></>}><FormSection><div className="form-grid record-edit-fields">{Object.keys(draft).map((k,index)=><label key={k} className={index>=4?"record-edit-secondary":""}><span>{t(k)}</span><Input value={draft[k]??''} onChange={e=>setDraft(v=>({...v,[k]:e.target.value}))}/></label>)}</div>{Object.keys(draft).length>4&&<details className="record-edit-more"><summary>{t("Weitere Angaben")}</summary><div className="form-grid">{Object.keys(draft).slice(4).map(k=><label key={`more-${k}`}><span>{t(k)}</span><Input value={draft[k]??''} onChange={e=>setDraft(v=>({...v,[k]:e.target.value}))}/></label>)}</div></details>}</FormSection></ResponsiveOverlay>
 </div>
}
