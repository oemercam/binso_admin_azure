import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl,financialModuleUrl} from './data-test-modules.mjs';
const {financialStatusTone}=await import(financialModuleUrl);
for(const [status,tone] of [['draft','neutral'],['sent','info'],['accepted','success'],['declined','danger'],['expired','neutral']])assert.equal(financialStatusTone({kind:'offer',status,valid_until:'2099-12-31'}),tone);
assert.equal(financialStatusTone({kind:'invoice',status:'sent',total:100,paid_amount:0,due_date:'2000-01-01'}),'danger','Invoice overdue risk is not weakened by neutral expired-offer styling');
const {documentUnitOptions,positionNumber,moveDocumentLine,reorderDocumentLine,duplicateDocumentLine,canDuplicateDocumentLine}=await import(moduleUrl(await fs.readFile('lib/document-lines.ts','utf8')));
for(const unit of ['Stück','Stunden','Tage','Pauschal','Meter','m²','Kilometer'])assert.ok(documentUnitOptions().includes(unit));
for(const unit of ['hour','piece','flat','Spezialmass']){const options=documentUnitOptions(unit);assert.equal(options[0],unit);assert.equal(new Set(options).size,options.length);}
const original=[{id:'a',quantity:'1',price:'10'},{id:'b',quantity:'2',price:'20'},{id:'c',quantity:'3',price:'30'}];
assert.deepEqual(reorderDocumentLine(original,'a','c').map(line=>line.id),['b','c','a']);
assert.deepEqual(reorderDocumentLine(original,'c','a').map(line=>line.id),['c','a','b']);
for(const [id,target]of [['missing','a'],['a','missing'],['a','a']])assert.deepEqual(reorderDocumentLine(original,id,target),original);
const linkedFixture={id:'linked',timeAllocations:[{timeEntryId:'immutable-source',minutes:17}],expenseIds:['original-receipt']};
assert.equal(reorderDocumentLine([linkedFixture,...original],'linked','c').at(-1),linkedFixture,'Drag reorder preserves the exact linked billing evidence without duplicating or changing minutes');
assert.deepEqual(moveDocumentLine(original,'b',-1).map(line=>line.id),['b','a','c']);
assert.deepEqual(moveDocumentLine(original,'b',1).map(line=>line.id),['a','c','b']);
for(const [id,direction] of [['a',-1],['c',1],['missing',1]])assert.deepEqual(moveDocumentLine(original,id,direction),original);
assert.deepEqual(original.map(line=>line.id),['a','b','c'],'Editing never mutates the previous draft');
const copy=duplicateDocumentLine(original,'b','copy');assert.deepEqual(copy.map(line=>line.id),['a','b','copy','c']);assert.deepEqual(copy[2],{...original[1],id:'copy'});assert.notEqual(copy[2],original[1]);
assert.throws(()=>duplicateDocumentLine(original,'a','b'),/eindeutig/);assert.throws(()=>duplicateDocumentLine(original,'missing','new'),/gefunden/);
for(const key of ['expenseIds','timeEntryIds','timeAllocations']){const linked={id:'linked',[key]:['source']};assert.equal(canDuplicateDocumentLine(linked),false);assert.throws(()=>duplicateDocumentLine([linked],'linked','copy'),/doppelt/);assert.deepEqual(moveDocumentLine([linked,original[0]],'linked',1)[1],linked,'Reordering retains billing provenance');}
assert.deepEqual([0,8,9,99].map(positionNumber),['01','09','10','100']);
console.log('Document lines: required/custom units, immutable ordering, unique duplication, linked-charge denial and numbering passed.');
