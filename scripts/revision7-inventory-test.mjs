import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root='docs/audit/v25-revision7',source=fs.readFileSync(root+'/source.md'),requirements=JSON.parse(fs.readFileSync(root+'/requirements.json')),routes=JSON.parse(fs.readFileSync(root+'/routes.json'));
assert.equal(requirements.sourceSha256,createHash('sha256').update(source).digest('hex'));
assert.deepEqual([...new Set(requirements.requirements.map(x=>x.chapter))],Array.from({length:56},(_,i)=>i+1),'No master chapter may disappear');
assert.equal(new Set(requirements.requirements.map(x=>x.id)).size,requirements.requirements.length);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name).replaceAll('\\','/')]);
assert.deepEqual(routes.routes.map(x=>x.file).sort(),walk('app').filter(x=>x.endsWith('/page.tsx')).sort(),'Every actual route is accounted for');
for(const row of requirements.requirements){assert.ok(row.requirement);assert.ok(row.status);if(row.status==='abgenommen'){assert.ok(row.test&&!/offen|pending/i.test(row.test));assert.ok(row.visualComparison&&!/offen|pending/i.test(row.visualComparison));}}
for(const row of routes.routes){assert.ok(row.roles.length);assert.ok(row.states.includes('Fehler'));assert.ok(row.states.includes('Speichern/Reload/neue Sitzung'));assert.ok(row.kpiAssessment);}
console.log('Revision7 inventory: all56 chapters, every route, explicit roles/states and no unsupported completion claim passed.');
