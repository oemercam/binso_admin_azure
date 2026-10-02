import { json } from "@/lib/server/http";
import { getIntegrationStatus } from "@/lib/server/integrations";

export async function GET(){
  return json({items:getIntegrationStatus()});
}
