import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {inventory} from './ux-inventory.mjs';

const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.posix.join(dir,entry.name)):[path.posix.join(dir,entry.name)]);
const hash=value=>createHash('sha256').update(value).digest('hex');
/** Static evidence only: consumes existing canonical route/data/schema owners. */
export function v8Inventory(){
 const ux=inventory(),data=JSON.parse(fs.readFileSync('docs/architecture/v21-3-data-inventory.json','utf8'));
 const schema=JSON.parse(fs.readFileSync('database/schema-contract.json','utf8'));
 const runtimeFiles=['app','components','lib','config'].flatMap(walk).filter(file=>/\.tsx?$/.test(file)).sort();
 const fields=[],forms=[],actions=[],surfaces=[],validationCandidates=[];
 const fieldTags=new Set(['Field','Input','Select','Textarea','Checkbox','Toggle','DirectorySelect','SelectControl']);
 const actionTags=new Set(['Button','ActionRow','ListRow']);
 const surfaceTags=new Set(['FormPage','FormSheet','ActionSheet','FilterSheet','ActionsMenu','HeaderPanel','ConfirmDialog']);
 for(const file of runtimeFiles){
  const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const line=node=>ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1;
  const props=open=>Object.fromEntries(open.attributes.properties.map(prop=>ts.isJsxAttribute(prop)?[prop.name.getText(ast),prop.initializer?.getText(ast)??true]:['...'+prop.expression.getText(ast),'spread']));
  function visit(node,owner='module'){
   if(ts.isFunctionDeclaration(node)&&node.name)owner=node.name.text;
   if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer&&(ts.isArrowFunction(node.initializer)||ts.isFunctionExpression(node.initializer)))owner=node.name.text;
   const open=ts.isJsxElement(node)?node.openingElement:ts.isJsxSelfClosingElement(node)?node:null;
   if(open){
    const tag=open.tagName.getText(ast),row={file,line:line(node),owner,tag,props:props(open)};
    if(fieldTags.has(tag))fields.push(row);
    if(tag==='form')forms.push(row);
    if(actionTags.has(tag))actions.push(row);
    if(surfaceTags.has(tag))surfaces.push(row);
   }
   // These are source candidates, not claims that all validation is inline.
   // API closures and database constraints remain in the canonical data/schema owners.
   if(ts.isIfStatement(node)&&/throw new (?:ApiError|Error)|return (?:json|NextResponse\.json)\(/.test(node.thenStatement.getText(ast)))validationCandidates.push({file,line:line(node),owner,condition:node.expression.getText(ast),consequence:node.thenStatement.getText(ast).slice(0,1000)});
   ts.forEachChild(node,child=>visit(child,owner));
  }
  visit(ast);
 }
 const migrations=walk('database/migrations').filter(file=>file.endsWith('.sql')).sort();
 const databaseDeclarations=migrations.map(file=>{const sql=fs.readFileSync(file,'utf8');return {file,sha256:hash(sql),relations:[...sql.matchAll(/references\s+([a-z_]+)\s*\(([^)]+)\)/gi)].map(match=>({table:match[1],columns:match[2]})),indexes:[...sql.matchAll(/create\s+(?:unique\s+)?index\s+(?:if not exists\s+)?([a-z_]+)/gi)].map(match=>match[1]),constraints:[...sql.matchAll(/(?:add\s+)?constraint\s+([a-z_]+)/gi)].map(match=>match[1])};});
 const messages=JSON.parse(fs.readFileSync('lib/locales/messages.json','utf8'));
 const translationKeys=Object.entries(messages).map(([key,values])=>({key,available:['de',...['en','fr','it','tr'].filter((_,index)=>typeof values[index]==='string'&&values[index].length>0)]}));
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 const declarations=['config/workspace-navigation.ts','config/notification-channels.ts','lib/permissions.ts','lib/operator-pages.ts','config/plans.ts','config/plan-access.ts'].map(file=>({file,sha256:hash(fs.readFileSync(file)),source:fs.readFileSync(file,'utf8')}));
 const configs=['.github/workflows','infrastructure'].filter(dir=>fs.existsSync(dir)).flatMap(walk).filter(file=>/\.(ya?ml|json|bicep|tf|ps1|sh)$/.test(file));
 const integrationFiles=runtimeFiles.filter(file=>/graph|stripe|entra|operator-auth|mail|outbox|storage|receipt|push|notification/i.test(file));
 return {schema:1,baseSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Static pre-change inventory; no runtime, provider, database or visual acceptance implied',counts:{routes:ux.routes.length,operatorVariants:ux.operatorVariants.length,components:ux.componentCatalog.length,fields:fields.length,forms:forms.length,actions:actions.length,surfaces:surfaces.length,apis:data.apis.length,tables:schema.tables.length,migrations:migrations.length,translationKeys:translationKeys.length,cssRules:ux.cssRules.length},sourceFiles:runtimeFiles.map(file=>({file,sha256:hash(fs.readFileSync(file))})),routes:ux.routes.map(({route,file,module,family,permission,pageComponents})=>({route,file,module,family,permission,pageComponents})),operatorVariants:ux.operatorVariants,fields,forms,actions,surfaces,validationCandidates,apis:data.apis,consumers:data.consumers,databaseSchema:schema,databaseDeclarations,translationKeys,declarations,notificationsAndIntegrations:integrationFiles,design:{manifest:'app/design-system/manifest.json',cssOrder:ux.cssOrder,tokenDeclarations:ux.cssRules.flatMap(rule=>(rule.declarations??[]).filter(decl=>decl.property?.startsWith('--')).map(decl=>({file:rule.file,selector:rule.selector,...decl})))},quality:{scripts:pkg.scripts,dependencies:pkg.dependencies,devDependencies:pkg.devDependencies,configs:configs.map(file=>({file,sha256:hash(fs.readFileSync(file))}))},limits:['Field and input wrappers are listed separately; counts do not mean unique business inputs.','Conditional, generated, delegated and server/database validations need source review.','Translation presence does not establish linguistic/legal approval or layout.','Live Azure, delivery, native PostgreSQL and physical devices require independent evidence.']};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const output=process.argv[2]??'docs/architecture/v8-global-simple-workflow/inventory.json';
 if(fs.existsSync(output))throw Error('Preserve the pre-change inventory; choose a new explicit output path.');
 const result=v8Inventory();fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.counts));
}
