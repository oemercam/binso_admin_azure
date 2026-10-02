import {createHash,randomBytes} from "node:crypto";
import {getDatabase} from "./db";
import {hashPassword,verifyPassword} from "./password";
import type {UserRole} from "./domain";

export type AuthenticatedSession={
  sessionId:string;
  userId:string;
  organisationId:string;
  role:UserRole;
  expiresAt:string;
};

const SESSION_DAYS=30;

function normalizeEmail(value:string){return value.trim().toLowerCase()}
function tokenHash(value:string){return createHash("sha256").update(value).digest("hex")}
function opaqueToken(){return randomBytes(32).toString("base64url")}
function slugBase(name:string){
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"organisation";
}

export async function registerAccount(input:{name:string;email:string;password:string;organisationName:string}){
  const db=getDatabase();
  const email=normalizeEmail(input.email);
  const passwordHash=await hashPassword(input.password);
  return db.transaction(async tx=>{
    const existing=await tx.query<{id:string}>("SELECT id FROM users WHERE email_normalized=$1 LIMIT 1",[email]);
    if(existing.length)throw new Error("ACCOUNT_EXISTS");
    const userRows=await tx.query<{id:string}>(
      "INSERT INTO users(email,email_normalized,name,password_hash) VALUES($1,$2,$3,$4) RETURNING id",
      [input.email.trim(),email,input.name.trim(),passwordHash]
    );
    const userId=userRows[0]!.id;
    const slug=`${slugBase(input.organisationName)}-${randomBytes(4).toString("hex")}`;
    const orgRows=await tx.query<{id:string}>(
      "INSERT INTO organisations(name,slug) VALUES($1,$2) RETURNING id",
      [input.organisationName.trim(),slug]
    );
    const organisationId=orgRows[0]!.id;
    await tx.query(
      "INSERT INTO memberships(organisation_id,user_id,role,status) VALUES($1,$2,'owner','active')",
      [organisationId,userId]
    );
    await tx.query(
      "INSERT INTO subscriptions(organisation_id,plan,status,trial_ends_at) VALUES($1,'starter','Trial',now()+interval '30 days')",
      [organisationId]
    );
    const verifyToken=opaqueToken();
    await tx.query(
      "INSERT INTO auth_tokens(user_id,kind,token_hash,expires_at) VALUES($1,'email_verification',$2,now()+interval '24 hours')",
      [userId,tokenHash(verifyToken)]
    );
    return {userId,organisationId,verifyToken};
  });
}

export async function authenticate(emailInput:string,password:string){
  const db=getDatabase();
  const email=normalizeEmail(emailInput);
  const rows=await db.query<{id:string;password_hash:string|null;disabled_at:string|null}>(
    "SELECT id,password_hash,disabled_at FROM users WHERE email_normalized=$1 LIMIT 1",[email]
  );
  const user=rows[0];
  if(!user||user.disabled_at||!user.password_hash)return null;
  if(!(await verifyPassword(password,user.password_hash)))return null;
  const memberships=await db.query<{organisation_id:string;role:UserRole}>(
    "SELECT organisation_id,role FROM memberships WHERE user_id=$1 AND status='active' ORDER BY created_at LIMIT 1",[user.id]
  );
  const membership=memberships[0];
  if(!membership)return null;
  await db.query("UPDATE users SET last_login_at=now(),updated_at=now() WHERE id=$1",[user.id]);
  return {userId:user.id,organisationId:membership.organisation_id,role:membership.role};
}

export async function createSession(input:{userId:string;organisationId:string;userAgent?:string|null;ip?:string|null}){
  const db=getDatabase();
  const token=opaqueToken();
  const expiresAt=new Date(Date.now()+SESSION_DAYS*86400000).toISOString();
  const userAgentHash=input.userAgent?tokenHash(input.userAgent):null;
  const ipHash=input.ip?tokenHash(input.ip):null;
  const rows=await db.query<{id:string}>(
    `INSERT INTO auth_sessions(user_id,organisation_id,token_hash,expires_at,user_agent_hash,ip_hash)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
    [input.userId,input.organisationId,tokenHash(token),expiresAt,userAgentHash,ipHash]
  );
  return {token,sessionId:rows[0]!.id,expiresAt};
}

export async function resolveSession(token:string):Promise<AuthenticatedSession|null>{
  const db=getDatabase();
  const rows=await db.query<AuthenticatedSession>(
    `SELECT s.id AS "sessionId",s.user_id AS "userId",s.organisation_id AS "organisationId",
            m.role,s.expires_at AS "expiresAt"
       FROM auth_sessions s
       JOIN memberships m ON m.user_id=s.user_id AND m.organisation_id=s.organisation_id
      WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND m.status='active'
      LIMIT 1`,
    [tokenHash(token)]
  );
  if(!rows[0])return null;
  await db.query("UPDATE auth_sessions SET last_seen_at=now() WHERE id=$1",[rows[0].sessionId]);
  return rows[0];
}

export async function revokeSession(token:string){
  await getDatabase().query("UPDATE auth_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL",[tokenHash(token)]);
}

export async function revokeAllSessions(userId:string,exceptSessionId?:string){
  if(exceptSessionId){
    await getDatabase().query(
      "UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND id<>$2 AND revoked_at IS NULL",
      [userId,exceptSessionId]
    );
  }else{
    await getDatabase().query("UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL",[userId]);
  }
}

export async function issuePasswordReset(emailInput:string){
  const db=getDatabase();
  const email=normalizeEmail(emailInput);
  const users=await db.query<{id:string}>("SELECT id FROM users WHERE email_normalized=$1 AND disabled_at IS NULL LIMIT 1",[email]);
  if(!users[0])return null;
  const token=opaqueToken();
  await db.query(
    `INSERT INTO auth_tokens(user_id,kind,token_hash,expires_at)
     VALUES($1,'password_reset',$2,now()+interval '1 hour')`,
    [users[0].id,tokenHash(token)]
  );
  return token;
}

export async function resetPassword(token:string,password:string){
  const db=getDatabase();
  const passwordHash=await hashPassword(password);
  return db.transaction(async tx=>{
    const rows=await tx.query<{id:string;user_id:string}>(
      `SELECT id,user_id FROM auth_tokens
        WHERE kind='password_reset' AND token_hash=$1 AND used_at IS NULL AND expires_at>now()
        FOR UPDATE`,[tokenHash(token)]
    );
    const record=rows[0];
    if(!record)return false;
    await tx.query("UPDATE users SET password_hash=$1,updated_at=now() WHERE id=$2",[passwordHash,record.user_id]);
    await tx.query("UPDATE auth_tokens SET used_at=now() WHERE id=$1",[record.id]);
    await tx.query("UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL",[record.user_id]);
    return true;
  });
}

export async function verifyEmail(token:string){
  const db=getDatabase();
  return db.transaction(async tx=>{
    const rows=await tx.query<{id:string;user_id:string}>(
      `SELECT id,user_id FROM auth_tokens
        WHERE kind='email_verification' AND token_hash=$1 AND used_at IS NULL AND expires_at>now()
        FOR UPDATE`,[tokenHash(token)]
    );
    const record=rows[0];
    if(!record)return false;
    await tx.query("UPDATE users SET email_verified_at=COALESCE(email_verified_at,now()),updated_at=now() WHERE id=$1",[record.user_id]);
    await tx.query("UPDATE auth_tokens SET used_at=now() WHERE id=$1",[record.id]);
    return true;
  });
}
