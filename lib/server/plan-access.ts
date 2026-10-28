import "server-only";
import type {PoolClient} from 'pg';
import {ApiError} from './http';
import {withTenant} from "@/lib/server/db";
import {isPlanId,planAllowsModule,planLimits,type PlanId} from "@/config/plan-access";
import {capacityReached} from '@/config/plans';

function appPlan(value:string):PlanId{
 const mapped=value==="starter"?"start":value==="professional"||value==="enterprise"?"pro":value;
 if(!isPlanId(mapped))throw new Response("Organization plan not found",{status:403});
 return mapped;
}

export async function organizationPlanInTransaction(client:PoolClient,organizationId:string):Promise<PlanId>{
 const result=await client.query<{plan:string}>(`select plan from organization_subscriptions where organization_id=$1 limit 1`,[organizationId]);
 return appPlan(result.rows[0]?.plan||"");
}
export async function getOrganizationPlan(organizationId:string):Promise<PlanId>{return withTenant(organizationId,'',client=>organizationPlanInTransaction(client,organizationId));}

export async function requireModuleEntitlement(organizationId:string,moduleKey:string,transaction?:PoolClient){
 const plan=await (transaction?organizationPlanInTransaction(transaction,organizationId):getOrganizationPlan(organizationId));
 assertModuleEntitlement(plan,moduleKey);
 return plan;
}

/** Reuse an already verified database plan within the same request. */
export function assertModuleEntitlement(plan:PlanId,moduleKey:string){
 if(!planAllowsModule(plan,moduleKey))throw new Response("Diese Funktion ist in deinem aktuellen Plan nicht enthalten.",{status:403});
}

export async function requireProjectCapacity(organizationId:string,userId:string,transaction?:PoolClient){
 const check=async(client:PoolClient)=>{
  // Serialize creations per tenant; checking outside the write transaction races.
  await client.query('select id from organizations where id=$1 for update',[organizationId]);
  const subscription=await client.query<{plan:string}>('select plan from organization_subscriptions where organization_id=$1',[organizationId]);
  const plan=appPlan(subscription.rows[0]?.plan||'');
  const result=await client.query<{count:number}>('select count(*)::int as count from projects where organization_id=$1 and archived_at is null',[organizationId]);
  if(capacityReached(Number(result.rows[0]?.count??0),planLimits[plan].projects))throw new ApiError(409,'project_limit','Das Auftragslimit deines aktuellen Plans ist erreicht.');
  return plan;
 };
 return transaction?check(transaction):withTenant(organizationId,userId,check);
}

export async function requireUserCapacity(organizationId:string){
 const plan=await getOrganizationPlan(organizationId);
 const count=await withTenant(organizationId,'',client=>client.query<{count:number}>(`select count(*)::int as count from organization_memberships where organization_id=$1 and status='active'`,[organizationId]));
 if(capacityReached(count.rows[0]?.count??0,planLimits[plan].users))throw new Response("Das Benutzerlimit deines aktuellen Plans ist erreicht.",{status:409});
 return plan;
}
