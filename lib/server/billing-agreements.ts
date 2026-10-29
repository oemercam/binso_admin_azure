import 'server-only';
import {randomUUID} from 'node:crypto';
import type {PoolClient} from 'pg';
import {normalizeBillingTerms,billingTermsReady,billingModelAllowsTime,recurringBillingPeriod,type BillingTerms,type BillingRateOption} from '@/lib/billing-model';
import type {SessionUser} from './session';
import {ApiError} from './http';
import {audit} from './audit';
import {moneyMinor,sumMoney,normalizeDiscount as normalizeMoneyDiscount,reconcileFinalCalculation,reconcileCumulativeQuantityCalculation,allocateAdvance,applyAdvanceApplications,consolidateCalculations,type DocumentCalculation,type AdvanceApplication} from '@/lib/money';
type Row=Record<string,unknown>;
export function billingRateOptions(terms:BillingTerms,snapshot:unknown):BillingRateOption[]{
 if(!billingModelAllowsTime(terms))return [];
 const lines=(snapshot as {items?:Row[]}|null)?.items;
 if(lines?.length)return lines.flatMap((line,index)=>line.billing_part==='time'||terms.model==='time'?[{position:index+1,unitPrice:String(line.unit_price),vatRate:String(line.vat_rate),taxExempt:line.tax_exempt===true,description:String(line.description??''),discount:billingDiscount(line.discount,terms.currency)}]:[]);
 return 'hourlyRate' in terms&&terms.hourlyRate!=null?[{unitPrice:terms.hourlyRate}]:[];
}
export const billingIssue=()=>new ApiError(409,'billing_agreement_invalid','Die Angaben zum Abrechnungsmodell sind ungültig.');
export function billingTerms(input:unknown){try{return normalizeBillingTerms(input)}catch{throw billingIssue()}}
export async function createBillingAgreement(c:PoolClient,s:SessionUser,customerId:string|null,input:unknown,snapshot:unknown=null,scopeKind:'quote'|'invoice'|'project'='project',scopeId:string){
 const terms=billingTerms(input),id=randomUUID();
 await c.query('insert into billing_agreements(id,organization_id,customer_id,currency,terms,commercial_snapshot,created_by_user_id,scope_kind,scope_id) values($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9)',[id,s.organizationId,customerId,terms.currency,JSON.stringify(terms),snapshot===null?null:JSON.stringify(snapshot),s.userId,scopeKind,scopeId]);return id;
}
export async function readBillingAgreement(c:PoolClient,s:SessionUser,id:string){
 const row=(await c.query('select *,billing_agreement_label(organization_id,id) scope_label from billing_agreements where organization_id=$1 and id=$2',[s.organizationId,id])).rows[0];if(!row)throw billingIssue();return {id:String(row.id),label:typeof row.scope_label==='string'?row.scope_label:undefined,scope_kind:String(row.scope_kind),scope_id:String(row.scope_id),terms:billingTerms(row.terms),currency:row.currency as 'CHF'|'EUR',customer_id:row.customer_id as string|null,commercial_snapshot:row.commercial_snapshot as unknown};
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
 if(args.p_billing_scopes!==undefined){if(!invoice)throw billingIssue();return bindConsolidatedBilling(c,s,args,id);}
 if(invoice&&(await c.query('select 1 from invoice_billing_scopes where organization_id=$1 and invoice_id=$2',[s.organizationId,id])).rowCount)throw billingIssue();
 const table=invoice?'invoices':'quotes';
 const root=(await c.query(`select * from ${table} where organization_id=$1 and id=$2 for update`,[s.organizationId,id])).rows[0];
 let agreementId:string|null=root.billing_agreement_id;let sourceProject:string|null=root.project_id??null;let sourceQuoteId:string|null=String(args.p_source_quote_id??root.source_quote_id??'')||null;
 if(invoice&&args.p_billing_agreement_id){if(agreementId&&agreementId!==args.p_billing_agreement_id)throw billingIssue();agreementId=(await readBillingAgreement(c,s,String(args.p_billing_agreement_id))).id;}
 if(invoice){
  const timeIds=(args.p_items as Row[]).flatMap(line=>[...(Array.isArray(line.time_entry_ids)?line.time_entry_ids:[]),...(Array.isArray(line.time_allocations)?line.time_allocations.map(a=>(a as Row).time_entry_id):[])]);
  if(timeIds.length){const origins=(await c.query('select p.id,p.billing_agreement_id from time_entries t join projects p on p.organization_id=t.organization_id and p.id=t.project_id where t.organization_id=$1 and t.id=any($2::uuid[]) and p.billing_agreement_id is not null for share of p',[s.organizationId,timeIds])).rows;const ids=[...new Set(origins.map(p=>p.billing_agreement_id))];if(ids.length>1||agreementId&&ids.length&&ids[0]!==agreementId)throw billingIssue();if(ids.length){agreementId=ids[0];const projects=[...new Set(origins.map(p=>p.id))];sourceProject=projects.length===1?projects[0]:sourceProject;}}
  if(args.p_source_project){const project=(await c.query('select id,customer_id,billing_agreement_id,source_quote_id from projects where organization_id=$1 and id::text=$2 and archived_at is null for share',[s.organizationId,args.p_source_project])).rows[0];if(!project||project.customer_id!==args.p_customer_id)throw billingIssue();if(agreementId&&project.billing_agreement_id!==agreementId)throw billingIssue();agreementId=project.billing_agreement_id;sourceProject=project.id;sourceQuoteId=project.source_quote_id??sourceQuoteId;}
  if(sourceQuoteId){const quote=(await c.query("select billing_agreement_id from quotes where organization_id=$1 and id=$2 and status='accepted' for share",[s.organizationId,sourceQuoteId])).rows[0];if(!quote||agreementId&&agreementId!==quote.billing_agreement_id)throw billingIssue();agreementId=quote.billing_agreement_id;}
 }
 if(args.p_billing_terms!==undefined){
  const requested=billingTerms(args.p_billing_terms);
  if(agreementId){const prior=await readBillingAgreement(c,s,agreementId);if(JSON.stringify(prior.terms)!==JSON.stringify(requested)||!invoice&&JSON.stringify(prior.commercial_snapshot)!==JSON.stringify(args.p_commercial_snapshot)){if(invoice&&(args.p_billing_agreement_id&&prior.scope_id!==id||root.status!=='draft'||sourceProject||root.source_quote_id||args.p_source_quote_id))throw billingIssue();agreementId=null;}}
  if(!agreementId)agreementId=await createBillingAgreement(c,s,String(args.p_customer_id),requested,args.p_commercial_snapshot,invoice?'invoice':'quote',id);
 }
 if(!agreementId){if((args.p_items as Row[]).some(l=>l.billing_agreement_id))throw billingIssue();if(args.p_billing_context!==undefined)throw billingIssue();if(invoice&&(sourceQuoteId||sourceProject))await c.query('update invoices set source_quote_id=$3,project_id=$4 where organization_id=$1 and id=$2',[s.organizationId,id,sourceQuoteId,sourceProject]);return null;}
 const agreement=await readBillingAgreement(c,s,agreementId);
 if(agreement.currency!==args.p_currency||agreement.customer_id!==args.p_customer_id)throw billingIssue();
 if(invoice&&agreement.scope_kind==='project'&&!sourceProject){const p=(await c.query('select id from projects where organization_id=$1 and id=$2 and customer_id=$3 and archived_at is null for share',[s.organizationId,agreement.scope_id,args.p_customer_id])).rows[0];if(!p)throw billingIssue();sourceProject=p.id;}
 if(invoice&&agreement.scope_kind==='quote')sourceQuoteId??=agreement.scope_id;
 if(invoice&&agreement.scope_kind==='quote'&&!sourceProject&&!(await c.query("select 1 from quotes where organization_id=$1 and id=$2 and status='accepted' and archived_at is null",[s.organizationId,agreement.scope_id])).rowCount)throw billingIssue();
 for(const line of args.p_items as Row[]){if(line.billing_agreement_id&&line.billing_agreement_id!==agreement.id)throw billingIssue();delete line.billing_agreement_id;delete line.billing_scope_position;}

 if(invoice){
  if((root.status!=='draft'||sourceProject||root.source_quote_id||args.p_source_quote_id)&&!billingTermsReady(agreement.terms))throw billingIssue();
  let effective=agreement.terms;
  if(effective.model==='milestone'){const done=(await c.query('select milestone_id::text from billing_milestone_completions where organization_id=$1 and agreement_id=$2',[s.organizationId,agreementId])).rows.map(m=>m.milestone_id);effective={...effective,milestones:effective.milestones.map(m=>({...m,completed:m.completed||done.includes(m.id)}))};}
  const stored=root.billing_context?{...root.billing_context,...(root.billing_context.period!==undefined?{period:Number(root.billing_context.period)}:{})}:undefined;
  const context=invoiceBillingContext(effective,args.p_billing_context??stored??{procedure:'standard'});
  args.p_effective_billing_context=context;
  await c.query('update invoices set billing_agreement_id=$3,billing_context=$4::jsonb,project_id=$5,source_quote_id=coalesce($6,source_quote_id) where organization_id=$1 and id=$2',[s.organizationId,id,agreementId,JSON.stringify(context),sourceProject,sourceQuoteId]);
 }else await c.query('update quotes set billing_agreement_id=$3 where organization_id=$1 and id=$2',[s.organizationId,id,agreementId]);
 await bindBillingLines(c,s,args,id,invoice,agreement);
 return agreement;
}
export async function assertBillingReadiness(c:PoolClient,s:SessionUser,row:Row){for(const scope of (await c.query('select agreement_id from invoice_billing_scopes where organization_id=$1 and invoice_id=$2',[s.organizationId,row.id])).rows){if(!billingTermsReady((await readBillingAgreement(c,s,scope.agreement_id)).terms))throw billingIssue();}if(row.billing_agreement_id){const a=await readBillingAgreement(c,s,String(row.billing_agreement_id));if(!billingTermsReady(a.terms))throw billingIssue();}}

