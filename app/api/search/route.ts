import { NextRequest } from "next/server";
import { requireSession } from "@/lib/server/session";
import { tenantCan, permissionForModule } from "@/lib/permissions";
import { apiError, json } from "@/lib/server/http";
import { getOrganizationPlan } from "@/lib/server/plan-access";
import { planAllowsModule } from "@/config/plan-access";
import { withTenant } from "@/lib/server/db";
import { listApiBusiness } from "@/lib/server/repositories/business-api";
import { searchSources, searchItem, type SearchItem } from "@/lib/search";

export const runtime="nodejs";
export async function GET(request:NextRequest) {
  try {
    const session=await requireSession();
    const query=(request.nextUrl.searchParams.get("q")||"").trim().toLocaleLowerCase("de-CH");
    if(query.length<2)return json({items:[]});
    const plan=await getOrganizationPlan(session.organizationId);
    const items=await withTenant(session.organizationId,session.userId,async client=>{
      const results:SearchItem[]=[];
      for(const source of searchSources){
        const permission=permissionForModule(source.module,"read");
        if(!permission||!tenantCan(session.role,permission)||!planAllowsModule(plan,source.module))continue;
        const filters=new URLSearchParams({q:query,limit:String(12-results.length)});
        if("kind" in source)filters.set("kind","eq."+source.kind);
        const rows=await listApiBusiness(client,session,source.table,filters.toString());
        for(const row of rows){
          results.push(searchItem(source,row));
          if(results.length>=12)return results;
        }
      }
      return results;
    });
    return json({items});
  } catch(error){return apiError(error);}
}
