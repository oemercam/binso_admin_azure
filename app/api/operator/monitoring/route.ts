import { apiError, json } from "@/lib/server/http";
import { operatorList } from "@/lib/server/database";

export async function GET(){
  try{
    const incidents=await operatorList<Record<string,unknown>>("platform_incidents","id,service,title,status,started_at,resolved_at,note,created_at","order=started_at.desc&limit=100");
    return json({
      services:[
        {name:"Web App",status:"operational"},
        {name:"API",status:"operational"},
        {name:"Datenbank",status:"operational"},
        {name:"Dateispeicher",status:"not_connected"},
        {name:"Zahlungsabwicklung",status:"not_connected"},
        {name:"E-Mail Service",status:"not_connected"},
      ],
      incidents,
    });
  }catch(error){return apiError(error);}
}
