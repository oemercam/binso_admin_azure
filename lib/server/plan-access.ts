import "server-only";
import {query,withTenant} from "@/lib/server/db";
import {isPlanId,planAllowsModule,planLimits,type PlanId} from "@/config/plan-access";

function appPlan(value:string):PlanId{
 const mapped=value==="starter"?"start":value==="professional"||value==="enterprise"?"pro":value;
 if(!isPlanId(mapped))throw new Response("Organization plan not found",{status:403});
 return mapped;
}

export async function getOrganizationPlan(organizationId:string):Promise<PlanId>{
 const result=await query<{plan:string}>(`select plan from organization_subscriptions where organization_id=$1 limit 1`,[organizationId]);
 return appPlan(result.rows[0]?.plan||"");
}

export async function requireModuleEntitlement(organizationId:string,moduleKey:string){
 const plan=await getOrganizationPlan(organizationId);
 if(!planAllowsModule(plan,moduleKey))throw new Response("Diese Funktion ist in deinem aktuellen Plan nicht enthalten.",{status:403});
 return plan;
}

export async function requireProjectCapacity(organizationId:string,userId:string){
 const plan=await getOrganizationPlan(organizationId);
 const projectCount=await withTenant(organizationId,userId,async client=>{
  const result=await client.query<{count:number}>(`select count(*)::int as count from projects where organization_id=$1 and archived_at is null`,[organizationId]);
  return Number(result.rows[0]?.count??0);
 });
 if(projectCount>=planLimits[plan].projects)throw new Response("Das Projektlimit deines aktuellen Plans ist erreicht.",{status:409});
 return plan;
}

export async function requireUserCapacity(organizationId:string){
 const plan=await getOrganizationPlan(organizationId);
 const count=await query<{count:number}>(`select count(*)::int as count from organization_memberships where organization_id=$1 and status='active'`,[organizationId]);
 if((count.rows[0]?.count??0)>=planLimits[plan].users)throw new Response("Das Benutzerlimit deines aktuellen Plans ist erreicht.",{status:409});
 return plan;
}
