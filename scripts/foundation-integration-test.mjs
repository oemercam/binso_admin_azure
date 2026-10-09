import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {integrationGraph} from './foundation-integration-report.mjs';
import {inventory} from './ux-inventory.mjs';
const graph=integrationGraph(),catalog=inventory();
assert.deepEqual(graph.staticRuntimeCycles,[],'New local runtime import cycles require correction before release.');
assert.ok(!fs.existsSync('components/app-pages.tsx'));
for(const entry of graph.modules)for(const dependency of entry.dependencies){
 assert.ok(!/(?:^|\/)app-pages$/.test(dependency.specifier),'Retired runtime barrel cannot return through imports or re-exports.');
}
assert.equal(new Set(catalog.routes.map(r=>r.route)).size,catalog.routes.length,'Each page route has one source owner.');
const stored=JSON.parse(fs.readFileSync('docs/architecture/v21-5-integration-inventory.json','utf8'));
assert.equal(stored.sourceFingerprint,createHash('sha256').update(graph.modules.map(m=>m.file+'\n'+fs.readFileSync(m.file,'utf8')).join('\n')).digest('hex'),'Source fingerprint must match the current dependency inventory.');
assert.deepEqual(stored.routes.map(r=>[r.route,r.source,r.family]),catalog.routes.map(r=>[r.route,r.file,r.family]),'Every current source page must appear in the integration matrix.');
console.log('Integration architecture: no local runtime-import cycles, retired barrel protection and complete current route matrix passed.');
