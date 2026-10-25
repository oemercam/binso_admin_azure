import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {inventory} from './ux-inventory.mjs';

const destination='docs/architecture/ux-navigation-v7';
fs.mkdirSync(destination,{recursive:true});
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const tracked=git('ls-files','-z').split('\0').filter(Boolean);
const additions=git('ls-files','--others','--exclude-standard','-z').split('\0').filter(file=>file&&!file.startsWith('.qa-phase1/'));
const filenames=[...new Set([...tracked,...additions])].filter(file=>fs.existsSync(file)&&fs.statSync(file).isFile()).sort();
const counts={};const files=filenames.map(file=>{
 const bytes=fs.readFileSync(file),ext=path.extname(file)||'[extensionless]';counts[ext]=(counts[ext]??0)+1;
 return {file,bytes:bytes.length,sha256:hash(bytes),tracked:tracked.includes(file),kind:file.startsWith('public/')?'public-asset':file.startsWith('database/')?'database':file.startsWith('.github/')?'ci':file.startsWith('docs/')?'documentation':'source/config'};
});
const groups=new Map();for(const file of files.filter(file=>file.kind==='public-asset')){const siblings=groups.get(file.sha256)??[];siblings.push(file.file);groups.set(file.sha256,siblings);}
const caseGroups=new Map();for(const file of filenames){const key=file.toLowerCase(),siblings=caseGroups.get(key)??[];siblings.push(file);caseGroups.set(key,siblings);}
const sourceFiles=filenames.filter(file=>/\.(?:tsx?|m?js|css|sql|ya?ml)$/.test(file));
const patterns={explicitAny:/\bany\b/g,localeLiteral:/(?:toLocaleString|DateTimeFormat|NumberFormat)\([^\n]*?['"](?:de-CH|fr-CH|it-CH|en|tr)['"]/g,urls:/https?:\/\//g,uuidLiteral:/['"][0-9a-f]{8}-[0-9a-f-]{27,}['"]/gi,important:/!important/g,emptyCatch:/catch\s*(?:\([^)]*\))?\s*\{\s*\}/g};
const candidates=sourceFiles.map(file=>{const text=fs.readFileSync(file,'utf8'),matches={};for(const [name,expression] of Object.entries(patterns)){const count=[...text.matchAll(expression)].length;if(count)matches[name]=count;}return {file,matches};}).filter(row=>Object.keys(row.matches).length);
const apis=sourceFiles.filter(file=>/^app\/api\/.*\/route\.ts$/.test(file)).map(file=>{
 const text=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,text,99,true);
 const methods=ast.statements.flatMap(node=>{
  if(!node.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.ExportKeyword))return [];
  const declarations=ts.isFunctionDeclaration(node)?[node]:ts.isVariableStatement(node)?Array.from(node.declarationList.declarations):[];
  return declarations.filter(entry=>/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(entry.name?.text??'')).map(entry=>({method:entry.name.text,line:ast.getLineAndCharacterOfPosition(entry.getStart()).line+1}));
 });
 const indicators=['requireSession','getSession','requireUser','requireOperator','authorize','assertSameOrigin','readJson','withTenant','enforceRateLimit','idempotency','audit'].filter(name=>text.includes(name));
 return {file,route:'/'+file.replace(/^app\//,'').replace(/\/route\.ts$/,''),methods,indicators,qualification:'Static call indicators only; delegated guards and runtime cases require owner tests.'};
});
const catalog=inventory();
const summary={schema:1,generatedAt:new Date().toISOString(),baseSha:git('rev-parse','HEAD'),branch:git('branch','--show-current'),toolchain:{git:git('--version'),node:process.version,pnpm:process.env.npm_execpath?'via activated runtime':'10.17.1 (runtime validated)'},localChanges:git('status','--short').split('\n').filter(line=>!line.includes('.qa-phase1/')),files:files.length,extensions:counts,routes:catalog.routes.length,apiRoutes:apis.length,components:catalog.componentCatalog.length,cssOwners:JSON.parse(fs.readFileSync('app/design-system/manifest.json')).sources,migrations:filenames.filter(file=>/^database\/migrations\/.*\.sql$/.test(file)),workflows:filenames.filter(file=>file.startsWith('.github/workflows/')),duplicateAssetGroups:[...groups.values()].filter(rows=>rows.length>1),caseCollisions:[...caseGroups.values()].filter(rows=>rows.length>1),generatedDirectories:fs.readdirSync('.',{withFileTypes:true}).filter(entry=>entry.isDirectory()&&['node_modules','.next','.git','.qa-phase1'].includes(entry.name)).map(entry=>({directory:entry.name,review:'Generated/private tree inventoried by owner; no credentials or tenant data exported.'})),limitations:['Pattern occurrences are review candidates, not confirmed defects.','No production database contents, secrets, user uploads or private release evidence exported.','Visual/role/device/provider qualification is recorded separately.']};
for(const [name,value] of Object.entries({inventory:summary,files,apis,'code-candidates':candidates,'route-status':catalog.routes.map(route=>({route:route.route,file:route.file,family:route.family,components:route.pageComponents,status:'Teilweise',evidence:'Static inventory; V7 rendered and flow acceptance pending.'}))}))fs.writeFileSync(`${destination}/${name}.json`,JSON.stringify(value,null,2)+'\n');

if(process.env.BINSO_UI_TEST_URL){
 const url=new URL(process.env.BINSO_UI_TEST_URL);
 if(!['127.0.0.1','localhost'].includes(url.hostname)||!['/binso_ui_test','/binso_phase1_ui_test'].includes(url.pathname)||url.username!=='binso_test')throw Error('Schema inventory is restricted to the named isolated QA database');
 const {default:pg}=await import('pg'),client=new pg.Client({connectionString:url.href});await client.connect();
 try{
  const queries={columns:"select table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,ordinal_position",constraints:"select c.relname as table_name,k.conname,k.contype,pg_get_constraintdef(k.oid) as definition from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' order by c.relname,k.conname",indexes:"select tablename,indexname,indexdef from pg_indexes where schemaname='public' order by tablename,indexname",policies:"select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' order by tablename,policyname",functions:"select p.proname,pg_get_function_identity_arguments(p.oid) as arguments,p.prosecdef,p.provolatile,md5(p.prosrc) as definition_hash from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by p.proname",triggers:"select event_object_table,trigger_name,event_manipulation,action_timing from information_schema.triggers where trigger_schema='public' order by event_object_table,trigger_name",relations:"select c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','v','m') order by c.relname"};
  const schema={source:'Isolated synthetic QA database; metadata only',objects:{}};for(const [name,sql] of Object.entries(queries))schema.objects[name]=(await client.query(sql)).rows;
  fs.writeFileSync(`${destination}/database-schema.json`,JSON.stringify(schema,null,2)+'\n');
 }finally{await client.end();}
}
console.log(JSON.stringify({files:summary.files,routes:summary.routes,apiRoutes:summary.apiRoutes,components:summary.components,migrations:summary.migrations.length,assetDuplicateGroups:summary.duplicateAssetGroups.length,caseCollisions:summary.caseCollisions.length}));
