import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {captureSchema,migrationFiles} from './schema-contract.mjs';
const db=new PGlite({extensions:{pgcrypto}});
try{
 await db.exec('create extension pgcrypto; create role schema_owner; grant usage,create on schema public to schema_owner; set role schema_owner');
 const migrations=await migrationFiles();
 for(const name of migrations)await db.exec(await fs.readFile('database/migrations/'+name,'utf8'));
 const contract={version:1,migrations,tables:await captureSchema(db)};
 const target='database/schema-contract.json',output=JSON.stringify(contract,null,2)+'\n';
 if(process.argv.includes('--write'))await fs.writeFile(target,output);
 else if(await fs.readFile(target,'utf8')!==output)throw Error('Schema contract is stale; regenerate and review every schema/security change.');
 console.log('Complete schema contract: '+contract.tables.length+' tables, '+migrations.length+' migrations.');
}finally{await db.close();}
