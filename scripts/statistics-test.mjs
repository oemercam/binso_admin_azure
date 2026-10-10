import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl,moneyModuleUrl} from './data-test-modules.mjs';
const source=(await fs.readFile('lib/statistics-period.ts','utf8')).replace("'./money'",JSON.stringify(moneyModuleUrl));
const {statisticBounds,aggregateStatistics,validBusinessDay}=await import(moduleUrl(source));
for(const day of ['','2026-02-29','2026-13-01','2026-02-30','2026-1-01','NaN'])assert.equal(validBusinessDay(day),false,day);
assert.equal(validBusinessDay('2024-02-29'),true);
for(const months of [1,3,6,12]){
 const bounds=statisticBounds({months,from:'',to:''},'2026-10-10');
 assert.equal(bounds.to,'2026-10-10');assert.equal(bounds.from,({1:'2026-10-01',3:'2026-08-01',6:'2026-05-01',12:'2025-11-01'})[months]);
}
for(const period of [{months:'custom',from:'',to:'2026-10-10'},{months:'custom',from:'2026-10-11',to:'2026-10-10'},{months:'custom',from:'2026-02-30',to:'2026-03-01'},{months:99,from:'',to:''}])assert.equal(statisticBounds(period,'2026-10-10'),null);
const events=[{date:'2026-10-01',values:{income:'0.10',costs:0}},{date:'2026-10-10',values:{income:'0.20',costs:'0.10'}},{date:'2026-10-11',values:{income:'90000',costs:0}}];
const actual=aggregateStatistics(events,{from:'2026-10-01',to:'2026-10-10'},['income','costs']);
assert.equal(actual.totals.income,0.3);assert.equal(actual.totals.costs,0.1);assert.equal(actual.resolution,'day');assert.equal(actual.buckets.length,10);
assert.equal(actual.buckets.at(-1).values.income,0.2,'Inclusive end day');
for(const [from,to,resolution] of [['2026-10-01','2026-10-31','week'],['2026-05-01','2026-10-10','month'],['2020-01-01','2026-10-10','year']]){
 const result=aggregateStatistics(events,{from,to},['income','costs']);assert.equal(result.resolution,resolution);assert.equal(result.totals.income,to==='2026-10-10'?0.3:90000.3);assert.ok(result.buckets.length<=24);
}
const long=aggregateStatistics([],{from:'1900-01-01',to:'9998-12-31'},['income']);assert.ok(long.buckets.length<=12,'Very long ranges remain bounded');assert.ok(long.buckets.every(bucket=>bucket.values.income===0),'No invented bars');
const cashSource=(await fs.readFile('lib/cash-statistics.ts','utf8'));const {cashStatisticEvents}=await import(moduleUrl(cashSource));
assert.deepEqual(cashStatisticEvents({payments:[{payment_date:'2026-10-10',amount:50}],outflows:[{payment_date:'2026-10-11',amount:20}]}),[{date:'2026-10-10',values:{income:50,costs:0}},{date:'2026-10-11',values:{income:0,costs:20}}]);
console.log('Central statistics: presets, inclusive dates, invalid dates, UTC/DST-independent groups, decimal precision, bounded long periods and cash mapping passed.');