async function bindBillingLines(c:PoolClient,s:SessionUser,args:Row,id:string,invoice:boolean,agreement:Awaited<ReturnType<typeof readBillingAgreement>>){
 const variableAdvance=invoice&&(args.p_effective_billing_context as Row|undefined)?.procedure==='advance'&&(agreement.terms.model==='time'||agreement.terms.model==='quantity'||agreement.terms.model==='mixed'&&agreement.terms.amount===null);
 if(variableAdvance){for(const line of args.p_items as Row[]){if((line.time_entry_ids as unknown[]|undefined)?.length||(line.time_allocations as unknown[]|undefined)?.length||(line.expense_ids as unknown[]|undefined)?.length||line.billing_part&&line.billing_part!=='fixed')throw billingIssue();line.billing_part='fixed';}return;}

 if(invoice&&agreement.commercial_snapshot){
  const snapshot=agreement.commercial_snapshot as {calculation:{discount:unknown};items:Row[]};
  if(snapshot.items.length===1)for(const item of args.p_items as Row[])item.billing_source_position??=1;
  const agreed=billingDiscount(snapshot.calculation.discount,agreement.currency),requested=billingDiscount(args.p_discount,agreement.currency);
  if(agreed.kind==='fixed'?(requested.kind!=='none'&&(requested.kind!=='fixed'||moneyMinor(requested.value)>moneyMinor(agreed.value))):JSON.stringify(agreed)!==JSON.stringify(requested))throw billingIssue();
  for(const item of args.p_items as Row[]){if(item.billing_source_position!==undefined){const n=item.billing_source_position;if(typeof n!=='number'||!Number.isInteger(n)||n<1||n>snapshot.items.length)throw billingIssue();const source=snapshot.items[n-1],original=billingDiscount(source.discount,agreement.currency),current=billingDiscount(item.discount,agreement.currency);if(original.kind==='fixed'?(current.kind!=='none'&&(current.kind!=='fixed'||moneyMinor(current.value)>moneyMinor(original.value))):JSON.stringify(original)!==JSON.stringify(current))throw billingIssue();}}
 }

 for(const line of args.p_items as Row[]){
  const hasTime=(Array.isArray(line.time_entry_ids)&&line.time_entry_ids.length>0)||(Array.isArray(line.time_allocations)&&line.time_allocations.length>0);
  const part=line.billing_part??(agreement.terms.model==='time'?'time':agreement.terms.model==='quantity'?'quantity':agreement.terms.model==='mixed'?null:'fixed');
  if(typeof part!=='string'||!['fixed','time','quantity'].includes(part)||hasTime&&(part!=='time'||!billingModelAllowsTime(agreement.terms)))throw billingIssue();
  line.billing_part=part;
  if(invoice&&agreement.commercial_snapshot&&line.billing_source_position!==undefined){const snapshot=agreement.commercial_snapshot as {items:Row[];calculation:{lines:Row[]}},source=snapshot.items[Number(line.billing_source_position)-1],tax=snapshot.calculation.lines[Number(line.billing_source_position)-1];if(!source||moneyMinor(line.vat_rate)!==moneyMinor(source.vat_rate)||(line.tax_exempt===true)!==(tax.tax_exempt===true)||(part==='time'||part==='quantity'||Array.isArray(args.p_billing_scopes))&&moneyMinor(line.unit_price)!==moneyMinor(source.unit_price)||part==='quantity'&&line.unit!==source.unit)throw new ApiError(400,'billing_source_invalid','Die Angaben zum Abrechnungsmodell sind ungültig.');}
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
}

async function bindConsolidatedBilling(c:PoolClient,s:SessionUser,args:Row,id:string){
 const raw=args.p_billing_scopes;
 if(!Array.isArray(raw)||raw.length<1||raw.length>100||args.p_billing_agreement_id||args.p_source_project||args.p_source_quote_id||args.p_billing_terms||args.p_billing_context||billingDiscount(args.p_discount,String(args.p_currency)).kind!=='none')throw billingIssue();
 const seen=new Set<string>(),scopes=[];
 for(const input of raw){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['agreementId','projectId','context','discount'].includes(k))||typeof input.agreementId!=='string'||!/^[0-9a-f-]{36}$/i.test(input.agreementId)||seen.has(input.agreementId.toLowerCase()))throw billingIssue();
  seen.add(input.agreementId.toLowerCase());const agreement=await readBillingAgreement(c,s,input.agreementId);
  if(agreement.customer_id!==args.p_customer_id||agreement.currency!==args.p_currency||!billingTermsReady(agreement.terms))throw billingIssue();
  if(agreement.scope_kind==='quote'&&!input.projectId&&!(await c.query("select 1 from quotes where organization_id=$1 and id=$2 and billing_agreement_id=$3 and status='accepted' and archived_at is null",[s.organizationId,agreement.scope_id,agreement.id])).rowCount)throw billingIssue();
  let effective=agreement.terms;
  if(effective.model==='milestone'){const done=(await c.query('select milestone_id::text from billing_milestone_completions where organization_id=$1 and agreement_id=$2',[s.organizationId,agreement.id])).rows.map(m=>m.milestone_id);effective={...effective,milestones:effective.milestones.map(m=>({...m,completed:m.completed||done.includes(m.id)}))};}
  const context=invoiceBillingContext(effective,input.context??{procedure:'standard'}),lines=(args.p_items as Row[]).filter(l=>l.billing_agreement_id===agreement.id);
  if(!lines.length)throw billingIssue();
  const discount=billingDiscount(input.discount??(agreement.commercial_snapshot as {calculation?:{discount?:unknown}}|null)?.calculation?.discount,args.p_currency as string);
  await bindBillingLines(c,s,{...args,p_items:lines,p_discount:discount,p_effective_billing_context:context},id,true,agreement);
  const ids=lines.flatMap(l=>[...(Array.isArray(l.time_entry_ids)?l.time_entry_ids:[]),...((l.time_allocations as Row[]|undefined)??[]).map(a=>a.time_entry_id)]);
  if(ids.length&&(await c.query('select 1 from time_entries t join projects p on p.organization_id=t.organization_id and p.id=t.project_id where t.organization_id=$1 and t.id=any($2::uuid[]) and p.billing_agreement_id is distinct from $3::uuid',[s.organizationId,ids,agreement.id])).rowCount)throw billingIssue();
  lines.forEach((l,i)=>{l.billing_scope_position=i+1;});scopes.push({agreementId:agreement.id,projectId:input.projectId??null,context,discount,positions:lines.map(l=>(args.p_items as Row[]).indexOf(l)+1)});
 }
 if((args.p_items as Row[]).some(l=>!seen.has(String(l.billing_agreement_id))))throw billingIssue();
 // The root remains one receivable. Its independent agreement scopes own provenance.
 await c.query('update invoices set billing_agreement_id=null,billing_context=null,project_id=null,source_quote_id=null where organization_id=$1 and id=$2',[s.organizationId,id]);
 await c.query('delete from invoice_billing_scopes where organization_id=$1 and invoice_id=$2',[s.organizationId,id]);
 for(const scope of scopes)await c.query('insert into invoice_billing_scopes(organization_id,invoice_id,agreement_id,project_id,billing_context) values($1,$2,$3,$4,$5::jsonb)',[s.organizationId,id,scope.agreementId,scope.projectId,JSON.stringify(scope.context)]);
 args.p_effective_billing_scopes=scopes;return null;
}

