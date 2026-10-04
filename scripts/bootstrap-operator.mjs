import pg from 'pg';
import crypto from 'node:crypto';
const {DATABASE_URL,OPERATOR_EMAIL,OPERATOR_PASSWORD}=process.env;
if(!DATABASE_URL||!OPERATOR_EMAIL||!OPERATOR_PASSWORD||OPERATOR_PASSWORD.length<12)throw new Error('DATABASE_URL, OPERATOR_EMAIL and a password of at least 12 characters are required.');
const salt=crypto.randomBytes(16).toString('hex');
const hash=crypto.scryptSync(OPERATOR_PASSWORD,salt,64).toString('hex');
const pool=new pg.Pool({connectionString:DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?undefined:{rejectUnauthorized:true}});
try{
 await pool.query("insert into platform_operator_assignments(user_id,email,role,status,display_name,password_hash) values($1,$2,'platform_owner','active',$2,$3) on conflict do nothing",['operator-'+crypto.randomUUID(),OPERATOR_EMAIL.toLowerCase(),'scrypt$'+salt+'$'+hash]);
 console.log('Operator bootstrap completed; existing accounts were preserved.');
}finally{await pool.end()}
