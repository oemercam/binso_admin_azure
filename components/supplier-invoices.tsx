"use client";
import {useId,useRef,useState} from 'react';
import {apiPost} from '@/lib/client/backend';
import {useApiQuery,useDataRevision} from '@/lib/client/use-api-query';
import {LocalizedText,useLocale} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {businessDate,formatCurrency} from '@/lib/financial-status';
import type {SupplierMatchInput} from '@/lib/supplier-invoice-match';
import type {compareSupplierInvoice} from '@/lib/supplier-invoice-match';
import {apApprovalRoles,type APApprovalPolicy} from '@/lib/supplier-approval-policy';
import {EntityFiles} from './entity-files';
import {ActionRow,ActionsMenu,FormSheet} from './binso-ux';
import {Button,Checkbox,EmptyState,ErrorState,Field,FormActions,Input,LoadingState,SectionTitle,Select,Textarea} from './ui';

type Invoice={id:string;supplier_invoice_no:string|null;invoice_date:string|null;due_date:string|null;net_amount:string|null;vat_amount:string|null;total_amount:string|null;currency:string|null;note:string|null;version:number;status:string;v26_review_id:string|null};
type Draft={number:string;invoiceDate:string;dueDate:string;netAmount:string;vatAmount:string;totalAmount:string;currency:string;note:string};
const blank:Draft={number:'',invoiceDate:'',dueDate:'',netAmount:'',vatAmount:'',totalAmount:'',currency:'CHF',note:''};
export function SupplierInvoices({supplierId,mayWrite}:{supplierId:string;mayWrite:boolean}){
 const endpoint='/api/suppliers/'+encodeURIComponent(supplierId)+'/invoices',query=useApiQuery<{items:Invoice[]}>(endpoint),formId=useId(),{locale}=useLocale();
 const [draft,setDraft]=useState<Draft>(blank),[selected,setSelected]=useState<Invoice|null>(null),[original,setOriginal]=useState(JSON.stringify(blank)),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [receipts,setReceipts]=useState<Invoice|null>(null);
 const [policyOpen,setPolicyOpen]=useState(false);
 const [reviewing,setReviewing]=useState<{invoice:Invoice;scope:string}|null>(null);
 const scope=useDataRevision([]),[matching,setMatching]=useState<{invoice:Invoice;scope:string}|null>(null);
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
  <SectionTitle title="Eingangsrechnungen" action={<ActionsMenu label="Eingangsrechnungen">{mayWrite&&<ActionRow requiresWrite icon="plus" title="Eingangsrechnungsentwurf" onClick={()=>edit(null)}/>}<ActionRow icon="settings" title="Freigaberegeln" onClick={()=>setPolicyOpen(true)}/></ActionsMenu>}/>
  <p className="technical-hint"><LocalizedText>{'Entwürfe können unvollständig gespeichert werden. Sie sind weder freigegeben noch bezahlt.'}</LocalizedText></p>
  {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:!query.data?.items.length?<EmptyState title="Keine Eingangsrechnungen"/>:<div className="action-list">{query.data.items.map(invoice=><div key={invoice.id} className="assignment-row"><div><b>{invoice.supplier_invoice_no||<LocalizedText>{'Nummer offen'}</LocalizedText>}</b><p>{invoice.total_amount===null?<LocalizedText>{'Betrag offen'}</LocalizedText>:invoice.currency?formatCurrency(Number(invoice.total_amount),invoice.currency,localeTags[locale]):<>{invoice.total_amount}{' '}<LocalizedText>{'Währung ungeklärt'}</LocalizedText></>}</p></div><span><LocalizedText>{invoice.v26_review_id?'Freigegeben':({draft:'Entwurf',open:'Offen',review:'In Prüfung',paid:'Bezahlt'} as Record<string,string>)[invoice.status]??invoice.status}</LocalizedText></span><ActionsMenu label="Eingangsrechnungen"><ActionRow icon="file" title="Belege" onClick={()=>setReceipts(invoice)}/><ActionRow icon="check" title="Rechnung prüfen" onClick={()=>setReviewing({invoice,scope})}/><ActionRow icon="receipt" title="Leistungen abgleichen" onClick={()=>setMatching({invoice,scope})}/>{invoice.status==='draft'&&mayWrite&&<ActionRow requiresWrite icon="edit" title="Entwurf bearbeiten" onClick={()=>edit(invoice)}/>}</ActionsMenu></div>)}</div>}
  {matching?.scope===scope&&<SupplierInvoiceMatch key={scope+matching.invoice.id} supplierId={supplierId} invoice={matching.invoice} mayWrite={mayWrite&&matching.invoice.status==='draft'} onClose={()=>setMatching(null)}/>}
  {reviewing?.scope===scope&&<SupplierInvoiceReview key={scope+reviewing.invoice.id} supplierId={supplierId} invoice={reviewing.invoice} mayWrite={mayWrite} onClose={()=>setReviewing(null)} onSaved={()=>{setReviewing(null);query.refresh();}} onMatch={()=>{setMatching({invoice:reviewing.invoice,scope});setReviewing(null);}}/>}
  {policyOpen&&<SupplierApprovalPolicy key={scope} onClose={()=>setPolicyOpen(false)}/>}
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

function SupplierApprovalPolicy({onClose}:{onClose:()=>void}){
 const query=useApiQuery<{item:{policy:APApprovalPolicy;revision:number};canConfigure:boolean}>('/api/suppliers/approval-policy');
 if(query.data&&!query.loading&&!query.error)return <SupplierApprovalPolicyEditor key={query.data.item.revision} initial={query.data.item} canConfigure={query.data.canConfigure} onClose={onClose}/>;
 return <FormSheet open label="Freigaberegeln" onClose={onClose}>{query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:<LoadingState/>}</FormSheet>;
}
function SupplierApprovalPolicyEditor({initial,canConfigure,onClose}:{initial:{policy:APApprovalPolicy;revision:number};canConfigure:boolean;onClose:()=>void}){
 const [policy,setPolicy]=useState(initial.policy),[busy,setBusy]=useState(false),[error,setError]=useState('');const attempt=useRef<{body:string;key:string}|null>(null),pending=useRef(false);
 const save=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try{const body={expectedRevision:initial.revision,policy},serialized=JSON.stringify(body);if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};await apiPost('/api/suppliers/approval-policy',body,{idempotencyKey:attempt.current.key});onClose();}catch(e){setError(e instanceof Error?e.message:'Freigaberegel konnte nicht gespeichert werden.');}finally{pending.current=false;setBusy(false);}
 };
 const roleLabels={owner:'Inhaber',admin:'Administrator',finance:'Finanzen'};
 return <FormSheet open label="Freigaberegeln" busy={busy} onClose={onClose} dirty={JSON.stringify(policy)!==JSON.stringify(initial.policy)}>
  <p><LocalizedText>{'Diese Regeln gelten für Lieferantenrechnungen. Sie lösen keine Zahlung aus. Ein berechtigter Solo-Owner darf selbst freigeben.'}</LocalizedText></p>
  <Field label="Unabhängige Vier-Augen-Prüfung bei mehreren Benutzern"><Checkbox disabled={!canConfigure||busy} checked={policy.fourEyes} onChange={e=>setPolicy(p=>({...p,fourEyes:e.target.checked}))}/></Field>
  <p><LocalizedText>{'Leere Betragsgrenzen bedeuten keine zusätzliche Obergrenze. Betragsgrenzen beziehen sich auf den Gesamtbetrag inklusive MwSt. und gelten nur in der angegebenen Währung. Abweichungen werden nicht automatisch toleriert.'}</LocalizedText></p>
  {apApprovalRoles.map(role=><section className="form-section" key={role}><SectionTitle title={roleLabels[role]}/><div className="form-grid two">{['CHF','EUR'].map(currency=><Field key={currency} label={currency}><Input inputMode="decimal" disabled={!canConfigure||busy} value={policy.limits[role+'_'+currency]??''} onChange={e=>setPolicy(p=>{const limits={...p.limits},key=role+'_'+currency,value=e.target.value.replace(',','.');if(value)limits[key]=value;else delete limits[key];return {...p,limits};})}/></Field>)}</div></section>)}
  {error&&<ErrorState>{error}</ErrorState>}<FormActions sheet><Button variant="secondary" disabled={busy} onClick={onClose}><LocalizedText>{'Schliessen'}</LocalizedText></Button>{canConfigure&&<Button disabled={busy} onClick={()=>void save()}><LocalizedText>{'Freigaberegel speichern'}</LocalizedText></Button>}</FormActions>
 </FormSheet>;
}

