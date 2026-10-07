import pg from "pg";

const {Pool}=pg;
const databaseUrl=process.env.DATABASE_URL?.trim();
if(!databaseUrl)throw new Error("DATABASE_URL is required.");

function int(name,fallback,min,max){
  const raw=process.env[name]?.trim();
  const value=raw?Number(raw):fallback;
  if(!Number.isInteger(value)||value<min||value>max)throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  return value;
}
function bool(name,fallback){
  const raw=process.env[name]?.trim();
  if(!raw)return fallback;
  return ["1","true","yes","on"].includes(raw.toLowerCase());
}

const dryRun=bool("RETENTION_DRY_RUN",false);

const authDays=int("AUTH_ARTIFACT_RETENTION_DAYS",7,1,90);
const sessionDays=int("EXPIRED_SESSION_RETENTION_DAYS",30,1,365);
const ssl=bool("DATABASE_SSL",true);
const rejectUnauthorized=bool("DATABASE_SSL_REJECT_UNAUTHORIZED",true);
const pool=new Pool({
  connectionString:databaseUrl,
  ssl:ssl?{rejectUnauthorized}:undefined,
  max:1,
  connectionTimeoutMillis:8000
});

async function count(text,params=[]){
  if(dryRun){
    const query=text.startsWith("delete from ")
      ? text.replace(/^delete from /,"select count(*)::int as count from ")
      : `select count(*)::int as count from app_users where mfa_pending_expires_at is not null and mfa_pending_expires_at < now()`;
    const result=await pool.query(query,params);
    return result.rows[0].count;
  }
  const result=await pool.query(text,params);
  return result.rowCount??0;
}

try{
  if(dryRun)await pool.query("BEGIN READ ONLY");
  const deletedEmailCodes=await count(
    `delete from auth_email_codes
      where (consumed_at is not null and consumed_at < now()-($1||' days')::interval)
         or (expires_at < now()-($1||' days')::interval)`,
    [String(authDays)]
  );
  const deletedCustomerSessions=await count(
    `delete from auth_sessions where expires_at < now()-($1||' days')::interval`,
    [String(sessionDays)]
  );
  const deletedOperatorSessions=await count(
    `delete from platform_auth_sessions where expires_at < now()-($1||' days')::interval`,
    [String(sessionDays)]
  );
  const clearedPendingMfa=await count(
    `update app_users
        set mfa_pending_secret_enc=null,mfa_pending_expires_at=null
      where mfa_pending_expires_at is not null
        and mfa_pending_expires_at < now()`
  );
  console.log(JSON.stringify({
    dryRun,
    authArtifactRetentionDays:authDays,
    expiredSessionRetentionDays:sessionDays,
    deletedEmailCodes,
    deletedCustomerSessions,
    deletedOperatorSessions,
    clearedPendingMfa
  }));
}finally{
  if(dryRun)await pool.query("ROLLBACK");
  await pool.end();
}
