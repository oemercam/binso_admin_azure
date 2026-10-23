'use client';
import {useEffect,useRef,useState} from 'react';
import {useDataRevision} from '@/lib/client/use-api-query';
import {readClientSession} from '@/lib/client/session-cache';
import {apiPost,apiReadPost} from '@/lib/client/backend';
import {tenantCanCreateAt} from '@/lib/permissions';
import {customerImportFields,contactImportFields,importLimits} from '@/lib/import-table';
import {reportCsv} from '@/lib/report-export';
import {LocalizedText} from '@/lib/client/locale';
import {useLocale} from '@/lib/client/locale';
import {translateMessage} from '@/lib/locales';
import {FileUpload} from './file-upload';
import {ActionsMenu,ActionRow,FormSheet,ListRow} from './binso-ux';
import {Button,Field,Select,FormActions,ErrorState,Status} from './ui';
type Table={headers:string[];rows:string[][];sheets:string[];sheet:string;rowNumbers:number[]};
type Reviewed={row:number;input:Record<string,unknown>;issues:string[];duplicate:boolean};
export function CustomerImportControl({customerId,onOpenArchive,onOpenMerge,header=false}:{header?:boolean;customerId?:string;onOpenArchive?:()=>void;onOpenMerge?:()=>void}){
 const {locale}=useLocale(),revision=useDataRevision([]),scope=useRef(revision);
 const [allowed,setAllowed]=useState(false),[open,setOpen]=useState(false),[file,setFile]=useState<File|null>(null),[table,setTable]=useState<Table|null>(null),[mapping,setMapping]=useState<Record<string,number>>({}),[review,setReview]=useState<Reviewed[]|null>(null),[count,setCount]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef(false),replay=useRef<{body:string;key:string}|null>(null),attempt=useRef(0);
 const fields=customerId?contactImportFields:customerImportFields;
 const reset=()=>{attempt.current++;setFile(null);setTable(null);setMapping({});setReview(null);setCount(null);setError('');replay.current=null;};
 useEffect(()=>{let active=true;readClientSession().then(s=>{if(active)setAllowed(s.authenticated&&tenantCanCreateAt(s.tenant?.role??'','/kunden/neu',s.tenant?.moduleProfile))}).catch(()=>{if(active)setAllowed(false)});return()=>{active=false}},[revision]);
 useEffect(()=>{if(scope.current!==revision){scope.current=revision;attempt.current++;setOpen(false);setFile(null);setTable(null);setReview(null);replay.current=null;}},[revision]);
 const load=async(sheet='')=>{
  if(!file||pending.current)return;pending.current=true;setBusy(true);setError('');const current=attempt.current;
  try{const form=new FormData();form.set('file',file);form.set('sheet',sheet);const result=await apiReadPost<Table>('/api/customers/import',form);if(current!==attempt.current)return;setTable(result);setMapping(Object.fromEntries(fields.map(([key,label])=>[key,result.headers.findIndex(value=>[key.toLowerCase(),label.toLowerCase()].includes(value.trim().toLowerCase()))])));setReview(null);}
  catch(error){if(current===attempt.current)setError(error instanceof Error?error.message:'Import konnte nicht vorbereitet werden.');}
  finally{pending.current=false;setBusy(false);}
 };
 const preview=async()=>{
  if(!table||pending.current)return;pending.current=true;setBusy(true);setError('');const current=attempt.current;
  try{const rows=table.rows.map((row,index)=>({...Object.fromEntries(fields.filter(([key])=>mapping[key]>=0).map(([key])=>[key,row[mapping[key]]??''])),_sourceRow:table.rowNumbers[index]??index+2}));const result=await apiReadPost<{items:Reviewed[]}>('/api/customers/import',{action:'preview',target:customerId?'contacts':'customers',customerId,rows});if(current===attempt.current){setReview(result.items);replay.current=null;}}
  catch(error){if(current===attempt.current)setError(error instanceof Error?error.message:'Import konnte nicht vorbereitet werden.');}
  finally{pending.current=false;setBusy(false);}
 };
 const valid=review?.filter(row=>row.issues.length===0)??[];
 const commit=async()=>{
  if(!valid.length||pending.current)return;pending.current=true;setBusy(true);setError('');const current=attempt.current;
  const body={action:'commit',target:customerId?'contacts':'customers',customerId,rows:valid.map(row=>row.input)},serialized=JSON.stringify(body);
  const request=replay.current?.body===serialized?replay.current:{body:serialized,key:crypto.randomUUID()};replay.current=request;
  try{const result=await apiPost<{count:number;created:Array<{id:string}>}>('/api/customers/import',body,{idempotencyKey:request.key});if(result.count!==valid.length||result.created?.length!==valid.length||!result.created.every(row=>typeof row.id==='string'&&!!row.id))throw Error('Import konnte nicht bestätigt werden.');if(current===attempt.current)setCount(result.count);}
  catch(error){if(current===attempt.current)setError(error instanceof Error?error.message:'Import konnte nicht bestätigt werden.');}
  finally{pending.current=false;setBusy(false);}
 };
 const report=()=>{if(!review)return;const rows=[['Zeile','Status','Hinweis'],...review.map(row=>[String(row.row),translateMessage(row.issues.length?'Prüfen':'Bereit',locale),row.issues.map(issue=>translateMessage(issue,locale)).join(' ')])];const url=URL.createObjectURL(new Blob([reportCsv(rows)],{type:'text/csv;charset=utf-8'})),anchor=document.createElement('a');anchor.href=url;anchor.download='binso-importbericht.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 if(!allowed)return null;
 return <><ActionsMenu header={header} label={customerId?'Kontaktaktionen':'Kundenaktionen'}><ActionRow title="Importieren" icon="upload" onClick={()=>{reset();setOpen(true)}}/>{onOpenMerge&&<ActionRow title="Dubletten zusammenführen" icon="users" onClick={onOpenMerge}/>}{onOpenArchive&&<ActionRow title="Archiv" icon="file" onClick={onOpenArchive}/>}</ActionsMenu><FormSheet label={customerId?'Kontakte importieren':'Kunden importieren'} open={open} headerActions={review?<ActionsMenu header label="Importbericht"><ActionRow title="CSV exportieren" icon="file" onClick={report}/></ActionsMenu>:undefined} onClose={()=>{setOpen(false);reset()}} busy={busy} dirty={!!file&&count===null}>
 {count!==null?<Status tone="success"><LocalizedText>Import abgeschlossen</LocalizedText>: {count}</Status>:<>
 {!table?<FileUpload label="Importdatei" file={file} accept={['.csv','.xlsx','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']} maxBytes={importLimits.bytes} busy={busy} onSelect={file=>{setFile(file);setReview(null)}} onRemove={()=>{setFile(null);setReview(null)}}/>:<>
 {table.sheets.length>1&&<Field label="Arbeitsblatt"><Select disabled={busy} value={table.sheet} onChange={event=>void load(event.target.value)}>{table.sheets.map(sheet=><option key={sheet} value={sheet}>{sheet}</option>)}</Select></Field>}
 {!review?<div className="form-grid">{fields.map(([key,label,required])=><Field key={key} label={label+(required?' *':'')}><Select disabled={busy} value={String(mapping[key]??-1)} onChange={event=>setMapping({...mapping,[key]:Number(event.target.value)})}><option value="-1"><LocalizedText>Nicht zuordnen</LocalizedText></option>{table.headers.map((header,index)=><option key={index} value={index}>{index+1}. {header||'—'}</option>)}</Select></Field>)}</div>:<>
 <p><LocalizedText>Neue gültige Zeilen</LocalizedText>: {valid.length} / {review.length}. <LocalizedText>Fehler und Dubletten werden nicht übernommen. Bestehende Daten bleiben unverändert.</LocalizedText></p>

 {review.map(row=><ListRow key={row.row} title={String(row.input.name??[row.input.firstName,row.input.lastName].filter(Boolean).join(' '))||'—'} translateTitle={false} meta={<><LocalizedText>Zeile</LocalizedText> {row.row} · <LocalizedText>{row.issues[0]??'Bereit'}</LocalizedText>{row.input.email?' · '+String(row.input.email):''}</>} status={row.issues.length?'Prüfen':'Bereit'} tone={row.issues.length?'warning':'success'}/>)}
 </>}
 </>}
 <p><LocalizedText>CSV als UTF-8 oder XLSX ohne Formeln. Höchstens 500 Datenzeilen, 32 Spalten und 3 MB.</LocalizedText></p>
 </>}
 {error&&<ErrorState>{error}</ErrorState>}
 <FormActions sheet><Button variant="secondary" disabled={busy} onClick={()=>{if(review&&count===null){setReview(null);replay.current=null;}else if(table&&count===null){setTable(null);}else{setOpen(false);reset();}}}><LocalizedText>{count!==null?'Schliessen':table?'Zurück':'Abbrechen'}</LocalizedText></Button>{count===null&&<Button disabled={busy||!file||!!table&&!review&&fields.some(([key,,required])=>required&&(mapping[key]??-1)<0)||!!review&&!valid.length} onClick={()=>void (!table?load():review?commit():preview())}><LocalizedText>{busy?'Wird geprüft …':!table?'Datei prüfen':review?'Neue Datensätze importieren':'Vorschau prüfen'}</LocalizedText></Button>}</FormActions>
 </FormSheet></>;
}