function SupplierInvoiceReview({supplierId,invoice,mayWrite,onClose,onSaved,onMatch}:{supplierId:string;invoice:Invoice;mayWrite:boolean;onClose:()=>void;onSaved:()=>void;onMatch:()=>void}){
 const endpoint='/api/suppliers/'+encodeURIComponent(supplierId)+'/invoices/'+encodeURIComponent(invoice.id)+'/review';
 const query=useApiQuery<{invoice:{version:number;status:string};policyRevision:number;match:{id:string;stale:boolean;result:{ready:boolean}}|null;mayApprove:boolean;canReview:boolean;queryUnresolved:boolean;reviews:Array<{id:string;decision:string;note:string;invoice_version:number;created_at:string}>}>(endpoint);
 const [note,setNote]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);const pending=useRef(false),attempt=useRef<{body:string;key:string}|null>(null);
 const save=async(decision:'approve'|'query')=>{
  if(pending.current||!query.data)return;pending.current=true;setBusy(true);setError('');
  try{const body={decision,note,expectedRevision:query.data.invoice.version,expectedPolicyRevision:query.data.policyRevision,matchId:decision==='approve'?query.data.match?.id:null},serialized=JSON.stringify(body);if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};const response=await apiPost<{item:{id:string}}>(endpoint,body,{idempotencyKey:attempt.current.key});if(!response.item?.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');onSaved();}catch(e){setError(e instanceof Error?e.message:'Rechnungsprüfung konnte nicht gespeichert werden.');}finally{pending.current=false;setBusy(false);}
 };
 const state=query.data,editable=mayWrite&&state?.canReview&&state.invoice.status==='draft',reviewLabels:Record<string,string>={approve:'Freigegeben',query:'Rückfrage'};
 return <FormSheet open label="Rechnung prüfen" description={invoice.supplier_invoice_no??''} busy={busy} dirty={!!note} onClose={onClose}>
  <p><LocalizedText>{'Eine Freigabe bestätigt diese Rechnungsrevision. Sie löst keine Zahlung aus.'}</LocalizedText></p>
  {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:state&&<>
   <p><LocalizedText>{state.queryUnresolved?'Eine Rückfrage ist offen. Bitte den Entwurf überarbeiten und erneut abgleichen.':state.mayApprove?'Rechnung ist zur ausdrücklichen Freigabe bereit.':'Freigabe nicht möglich: Abgleich, Vier-Augen-Regel und Betragsgrenzen prüfen.'}</LocalizedText></p>
   <Button variant="secondary" disabled={busy||!!note} onClick={onMatch}><LocalizedText>{'Leistungen abgleichen'}</LocalizedText></Button>
   {editable&&<Field label="Begründung oder Rückfrage"><Textarea maxLength={2000} disabled={busy} value={note} onChange={e=>setNote(e.target.value)}/></Field>}
   {state.reviews.length>0&&<section className="form-section"><SectionTitle title="Prüfverlauf"/>{state.reviews.map(r=><div key={r.id}><b><LocalizedText>{reviewLabels[r.decision]??'—'}</LocalizedText></b><p>{r.note}</p></div>)}</section>}
  </>}{error&&<ErrorState>{error}</ErrorState>}
  <FormActions sheet><Button variant="secondary" disabled={busy} onClick={onClose}><LocalizedText>{'Schliessen'}</LocalizedText></Button>{editable&&!query.loading&&!query.error&&<><Button requiresWrite variant="secondary" disabled={busy||note.trim().length<10} onClick={()=>void save('query')}><LocalizedText>{'Rückfrage speichern'}</LocalizedText></Button><Button requiresWrite disabled={busy||!state?.mayApprove} onClick={()=>void save('approve')}><LocalizedText>{'Rechnung freigeben'}</LocalizedText></Button></>}</FormActions>
 </FormSheet>;
}

