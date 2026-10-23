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
const declaration=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='SetupGuideView').getText(ast),output={};
Function('require','exports','Link','LocalizedText','ProgressBar',ts.transpileModule(declaration,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,output,({children,...props})=>React.createElement('a',props,children),({children})=>children,props=>React.createElement('progress',{value:props.value,max:props.max,'aria-label':props.label}));
const fixture={requiredComplete:1,requiredTotal:3,dismissed:false,tasks:[{importance:'required',complete:true,href:'/done',title:'Erledigt'},{importance:'optional',complete:false,href:'/optional',title:'Optional'},{importance:'required',complete:false,href:'/einstellungen/firma',title:'Firmenadresse'}]};
const render=item=>renderToStaticMarkup(React.createElement(output.SetupGuideView,{item}));
const html=render(fixture);assert.equal((html.match(/<a /g)??[]).length,1,'The entire setup card is one target');assert.ok(!html.includes('<button'),'No nested actions in the setup card');assert.ok(html.includes('href="/einstellungen/firma"'),'Continue selects the first missing required field, never an optional field');assert.ok(html.includes('value="1"')&&html.includes('max="3"'),'Progress uses actual required totals');
assert.equal(render({...fixture,requiredComplete:3}),'');assert.equal(render({...fixture,dismissed:true}),'');assert.equal(render({...fixture,tasks:fixture.tasks.filter(task=>task.complete||task.importance==='optional')}),'');
console.log('V4: all five central tool translations; one setup target, actual progress, required-next selection and complete/dismissed states passed.');
