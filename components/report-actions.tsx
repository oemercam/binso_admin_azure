"use client";
import {useRef,useState} from 'react';
import {apiGetFile} from '@/lib/client/backend';
import {useLocale} from '@/lib/client/locale';
import {ActionsMenu,ActionRow} from './binso-ux';
import {ErrorState} from './ui';
import {DocumentModal} from './pdf-preview';

/** One transport/download/viewer owner for authorized report variants. */
export function ReportActions({query,disabled=false,onTimeReport}:{query:string;disabled?:boolean;onTimeReport?:()=>void}){
 const {locale}=useLocale(),pending=useRef(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[preview,setPreview]=useState<Blob|null>(null);
 const run=async(format:'csv'|'pdf')=>{
  if(pending.current||disabled)return;pending.current=true;setBusy(true);setError('');
  try{
   const file=await apiGetFile('/api/reports?'+query+'&format='+format+'&lang='+locale,format==='csv'?'text/csv':'application/pdf');
   if(format==='pdf'){setPreview(file.blob);return;}
   const url=URL.createObjectURL(file.blob),anchor=document.createElement('a');anchor.href=url;anchor.download=file.fileName?.endsWith('.csv')?file.fileName:'binso-report.csv';
   try{anchor.hidden=true;document.body.appendChild(anchor);anchor.click()}finally{anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000)}
  }catch(issue){setError(issue instanceof Error?issue.message:'Daten konnten nicht geladen werden.')}
  finally{pending.current=false;setBusy(false)}
 };
 return <><ActionsMenu label="Berichtsaktionen" busy={busy}><ActionRow title="PDF ansehen" icon="file" disabled={disabled||busy} onClick={()=>void run('pdf')}/><ActionRow title="CSV exportieren" icon="download" disabled={disabled||busy} onClick={()=>void run('csv')}/>{onTimeReport&&<ActionRow title="Zeitrapport" icon="time" disabled={disabled||busy} onClick={onTimeReport}/>}</ActionsMenu>{error&&<ErrorState>{error}</ErrorState>}{preview&&<DocumentModal title="Berichte" fileBlob={preview} fileName="binso-report" onClose={()=>setPreview(null)}/>}</>;
}
