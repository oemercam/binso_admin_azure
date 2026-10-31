"use client";
import {useState} from 'react';
import {FormPage} from './binso-ux';
import {Button,Field,Input,FormActions} from './ui';
import {LocalizedText} from '@/lib/client/locale';
import {businessDate} from '@/lib/financial-status';

/** Only old paused totals lack dates. Never silently assign them to today. */
export function TimerDateConfirmation({seconds,earliest,busy,onCancel,onConfirm}:{seconds:number;earliest:string;busy:boolean;onCancel:()=>void;onConfirm:(days:Array<{date:string;seconds:number}>)=>void}){
 const [rows,setRows]=useState([{date:'',seconds:String(seconds)}]);
 const latest=businessDate(),valid=rows.every(row=>row.date>=earliest&&row.date<=latest&&Number.isSafeInteger(Number(row.seconds))&&Number(row.seconds)>0)&&new Set(rows.map(row=>row.date)).size===rows.length&&rows.reduce((sum,row)=>sum+Number(row.seconds),0)===seconds;
 const update=(index:number,key:'date'|'seconds',value:string)=>setRows(current=>current.map((row,i)=>i===index?{...row,[key]:value}:row));
 return <FormPage open busy={busy} label="Bisherige Zeit zuordnen" description="Für diese ältere Zeitmessung fehlen Tagesangaben. Bestätige die tatsächlichen Arbeitstage; Pausen werden nicht als Arbeitszeit verteilt." onClose={onCancel}>
  <p><LocalizedText>{'Gesamtdauer (Sekunden)'}</LocalizedText>: {seconds}</p>
  {rows.map((row,index)=><section className="form-grid" key={index}>
   <Field label="Datum"><Input type="date" min={earliest} max={latest} required value={row.date} disabled={busy} onChange={event=>update(index,'date',event.target.value)}/></Field>
   <Field label="Dauer (Sekunden)"><Input type="number" min="1" step="1" required value={row.seconds} disabled={busy} onChange={event=>update(index,'seconds',event.target.value)}/></Field>
   {rows.length>1&&<Button variant="secondary" disabled={busy} onClick={()=>setRows(current=>current.filter((_,i)=>i!==index))}><LocalizedText>{'Entfernen'}</LocalizedText></Button>}
  </section>)}
  <Button variant="secondary" disabled={busy||rows.length>=366} onClick={()=>setRows(current=>[...current,{date:'',seconds:''}])}><LocalizedText>{'Tag hinzufügen'}</LocalizedText></Button>
  <FormActions sheet><Button variant="secondary" disabled={busy} onClick={onCancel}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite disabled={busy||!valid} onClick={()=>onConfirm(rows.map(row=>({date:row.date,seconds:Number(row.seconds)})))}><LocalizedText>{'Bestätigen und speichern'}</LocalizedText></Button></FormActions>
 </FormPage>;
}
