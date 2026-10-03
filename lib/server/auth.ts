import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {createHash,randomBytes} from "node:crypto";
import {ApiError} from "./http";
import {query,withPrivileged} from "./db";
import {hashPassword,verifyPassword} from "./password";
import {sendEmail} from "./email";
import {getBackendEnv} from "./env";

const accessCookie="binso_access_token",refreshCookie="binso_refresh_token";
type AppUser={id:string;email?:string;user_metadata?:Record<string,unknown>};
export type TokenResponse={access_token:string;refresh_token:string;expires_in:number;user:AppUser};
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const token=()=>randomBytes(32).toString("base64url");

async function createSession(user:AppUser):Promise<TokenResponse>{
 const access=token(),refresh=token(),expiresIn=60*60;
 await query(`insert into auth_sessions(user_id,access_hash,refresh_hash,expires_at,refresh_expires_at)
 values($1,$2,$3,now()+interval '1 hour',now()+interval '30 days')`,[user.id,hash(access),hash(refresh)]);
 return {access_token:access,refresh_token:refresh,expires_in:expiresIn,user};
}
export async function passwordLogin(email:string,password:string):Promise<TokenResponse>{
 const r=await query<{id:string;email:string;password_hash:string;raw_user_meta_data:Record<string,unknown>;email_confirmed_at:Date|null}>(`select id,email,password_hash,raw_user_meta_data,email_confirmed_at from auth.users where lower(email)=lower($1) limit 1`,[email]);
 const row=r.rows[0];if(!row||!row.email_confirmed_at||!(await verifyPassword(password,row.password_hash)))throw new ApiError(401,"invalid_credentials","E-Mail oder Passwort ist nicht korrekt.");
 return createSession({id:row.id,email:row.email,user_metadata:row.raw_user_meta_data});
}
export async function signUp(email:string,password:string,companyName:string){
 const passwordHash=await hashPassword(password);let user:AppUser;
 try{user=await withPrivileged(async client=>{const r=await client.query<{id:string;email:string;raw_user_meta_data:Record<string,unknown>}>(`insert into auth.users(email,password_hash,raw_user_meta_data) values(lower($1),$2,jsonb_build_object('company_name',$3)) returning id,email,raw_user_meta_data`,[email,passwordHash,companyName]);return {id:r.rows[0].id,email:r.rows[0].email,user_metadata:r.rows[0].raw_user_meta_data};});}
 catch(error){if((error as {code?:string})?.code==="23505")throw new ApiError(400,"signup_failed","Registrierung konnte nicht abgeschlossen werden. Prüfe deine Angaben oder melde dich an.");throw error;}
 const verify=token();await query(`insert into auth_tokens(user_id,token_hash,token_type,expires_at) values($1,$2,'verify_email',now()+interval '24 hours')`,[user.id,hash(verify)]);
 const base=(process.env.NEXT_PUBLIC_APP_URL??"http://localhost:3000").replace(/\/$/,"");
 await sendEmail({to:email,subject:"Binso One – E-Mail bestätigen",html:`<p>Bestätige deine E-Mail-Adresse für Binso One.</p><p><a href="${base}/api/auth/verify-email?token=${encodeURIComponent(verify)}">E-Mail bestätigen</a></p>`,text:`E-Mail bestätigen: ${base}/api/auth/verify-email?token=${encodeURIComponent(verify)}`});
 return {user};
}
export async function requestPasswordRecovery(email:string,redirectTo:string){
 const r=await query<{id:string;email:string}>(`select id,email from auth.users where lower(email)=lower($1) and email_confirmed_at is not null limit 1`,[email]);const user=r.rows[0];if(!user)return;
 const access=token(),refresh=token();await query(`insert into auth_recovery_sessions(user_id,access_hash,refresh_hash,expires_at) values($1,$2,$3,now()+interval '1 hour')`,[user.id,hash(access),hash(refresh)]);
 const url=`${redirectTo}#access_token=${encodeURIComponent(access)}&refresh_token=${encodeURIComponent(refresh)}&expires_in=3600`;
 await sendEmail({to:user.email,subject:"Binso One – Passwort zurücksetzen",html:`<p><a href="${url}">Passwort zurücksetzen</a></p>`,text:`Passwort zurücksetzen: ${url}`});
}
export async function updatePassword(accessToken:string,password:string){
 const user=await fetchUser(accessToken);const passwordHash=await hashPassword(password);await query(`update auth.users set password_hash=$1,updated_at=now() where id=$2`,[passwordHash,user.id]);await query(`delete from auth_sessions where user_id=$1`,[user.id]);await query(`delete from auth_recovery_sessions where user_id=$1`,[user.id]);return user;
}
export async function fetchUser(accessToken:string):Promise<AppUser>{
 const h=hash(accessToken);
 const r=await query<{id:string;email:string;raw_user_meta_data:Record<string,unknown>}>(`select u.id,u.email,u.raw_user_meta_data from auth.users u where u.id=coalesce((select s.user_id from auth_sessions s where s.access_hash=$1 and s.expires_at>now()),(select r.user_id from auth_recovery_sessions r where r.access_hash=$1 and r.expires_at>now())) limit 1`,[h]);
 if(!r.rows[0])throw new ApiError(401,"unauthorized","Nicht angemeldet.");return {id:r.rows[0].id,email:r.rows[0].email,user_metadata:r.rows[0].raw_user_meta_data};
}
export async function refreshSession(refreshToken:string):Promise<TokenResponse>{
 const h=hash(refreshToken);const r=await query<{id:string;email:string;raw_user_meta_data:Record<string,unknown>}>(`select u.id,u.email,u.raw_user_meta_data from auth.users u join auth_sessions s on s.user_id=u.id where s.refresh_hash=$1 and s.refresh_expires_at>now() limit 1`,[h]);if(!r.rows[0])throw new ApiError(401,"session_expired","Sitzung abgelaufen.");await query("delete from auth_sessions where refresh_hash=$1",[h]);return createSession({id:r.rows[0].id,email:r.rows[0].email,user_metadata:r.rows[0].raw_user_meta_data});
}
export async function getAccessToken(){return (await cookies()).get(accessCookie)?.value??null}
export async function requireUserNoRefresh(){const t=(await cookies()).get(accessCookie)?.value;if(!t)throw new ApiError(401,"unauthorized","Nicht angemeldet.");return {user:await fetchUser(t),token:t};}
export async function requireUser(){const store=await cookies();const t=store.get(accessCookie)?.value;if(t){try{return {user:await fetchUser(t),token:t};}catch(error){if(!(error instanceof ApiError)||error.status!==401)throw error;}}const r=store.get(refreshCookie)?.value;if(!r)throw new ApiError(401,"unauthorized","Nicht angemeldet.");const s=await refreshSession(r);const secure=process.env.NODE_ENV==="production";store.set(accessCookie,s.access_token,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:s.expires_in});store.set(refreshCookie,s.refresh_token,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:2592000});return {user:s.user,token:s.access_token};}
export function setAuthCookies(response:NextResponse,s:TokenResponse){const secure=process.env.NODE_ENV==="production";response.cookies.set(accessCookie,s.access_token,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:s.expires_in});response.cookies.set(refreshCookie,s.refresh_token,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:2592000});response.cookies.set("binso_demo","",{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:0});}
export async function revokeCurrentSession(accessToken:string|null){if(accessToken)await query("delete from auth_sessions where access_hash=$1",[hash(accessToken)]);}
export function clearAuthCookies(response:NextResponse){response.cookies.set(accessCookie,"",{httpOnly:true,path:"/",maxAge:0});response.cookies.set(refreshCookie,"",{httpOnly:true,path:"/",maxAge:0});response.cookies.set("binso_demo","",{httpOnly:true,path:"/",maxAge:0});}
export {accessCookie,refreshCookie};
