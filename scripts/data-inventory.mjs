import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
const root=process.cwd();
async function walk(dir){const entries=await fs.readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):path.join(dir,entry.name)))).flat();}
const paths=(await Promise.all(['app','components','lib','database/migrations'].map(walk))).flat().filter(p=>/\.(tsx?|sql)$/.test(p)).sort();
const sources=new Map(await Promise.all(paths.map(async p=>[p,await fs.readFile(p,'utf8')])));
const resolve=(file,specifier)=>{const base=specifier.startsWith('@/')?specifier.slice(2):specifier.startsWith('.')?path.normalize(path.join(path.dirname(file),specifier)):null;return base&&[base,base+'.ts',base+'.tsx',base+'/index.ts',base+'/index.tsx'].find(candidate=>sources.has(candidate));};
const files=new Map();
for(const [file,source] of sources){
 if(file.endsWith('.sql'))continue;
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
 const imports=[],calls=[],methods=[];
 const line=node=>ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1;
 function visit(node){
  if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)){const target=resolve(file,node.moduleSpecifier.text);if(target)imports.push(target);}
  if(ts.isFunctionDeclaration(node)&&node.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)&&node.name&&['GET','POST','PATCH','PUT','DELETE'].includes(node.name.text))methods.push(node.name.text);
  if(ts.isCallExpression(node)){const callee=node.expression.getText(ast);if(/(query|apiGet|apiPost|apiPatch|apiDelete|apiUpload|fetch|tenantList|tenantRpc|authorize|requireSession|requireOperatorSession|withTenant|withPlatform|useApiQuery|useDemoRows|createRecord|listRecords)/.test(callee))calls.push({callee,line:line(node),arguments:node.arguments.map(a=>a.getText(ast))});}
  ts.forEachChild(node,visit);
 }
 visit(ast);files.set(file,{imports,methods,calls});
}
function closure(file,seen=new Set()){if(seen.has(file))return seen;seen.add(file);for(const dependency of files.get(file)?.imports??[])closure(dependency,seen);return seen;}
const apis=[...files].filter(([p])=>/^app\/api\/.*route\.ts$/.test(p)).map(([file,entry])=>({file,path:'/'+file.replace(/^app\//,'').replace(/\/route\.ts$/,''),methods:entry.methods,dependencies:[...closure(file)].filter(p=>p!==file),evidence:entry.calls}));
const consumers=[...files].filter(([p,e])=>p.startsWith('components/')&&e.calls.some(c=>/^api|^fetch$|useApiQuery|useDemoRows/.test(c.callee))).map(([file,entry])=>({file,calls:entry.calls.filter(c=>/^api|^fetch$|useApiQuery|useDemoRows/.test(c.callee)),pages:[...files.keys()].filter(p=>/^app\/(?!api\/).*page\.tsx$/.test(p)&&closure(p).has(file))}));
const migrations=[...sources].filter(([p])=>p.endsWith('.sql')).map(([file,source])=>({file,tables:[...source.matchAll(/create table(?: if not exists)?\s+([a-z_]+)/gi)].map(m=>m[1]),relations:[...source.matchAll(/references\s+([a-z_]+)\s*\(([^)]+)\)/gi)].map(m=>({table:m[1],columns:m[2]})),rls:[...source.matchAll(/alter table\s+([a-z_]+)\s+(enable|force) row level security/gi)].map(m=>({table:m[1],mode:m[2]}))}));
const report={scope:'Static AST/source inventory, not proof that every runtime branch is tested. Calls include exact source arguments and locations; dynamic dispatch requires the domain matrix and runtime tests.',base:process.env.BINSO_INVENTORY_BASE||'7b90a5c7353cf2061987fcd0f4550210bbc00f92',counts:{apis:apis.length,consumers:consumers.length,migrations:migrations.length,tables:new Set(migrations.flatMap(m=>m.tables)).size},apis,consumers,migrations,repositories:[...files].filter(([p])=>p.startsWith('lib/server/repositories/')).map(([file,entry])=>({file,...entry})),clientState:[...files].filter(([p])=>p.startsWith('lib/client/')).map(([file,entry])=>({file,...entry}))};
await fs.mkdir('docs/architecture',{recursive:true});await fs.writeFile('docs/architecture/v21-3-data-inventory.json',JSON.stringify(report,null,2)+'\n');
await fs.writeFile('docs/architecture/v21-3-api-inventory.md',`# V21.3 API inventory\n\n${report.scope}\n\n${apis.length} API route files, ${consumers.length} client consumers, ${migrations.length} migrations, ${report.counts.tables} declared tables.\n\n| Endpoint | Methods | Source | Direct data/auth evidence |\n|---|---|---|---|\n`+apis.map(api=>`| \`${api.path}\` | ${api.methods.join(', ')} | \`${api.file}\` | ${api.evidence.filter(c=>/tenant|query|withTenant|withPlatform|authorize|Session/.test(c.callee)).map(c=>`\`${c.callee}:${c.line}\``).join(', ')} |`).join('\n')+'\n\nFull import closure, query arguments, client consumers, migration relations and RLS declarations: `v21-3-data-inventory.json`. Absence of direct evidence in this table does not mean authorization is absent: inspect delegated handlers in the JSON.\n');
console.log(report.counts);