/** Called inside the existing invoice transaction. Source rows are locked before
 * reading remaining advances; the database independently enforces the same cap. */
export async function applyDocumentAdvances(c:PoolClient,s:SessionUser,invoiceId:string,input:unknown,calculation:DocumentCalculation,preview?:{customerId:unknown;currency:unknown;agreements:{agreementId:string;context?:unknown}[];invoiceId?:string;issueDate?:string}){
 if(input===undefined||Array.isArray(input)&&!input.length)return calculation;
 if(!Array.isArray(input)||input.length>100)throw billingIssue();
 const seen=new Set<string>();
 for(const raw of input){if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!['advanceInvoiceId','agreementId','amount'].includes(k))||![raw.advanceInvoiceId,raw.agreementId].every(v=>typeof v==='string'&&/^[0-9a-f-]{36}$/i.test(v))||!/^\d{1,9}(?:\.\d{1,2})?$/.test(String(raw.amount))||moneyMinor(raw.amount)<=0||seen.has(raw.advanceInvoiceId+':'+raw.agreementId))throw billingIssue();seen.add(raw.advanceInvoiceId+':'+raw.agreementId);}
 if(!preview)await c.query('select id from invoices where organization_id=$1 and id=any($2::uuid[]) order by id for update',[s.organizationId,input.map(a=>a.advanceInvoiceId)]);
 const target=preview?preview.agreements.map(a=>({billing_agreement_id:a.agreementId,billing_context:a.context??{procedure:'standard'},customer_id:preview.customerId,currency:preview.currency,issue_date:preview.issueDate})):(await c.query('select * from billing_scope_invoices where organization_id=$1 and id=$2',[s.organizationId,invoiceId])).rows;
 const applications:AdvanceApplication[]=[];
 for(const raw of input){
  const dest=target.find(t=>t.billing_agreement_id===raw.agreementId);
  const source=(await c.query("select s.*,i.invoice_no from billing_scope_invoices s join invoices i on i.organization_id=s.organization_id and i.id=s.id where s.organization_id=$1 and s.id=$2 and s.billing_agreement_id=$3 and s.billing_context->>'procedure'='advance' and s.billing_issued and s.archived_at is null and s.status not in ('draft','cancelled')",[s.organizationId,raw.advanceInvoiceId,raw.agreementId])).rows[0];
  if(!dest||!source||dest.billing_context?.procedure==='advance'||source.customer_id!==dest.customer_id||source.currency!==dest.currency)throw billingIssue();
  if(dest.issue_date&&source.issue_date>dest.issue_date)throw new ApiError(409,'advance_date_invalid','Akonto kann nicht vor dem Rechnungsdatum angerechnet werden.');
  const prior=(await c.query("select a.snapshot from invoice_advance_allocations a join invoices i on i.organization_id=a.organization_id and i.id=a.invoice_id where a.reversed_at is null and a.organization_id=$1 and a.advance_invoice_id=$2 and a.agreement_id=$3 and (i.billing_issued or i.archived_at is null and i.status<>'cancelled') and ($4::uuid is null or i.id<>$4::uuid)",[s.organizationId,source.id,raw.agreementId,preview?.invoiceId??null])).rows.map(r=>r.snapshot.taxGroups);
  const credits=Number((await c.query('select coalesce(sum(amount),0) amount from credit_notes where organization_id=$1 and invoice_id=$2',[s.organizationId,source.id])).rows[0].amount);
  if(credits>0)throw billingIssue(); // Legacy gross-only credits have no authoritative remaining tax buckets.
  if(moneyMinor(raw.amount)+prior.flat().reduce((n,g)=>n+moneyMinor(g.net)+moneyMinor(g.tax),0)+moneyMinor(credits)>moneyMinor(source.calculation.total))throw new ApiError(409,'advance_already_applied','Der verfügbare Akontobetrag wurde überschritten.');
  const sourceAgreement=await readBillingAgreement(c,s,raw.agreementId),terms=sourceAgreement.terms;if(!(terms.model==='time'||terms.model==='quantity'||terms.model==='mixed'&&terms.amount===null))throw billingIssue();
  const taxGroups=allocateAdvance(source.calculation,raw.amount,prior),application={agreementLabel:sourceAgreement.label,advanceNumber:String(source.invoice_no),advanceInvoiceId:source.id,agreementId:raw.agreementId,amount:String(raw.amount),taxGroups};
  if(!preview)await c.query('insert into invoice_advance_allocations(organization_id,invoice_id,advance_invoice_id,agreement_id,amount,net_amount,vat_amount,snapshot) values($1,$2,$3,$4,$5,$6,$7,$8::jsonb)',[s.organizationId,invoiceId,source.id,raw.agreementId,raw.amount,sumMoney(taxGroups.map(g=>g.net)),sumMoney(taxGroups.map(g=>g.tax)),JSON.stringify(application)]);applications.push(application);
 }
 if('billingScopes' in calculation){const scopes=calculation.billingScopes as ReturnType<typeof consolidateCalculations>['billingScopes'];return consolidateCalculations(scopes.map(scope=>({id:scope.agreementId,positions:scope.positions,calculation:applyAdvanceApplications(scope.calculation,applications.filter(a=>a.agreementId===scope.agreementId))})),calculation.currency);}
 return applyAdvanceApplications(calculation,applications);
}

