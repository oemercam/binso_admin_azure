import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { operatorAudit, operatorInsert, operatorList } from "@/lib/server/database";
import { requireOperatorSession } from "@/lib/server/operator";

type Body={title?:unknown;body?:unknown;kind?:unknown;audience?:unknown;startsAt?:unknown;endsAt?:unknown;published?:unknown};

export async function GET(){
  try{return json({items:await operatorList("platform_announcements","id,title,body,kind,audience,starts_at,ends_at,published,created_at,updated_at","order=created_at.desc&limit=200")});}
  catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const input=await readJson<Body>(request,32768);
    const title=cleanText(input.title,240),body=cleanText(input.body,5000),kind=cleanText(input.kind,40)||"information",audience=cleanText(input.audience,40)||"all";
    if(!title||!body) return json({error:"required_fields",message:"Titel und Nachricht sind erforderlich."},400);
    if(!["information","maintenance","incident","feature"].includes(kind)||!["all","start","business","pro"].includes(audience)) return json({error:"invalid_announcement",message:"Ungültige Ankündigung."},400);
    const session=await requireOperatorSession();
    const rows=await operatorInsert("platform_announcements",{title,body,kind,audience,starts_at:cleanText(input.startsAt,40)||new Date().toISOString(),ends_at:cleanText(input.endsAt,40)||null,published:input.published===true,created_by:session.user.id});
    await operatorAudit("announcement.created","announcement",rows[0]?.id,{kind,audience,published:input.published===true});
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
