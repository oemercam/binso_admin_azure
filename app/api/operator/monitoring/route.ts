import { apiError, json } from "@/lib/server/http";
import { operatorList } from "@/lib/server/database";
import { getIntegrationStatus } from "@/lib/server/integrations";

export async function GET(){
  try{
    const incidents=await operatorList<Record<string,unknown>>("platform_incidents","id,service,title,status,started_at,resolved_at,note,created_at","order=started_at.desc&limit=100");
    const integrations=getIntegrationStatus();
    return json({
      services:[
        {name:"Web App",status:"operational",detail:"Next.js Anwendung"},
        {name:"API",status:"operational",detail:"Binso One API"},
        ...integrations.map(item=>({name:item.label,status:item.status,detail:item.detail,key:item.key})),
      ],
      incidents,
    });
  }catch(error){return apiError(error);}
}
