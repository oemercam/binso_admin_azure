import fs from 'node:fs/promises';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000,
 ssl:process.env.DATABASE_SSL==='false'?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=='false'}});
try {
 if(process.env.BINSO_EXPECTED_DB_ROLE){const role=(await pool.query('select current_user as role')).rows[0].role;if(role!==process.env.BINSO_EXPECTED_DB_ROLE)throw new Error('Actual database login does not match the expected runtime role');}
 await pool.query(await fs.readFile('scripts/sql/runtime-role-check.sql','utf8'));
 console.log('Runtime role privileges/ownership passed.');
} finally {await pool.end();}
// Reuse the canonical schema, tenant-policy and FORCE RLS gate.
if(!process.argv.includes('--runtime'))process.argv.push('--runtime');
await import('./check-db.mjs');
