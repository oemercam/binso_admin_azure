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
const locale=compile('lib/locales/index.ts',{'./config':config,'./messages.json':messages,'./templates.json':templates});
assert.deepEqual(config.locales,['de','fr','it','en']);
for(const [language,label] of [['de','Rechnungen'],['fr','Factures'],['it','Fatture'],['en','Invoices']]){
 assert.equal(locale.translateMessage('Rechnungen',language),label);
 assert.equal(locale.translateMessage('Acme AG',language),'Acme AG');
 assert.equal(locale.translateMessage('  entirely user-authored <script>  ',language),'  entirely user-authored <script>  ');
}
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
