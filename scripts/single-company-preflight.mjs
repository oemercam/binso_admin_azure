import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import pg from 'pg';
const keys=['ambiguous_active_identities','foreign_pending_invitations','active_companies_without_owner','existing_checkouts_during_free_trial'];
export class PreflightBlocked extends Error{constructor(counts){super('Read-only lifecycle preflight requires separate resolution');this.counts=counts;}}
export async function singleCompanyPreflight(client){
 const sql=await fs.readFile(new URL('../database/operations/single-company-preflight.sql',import.meta.url),'utf8');
 let result;try{result=await client.query(sql);}finally{await client.query('rollback');}
 const rows=(Array.isArray(result)?result:[result]).flatMap(item=>item.rows??[]),counts={};
 for(const key of keys){const values=rows.filter(row=>Object.hasOwn(row,key));const raw=values[0]?.[key],n=Number(raw);if(values.length!==1||!(typeof raw==='number'||typeof raw==='string'&&/^[0-9]+$/.test(raw))||!Number.isSafeInteger(n)||n<0)throw new Error('Incomplete lifecycle preflight metadata');counts[key]=n;}
 if(keys.some(key=>counts[key]!==0))throw new PreflightBlocked(counts);
 return counts;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let pool,client;try{
  if(!process.env.DATABASE_URL)throw new Error('Database connection unavailable');
  pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true},connectionTimeoutMillis:10000,statement_timeout:30000,query_timeout:45000,max:1});client=await pool.connect();
  console.log({lifecyclePreflight:'passed',counts:await singleCompanyPreflight(client)});
 }catch(error){console.error({lifecyclePreflight:'blocked',...(error instanceof PreflightBlocked?{counts:error.counts}:{reason:'Connection, metadata or unrestricted read authorization unavailable'})});process.exitCode=1;
 }finally{client?.release();await pool?.end();}
}
