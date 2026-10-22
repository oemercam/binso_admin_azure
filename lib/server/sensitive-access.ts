import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from './session';
import {sensitiveCapabilities,type SensitiveCapability} from '@/lib/sensitive-access';
import {ApiError} from './http';
import {authorize} from './rbac';
import {withTenant} from './db';
import {organizationPlanInTransaction} from './plan-access';
import {planAllowsModule} from '@/config/plan-access';

/** UI hints only; protected data operations still recheck their exact grant. */
export async function currentSensitiveCapabilities(s:SessionUser){
 if(s.moduleProfile==='time_only'||s.isDemo)return [];
 authorize(s,'organization:read');
 return withTenant(s.organizationId,s.userId,async c=>(await c.query<{capability:SensitiveCapability}>('select capability from unnest($1::text[]) capability where app_has_sensitive_capability(capability)',[sensitiveCapabilities])).rows.map(row=>row.capability));
}

/** New sensitive APIs must check persisted grants on every operation, not a JWT/UI cache. */
export async function requireSensitiveCapability(s:SessionUser,capability:SensitiveCapability,c?:PoolClient){
 authorize(s,'organization:read');
 const writing=!capability.endsWith(':read');
 if(writing&&s.organizationStatus==='read_only')throw new ApiError(403,'read_only','Der Mandant ist schreibgeschützt.');
 if(writing&&!c)throw new Error('Sensitive writes require their business transaction client');
 if(s.moduleProfile==='time_only'||s.isDemo)throw new ApiError(403,'sensitive_access_required','Für diese sensiblen Daten fehlt das ausdrücklich vergebene Fachrecht.');
 const check=async(client:PoolClient)=>{
  if(!planAllowsModule(await organizationPlanInTransaction(client,s.organizationId),capability.startsWith('payroll:')?'lohn':'personal'))throw new ApiError(403,'module_unavailable','Diese Funktion ist in deinem aktuellen Plan nicht enthalten.');
  if(writing)await client.query("select user_id from organization_memberships where organization_id=$1 and user_id=$2 and status='active' for share",[s.organizationId,s.userId]);
  const row=(await client.query('select app_has_sensitive_capability($1) allowed',[capability])).rows[0];
  if(!row?.allowed)throw new ApiError(403,'sensitive_access_required','Für diese sensiblen Daten fehlt das ausdrücklich vergebene Fachrecht.');
 };
 if(c)return check(c);return withTenant(s.organizationId,s.userId,check);
}
