import {unlocalizedJsxText,jsxCopyNodes,apiMessageLiterals} from './localized-source.mjs';
import assert from 'node:assert/strict';import ts from 'typescript';import fs from 'node:fs';import path from 'node:path';const messages={...JSON.parse(fs.readFileSync('lib/locales/messages.json')),...Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync('lib/locales/periods.json'))).map(([key,values])=>[key,['en','fr','it','tr'].map(locale=>{assert.ok(typeof values[locale]==='string'&&values[locale].trim(),'Period translation required: '+key+': '+locale);return values[locale]})]))},neutral=new Set(JSON.parse(fs.readFileSync('lib/locales/neutral.json')));const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]),missing=new Set();for(const [key,values] of Object.entries(messages)){assert.equal(values.length,4,'Every application key requires EN/FR/IT/TR: '+key);for(const value of values)assert.ok(typeof value==='string'&&value.trim(),'Nonempty application translation: '+key);}
const add=v=>{v=v.replace(/\s+/g,' ').trim();if(/[A-Za-zÀ-ž]/.test(v)&&!messages[v]&&!neutral.has(v))missing.add(v)};for(const file of [...walk('app'),...walk('components')].filter(f=>f.endsWith('.tsx')&&!f.includes('/registration/'))){const source=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,source,99,true,4);const visit=n=>{if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(ast)==='LocalizedText'){const v=x=>{if(ts.isStringLiteral(x)||ts.isNoSubstitutionTemplateLiteral(x))add(x.text);else if(ts.isJsxText(x))add(x.text);else ts.forEachChild(x,v)};n.children.forEach(v);}if(ts.isJsxAttribute(n)&&n.initializer&&ts.isStringLiteral(n.initializer)&&['title','label','subtitle','text','placeholder','aria-label','description','backLabel','closeLabel','retryLabel','alt','singularCountLabel','countLabel'].includes(n.name.getText(ast)))add(n.initializer.text);ts.forEachChild(n,visit)};visit(ast)}assert.deepEqual([...missing].sort(),[], 'Application copy must have EN/FR/IT/TR translations or an explicitly reviewed neutral value');console.log('Application source copy coverage passed.');

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
assert.deepEqual(apiMissing,[],'Every static public ApiError message needs EN/FR/IT/TR coverage; do not silently fall back to German');
console.log('Static public API validation copy coverage passed; internal diagnostics and dynamic record values are excluded.');

// Navigation labels are deliberately data-driven, not direct JSX literals.
const navigationLabels=new Set();
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
    navigationLabels.add(label.text);
   }
  }
  ts.forEachChild(node,visit);
 };
 visit(ast);assert.deepEqual([...found].sort(),[...names].sort(),'Check both actual navigation label tables');
}
assert.deepEqual([...missing].sort(),[],'All actual tenant/operator navigation and group labels require translations');
console.log('Data-driven tenant/operator navigation labels and group headings have catalogue coverage.');

// The authorized V2 navigation is data-driven in its canonical owner.
const phase1Navigation=await import((await import('./data-test-modules.mjs')).moduleUrl(fs.readFileSync('config/workspace-navigation.ts','utf8')));
for(const label of [...phase1Navigation.mainNavigation.map(item=>item.label),...phase1Navigation.moreNavigation.flatMap(group=>[group.title,...group.items.map(item=>item.label)])]){assert.ok(messages[label]?.length===4,'V2 navigation EN/FR/IT/TR catalogue: '+label);assert.ok(JSON.parse(fs.readFileSync('lib/locales/messages.json','utf8'))[label]?.[3]?.trim(),'V2 navigation actual Turkish translation: '+label)}
for(const label of [...phase1Navigation.mainNavigation.map(item=>item.label),...phase1Navigation.moreNavigation.flatMap(group=>[group.title,...group.items.map(item=>item.label)])])navigationLabels.add(label);
const {moduleUrl,localeTestModuleUrl}=await import('./data-test-modules.mjs');
const settingsAst=sourceAst(fs.readFileSync('components/settings-navigation.tsx','utf8'));
const settingsDeclaration=settingsAst.statements.find(statement=>ts.isVariableStatement(statement)&&statement.declarationList.declarations.some(declaration=>declaration.name.getText(settingsAst)==='settingsGroups'));
assert.ok(settingsDeclaration,'Inspect the actual shared settings catalogue');
const {settingsGroups}=await import(moduleUrl(settingsDeclaration.getText(settingsAst)));
for(const group of settingsGroups){navigationLabels.add(group.title);for(const [, ,label] of group.rows)navigationLabels.add(label);}
const marketingAst=sourceAst(fs.readFileSync('components/marketing.tsx','utf8'));
const marketingTables=new Set();
const marketingVisit=node=>{if(ts.isVariableDeclaration(node)&&['productViews','options'].includes(node.name.getText(marketingAst))){let value=node.initializer;while(value&&(ts.isAsExpression(value)||ts.isParenthesizedExpression(value)))value=value.expression;assert.ok(value&&ts.isArrayLiteralExpression(value));marketingTables.add(node.name.getText(marketingAst));for(const row of value.elements){assert.ok(ts.isArrayLiteralExpression(row)&&ts.isStringLiteral(row.elements[1]));navigationLabels.add(row.elements[1].text);}}ts.forEachChild(node,marketingVisit);};marketingVisit(marketingAst);assert.equal(marketingTables.size,2,'Inspect both actual public product-view selectors');
for(const label of ['Sitzungen','Sitzung','Mehr','Abmelden'])navigationLabels.add(label);
const {translateMessage,locales}=await import(await localeTestModuleUrl());
const menuNameValid=value=>typeof value==='string'&&value.trim().length>0&&!value.includes('&');
assert.equal(menuNameValid('Benutzer & Rollen'),false,'Paired German menu labels must fail');
assert.equal(menuNameValid('Users & roles'),false,'Paired translations must fail as well');
for(const label of navigationLabels)for(const language of locales){const text=translateMessage(label,language);assert.ok(menuNameValid(text),language+' menu label must use a clear domain name: '+label);if(language!=='de')assert.ok(messages[label]?.[['en','fr','it','tr'].indexOf(language)]?.trim(),'An actual menu translation is required: '+language+': '+label);}
for(const language of locales)assert.notEqual(translateMessage('Benutzerkonten',language),translateMessage('Mitarbeiter',language),'User accounts and employee records retain distinct names: '+language);
console.log('All five languages: tenant, operator, account and shared settings menu names have translations and no ampersand pairs.');
