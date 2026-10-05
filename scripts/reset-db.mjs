import pg from "pg";

const url=process.env.DATABASE_URL;
if(!url) throw new Error("DATABASE_URL is required.");
const confirmation=process.env.ALLOW_DATABASE_RESET;
if(confirmation!=="I_UNDERSTAND_THIS_DELETES_ALL_DATA") throw new Error("Refusing database reset: explicit destructive confirmation is required.");

const parsed=new URL(url);
const productionHost="binso-platform-db.postgres.database.azure.com";
if(parsed.hostname===productionHost) throw new Error("Refusing database reset: the production PostgreSQL server can never be reset by this script.");
const expectedHost=process.env.EXPECTED_DATABASE_HOST?.trim();
if(!expectedHost) throw new Error("EXPECTED_DATABASE_HOST is required for non-production reset.");
if(parsed.hostname!==expectedHost) throw new Error(`Refusing database reset for unexpected host: ${parsed.hostname}`);
const expectedDatabase=process.env.EXPECTED_DATABASE_NAME?.trim();
if(!expectedDatabase) throw new Error("EXPECTED_DATABASE_NAME is required for non-production reset.");
const database=parsed.pathname.replace(/^\//,"");
if(database!==expectedDatabase) throw new Error(`Refusing database reset for unexpected database: ${database}`);

const pool=new pg.Pool({
  connectionString:url,
  ssl:process.env.DATABASE_SSL==="false"?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=="false"},
  max:1,
  connectionTimeoutMillis:15_000,
});
try{
  const identity=await pool.query("select current_database() as database,current_user as db_user");
  if(identity.rows[0]?.database!==expectedDatabase) throw new Error("Connected database does not match EXPECTED_DATABASE_NAME.");
  console.log({host:parsed.hostname,database:identity.rows[0].database,dbUser:identity.rows[0].db_user});
  await pool.query("drop schema if exists public cascade");
  await pool.query("create schema public");
  await pool.query("grant usage,create on schema public to current_user");
  console.log("Database schema reset completed. No application data remains.");
}finally{
  await pool.end();
}
