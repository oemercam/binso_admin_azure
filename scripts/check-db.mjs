import pg from "pg";
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==="false"?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=="false"}});
const required={
 organizations:["id","name","uid","plan","billing_cycle","subscription_status","trial_ends_at","onboarding_complete","terms_version","terms_accepted_at","privacy_version"],
 users:["id","organization_id","name","email","password_hash","role","email_verified_at","active"],
 sessions:["id","user_id","organization_id","token_hash","expires_at","user_agent","ip_hash","last_seen_at"],
 records:["id","organization_id","module","status","row_data","fields","metadata","created_by","updated_by"],
 auth_tokens:["id","user_id","organization_id","email","token_hash","token_type","expires_at"],
 rate_limit_buckets:["bucket_key","count","reset_at","updated_at"]
};
try{
 const meta=await pool.query("select current_database() db, now() now");
 const cols=await pool.query(`select table_name,column_name from information_schema.columns where table_schema='public' and table_name = any($1::text[])`,[Object.keys(required)]);
 const found=new Map();for(const row of cols.rows){if(!found.has(row.table_name))found.set(row.table_name,new Set());found.get(row.table_name).add(row.column_name)}
 const missing=[];for(const [table,names] of Object.entries(required)){for(const name of names){if(!found.get(table)?.has(name))missing.push(`${table}.${name}`)}}
 if(missing.length)throw new Error(`Database schema incomplete. Missing: ${missing.join(", ")}`);

 const rls=await pool.query(`select relname,relrowsecurity,relforcerowsecurity from pg_class where relnamespace='public'::regnamespace and relname=any($1::text[])`,[["records","customers","audit_logs"]]);
 const rlsByName=new Map(rls.rows.map(row=>[row.relname,row]));
 const records=rlsByName.get("records");
 if(!records?.relrowsecurity||!records?.relforcerowsecurity)throw new Error("Database security incomplete. records must have RLS enabled and forced.");

 const policies=await pool.query(`select tablename,policyname from pg_policies where schemaname='public' and tablename=any($1::text[])`,[["records"]]);
 if(!policies.rows.some(row=>row.tablename==="records"&&row.policyname==="records_tenant"))throw new Error("Database security incomplete. records_tenant policy is missing.");

 console.log({...meta.rows[0],schema:"ok",checkedTables:Object.keys(required).length,recordsRls:"forced",recordsPolicy:"records_tenant"});
}finally{await pool.end()}
