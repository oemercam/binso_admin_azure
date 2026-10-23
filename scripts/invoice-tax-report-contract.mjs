import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

/** Isolated migrated database: recorded amounts, never inferred credit tax. */
export async function verifyInvoiceTaxReport({db,session,reportHandler,readRequest}){
 const organizationId=randomUUID(),customerId=randomUUID(),ids=[];
 await db.query("insert into organizations(id,name,slug,status,is_demo) values($1,'Synthetic VAT report',$2,'active',false)",[organizationId,'vat-'+organizationId]);
 await db.query("insert into customers(id,organization_id,external_id,customer_no,name) values($1,$2,$3,'VAT-1','Synthetic VAT customer')",[customerId,organizationId,customerId]);
 const specs=[['sent','CHF','2026-10-01',100,8.1,false],['paid','CHF','2026-10-02',80,6.48,true],['partial','EUR','2026-10-01',50,10,false],['draft','CHF','2026-10-01',800,64.8,false],['cancelled','CHF','2026-10-01',900,72.9,false],['sent','CHF','2099-01-01',700,56.7,false],['sent','CHF','2020-01-01',300,24.3,false]];
 for(const [index,[status,currency,date,net,tax,archived]] of specs.entries())ids.push((await db.query("insert into invoices(organization_id,external_id,invoice_no,customer_id,status,currency,issue_date,due_date,subtotal,vat_amount,total_amount,archived_at) values($1,$2,$2,$3,$4,$5,$6,$6,$7,$8,$7::numeric+$8::numeric,case when $9 then now() else null end) returning id",[organizationId,'VAT-'+organizationId+'-'+index,customerId,status,currency,date,net,tax,archived])).rows[0].id);
 for(const [index,[invoice,date,amount]] of [[6,'2026-10-05',30],[2,'2026-10-06',9],[0,'2099-01-01',999],[0,'2020-01-01',999]].entries())await db.query("insert into credit_notes(organization_id,external_id,credit_no,invoice_id,customer_id,credit_date,amount,reason) values($1,gen_random_uuid()::text,$2,$3,$4,$5,$6,'Synthetic unallocated credit')",[organizationId,'VAT-C-'+organizationId+'-'+index,ids[invoice],customerId,date,amount]);
 const original=globalThis.__processSession;
 try{
  globalThis.__processSession={...session,organizationId};
  const result=await reportHandler.GET(readRequest());assert.equal(result.status,200,JSON.stringify(result));
  const numeric=rows=>rows.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,key==='currency'?value:Number(value)])));
  assert.deepEqual(numeric(result.data.vat),[
   {currency:'CHF',invoiceCount:2,netBeforeCredits:180,vatBeforeCredits:14.58,grossBeforeCredits:194.58,unallocatedCreditCount:1,unallocatedCreditGross:30},
   {currency:'EUR',invoiceCount:1,netBeforeCredits:50,vatBeforeCredits:10,grossBeforeCredits:60,unallocatedCreditCount:1,unallocatedCreditGross:9},
  ],'Issued archived documents count; draft/cancelled/future/outside documents do not. Credits use their own dates, never guessed VAT or mixed currencies.');
  for(const item of result.data.vat)assert.deepEqual(Object.keys(item).sort(),['currency','grossBeforeCredits','invoiceCount','netBeforeCredits','unallocatedCreditCount','unallocatedCreditGross','vatBeforeCredits']);
  for(const role of ['hr','reader','project_manager','manager']){globalThis.__processSession={...session,organizationId,role};assert.equal((await reportHandler.GET(readRequest())).data.vat,null,role+' has no VAT grant');}
  for(const plan of ['start','business','pro']){globalThis.__processSession={...session,organizationId};globalThis.__processReportPlan=plan;const response=await reportHandler.GET(readRequest());assert.equal(response.status,200);if(plan==='start')assert.equal(response.data.vat,null);else assert.equal(response.data.vat.length,2);}
  delete globalThis.__processReportPlan;
  const csv=await (await reportHandler.GET(readRequest('&format=csv&lang=fr'))).text();assert.ok(csv.includes('FR:MwSt.-Datenbasis'));assert.ok(csv.includes('FR:Rechnungswerte vor Gutschriften; keine Steuerdeklaration'));assert.ok(csv.includes('"14.58";"CHF"'));assert.ok(!csv.includes('Synthetic VAT customer'),'No customer identity enters the aggregate');
  const future=await reportHandler.GET({nextUrl:new URL('https://fixture.invalid/api/reports?months=custom&from=2099-01-01&to=2099-01-02'),cookies:{get:()=>({value:'de'})}});assert.equal(future.status,200);assert.deepEqual(future.data.vat,[]);
  globalThis.__processSession={...session,organizationId:randomUUID()};assert.deepEqual((await reportHandler.GET(readRequest())).data.vat,[],'Foreign tenant receives none of the explicit positive fixtures');
 }finally{delete globalThis.__processReportPlan;globalThis.__processSession=original;}
 console.log('Invoice tax report: actual recorded issued/archive amounts, credit-date gross-only uncertainty, separate currencies, periods/roles/tariffs/tenant projection and translated CSV disclaimer passed. Not a tax-return calculation.');
}
