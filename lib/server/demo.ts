import "server-only";
import { cookies } from 'next/headers';
import { ApiError } from './http';
import { withTenant } from './db';
import type { PoolClient } from 'pg';
import type { SessionUser } from './session';
export const demoSession:SessionUser={sessionId:'demo',userId:'demo-readonly',organizationId:'00000000-0000-4000-8000-000000000099',email:'demo@example.invalid',name:'Demo',role:'owner'};
export async function withDemo<T>(fn:(c:PoolClient,s:SessionUser)=>Promise<T>){
 if((await cookies()).get('binso_demo')?.value!=='1')throw new ApiError(401,'demo_required','Demo starten.');
 return withTenant(demoSession.organizationId,demoSession.userId,async c=>{
  const found=await c.query('select id from organizations where id=$1 and is_demo=true',[demoSession.organizationId]);
  if(!found.rowCount)throw new ApiError(503,'demo_unavailable','Demo-Daten sind noch nicht verfügbar.');
  return fn(c,demoSession);
 });
}
