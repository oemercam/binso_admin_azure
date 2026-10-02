import { json, apiError } from "@/lib/server/http";
import { getIntegrationStatus } from "@/lib/server/integrations";
import { requireUser } from "@/lib/server/auth";

export async function GET(){
  try{
    await requireUser();
    return json({items:getIntegrationStatus()});
  }catch(error){return apiError(error);}
}
