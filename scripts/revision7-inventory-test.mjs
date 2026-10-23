import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root='docs/audit/v25-revision7',source=fs.readFileSync(root+'/source.md'),requirements=JSON.parse(fs.readFileSync(root+'/requirements.json')),routes=JSON.parse(fs.readFileSync(root+'/routes.json'));
assert.equal(requirements.sourceSha256,createHash('sha256').update(source).digest('hex'));
assert.deepEqual([...new Set(requirements.requirements.map(x=>x.chapter))],Array.from({length:56},(_,i)=>i+1),'No master chapter may disappear');
assert.equal(new Set(requirements.requirements.map(x=>x.id)).size,requirements.requirements.length);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name).replaceAll('\\','/')]);
// Preserve the V25 snapshot and explicitly account for subsequent V26 routes.
const additions=JSON.parse(fs.readFileSync('docs/architecture/v26-route-additions.json')).routes;
for(const row of additions){assert.equal(row.status,'nicht_abgenommen');assert.ok(fs.existsSync(row.source));assert.ok(fs.existsSync(row.authorization));assert.ok(row.states.includes('Fehler'));assert.ok(row.states.includes('Speichern/Reload/neue Sitzung'));assert.ok(!routes.routes.some(prior=>prior.file===row.file),'V26 supplement cannot override a V25 route');}
assert.equal(new Set([...routes.routes,...additions].map(row=>row.file)).size,routes.routes.length+additions.length);
assert.deepEqual([...routes.routes,...additions].map(x=>x.file).sort(),walk('app').filter(x=>x.endsWith('/page.tsx')).sort(),'Every actual route is accounted for');
for(const row of requirements.requirements){assert.ok(row.requirement);assert.ok(!/^\d+\.$/.test(row.requirement),'List numbering is not a separate acceptance requirement');assert.ok(row.status);assert.ok(['ungeprueft','teilweise_belegt','implementiert','nicht_implementiert','extern_blockiert'].includes(row.implementationStatus),'Unknown acceptance cannot silently mean missing implementation');assert.equal(row.acceptanceStatus,row.status,'Implementation finding and acceptance remain separate');if(row.status==='abgenommen'){assert.ok(row.test&&!/offen|pending/i.test(row.test));assert.ok(row.visualComparison&&!/offen|pending/i.test(row.visualComparison));}}
for(const row of routes.routes){assert.ok(row.roles.length);assert.ok(row.states.includes('Fehler'));assert.ok(row.states.includes('Speichern/Reload/neue Sitzung'));assert.ok(row.kpiAssessment);}
for(const route of ['/offline','/operator/login'])assert.equal(routes.routes.find(row=>row.route===route).surface,'public','Public error/login surfaces must not be misclassified as tenant-only');
assert.equal(routes.routes.find(row=>row.route==='/preview/dashboard').surface,'legacy_entry');
const expected=(route,role)=>routes.routes.find(row=>row.route===route).roleExpectations.find(row=>row.role===role);
assert.equal(expected('/kunden/neu','member').standard,'role_navigation_denied');assert.equal(expected('/kunden/neu','owner').standard,'role_navigation_allowed');
assert.equal(expected('/kunden','member').timeOnly,'role_navigation_denied');assert.equal(expected('/zeit','member').timeOnly,'role_navigation_allowed');
assert.ok(expected('/dashboard','member').purpose.includes('Arbeitszeit'),'Role-specific page purpose comes from the existing orientation owner');
assert.ok(routes.routes.find(row=>row.route==='/berichte').metricSources.some(metric=>metric.component==='MetricTile'));
assert.ok(routes.routes.find(row=>row.route==='/berichte').apiSources.some(source=>source.apis.some(api=>api.startsWith('/api/reports'))));
assert.ok(fs.readFileSync(root+'/route-role-kpi.csv','utf8').includes('Bedingte KPI/Charts im Code'),'KPI reachability cannot be mislabeled as visual acceptance');
assert.ok(routes.operatorVariants.some(row=>row.route==='/operator/tickets/[id]'));
const ticketVariant=routes.operatorVariants.find(row=>row.route==='/operator/tickets');assert.equal(ticketVariant.roleExpectations.find(row=>row.role==='platform_support').standard,'operator_navigation_allowed');assert.equal(ticketVariant.roleExpectations.find(row=>row.role==='platform_billing').standard,'operator_navigation_denied');
assert.ok(fs.readFileSync(root+'/route-role-states.csv','utf8').includes('/operator/kunden/[id]'),'Dynamic operator details cannot disappear behind one catch-all page entry');
console.log('Revision7 inventory: all56 chapters, every route, explicit roles/states and no unsupported completion claim passed.');
