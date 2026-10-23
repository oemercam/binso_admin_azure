import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl} from './data-test-modules.mjs';
const {previousStatisticBounds,metricTrend}=await import(moduleUrl(await fs.readFile('lib/kpi-trend.ts','utf8')));
for(const bounds of [{from:'2026-10-01',to:'2026-10-23'},{from:'2024-02-01',to:'2024-02-29'},{from:'2026-01-01',to:'2026-01-01'}]){
 const prior=previousStatisticBounds(bounds);
 assert.equal(Date.parse(bounds.from)-Date.parse(prior.to),86400000,'Periods must be adjacent');
 assert.equal(Date.parse(bounds.to)-Date.parse(bounds.from),Date.parse(prior.to)-Date.parse(prior.from),'Inclusive calendar lengths match');
}
assert.deepEqual(previousStatisticBounds({from:'2026-10-01',to:'2026-10-23'}),{from:'2026-09-08',to:'2026-09-30'});
assert.equal(metricTrend(4820,4000,true,false,'').percent,20.5);
assert.equal(metricTrend(100,0,true,false,'').percent,null,'Zero baseline is not 100%');
assert.equal(metricTrend(100,50,false,false,'').percent,null,'Missing evidence is not zero');
assert.equal(metricTrend(100,50,true,true,'').tone,'negative','Rising outflows are unfavorable');
assert.equal(metricTrend(25,50,true,true,'').tone,'positive','Falling outflows are favorable');
assert.equal(metricTrend(-50,-100,true,false,'').percent,50,'Negative baseline uses its absolute magnitude');
assert.equal(metricTrend(0,100,true,false,'').percent,-100,'Zero current value is a real decrease');
assert.equal(metricTrend(100,100,true,false,'').tone,'neutral');
assert.equal(metricTrend(Infinity,100,true,false,'').percent,null);
assert.equal(metricTrend(1e300,1e-300,true,false,'').percent,null,'Do not render infinite percentages');
console.log('V3: equal calendar windows, evidence/zero baseline, negative baseline and business trend direction passed.');
const {greetingZone,greetingPeriod,nextGreetingChange}=await import(moduleUrl(await fs.readFile('lib/dashboard-greeting.ts','utf8')));
for(const [iso,expected] of [['2026-10-23T02:59:59Z','Guten Abend'],['2026-10-23T03:00:00Z','Guten Morgen'],['2026-10-23T08:59:59Z','Guten Morgen'],['2026-10-23T09:00:00Z','Guten Tag'],['2026-10-23T15:59:59Z','Guten Tag'],['2026-10-23T16:00:00Z','Guten Abend']])assert.equal(greetingPeriod(new Date(iso),'Europe/Zurich'),expected);
assert.equal(greetingZone('invalid/zone'),'Europe/Zurich');
assert.equal(greetingPeriod(new Date('2026-10-23T03:00:00Z'),'America/New_York'),'Guten Abend');
for(const iso of ['2026-10-23T08:59:59Z','2026-10-25T00:30:00Z']){const now=new Date(iso),next=nextGreetingChange(now,'Europe/Zurich');assert.ok(next>now.getTime());assert.notEqual(greetingPeriod(new Date(next),'Europe/Zurich'),greetingPeriod(now,'Europe/Zurich'));assert.equal(greetingPeriod(new Date(next-1000),'Europe/Zurich'),greetingPeriod(now,'Europe/Zurich'));}
console.log('V3: local greeting boundaries, invalid-zone fallback and DST transition scheduling passed.');
