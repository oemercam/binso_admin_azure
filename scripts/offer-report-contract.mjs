import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {documentAmountSqlModuleUrl} from './data-test-modules.mjs';
export async function verifyOfferReport({db,organizationId,otherOrganizationId,session,customerId,reportHandler,readRequest,listApiBusiness,reportExport}){
 const {offerTotalSql,offerStatusSql}=await import(documentAmountSqlModuleUrl);assert.throws(()=>offerTotalSql('q; drop table quotes'),/Invalid internal/);assert.throws(()=>offerStatusSql('q','$4; select 1'),/Invalid internal/);
 const baseline=(await reportHandler.GET(readRequest())).data.offers;
 globalThis.__processSession={...session,organizationId:otherOrganizationId};const otherBaseline=(await reportHandler.GET(readRequest())).data.offers;globalThis.__processSession=session;
 const key='R7-offer-'+randomUUID(),created=[],specs=[
  ['accepted','CHF','2026-10-01',null,false,.21],['declined','CHF','2026-10-01',null,false,100],['sent','CHF','2026-10-01','2099-01-01',false,100],['sent','CHF','2026-10-01','2020-01-01',false,100],['draft','CHF','2026-10-01',null,false,100],['accepted','EUR','2026-10-01',null,false,50],['draft','EUR','2026-10-01',null,false,200],['accepted','CHF','2020-01-01',null,false,999],['accepted','CHF','2099-01-01',null,false,999],['accepted','CHF','2026-10-01',null,true,999]
 ];
 for(const [index,[status,currency,date,until,archived,amount]] of specs.entries()){
  const row=(await db.query("insert into quotes(organization_id,quote_no,external_id,customer_id,title,issue_date,valid_until,currency,status) values($1,$2,$2,$3,$4,$5,$6,$7,'draft') returning id",[organizationId,key+'-'+index,customerId,key,date,until,currency])).rows[0];created.push(row.id);
  if(index===0)for(let line=0;line<2;line++)await db.query("insert into quote_lines(organization_id,quote_id,external_id,sort_order,description,quantity,unit,unit_price,vat_rate) values($1,$2,gen_random_uuid()::text,$3,'Fractional VAT fixture',1,'Stück',.10,5)",[organizationId,row.id,line]);
  else await db.query("insert into quote_lines(organization_id,quote_id,external_id,sort_order,description,quantity,unit,unit_price,vat_rate) values($1,$2,gen_random_uuid()::text,0,'Synthetic report amount',1,'Stück',$3,0)",[organizationId,row.id,amount]);
  await db.query('update quotes set status=$2,archived_at=case when $3 then now() else null end where id=$1',[row.id,status,archived]);
 }
 const actual=(await reportHandler.GET(readRequest())).data.offers;
 const find=(rows,currency,status)=>rows.find(row=>row.currency===currency&&row.status===status)??{count:'0',volume:'0'};
 for(const [currency,status,count,volume] of [['CHF','accepted',1,.21],['CHF','declined',1,100],['CHF','sent',1,100],['CHF','expired',1,100],['CHF','draft',1,100],['EUR','accepted',1,50],['EUR','draft',1,200]]){
  const before=find(baseline,currency,status),after=find(actual,currency,status);assert.equal(Number(after.count)-Number(before.count),count);assert.ok(Math.abs(Number(after.volume)-Number(before.volume)-volume)<.000001,'Separate currency, current expiry and exact aggregate VAT rounding');
 }
 for(const row of actual)assert.deepEqual(Object.keys(row).sort(),['count','currency','status','volume'],'Only aggregate fields leave the report service');
 const listed=await globalThis.__processTransaction(organizationId,c=>listApiBusiness(c,session,'documents','kind=eq.offer&q='+encodeURIComponent(key)+'&limit=100'));
 const rounded=listed.find(row=>row.id===created[0]);assert.ok(rounded,'The actual document list contains the same offer');assert.equal(Number(rounded.total),.21,'Report and list use the same sum-then-round contract, not separately rounded per-line VAT');
 const expired=listed.find(row=>row.id===created[3]);assert.equal(expired.display_status,'expired','List and report derive the same expired status without changing stored sent');
 assert.equal((await db.query('select status from quotes where id=$1',[created[3]])).rows[0].status,'sent');
 globalThis.__processSession={...session,role:'hr'};assert.equal((await reportHandler.GET(readRequest())).data.offers,null);globalThis.__processSession={...session,organizationId:otherOrganizationId};const other=(await reportHandler.GET(readRequest())).data.offers;assert.deepEqual(other,otherBaseline,'New foreign quotes cannot change the other tenant’s existing counts/volumes');globalThis.__processSession=session;
 globalThis.__processReportPlan='start';assert.ok((await reportHandler.GET(readRequest())).data.offers.some(row=>row.currency==='EUR'&&row.status==='accepted'),'The Start sales entitlement is retained');delete globalThis.__processReportPlan;
 const decision=reportExport.offerDecisionTotals([{currency:'CHF',status:'accepted',count:'2',volume:'1'},{currency:'EUR',status:'declined',count:'1',volume:'1'},{currency:'CHF',status:'draft',count:'900',volume:'1'},{currency:'CHF',status:'sent',count:'500',volume:'1'}]);assert.equal(decision.total,3);assert.ok(Math.abs(decision.rate-200/3)<.000001,'Drafts/pending and money do not enter the decision denominator');assert.equal(reportExport.offerDecisionTotals([]).rate,null);assert.equal(reportExport.offerDecisionTotals([{status:'draft',count:'5'}]).rate,null);assert.throws(()=>reportExport.offerDecisionTotals([{status:'accepted',count:'-1'}]),/Invalid report/);
 const csv=await (await reportHandler.GET(readRequest('&format=csv&lang=fr'))).text();assert.ok(csv.includes('FR:Angebote · FR:Angenommen · EUR'));assert.ok(csv.includes('FR:Angebotsvolumen · FR:Angenommen'));
 await db.query('update quotes set archived_at=now() where id=any($1::uuid[])',[created]);
 console.log('Offer report: real quote/list precision+expiry parity, dates/archive/currency, projection/role/tenant/Start entitlement and explicit decision denominator passed.');
}
