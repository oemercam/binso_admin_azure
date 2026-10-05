import pg from "pg";
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==="false"?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=="false"}});

const required={
 billing_checkout_sessions:["organization_id","request_key","stripe_session_id","plan","billing_interval","expires_at"],
 file_contents:["file_id","organization_id","body"],
 operating_costs:["id","organization_id","external_id","cost_date","amount","scope","is_demo"],
 platform_billing_payments:["id","organization_id","provider","external_id","payment_date","amount","currency"],
 active_time_trackers:["organization_id","user_id","state","active_since","accumulated_seconds","project_label","project_id"],
 organizations:["id","name","slug","status","currency","locale","is_demo"],
 app_users:["id","email","display_name","status","password_hash","language","email_verified_at","mfa_enabled","first_name","last_name","phone","job_title"],
 organization_memberships:["organization_id","user_id","email","role","status"],
 organization_subscriptions:["organization_id","plan","status","trial_until"],
 organization_entitlements:["organization_id","features","max_users","max_storage_mb"],
 platform_tenants:["organization_id","platform_status","owner_email"],
 auth_sessions:["id","user_id","organization_id","token_hash","expires_at","last_seen_at"],
 auth_tokens:["id","user_id","organization_id","email","token_hash","token_type","expires_at"],
 customers:["id","organization_id","external_id","customer_no","name","status","city","sector"],
 projects:["id","organization_id","external_id","customer_id","name","status"],
 quotes:["id","organization_id","external_id","quote_no","customer_id","status"],
 quote_lines:["id","organization_id","external_id","quote_id"],
 orders:["id","organization_id","external_id","customer_id","project_id","status"],
 products_services:["id","organization_id","external_id","name","status"],
 time_entries:["id","organization_id","external_id","project_id","customer_id","project_label","hours"],
 expenses:["id","organization_id","external_id","expense_date","status","category_label"],
 invoices:["id","organization_id","external_id","invoice_no","customer_id","status","qr_reference"],
 invoice_lines:["id","organization_id","external_id","invoice_id"],
 payments:["id","organization_id","external_id","amount","allocation_status"],
 suppliers:["id","organization_id","external_id","name","status"],
 supplier_invoices:["id","organization_id","external_id","supplier_id","status"],
 employees:["id","organization_id","external_id","name","first_name","last_name","active"],
 tasks:["id","organization_id","external_id","title","status"],
 absences:["id","organization_id","external_id","employee_id","status"],
 contracts:["id","organization_id","external_id","name","status"],
 accounting_entries:["id","organization_id","external_id","amount","status"],
 bank_transactions:["id","organization_id","external_id","amount","status"],
 vat_periods:["id","organization_id","external_id","period","status"],
 payroll_runs:["id","organization_id","external_id","period","status"],
 business_documents:["id","organization_id","external_id","name","status"],
 audit_events:["id","organization_id","actor_user_id","action","entity_type"],
 support_cases:["id","organization_id","case_number","created_by_user_id","status"],
 support_messages:["id","case_id","author_type","author_user_id","message"],
 file_objects:["id","organization_id","object_key","original_name","sha256","scan_status"],
 in_app_notifications:["id","organization_id","kind","title","body"],
 platform_feature_flags:["key","enabled"],
 platform_operator_assignments:["user_id","email","role","status"],
 rate_limit_buckets:["bucket_key","count","reset_at","updated_at"],
 schema_migrations:["version","checksum","applied_at"]
};
const tenantTables=["billing_checkout_sessions","customers","projects","quotes","quote_lines","orders","products_services","time_entries","expenses","invoices","invoice_lines","payments","suppliers","supplier_invoices","employees","tasks","absences","contracts","accounting_entries","bank_transactions","vat_periods","payroll_runs","business_documents","operating_costs","active_time_trackers","support_cases","in_app_notifications","file_objects"];
const forceTables=["billing_checkout_sessions","customers","projects","quotes","quote_lines","orders","products_services","time_entries","expenses","invoices","invoice_lines","payments","suppliers","supplier_invoices","employees","tasks","absences","contracts","accounting_entries","bank_transactions","vat_periods","payroll_runs","business_documents","operating_costs","active_time_trackers"];
try{
 const meta=await pool.query("select current_database() db,current_user db_user,current_schema() schema,now() now");
 const migrations=await pool.query("select version from schema_migrations order by version");
 const versions=migrations.rows.map(r=>r.version);
 if(!versions.includes("0016_self_service_signup.sql"))throw new Error("Canonical database lineage incomplete: 0016_self_service_signup.sql is not applied.");
 if(!versions.includes("0017_v150_code_schema_alignment.sql"))throw new Error("Database migration 0017_v150_code_schema_alignment.sql is not applied.");
 const cols=await pool.query(`select table_name,column_name from information_schema.columns where table_schema='public' and table_name=any($1::text[])`,[Object.keys(required)]);
 const found=new Map();for(const row of cols.rows){if(!found.has(row.table_name))found.set(row.table_name,new Set());found.get(row.table_name).add(row.column_name)}
 const missing=[];for(const [table,names] of Object.entries(required))for(const name of names)if(!found.get(table)?.has(name))missing.push(`${table}.${name}`);
 if(missing.length)throw new Error(`Canonical database schema incomplete. Missing: ${missing.join(", ")}`);
 const rls=await pool.query(`select relname,relrowsecurity,relforcerowsecurity from pg_class where relnamespace='public'::regnamespace and relname=any($1::text[])`,[tenantTables]);
 const secured=new Map(rls.rows.map(r=>[r.relname,{enabled:Boolean(r.relrowsecurity),forced:Boolean(r.relforcerowsecurity)}]));
 const rlsMissing=tenantTables.filter(t=>!secured.get(t)?.enabled);
 if(rlsMissing.length)throw new Error(`Tenant RLS is not enabled on: ${rlsMissing.join(", ")}`);
 const forceMissing=forceTables.filter(t=>!secured.get(t)?.forced);
 if(forceMissing.length)throw new Error(`Tenant FORCE RLS is not enabled on: ${forceMissing.join(", ")}`);
 const policies=await pool.query(`select tablename,count(*)::int count from pg_policies where schemaname='public' and tablename=any($1::text[]) group by tablename`,[tenantTables]);
 const policyMap=new Map(policies.rows.map(r=>[r.tablename,Number(r.count)]));
 const policyMissing=tenantTables.filter(t=>(policyMap.get(t)||0)<1);
 if(policyMissing.length)throw new Error(`Tenant RLS policy missing on: ${policyMissing.join(", ")}`);
 console.log({...meta.rows[0],lineage:"canonical-0001..0017",schema:"ok",checkedTables:Object.keys(required).length,rlsTables:tenantTables.length,migrations:versions.length});
}finally{await pool.end()}
