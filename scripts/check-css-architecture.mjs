import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {designManifest,designSources} from './design-system.mjs';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name).replaceAll('\\','/')]);
const entry='app/binso-ui.css';
assert.equal(new Set(designSources).size,designSources.length,'Every source has one manifest entry');
assert.deepEqual(walk('app').filter(f=>f.endsWith('.css')).sort(),[entry,...designSources].sort(),'Runtime CSS belongs to the manifest, never a page-local file');
const imports=[];postcss.parse(fs.readFileSync(entry,'utf8')).walkAtRules('import',rule=>imports.push('app/'+rule.params.replace(/^["']\.\//,'').replace(/["']$/,'')));
assert.deepEqual(imports,designSources,'The manifest owns exact import order');
const classes=new Set(),variables=new Set(),refs=new Set(),owners=new Map(),conflicts=[];let ruleCount=0;
for(const file of designSources){const css=postcss.parse(fs.readFileSync(file,'utf8'));
 css.walkDecls(d=>{assert.ok(!d.important,file+': !important hides ownership defects');if(d.prop.startsWith('--'))variables.add(d.prop);for(const m of d.value.matchAll(/var\((--[\w-]+)/g))refs.add(m[1]);
  if(!/\/(theme|navigation)\.css$/.test(file)){
   if(d.prop==='font-size'||d.prop==='border-radius')assert.ok(!/^\d+(?:\.\d+)?px$/.test(d.value),file+': typography and shape must consume theme roles');
   if(!d.value.includes('url('))assert.ok(!/#[a-f\d]{3,8}\b|rgba?\(/i.test(d.value),file+': colour literals belong to the central theme');
  }
 });
 css.walkRules(rule=>{ruleCount++;if(file.endsWith('/operator.css'))assert.ok(!rule.selector.includes('.page-container'),'Admin styles cannot override the customer workspace; shared components must use their own owner');if(rule.selector===':root')assert.ok(/\/(theme|navigation)\.css$/.test(file),file+': global tokens belong to theme or protected navigation');for(const m of rule.selector.matchAll(/\.([A-Za-z_][\w-]*)/g))classes.add(m[1]);
  let context='';for(let p=rule.parent;p&&p.type!=='root';p=p.parent)context=p.name+' '+p.params+'/'+context;
  if(file.endsWith('/navigation.css'))return;
  for(const selector of rule.selectors){const key=context+'|'+selector.trim();if(owners.has(key)&&owners.get(key)!==file)conflicts.push(key+': '+owners.get(key)+' / '+file);owners.set(key,file);}
 });
}
assert.deepEqual(conflicts,[],'Each selector/state has one source owner');
assert.deepEqual([...refs].filter(name=>!variables.has(name)),[],'Every dynamic or theme variable has an explicit default');
const ignored=new Set(['active','selected','full','large','narrow','clean','two','three','thirds','light','dark','system','mobile','support','customer','payment','security','audit','high']);
for(const file of [...walk('app'),...walk('components')].filter(f=>/\.tsx?$/.test(f))){const s=fs.readFileSync(file,'utf8');for(const match of s.matchAll(/className=(?:\{\`([^\`]+)\`\}|"([^"]+)"|'([^']+)')/g)){const raw=(match[1]||match[2]||match[3]||'').replace(/\$\{[^}]+\}/g,' ');for(const cls of raw.split(/\s+/))if(/^[A-Za-z][\w-]*$/.test(cls)&&!cls.endsWith('-')&&!ignored.has(cls))assert.ok(classes.has(cls),file+': missing CSS owner for '+cls);}}
assert.ok(designManifest.policy.derivedViewsRequireReview,'Derived screens need a separate review');
console.log(`Reference design system: ${designSources.length} named owners, ${ruleCount} rules, full CSS/class/token coverage; no legacy file-count constraint.`);
