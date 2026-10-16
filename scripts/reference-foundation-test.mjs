import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Linter} from 'eslint';
import centralUi from './eslint/central-ui.mjs';
const linter=new Linter();
const original=JSON.parse(fs.readFileSync('docs/audit/v24/reference-source.json','utf8'));
for(const file of original.files)assert.equal(createHash('sha256').update(fs.readFileSync('docs/audit/v24/reference/'+file.file)).digest('hex'),file.sha256,'Original ZIP reference must remain unchanged: '+file.file);
const inspect=code=>linter.verify(code,[{files:['**/*.jsx'],languageOptions:{ecmaVersion:2024,sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}}},plugins:{'binso-ui':centralUi},rules:{'binso-ui/central-components':'error'}}],{filename:'components/new-page.jsx'});
for(const code of [
 'export const View=()=> <div style={{color:"red"}}/>;',
 'export const View=()=> <div style={{borderRadius:12}}/>;',
 'export const View=()=> <div style={arbitraryPresentation}/>;',
 'export const View=()=> <style>{".new-button {color:red}"}</style>;',
 'import "./new-page.css"; export const View=()=> <div/>;',
 'export const View=()=> <input/>;',
])assert.ok(inspect(code).some(e=>e.ruleId==='binso-ui/central-components'),'Local presentation/control bypass must fail: '+code);
assert.deepEqual(inspect('export const View=()=> <div style={{"--measured-value":value}}/>;'),[],'Measured CSS variables remain allowed');
assert.deepEqual(inspect('export const View=()=> <Field label="Name"><Input/></Field>;'),[],'Shared composition is allowed');
assert.ok(fs.readFileSync('AGENTS.md','utf8').includes('docs/architecture/reference-foundation.md'));
console.log('Reference foundation: route-local CSS, JSX styles, arbitrary inline presentation and copied controls rejected; measured variables/shared composition accepted.');
