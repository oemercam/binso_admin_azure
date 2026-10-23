import 'server-only';
import type {SessionUser} from './session';
import type {PoolClient} from 'pg';
import {withTenant} from './db';
import {ApiError} from './http';

/** A recent, explicit proof bound to this active user, company and session. */
export async function requireFreshAuthentication(session:SessionUser,transactionClient?:PoolClient){
 const verify=async(client:PoolClient)=>(await client.query(
  "select 1 from auth_sessions where id=$1 and user_id=$2 and organization_id=$3 and expires_at>now() and step_up_at>now()-interval '5 minutes' and step_up_at<=now()"+(transactionClient?' for key share':''),
  [session.sessionId,session.userId,session.organizationId]
 )).rows.length===1;
 const verified=transactionClient?await verify(transactionClient):await withTenant(session.organizationId,session.userId,verify);
 if(!verified)throw new ApiError(403,'fresh_authentication_required','Bitte bestätige diese sicherheitsrelevante Aktion erneut.');
}
