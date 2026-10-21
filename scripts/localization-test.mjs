import fs from 'node:fs';
import assert from 'node:assert/strict';
import {matchesLocalizedRoute} from './localized-route-contract.mjs';
for(const locale of ['de','fr','it','en']){
 const target='https://fixture.invalid/kunden?page=2';
 for(const actual of [target,target+'&lang='+locale])assert.equal(matchesLocalizedRoute(actual,target,locale),true);
 for(const actual of ['https://foreign.invalid/kunden?page=2','https://fixture.invalid/kunden/other?page=2',target+'&extra=1',target+'&lang='+(locale==='en'?'fr':'en'),target+'&lang=tr',target+'&lang='+locale+'&lang='+locale,target+'#other','https://fixture.invalid/kunden?page=1'])assert.equal(matchesLocalizedRoute(actual,target,locale),false,'Language reflection must not hide a different route/query: '+actual);
}
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const messages=JSON.parse(fs.readFileSync('lib/locales/messages.json','utf8'));
const templates=JSON.parse(fs.readFileSync('lib/locales/templates.json','utf8'));
for(const [key,values] of Object.entries({...messages,...templates})){
 assert.equal(values.length,3,'EN/FR/IT required: '+key);
 for(const value of values)assert.ok(typeof value==='string'&&value.trim(),key);
 const tokens=value=>[...value.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort();
 if(templates[key])for(const value of values)assert.deepEqual(tokens(value),tokens(key),'Template values must survive translation');
}
function compile(file,deps={}){
 const output={};
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 Function('require','exports',source)(name=>Object.hasOwn(deps,name)?deps[name]:require(name),output);return output;
}
const config=compile('lib/locales/config.ts');
const locale=compile('lib/locales/index.ts',{'./config':config,'./messages.json':messages,'./templates.json':templates,'./plurals.json':JSON.parse(fs.readFileSync('lib/locales/plurals.json','utf8'))});
assert.deepEqual(config.locales,['de','fr','it','en']);
for(const [input,expected] of [['FR-ch','fr'],['it-CH','it'],['en','en'],['de-CH','de'],['<script>alert(1)</script>','de'],['en<script>','de'],['constructor','de'],[null,'de'],[{},'de']])assert.equal(config.asLocale(input),expected,'Only canonical literal locales may leave the boundary');
for(const [language,label] of [['de','Rechnungen'],['fr','Factures'],['it','Fatture'],['en','Invoices']]){
 assert.equal(locale.translateMessage('Rechnungen',language),label);
 assert.equal(locale.translateMessage('Acme AG',language),'Acme AG');
 assert.equal(locale.translateMessage('  entirely user-authored <script>  ',language),'  entirely user-authored <script>  ');
}
assert.equal(locale.translateMessage('1 Kunden','de'),'1 Kunde');assert.equal(locale.translateMessage('1 Kunden','en'),'1 customer');assert.equal(locale.translateMessage('2 Mitarbeiter','en'),'2 employees');assert.equal(locale.translateMessage('0 Kunden','fr'),'0 client');assert.equal(locale.translateMessage('2 Projekte','it'),'2 progetti');
assert.equal(locale.translateMessage('Seite 2 von 4','fr'),'Page 2 sur 4');
assert.equal(locale.translateMessage('Schritt 1 von 3 · Prüfen','it'),'Passaggio 1 di 3 · Verifica');
assert.equal(locale.translateMessage('Die Datei darf höchstens 10 MB gross sein.','en'),'The file must not exceed 10 MB.');
const client=compile('lib/client/locale.tsx',{'@/lib/locales':locale});
// Render the actual settings and shared switch, not a duplicated label template.
const uiAst=ts.createSourceFile('ui.tsx',fs.readFileSync('components/ui.tsx','utf8'),99,true,4),toggleExports={};
const toggleSource=uiAst.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='Toggle').getText(uiAst);
Function('require','exports','LocalizedElement',ts.transpileModule(toggleSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,toggleExports,client.LocalizedElement);
const settingsAst=ts.createSourceFile('settings.tsx',fs.readFileSync('components/pages/settings.tsx','utf8'),99,true,4),notificationExports={};
const notificationSource=settingsAst.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='NotificationSettingsPage').getText(settingsAst);
const wrapper=({children})=>React.createElement('div',null,children);
Function('require','exports','useId','useRef','useState','useEffect','AppShell','ErrorState','LoadingState','SettingsGroup','LocalizedText','Toggle','notificationChannels',ts.transpileModule(notificationSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,notificationExports,React.useId,React.useRef,React.useState,React.useEffect,wrapper,wrapper,wrapper,wrapper,client.LocalizedText,toggleExports.Toggle,{email:true,push:false});
for(const language of config.locales){
 const markup=renderToStaticMarkup(React.createElement(client.LocaleProvider,{initialLocale:language},React.createElement(notificationExports.NotificationSettingsPage)));
 const labels=new Map([...markup.matchAll(/<(?:b|span) id="([^"]+)">([^<]+)<\/(?:b|span)>/g)].map(match=>[match[1],match[2]]));
 const switches=[...markup.matchAll(/<button[^>]*role="switch"[^>]*>/g)];assert.equal(switches.length,5);
 const names=switches.map(([tag])=>{assert.doesNotMatch(tag,/aria-label=/,'Do not shadow translated visible labels with a concatenated German name');const ids=tag.match(/aria-labelledby="([^"]+)"/)[1].split(' ');assert.equal(ids.length,2);return ids.map(id=>{assert.ok(labels.has(id),'Every naming reference exists in the actual page');return labels.get(id)}).join(' ')});
 assert.equal(names[0],locale.translateMessage('E-Mail',language)+' '+locale.translateMessage('Rechnungen',language));
 assert.equal(new Set(names).size,5,'Every preference has a unique channel and topic');
}
for(const checked of [false,true]){
 const markup=renderToStaticMarkup(React.createElement(toggleExports.Toggle,{checked,label:'Fallback',busy:true}));
 assert.match(markup,new RegExp('aria-checked="'+checked+'"'));assert.match(markup,/aria-busy="true"/);assert.match(markup,/disabled=""/);assert.match(markup,/type="button"/);assert.match(markup,/aria-label="Fallback"/);
}
const uxAst=ts.createSourceFile('binso-ux.tsx',fs.readFileSync('components/binso-ux.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const metricDeclaration=uxAst.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='MetricTile').getText(uxAst),metricExports={};
Function('require','exports','useLocale','localeTags','Metric',ts.transpileModule(metricDeclaration,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,metricExports,client.useLocale,config.localeTags,({value})=>React.createElement('div',null,value));
for(const language of config.locales){const markup=renderToStaticMarkup(React.createElement(client.LocaleProvider,{initialLocale:language},React.createElement(metricExports.MetricTile,{label:'Fixture',value:1234.5,currency:'CHF'})));assert.ok(markup.replaceAll('&#x27;',"'").includes(new Intl.NumberFormat(config.localeTags[language],{minimumFractionDigits:2,maximumFractionDigits:2}).format(1234.5)),'Shared KPI follows the active locale: '+language+' '+markup);}
const element=React.createElement;
for(const [language,label] of [['fr','Factures'],['it','Fatture'],['en','Invoices']]){
 const markup=renderToStaticMarkup(element(client.LocaleProvider,{initialLocale:language},element('main',null,element(client.LocalizedText,null,'Rechnungen'),element(client.LocalizedElement,{as:'input',placeholder:'Kunden suchen...',value:'Rechnungen',readOnly:true}),element('p',null,'Rechnungen'))));
 assert.ok(markup.includes(label),'Server rendering uses the requested locale');
 assert.ok(markup.includes('value="Rechnungen"'),'Controlled record values must never be translated');
 assert.ok(markup.includes('<p>Rechnungen</p>'),'Unmarked user text remains unchanged');
 assert.ok(!markup.includes('placeholder="Kunden suchen..."'),'Accessible native attributes are translated');
}
for(const language of config.locales){
 const id='6f81c519-5073-4f33-8b45-90bc4ad6157c',message='Die Anfrage konnte nicht verarbeitet werden.';
 const markup=renderToStaticMarkup(element(client.LocaleProvider,{initialLocale:language},element(client.LocalizedText,null,message+' · #'+id)));
 assert.ok(markup.includes(locale.translateMessage(message,language)),'Error copy remains localized with reference '+language);
 assert.ok(markup.includes(locale.translateMessage('Referenz',language)+': '+id),'Support reference remains exact and separately labeled '+language);
 const userMarkup=renderToStaticMarkup(element(client.LocaleProvider,{initialLocale:language},element(client.LocalizedText,{verbatim:true},message+' · #'+id)));
 assert.equal(userMarkup,message+' · #'+id,'Verbatim user content never gains application-error semantics');
}console.log('Locale catalogues: complete EN/FR/IT tuples, preserved template tokens, server-rendered language, native attributes and unchanged user data passed.');
// Exercise the real recovery handler with isolated token/mail delivery adapters.
{
 let user={id:'fixture',language:'de'},sent=null,failMail=false;
 const recovery=compile('app/api/auth/recover/route.ts',{
  '@/lib/locales':locale,
  '@/lib/server/http':{apiError:()=>Response.json({error:'internal'},{status:500}),assertSameOrigin:()=>{},cleanText:value=>typeof value==='string'?value.trim():'',json:data=>Response.json(data),readJson:request=>request.json(),validEmail:value=>value.includes('@')},
  '@/lib/server/rate-limit':{enforceRateLimit:async()=>{}},'@/lib/server/db':{query:async()=>({rows:user?[user]:[]})},
  '@/lib/server/auth-tokens':{createAuthToken:async()=> 'synthetic-recovery-token'},
  '@/lib/server/email':{sendMail:async mail=>{sent=mail;if(failMail)throw Error('synthetic delivery failure')},mailLayout:(title,body,cta,language)=>{assert.equal(language,user.language);return title+body+cta.url}},
  '@/lib/server/env':{env:{appUrl:'https://fixture.invalid'}},'@/config/domain':{domainConfig:{passwordResetMinutes:30}}
 });
 const request=()=>new Request('https://fixture.invalid/api/auth/recover',{method:'POST',body:JSON.stringify({email:'fixture@example.invalid'})});
 let expected;
 for(const language of config.locales){user={id:'fixture',language};sent=null;const response=await recovery.POST(request());assert.equal(response.status,200);expected=await response.json();assert.equal(sent.subject,locale.translateMessage('Passwort für Binso One zurücksetzen',language));assert.ok(sent.html.includes('&lang='+language));}
 user=null;sent=null;assert.deepEqual(await (await recovery.POST(request())).json(),expected);assert.equal(sent,null);
 user={id:'fixture',language:'fr'};failMail=true;assert.deepEqual(await (await recovery.POST(request())).json(),expected,'Unknown account and failed delivery retain the same public response');
 console.log('Password recovery: translated mail/link locale and uniform unknown-account/delivery-failure response passed.');
}
// Exercise the actual shared row and heading renderers with colliding user copy.
{
 const source=fs.readFileSync('components/binso-ux.tsx','utf8'),ast=ts.createSourceFile('ux.tsx',source,99,true,4);
 const declarations=['ListRow','PageHeading','ActionRow'].map(name=>ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name).getText(ast)).join('\n');
 const exports={};const compiled=ts.transpileModule(declarations,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 Function('exports','require','LocalizedText','Link','Status','Icon','usePageAccess',compiled)(exports,require,client.LocalizedText,({children})=>children,({children})=>children,()=>null,()=>({write:true,canOpen:()=>true}));
 const html=renderToStaticMarkup(element(client.LocaleProvider,{initialLocale:'fr'},element('main',null,element(exports.ListRow,{title:'Rechnungen',meta:'Customer-entered title',translateTitle:false}),element(exports.PageHeading,{title:'Rechnungen',verbatimTitle:true}),element(exports.ActionRow,{title:'Rechnungen',icon:'file'}))));
 assert.equal((html.match(/Rechnungen/g)??[]).length,2,'User-authored list/heading titles stay verbatim even if they equal application copy');assert.ok(html.includes('Factures'),'Plain menu rows translate their UI labels');
 assert.equal(locale.translateMessage('Rechnung RE-001','en'),'Invoice RE-001');
 console.log('Shared rows/headings preserve colliding user titles while menu labels and document prefixes translate.');
 const recordsSource=fs.readFileSync('components/records.tsx','utf8'),recordsAst=ts.createSourceFile('records.tsx',recordsSource,99,true,4);
 const groupSource=recordsAst.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='TimeEntryGroup').getText(recordsAst),groupExports={};
 Function('exports','require','LocalizedText','Icon',ts.transpileModule(groupSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(groupExports,require,client.LocalizedText,()=>null);
 const groupHtml=props=>renderToStaticMarkup(element(client.LocaleProvider,{initialLocale:'fr'},element(groupExports.TimeEntryGroup,{title:'Rechnungen',subtitle:'Rechnungen',value:'2:15',...props})));
 assert.equal((groupHtml({titleVerbatim:true,subtitleVerbatim:true}).match(/Rechnungen/g)??[]).length,2,'Customer and project names remain verbatim even when they equal UI copy');
 assert.equal((groupHtml({}).match(/Factures/g)??[]).length,2,'Group UI fallback labels continue to translate');
}

{
 const metadata=compile('lib/server/locale.ts',{'server-only':{},'next/headers':{cookies:async()=>({get:()=>({value:'fr'})})},'@/lib/locales':locale});
 const value=await metadata.localizeMetadata({title:'Rechnungen',openGraph:{title:'Rechnungen'},twitter:{title:'Rechnungen'}},'/preise');
 assert.equal(value.title,'Factures');assert.equal(value.openGraph.images[0].url,'/opengraph-image?lang=fr');assert.equal(value.twitter.images[0],'/opengraph-image?lang=fr');assert.equal(value.alternates.canonical,'/preise?lang=fr');
 console.log('Localized metadata binds canonical alternatives and social-image URLs to the selected language.');
}

// Render actual legal documents with the shared owner: anchors cannot change
// by UI language, existing deep links and the untouched document text survive.
{
 const legal=compile('components/legal-page.tsx',{'@/lib/client/locale':client,'next/link':({children,...props})=>element('a',props,children),'@/components/marketing':{MarketingHeader:()=>null,MarketingFooter:()=>null}});
 const legalConfig=compile('config/legal.ts');
 for(const file of ['impressum','datenschutz','agb','auftragsbearbeitung','unterauftragsbearbeiter']){
  const page=compile('app/'+file+'/page.tsx',{'@/lib/client/locale':client,'@/components/legal-page':legal,'@/config/legal':legalConfig,'next/link':({children,...props})=>element('a',props,children)}).default;
  let baseline;
  for(const language of ['de','fr','it','en']){
   const markup=renderToStaticMarkup(element(client.LocaleProvider,{initialLocale:language},element(page)));
   const ids=[...markup.matchAll(/<section[^>]* id="([^"]+)"/g)].map(match=>match[1]);assert.ok(ids.length>=2);assert.equal(new Set(ids).size,ids.length,'No duplicate legal anchors');
   if(baseline)assert.deepEqual(ids,baseline,'Section URLs stay stable across UI languages');else baseline=ids;
   for(const [,id] of markup.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),'Every table-of-contents link has a real section');
   if(file==='impressum')assert.ok(ids.includes('kontakt'),'Existing contact deep link preserved');
   if(ids.length>=5){assert.ok(markup.includes('<details class="legal-toc">'));assert.ok(markup.includes(locale.translateMessage('Inhaltsverzeichnis',language)));}
   else assert.ok(!markup.includes('class="legal-toc"'),'Short documents need no redundant contents control');
   assert.ok(markup.includes('5. Oktober 2026'),'Legal version date is not silently rewritten');
  }
 }
 console.log('Actual legal documents: stable unique TOC anchors, preserved contact deep link, translated control labels, short-document omission and unchanged version dates passed. Legal language/substance approval remains separate.');
}
