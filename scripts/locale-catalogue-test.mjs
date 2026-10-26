import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {integrationGraph} from './foundation-integration-report.mjs';
import {localeTestModuleUrl} from './data-test-modules.mjs';
const require=createRequire(import.meta.url);
const compile=(file,deps={})=>{const exports={};Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(key=>Object.hasOwn(deps,key)?deps[key]:require(key),exports);return exports;};
execFileSync(process.execPath,['scripts/generate-locale-catalogues.mjs','--check']);
const config=compile('lib/locales/config.ts'),engine=compile('lib/locales/translator.ts',{'./config':config});
const old=await import(await localeTestModuleUrl());
const read=name=>JSON.parse(fs.readFileSync('lib/locales/'+name+'.json','utf8'));
const messages=read('messages'),periods=read('periods'),plurals=read('plurals'),templates=read('templates');
const catalogues=Object.fromEntries(config.locales.map(locale=>[locale,read('generated/'+locale)]));
for(const locale of config.locales){
 const translate=engine.createTranslator(locale,catalogues[locale]);
 const values=[...Object.keys(messages),...Object.keys(periods),...Object.keys(plurals).flatMap(noun=>[0,1,2,11,101].map(n=>n+' '+noun)),...Object.keys(templates).map(template=>template.replace(/\{(\d+)\}/g,(_,index)=>index==='2'?'Kunden':String(Number(index)+1))),'Acme AG','  entirely user-authored <script>  ','__proto__','constructor','1 __proto__','2 constructor','Rechnung RE-001','Kunden\n suchen...',...['Kunden','Prüfen','2 Mitarbeiter'].map(value=>' '+value+' ')];
 for(const value of values)assert.equal(translate(value),old.translateMessage(value,locale),locale+' parity: '+value);
 if(locale!=='de')assert.equal(catalogues[locale].messages.Kunden,messages.Kunden[{en:0,fr:1,it:2,tr:3}[locale]]);
 assert.ok(Object.values(catalogues[locale].messages).every(value=>typeof value==='string'),'Client catalogues contain scalar translations, never the full language array');
}

// Execute the real chunk loader: concurrency, initial-payload reuse and retry.
{
 let reads=0,fail=true;
 const dependencies={};
 Object.defineProperty(dependencies,'./generated/en.json',{get(){reads++;return catalogues.en}});
 Object.defineProperty(dependencies,'./generated/fr.json',{get(){reads++;if(fail)throw Error('chunk unavailable');return catalogues.fr}});
 const loader=compile('lib/locales/client-catalogue.ts',dependencies);
 const first=loader.loadLocaleCatalogue('en');assert.equal(loader.loadLocaleCatalogue('en'),first);assert.deepEqual(await first,catalogues.en);assert.equal(reads,1);
 await assert.rejects(loader.loadLocaleCatalogue('fr'),/chunk unavailable/);fail=false;assert.deepEqual(await loader.loadLocaleCatalogue('fr'),catalogues.fr);assert.equal(reads,3,'A failed chunk is retried, not cached forever');
 loader.rememberLocaleCatalogue('tr',catalogues.tr);assert.deepEqual(await loader.loadLocaleCatalogue('tr'),catalogues.tr);assert.equal(reads,3,'The initial RSC dictionary needs no duplicate chunk when switching back');
}

