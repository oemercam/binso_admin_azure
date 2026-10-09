import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
// Metadata only, after applying every migration to a fresh embedded test database.
// Never opens DATABASE_URL or reads business rows from an external database.
const db=new PGlite({extensions:{pgcrypto}});
try{
 const migrations=(await fs.readdir('database/migrations')).filter(name=>name.endsWith('.sql')).sort();
 for(const migration of migrations)await db.transaction(async tx=>tx.exec(await fs.readFile('database/migrations/'+migration,'utf8')));
 const rows=async sql=>(await db.query(sql)).rows;
 const tables=await rows("select c.relname name,c.relrowsecurity rls,c.relforcerowsecurity forced_rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') order by c.relname");
 const columns=await rows("select table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default,numeric_precision,numeric_scale from information_schema.columns where table_schema='public' order by table_name,ordinal_position");
 const constraints=await rows("select c.relname table_name,k.conname name,k.contype type,k.convalidated validated,pg_get_constraintdef(k.oid) definition from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' order by c.relname,k.conname");
 const policies=await rows("select c.relname table_name,p.polname name,p.polcmd command,p.polpermissive permissive,pg_get_expr(p.polqual,p.polrelid) using_expression,pg_get_expr(p.polwithcheck,p.polrelid) check_expression from pg_policy p join pg_class c on c.oid=p.polrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' order by c.relname,p.polname");
 const indexes=await rows("select tablename table_name,indexname name,indexdef definition from pg_indexes where schemaname='public' order by tablename,indexname");
 const views=await rows("select viewname name,definition from pg_views where schemaname='public' order by viewname");
 const result={scope:'Current schema from all migrations in a fresh isolated PGlite instance; no external or productive database inspected',migrations,tables,columns,constraints,policies,indexes,views};
 await fs.writeFile('docs/architecture/v21-3-schema-inventory.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({tables:tables.length,columns:columns.length,constraints:constraints.length,policies:policies.length,indexes:indexes.length,views:views.length}));
}finally{await db.close();}
