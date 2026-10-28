import fs from 'node:fs';
import assert from 'node:assert/strict';
import {matchesLocalizedRoute} from './localized-route-contract.mjs';
import {translationCoverage} from './full-app-audit-report.mjs';
assert.equal(translationCoverage({messages:{Beispiel:['English','Français','Italiano']}}).tr.complete,false,'Three existing translations never qualify Turkish');
assert.equal(translationCoverage({messages:{Beispiel:['English','Français','Italiano','Türkçe']},plurals:{Zeilen:{tr:{one:'satır',other:'satır'}}}}).tr.complete,true,'Actual Turkish text and plural forms qualify catalogue availability only');
for(const locale of ['de','fr','it','en','tr']){
 const target='https://fixture.invalid/kunden?page=2';
 for(const actual of [target,target+'&lang='+locale])assert.equal(matchesLocalizedRoute(actual,target,locale),true);
 for(const actual of ['https://foreign.invalid/kunden?page=2','https://fixture.invalid/kunden/other?page=2',target+'&extra=1',target+'&lang='+(locale==='en'?'fr':'en'),target+'&lang=ja',target+'&lang='+locale+'&lang='+locale,target+'#other','https://fixture.invalid/kunden?page=1'])assert.equal(matchesLocalizedRoute(actual,target,locale),false,'Language reflection must not hide a different route/query: '+actual);
}
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const messages=JSON.parse(fs.readFileSync('lib/locales/messages.json','utf8'));
const templates=JSON.parse(fs.readFileSync('lib/locales/templates.json','utf8'));
for(const [key,values] of Object.entries({...messages,...templates})){
 assert.ok(values.length===4,'EN/FR/IT/TR are required: '+key);
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
const locale=compile('lib/locales/index.ts',{'./config':config,'./periods.json':JSON.parse(fs.readFileSync('lib/locales/periods.json','utf8')),'./messages.json':messages,'./templates.json':templates,'./plurals.json':JSON.parse(fs.readFileSync('lib/locales/plurals.json','utf8'))});
for(const [key,forms] of Object.entries(JSON.parse(fs.readFileSync('lib/locales/plurals.json','utf8'))))for(const language of config.locales){assert.ok(forms[language]?.one?.trim(),'Singular required: '+language+': '+key);assert.ok(forms[language]?.other?.trim(),'Plural required: '+language+': '+key);}
assert.equal(locale.translateMessage('2 Kunden','tr'),'2 müşteri','Turkish counted nouns stay singular');
assert.equal(locale.translateMessage('Seite 2 von 3','tr'),'Sayfa 2 / 3');
assert.equal(locale.translateMessage('Schritt 2 von 3 · Kunden','tr'),'Adım 2 / 3 · Müşteriler','Dynamic step label translates without changing step numbers');
assert.equal(locale.translateMessage('Umsatz 2026','tr'),'2026 cirosu');
assert.equal(locale.translateMessage('Der Auftraglimit deines aktuellen Plans ist erreicht.','de'),'Das Auftragslimit deines aktuellen Plans ist erreicht.','German corrections preserve source lookup keys');
for(const [language,expected] of [['de','Umsatz 2026'],['en','Revenue 2026'],['fr','Chiffre d’affaires 2026'],['it','Ricavi 2026']])assert.equal(locale.translateMessage('Umsatz 2026',language),expected,'Customer revenue headers translate the label while preserving the actual business year');
assert.deepEqual(config.locales,['de','fr','it','en','tr']);
assert.equal(locale.translateMessage('Individueller Zeitraum','tr'),'Özel dönem');
assert.equal(config.asLocale('tr-TR'),'tr');
for(const [key,expected]of [['Kunden','Müşteriler'],['Zurückgewiesen','Düzeltme için geri gönderildi'],['Verwerfen','Sil'],['Authenticator-Pflicht','Doğrulayıcı zorunluluğu']])assert.equal(locale.translateMessage(key,'tr'),expected,'Actual Turkish app translation, never accidental Italian fallback');
assert.equal(locale.translateMessage('Acme AG','tr'),'Acme AG','Unrecognized user content stays verbatim');
const financialDates=compile('lib/financial-status.ts',{'./money':compile('lib/money.ts')});
for(const [language,expected] of Object.entries({de:'02.01.2026',fr:'02.01.2026',it:'02.01.2026',en:'02.01.2026'}))assert.equal(financialDates.formatDate('2026-01-02',config.localeTags[language]),expected,'Civil document dates use the chosen Swiss language without timezone day shifts');
assert.equal(financialDates.formatDate('2026-01-02','en-US'),'01/02/2026','Explicit locale is honored rather than ignored');
assert.equal(financialDates.formatDate('2026-01-02'),'02.01.2026','Existing default Swiss date presentation remains compatible');
const timestampDates=compile('lib/display-format.ts',{'./financial-status':financialDates});
const sharedRows=compile('components/pages/shared.tsx',{'@/lib/financial-status':financialDates,'@/lib/display-format':timestampDates,'@/lib/client/use-api-query':{},'@/lib/client/locale':{},'@/lib/locales/config':config,'@/lib/client/backend':{},'../records':{}});
const productFixture={id:'fixture-product',name:'Stück',kind:'product',unit:'hour',unit_price:'1234.50',status:'active'},productBefore=structuredClone(productFixture);
for(const [language,unit] of [['de','Std.'],['en','hr'],['fr','h'],['it','ore']]){
 const tag=config.localeTags[language],translate=value=>locale.translateMessage(value,language),options={locale:tag,translateUnit:translate};
 const row=sharedRows.mapRemoteRows('products',[productFixture],options)[0];
 assert.equal(row[0],'Stück','Actual product names remain verbatim even when matching a catalogue key');
 assert.equal(row[1],translate('Produkt'),'Data-driven product types use the selected language');
 const payment=sharedRows.mapRemoteRows('payments',[{id:'payment',paid_on:'2026-01-02',customer:{name:'Kunde'},method:'bank',amount:1,status:'booked'}],options)[0];
 assert.equal(payment[2],'Kunde','Actual customer name is preserved even when it matches a UI label');assert.equal(payment[3],translate('Banküberweisung'),'Payment method is translated before joining user-authored references');
 assert.equal(sharedRows.swissDate('2026-01-02',tag),financialDates.formatDate('2026-01-02',tag));
 assert.equal(row[2],'CHF '+Number(productFixture.unit_price).toLocaleString(tag,{minimumFractionDigits:2,maximumFractionDigits:2})+' / '+unit,'Actual remote rows use locale numbers and translated standard units');
 assert.equal(sharedRows.mapRemoteRows('employees',[{id:'fixture-employee',first_name:'Tag',last_name:'Jahr',workload_percent:'83.75'}],options)[0][2],Number('83.75').toLocaleString(tag)+' %');
 assert.equal(timestampDates.withPriceUnit('CHF 10','Stück',translate),'CHF 10 / Stück','Custom units remain user content even when they collide with a translated label');
 assert.equal(timestampDates.withPriceUnit('CHF 10','constructor',translate),'CHF 10 / constructor','Prototype property names cannot resolve to unit labels');
 const financials=sharedRows.mapRemoteRows('customers',[{id:'fixture-customer',name:'Kunde',financials:[]}],options)[0];assert.equal(financials[0],'Kunde');assert.equal(financials[6],'—','Missing financial permission/data cannot become a synthetic zero');
 assert.deepEqual([translate('h/Woche'),translate('Tage/Jahr')],{de:['h/Woche','Tage/Jahr'],en:['h/week','days/year'],fr:['h/semaine','jours/an'],it:['h/settimana','giorni/anno']}[language],'Employment unit labels are translated separately from numeric/user content');
}
assert.deepEqual(productFixture,productBefore,'Localized presentation never rewrites source prices, units or names');
assert.equal(timestampDates.formatQuantity('1234.5','%','en-US'),'1,234.5 %','Explicit numeric locale is honored');
assert.equal(timestampDates.formatTimestampDate('2026-10-25T23:30:00Z'),'26.10.2026','Reimbursement instants use the actual Swiss business day, including DST boundaries');
assert.equal(financialDates.formatDate('2026-10-25'),'25.10.2026','Civil invoice/expense dates are not shifted as timestamps');
assert.equal(timestampDates.formatTimestampDate('invalid'),'','Invalid timestamps cannot crash a localized detail page');
for(const value of [null,'','invalid','2026-02-30','2026-13-01'])assert.equal(financialDates.formatDate(value),'','Invalid calendar values are never rolled into another month');
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
const translator=compile('lib/locales/translator.ts',{'./config':config});
const catalogues=Object.fromEntries(config.locales.map(language=>[language,JSON.parse(fs.readFileSync('lib/locales/generated/'+language+'.json','utf8'))]));
const actualClient=compile('lib/client/locale.tsx',{'@/lib/locales/config':config,'@/lib/locales/translator':translator,'@/lib/locales/client-catalogue':{rememberLocaleCatalogue(){},loadLocaleCatalogue:async language=>catalogues[language]},'@/lib/locales/generated/de.json':catalogues.de});
const client={...actualClient,LocaleProvider:({initialLocale,...props})=>React.createElement(actualClient.LocaleProvider,{initialLocale,initialCatalogue:catalogues[initialLocale],...props})};
// Execute the actual invoice readiness notice, including its real locale context.
{
 const source=fs.readFileSync('components/documents.tsx','utf8'),ast=ts.createSourceFile('documents.tsx',source,99,true,4),notices=[];
 const visit=node=>{if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='span'&&node.getText(ast).includes('{paymentIssue}'))notices.push(node);ts.forEachChild(node,visit);};visit(ast);
 assert.equal(notices.length,1,'Exactly one actual readiness warning span');
 const exports={},code=ts.transpileModule('export function ActualReadinessNotice({paymentIssue}){return '+notices[0].getText(ast)+';}',{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 Function('require','exports','LocalizedText',code)(require,exports,client.LocalizedText);
 const qr=compile('lib/qr-bill.ts',{'swissqrbill/utils':await import('swissqrbill/utils')});
 const company={name:'Synthetic Issuer',street:'Teststrasse',postal_code:'3000',city:'Bern'},before=structuredClone(company),issue=qr.invoicePaymentIssue(company);
 assert.equal(issue,'Bitte zuerst die IBAN deiner Firma unter Einstellungen → Dokumente erfassen.');
 for(const language of config.locales){
  const actual=renderToStaticMarkup(React.createElement(client.LocaleProvider,{initialLocale:language},React.createElement(exports.ActualReadinessNotice,{paymentIssue:issue})));
  const expected=renderToStaticMarkup(React.createElement('span',null,locale.translateMessage(issue,language)));
  assert.equal(actual,expected,'Invoice readiness notice uses the selected language: '+language);
  if(language!=='de')assert.notEqual(actual,renderToStaticMarkup(React.createElement('span',null,issue)),'Non-German warning is actually translated');
 }
 assert.deepEqual(company,before,'Presentation never modifies issuer/payment prerequisites');
}

for(const [language,confirmation,approval] of [
 ['en','Please confirm this security-sensitive action again.','You cannot approve your own time entries.'],
 ['fr','Veuillez confirmer à nouveau cette action sensible.','Vous ne pouvez pas approuver vos propres heures.'],
 ['it','Conferma nuovamente questa operazione sensibile.','Non puoi approvare le tue ore.'],
]){
 const render=value=>renderToStaticMarkup(React.createElement(client.LocaleProvider,{initialLocale:language},React.createElement(client.LocalizedText,null,value)));
 assert.equal(render('Bitte bestätige diese sicherheitsrelevante Aktion erneut.'),confirmation);
 assert.equal(render('Eigene Zeiten dürfen nicht selbst freigegeben werden.'),approval);
 assert.equal(render('Synthetic user record'),'Synthetic user record','Unrecognized user text remains verbatim');
}
// Render the actual shared search feedback/pager under all real locale contexts.
const selectAst=ts.createSourceFile('select-control.tsx',fs.readFileSync('components/select-control.tsx','utf8'),99,true,4),selectExports={};
const selectCopySource=selectAst.statements.filter(node=>ts.isFunctionDeclaration(node)&&['SelectSearchFeedback','SelectSearchPagination'].includes(node.name?.text)).map(node=>node.getText(selectAst)).join('\n');
assert.ok(selectCopySource.includes('SelectSearchFeedback')&&selectCopySource.includes('SelectSearchPagination'));
Function('require','exports','LocalizedElement','LocalizedText',ts.transpileModule(selectCopySource,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,selectExports,client.LocalizedElement,client.LocalizedText);
for(const language of config.locales){
 const render=(Component,props)=>renderToStaticMarkup(React.createElement(client.LocaleProvider,{initialLocale:language},React.createElement(Component,props)));
 const feedback=render(selectExports.SelectSearchFeedback,{loading:true,error:'Die Anfrage konnte nicht verarbeitet werden.',onRetry(){}});
 for(const label of ['Daten werden geladen …','Die Anfrage konnte nicht verarbeitet werden.','Erneut versuchen'])assert.ok(feedback.includes(locale.translateMessage(label,language)),language+' actual shared feedback: '+label);
 const search={value:'',onChange(){},onRetry(){},page:1,hasNext:true,loading:false};
 const pager=render(selectExports.SelectSearchPagination,{search,onPage(){}});
 for(const label of ['Zurück','Weiter'])assert.ok(pager.includes(locale.translateMessage(label,language)),language+' actual shared pagination: '+label);
 assert.equal((pager.match(/<button\b[^>]*disabled/g)??[]).length,0,'Available pages stay actionable');
 const pending=render(selectExports.SelectSearchPagination,{search:{...search,loading:true},onPage(){}});
 assert.equal((pending.match(/<button\b[^>]*disabled/g)??[]).length,2,'Both paging actions remain blocked during pending data');
}
console.log('Actual common select feedback/paging: all four locale renders, localized error/retry/status, and pending action locks passed. DOM interaction is separately tested in the browser.');
// Render the actual settings and shared switch, not a duplicated label template.
const uiAst=ts.createSourceFile('ui.tsx',fs.readFileSync('components/ui.tsx','utf8'),99,true,4),toggleExports={};
const toggleSource=uiAst.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='Toggle').getText(uiAst);
Function('require','exports','LocalizedElement',ts.transpileModule(toggleSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,toggleExports,client.LocalizedElement);
const settingsAst=ts.createSourceFile('settings.tsx',fs.readFileSync('components/pages/settings.tsx','utf8'),99,true,4),notificationExports={};
const notificationNode=settingsAst.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='NotificationSettingsPage');
const notificationSource=notificationNode.getText(settingsAst);
const notificationStateDeclarations=notificationNode.body.statements.filter(ts.isVariableStatement).flatMap(statement=>[...statement.declarationList.declarations]).filter(declaration=>ts.isCallExpression(declaration.initializer)&&declaration.initializer.expression.getText(settingsAst)==='useState');
const readyStateIndex=notificationStateDeclarations.findIndex(declaration=>ts.isArrayBindingPattern(declaration.name)&&declaration.name.elements[0].name.getText(settingsAst)==='ready');
assert.ok(readyStateIndex>=0,'The actual notification owner declares its loading boundary');
assert.equal(notificationStateDeclarations[readyStateIndex].initializer.arguments[0].kind,ts.SyntaxKind.FalseKeyword,'Notifications start unconfirmed');
let notificationStateIndex=0,confirmedNotificationRender=false;
const useNotificationState=initial=>React.useState(notificationStateIndex++===readyStateIndex?confirmedNotificationRender:initial);
const wrapper=({children})=>React.createElement('div',null,children);
const rowSource=ts.createSourceFile('binso-ux.tsx',fs.readFileSync('components/binso-ux.tsx','utf8'),99,true,4).statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='ListRow').getText();
const rowExports={};Function('require','exports','LocalizedText','Status','Icon','Link',ts.transpileModule(rowSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,rowExports,client.LocalizedText,()=>null,()=>null,wrapper);
const pushDevice=compile('components/push-device-settings.tsx',{'react':React,'@/lib/client/locale':client,'@/lib/client/backend':{},'./ui':{Button:wrapper,ErrorState:wrapper,LoadingState:wrapper}});
const preferenceCount=compile('config/notification-channels.ts').notificationPreferenceKinds.length;
Function('require','exports','Fragment','ListRow','useId','useRef','useState','useEffect','AppShell','ErrorState','LoadingState','SettingsGroup','LocalizedText','Toggle','PushDeviceSettings',ts.transpileModule(notificationSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,notificationExports,React.Fragment,rowExports.ListRow,React.useId,React.useRef,useNotificationState,React.useEffect,wrapper,wrapper,wrapper,wrapper,client.LocalizedText,toggleExports.Toggle,pushDevice.PushDeviceSettings);
for(const language of config.locales){
 notificationStateIndex=0;confirmedNotificationRender=false;
 const pending=renderToStaticMarkup(React.createElement(client.LocaleProvider,{initialLocale:language},React.createElement(notificationExports.NotificationSettingsPage)));
 assert.doesNotMatch(pending,/role="switch"/,'Unconfirmed defaults never appear as saved notification settings');
 assert.ok(pending.includes(locale.translateMessage('Einstellungen werden geladen …',language)),'The pending state retains its localized announcement');
 notificationStateIndex=0;confirmedNotificationRender=true;
 const markup=renderToStaticMarkup(React.createElement(client.LocaleProvider,{initialLocale:language},React.createElement(notificationExports.NotificationSettingsPage)));
 const labels=new Map([...markup.matchAll(/<(?:b|span) id="([^"]+)">([^<]+)<\/(?:b|span)>/g)].map(match=>[match[1],match[2]]));
 const switches=[...markup.matchAll(/<button[^>]*role="switch"[^>]*>/g)];assert.equal(switches.length,preferenceCount);
 const names=switches.map(([tag])=>{assert.doesNotMatch(tag,/aria-label=/,'Do not shadow translated visible labels with a concatenated German name');const ids=tag.match(/aria-labelledby="([^"]+)"/)[1].split(' ');assert.equal(ids.length,1,'Compact preference uses its one complete visible naming reference');return ids.map(id=>{assert.ok(labels.has(id),'Every naming reference exists in the actual page');return labels.get(id)}).join(' ')});
 assert.equal(names[0],locale.translateMessage('Rechnungen',language)+' · '+locale.translateMessage('E-Mail',language));
 assert.equal(new Set(names).size,preferenceCount,'Every preference has a unique channel and topic');
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
}console.log('Locale catalogues: complete EN/FR/IT/TR tuples, preserved template tokens, server-rendered language, native attributes and unchanged user data passed.');
// Exercise the real recovery handler with isolated token/mail delivery adapters.
{
 let user={id:'fixture',language:'de'},sent=null,failMail=false;
 const recovery=compile('app/api/auth/recover/route.ts',{
  '@/lib/locales':locale,'@/lib/locales/config':config,
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
 const legal=compile('components/legal-page.tsx',{'@/lib/client/locale':client,'next/link':({children,...props})=>element('a',props,children),'@/components/marketing':{MarketingHeader:()=>element('header',{'data-public-marketing':true}),MarketingFooter:()=>element('footer',{'data-public-marketing':true})}});
 const legalConfig=compile('config/legal.ts');
 for(const file of ['impressum','datenschutz','agb','auftragsbearbeitung','unterauftragsbearbeiter']){
  const page=compile('app/'+file+'/page.tsx',{'@/lib/client/locale':client,'@/components/legal-page':legal,'@/config/legal':legalConfig,'next/link':({children,...props})=>element('a',props,children)}).default;
  let baseline;
  for(const language of config.locales){
   const markup=renderToStaticMarkup(element(client.LocaleProvider,{initialLocale:language},element(page)));
   const hero=markup.match(/<header class="legal-hero">([\s\S]*?)<\/header>/)?.[1];assert.ok(hero,'Actual legal header exists');
   for(const text of [page().props.eyebrow,page().props.intro]){const expected=renderToStaticMarkup(element(client.LocaleProvider,{initialLocale:language},element(client.LocalizedText,null,text)));assert.ok(hero.includes(expected),'Actual legal eyebrow and introduction follow the chosen language: '+language);}
   const ids=[...markup.matchAll(/<section[^>]* id="([^"]+)"/g)].map(match=>match[1]);assert.ok(ids.length>=2);assert.equal(new Set(ids).size,ids.length,'No duplicate legal anchors');
   if(baseline)assert.deepEqual(ids,baseline,'Section URLs stay stable across UI languages');else baseline=ids;
   for(const [,id] of markup.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),'Every table-of-contents link has a real section');
   const internal=renderToStaticMarkup(element(client.LocaleProvider,{initialLocale:language},React.cloneElement(page(),{surface:'app'})));
   assert.ok(!internal.includes('data-public-marketing'),'Internal legal reading never includes marketing chrome');
   const article=text=>text.match(/<article[^>]*>([\s\S]*?)<\/article>/)?.[1].replace(/<[^>]*>/g,'');
   assert.equal(article(internal),article(markup),'Public and internal legal clauses remain identical');
   assert.ok(internal.includes('app-legal-page'));
   assert.deepEqual([...internal.matchAll(/<section[^>]* id="([^"]+)"/g)].map(match=>match[1]),ids,'Internal and public anchors are identical');
   if(file==='impressum')assert.ok(ids.includes('kontakt'),'Existing contact deep link preserved');
   if(ids.length>=5){assert.ok(markup.includes('<details class="legal-toc">'));assert.ok(markup.includes(locale.translateMessage('Inhaltsverzeichnis',language)));}
   else assert.ok(!markup.includes('class="legal-toc"'),'Short documents need no redundant contents control');
   assert.ok(markup.includes('5. Oktober 2026'),'Legal version date is not silently rewritten');
  }
 }
 console.log('Actual legal documents: stable unique TOC anchors, preserved contact deep link, translated control labels, short-document omission and unchanged version dates passed. Legal language/substance approval remains separate.');
}

// V5: short closed trigger, full native language names in every option.
for(const language of config.locales)for(const compact of [false,true]){
 const switcher=compile('components/locale-switcher.tsx',{'./select-control':{SelectControl:({displayValue,children,...props})=>React.createElement('select',{'data-caption':displayValue,value:props.value,onChange(){},'aria-label':props['aria-label']},children)},'@/lib/client/locale':client,'@/lib/client/use-language-preference':{useLanguagePreference:()=>({locale:language,save(){},busy:false,error:null})},'@/lib/locales':locale,'@/lib/locales/config':config,'./ui':{ErrorState:()=>null}});
 const html=renderToStaticMarkup(React.createElement(client.LocaleProvider,{initialLocale:language},React.createElement(switcher.LocaleSwitcher,{compact})));
 assert.ok(html.includes('data-caption="'+language.toUpperCase()+'"'),'V5 selected language uses its short code; native options stay complete: '+language);
 for(const code of config.locales)assert.ok(html.includes(config.localeNames[code]),'Existing language option retained: '+code);
}
console.log('Language selector V5: five short triggers and full native option names passed; persistence owner unchanged.');
import './document-navigation-test.mjs';
