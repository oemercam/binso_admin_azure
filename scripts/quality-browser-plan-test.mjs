import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {browserLanes} from './quality-browser-plan.mjs';
import {planChanges} from './qa-plan.mjs';
import {partition} from './browser-shards.mjs';

for(const level of ['standard','full']){
 const plan=planChanges(['components/product-form.tsx'],{level});
 const lanes=browserLanes(plan);
 for(const engine of ['chromium','webkit']){
  const responsive=lanes.filter(l=>l.engine===engine&&l.lane==='responsive');
  const routes=engine==='webkit'?plan.webkitRoutes:plan.routes;
  const widthCount=(engine==='webkit'?plan.webkitWidths:plan.widths).length;
  assert.equal(lanes.filter(l=>l.engine===engine&&l.lane==='functional').length,1);
  const cases=responsive.flatMap(l=>partition(routes,l.shards)[l.shard]);
  assert.deepEqual([...cases].sort(),[...routes].sort());
  assert.equal(new Set(cases).size,routes.length);
  assert.equal(cases.length*widthCount*plan.themes.length,routes.length*widthCount*plan.themes.length);
  assert.deepEqual(responsive.flatMap(l=>partition(plan.interactions,l.shards)[l.shard]).sort(),[...plan.interactions].sort());
 }
}
assert.deepEqual(browserLanes(planChanges(['docs/readme.md'])),[]);
for(const file of ['components/app-shell.tsx','app/design-system/theme.css','lib/client/backend.ts'])assert.equal(planChanges([file]).level,'full',file);
const workflow=fs.readFileSync('.github/workflows/quality.yml','utf8');
assert(workflow.includes('include: ${{ fromJSON(needs.plan.outputs.browser_matrix) }}'));
assert(workflow.includes('needs: [plan, checks, build, browser, ux-compliance, scanner-engine]'));
assert(workflow.includes('ux-browser-${{ matrix.engine }}-${{ matrix.lane }}-${{ matrix.shard }}-${{ github.sha }}'));
for(const gate of ['pnpm lint','pnpm typecheck','pnpm build','pnpm security:scan','pnpm security:scan:all','scanner-engine-test.mjs','api-tenant-postgres-test.mjs'])assert(workflow.includes(gate),gate);
// Parse the actual workflow: a missing lane condition multiplies slow suites across
// every responsive runner while appearing harmless in a route partition test.
const require=createRequire(import.meta.url);
const yaml=createRequire(require.resolve('eslint'))('js-yaml');
const config=yaml.load(workflow);
for(const step of config.jobs.browser.steps.filter(s=>/node scripts\/|pnpm ux:lab/.test(s.run??''))){
 const owner=step.run==='node scripts/browser-shards.mjs'?'responsive':'functional';
 assert(step.if?.includes(`matrix.lane == '${owner}'`),'One owning lane for '+step.name);
}
assert.equal(config.concurrency['cancel-in-progress'],"${{ github.event_name == 'pull_request' }}",'Main pushes cannot cancel explicit release qualification');
assert(!config.concurrency.group.includes('github.event_name'),'Main push/manual checks share their ref/profile queue');
console.log('Full/smoke browser lanes preserve unique route-width-theme and interaction coverage and mandatory gates.');