type Match={id:string;invoice_version:number;stale:boolean;input_snapshot:SupplierMatchInput;result:ReturnType<typeof compareSupplierInvoice>};
function SupplierInvoiceMatch({supplierId,invoice,mayWrite,onClose}:{supplierId:string;invoice:Invoice;mayWrite:boolean;onClose:()=>void}){
 const month=(invoice.invoice_date??businessDate()).slice(0,7);
 const [from,setFrom]=useState(month+'-01'),[until,setUntil]=useState(()=>new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10));
 const [selection,setSelection]=useState<string[]>([]),[minutes,setMinutes]=useState(''),[price,setPrice]=useState(''),[saved,setSaved]=useState<Match|null>(null),[savedBody,setSavedBody]=useState<string|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const attempt=useRef<{body:string;key:string}|null>(null),pending=useRef(false);
 const endpoint='/api/suppliers/'+encodeURIComponent(supplierId)+'/invoices/'+encodeURIComponent(invoice.id)+'/match';
 const query=useApiQuery<{invoice:{version:number};hasMore:boolean;sources:Array<{price_source_id:string;time_entry_id:string;work_date:string;minutes:number;description:string;project_name:string;unit_price:string;currency:string;vat_rate:string}>;matches:Match[]}>(from&&until?endpoint+'?'+new URLSearchParams({from,until}):null);
 const latest=saved?(query.data?.matches.find(m=>m.id===saved.id)??saved):query.data?.matches[0];
 const save=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try{if(!/^\d+$/.test(minutes))throw Error('Bitte ganze Minuten gemäss Lieferantenrechnung erfassen.');
   const body={expectedRevision:invoice.version,periodStart:from,periodEnd:until,reportedMinutes:Number(minutes),reportedUnitPrice:price.replace(',','.'),priceSourceIds:selection},serialized=JSON.stringify(body);
   if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};
   const response=await apiPost<{item:Match}>(endpoint,body,{idempotencyKey:attempt.current.key});if(!response.item?.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');setSaved(response.item);setSavedBody(JSON.stringify({from,until,selection,minutes,price}));query.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:'Abgleich konnte nicht gespeichert werden.');}finally{pending.current=false;setBusy(false);}
 };
 const value=(v:string|null)=>({required:'Angabe fehlt',clean_receipt:'Geprüfter Beleg',quarantine:'Beleg noch in Quarantäne',one_contract_price_tax_currency:'Einheitliche Vertragskondition',mixed_sources:'Unterschiedliche Vertragskonditionen',approved_purchase_source:'Bestätigte Einkaufsquelle'} as Record<string,string>)[v??'']??v??'—';
 const labels:Record<string,string>={minutes:'Minuten',unit_price:'Stundensatz',currency:'Währung',net:'Nettobetrag',tax:'MwSt.-Betrag',total:'Gesamtbetrag',number:'Rechnungsnummer',invoiceDate:'Rechnungsdatum',dueDate:'Fällig am',receipt:'Belege',sources:'Einkaufsquelle',source_groups:'Getrennte Vertragspositionen erforderlich'};
 return <FormSheet open label="Leistungen abgleichen" description={invoice.supplier_invoice_no??''} busy={busy} onClose={onClose} dirty={Boolean(selection.length||minutes||price)&&savedBody!==JSON.stringify({from,until,selection,minutes,price})}>
  <div className="sheet-body">
   <p><LocalizedText>{'Der Abgleich dokumentiert Abweichungen. Er gibt keine Rechnung frei und löst keine Zahlung aus.'}</LocalizedText></p>
   <div className="form-grid two"><Field label="Leistungsbeginn"><Input type="date" value={from} onChange={e=>{setFrom(e.target.value);setSelection([]);}}/></Field><Field label="Leistungsende"><Input type="date" value={until} min={from} onChange={e=>{setUntil(e.target.value);setSelection([]);}}/></Field></div>
   {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:<>
    {query.data?.hasMore&&<p><LocalizedText>{'Mehr als 100 Quellen. Bitte den Zeitraum eingrenzen.'}</LocalizedText></p>}
    {!query.data?.sources.length?<EmptyState title="Keine bestätigten Einkaufsquellen in diesem Zeitraum"/>:<div className="action-list">{query.data.sources.map(source=><label key={source.price_source_id} className="assignment-row form-check"><Input type="checkbox" disabled={!mayWrite||busy} checked={selection.includes(source.price_source_id)} onChange={e=>setSelection(v=>e.target.checked?[...v,source.price_source_id]:v.filter(id=>id!==source.price_source_id))}/><span>{source.work_date} · {source.project_name||source.description}<br/>{source.minutes} <LocalizedText>{'Minuten'}</LocalizedText> · {source.currency} {source.unit_price}<LocalizedText>{' / 60 min'}</LocalizedText></span></label>)}</div>}
   </>}
   {mayWrite&&<div className="form-grid two"><Field label="Minuten gemäss Lieferantenrechnung"><Input inputMode="numeric" value={minutes} onChange={e=>setMinutes(e.target.value)}/></Field><Field label="Stundensatz gemäss Lieferantenrechnung"><Input inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)}/></Field></div>}
   {latest&&<section className="form-section"><SectionTitle title="Letzter Abgleich"/><p>{latest.input_snapshot.period.start} – {latest.input_snapshot.period.end}</p><p><LocalizedText>{latest.stale?'Abgleich ist veraltet. Bitte die aktuelle Revision erneut abgleichen.':latest.result.ready?'Abgleich ohne ungeklärte Abweichungen':'Ungeklärte Abweichungen'}</LocalizedText></p>{latest.result.expected&&<p>{latest.result.expected.minutes} <LocalizedText>{'Minuten'}</LocalizedText> · {latest.result.expected.currency} {latest.result.expected.total}</p>}{latest.result.differences.map(d=><p key={d.code}><LocalizedText>{labels[d.code]??d.code}</LocalizedText>: <LocalizedText>{'Erwartet'}</LocalizedText> <LocalizedText>{value(d.expected)}</LocalizedText> · <LocalizedText>{'Erfasst'}</LocalizedText> <LocalizedText>{value(d.actual)}</LocalizedText></p>)}</section>}
   {error&&<ErrorState>{error}</ErrorState>}
  </div><FormActions sheet><Button variant="secondary" disabled={busy} onClick={onClose}><LocalizedText>{'Schliessen'}</LocalizedText></Button>{mayWrite&&<Button disabled={busy||query.loading||Boolean(query.error)||!selection.length||!minutes||!price} onClick={()=>void save()}><LocalizedText>{'Abgleich speichern'}</LocalizedText></Button>}</FormActions>
 </FormSheet>;
}
