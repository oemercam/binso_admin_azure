import pg from "pg";

const {Pool}=pg;
const databaseUrl=process.env.DATABASE_URL?.trim();
if(!databaseUrl)throw new Error("DATABASE_URL is required.");
const parsedUrl=new URL(databaseUrl);
const expectedHost=process.env.EXPECTED_DATABASE_HOST?.trim();
const expectedDatabase=process.env.EXPECTED_DATABASE_NAME?.trim();
if(!expectedHost||!expectedDatabase)throw new Error("EXPECTED_DATABASE_HOST and EXPECTED_DATABASE_NAME are required for production retention.");
if(parsedUrl.hostname!==expectedHost)throw new Error("Refusing retention cleanup for unexpected database host: "+parsedUrl.hostname);
if(parsedUrl.pathname.replace(/^\//,"")!==expectedDatabase)throw new Error("Refusing retention cleanup for unexpected database name.");

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
const maxDeleteRows=int("RETENTION_MAX_DELETE_ROWS",10000,1,1000000);
const ssl=bool("DATABASE_SSL",true);
const rejectUnauthorized=bool("DATABASE_SSL_REJECT_UNAUTHORIZED",true);
const pool=new Pool({
  connectionString:databaseUrl,
  ssl:ssl?{rejectUnauthorized}:undefined,
  max:1,
  connectionTimeoutMillis:8000
});

try{
  const identity=await pool.query("select current_database() as database");
  if(identity.rows[0]?.database!==expectedDatabase)throw new Error("Connected database does not match EXPECTED_DATABASE_NAME.");
  await pool.query("select pg_advisory_lock(hashtext($1))",["binso-one-retention-cleanup"]);
  try{
    const candidates={
      emailCodes:Number((await pool.query(
        `select count(*)::int count from auth_email_codes
          where (consumed_at is not null and consumed_at < now()-($1||' days')::interval)
             or (expires_at < now()-($1||' days')::interval)`,
        [String(authDays)]
      )).rows[0]?.count??0),
      customerSessions:Number((await pool.query(
        `select count(*)::int count from auth_sessions where expires_at < now()-($1||' days')::interval`,
        [String(sessionDays)]
      )).rows[0]?.count??0),
      operatorSessions:Number((await pool.query(
        `select count(*)::int count from platform_auth_sessions where expires_at < now()-($1||' days')::interval`,
        [String(sessionDays)]
      )).rows[0]?.count??0),
      pendingMfa:Number((await pool.query(
        `select count(*)::int count from app_users
          where mfa_pending_expires_at is not null
            and mfa_pending_expires_at < now()`
      )).rows[0]?.count??0),
    };
    const totalCandidates=Object.values(candidates).reduce((sum,value)=>sum+value,0);
    console.log(JSON.stringify({preview:true,authArtifactRetentionDays:authDays,expiredSessionRetentionDays:sessionDays,maxDeleteRows,candidates,totalCandidates}));
    if(totalCandidates>maxDeleteRows){
      throw new Error(`Retention cleanup blocked: ${totalCandidates} rows exceed RETENTION_MAX_DELETE_ROWS=${maxDeleteRows}. Review manually before raising the cap.`);
    }

    const client=await pool.connect();
    try{
      await client.query("begin");
      await client.query("set local lock_timeout = '10s'");
      await client.query("set local statement_timeout = '5min'");
      const deletedEmailCodes=(await client.query(
        `delete from auth_email_codes
          where (consumed_at is not null and consumed_at < now()-($1||' days')::interval)
             or (expires_at < now()-($1||' days')::interval)`,
        [String(authDays)]
      )).rowCount??0;
      const deletedCustomerSessions=(await client.query(
        `delete from auth_sessions where expires_at < now()-($1||' days')::interval`,
        [String(sessionDays)]
      )).rowCount??0;
      const deletedOperatorSessions=(await client.query(
        `delete from platform_auth_sessions where expires_at < now()-($1||' days')::interval`,
        [String(sessionDays)]
      )).rowCount??0;
      const clearedPendingMfa=(await client.query(
        `update app_users
            set mfa_pending_secret_enc=null,mfa_pending_expires_at=null
          where mfa_pending_expires_at is not null
            and mfa_pending_expires_at < now()`
      )).rowCount??0;
      await client.query("commit");
      console.log(JSON.stringify({
        authArtifactRetentionDays:authDays,
        expiredSessionRetentionDays:sessionDays,
        deletedEmailCodes,
        deletedCustomerSessions,
        deletedOperatorSessions,
        clearedPendingMfa
      }));
    }catch(error){
      await client.query("rollback");
      throw error;
    }finally{
      client.release();
    }
  }finally{
    try{await pool.query("select pg_advisory_unlock(hashtext($1))",["binso-one-retention-cleanup"]);}catch{}
  }
}finally{
  await pool.end();
}
