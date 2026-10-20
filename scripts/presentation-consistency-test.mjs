import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {parseCss,pruneSuperseded,supersededDeclarations} from './presentation-cascade.mjs';
import {redundantDeclarations} from './css-contract.mjs';

const prune=css=>{const root=parseCss(css);return {removed:pruneSuperseded(root),css:root.toString()};};
const positive=prune('.label{color:red;padding:4px}.other{color:green}.label{color:blue}');
assert.equal(positive.removed.length,1);
assert.equal(positive.css,'.label{padding:4px}.other{color:green}.label{color:blue}');
assert.equal(prune('@media(max-width:760px){.label{color:red}.label{color:blue}}').removed.length,1);
assert.equal(prune('.label{color:red}.label,.other{color:blue}').removed.length,1,'A later plain-selector superset dominates the complete earlier rule');
assert.equal(prune('.label,.other{color:red}.label,.other,.third{color:blue}').removed.length,1);
for(const css of [
 '.label{height:100vh}.label{height:100dvh}',
 '.label{color:red}.label{color:color-mix(in srgb,red,blue)}',
 '.label{color:red}.label{color:rgb(0,0,0);color:var(--label)}',
 '.label{color:red!important}.label{color:blue}',
 '.label{color:red}@media(max-width:760px){.label{color:blue}}',
 '@media(max-width:760px){.label{color:red}}@media(max-width:390px){.label{color:blue}}',
 '.label,.other{color:red}.label{color:blue}',
 '.label{color:red}.label,:future-pseudo{color:blue}',
 '.label{color:red}.label,.other{color:blue!important}',
 '.label{color:red}.container .label{color:blue}',
 '@layer{.label{color:red}}@layer{.label{color:blue}}',
 '@keyframes pulse{from{opacity:0}to{opacity:1}}',
 '.label{&:hover{color:red}&:hover{color:blue}}',
])assert.equal(prune(css).removed.length,0,'Keep fallbacks, specificity, priority, conditions, anonymous layers and keyframes: '+css);
assert.equal(redundantDeclarations(parseCss('.mobile-header{height:44px}.mobile-header{height:44px}')).length,1,'Headers are no longer excluded from duplicate detection');
const manifest=JSON.parse(fs.readFileSync('app/design-system/manifest.json','utf8'));
for(const {path} of manifest.sources){
 const source=fs.readFileSync(path,'utf8'),root=parseCss(source);
 assert.equal(supersededDeclarations(root).length,0,path+' has no provably dominated earlier declarations');
 assert.doesNotMatch(source,/--glass-(?:bg|line|blur)\b/,'Retired generic glass tokens stay removed');
}
console.log('Presentation cascade: safe pruning, preserved progressive fallbacks/conditions and all current CSS owners passed.');

// Inspect actual JSX across route families, not a hand-maintained list of approved pages.
function presentationProblems(source,file='components/example.tsx'){
 const ast=ts.createSourceFile(file,source,99,true,4),problems=[];
 const literal=node=>ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)?node.text:ts.isJsxExpression(node)&&node.expression?literal(node.expression):ts.isJsxText(node)?node.text.trim():null;
 const children=node=>node.children.filter(child=>!ts.isJsxText(child)||child.text.trim());
 const visit=node=>{
  if(ts.isJsxElement(node)||ts.isJsxSelfClosingElement(node)){
   const open=ts.isJsxElement(node)?node.openingElement:node,tag=open.tagName.getText(ast),attribute=name=>open.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(ast)===name);
   const report=message=>problems.push(`${file}:${ast.getLineAndCharacterOfPosition(node.getStart()).line+1}: ${message}`);
   if(literal(attribute('className')?.initializer??{})==='section-title'&&file!=='components/ui.tsx')report('Use the shared SectionTitle, including its action group.');
   if(['Input','input'].includes(tag)&&literal(attribute('type')?.initializer??{})==='file'&&!attribute('hidden'))report('File pickers must use the shared visible control or a contextual action, not native file chrome.');
   if(tag==='p'&&ts.isJsxElement(node)){
    const content=children(node);
    if(content.length===1&&ts.isJsxElement(content[0])&&content[0].openingElement.tagName.getText(ast)==='LocalizedText'){
     const text=children(content[0]);
     if(text.length===1&&/^(Keine |Noch keine )[^.!?]*[.!?]?$/.test(literal(text[0])??''))report('Use EmptyState for a standalone empty/permission result; retain its full message.');
    }
   }
  }
  ts.forEachChild(node,visit);
 };visit(ast);return problems;
}
assert.equal(presentationProblems('<div className="section-title"><h2>Files</h2></div>').length,1);
assert.equal(presentationProblems('<Input type="file"/>').length,1);
assert.equal(presentationProblems('<p><LocalizedText>{"Keine Dateien"}</LocalizedText></p>').length,1);
assert.equal(presentationProblems('<SectionTitle title="Dateien"/><EmptyState title="Keine Dateien"/><Input hidden type="file"/>').length,0);
assert.equal(presentationProblems('<p><LocalizedText>Keine Kreditkarte nötig. Deine Daten bleiben erhalten.</LocalizedText></p>').length,0,'Do not rewrite ordinary explanatory content as an empty state');
const sourceFiles=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?sourceFiles(dir+'/'+entry.name):[dir+'/'+entry.name]);
const routeProblems=[...sourceFiles('components'),...sourceFiles('app')].filter(file=>file.endsWith('.tsx')).flatMap(file=>presentationProblems(fs.readFileSync(file,'utf8'),file));
assert.deepEqual(routeProblems,[],'Active UI families must retain shared headings, file controls and empty states');
console.log('Cross-route presentation ownership: headings, file chrome and empty/permission results passed.');