// Exercise the real provider through asynchronous choices and re-renders.
const saved={window:globalThis.window,document:globalThis.document,location:globalThis.location,history:globalThis.history,CustomEvent:globalThis.CustomEvent};
globalThis.document={cookie:'',documentElement:{lang:''}};globalThis.location={protocol:'https:',href:'https://fixture.invalid/kunden?q=alpha'};
const events=[],history=[];globalThis.window={dispatchEvent:event=>events.push(event.detail)};globalThis.history={state:{existing:true},replaceState:(state,_title,url)=>history.push({state,url:String(url)})};
globalThis.CustomEvent=class extends Event{constructor(type,options){super(type);this.detail=options.detail}};
let cursor=0,cells=[],effects=[],context;
const hooks={...React,createContext:initial=>({Provider:'Provider',value:initial}),useState(initial){const index=cursor++;if(!(index in cells))cells[index]=typeof initial==='function'?initial():initial;return [cells[index],value=>{cells[index]=typeof value==='function'?value(cells[index]):value}];},useRef(initial){const index=cursor++;return cells[index]??=({current:initial})},useEffect(effect){effects.push(effect)},useMemo:fn=>fn()};
const requests=[];
const {LocaleProvider}=compile('lib/client/locale.tsx',{react:hooks,'@/lib/locales/config':config,'@/lib/locales/translator':engine,'@/lib/locales/client-catalogue':{rememberLocaleCatalogue(){},loadLocaleCatalogue:locale=>new Promise((resolve,reject)=>requests.push({locale,resolve,reject}))},'@/lib/locales/generated/de.json':catalogues.de});
const render=()=>{cursor=0;context=LocaleProvider({initialLocale:'de',initialCatalogue:catalogues.de,children:'page'}).props.value;return context};
try{
 render();assert.equal(context.translate('Kunden'),'Kunden');assert.equal(requests.length,0,'Initial catalogue needs no client fetch');
 const french=context.choose('fr');assert.equal(render().locale,'de','Keep existing language while its replacement is pending');assert.equal(document.cookie,'','No cookie change before language data arrives');
 requests.shift().resolve(catalogues.fr);assert.equal(await french,true);assert.equal(render().locale,'fr');assert.equal(context.translate('Kunden'),'Clients');assert.match(document.cookie,/binso_locale=fr/);assert.match(history.at(-1).url,/q=alpha&lang=fr/);
 const italian=context.choose('it');requests.shift().reject(Error('offline'));assert.equal(await italian,false);assert.equal(render().locale,'fr');assert.ok(context.loadError);assert.equal(events.length,1,'A failed chunk cannot publish a successful locale change');
 const slow=context.choose('it'),fast=context.choose('tr');const first=requests.shift(),second=requests.shift();second.resolve(catalogues.tr);assert.equal(await fast,true);first.resolve(catalogues.it);assert.equal(await slow,false);assert.equal(render().locale,'tr','Late old choice cannot overwrite the newer language');
 assert.equal(context.translate('Kunden'),'Müşteriler');assert.equal(context.loadError,'');
 const count=requests.length;await context.choose('fr');assert.equal(requests.length,count,'Already selected languages are reused without another download');render();
 const pending=context.choose('en');const unmount=effects[0]();unmount();requests.shift().resolve(catalogues.en);assert.equal(await pending,false,'An unmounted provider cannot apply a completed request');
 assert.equal(context.locale,'fr');
}finally{Object.assign(globalThis,saved)}
// A delayed dictionary must not turn an old account's intent into a new
// account's persisted preference. Exercise the real preference hook.
{
 let revision='user-one',pendingCatalogue,reads=0;const writes=[],choices=[];
 let cursor=0,cells=[];
 const react={useState(initial){const index=cursor++;if(!(index in cells))cells[index]=initial;return [cells[index],value=>{cells[index]=value}]},useRef(initial){const index=cursor++;return cells[index]??=({current:initial})}};
 const {useLanguagePreference:preferenceHook}=compile('lib/client/use-language-preference.ts',{react,'@/lib/locales/config':config,'@/lib/locales/client-catalogue':{rememberLocaleCatalogue(){},loadLocaleCatalogue:()=>{reads++;return new Promise(resolve=>{pendingCatalogue=resolve})}},'./locale':{useLocale:()=>({locale:'de',loadError:'',choose:async value=>{choices.push(value);return true}})},'./language-preference':{persistLanguagePreference:async(value,scope)=>{writes.push({value,scope});return value}},'./data-events':{dataRevision:()=>revision}});
 const render=()=>{cursor=0;return preferenceHook('tenant')};
 let preference=render();const stale=preference.save('fr');await preference.save('it');assert.equal(reads,1,'A busy selection shares the single user intent');assert.equal(writes.length,0,'A language download completes before persistence');revision='user-two';pendingCatalogue(catalogues.fr);await stale;assert.equal(writes.length,0,'An account change during dictionary loading prevents the write');assert.equal(choices.length,0);assert.ok(render().error);
 preference=render();const retry=preference.save('fr');pendingCatalogue(catalogues.fr);await retry;assert.deepEqual(writes,[{value:'fr',scope:'tenant'}]);assert.deepEqual(choices,['fr']);assert.equal(render().busy,false);assert.equal(render().error,'');
}
// Prevent a client import from silently restoring the complete five-language
// catalogue. Include transitive imports from every real client entry point.
{
 const graph=integrationGraph(),modules=new Map(graph.modules.map(module=>[module.file,module]));
 const roots=graph.modules.filter(module=>/^['"]use client['"]/.test(fs.readFileSync(module.file,'utf8').trimStart()));
 const seen=new Set();
 const visit=file=>{
  if(seen.has(file))return;seen.add(file);
  assert.ok(!/^lib\/locales\/(index\.ts|(?:messages|periods|plurals|templates)\.json)$/.test(file),'Full server catalogue reached from a client entry: '+file);
  for(const dependency of modules.get(file)?.dependencies??[])if(dependency.kind!=='type'&&dependency.target)visit(dependency.target);
 };
 for(const root of roots)visit(root.file);
}
console.log('Selected catalogues: exact five-language server parity, first-render data, no mixed-language flash, offline retry, concurrent choice order, cache reuse and unmount isolation passed.');
