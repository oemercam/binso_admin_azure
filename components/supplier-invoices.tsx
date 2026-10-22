"use client";
import {useId,useRef,useState} from 'react';
import {apiPost} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {LocalizedText,useLocale} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {formatCurrency} from '@/lib/financial-status';
import {EntityFiles} from './entity-files';
import {ActionRow,ActionsMenu,FormSheet} from './binso-ux';
import {Button,EmptyState,ErrorState,Field,FormActions,Input,LoadingState,SectionTitle,Select} from './ui';

type Invoice={id:string;supplier_invoice_no:string|null;invoice_date:string|null;due_date:string|null;net_amount:string|null;vat_amount:string|null;total_amount:string|null;currency:string|null;note:string|null;version:number;status:string};
type Draft={number:string;invoiceDate:string;dueDate:string;netAmount:string;vatAmount:string;totalAmount:string;currency:string;note:string};
const blank:Draft={number:'',invoiceDate:'',dueDate:'',netAmount:'',vatAmount:'',totalAmount:'',currency:'CHF',note:''};
export function SupplierInvoices({supplierId,mayWrite}:{supplierId:string;mayWrite:boolean}){
 const endpoint='/api/suppliers/'+encodeURIComponent(supplierId)+'/invoices',query=useApiQuery<{items:Invoice[]}>(endpoint),formId=useId(),{locale}=useLocale();
 const [draft,setDraft]=useState<Draft>(blank),[selected,setSelected]=useState<Invoice|null>(null),[original,setOriginal]=useState(JSON.stringify(blank)),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [receipts,setReceipts]=useState<Invoice|null>(null);
 const pending=useRef(false),attempt=useRef<{body:string;key:string}|null>(null);
 const edit=(invoice:Invoice|null)=>{
  const next=invoice?{number:invoice.supplier_invoice_no??'',invoiceDate:invoice.invoice_date??'',dueDate:invoice.due_date??'',netAmount:invoice.net_amount??'',vatAmount:invoice.vat_amount??'',totalAmount:invoice.total_amount??'',currency:invoice.currency??'',note:invoice.note??''}:blank;
  setDraft(next);setSelected(invoice);setOriginal(JSON.stringify(next));setError('');attempt.current=null;setOpen(true);
 };
 const field=(key:keyof Draft,value:string)=>setDraft(current=>({...current,[key]:value}));
 const save=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try{
   const body={...draft,...(selected?{id:selected.id,expectedRevision:selected.version}:{})},serialized=JSON.stringify(body);
   if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};
   const result=await apiPost<{item:Invoice}>(endpoint,body,{idempotencyKey:attempt.current.key});
   if(!result.item?.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');
   setOpen(false);query.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:'Änderung konnte nicht gespeichert werden.');}
  finally{pending.current=false;setBusy(false);}
 };
 return <section className="surface">
  <SectionTitle title="Eingangsrechnungen" action={mayWrite?<ActionsMenu label="Eingangsrechnungen"><ActionRow requiresWrite icon="plus" title="Eingangsrechnungsentwurf" onClick={()=>edit(null)}/></ActionsMenu>:undefined}/>
  <p className="technical-hint"><LocalizedText>{'Entwürfe können unvollständig gespeichert werden. Sie sind weder freigegeben noch bezahlt.'}</LocalizedText></p>
  {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:!query.data?.items.length?<EmptyState title="Keine Eingangsrechnungen"/>:<div className="action-list">{query.data.items.map(invoice=><div key={invoice.id} className="assignment-row"><div><b>{invoice.supplier_invoice_no||<LocalizedText>{'Nummer offen'}</LocalizedText>}</b><p>{invoice.total_amount===null?<LocalizedText>{'Betrag offen'}</LocalizedText>:invoice.currency?formatCurrency(Number(invoice.total_amount),invoice.currency,localeTags[locale]):<>{invoice.total_amount}{' '}<LocalizedText>{'Währung ungeklärt'}</LocalizedText></>}</p></div><span><LocalizedText>{({draft:'Entwurf',open:'Offen',review:'In Prüfung',paid:'Bezahlt'} as Record<string,string>)[invoice.status]??invoice.status}</LocalizedText></span><ActionsMenu label="Eingangsrechnungen"><ActionRow icon="file" title="Belege" onClick={()=>setReceipts(invoice)}/>{invoice.status==='draft'&&mayWrite&&<ActionRow requiresWrite icon="edit" title="Entwurf bearbeiten" onClick={()=>edit(invoice)}/>}</ActionsMenu></div>)}</div>}
  {receipts&&<FormSheet open onClose={()=>setReceipts(null)} label="Eingangsrechnungsbelege"><EntityFiles purpose="supplier_invoice_receipt" entityId={receipts.id} readOnly={!mayWrite||receipts.status!=='draft'} title="Belege"/></FormSheet>}
  <FormSheet open={open} onClose={()=>setOpen(false)} label="Eingangsrechnungsentwurf" busy={busy} dirty={JSON.stringify(draft)!==original}>
   <form id={formId} onSubmit={event=>{event.preventDefault();void save();}}><div className="form-grid two">
    <Field label="Rechnungsnummer"><Input maxLength={120} value={draft.number} onChange={event=>field('number',event.target.value)}/></Field>
    <Field label="Währung"><Select value={draft.currency} onChange={event=>field('currency',event.target.value)}><option value=""><LocalizedText>{'Währung ungeklärt'}</LocalizedText></option><option value="CHF">CHF</option><option value="EUR">EUR</option></Select></Field>
    <Field label="Rechnungsdatum"><Input type="date" value={draft.invoiceDate} onChange={event=>field('invoiceDate',event.target.value)}/></Field>
    <Field label="Fällig am"><Input type="date" min={draft.invoiceDate||undefined} value={draft.dueDate} onChange={event=>field('dueDate',event.target.value)}/></Field>
    <Field label="Nettobetrag"><Input inputMode="decimal" value={draft.netAmount} onChange={event=>field('netAmount',event.target.value.replace(',','.'))}/></Field>
    <Field label="MwSt.-Betrag"><Input inputMode="decimal" value={draft.vatAmount} onChange={event=>field('vatAmount',event.target.value.replace(',','.'))}/></Field>
    <Field label="Gesamtbetrag"><Input inputMode="decimal" value={draft.totalAmount} onChange={event=>field('totalAmount',event.target.value.replace(',','.'))}/></Field>
    <Field label="Notiz"><Input maxLength={2000} value={draft.note} onChange={event=>field('note',event.target.value)}/></Field>
   </div></form>
   {error&&<ErrorState>{error}</ErrorState>}
   <FormActions sheet><Button variant="secondary" disabled={busy} onClick={()=>setOpen(false)}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite type="submit" form={formId} disabled={busy}><LocalizedText>{'Entwurf speichern'}</LocalizedText></Button></FormActions>
  </FormSheet>
 </section>;
}
