import "server-only";
import {query} from "@/lib/server/db";
import {isPlanId,planAllowsModule,planLimits,type PlanId} from "@/config/plan-access";

export async function getOrganizationPlan(organizationId:string):Promise<PlanId>{
  const result=await query<{plan:string}>(`select plan from organizations where id=$1 limit 1`,[organizationId]);
  const plan=result.rows[0]?.plan;
  if(!isPlanId(plan))throw new Response("Organization plan not found",{status:403});
  return plan;
}

export async function requireModuleEntitlement(organizationId:string,moduleKey:string){
  const plan=await getOrganizationPlan(organizationId);
  if(!planAllowsModule(plan,moduleKey))throw new Response("Diese Funktion ist in deinem aktuellen Plan nicht enthalten.",{status:403});
  return plan;
}

export async function requireProjectCapacity(organizationId:string){
  const plan=await getOrganizationPlan(organizationId);
  const count=await query<{count:number}>(`select count(*)::int as count from records where organization_id=$1 and module='projekte'`,[organizationId]);
  if((count.rows[0]?.count??0)>=planLimits[plan].projects)throw new Response("Das Projektlimit deines aktuellen Plans ist erreicht.",{status:409});
  return plan;
}

export async function requireUserCapacity(organizationId:string){
  const plan=await getOrganizationPlan(organizationId);
  const count=await query<{count:number}>(`select count(*)::int as count from users where organization_id=$1 and active=true`,[organizationId]);
  if((count.rows[0]?.count??0)>=planLimits[plan].users)throw new Response("Das Benutzerlimit deines aktuellen Plans ist erreicht.",{status:409});
  return plan;
}
