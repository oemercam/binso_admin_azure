import fs from 'node:fs';
import assert from 'node:assert/strict';
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
const element=React.createElement;
for(const [language,label] of [['fr','Factures'],['it','Fatture'],['en','Invoices']]){
 const markup=renderToStaticMarkup(element(client.LocaleProvider,{initialLocale:language},element('main',null,element(client.LocalizedText,null,'Rechnungen'),element(client.LocalizedElement,{as:'input',placeholder:'Kunden suchen...',value:'Rechnungen',readOnly:true}),element('p',null,'Rechnungen'))));
 assert.ok(markup.includes(label),'Server rendering uses the requested locale');
 assert.ok(markup.includes('value="Rechnungen"'),'Controlled record values must never be translated');
 assert.ok(markup.includes('<p>Rechnungen</p>'),'Unmarked user text remains unchanged');
 assert.ok(!markup.includes('placeholder="Kunden suchen..."'),'Accessible native attributes are translated');
}
console.log('Locale catalogues: complete EN/FR/IT tuples, preserved template tokens, server-rendered language, native attributes and unchanged user data passed.');
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
