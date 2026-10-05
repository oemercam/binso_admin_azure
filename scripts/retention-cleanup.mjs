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
  const result=await pool.query(text,params);
  return result.rowCount??0;
}

try{
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
    authArtifactRetentionDays:authDays,
    expiredSessionRetentionDays:sessionDays,
    deletedEmailCodes,
    deletedCustomerSessions,
    deletedOperatorSessions,
    clearedPendingMfa
  }));
}finally{
  await pool.end();
}
