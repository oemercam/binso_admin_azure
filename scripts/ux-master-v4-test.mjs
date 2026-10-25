import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const compile=(file,deps={})=>{const output={};Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(name=>Object.hasOwn(deps,name)?deps[name]:require(name),output);return output;};
const config=compile('lib/locales/config.ts'),catalog=JSON.parse(fs.readFileSync('lib/locales/periods.json','utf8'));
const deps=Object.fromEntries(['messages','periods','templates','plurals'].map(name=>['./'+name+'.json',JSON.parse(fs.readFileSync('lib/locales/'+name+'.json','utf8'))]));
deps['./config']=config;const locale=compile('lib/locales/index.ts',deps);
for(const language of config.locales)for(const label of ['Sortieren','Sortieren nach','Filtern nach','Filter','Sortierung','Filter zurücksetzen','Sortierung zurücksetzen','Zurücksetzen','Standard','Aufsteigend','Absteigend']){
 assert.ok(catalog[label]?.[language]?.trim(),language+' '+label);
 assert.equal(locale.translateMessage(label,language),catalog[label][language],'Use the actual central translator');
}
const source=fs.readFileSync('components/setup-guide.tsx','utf8'),ast=ts.createSourceFile('setup-guide.tsx',source,99,true,4);
const declaration=ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&['SetupGuideView','SetupProgress'].includes(node.name?.text)).map(node=>node.getText(ast)).join('\n'),output={};
Function('require','exports','Link','LocalizedText','ProgressBar','Icon','useTranslation',ts.transpileModule(declaration,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,output,({children,...props})=>React.createElement('a',props,children),({children})=>children,props=>React.createElement('progress',{value:props.value,max:props.max,'aria-label':props.label}),()=>React.createElement('svg'),()=>value=>value);
const fixture={requiredComplete:1,requiredTotal:3,dismissed:false,tasks:[{id:'name',importance:'required',complete:true,href:'/done',title:'Firmenname'},{id:'logo',importance:'optional',complete:false,href:'/optional',title:'Optional'},{id:'address',importance:'required',complete:false,href:'/einstellungen/firma?setupStep=address',title:'Firmenadresse'},{id:'bank',importance:'required',complete:false,href:'/einstellungen/firma?setupStep=bank',title:'Bankverbindung'}]};
const render=item=>renderToStaticMarkup(React.createElement(output.SetupGuideView,{item}));
const html=render(fixture);assert.equal((html.match(/<a /g)??[]).length,3,'Approved guided setup exposes all three required areas');assert.ok(!html.includes('<button'),'No nested actions in the setup card');assert.match(html,/<a\b[^>]*href="\/einstellungen\/firma\?setupStep=address"[^>]*aria-current="step"[^>]*>/,'The first missing required area is active');assert.ok(!html.includes('/optional'),'Optional tasks never masquerade as required setup');assert.ok(html.includes('href="/done"'),'Completed areas remain accessible');assert.ok(html.includes('value="1"')&&html.includes('max="3"'),'Progress uses the actual required area states');
assert.equal(render({...fixture,requiredComplete:3}),'');assert.equal(render({...fixture,dismissed:true}),'');assert.equal(render({...fixture,tasks:fixture.tasks.filter(task=>task.complete||task.importance==='optional')}),'');
console.log('V4 tools and approved guided setup: five-language tools, three required targets, active missing area, actual progress and complete/dismissed negatives passed.');
