import {unlocalizedJsxText} from './localized-source.mjs';
import assert from 'node:assert/strict';import ts from 'typescript';import fs from 'node:fs';import path from 'node:path';const messages=JSON.parse(fs.readFileSync('lib/locales/messages.json')),neutral=new Set(JSON.parse(fs.readFileSync('lib/locales/neutral.json')));const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]),missing=new Set();const add=v=>{v=v.replace(/\s+/g,' ').trim();if(/[A-Za-zÀ-ž]/.test(v)&&!messages[v]&&!neutral.has(v))missing.add(v)};for(const file of [...walk('app'),...walk('components')].filter(f=>f.endsWith('.tsx')&&!f.includes('/registration/'))){const source=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,source,99,true,4);const visit=n=>{if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(ast)==='LocalizedText'){const v=x=>{if(ts.isStringLiteral(x)||ts.isNoSubstitutionTemplateLiteral(x))add(x.text);else if(ts.isJsxText(x))add(x.text);else ts.forEachChild(x,v)};n.children.forEach(v);}if(ts.isJsxAttribute(n)&&n.initializer&&ts.isStringLiteral(n.initializer)&&['title','label','subtitle','text','placeholder','aria-label','description','backLabel','closeLabel','retryLabel','alt','singularCountLabel','countLabel'].includes(n.name.getText(ast)))add(n.initializer.text);ts.forEachChild(n,visit)};visit(ast)}assert.deepEqual([...missing].sort(),[], 'Application copy must have EN/FR/IT translations or an explicitly reviewed neutral value');console.log('Application source copy coverage passed.');

const sourceAst=source=>ts.createSourceFile('fixture.tsx',source,99,true,4);
assert.equal(unlocalizedJsxText(sourceAst('<LocalizedElement as="button">Weiter</LocalizedElement>')).length,1,'Attribute-only localization cannot translate children');
assert.equal(unlocalizedJsxText(sourceAst('<LocalizedText>Weiter</LocalizedText>')).length,0);
assert.equal(unlocalizedJsxText(sourceAst('<Button>Weiter</Button>')).length,0,'Shared button owns text localization');
assert.equal(unlocalizedJsxText(sourceAst('<p>{customer.name}</p>')).length,0,'User-authored values must not be translated');
const rawMissing=[];
for(const file of [...walk('app'),...walk('components')].filter(file=>file.endsWith('.tsx'))){
 const ast=sourceAst(fs.readFileSync(file,'utf8'));
 for(const row of unlocalizedJsxText(ast))if(!neutral.has(row.text))rawMissing.push({...row,file});
}
assert.deepEqual(rawMissing,[],'Literal application copy requires a text-localization boundary; a catalogue entry alone does not translate raw JSX');
console.log('Raw JSX localization boundaries passed; brand-neutral text and dynamic user data are preserved.');