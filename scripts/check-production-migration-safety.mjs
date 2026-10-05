import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const url=process.env.DATABASE_URL?.trim();
if(!url)throw new Error("DATABASE_URL is required.");
const parsed=new URL(url);
const expectedHost=process.env.EXPECTED_DATABASE_HOST?.trim();
const expectedDatabase=process.env.EXPECTED_DATABASE_NAME?.trim();
if(!expectedHost||!expectedDatabase)throw new Error("EXPECTED_DATABASE_HOST and EXPECTED_DATABASE_NAME are required for production migration safety checks.");
if(parsed.hostname!==expectedHost)throw new Error(`Refusing production migration for unexpected database host: ${parsed.hostname}`);
const database=parsed.pathname.replace(/^\//,"");
if(database!==expectedDatabase)throw new Error(`Refusing production migration for unexpected database: ${database}`);

const ssl=process.env.DATABASE_SSL==="false"?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=="false"};
const pool=new pg.Pool({connectionString:url,ssl,max:1,connectionTimeoutMillis:15_000});
const divergent=new Set([
 "001_initial.sql","002_permissions_operator.sql","003_pilot_support_legal.sql","004_support_diagnostics.sql",
 "005_production_readiness.sql","006_organization_settings.sql","007_support_attachments.sql","008_locale_turkish.sql","009_platform_foundation.sql"
]);
const forbidden=[
 {label:"DROP object/column",re:/\bdrop\s+(?:table|schema|database|column|type)\b/i},
 {label:"TRUNCATE",re:/\btruncate\b/i},
 {label:"direct DELETE",re:/\bdelete\s+from\b/i},
 {label:"breaking RENAME",re:/\balter\s+table[\s\S]{0,300}\brename\b/i},
 {label:"DROP through ALTER TABLE",re:/\balter\s+table[\s\S]{0,300}\bdrop\b/i},
 {label:"column TYPE rewrite",re:/\balter\s+table[\s\S]{0,300}\balter\s+column[\s\S]{0,200}\btype\b/i},
];

try{
 const identity=await pool.query("select current_database() as database,current_user as db_user");
 if(identity.rows[0]?.database!==expectedDatabase)throw new Error("Connected production database identity does not match EXPECTED_DATABASE_NAME.");
 const table=await pool.query("select to_regclass('public.schema_migrations') as name");
 if(!table.rows[0]?.name)throw new Error("Production schema_migrations table is missing. Refusing automatic production migration.");
 const appliedResult=await pool.query("select version from schema_migrations order by version");
 const applied=new Set(appliedResult.rows.map(row=>row.version));
 const files=(await fs.readdir("database/migrations")).filter(x=>x.endsWith(".sql")).sort();
 const pending=[];
 const violations=[];
 for(const file of files){
   if(divergent.has(file)||applied.has(file))continue;
   const sql=await fs.readFile(path.join("database/migrations",file),"utf8");
   pending.push(file);
   for(const rule of forbidden)if(rule.re.test(sql))violations.push(`${file}: ${rule.label}`);
 }
 if(violations.length){
   throw new Error("Destructive or breaking production migration blocked. Use an explicitly reviewed maintenance procedure instead of automatic deploy:\n"+violations.join("\n"));
 }
 console.log(JSON.stringify({database:expectedDatabase,host:expectedHost,pendingMigrations:pending}));
 console.log("Production migration safety gate passed.");
}finally{
 await pool.end();
}
