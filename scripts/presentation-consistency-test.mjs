import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseCss,pruneSuperseded,supersededDeclarations} from './presentation-cascade.mjs';
import {redundantDeclarations} from './css-contract.mjs';

const prune=css=>{const root=parseCss(css);return {removed:pruneSuperseded(root),css:root.toString()};};
const positive=prune('.label{color:red;padding:4px}.other{color:green}.label{color:blue}');
assert.equal(positive.removed.length,1);
assert.equal(positive.css,'.label{padding:4px}.other{color:green}.label{color:blue}');
assert.equal(prune('@media(max-width:760px){.label{color:red}.label{color:blue}}').removed.length,1);
for(const css of [
 '.label{height:100vh}.label{height:100dvh}',
 '.label{color:red}.label{color:color-mix(in srgb,red,blue)}',
 '.label{color:red}.label{color:rgb(0,0,0);color:var(--label)}',
 '.label{color:red!important}.label{color:blue}',
 '.label{color:red}@media(max-width:760px){.label{color:blue}}',
 '@media(max-width:760px){.label{color:red}}@media(max-width:390px){.label{color:blue}}',
 '.label,.other{color:red}.label{color:blue}',
 '.label{color:red}.container .label{color:blue}',
 '@layer{.label{color:red}}@layer{.label{color:blue}}',
 '@keyframes pulse{from{opacity:0}to{opacity:1}}',
 '.label{&:hover{color:red}&:hover{color:blue}}',
])assert.equal(prune(css).removed.length,0,'Keep fallbacks, specificity, priority, conditions, anonymous layers and keyframes: '+css);
assert.equal(redundantDeclarations(parseCss('.mobile-header{height:44px}.mobile-header{height:44px}')).length,1,'Headers are no longer excluded from duplicate detection');
const manifest=JSON.parse(fs.readFileSync('app/design-system/manifest.json','utf8'));
for(const {path} of manifest.sources){
 const source=fs.readFileSync(path,'utf8'),root=parseCss(source);
 assert.equal(supersededDeclarations(root).length,0,path+' has no provably dominated earlier declarations');
 assert.doesNotMatch(source,/--glass-(?:bg|line|blur)\b/,'Retired generic glass tokens stay removed');
}
console.log('Presentation cascade: safe pruning, preserved progressive fallbacks/conditions and all current CSS owners passed.');