export async function reconcileDocumentBilling(c:PoolClient,s:SessionUser,invoiceId:string,items:Row[],calculation:DocumentCalculation,preview?:{agreementId:string;context?:unknown}[]){
 const current=preview?preview.map(a=>({billing_agreement_id:a.agreementId,billing_context:a.context??{procedure:'standard'}})):(await c.query('select * from billing_scope_invoices where organization_id=$1 and id=$2 and billing_agreement_id is not null order by billing_agreement_id',[s.organizationId,invoiceId])).rows;
 const reconcile=async(agreementId:string,calc:DocumentCalculation,positions:number[])=>{
  const scope=current.find(r=>r.billing_agreement_id===agreementId);if(!scope||scope.billing_context?.procedure==='advance')return calc;
  const agreement=await readBillingAgreement(c,s,agreementId);if(!['quantity','fixed','recurring'].includes(agreement.terms.model)||!agreement.commercial_snapshot||scope.billing_context?.procedure!=='final'&&agreement.terms.model!=='quantity')return calc;
  if(!preview)await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+agreementId]);
  const prior=(await c.query("select * from billing_scope_invoices where organization_id=$1 and billing_agreement_id=$2 and ($3::uuid is null or id<>$3::uuid) and ($5::boolean or coalesce(billing_context->>'procedure','standard')<>'advance') and coalesce(billing_context->>'period','')=$4 and (billing_issued or archived_at is null and status<>'cancelled') order by created_at,id",[s.organizationId,agreementId,invoiceId||null,String(scope.billing_context?.period??''),agreement.terms.model!=='quantity'])).rows;
  if(!prior.length)return calc;
  const sourcePositions=positions.map(p=>Number(items[p-1].billing_source_position));
  const previous=[];
  for(const p of prior){const lines=(await c.query('select billing_source_position,quantity from billing_scope_lines where organization_id=$1 and invoice_id=$2 and billing_agreement_id=$3 order by sort_order',[s.organizationId,p.id,agreementId])).rows;previous.push({calculation:p.calculation,sourcePositions:lines.map(l=>Number(l.billing_source_position)),quantities:lines.map(l=>l.quantity)});}
  if(agreement.terms.model==='quantity'){const snapshot=agreement.commercial_snapshot as {items:Row[]};for(let n=0;n<snapshot.items.length;n++){const used=previous.reduce((sum,p)=>sum+p.quantities.reduce((part,q,i)=>part+(p.sourcePositions[i]===n+1?moneyMinor(q):0),0),0)+positions.reduce((sum,p)=>sum+(Number(items[p-1].billing_source_position)===n+1?moneyMinor(items[p-1].quantity):0),0);if(used>moneyMinor(snapshot.items[n].quantity))throw new ApiError(400,'billing_source_invalid','Die Angaben zum Abrechnungsmodell sind ungültig.');}}
  if(scope.billing_context?.procedure!=='final'&&agreement.terms.model==='quantity'){const snapshot=agreement.commercial_snapshot as {items:Parameters<typeof reconcileCumulativeQuantityCalculation>[1];calculation:DocumentCalculation};return reconcileCumulativeQuantityCalculation(calc,snapshot.items,snapshot.calculation,sourcePositions,positions.map(p=>items[p-1].quantity),previous);}
  return reconcileFinalCalculation(calc,(agreement.commercial_snapshot as {calculation:DocumentCalculation}).calculation,sourcePositions,previous);
 };
 if('billingScopes' in calculation){const scopes=calculation.billingScopes as ReturnType<typeof consolidateCalculations>['billingScopes'];const result=[];for(const scope of scopes)result.push({id:scope.agreementId,positions:scope.positions,calculation:await reconcile(scope.agreementId,scope.calculation,scope.positions)});return consolidateCalculations(result,calculation.currency);}
 return current[0]?.billing_agreement_id?reconcile(current[0].billing_agreement_id,calculation,items.map((_,i)=>i+1)):calculation;
}

function billingDiscount(input:unknown,currency:string){try{return normalizeMoneyDiscount(input,currency);}catch{throw billingIssue();}}
