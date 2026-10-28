import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl,moneyModuleUrl} from './data-test-modules.mjs';
const {calculateDocument}=await import(moneyModuleUrl);
const contracts=await import(moduleUrl(await fs.readFile('lib/commercial-contract.ts','utf8')));
const line=(quantity,unit_price,price_base_quantity)=>({quantity,unit_price,price_base_quantity,vat_rate:'8.10'});
// Same financial owner, exact division: no rounded hourly conversion.
for(const [minutes,price,basis,net,tax] of [
 [120,'25.00',15,'200.00','16.20'],
 [1,'100.01',480,'0.21','0.02'],
 [63,'800.00',480,'105.00','8.51'],
 [17,'1.23',1,'20.91','1.69'],
 [1,'0.01',1440,'0.00','0.00'],
]){
 const result=calculateDocument([line(minutes,price,basis)],'CHF');
 assert.equal(result.subtotal,net);assert.equal(result.vat,tax);
 assert.deepEqual(calculateDocument([line(minutes,price,basis)],'EUR'),{...result,currency:'EUR'});
}
for(const basis of [0,-1,1.5,1441,'15',false])assert.throws(()=>calculateDocument([line(1,'10.00',basis)],'CHF'));
const condition={resourceId:null,startsOn:'2026-10-01',endsOn:null,unit:'day',unitPrice:'100.01',currency:'CHF',taxTreatment:'taxable',vatRate:'8.10',taxReason:'',expensePolicy:'included'};
assert.equal(contracts.contractConditionIssue({...condition,timeUnitMinutes:480}),null);
assert.equal(contracts.contractTimeUnitMinutes({...condition,timeUnitMinutes:480}),480);
assert.equal(contracts.contractTimeUnitMinutes({...condition,unit:'hour'}),60);
assert.equal(contracts.contractTimeUnitMinutes({...condition,unit:'minute'}),1);
assert.equal(contracts.contractTimeUnitMinutes(condition),null,'Never guess the duration of a day or an arbitrary unit');
for(const timeUnitMinutes of [0,1441,1.2,'480',false])assert.ok(contracts.contractConditionIssue({...condition,timeUnitMinutes}));
const {compareSupplierInvoice}=await import(moduleUrl((await fs.readFile('lib/supplier-invoice-match.ts','utf8')).replace("'./money'",JSON.stringify(moneyModuleUrl))));
const purchase={invoice:{id:'fixture',version:1,number:'AP-1',invoiceDate:'2026-10-01',dueDate:'2026-10-31',currency:'CHF',netAmount:'105.00',vatAmount:'8.51',totalAmount:'113.51'},period:{start:'2026-10-01',end:'2026-10-31'},claimed:{minutes:63,unitPrice:'800.00'},sources:[{priceSourceId:'fixture',timeEntryId:'time',timeVersion:1,minutes:63,workDate:'2026-10-01',projectId:null,price:{contractId:'contract',unitPrice:'800.00',currency:'CHF',vatRate:'8.10',taxTreatment:'taxable',unitMinutes:480}}],receipts:[{id:'receipt',sha256:'fixture',scanStatus:'clean'}]};
assert.equal(compareSupplierInvoice(purchase).ready,true,'Purchase matching must use the actual contractual day basis');
assert.equal(compareSupplierInvoice({...purchase,sources:[...purchase.sources,{...purchase.sources[0],price:{...purchase.sources[0].price,unitMinutes:60}}]}).ready,false,'Different unit bases cannot be grouped as the same purchase price');
console.log('Contract time units: exact minute/15-minute/explicit-day amounts and VAT, CHF/EUR parity, no hourly-price rounding, explicit basis and invalid-unit denials passed. Original durations are never changed.');

