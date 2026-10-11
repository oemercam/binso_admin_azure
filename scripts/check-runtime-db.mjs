import fs from 'node:fs/promises';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000,
 ssl:process.env.DATABASE_SSL==='false'?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=='false'}});
try {
 await pool.query(await fs.readFile('scripts/sql/runtime-role-check.sql','utf8'));
 console.log('Runtime role privileges/ownership passed.');
} finally {await pool.end();}
// Reuse the canonical schema, tenant-policy and FORCE RLS gate.
await import('./check-db.mjs');
