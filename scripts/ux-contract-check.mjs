import fs from 'node:fs';
import assert from 'node:assert/strict';
import {inventory} from './ux-inventory.mjs';
import {styleBindingErrors,styleDescriptionErrors} from './ux-style-contract.mjs';
const contract=JSON.parse(fs.readFileSync('docs/audit/v24/ux-contract.json','utf8'));
const catalog=inventory();
const matrix=JSON.parse(fs.readFileSync('docs/audit/v24/page-matrix.json','utf8'));
assert.deepEqual(matrix.pages.map(p=>p.file).sort(),catalog.routes.map(p=>p.file).sort(),'Every source page needs an explicit UX assignment');
for(const page of matrix.pages){
 const actual=catalog.routes.find(r=>r.file===page.file);
 assert.equal(page.family,actual.family,`${page.file}: stale page type`);
 assert.deepEqual(page.components,actual.pageComponents,`${page.file}: stale component assignment`);
 assert.ok(page.status==='nicht geprüft'||page.evidence?.length,`${page.file}: acceptance requires evidence`);
}
assert.deepEqual(matrix.operatorVariants,catalog.operatorVariants,'Operator dispatch assignments must remain current');
assert.equal(new Set(contract.rules.map(r=>r.id)).size,contract.rules.length);
for(const rule of contract.rules){assert.ok(rule.scope&&rule.requirement&&rule.acceptance&&rule.owner&&rule.status);assert.ok(fs.existsSync(rule.owner.split('#')[0]),`${rule.id}: owner missing`);}
// Parse CSS rules, rather than matching source text: responsive focus overrides must
// not reintroduce the invalid-field precedence defect. Base owns control focus.
for(const rule of catalog.cssRules){
 if(/form-control|form-textarea/.test(rule.selector)&&/:focus/.test(rule.selector))
  assert.ok(!rule.declarations.some(d=>d.property.startsWith('outline')),`${rule.file}:${rule.line}: control focus belongs to foundation.css`);
}
assert.ok(Array.isArray(contract.styleBindings)&&contract.styleBindings.length>=18,'Required central bindings cannot be silently removed');
assert.equal(new Set(contract.styleBindings.map(b=>[b.file,b.context,b.selector,b.property].join('|'))).size,contract.styleBindings.length,'Style bindings must be unique');
for(const binding of contract.styleBindings)assert.ok(contract.rules.some(rule=>rule.id===binding.id),'Every style binding needs an acceptance rule');
assert.deepEqual(styleBindingErrors(catalog.cssRules,contract.styleBindings),[],'Central style bindings must match documented tokens');
assert.deepEqual(styleDescriptionErrors(contract.rules,contract.styleBindings),[],'Human acceptance text must not contradict executable style bindings');
const base=catalog.cssRules.filter(r=>r.file==='app/design-system/foundation.css');
assert.ok(base.some(r=>r.selector.includes('[aria-invalid="true"]')&&r.declarations.some(d=>d.property==='outline-color'&&d.value==='var(--status-danger-fg)')));
console.log(`UX contract: ${contract.rules.length} owners, ${matrix.pages.length} source pages; control focus ownership passed. Static coverage is not visual acceptance.`);
