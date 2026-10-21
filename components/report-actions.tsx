"use client";
import {useRef,useState} from 'react';
import {apiGetFile,apiPost} from '@/lib/client/backend';
import {useLocale} from '@/lib/client/locale';
import {ActionsMenu,ActionRow} from './binso-ux';
import {ErrorState} from './ui';
import {DocumentModal} from './pdf-preview';
import {ReportMailSheet} from './report-mail';
import {ReportShareSheet} from './report-share';
import {useApiQuery} from '@/lib/client/use-api-query';
import type {ClientSession} from '@/lib/client/session-cache';
import {tenantCan} from '@/lib/permissions';

/** One transport/download/viewer owner for authorized report variants. */
export function ReportActions({query,disabled=false,onTimeReport}:{query:string;disabled?:boolean;onTimeReport?:()=>void}){
 const {locale}=useLocale(),pending=useRef(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[preview,setPreview]=useState<Blob|null>(null);
 const preparation=useRef<{query:string;locale:string;key:string}|null>(null);
 const [mail,setMail]=useState<{id:string;blob:Blob}|null>(null),session=useApiQuery<ClientSession>('/api/auth/session').data;
 const [share,setShare]=useState<string|null>(null);
 const canSend=!!session?.authenticated&&!session.demo&&!session.tenant?.readOnly&&tenantCan(session.tenant?.role??'','documents:write',session.tenant?.moduleProfile);
 const run=async(format:'csv'|'pdf'|'mail'|'share')=>{
  if(pending.current||disabled)return;pending.current=true;setBusy(true);setError('');
  try{
   if(format!=='csv'){
    // Preserve the request identity after an uncertain response. A fresh,
    // completed preview is a new snapshot; do not keep business PDFs in storage.
    if(preparation.current?.query!==query||preparation.current.locale!==locale)preparation.current={query,locale,key:crypto.randomUUID()};
    const response=await apiPost<{item?:{id?:unknown}}>('/api/reports/exports',{query,locale},{idempotencyKey:preparation.current.key});
    if(typeof response.item?.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(response.item.id))throw Error('Daten konnten nicht geladen werden.');
    const file=await apiGetFile('/api/reports/exports/'+response.item.id,'application/pdf');
    if(format==='share')setShare(response.item.id);else if(format==='mail')setMail({id:response.item.id,blob:file.blob});else setPreview(file.blob);preparation.current=null;return;
   }
   const file=await apiGetFile('/api/reports?'+query+'&format=csv&lang='+locale,'text/csv');
   const url=URL.createObjectURL(file.blob),anchor=document.createElement('a');anchor.href=url;anchor.download=file.fileName?.endsWith('.csv')?file.fileName:'binso-report.csv';
   try{anchor.hidden=true;document.body.appendChild(anchor);anchor.click()}finally{anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000)}
  }catch(issue){setError(issue instanceof Error?issue.message:'Daten konnten nicht geladen werden.')}
  finally{pending.current=false;setBusy(false)}
 };
 return <><ActionsMenu label="Berichtsaktionen" busy={busy}><ActionRow title="PDF ansehen" icon="file" disabled={disabled||busy} onClick={()=>void run('pdf')}/><ActionRow title="CSV exportieren" icon="download" disabled={disabled||busy} onClick={()=>void run('csv')}/>{canSend&&<><ActionRow title="Per E-Mail senden" icon="mail" disabled={disabled||busy} onClick={()=>void run('mail')}/><ActionRow title="Freigabelink" icon="link" disabled={disabled||busy} onClick={()=>void run('share')}/></>}{onTimeReport&&<ActionRow title="Zeitrapport" icon="time" disabled={disabled||busy} onClick={onTimeReport}/>}</ActionsMenu>{error&&<ErrorState>{error}</ErrorState>}{preview&&<DocumentModal title="Berichte" fileBlob={preview} fileName="binso-report" onClose={()=>setPreview(null)}/>} {mail&&<ReportMailSheet {...mail} onClose={()=>setMail(null)}/>} {share&&<ReportShareSheet id={share} onClose={()=>setShare(null)}/>}</>;
}
