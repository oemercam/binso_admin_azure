import 'server-only';
import {randomUUID} from 'node:crypto';
import type {PoolClient} from 'pg';
import {normalizeBillingTerms,billingTermsReady,billingModelAllowsTime,recurringBillingPeriod,type BillingTerms,type BillingRateOption} from '@/lib/billing-model';
import type {SessionUser} from './session';
import {ApiError} from './http';
import {audit} from './audit';
import {moneyMinor,sumMoney,normalizeDiscount} from '@/lib/money';
type Row=Record<string,unknown>;
export function billingRateOptions(terms:BillingTerms,snapshot:unknown):BillingRateOption[]{
 if(!billingModelAllowsTime(terms))return [];
 const lines=(snapshot as {items?:Row[]}|null)?.items;
 if(lines?.length)return lines.flatMap((line,index)=>line.billing_part==='time'||terms.model==='time'?[{position:index+1,unitPrice:String(line.unit_price),vatRate:String(line.vat_rate),taxExempt:line.tax_exempt===true,description:String(line.description??''),discount:normalizeDiscount(line.discount,terms.currency)}]:[]);
 return 'hourlyRate' in terms&&terms.hourlyRate!=null?[{unitPrice:terms.hourlyRate}]:[];
}
export const billingIssue=()=>new ApiError(409,'billing_agreement_invalid','Die Angaben zum Abrechnungsmodell sind ungültig.');
export function billingTerms(input:unknown){try{return normalizeBillingTerms(input)}catch{throw billingIssue()}}
export async function createBillingAgreement(c:PoolClient,s:SessionUser,customerId:string|null,input:unknown,snapshot:unknown=null,scopeKind:'quote'|'invoice'|'project'='project',scopeId:string){
 const terms=billingTerms(input),id=randomUUID();
 await c.query('insert into billing_agreements(id,organization_id,customer_id,currency,terms,commercial_snapshot,created_by_user_id,scope_kind,scope_id) values($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9)',[id,s.organizationId,customerId,terms.currency,JSON.stringify(terms),snapshot===null?null:JSON.stringify(snapshot),s.userId,scopeKind,scopeId]);return id;
}
export async function readBillingAgreement(c:PoolClient,s:SessionUser,id:string){
 const row=(await c.query('select * from billing_agreements where organization_id=$1 and id=$2',[s.organizationId,id])).rows[0];if(!row)throw billingIssue();return {id:String(row.id),terms:billingTerms(row.terms),currency:row.currency as 'CHF'|'EUR',customer_id:row.customer_id as string|null,commercial_snapshot:row.commercial_snapshot as unknown};
}
export function invoiceBillingContext(terms:BillingTerms,input:unknown){
 if(!input||typeof input!=='object'||Array.isArray(input))throw billingIssue();const value=input as Row;
 if(Object.keys(value).some(k=>!['procedure','period','milestoneId','periodStartsOn','periodEndsOn'].includes(k))||typeof value.procedure!=='string'||!['standard','advance','partial','final'].includes(value.procedure))throw billingIssue();
 const context:Row={procedure:value.procedure};
 if(!billingTermsReady(terms))return context;
 if(terms.model==='recurring'){
  if(typeof value.period!=='number'||!Number.isSafeInteger(value.period))throw billingIssue();
  try{const range=recurringBillingPeriod(terms,value.period);context.period=String(value.period);context.periodStartsOn=range.startsOn;context.periodEndsOn=range.endsOn;}catch{throw billingIssue()}
 }else if(value.period!==undefined||value.periodStartsOn!==undefined||value.periodEndsOn!==undefined)throw billingIssue();
 if(terms.model==='milestone'){
  if(typeof value.milestoneId!=='string'||!terms.milestones.some(m=>m.id===value.milestoneId&&m.completed&&m.amount!==null))throw billingIssue();context.milestoneId=value.milestoneId;
 }else if(value.milestoneId!==undefined)throw billingIssue();
 return context;
}
/** Bind inherited terms before any source reservation or line write. */
export async function bindDocumentBilling(c:PoolClient,s:SessionUser,args:Row,id:string,invoice:boolean){
 const table=invoice?'invoices':'quotes';
 const root=(await c.query(`select * from ${table} where organization_id=$1 and id=$2 for update`,[s.organizationId,id])).rows[0];
 let agreementId:string|null=root.billing_agreement_id;let sourceProject:string|null=root.project_id??null;let sourceQuoteId:string|null=String(args.p_source_quote_id??root.source_quote_id??'')||null;
 if(invoice){
  const timeIds=(args.p_items as Row[]).flatMap(line=>[...(Array.isArray(line.time_entry_ids)?line.time_entry_ids:[]),...(Array.isArray(line.time_allocations)?line.time_allocations.map(a=>(a as Row).time_entry_id):[])]);
  if(timeIds.length){const origins=(await c.query('select p.id,p.billing_agreement_id from time_entries t join projects p on p.organization_id=t.organization_id and p.id=t.project_id where t.organization_id=$1 and t.id=any($2::uuid[]) and p.billing_agreement_id is not null for share of p',[s.organizationId,timeIds])).rows;const ids=[...new Set(origins.map(p=>p.billing_agreement_id))];if(ids.length>1||agreementId&&ids.length&&ids[0]!==agreementId)throw billingIssue();if(ids.length){agreementId=ids[0];const projects=[...new Set(origins.map(p=>p.id))];sourceProject=projects.length===1?projects[0]:sourceProject;}}
  if(args.p_source_project){const project=(await c.query('select id,customer_id,billing_agreement_id,source_quote_id from projects where organization_id=$1 and id::text=$2 and archived_at is null for share',[s.organizationId,args.p_source_project])).rows[0];if(!project||project.customer_id!==args.p_customer_id)throw billingIssue();if(agreementId&&project.billing_agreement_id!==agreementId)throw billingIssue();agreementId=project.billing_agreement_id;sourceProject=project.id;sourceQuoteId=project.source_quote_id??sourceQuoteId;}
  if(sourceQuoteId){const quote=(await c.query("select billing_agreement_id from quotes where organization_id=$1 and id=$2 and status='accepted' for share",[s.organizationId,sourceQuoteId])).rows[0];if(!quote||agreementId&&agreementId!==quote.billing_agreement_id)throw billingIssue();agreementId=quote.billing_agreement_id;}
 }
 if(args.p_billing_terms!==undefined){
  const requested=billingTerms(args.p_billing_terms);
  if(agreementId){const prior=await readBillingAgreement(c,s,agreementId);if(JSON.stringify(prior.terms)!==JSON.stringify(requested)||!invoice&&JSON.stringify(prior.commercial_snapshot)!==JSON.stringify(args.p_commercial_snapshot)){if(invoice&&(root.status!=='draft'||sourceProject||root.source_quote_id||args.p_source_quote_id))throw billingIssue();agreementId=null;}}
  if(!agreementId)agreementId=await createBillingAgreement(c,s,String(args.p_customer_id),requested,args.p_commercial_snapshot,invoice?'invoice':'quote',id);
 }
 if(!agreementId){if(args.p_billing_context!==undefined)throw billingIssue();if(invoice&&(sourceQuoteId||sourceProject))await c.query('update invoices set source_quote_id=$3,project_id=$4 where organization_id=$1 and id=$2',[s.organizationId,id,sourceQuoteId,sourceProject]);return null;}
 const agreement=await readBillingAgreement(c,s,agreementId);
 if(agreement.currency!==args.p_currency||agreement.customer_id!==args.p_customer_id)throw billingIssue();
 if(invoice&&agreement.commercial_snapshot){
  const snapshot=agreement.commercial_snapshot as {calculation:{discount:unknown};items:Row[]};
  if(snapshot.items.length===1)for(const item of args.p_items as Row[])item.billing_source_position??=1;
  const agreed=normalizeDiscount(snapshot.calculation.discount,agreement.currency),requested=normalizeDiscount(args.p_discount,agreement.currency);
  if(agreed.kind==='fixed'?(requested.kind!=='none'&&(requested.kind!=='fixed'||moneyMinor(requested.value)>moneyMinor(agreed.value))):JSON.stringify(agreed)!==JSON.stringify(requested))throw billingIssue();
  for(const item of args.p_items as Row[]){if(item.billing_source_position!==undefined){const n=item.billing_source_position;if(typeof n!=='number'||!Number.isInteger(n)||n<1||n>snapshot.items.length)throw billingIssue();const source=snapshot.items[n-1],original=normalizeDiscount(source.discount,agreement.currency),current=normalizeDiscount(item.discount,agreement.currency);if(original.kind==='fixed'?(current.kind!=='none'&&(current.kind!=='fixed'||moneyMinor(current.value)>moneyMinor(original.value))):JSON.stringify(original)!==JSON.stringify(current))throw billingIssue();}}
 }
 if(invoice){
  if((root.status!=='draft'||sourceProject||root.source_quote_id||args.p_source_quote_id)&&!billingTermsReady(agreement.terms))throw billingIssue();
  let effective=agreement.terms;
  if(effective.model==='milestone'){const done=(await c.query('select milestone_id::text from billing_milestone_completions where organization_id=$1 and agreement_id=$2',[s.organizationId,agreementId])).rows.map(m=>m.milestone_id);effective={...effective,milestones:effective.milestones.map(m=>({...m,completed:m.completed||done.includes(m.id)}))};}
  const stored=root.billing_context?{...root.billing_context,...(root.billing_context.period!==undefined?{period:Number(root.billing_context.period)}:{})}:undefined;
  const context=invoiceBillingContext(effective,args.p_billing_context??stored??{procedure:'standard'});
  await c.query('update invoices set billing_agreement_id=$3,billing_context=$4::jsonb,project_id=$5,source_quote_id=coalesce($6,source_quote_id) where organization_id=$1 and id=$2',[s.organizationId,id,agreementId,JSON.stringify(context),sourceProject,sourceQuoteId]);
 }else await c.query('update quotes set billing_agreement_id=$3 where organization_id=$1 and id=$2',[s.organizationId,id,agreementId]);
 for(const line of args.p_items as Row[]){
  const hasTime=(Array.isArray(line.time_entry_ids)&&line.time_entry_ids.length>0)||(Array.isArray(line.time_allocations)&&line.time_allocations.length>0);
  const part=line.billing_part??(agreement.terms.model==='time'?'time':agreement.terms.model==='quantity'?'quantity':agreement.terms.model==='mixed'?null:'fixed');
  if(typeof part!=='string'||!['fixed','time','quantity'].includes(part)||hasTime&&(part!=='time'||!billingModelAllowsTime(agreement.terms)))throw billingIssue();
  line.billing_part=part;
  if(!invoice)await c.query('update quote_lines set billing_part=$4 where organization_id=$1 and quote_id=$2 and sort_order=$3',[s.organizationId,id,(args.p_items as Row[]).indexOf(line)+1,part]);
  if(invoice&&part==='time'&&Array.isArray(line.time_entry_ids)&&line.time_entry_ids.length){
   const options=billingRateOptions(agreement.terms,agreement.commercial_snapshot);
   const option=options.find(p=>(line.billing_source_position===undefined||p.position===line.billing_source_position)&&moneyMinor(p.unitPrice)===moneyMinor(line.unit_price)&&(p.vatRate===undefined||moneyMinor(p.vatRate)===moneyMinor(line.vat_rate))&&(p.taxExempt===undefined||p.taxExempt===(line.tax_exempt===true)));
   if(options.length&&!option)throw billingIssue();
   const sources=(await c.query('select t.id,t.hours,t.sales_rate,t.external_resource_id,t.project_id,t.billing_agreement_id,t.billing_source_position,p.billing_agreement_id project_agreement_id from time_entries t left join projects p on p.organization_id=t.organization_id and p.id=t.project_id where t.organization_id=$1 and t.id=any($2::uuid[]) for update of t',[s.organizationId,line.time_entry_ids])).rows;
   if(option){line.billing_source_position=option.position;for(const t of sources){if(t.billing_agreement_id&&(t.billing_agreement_id!==agreement.id||Number(t.sales_rate)!==Number(option.unitPrice)||t.billing_source_position!==(option.position??null)))throw billingIssue();if(!t.billing_agreement_id){if(t.project_agreement_id!==agreement.id){if(agreement.currency!=='CHF'||moneyMinor(t.sales_rate)!==moneyMinor(option.unitPrice))throw billingIssue();continue;}await c.query('update time_entries set billing_agreement_id=$3,billing_source_position=$4,sales_rate=$5 where organization_id=$1 and id=$2',[s.organizationId,t.id,agreement.id,option.position??null,option.unitPrice]);t.sales_rate=option.unitPrice;await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'time.billing_price.bound',entityType:'time_entry',entityId:t.id,metadata:{agreementId:agreement.id,sourcePosition:option.position??null}});}}}
   if(sources.length!==line.time_entry_ids.length||!option&&agreement.currency!=='CHF'||sources.some(t=>t.external_resource_id||moneyMinor(t.sales_rate)!==moneyMinor(line.unit_price))||moneyMinor(sumMoney(sources.map(t=>t.hours)))!==moneyMinor(line.quantity))throw billingIssue();
  }
 }
 return agreement;
}
export async function assertBillingReadiness(c:PoolClient,s:SessionUser,row:Row){if(row.billing_agreement_id){const a=await readBillingAgreement(c,s,String(row.billing_agreement_id));if(!billingTermsReady(a.terms))throw billingIssue();}}
