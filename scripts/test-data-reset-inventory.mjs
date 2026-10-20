import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import pg from 'pg';

const identifier=value=>{if(!/^[a-z_][a-z0-9_]*$/.test(value))throw new Error('Unexpected database identifier');return '"'+value+'"';};
const count=value=>{const n=Number(value);if(!(typeof value==='number'||typeof value==='string'&&/^[0-9]+$/.test(value))||!Number.isSafeInteger(n)||n<0)throw new Error('Invalid inventory count');return n;};

/** Planning only: no tenant, account, business record or blob is changed. */
export async function inventoryTestData(client){
 await client.query('begin isolation level repeatable read read only');
 try{
  await client.query('set local row_security=off');
  const organizations=(await client.query('select id::text as id,status,is_demo from public.organizations order by id')).rows;
  if(organizations.length>100)throw new Error('Organization inventory exceeds review bound');
  const columns=(await client.query(`select c.table_name,c.column_name from information_schema.columns c join information_schema.tables t on t.table_schema=c.table_schema and t.table_name=c.table_name where c.table_schema='public' and t.table_type='BASE TABLE' and (c.column_name='organization_id' or c.table_name in ('file_objects','organization_subscriptions')) order by c.table_name,c.ordinal_position`)).rows;
  const tables=[...new Set(columns.filter(c=>c.column_name==='organization_id').map(c=>c.table_name))].sort();
  const organizationTables=tables.map(table=>({table,sql:identifier(table)}));
  const items=[];
  for(const organization of organizations){
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organization.id)||typeof organization.is_demo!=='boolean')throw new Error('Invalid organization metadata');
   const rows={};
   for(const {table,sql} of organizationTables){const result=await client.query(`select count(*) as n from public.${sql} where organization_id=$1`,[organization.id]);rows[table]=count(result.rows[0]?.n);}
   let externalFiles={count:0,referenceDigest:null};
   if(columns.some(c=>c.table_name==='file_objects'&&c.column_name==='blob_url')){
    const files=(await client.query("select blob_url from public.file_objects where organization_id=$1 and blob_url is not null order by blob_url",[organization.id])).rows;
    externalFiles={count:files.length,referenceDigest:createHash('sha256').update(JSON.stringify(files.map(f=>f.blob_url))).digest('hex')};
   }
   const providerReferences={};
   for(const column of columns.filter(c=>c.table_name==='organization_subscriptions'&&/^billing_(customer|subscription)_id$/.test(c.column_name))){
    const result=await client.query(`select count(*) as n from public.organization_subscriptions where organization_id=$1 and ${identifier(column.column_name)} is not null`,[organization.id]);providerReferences[column.column_name]=count(result.rows[0]?.n);
   }
   items.push({organizationId:organization.id,status:organization.status,isDemo:organization.is_demo,tenantRows:rows,externalFiles,providerReferences});
  }
  const retained={appUsers:count((await client.query('select count(*) as n from public.app_users')).rows[0]?.n),operatorAssignments:count((await client.query('select count(*) as n from public.platform_operator_assignments')).rows[0]?.n)};
  const plan={format:'binso-test-reset-inventory-v1',items,retained,scope:'All existing organizations are deletion candidates only after exact explicit confirmation; personal identities and operator access retained. No deletion authorized by this inventory.'};
  return {...plan,manifestSha256:createHash('sha256').update(JSON.stringify(plan)).digest('hex')};
 }finally{await client.query('rollback');}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let pool,client;try{
  if(!process.env.DATABASE_URL)throw new Error('Database connection unavailable');
  pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true},connectionTimeoutMillis:10000,statement_timeout:30000,query_timeout:45000,max:1});client=await pool.connect();
  console.log(JSON.stringify({readOnly:true,inventory:await inventoryTestData(client)}));
 }catch{console.error('Read-only reset inventory blocked: connection, unrestricted reads or bounded metadata unavailable.');process.exitCode=1;}
 finally{client?.release();await pool?.end();}
}
