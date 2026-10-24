import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl} from './data-test-modules.mjs';
const {timeEntryStatus}=await import(moduleUrl(await fs.readFile('lib/time-entry-status.ts','utf8')));
const {filterTimeEntries,timeEntryQuery}=await import(moduleUrl(await fs.readFile('lib/time-entry-filter.ts','utf8')));
const fixtures=[
 {id:'recorded',billable:true},
 {id:'internal',billable:false},
 {id:'rejected',billable:true,review_note:'Actual review reason'},
 {id:'resubmitted',billable:true,submitted_at:'2026-10-24',review_note:'Old review reason'},
 {id:'approved',billable:true,approved:true,submitted_at:'2026-10-24',review_note:'Old review reason'},
 {id:'invoiced',billable:true,approved:true,invoiced_invoice_id:'immutable-invoice'},
];
assert.deepEqual(fixtures.map(timeEntryStatus),['Erfasst','Erfasst','Zurückgewiesen','Eingereicht','Freigegeben','Verrechnet']);
const filter={query:'',from:'',to:'',status:'Alle'};
for(const [status,ids,api]of [['Erfasst',['recorded','internal'],'recorded'],['Zurückgewiesen',['rejected'],'rejected'],['Eingereicht',['resubmitted'],'submitted'],['Freigegeben',['approved'],'approved'],['Verrechnet',['invoiced'],'invoiced']]){
 assert.deepEqual(filterTimeEntries(fixtures,{...filter,status}).map(item=>item.id),ids);
 assert.equal(timeEntryQuery({...filter,status}).get('status'),api,'Actual remote and local filters name the same states');
}
assert.equal(timeEntryStatus({review_note:'  '}),'Erfasst');
assert.deepEqual(filterTimeEntries(fixtures,{...filter,status:'Zur Prüfung'}),filterTimeEntries(fixtures,{...filter,status:'Eingereicht'}),'Existing submitted deep-link label stays compatible');
console.log('Phase 1 time statuses: actual review evidence, resubmission precedence, disjoint states, internal classification and remote/local filter correspondence passed.');
