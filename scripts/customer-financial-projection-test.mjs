import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
function exportsFrom(file,bindings={}){
 const source=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,source,99,true,ts.ScriptKind.TS);
 const body=ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast)).join('\n');
 const compiled=ts.transpileModule(body,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exported={};Function('exports',...Object.keys(bindings),compiled)(exported,...Object.values(bindings));return exported;
}
class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code;}}
const {customerFinancialProjection,listApiBusiness}=exportsFrom('lib/server/repositories/business-api.ts',{...exportsFrom('lib/server/document-amount-sql.ts'),tenantCan:role=>role!=='hr',ApiError,businessDate:()=>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Zurich'})});
const {financialMetricsData}=exportsFrom('lib/server/repositories/finance.ts');
const db=new PGlite(),organization='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const ids=['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','cccccccc-cccc-4ccc-8ccc-cccccccccccc'];
try{
 await db.exec(`create table customers(id uuid,organization_id uuid);create table invoices(id uuid primary key,organization_id uuid,customer_id uuid,currency text,status text,issue_date date,due_date date,total_amount numeric,paid_amount numeric,archived_at timestamptz);create table credit_notes(organization_id uuid,invoice_id uuid,credit_date date,amount numeric);create table invoice_refunds(organization_id uuid,invoice_id uuid,refund_date date,amount numeric);`);
 for(const id of ids)await db.query('insert into customers values($1,$2)',[id,organization]);
 const date=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Zurich'}),year=Number(date.slice(0,4));
 const invoiceIds=[];
 const cases=[['CHF',1000,500,date,'sent',organization,ids[0],null],['EUR',200,200,date,'paid',organization,ids[0],null],['CHF',100,50,(year-1)+'-01-01','partial',organization,ids[0],null],['CHF',9999,0,date,'draft',organization,ids[0],null],['CHF',8888,0,date,'cancelled',organization,ids[0],null],['CHF',7777,0,(year+1)+'-01-01','sent',organization,ids[0],null],['CHF',6666,0,date,'sent',organization,ids[0],date],['CHF',5555,0,date,'sent',other,ids[0],null],['CHF',50,50,date,'paid',organization,ids[1],null]];
 for(const [index,row] of cases.entries()){const id='dddddddd-dddd-4ddd-8ddd-'+String(index+1).padStart(12,'0');invoiceIds.push(id);const [currency,total,paid,issued,status,org,customer,archived]=row;await db.query('insert into invoices values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[id,org,customer,currency,status,issued,date,total,paid,archived]);}
 for(const [index,amount,creditDate,org] of [[0,100,date,organization],[2,20,date,organization],[0,222,(year+1)+'-01-01',organization],[0,999,date,other]])await db.query('insert into credit_notes values($1,$2,$3,$4)',[org,invoiceIds[index],creditDate,amount]);
 await db.query('insert into invoice_refunds values($1,$2,$3,$4)',[organization,invoiceIds[0],date,100]);
 await db.query('insert into invoice_refunds values($1,$2,$3,$4)',[organization,invoiceIds[0],(year+1)+'-01-01',300]);
 const actual=(await db.query(`select c.id,f.* from customers c left join lateral (${customerFinancialProjection()}) f on true where c.organization_id=$1`,[organization])).rows;
 for(const customer of actual){for(const row of customer.financials){const expected=await financialMetricsData(db,organization,{currency:row.currency,customerId:customer.id});const revenue=expected.revenueEvents.filter(event=>event.date.startsWith(year+'-')).reduce((sum,event)=>sum+Number(event.amount),0);assert.equal(Number(row.revenue),revenue);assert.equal(Number(row.open_amount),Number(expected.snapshot.receivables));}}
 assert.equal(actual.find(row=>row.id===ids[0]).has_open,true);assert.equal(actual.find(row=>row.id===ids[1]).has_open,false);assert.deepEqual(actual.find(row=>row.id===ids[2]).financials,[]);
 const open=(await db.query(`select c.id from customers c left join lateral (${customerFinancialProjection()}) f on true where c.organization_id=$1 and f.has_open=true order by c.id limit 1`,[organization])).rows;assert.deepEqual(open.map(row=>row.id),[ids[0]]);
 const queries=[],client={query:async(sql,values)=>{queries.push({sql,values});return {rows:[]}}};
 await listApiBusiness(client,{organizationId:organization,userId:ids[0],role:'owner'},'customers','include=financials&outstanding=1&limit=1');
 assert.match(queries[0].sql,/where q.has_open=true/);assert.match(queries[0].sql,/count\(\*\) over\(\)/);assert.match(queries[0].sql,/limit 1/);assert.deepEqual(queries[0].values,[organization]);
 await listApiBusiness(client,{organizationId:organization,userId:ids[0],role:'hr'},'customers','include=financials');assert.ok(!queries[1].sql.includes('credit_notes'),'Financial projection is permission gated');
 await assert.rejects(()=>listApiBusiness(client,{organizationId:organization,userId:ids[0],role:'hr'},'customers','include=financials&outstanding=1'),e=>e.code==='invalid_filter');assert.equal(queries.length,2,'Unauthorized balance filtering executes no query');
 console.log('Customer financial projection matches the canonical financial metrics across currencies, credits/refunds, year/date bounds, draft/cancel/archive exclusions and tenants; permission gates and pre-pagination filtering passed.');
}finally{await db.close();}
