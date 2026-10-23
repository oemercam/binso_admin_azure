import {unlocalizedJsxText,jsxCopyNodes,apiMessageLiterals} from './localized-source.mjs';
import assert from 'node:assert/strict';import ts from 'typescript';import fs from 'node:fs';import path from 'node:path';const messages={...JSON.parse(fs.readFileSync('lib/locales/messages.json')),...Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync('lib/locales/periods.json'))).map(([key,values])=>[key,['en','fr','it'].map(locale=>{assert.ok(typeof values[locale]==='string'&&values[locale].trim(),'Period translation required: '+key+': '+locale);return values[locale]})]))},neutral=new Set(JSON.parse(fs.readFileSync('lib/locales/neutral.json')));const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]),missing=new Set();const add=v=>{v=v.replace(/\s+/g,' ').trim();if(/[A-Za-zÀ-ž]/.test(v)&&!messages[v]&&!neutral.has(v))missing.add(v)};for(const file of [...walk('app'),...walk('components')].filter(f=>f.endsWith('.tsx')&&!f.includes('/registration/'))){const source=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,source,99,true,4);const visit=n=>{if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(ast)==='LocalizedText'){const v=x=>{if(ts.isStringLiteral(x)||ts.isNoSubstitutionTemplateLiteral(x))add(x.text);else if(ts.isJsxText(x))add(x.text);else ts.forEachChild(x,v)};n.children.forEach(v);}if(ts.isJsxAttribute(n)&&n.initializer&&ts.isStringLiteral(n.initializer)&&['title','label','subtitle','text','placeholder','aria-label','description','backLabel','closeLabel','retryLabel','alt','singularCountLabel','countLabel'].includes(n.name.getText(ast)))add(n.initializer.text);ts.forEachChild(n,visit)};visit(ast)}assert.deepEqual([...missing].sort(),[], 'Application copy must have EN/FR/IT translations or an explicitly reviewed neutral value');console.log('Application source copy coverage passed.');

const sourceAst=source=>ts.createSourceFile('fixture.tsx',source,99,true,4);
assert.equal(unlocalizedJsxText(sourceAst('<LocalizedElement as="button">Weiter</LocalizedElement>')).length,1,'Attribute-only localization cannot translate children');
assert.equal(unlocalizedJsxText(sourceAst('<LocalizedText>Weiter</LocalizedText>')).length,0);
assert.equal(unlocalizedJsxText(sourceAst('<Button>Weiter</Button>')).length,0,'Shared button owns text localization');
assert.equal(unlocalizedJsxText(sourceAst('<p>{customer.name}</p>')).length,0,'User-authored values must not be translated');
assert.deepEqual(unlocalizedJsxText(sourceAst('<p>{active ? "Aktiv" : "Inaktiv"}</p>')).map(row=>row.text),['Aktiv','Inaktiv'],'Rendered literal alternatives need actual text boundaries');
assert.deepEqual(jsxCopyNodes(sourceAst('<Button>New literal copy</Button>')).map(row=>({text:row.text,localized:row.localized})),[{text:'New literal copy',localized:true}],'Automatic controls are checked for catalogue entries too');
assert.equal(unlocalizedJsxText(sourceAst('<p>{customer.name ?? <LocalizedText>Kunde</LocalizedText>}</p>')).length,0,'Only the fallback is localized; the real customer name remains verbatim');
const rawMissing=[],translatedMissing=[];
for(const file of [...walk('app'),...walk('components')].filter(file=>file.endsWith('.tsx'))){
 const ast=sourceAst(fs.readFileSync(file,'utf8'));
 for(const row of jsxCopyNodes(ast))if(!neutral.has(row.text)){if(!row.localized)rawMissing.push({...row,file});else if(!messages[row.text])translatedMissing.push({...row,file});}
}
assert.deepEqual(translatedMissing,[],'Automatically localized shared controls also require actual catalogue entries');
assert.deepEqual(rawMissing,[],'Literal application copy requires a text-localization boundary; a catalogue entry alone does not translate raw JSX');
console.log('Raw JSX localization boundaries passed; brand-neutral text and dynamic user data are preserved.');
assert.deepEqual(apiMessageLiterals(ts.createSourceFile('fixture.ts',"throw new ApiError(400,'invalid','Public validation message')",99,true)).map(row=>row.text),['Public validation message']);
assert.deepEqual(apiMessageLiterals(ts.createSourceFile('fixture.ts',"throw new Error('Internal diagnostic')",99,true)),[],'Internal diagnostics are not public application copy');
assert.deepEqual(apiMessageLiterals(ts.createSourceFile('fixture.ts',"throw new ApiError(400,'invalid',state==='expired'?'Retry':'Unavailable')",99,true)).map(row=>row.text),['Retry','Unavailable'],'Condition codes are not public copy, rendered branches are');
assert.deepEqual(apiMessageLiterals(ts.createSourceFile('fixture.ts',"throw new ApiError(400,'invalid',recordValue)",99,true)),[],'Dynamic record values must not be mistaken for literal UI labels');
const apiMissing=[];
for(const file of [...walk('lib/server'),...walk('app/api')].filter(file=>file.endsWith('.ts'))){
 const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),99,true,ts.ScriptKind.TS);
 for(const row of apiMessageLiterals(ast))if(!messages[row.text]&&!neutral.has(row.text))apiMissing.push({...row,file});
}
assert.deepEqual(apiMissing,[],'Every static public ApiError message needs EN/FR/IT coverage; do not silently fall back to German');
console.log('Static public API validation copy coverage passed; internal diagnostics and dynamic record values are excluded.');

// Navigation labels are deliberately data-driven, not direct JSX literals.
for(const [file,names] of [['components/app-shell.tsx',['desktopNav','desktopNavGroups']],['components/operator.tsx',['operatorNav','operatorNavGroups']]]){
 const ast=sourceAst(fs.readFileSync(file,'utf8')),found=new Set();
 const visit=node=>{
  if(ts.isVariableDeclaration(node)&&names.includes(node.name.getText(ast))){
   found.add(node.name.getText(ast));let value=node.initializer;
   while(value&&(ts.isAsExpression(value)||ts.isParenthesizedExpression(value)))value=value.expression;
   assert.ok(value&&ts.isArrayLiteralExpression(value),'Navigation label table must remain inspectable: '+file);
   for(const row of value.elements){
    const label=ts.isArrayLiteralExpression(row)?row.elements[1]:ts.isObjectLiteralExpression(row)?row.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast)==='label')?.initializer:undefined;
    assert.ok(label&&ts.isStringLiteral(label),'Navigation labels must remain explicit: '+file);
    add(label.text);
   }
  }
  ts.forEachChild(node,visit);
 };
 visit(ast);assert.deepEqual([...found].sort(),[...names].sort(),'Check both actual navigation label tables');
}
assert.deepEqual([...missing].sort(),[],'All actual tenant/operator navigation and group labels require translations');
console.log('Data-driven tenant/operator navigation labels and group headings have catalogue coverage.');
