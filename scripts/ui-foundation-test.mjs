import './reference-foundation-test.mjs';
import './localization-test-adapter.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import './presentation-consistency-test.mjs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {moduleUrl} from './data-test-modules.mjs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ESLint} from 'eslint';
import {redundantDeclarations,assertRuntimeImports} from './css-contract.mjs';
import {inventory} from './ux-inventory.mjs';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
const eslint=new ESLint();
async function messages(code,filePath='app/future-module/page.tsx'){
 const [result]=await eslint.lintText(code,{filePath});return result.messages.filter(m=>m.ruleId==='binso-ui/central-components');
}
for(const tag of ['input','select','textarea'])assert.equal((await messages(`export default function Page(){return <${tag}/>;}`)).length,1,'Future routes cannot implement '+tag+' again');
assert.equal((await messages('export const View=()=> <div className="filter-sheet-actions"/>;')).length,1,'Sheet footer ownership cannot drift back into routes');
assert.equal((await messages('export const View=()=> <div className="mobile-sticky-save"/>;')).length,1,'Page footer ownership cannot drift back into routes');
assert.equal((await messages('import {FormActions} from "@/components/ui";export const View=()=> <FormActions sheet/>;')).length,0,'Shared footer composition remains supported');
for(const expression of ['"form-workspace"','"workspace-toolbar"','"form-wizard"','"wizard-progress"','"wizard-content"','"form-field"','{`bottom-sheet ${true?"active":""}`}','{true?"operator-table":""}','"confirm-dialog"'])assert.equal((await messages(`export default function Page(){return <div className=${expression}/>;}`)).length,1,'Copied canonical wrappers must fail lint');
assert.equal((await messages('import {DashboardPage} from "@/components/app-pages";export default DashboardPage;')).length,1);
assert.equal((await messages('export default function Page(){return <p role="alert">Fehler</p>;}')).length,1);
assert.equal((await messages('export default function Page(){return <p role="status">Daten werden geladen …</p>;}')).length,1);
assert.equal((await messages('import {Field,Input,LoadingState,ErrorState} from "@/components/ui";export default function Page(){return <><Field label="Name"><Input/></Field><LoadingState/><ErrorState>Fehler</ErrorState></>;}')).length,0);
assert.equal((await messages('export function Input(){return <input/>;}','components/ui.tsx')).length,0,'The actual renderer may own a native control');
assert.equal((await messages('export function AnotherInput(){return <input/>;}','components/ui.tsx')).length,1,'Even the canonical file cannot accumulate another native renderer');
assert.equal(redundantDeclarations(postcss.parse('.field{height:40px}.field{height:40px}')).length,1);
assert.equal(redundantDeclarations(postcss.parse('.field{height:40px}@media(max-width:760px){.field{height:44px}}')).length,0,'Responsive variants are different contexts');
assert.equal(redundantDeclarations(postcss.parse('.field{height:100vh;height:100dvh}')).length,0,'Progressive fallbacks remain valid');
const cssImports='@import "./design-system/theme.css";@import "./design-system/primitives.css";';
assert.doesNotThrow(()=>assertRuntimeImports(postcss.parse(cssImports),['theme.css','primitives.css']));
assert.throws(()=>assertRuntimeImports(postcss.parse(cssImports),['primitives.css','theme.css']),/cascade order/);
assert.throws(()=>assertRuntimeImports(postcss.parse(cssImports+cssImports),['theme.css','primitives.css']),/cascade order/);
const source=fs.readFileSync('components/ui.tsx','utf8'),ast=ts.createSourceFile('ui.tsx',source,99,true,4);
const body=ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast)).join('\n');
const compiled=ts.transpileModule(body,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const {fieldInputHint}=await import(moduleUrl(fs.readFileSync('lib/form-input-hints.ts','utf8')));
let write=true;const ui={};Function('require','exports','Children','cloneElement','isValidElement','useId','useState','fieldInputHint','usePageAccess','Link',compiled)(require,ui,React.Children,React.cloneElement,React.isValidElement,React.useId,React.useState,fieldInputHint,()=>({write,canOpen:()=>true}),({children,...props})=>React.createElement('a',props,children));
const html=element=>renderToStaticMarkup(element);
for(const expanded of [false,true]){
 const disclosure=html(React.createElement(ui.Button,{'aria-expanded':expanded,'aria-controls':'further-readings','aria-label':'Weitere Auswertungen'},'Mehr anzeigen'));
 assert.ok(disclosure.includes(`aria-expanded="${expanded}"`),'Shared disclosure button exposes its actual expanded state');
 assert.ok(disclosure.includes('aria-controls="further-readings"'),'Shared button retains its controlled-region association');
 assert.ok(disclosure.includes('aria-label="Weitere Auswertungen"'),'Native accessible name is forwarded');
}
const ariaLink=html(React.createElement(ui.Button,{href:'/operator/monitoring','aria-describedby':'source-description'},'Monitoring'));
for(const expanded of [false,true]){
 const icon=html(React.createElement(ui.IconButton,{label:'Zeitfilter',icon:'filter','aria-expanded':expanded,'aria-haspopup':'dialog'}));
 assert.ok(icon.includes(`aria-expanded="${expanded}"`),'Icon controls expose both actual disclosure states');
 assert.ok(icon.includes('aria-haspopup="dialog"')&&icon.includes('aria-label="Zeitfilter"'),'Icon filter retains its accessible name and popup type');
}
assert.ok(ariaLink.includes('aria-describedby="source-description"'),'Shared link button forwards ARIA descriptions');
write=false;assert.ok(html(React.createElement(ui.Button,{requiresWrite:true,'aria-expanded':false},'Geschützte Aktion')).includes('disabled=""'),'ARIA forwarding preserves write protection');write=true;
const invalid=html(React.createElement(ui.Field,{label:'E-Mail',error:'Ungültig',hint:'Geschäftlich'},React.createElement(ui.Input,{'aria-describedby':'existing',type:'email'})));
assert.ok(invalid.includes('aria-invalid="true"'));assert.ok(invalid.includes('aria-labelledby="'));const labelId=invalid.match(/aria-labelledby="([^"]+)"/)[1];assert.ok(invalid.includes(`id="${labelId}">E-Mail</span>`),'Accessible name excludes validation/help text');const description=invalid.match(/aria-describedby="([^"]+)"/)[1].split(' ');assert.equal(description[0],'existing');for(const id of description.slice(1))assert.ok(invalid.includes(`id="${id}"`),'Hint/error belongs to its actual control');assert.ok(invalid.includes('role="alert"'));
const valid=html(React.createElement(ui.Field,{label:'Name'},React.createElement(ui.Input)));assert.ok(!valid.includes('aria-invalid'));assert.ok(!valid.includes('role="alert"'));
write=false;assert.ok(html(React.createElement(ui.Field,{label:'Nur lesen'},React.createElement(ui.Input))).includes('disabled=""'));assert.ok(!html(React.createElement(ui.Field,{label:'Suche',allowReadOnlyInput:true},React.createElement(ui.Input))).includes('disabled=""'));
assert.ok(html(React.createElement(ui.Field,{label:'Geschützter Wrapper'},React.createElement('div',null,React.createElement(ui.Input)))).includes('disabled=\"\"'),'Wrapped controls retain read-only protection');
write=true;for(const [name,type] of [['DateInput','date'],['Checkbox','checkbox']])assert.ok(html(React.createElement(ui[name])).includes(`type="${type}"`));assert.ok(html(React.createElement(ui.CurrencyInput)).includes('inputMode="decimal"'));assert.ok(html(React.createElement(ui.LoadingState)).includes('role="status"'));assert.ok(html(React.createElement(ui.ErrorState,null,'Fehler')).includes('role="alert"'));assert.ok(html(React.createElement(ui.Textarea)).includes('form-textarea'));
const incoming=html(React.createElement(ui.MessageBubble,{time:'10:24'},'<script>'));
assert.ok(incoming.includes('message-support'));assert.ok(!incoming.includes('<span>'));assert.ok(incoming.includes('&lt;script&gt;'));
const outgoing=html(React.createElement(ui.MessageBubble,{time:'10:37',author:'Operator',outgoing:true,internal:true},'Notiz'));
assert.ok(outgoing.includes('message-user'));assert.ok(outgoing.includes('<span>Operator</span>'));assert.ok(outgoing.includes('Intern'));
const catalog=inventory(),publicPage=catalog.routes.find(r=>r.route==='/login');assert.equal(publicPage.family,'AuthenticationPage');assert.ok(!publicPage.pageRenderGraph.some(k=>k.endsWith('#AppShellFrame')),'Inactive root shell branches must not become the actual public page graph');assert.ok(catalog.operatorVariants.some(v=>v.route==='/operator/sperrungen'&&v.component.endsWith('#RestrictionsView')));assert.ok(catalog.apiRoutes.some(r=>r.route==='/api/documents/preview'&&r.methods.includes('POST')));
assert.ok(!fs.existsSync('components/pages/compatibility.tsx'));assert.ok(!fs.readFileSync('components/operator.tsx','utf8').includes('operator-modal-layer'));
assert.ok(!fs.existsSync('components/app-pages.tsx'),'Unused runtime compatibility barrel stays retired; test-only page-source reads the actual owners.');
console.log('UI foundation: rejecting copied controls/wrappers/states/imports; field validation association; read-only permissions; native types; cascade fallback/context; route/layout/operator/API inventory passed.');

const wizardSource=fs.readFileSync('components/form-wizard.tsx','utf8');
const wizardAst=ts.createSourceFile('form-wizard.tsx',wizardSource,99,true,4);
const wizardBody=wizardAst.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(wizardAst)).join('\n');
const wizardCompiled=ts.transpileModule(wizardBody,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const wizard={};Function('require','exports','useEffect','useRef','Children','cloneElement','isValidElement','Fragment','Button','FormActions','FormSection',wizardCompiled)(require,wizard,React.useEffect,React.useRef,React.Children,React.cloneElement,React.isValidElement,React.Fragment,ui.Button,ui.FormActions,ui.FormSection);
for(const step of [0,1,2]){
 const markup=html(React.createElement(wizard.FormWizard,{labels:['Kunde','Positionen','Prüfen'],step,onStep:()=>{},cancelAction:React.createElement(ui.Button,{href:'/rechnungen'},'Abbrechen'),action:React.createElement(ui.Button,null,'Erstellen')},'Entwurf'));
 assert.equal(markup.includes('Abbrechen'),step===0);assert.equal(markup.includes('Zurück'),step>0);assert.equal(markup.includes('Weiter'),step<2);assert.equal(markup.includes('Erstellen'),step===2);
}
console.log('Wizard first/middle/final actions and architecture ownership passed.');

const {contactHref}=await import(moduleUrl(fs.readFileSync('lib/contact-links.ts','utf8')));
assert.equal(contactHref('email',' name+tag@example.ch '),'mailto:name%2Btag@example.ch');
const encodedMail=contactHref('email','name?subject=<script>@example.ch');assert.equal(new URL(encodedMail).search,'');assert.ok(!encodedMail.includes('<script>'));
assert.equal(contactHref('email','name@example.ch\r\nBcc:other@example.ch'),undefined);assert.equal(contactHref('email','javascript:alert(1)'),undefined);
assert.equal(contactHref('phone','+41 (44) 123-45-67'),'tel:+41441234567');assert.equal(contactHref('phone','079 123 45 67'),'tel:0791234567');
for(const value of ['javascript:alert(1)','+41?code=1','*#06#','+41\n123','++41123'])assert.equal(contactHref('phone',value),undefined);
console.log('Contact URIs retain fixed schemes, encode address delimiters and reject control/query/dial-command injection.');

const progress=html(React.createElement(ui.LoadingState,null,'Kundendaten werden abgerufen.'));
assert.match(progress,/role="status"/);assert.match(progress,/aria-live="polite"/);
assert.doesNotMatch(progress,/loading-state-indicator|progressbar/,"Navigation never fabricates visible progress");
assert.match(progress,/<span class="sr-only">Kundendaten werden abgerufen\.<\/span>/,'The actual shared loader keeps its accessible label without visible loading copy');

const empty=html(React.createElement(ui.EmptyState,{title:'Keine Dateien vorhanden.'}));
assert.ok(empty.includes('role="status"')&&!empty.includes('<button')&&!empty.includes('<svg')&&!empty.includes('<h3'),'Empty lists do not add illustrations or duplicate actions');
assert.ok(html(React.createElement(ui.EmptyState,{title:'Kein Zugriff',description:'Eine Freigabe ist erforderlich.'})).includes('Eine Freigabe ist erforderlich.'),'Security explanations remain available');
const example=html(React.createElement(ui.Field,{label:'Telefon'},React.createElement(ui.Input,{type:'tel',value:'',readOnly:true})));
assert.ok(example.includes('placeholder="+41 31 555 12 34"')&&example.includes('value=""'),'Examples do not initialize saved values');
for(const type of ['password','checkbox','radio','file','date','time','hidden'])assert.equal(fieldInputHint('Telefon',type),undefined);
assert.equal(fieldInputHint('Passwort','text'),undefined);

const singleStepHeading=html(React.createElement(wizard.FormWizard,{labels:['Grunddaten'],step:0,onStep:()=>{},action:null,cancelAction:null},React.createElement(ui.FormSection,{title:'Grunddaten'},'Inhalt')));assert.equal((singleStepHeading.match(/Grunddaten/g)||[]).length,1,'Wizard step names are not repeated by their own form section');

assert.equal(fieldInputHint("Beschreibung"),"z. B. IT-Beratung und Support");assert.equal(fieldInputHint("Einrichtungsschlüssel"),undefined,"Security setup secrets never receive synthetic examples");assert.equal(fieldInputHint("Zahlungsreferenz"),"RF… oder QR-Referenz");
