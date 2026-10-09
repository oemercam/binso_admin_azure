import "server-only";
import { cookies } from 'next/headers';
import { ApiError } from './http';
import { withTenant } from './db';
import type { PoolClient } from 'pg';
import {getSession,type SessionUser} from './session';
export const demoSession:SessionUser={sessionId:'demo',userId:'demo-readonly',organizationId:'00000000-0000-4000-8000-000000000099',email:'demo@example.invalid',name:'Demo',role:'owner',mfaEnabled:false};
export async function withDemo<T>(fn:(c:PoolClient,s:SessionUser)=>Promise<T>){
 if((await cookies()).get('binso_demo')?.value!=='1')throw new ApiError(401,'demo_required','Demo starten.');
 const session=await getSession();
 const current=session?.isDemo?session:demoSession;
 return withTenant(current.organizationId,current.userId,async c=>{
  const found=await c.query('select id from organizations where id=$1 and is_demo=true',[current.organizationId]);
  if(!found.rowCount)throw new ApiError(503,'demo_unavailable','Demo-Daten sind noch nicht verfügbar.');
  return fn(c,current);
 },{snapshot:true});
}
