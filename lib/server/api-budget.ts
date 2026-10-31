import 'server-only';
import {getSessionByToken} from './session';
import {withTenant} from './db';
import {ApiError} from './http';

/** Budget business requests, never login, recovery, subscription or support.
 * The proxy invokes this once; nested repository/session reads cannot double bill. */
export function isBudgetedApi(path:string){
 return path.startsWith('/api/')&&!['auth','billing','operator','demo','health','public','support','settings','telemetry','notifications','integrations'].some(area=>path==='/api/'+area||path.startsWith('/api/'+area+'/'));
}
export async function requireApiBudget(token:string|undefined){
 const session=await getSessionByToken(token);
 if(!session)return;
 const allowed=await withTenant(session.organizationId,session.userId,async c=>
  (await c.query<{allowed:boolean}>('select consume_organization_api_request() allowed')).rows[0]?.allowed===true);
 if(!allowed)throw new ApiError(429,'api_quota_exceeded','Das monatliche Anfragekontingent ist ausgeschöpft. Konto, Abonnement und Support bleiben erreichbar.');
}
